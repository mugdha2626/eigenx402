/**
 * eigenx402-payperproof Server
 *
 * Express API with x402 payment gating and EigenCompute integration
 */

import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './db';
import jobsRouter from './routes/jobs';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'eigenx402-server',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/jobs', jobsRouter);

// Initialize database
initDatabase();

// Start server
const port = config.port;
const host = config.host;

app.listen(port, host, () => {
  console.log(`[SERVER] Running on http://${host}:${port}`);
  console.log(`[SERVER] Network: ${config.network}`);
  console.log(`[SERVER] Merchant: ${config.merchantWallet}`);
  console.log(`[SERVER] Compute: ${config.computeAppUrl}`);
});

export default app;
