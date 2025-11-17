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
} from '@mugdha26/eigenx402-types';
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
   * Generic x402 payment flow - works with ANY x402-protected endpoint
   *
   * This is the universal method for making paid requests to ANY API:
   * 1. Makes initial request (expects 402 Payment Required)
   * 2. Signs payment authorization
   * 3. Retries request with X-PAYMENT header
   * 4. Returns the response (whatever your API returns)
   *
   * @param endpoint - API endpoint path (e.g., "/api/generate-image")
   * @param options - Request options (method, body, headers)
   * @returns Response from your API (typed as T)
   */
  async makeX402Request<T = any>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    if (!this.signer) {
      throw new Error('Signer required for payment. Call setSigner() first.');
    }

    const url = `${this.config.serverUrl}${endpoint}`;
    const method = options.method || 'POST';
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Step 1: Initial request (expect 402)
    const initialResponse = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (initialResponse.status !== 402) {
      // If not 402, either it's free or there's an error
      if (initialResponse.ok) {
        return initialResponse.json() as Promise<T>;
      }
      throw new Error(`Request failed: ${initialResponse.statusText}`);
    }

    // Step 2: Parse payment requirements from 402 response
    const paymentResponse = await initialResponse.json() as any;

    if (!paymentResponse.paymentRequired?.accepts?.[0]) {
      throw new Error('Invalid 402 response: missing payment requirements');
    }

    const paymentRequirement = paymentResponse.paymentRequired.accepts[0];
    const signerAddress = await this.signer.getAddress();

    // Step 3: Sign payment authorization
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

    // Step 4: Retry request with payment
    const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

    const paidResponse = await fetch(url, {
      method,
      headers: {
        ...headers,
        'X-PAYMENT': paymentHeader
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!paidResponse.ok) {
      const error = await paidResponse.json() as any;
      throw new Error(`Paid request failed: ${error.error || paidResponse.statusText}`);
    }

    return paidResponse.json() as Promise<T>;
  }

  /**
   * Create a new job and automatically handle payment
   *
   * This is a convenience method for the AI inference use case.
   * For generic x402 requests, use makeX402Request() instead.
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
