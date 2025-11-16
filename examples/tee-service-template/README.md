# TEE Service Template with x402 Payments

**Build ANY service that runs in EigenCompute TEE and accepts crypto payments!**

This template shows you how to create a custom API service that:
- 🔒 Runs inside **EigenCompute TEE** (Trusted Execution Environment)
- 💰 Accepts **x402 crypto payments** (USDC on Base L2)
- 🔐 Returns **cryptographic proofs** of execution
- 🚀 Works with the **EigenX402 widgets** (3 lines of code integration)

## What Can You Build?

Literally **anything**! The template includes examples for:

- ✅ AI text generation
- ✅ Image/video processing
- ✅ Data transformations
- ✅ API gateways
- ✅ Confidential computing
- ✅ Custom business logic

Just replace the placeholder functions with your actual logic!

## Quick Start

### 1. Install Dependencies

```bash
cd examples/tee-service-template
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
MERCHANT_WALLET=0xYourWalletAddress
MERCHANT_PRIVATE_KEY=0xYourPrivateKey
PRICE_USDC=0.05
ENABLE_REAL_SETTLEMENT=false  # true for production
```

### 3. Run Locally

```bash
npm run dev
```

Your service is now running at `http://localhost:8080` with these endpoints:
- `POST /api/generate-text` - AI text generation ($0.05 USDC)
- `POST /api/process-image` - Image processing ($0.10 USDC)
- `POST /api/transform-data` - Data transformation ($0.02 USDC)
- `GET /health` - Health check (free)

### 4. Test with Widget

Create an HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Paid API</title>
</head>
<body>
  <h1>AI Text Generation</h1>

  <!-- EigenX402 Widget - 3 lines of code! -->
  <eigenx402-widget
    api-url="http://localhost:8080"
    endpoint="/api/generate-text"
    price="0.05"
    title="AI Assistant"
    mode="ai">
  </eigenx402-widget>

  <script src="https://cdn.yoursite.com/widget.js"></script>
</body>
</html>
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│        Your Website/App                 │
│  <eigenx402-widget                      │
│    api-url="https://my-api.com"        │
│    endpoint="/api/generate-text"       │
│    price="0.05">                        │
│  </eigenx402-widget>                    │
└─────────────────────────────────────────┘
                  ↓
          x402 Payment Flow
                  ↓
┌─────────────────────────────────────────┐
│   Your TEE Service (EigenCompute)       │
│                                         │
│   Express Server                        │
│   + requirePayment() middleware         │
│   + Your Custom Logic                   │
│                                         │
│   Returns: {                            │
│     result: yourData,                   │
│     proof: cryptographicProof,          │
│     txHash: paymentTransaction          │
│   }                                     │
└─────────────────────────────────────────┘
```

### Payment Protection

Every endpoint can be protected with the `requirePayment()` middleware:

```typescript
app.post('/api/my-endpoint',
  requirePayment({
    price: '0.05',           // Price in USDC
    merchantWallet: '0x...',  // Your wallet
    merchantPrivateKey: '0x...',
    usdcAddress: '0x...',     // USDC contract
    network: 'base-sepolia'
  }),
  async (req, res) => {
    // This code only runs AFTER payment is verified!

    const result = await yourCustomLogic(req.body);

    res.json({
      result,
      txHash: req.txHash  // Payment transaction hash
    });
  }
);
```

### What Happens:

1. **Client makes request** → Gets `402 Payment Required`
2. **Client signs payment** → USDC authorization (no gas fees!)
3. **Middleware verifies signature** → Checks amount, recipient, etc.
4. **Optional: Settles on-chain** → Real USDC transfer
5. **Your code runs** → Only after payment verified
6. **Returns response** → With proof and txHash

## Customization Guide

### Add Your Own Endpoint

```typescript
app.post('/api/your-custom-endpoint',
  requirePayment({
    price: '0.20',  // Set your price
    merchantWallet: PAYMENT_CONFIG.merchantWallet,
    merchantPrivateKey: PAYMENT_CONFIG.merchantPrivateKey,
    usdcAddress: PAYMENT_CONFIG.usdcAddress,
    network: PAYMENT_CONFIG.network as any
  }),
  async (req, res) => {
    try {
      // 1. Get input data
      const { yourInput } = req.body;

      // 2. Do your processing
      const result = await yourCustomFunction(yourInput);

      // 3. Generate proof (optional)
      const proof = {
        inputHash: hashInput(yourInput),
        outputHash: hashOutput(result),
        containerImageDigest: process.env.EIGEN_IMAGE_DIGEST,
        producedAt: new Date().toISOString()
      };

      // 4. Return response
      res.json({
        result,
        proof,
        txHash: req.txHash  // From middleware
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### Implement Your Logic

Replace the placeholder functions in `src/index.ts`:

```typescript
// Example: AI Text Generation
async function generateText(prompt: string, seed: number): Promise<string> {
  // Option 1: Call external API
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

  // Option 2: Run local model
  // const model = await loadModel();
  // return model.generate(prompt, seed);

  // Option 3: Call EigenAI
  // return await eigenai.infer(prompt, seed);
}

// Example: Image Processing
async function processImage(imageUrl: string, filters: any): Promise<string> {
  const sharp = require('sharp');

  // Download image
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();

  // Apply filters
  const processed = await sharp(buffer)
    .resize(800, 600)
    .blur(filters.blur || 0)
    .toBuffer();

  // Upload to storage and return URL
  const resultUrl = await uploadToStorage(processed);
  return resultUrl;
}

// Example: Data Transformation
async function transformData(data: any, transformation: string): Promise<any> {
  switch (transformation) {
    case 'csv-to-json':
      return csvToJson(data);
    case 'json-to-xml':
      return jsonToXml(data);
    case 'aggregate':
      return aggregateData(data);
    default:
      throw new Error(`Unknown transformation: ${transformation}`);
  }
}
```

## Deploy to EigenCompute TEE

### 1. Build Docker Image

```bash
npm run docker:build
```

### 2. Deploy to EigenCompute

```bash
# Install eigenx CLI
npm install -g @eigenlayer/cli

# Login
eigenx auth login

# Deploy
eigenx app deploy \
  --name my-tee-service \
  --image my-tee-service:latest \
  --port 8080 \
  --env-file .env
```

### 3. Get Your TEE URL

```bash
eigenx app info my-tee-service
```

Output:
```
App: my-tee-service
URL: https://my-tee-service-abc123.eigencloud.xyz
Image Digest: sha256:abc123def456...
Status: Running
TEE: Enabled (SGX)
```

### 4. Update Widget

```html
<eigenx402-widget
  api-url="https://my-tee-service-abc123.eigencloud.xyz"
  endpoint="/api/generate-text"
  price="0.05">
</eigenx402-widget>
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 8080) |
| `PRICE_USDC` | Default price in USDC | Yes |
| `MERCHANT_WALLET` | Your receiving wallet | Yes |
| `MERCHANT_PRIVATE_KEY` | For on-chain settlement | Yes (production) |
| `USDC_ADDRESS` | USDC token contract | Yes |
| `NETWORK` | Blockchain network | Yes |
| `ENABLE_REAL_SETTLEMENT` | Enable real payments | No (default: false) |
| `EIGEN_IMAGE_DIGEST` | Container digest | Auto-set in TEE |
| `EIGEN_ATTESTATION_URL` | TEE attestation endpoint | Auto-set in TEE |

## Testing

### Local Testing

```bash
# Terminal 1: Start service
npm run dev

# Terminal 2: Test without payment (should get 402)
curl -X POST http://localhost:8080/api/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "seed": 42}'

# Should return:
# HTTP 402 Payment Required
# { "paymentRequired": { "x402Version": 1, "accepts": [...] } }
```

### Test with Widget

1. Build the widget: `cd ../../packages/widget && npm run build`
2. Create test HTML file (see above)
3. Open in browser, connect wallet, make payment

## Production Checklist

Before deploying to production:

- [ ] Set `ENABLE_REAL_SETTLEMENT=true`
- [ ] Use real `MERCHANT_PRIVATE_KEY` from secure vault
- [ ] Deploy to EigenCompute TEE
- [ ] Verify TEE attestation is working
- [ ] Test on Base Sepolia testnet first
- [ ] Add rate limiting
- [ ] Implement proper error handling
- [ ] Set up monitoring and logging
- [ ] Use environment secrets (not .env files)

## Examples

See `src/index.ts` for complete examples of:
- AI text generation with proofs
- Image processing API
- Data transformation API
- Health check endpoint

## Support

- **Documentation**: [https://code.eigencloud.xyz/docs](https://code.eigencloud.xyz/docs)
- **GitHub Issues**: [Report issues](https://github.com/yourusername/eigenx402/issues)
- **Discord**: [Join community](https://discord.gg/eigencompute)

## License

MIT
