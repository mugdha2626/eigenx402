/**
 * Job management routes
 *
 * POST /api/jobs/create - Create a new job (returns 402 if unpaid)
 * POST /api/jobs/run - Execute job after payment verification
 * GET /api/jobs/:id - Get job details
 * POST /api/jobs/:id/replay - Verify job output by replaying
 */

import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { requirePayment } from '@eigenx402/server-sdk';
import type { PaymentRequest } from '@eigenx402/server-sdk';
import { config, priceInAtomicUnits, enableRealSettlement } from '../config';
import { db } from '../db';
import { jobs } from '../db/schema';
import { eq } from 'drizzle-orm';
import type {
  JobCreateRequest,
  JobCreateResponse,
  JobRunRequest,
  JobRunResponse,
  JobDetails,
  JobReplayResponse,
  InferenceRequest,
  InferenceResponse
} from '@eigenx402/types';

const router = Router();

/**
 * POST /api/jobs/create
 *
 * Create a new job. Always returns 402 with payment requirements.
 * Client must then pay and call /api/jobs/run with payment header.
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { prompt, model, seed }: JobCreateRequest = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const jobModel = model || 'gpt-oss-120b-f16'; // EigenAI model
    const jobSeed = seed !== undefined ? seed : 42;

    // Generate job ID
    const jobId = randomBytes(16).toString('hex');

    // Create job in database
    await db.insert(jobs).values({
      id: jobId,
      prompt,
      model: jobModel,
      seed: jobSeed,
      status: 'pending_payment',
      createdAt: new Date()
    });

    console.log(`[JOBS] Created job ${jobId}`);

    // Return 402 with payment requirements
    const resource = `${req.protocol}://${req.get('host')}/api/jobs/run`;

    const response: JobCreateResponse = {
      jobId,
      status: 'pending_payment',
      paymentRequired: {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: config.network,
            asset: config.usdcAddress,
            payTo: config.merchantWallet,
            maxAmountRequired: priceInAtomicUnits,
            resource,
            description: `AI inference job: ${jobId}`,
            maxTimeoutSeconds: config.maxTimeoutSeconds
          }
        ]
      }
    };

    res.status(402).json(response);
  } catch (error: any) {
    console.error('[JOBS] Create error:', error);
    res.status(500).json({ error: 'Failed to create job', message: error.message });
  }
});

/**
 * POST /api/jobs/run
 *
 * Execute a job after payment verification.
 * Requires X-PAYMENT header with valid payment authorization.
 * Calls EigenCompute for deterministic inference.
 */
router.post(
  '/run',
  requirePayment({
    amount: priceInAtomicUnits,
    asset: config.usdcAddress,
    network: config.network,
    payTo: config.merchantWallet,
    rpcUrl: config.baseRpcUrl,
    chainId: config.chainId,
    description: 'AI inference with verifiable compute',
    merchantPrivateKey: config.merchantPrivateKey,
    enableRealSettlement: enableRealSettlement
  }),
  async (req: Request, res: Response) => {
    try {
      const { jobId }: JobRunRequest = req.body;
      const paymentReq = req as PaymentRequest;
      const txHash = paymentReq.txHash || 'simulated-tx';

      if (!jobId) {
        return res.status(400).json({ error: 'jobId required' });
      }

      // Get job from database
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.status === 'completed') {
        return res.status(400).json({ error: 'Job already completed' });
      }

      console.log(`[JOBS] Running job ${jobId} after payment verification`);

      // Call EigenCompute for inference
      const inferenceRequest: InferenceRequest = {
        prompt: job.prompt,
        model: job.model,
        seed: job.seed
      };

      const computeResponse = await fetch(`${config.computeAppUrl}/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inferenceRequest)
      });

      if (!computeResponse.ok) {
        throw new Error(`Compute app error: ${computeResponse.statusText}`);
      }

      const inferenceResult = await computeResponse.json() as InferenceResponse;

      // Update job with results
      await db
        .update(jobs)
        .set({
          txHash,
          imageDigest: inferenceResult.proof.containerImageDigest,
          proofJson: JSON.stringify(inferenceResult.proof),
          status: 'completed'
        })
        .where(eq(jobs.id, jobId));

      console.log(`[JOBS] Job ${jobId} completed`);

      const response: JobRunResponse = {
        jobId,
        output: inferenceResult.output,
        proof: inferenceResult.proof,
        txHash,
        status: 'completed'
      };

      res.json(response);
    } catch (error: any) {
      console.error('[JOBS] Run error:', error);
      res.status(500).json({ error: 'Failed to run job', message: error.message });
    }
  }
);

/**
 * GET /api/jobs/:id
 *
 * Get job details and proof
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const response: JobDetails = {
      id: job.id,
      prompt: job.prompt,
      model: job.model,
      seed: job.seed,
      txHash: job.txHash,
      imageDigest: job.imageDigest,
      proof: job.proofJson ? JSON.parse(job.proofJson) : null,
      createdAt: job.createdAt.toISOString(),
      status: job.status
    };

    res.json(response);
  } catch (error: any) {
    console.error('[JOBS] Get error:', error);
    res.status(500).json({ error: 'Failed to get job', message: error.message });
  }
});

/**
 * POST /api/jobs/:id/replay
 *
 * Replay verification: re-run deterministic function with same inputs
 * and verify output hash matches the original proof.
 */
router.post('/:id/replay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.proofJson) {
      return res.status(400).json({ error: 'Job has no proof to verify' });
    }

    const originalProof = JSON.parse(job.proofJson);

    console.log(`[JOBS] Replaying job ${id} for verification`);

    // Call compute app to regenerate output
    const inferenceRequest: InferenceRequest = {
      prompt: job.prompt,
      model: job.model,
      seed: job.seed
    };

    const computeResponse = await fetch(`${config.computeAppUrl}/infer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inferenceRequest)
    });

    if (!computeResponse.ok) {
      throw new Error(`Compute app error: ${computeResponse.statusText}`);
    }

    const inferenceResult = await computeResponse.json() as InferenceResponse;

    // Compare output hashes
    const verified = inferenceResult.proof.outputHash === originalProof.outputHash;

    console.log(`[JOBS] Replay verification: ${verified ? 'PASSED' : 'FAILED'}`);

    const response: JobReplayResponse = {
      jobId: id,
      verified,
      originalOutputHash: originalProof.outputHash,
      recomputedOutputHash: inferenceResult.proof.outputHash,
      message: verified
        ? 'Output verified - deterministic computation confirmed'
        : 'Output mismatch - verification failed'
    };

    res.json(response);
  } catch (error: any) {
    console.error('[JOBS] Replay error:', error);
    res.status(500).json({ error: 'Failed to replay job', message: error.message });
  }
});

export default router;
