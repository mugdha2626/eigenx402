/**
 * Generic TEE Service Template with x402 Payment Protection
 *
 * This template shows how to build ANY service that:
 * 1. Runs inside EigenCompute TEE (Trusted Execution Environment)
 * 2. Accepts x402 crypto payments
 * 3. Returns verifiable results with cryptographic proofs
 *
 * Use cases:
 * - AI inference
 * - Image/video processing
 * - Data transformations
 * - API gateways
 * - Confidential computing
 * - Anything you want!
 */

import express from 'express';
import cors from 'cors';
import { requirePayment } from '@eigenx402/server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Payment configuration
const PAYMENT_CONFIG = {
  price: process.env.PRICE_USDC || '0.05', // Price in USDC
  merchantWallet: process.env.MERCHANT_WALLET!,
  merchantPrivateKey: process.env.MERCHANT_PRIVATE_KEY,
  usdcAddress: process.env.USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  network: process.env.NETWORK || 'base-sepolia',
  enableRealSettlement: process.env.ENABLE_REAL_SETTLEMENT === 'true'
};

// ============================================================================
// EXAMPLE 1: AI Text Generation (with proof)
// ============================================================================

app.post('/api/generate-text',
  requirePayment({
    price: PAYMENT_CONFIG.price,
    merchantWallet: PAYMENT_CONFIG.merchantWallet,
    merchantPrivateKey: PAYMENT_CONFIG.merchantPrivateKey,
    usdcAddress: PAYMENT_CONFIG.usdcAddress,
    network: PAYMENT_CONFIG.network as any,
    enableRealSettlement: PAYMENT_CONFIG.enableRealSettlement
  }),
  async (req, res) => {
    try {
      const { prompt, seed } = req.body;

      // Your AI generation logic here
      const output = await generateText(prompt, seed);

      // Generate cryptographic proof
      const proof = {
        inputHash: hashInput({ prompt, seed }),
        outputHash: hashOutput(output),
        containerImageDigest: process.env.EIGEN_IMAGE_DIGEST || 'sha256:dev',
        producedAt: new Date().toISOString(),
        attestation: await getTeeattestation() // TEE hardware attestation
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
// EXAMPLE 2: Image Processing API
// ============================================================================

app.post('/api/process-image',
  requirePayment({
    price: '0.10', // Different price for this endpoint
    merchantWallet: PAYMENT_CONFIG.merchantWallet,
    merchantPrivateKey: PAYMENT_CONFIG.merchantPrivateKey,
    usdcAddress: PAYMENT_CONFIG.usdcAddress,
    network: PAYMENT_CONFIG.network as any
  }),
  async (req, res) => {
    try {
      const { imageUrl, filters } = req.body;

      // Your image processing logic here
      const processedImage = await processImage(imageUrl, filters);

      res.json({
        result: processedImage,
        txHash: (req as any).txHash
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// EXAMPLE 3: Data Transformation API
// ============================================================================

app.post('/api/transform-data',
  requirePayment({
    price: '0.02',
    merchantWallet: PAYMENT_CONFIG.merchantWallet,
    merchantPrivateKey: PAYMENT_CONFIG.merchantPrivateKey,
    usdcAddress: PAYMENT_CONFIG.usdcAddress,
    network: PAYMENT_CONFIG.network as any
  }),
  async (req, res) => {
    try {
      const { data, transformation } = req.body;

      // Your data transformation logic here
      const transformedData = await transformData(data, transformation);

      res.json({
        data: transformedData,
        metadata: {
          transformationType: transformation,
          processedAt: new Date().toISOString()
        },
        txHash: (req as any).txHash
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// EXAMPLE 4: Generic Endpoint (no payment) - Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TEE Service Template',
    timestamp: new Date().toISOString(),
    tee: {
      imageDigest: process.env.EIGEN_IMAGE_DIGEST || 'dev',
      attestationAvailable: !!process.env.EIGEN_ATTESTATION
    }
  });
});

// ============================================================================
// Helper Functions - Replace with your actual logic!
// ============================================================================

async function generateText(prompt: string, seed: number): Promise<string> {
  // TODO: Replace with your actual AI inference
  // Options:
  // - Call EigenAI API
  // - Call OpenAI/Anthropic
  // - Run local model with transformers.js
  // - Use your own inference engine

  // Demo implementation:
  const responses = [
    `Based on your prompt "${prompt}", here is a generated response.`,
    `Analyzing "${prompt}"... The answer requires considering multiple factors.`,
    `In response to "${prompt}", we can observe that...`
  ];

  return responses[seed % responses.length];
}

async function processImage(imageUrl: string, filters: any): Promise<string> {
  // TODO: Replace with your actual image processing
  // Options:
  // - Use sharp, jimp, or other image libraries
  // - Call external image processing APIs
  // - Run ML models (object detection, style transfer, etc.)

  return `Processed image from ${imageUrl} with filters ${JSON.stringify(filters)}`;
}

async function transformData(data: any, transformation: string): Promise<any> {
  // TODO: Replace with your actual data transformation logic
  // Examples:
  // - Format conversion (JSON to CSV, XML to JSON, etc.)
  // - Data validation and cleaning
  // - Aggregation and analytics
  // - Encryption/decryption

  return {
    original: data,
    transformed: `Applied ${transformation} transformation`,
    timestamp: Date.now()
  };
}

function hashInput(input: any): string {
  // TODO: Implement SHA-256 hashing
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

function hashOutput(output: any): string {
  // TODO: Implement SHA-256 hashing
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(output)).digest('hex');
}

async function getTeeattestation(): Promise<any> {
  // TODO: Integrate with EigenCompute TEE attestation API
  // When running in EigenCompute, this should return:
  // - SGX quote
  // - Container measurement
  // - Hardware attestation

  if (process.env.EIGEN_ATTESTATION) {
    try {
      // Call EigenCompute attestation API
      // const response = await fetch(process.env.EIGEN_ATTESTATION_URL);
      // return response.json();
      return null; // Placeholder
    } catch (error) {
      console.error('Failed to get TEE attestation:', error);
      return null;
    }
  }

  return null; // Not running in TEE or attestation not configured
}

// ============================================================================
// Start Server
// ============================================================================

// Bind to 0.0.0.0 (required for EigenCompute) instead of localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  TEE Service with x402 Payment Protection                    ║
╚══════════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT} (bound to 0.0.0.0)

📍 Endpoints:
   - POST /api/generate-text    ($${PAYMENT_CONFIG.price} USDC)
   - POST /api/process-image    ($0.10 USDC)
   - POST /api/transform-data   ($0.02 USDC)
   - GET  /health               (free)

🔐 Payment Configuration:
   - Merchant: ${PAYMENT_CONFIG.merchantWallet}
   - Network: ${PAYMENT_CONFIG.network}
   - Real Settlement: ${PAYMENT_CONFIG.enableRealSettlement ? 'ENABLED' : 'DEMO MODE'}

🔒 TEE Status:
   - Image: ${process.env.EIGEN_IMAGE_DIGEST || 'local-dev'}
   - Attestation: ${process.env.EIGEN_ATTESTATION ? 'Available' : 'Not configured'}
   - Mnemonic: ${process.env.MNEMONIC ? 'Available (KMS-generated)' : 'Not configured'}

💡 Tip: Use the EigenX402 widgets to integrate with any website!
  `);
});

export default app;
