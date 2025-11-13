/**
 * Configuration for the compute app
 */

import dotenv from 'dotenv';
import path from 'path';
import type { ComputeAppConfig } from '@eigenx402/types';

// Load .env from root directory (three levels up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config: ComputeAppConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  modelId: process.env.MODEL_ID || 'gpt-oss-120b-f16', // EigenAI default model
  defaultSeed: parseInt(process.env.DEFAULT_SEED || '42', 10),
  eigenImageDigest: process.env.EIGEN_IMAGE_DIGEST || 'sha256:local-dev',
  openaiApiKey: process.env.OPENAI_API_KEY,
  eigenaiApiKey: process.env.EIGENAI_API_KEY
};
