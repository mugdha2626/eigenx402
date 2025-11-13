/**
 * EigenCompute Deterministic Inference Service
 *
 * This containerized service runs inside EigenCompute TEEs and provides
 * deterministic, reproducible AI inference with cryptographic proofs.
 */

import express, { Request, Response } from 'express';
import { config } from './config';
import { generateDeterministicOutput } from './inference';
import { computeHashes, createProof } from './proof';
import type { InferenceRequest, InferenceResponse } from '@eigenx402/types';

const app = express();
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'eigenx402-compute',
    imageDigest: config.eigenImageDigest,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /infer
 *
 * Deterministic inference endpoint. Given a prompt, model, and seed,
 * produces a reproducible output with cryptographic proof.
 *
 * Request body:
 *   - prompt: string (input text)
 *   - model: string (model identifier)
 *   - seed: number (deterministic seed)
 *
 * Response:
 *   - output: string (generated text)
 *   - proof: ComputeProof (hashes, metadata, attestation)
 */
app.post('/infer', async (req: Request, res: Response) => {
  try {
    const { prompt, model, seed }: InferenceRequest = req.body;

    // Validate inputs
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ error: 'Invalid model' });
    }
    if (seed === undefined || typeof seed !== 'number') {
      return res.status(400).json({ error: 'Invalid seed' });
    }

    console.log('[COMPUTE] Inference request:', { prompt: prompt.substring(0, 50), model, seed });

    // Generate deterministic output (async now supports API calls)
    const output = await generateDeterministicOutput(prompt, model, seed);

    // Compute cryptographic hashes
    const hashes = computeHashes({ prompt, model, seed }, output);

    // Create proof with metadata
    const proof = createProof(hashes, config.eigenImageDigest);

    console.log('[COMPUTE] Inference complete:', {
      outputLength: output.length,
      outputHash: hashes.outputHash.substring(0, 16) + '...'
    });

    const response: InferenceResponse = {
      output,
      proof
    };

    res.json(response);
  } catch (error: any) {
    console.error('[COMPUTE] Inference error:', error);
    res.status(500).json({
      error: 'Inference failed',
      message: error.message
    });
  }
});

/**
 * POST /verify
 *
 * Verify that a given input produces the expected output hash.
 * Used for replay verification.
 */
app.post('/verify', async (req: Request, res: Response) => {
  try {
    const { prompt, model, seed, expectedOutputHash } = req.body;

    if (!expectedOutputHash) {
      return res.status(400).json({ error: 'expectedOutputHash required' });
    }

    // Regenerate output (async now)
    const output = await generateDeterministicOutput(prompt, model, seed);
    const hashes = computeHashes({ prompt, model, seed }, output);

    const verified = hashes.outputHash === expectedOutputHash;

    res.json({
      verified,
      outputHash: hashes.outputHash,
      expectedOutputHash
    });
  } catch (error: any) {
    console.error('[COMPUTE] Verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
});

const port = config.port;
app.listen(port, () => {
  console.log(`[COMPUTE] Service running on port ${port}`);
  console.log(`[COMPUTE] Image digest: ${config.eigenImageDigest}`);
  console.log(`[COMPUTE] Model: ${config.modelId}`);
});
