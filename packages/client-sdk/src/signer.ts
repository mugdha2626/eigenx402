/**
 * EIP-3009 Payment Authorization Signing
 *
 * Creates signed payment authorizations for USDC transferWithAuthorization
 */

import { ethers } from 'ethers';
import type { X402PaymentPayload } from '@mugdha26/eigenx402-types';

// Note: Base Sepolia USDC uses domain name "USDC" (not "USD Coin" like mainnet)
const EIP3009_DOMAIN_NAME = 'USDC';
const EIP3009_VERSION = '2';

const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' }
  ]
};

export interface PaymentAuthOptions {
  from: string;
  to: string;
  value: string;
  network: string;
  asset: string; // USDC contract address
  validAfter?: number;
  validBefore?: number;
}

/**
 * Sign an EIP-3009 transferWithAuthorization payment
 *
 * @param signer - ethers Signer (wallet)
 * @param options - Payment parameters
 * @returns X402PaymentPayload with signature
 */
export async function signPaymentAuthorization(
  signer: ethers.Signer,
  options: PaymentAuthOptions
): Promise<X402PaymentPayload> {
  // Generate random nonce
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  // Set validity window (default: valid now for 1 hour)
  const now = Math.floor(Date.now() / 1000);
  const validAfter = options.validAfter || now - 60; // 1 minute ago
  const validBefore = options.validBefore || now + 3600; // 1 hour from now

  // Get chain ID for domain
  const provider = signer.provider;
  if (!provider) {
    throw new Error('Signer must have a provider');
  }
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  // Create EIP-712 domain
  // IMPORTANT: USDC contract expects lowercase addresses for signature verification
  const domain = {
    name: EIP3009_DOMAIN_NAME,
    version: EIP3009_VERSION,
    chainId,
    verifyingContract: options.asset.toLowerCase()
  };

  // Create message
  // IMPORTANT: USDC contract expects lowercase addresses for signature verification
  const message = {
    from: options.from.toLowerCase(),
    to: options.to.toLowerCase(),
    value: options.value,
    validAfter,
    validBefore,
    nonce
  };

  // Sign typed data
  const signature = await signer.signTypedData(
    domain,
    TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
    message
  );

  // Split signature into v, r, s
  const { v, r, s } = ethers.Signature.from(signature);

  // Create x402 payment payload (use checksummed addresses)
  const payload: X402PaymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: options.network,
    payload: {
      from: message.from, // Already checksummed
      to: message.to, // Already checksummed
      value: options.value,
      validAfter,
      validBefore,
      nonce,
      v,
      r,
      s
    }
  };

  return payload;
}

/**
 * Generate a random nonce for EIP-3009
 */
export function generateNonce(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}
