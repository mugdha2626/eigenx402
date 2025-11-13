/**
 * Server configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import type { ServerConfig } from '@eigenx402/types';

// Load .env from root directory (two levels up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config: ServerConfig = {
  port: parseInt(process.env.SERVER_PORT || '3001', 10),
  host: process.env.SERVER_HOST || 'localhost',
  baseRpcUrl: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
  network: process.env.NETWORK || 'base-sepolia',
  chainId: parseInt(process.env.CHAIN_ID || '84532', 10),
  usdcAddress: process.env.USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  merchantWallet: process.env.MERCHANT_WALLET || '',
  merchantPrivateKey: process.env.MERCHANT_PRIVATE_KEY || '',
  priceUsdc: process.env.PRICE_USDC || '0.05',
  maxTimeoutSeconds: parseInt(process.env.MAX_TIMEOUT_SECONDS || '3600', 10),
  computeAppUrl: process.env.COMPUTE_APP_URL || 'http://localhost:8080',
  eigenImageDigest: process.env.EIGEN_IMAGE_DIGEST || 'sha256:local-dev',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  facilitatorUrl: process.env.FACILITATOR_URL
};

// Real settlement flag
export const enableRealSettlement = process.env.ENABLE_REAL_SETTLEMENT === 'true';

// Validate required config
if (!config.merchantWallet) {
  console.warn('[CONFIG] Warning: MERCHANT_WALLET not set');
}

// Log settlement mode
if (enableRealSettlement) {
  console.log('[CONFIG] Real USDC settlement ENABLED - transactions will be executed on-chain');
  console.log('[CONFIG] Merchant wallet:', config.merchantWallet);
} else {
  console.log('[CONFIG] Demo mode - using simulated transactions');
}

// Convert USDC price to atomic units (6 decimals)
export const priceInAtomicUnits = (parseFloat(config.priceUsdc) * 1_000_000).toString();
