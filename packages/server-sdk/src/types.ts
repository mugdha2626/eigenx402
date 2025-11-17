/**
 * Server SDK types
 */

import type { Request } from 'express';
import type { X402PaymentPayload } from '@mugdha26/eigenx402-types';

export interface PaymentMiddlewareOptions {
  amount: string; // Amount in USDC atomic units (e.g., "50000" for $0.05)
  asset: string; // USDC contract address
  network: string; // Network identifier (e.g., 'base-sepolia')
  payTo: string; // Merchant wallet address
  description?: string; // Optional description of the service
  maxTimeoutSeconds?: number; // Payment validity timeout (default: 3600)
  rpcUrl: string; // RPC endpoint for verification
  chainId: number; // Chain ID for network
  merchantPrivateKey?: string; // Optional: merchant private key for real settlement
  enableRealSettlement?: boolean; // Optional: enable on-chain settlement
}

export interface PaymentRequest extends Request {
  payment?: X402PaymentPayload;
  paymentVerified?: boolean;
  txHash?: string;
}
