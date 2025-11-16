/**
 * EigenX402 Payment Gateway Service
 * Running in EigenCompute TEE with x402 payment protection
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requirePayment } from './middleware';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Payment configuration
const PAYMENT_CONFIG = {
  price: process.env.PRICE_USDC || '0.05',
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
    amount: PAYMENT_CONFIG.price,
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
      const { prompt, seed } = req.body;

      // Demo: Generate text (replace with your actual AI logic)
      const responses = [
        `Based on your prompt "${prompt}", here is a generated response from the TEE.`,
        `Analyzing "${prompt}"... The answer requires considering multiple factors in a secure environment.`,
        `In response to "${prompt}", the TEE has processed your request securely.`
      ];

      const output = responses[seed % responses.length];

      // Generate cryptographic proof
      const proof = {
        inputHash: hashInput({ prompt, seed }),
        outputHash: hashOutput(output),
        containerImageDigest: process.env.EIGEN_IMAGE_DIGEST || 'sha256:dev',
        producedAt: new Date().toISOString(),
        attestation: process.env.EIGEN_ATTESTATION || null
      };

      res.json({
        output,
        proof,
        txHash: (req as any).txHash // From x402 middleware
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// PAID ENDPOINT - Custom Processing
// ============================================================================

app.post('/api/process-data',
  requirePayment({
    amount: '0.10',
    asset: PAYMENT_CONFIG.usdcAddress,
    network: PAYMENT_CONFIG.network,
    payTo: PAYMENT_CONFIG.merchantWallet,
    merchantPrivateKey: PAYMENT_CONFIG.merchantPrivateKey,
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532
  }),
  async (req, res) => {
    try {
      const { data } = req.body;

      // Your custom processing logic here
      const result = {
        processed: data,
        timestamp: Date.now(),
        teeProof: process.env.EIGEN_IMAGE_DIGEST
      };

      res.json({
        result,
        txHash: (req as any).txHash
      });
    } catch (error: any) {
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

🚀 Server running on port ${PORT} (bound to 0.0.0.0)

📍 Endpoints:
   - GET  /health                (free)
   - POST /api/generate-text     ($${PAYMENT_CONFIG.price} USDC)
   - POST /api/process-data      ($0.10 USDC)

🔐 Payment Configuration:
   - Merchant: ${PAYMENT_CONFIG.merchantWallet}
   - Network: ${PAYMENT_CONFIG.network}
   - Real Settlement: ${PAYMENT_CONFIG.enableRealSettlement ? 'ENABLED' : 'DEMO MODE'}

🔒 TEE Status:
   - Image: ${process.env.EIGEN_IMAGE_DIGEST || 'local-dev'}
   - Mnemonic: ${process.env.MNEMONIC ? 'Available (KMS-generated)' : 'Not configured'}
   - Attestation: ${process.env.EIGEN_ATTESTATION ? 'Available' : 'Not configured'}

💡 Use EigenX402 widgets to integrate with any website!
  `);
});

export default app;
