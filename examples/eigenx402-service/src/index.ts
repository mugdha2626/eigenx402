/**
 * EigenX402 Payment Gateway Service
 * Running in EigenCompute TEE with x402 payment protection
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requirePayment } from './middleware';
import { callEigenAI } from './inference';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Convert USDC dollars to atomic units (6 decimals)
function toUSDCAtomicUnits(dollars: string | number): string {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.floor(amount * 1_000_000).toString();
}

// Payment configuration
const PAYMENT_CONFIG = {
  priceUSD: process.env.PRICE_USDC || '0.05',
  priceAtomic: toUSDCAtomicUnits(process.env.PRICE_USDC || '0.05'),
  merchantWallet: process.env.MERCHANT_WALLET!,
  merchantPrivateKey: process.env.MERCHANT_PRIVATE_KEY,
  usdcAddress: process.env.USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  network: process.env.NETWORK || 'base-sepolia',
  enableRealSettlement: process.env.ENABLE_REAL_SETTLEMENT === 'true'
};

// ============================================================================
// FREE ENDPOINT - Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'EigenX402 Payment Gateway',
    timestamp: new Date().toISOString(),
    tee: {
      imageDigest: process.env.EIGEN_IMAGE_DIGEST || 'local-dev',
      attestationAvailable: !!process.env.EIGEN_ATTESTATION,
      mnemonicAvailable: !!process.env.MNEMONIC
    }
  });
});

// ============================================================================
// PAID ENDPOINT - AI Text Generation
// ============================================================================

app.post('/api/generate-text',
  requirePayment({
    amount: PAYMENT_CONFIG.priceAtomic,
    asset: PAYMENT_CONFIG.usdcAddress,
    network: PAYMENT_CONFIG.network,
    payTo: PAYMENT_CONFIG.merchantWallet,
    merchantPrivateKey: PAYMENT_CONFIG.merchantPrivateKey,
    enableRealSettlement: PAYMENT_CONFIG.enableRealSettlement,
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532
  }),
  async (req, res) => {
    try {
      const { prompt, model, seed } = req.body;

      // Validate inputs
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Invalid prompt' });
      }

      const jobModel = model || process.env.MODEL_ID || 'gpt-oss-120b-f16';
      const jobSeed = seed !== undefined ? seed : parseInt(process.env.DEFAULT_SEED || '42');

      console.log(`[TEE] Processing request: model=${jobModel}, seed=${jobSeed}`);

      // Call EigenAI API
      const eigenaiKey = process.env.EIGENAI_API_KEY;
      if (!eigenaiKey) {
        throw new Error('EIGENAI_API_KEY not configured');
      }

      const output = await callEigenAI(prompt, jobModel, jobSeed, eigenaiKey);

      // Generate cryptographic proof
      const proof = {
        modelHash: hashInput(jobModel), // Hash of the model identifier
        inputHash: hashInput({ prompt, model: jobModel, seed: jobSeed }),
        outputHash: hashOutput(output),
        containerImageDigest: process.env.EIGEN_IMAGE_DIGEST || 'sha256:local-dev',
        producedAt: new Date().toISOString(),
        attestation: process.env.EIGEN_ATTESTATION || null
      };

      console.log(`[TEE] Request completed successfully`);

      // Return response compatible with client SDK JobResult type
      res.json({
        jobId: 'tee-' + Date.now(), // Generate a simple ID for tracking
        output,
        proof,
        txHash: (req as any).txHash || 'simulated-tx',
        status: 'completed'
      });
    } catch (error: any) {
      console.error('[TEE] Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

function hashInput(input: any): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

function hashOutput(output: any): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(output)).digest('hex');
}

// ============================================================================
// Start Server
// ============================================================================

// Bind to 0.0.0.0 (required for EigenCompute)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  EigenX402 Payment Gateway (TEE)                             ║
╚══════════════════════════════════════════════════════════════╝

Server running on port ${PORT} (bound to 0.0.0.0)

Endpoints:
   - GET  /health                (free)
   - POST /api/generate-text     ($${PAYMENT_CONFIG.priceUSD} USDC)

Payment Configuration:
   - Merchant: ${PAYMENT_CONFIG.merchantWallet}
   - Network: ${PAYMENT_CONFIG.network}
   - Real Settlement: ${PAYMENT_CONFIG.enableRealSettlement ? 'ENABLED' : 'DEMO MODE'}

TEE Status:
   - Image: ${process.env.EIGEN_IMAGE_DIGEST || 'local-dev'}
   - Mnemonic: ${process.env.MNEMONIC ? 'Available (KMS-generated)' : 'Not configured'}
   - Attestation: ${process.env.EIGEN_ATTESTATION ? 'Available' : 'Not configured'}
  `);
});

export default app;
