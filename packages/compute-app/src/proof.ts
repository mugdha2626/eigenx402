/**
 * Cryptographic proof generation
 *
 * Computes SHA-256 hashes for model, input, and output to create
 * verifiable proofs of deterministic computation.
 */

import { createHash } from 'crypto';
import type { ComputeProof, InferenceRequest } from '@eigenx402/types';

export interface ComputedHashes {
  modelHash: string;
  inputHash: string;
  outputHash: string;
}

/**
 * Compute cryptographic hashes for inference inputs and outputs
 *
 * @param input - Inference request with prompt, model, and seed
 * @param output - Generated output text
 * @returns Object containing modelHash, inputHash, and outputHash
 */
export function computeHashes(
  input: InferenceRequest,
  output: string
): ComputedHashes {
  // Hash the model identifier
  const modelHash = sha256(input.model);

  // Hash the complete input (prompt + seed + model)
  // This creates a unique fingerprint for the computation inputs
  const inputData = JSON.stringify({
    prompt: input.prompt,
    seed: input.seed,
    model: input.model
  });
  const inputHash = sha256(inputData);

  // Hash the output
  const outputHash = sha256(output);

  return {
    modelHash,
    inputHash,
    outputHash
  };
}

/**
 * Create a complete proof object with hashes and metadata
 *
 * @param hashes - Computed cryptographic hashes
 * @param containerImageDigest - Docker image digest from environment
 * @returns Complete ComputeProof object
 */
export function createProof(
  hashes: ComputedHashes,
  containerImageDigest: string
): ComputeProof {
  return {
    modelHash: hashes.modelHash,
    inputHash: hashes.inputHash,
    outputHash: hashes.outputHash,
    containerImageDigest,
    producedAt: new Date().toISOString(),
    // Attestation will be populated by EigenCompute runtime in production
    // For now, keep as null and document how to integrate real TEE quotes
    attestation: getAttestationBlob()
  };
}

/**
 * SHA-256 hash function
 */
function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Get TEE attestation blob if available
 *
 * In production EigenCompute environment, this would:
 * 1. Read attestation from runtime environment variable
 * 2. Call TEE API to get attestation quote
 * 3. Include enclave measurements and signatures
 *
 * For development, returns null.
 *
 * TODO: Integrate with EigenCompute runtime to get real attestation:
 *   - Check for EIGEN_ATTESTATION env var
 *   - Call local attestation API if available
 *   - Include SGX/SEV-SNP quote data
 */
function getAttestationBlob(): string | null {
  // Check if running in EigenCompute with attestation support
  const attestation = process.env.EIGEN_ATTESTATION;
  if (attestation) {
    return attestation;
  }

  // Development mode - no real attestation
  return null;
}

/**
 * Verify that recomputed output matches expected hash
 *
 * @param output - Output text to verify
 * @param expectedHash - Expected SHA-256 hash
 * @returns True if hashes match
 */
export function verifyOutputHash(output: string, expectedHash: string): boolean {
  const computedHash = sha256(output);
  return computedHash === expectedHash;
}
