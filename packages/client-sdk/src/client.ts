/**
 * EigenX402 Client
 *
 * Handles the complete x402 payment flow:
 * 1. Create job (receive 402)
 * 2. Sign payment authorization (EIP-3009)
 * 3. Submit payment and execute job
 */

import { ethers } from 'ethers';
import type {
  JobCreateResponse,
  JobRunResponse,
  JobDetails,
  JobReplayResponse,
  X402PaymentPayload
} from '@eigenx402/types';
import type { ClientConfig, CreateJobOptions, JobResult } from './types';
import { signPaymentAuthorization } from './signer';

export class EigenX402Client {
  private config: ClientConfig;
  private signer?: ethers.Signer;

  constructor(config: ClientConfig) {
    this.config = config;
    if (config.signerOrProvider) {
      this.signer = config.signerOrProvider;
    }
  }

  /**
   * Set the signer for payment authorization
   */
  setSigner(signer: ethers.Signer) {
    this.signer = signer;
  }

  /**
   * Create a new job and automatically handle payment
   *
   * This is the main entry point for users. It:
   * 1. Creates a job (gets 402 response)
   * 2. Signs payment authorization
   * 3. Submits payment and runs the job
   * 4. Returns the result with proof
   *
   * @param options - Job creation options (prompt, model, seed)
   * @returns Job result with output and proof
   */
  async createAndPayJob(options: CreateJobOptions): Promise<JobResult> {
    if (!this.signer) {
      throw new Error('Signer required for payment. Call setSigner() first.');
    }

    // Step 1: Create job (will return 402)
    const createResponse = await this.createJob(options);

    // Step 2: Sign payment authorization
    const paymentRequirement = createResponse.paymentRequired.accepts[0];
    const signerAddress = await this.signer.getAddress();

    const paymentPayload = await signPaymentAuthorization(
      this.signer,
      {
        from: signerAddress,
        to: paymentRequirement.payTo,
        value: paymentRequirement.maxAmountRequired,
        network: paymentRequirement.network,
        asset: paymentRequirement.asset
      }
    );

    // Step 3: Submit payment and run job
    const runResult = await this.runJob(createResponse.jobId, paymentPayload);

    return {
      jobId: runResult.jobId,
      output: runResult.output,
      proof: runResult.proof,
      txHash: runResult.txHash
    };
  }

  /**
   * Create a job (internal - returns 402)
   */
  private async createJob(options: CreateJobOptions): Promise<JobCreateResponse> {
    const response = await fetch(`${this.config.serverUrl}/api/jobs/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (response.status !== 402) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    return response.json() as Promise<JobCreateResponse>;
  }

  /**
   * Run a job with payment authorization
   */
  private async runJob(
    jobId: string,
    paymentPayload: X402PaymentPayload
  ): Promise<JobRunResponse> {
    // Encode payment as base64 for X-PAYMENT header
    const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

    const response = await fetch(`${this.config.serverUrl}/api/jobs/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PAYMENT': paymentHeader
      },
      body: JSON.stringify({ jobId })
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(`Job execution failed: ${error.error || response.statusText}`);
    }

    return response.json() as Promise<JobRunResponse>;
  }

  /**
   * Get job details by ID
   */
  async getJob(jobId: string): Promise<JobDetails> {
    const response = await fetch(`${this.config.serverUrl}/api/jobs/${jobId}`);

    if (!response.ok) {
      throw new Error(`Failed to get job: ${response.statusText}`);
    }

    return response.json() as Promise<JobDetails>;
  }

  /**
   * Replay and verify a job
   *
   * Re-runs the deterministic computation and verifies the output hash
   * matches the original proof.
   */
  async verifyJob(jobId: string): Promise<JobReplayResponse> {
    const response = await fetch(`${this.config.serverUrl}/api/jobs/${jobId}/replay`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to verify job: ${response.statusText}`);
    }

    return response.json() as Promise<JobReplayResponse>;
  }
}
