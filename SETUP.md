# 🚀 EigenX402 Payment Gateway - Setup Guide

Complete guide to building and deploying your payment gateway with x402 + EigenCompute.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Building the Widget](#building-the-widget)
4. [Deploy EigenCompute](#deploy-eigencompute)
5. [Deploy API Server](#deploy-api-server)
6. [Integrate Widget](#integrate-widget)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

- **Node.js** 18+ and npm 9+
- **Docker** (for EigenCompute container)
- **MetaMask** or Web3 wallet
- **Git**

### Required Accounts

1. **Base Sepolia Testnet**
   - Get ETH: https://faucet.quicknode.com/base/sepolia
   - Get USDC: https://faucet.circle.com/

2. **EigenCompute Account** (optional, for TEE deployment)
   - Sign up: https://eigencloud.xyz
   - Install CLI: `npm install -g @eigenlayer/cli`

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone repo
git clone https://github.com/yourusername/eigenx402.git
cd eigenx402

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Network Configuration
BASE_RPC_URL=https://sepolia.base.org
NETWORK=base-sepolia
CHAIN_ID=84532

# USDC Token (Base Sepolia)
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Your Merchant Wallet (where payments go)
MERCHANT_WALLET=0xYourWalletAddress
MERCHANT_PRIVATE_KEY=0xYourPrivateKey

# Payment Settings
PRICE_USDC=0.05
ENABLE_REAL_SETTLEMENT=false  # true for production

# EigenCompute (local dev)
COMPUTE_APP_URL=http://localhost:8080
EIGEN_IMAGE_DIGEST=sha256:local-dev
```

### 3. Build All Packages

```bash
npm run build:all
```

This builds:
- `packages/types` - Shared TypeScript types
- `packages/client-sdk` - Client library
- `packages/server-sdk` - Server middleware
- `packages/server` - API server
- `packages/compute-app` - Compute container
- `packages/widget` - Payment widgets
- `packages/widget-react` - React components

---

## Building the Widget

### Build Widget Files

```bash
cd packages/widget
npm run build
```

This creates:
- `dist/widget.js` - Main payment widget
- `dist/button-widget.js` - Button widget

### Test Widget Locally

```bash
# Start compute app
cd packages/compute-app
npm run dev  # Port 8080

# Start API server (new terminal)
cd packages/server
npm run dev  # Port 3001

# Open example
cd examples/vanilla-html
open index.html
```

---

## Deploy EigenCompute

### Option A: Local Development

Use local Docker container for testing:

```bash
cd packages/compute-app

# Build Docker image
docker build -t eigenx402-compute:latest .

# Run container
docker run -p 8080:8080 eigenx402-compute:latest
```

Set in `.env`:
```env
COMPUTE_APP_URL=http://localhost:8080
```

### Option B: Deploy to EigenCompute (Production)

Deploy to TEE infrastructure for cryptographic attestation:

```bash
# Install CLI
npm install -g @eigenlayer/cli

# Authenticate
eigenx auth login

# Deploy
cd apps/scripts
chmod +x deploy-eigencompute.sh
./deploy-eigencompute.sh
```

After deployment, update `.env`:
```env
COMPUTE_APP_URL=https://your-app-abc123.eigencloud.xyz
EIGEN_IMAGE_DIGEST=sha256:abc123def456...
```

Verify deployment:
```bash
curl https://your-app-abc123.eigencloud.xyz/health
```

---

## Deploy API Server

### Option A: Local Development

```bash
cd packages/server
npm run dev  # Port 3001
```

### Option B: Deploy to Cloud

#### Deploy to Railway.app

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Deploy:
```bash
cd packages/server
railway up
```

3. Set environment variables in Railway dashboard

#### Deploy to Fly.io

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Deploy:
```bash
cd packages/server
fly launch
fly secrets set MERCHANT_WALLET=0x... MERCHANT_PRIVATE_KEY=0x...
```

#### Deploy to Heroku

```bash
cd packages/server
heroku create eigenx402-api
git push heroku main
heroku config:set MERCHANT_WALLET=0x... MERCHANT_PRIVATE_KEY=0x...
```

---

## Integrate Widget

### Vanilla HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Payment widget -->
  <eigenx402-widget
    api-url="https://api.yourservice.com"
    price="0.05"
    title="Premium Feature">
  </eigenx402-widget>

  <!-- Load widget -->
  <script src="https://cdn.yoursite.com/widget.js"></script>
</body>
</html>
```

### React

```bash
npm install @eigenx402/widget-react
```

```tsx
import { EigenPayWidget } from '@eigenx402/widget-react';

function App() {
  return (
    <EigenPayWidget
      apiUrl="https://api.yourservice.com"
      price="0.05"
      title="Premium Feature"
    />
  );
}
```

### Next.js

```tsx
'use client';

import dynamic from 'next/dynamic';

const EigenPayWidget = dynamic(
  () => import('@eigenx402/widget-react').then(mod => mod.EigenPayWidget),
  { ssr: false }
);

export default function Page() {
  return <EigenPayWidget apiUrl="..." price="0.05" />;
}
```

---

## Testing

### Run All Tests

```bash
npm test
```

### Test Payment Flow

1. **Start services**:
```bash
# Terminal 1: Compute app
cd packages/compute-app && npm run dev

# Terminal 2: API server
cd packages/server && npm run dev

# Terminal 3: Web app
cd apps/web && npm run dev
```

2. **Open browser**: http://localhost:3000

3. **Connect wallet**: Click "Connect Wallet", switch to Base Sepolia

4. **Make payment**:
   - Enter a prompt
   - Click "Pay & Run Inference"
   - Sign payment authorization in MetaMask
   - Wait for response

5. **Verify proof**: Check transaction on BaseScan

### Test Widget Integration

```bash
cd examples/vanilla-html
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## Production Deployment

### 1. Enable Real Payment Settlement

Update `.env`:
```env
ENABLE_REAL_SETTLEMENT=true
```

This executes actual `transferWithAuthorization` on-chain.

### 2. Deploy EigenCompute to TEE

```bash
cd apps/scripts
./deploy-eigencompute.sh
```

Update `COMPUTE_APP_URL` and `EIGEN_IMAGE_DIGEST` in `.env`.

### 3. Deploy API Server

Choose a cloud provider (Railway, Fly.io, Heroku) and deploy with environment variables.

### 4. Host Widget Files

Upload `packages/widget/dist/*.js` to CDN:
- Cloudflare Pages
- Vercel
- AWS S3 + CloudFront
- Your own CDN

### 5. Update Widget URLs

Replace `api-url` in widgets with your production API URL.

### 6. Test on Mainnet

Switch to Base Mainnet:
```env
NETWORK=base
CHAIN_ID=8453
BASE_RPC_URL=https://mainnet.base.org
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

---

## Security Checklist

Before production:

- [ ] Use real `MERCHANT_PRIVATE_KEY` from secure vault
- [ ] Enable `ENABLE_REAL_SETTLEMENT=true`
- [ ] Deploy EigenCompute to TEE infrastructure
- [ ] Add rate limiting to API endpoints
- [ ] Set up CORS policies
- [ ] Use HTTPS everywhere
- [ ] Implement request validation
- [ ] Add API key authentication (optional)
- [ ] Monitor payment transactions
- [ ] Set up error alerting

---

## Troubleshooting

### Widget not loading
- Check browser console for errors
- Verify widget.js is loaded correctly
- Ensure Web Components are supported

### Payment fails
- Check wallet has USDC balance
- Verify correct network (Base Sepolia)
- Check API server logs
- Verify MERCHANT_WALLET is correct

### Compute app error
- Check compute app is running: `curl $COMPUTE_APP_URL/health`
- Verify Docker container started
- Check compute app logs

### Transaction not confirming
- Check Base Sepolia RPC is responding
- Verify sufficient ETH for gas
- Check transaction on BaseScan

---

## Support

- **Documentation**: https://docs.eigenx402.com
- **GitHub Issues**: https://github.com/yourusername/eigenx402/issues
- **Discord**: https://discord.gg/eigenx402
- **Email**: support@eigenx402.com

---

## Next Steps

1. ✅ Set up local development
2. ✅ Test payment flow locally
3. ✅ Deploy EigenCompute container
4. ✅ Deploy API server to cloud
5. ✅ Integrate widget into your app
6. ✅ Test with real USDC on testnet
7. ✅ Deploy to production on mainnet

**Ready to accept crypto payments! 🚀**
