# 🚀 Quick Start: Build Your TEE Service with x402 Payments

**From zero to deployed in 10 minutes!**

This guide shows you how to build and deploy **any custom API service** that runs in EigenCompute TEE and accepts crypto payments.

## What You'll Build

A custom API service that:
- 🔒 Runs inside **EigenCompute TEE** (Trusted Execution Environment)
- 💰 Accepts **x402 crypto payments** (USDC on Base L2)
- 🔐 Returns **cryptographic proofs** of execution
- 🌐 Works with **EigenX402 widgets** (instant website integration)

## Prerequisites

```bash
# Install Node.js 18+
node --version  # Should be 18+

# Install Docker
docker --version

# Install EigenX CLI (optional - for production deployment)
npm install -g @eigenlayer/cli
```

## Step 1: Use the Template (2 minutes)

```bash
# Navigate to TEE service template
cd examples/tee-service-template

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
```

Edit `.env`:
```env
MERCHANT_WALLET=0xYourWalletAddress  # Your receiving wallet
PRICE_USDC=0.05                      # Price per request
NETWORK=base-sepolia                  # Use base for mainnet
ENABLE_REAL_SETTLEMENT=false          # true for production
```

## Step 2: Add Your Custom Logic (5 minutes)

Open `src/index.ts` and replace the placeholder functions with your actual logic:

```typescript
// Example: Your custom AI inference
async function generateText(prompt: string, seed: number): Promise<string> {
  // Replace with your logic:
  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      prompt,
      seed
    })
  });

  const data = await response.json();
  return data.choices[0].text;
}

// Or add your own endpoint!
app.post('/api/my-custom-endpoint',
  requirePayment({
    price: '0.10',
    merchantWallet: PAYMENT_CONFIG.merchantWallet,
    merchantPrivateKey: PAYMENT_CONFIG.merchantPrivateKey,
    usdcAddress: PAYMENT_CONFIG.usdcAddress,
    network: PAYMENT_CONFIG.network as any
  }),
  async (req, res) => {
    const result = await yourCustomFunction(req.body);

    res.json({
      result,
      txHash: req.txHash  // Payment transaction hash
    });
  }
);
```

## Step 3: Test Locally (2 minutes)

```bash
# Start your service
npm run dev
```

Your service is now running at `http://localhost:8080`!

Test the payment flow:
```bash
# This should return 402 Payment Required
curl -X POST http://localhost:8080/api/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "seed": 42}'
```

Expected response:
```json
{
  "error": "Payment Required",
  "paymentRequired": {
    "x402Version": 1,
    "accepts": [...]
  }
}
```

✅ If you see this, payment protection is working!

## Step 4: Add Widget to Your Website (1 minute)

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Paid API</title>
</head>
<body>
  <h1>My Custom TEE Service</h1>

  <!-- Your payment-protected API - 3 lines! -->
  <eigenx402-widget
    api-url="http://localhost:8080"
    endpoint="/api/generate-text"
    price="0.05"
    title="AI Generator"
    mode="ai">
  </eigenx402-widget>

  <!-- Load widget -->
  <script src="../../packages/widget/dist/widget.js"></script>
</body>
</html>
```

Open in browser:
1. Click "Connect Wallet" → MetaMask opens
2. Switch to Base Sepolia network
3. Enter a prompt
4. Click "Pay & Access" → Sign payment
5. Get response with cryptographic proof!

## Step 5: Deploy to EigenCompute TEE (Optional)

### Build Docker Image

```bash
docker build --platform linux/amd64 -t my-tee-service:latest .
```

### Test Docker Image

```bash
docker run -p 8080:8080 --env-file .env my-tee-service:latest
```

### Push to Registry

```bash
# Login to Docker Hub
docker login

# Tag and push
docker tag my-tee-service:latest yourusername/my-tee-service:latest
docker push yourusername/my-tee-service:latest
```

### Deploy to EigenCompute

```bash
# Login to EigenCompute
eigenx auth login

# Create secrets (DON'T use --env for private keys!)
eigenx secret create MERCHANT_WALLET "0xYourWallet"
eigenx secret create MERCHANT_PRIVATE_KEY "0xYourPrivateKey"

# Deploy
eigenx app deploy \
  --name my-tee-service \
  --image yourusername/my-tee-service:latest \
  --port 8080 \
  --tee \
  --env PRICE_USDC=0.05 \
  --env NETWORK=base-sepolia \
  --env ENABLE_REAL_SETTLEMENT=true \
  --secret MERCHANT_WALLET \
  --secret MERCHANT_PRIVATE_KEY
```

### Get Your URL

```bash
eigenx app info my-tee-service
```

Output:
```
App: my-tee-service
URL: https://my-tee-service-abc123.eigencloud.xyz
Status: Running
TEE: Enabled (Intel SGX)
```

### Update Widget

```html
<eigenx402-widget
  api-url="https://my-tee-service-abc123.eigencloud.xyz"
  endpoint="/api/generate-text"
  price="0.05">
</eigenx402-widget>
```

**Done! 🎉**

## What You Can Build

Literally **anything**! Examples:

### AI Services
```typescript
// Text generation, chat, code completion, etc.
app.post('/api/ai-chat', requirePayment({price: '0.05'}), async (req, res) => {
  const response = await openai.chat.completions.create({...});
  res.json({ response });
});
```

### Image Processing
```typescript
// Resize, filter, enhance, object detection, etc.
app.post('/api/process-image', requirePayment({price: '0.10'}), async (req, res) => {
  const processed = await sharp(imageBuffer).resize(800).blur(5).toBuffer();
  res.json({ imageUrl: uploadedUrl });
});
```

### Data Transformation
```typescript
// CSV to JSON, aggregate, validate, etc.
app.post('/api/transform', requirePayment({price: '0.02'}), async (req, res) => {
  const transformed = csvToJson(req.body.data);
  res.json({ data: transformed });
});
```

### API Gateway
```typescript
// Paywall any external API
app.post('/api/premium-data', requirePayment({price: '0.20'}), async (req, res) => {
  const data = await fetch('https://premium-api.com/data');
  res.json(await data.json());
});
```

### Confidential Computing
```typescript
// Process sensitive data in TEE
app.post('/api/analyze-health', requirePayment({price: '1.00'}), async (req, res) => {
  const analysis = await analyzeHealthData(req.body.healthRecords);
  // Data never leaves TEE, provider can't access it!
  res.json({ analysis, proof: teeAttestion });
});
```

## Architecture

```
┌─────────────────────────────────────┐
│      Your Website/App               │
│  <eigenx402-widget                  │
│    api-url="https://..."           │
│    endpoint="/api/..."             │
│    price="0.05">                    │
└─────────────────────────────────────┘
              ↓
    x402 Payment Flow
    (automatic!)
              ↓
┌─────────────────────────────────────┐
│  Your TEE Service (EigenCompute)    │
│                                     │
│  Express Server                     │
│  + requirePayment() middleware      │
│  + Your Custom Logic                │
│                                     │
│  Returns: {                         │
│    result: yourData,                │
│    proof: cryptoProof,              │
│    txHash: paymentTx                │
│  }                                  │
└─────────────────────────────────────┘
```

## Payment Flow

1. **User clicks widget** → Connects MetaMask
2. **Makes request** → Gets `402 Payment Required`
3. **Signs payment** → EIP-3009 USDC authorization (no gas!)
4. **Middleware verifies** → Checks signature, amount, recipient
5. **(Optional) Settles** → Real USDC transfer on-chain
6. **Your code runs** → Only after payment verified
7. **Returns response** → With proof and txHash

## Next Steps

- 📚 Read the full guide: `examples/tee-service-template/README.md`
- 🚀 Deploy to production: `DEPLOY_TO_EIGENCOMPUTE.md`
- 🎨 Customize widgets: `packages/widget/README.md`
- 🔧 Use React: `packages/widget-react/README.md`
- 💡 See examples: `examples/vanilla-html/tee-service-example.html`

## Need Help?

- **Template Code**: `examples/tee-service-template/src/index.ts`
- **Widget Examples**: `examples/vanilla-html/`
- **Deployment Guide**: `DEPLOY_TO_EIGENCOMPUTE.md`
- **GitHub Issues**: [Report issues](https://github.com/yourusername/eigenx402/issues)

## Production Checklist

Before going live:

- [ ] Switch to Base Mainnet (not Sepolia)
- [ ] Set `ENABLE_REAL_SETTLEMENT=true`
- [ ] Use production wallet and private key
- [ ] Deploy to EigenCompute with `--tee` flag
- [ ] Test payment flow on testnet first
- [ ] Set up monitoring and logging
- [ ] Add rate limiting
- [ ] Security audit

---

**That's it! You now have a payment-protected API running in a TEE! 🎉**

Users can pay with crypto and get cryptographic proof that their request was processed securely.
