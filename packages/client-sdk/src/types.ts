/**
 * Client SDK types
 */

import type { ComputeProof } from '@eigenx402/types';

export interface ClientConfig {
  serverUrl: string;
  signerOrProvider?: any; // ethers Signer or provider
}

export interface CreateJobOptions {
  prompt: string;
  model?: string;
  seed?: number;
}

export interface JobResult {
  jobId: string;
  output: string;
  proof: ComputeProof;
  txHash: string;
}

export interface PaymentAuthorizationParams {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
}
