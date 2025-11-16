# 🚀 Deploy to EigenCompute TEE

**Complete guide to deploying your x402-protected service to EigenCompute Trusted Execution Environment**

## What is EigenCompute?

EigenCompute is a platform for running containerized applications inside **Trusted Execution Environments (TEEs)** like Intel SGX or AMD SEV-SNP. This provides:

- 🔒 **Hardware-enforced security** - Code runs in isolated enclaves
- 🔐 **Cryptographic attestation** - Proof that code ran unmodified
- ✅ **Verifiable computation** - Users can verify results are genuine
- 🚫 **No external access** - Even the cloud provider can't see your data

## Prerequisites

### 1. Install EigenX CLI

```bash
npm install -g @eigenlayer/cli
```

Verify installation:
```bash
eigenx --version
```

### 2. Create EigenCompute Account

```bash
eigenx auth login
```

This will open your browser to authenticate.

### 3. Set Up Billing (if required)

```bash
eigenx billing subscribe
```

### 4. Install Docker

Make sure Docker is installed and running:
```bash
docker --version
docker ps
```

## Deployment Steps

### Step 1: Prepare Your Service

Use the TEE service template or any Express app with x402 middleware:

```bash
cd examples/tee-service-template
```

Your service must:
- ✅ Listen on port `8080` (or set via `PORT` env var)
- ✅ Have a `/health` endpoint that returns 200
- ✅ Use `requirePayment()` middleware for paid endpoints
- ✅ Be containerized with Docker

### Step 2: Configure Environment

Create production environment file `.env.production`:

```env
# Server
PORT=8080
NODE_ENV=production

# Payment Configuration
PRICE_USDC=0.05
MERCHANT_WALLET=0xYourMerchantWalletAddress
MERCHANT_PRIVATE_KEY=0xYourPrivateKey

# Network (Base Sepolia for testing, Base Mainnet for production)
NETWORK=base-sepolia
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
CHAIN_ID=84532
BASE_RPC_URL=https://sepolia.base.org

# Enable real on-chain settlement
ENABLE_REAL_SETTLEMENT=true

# These will be set automatically by EigenCompute:
# EIGEN_IMAGE_DIGEST=<auto-set>
# EIGEN_ATTESTATION_URL=<auto-set>
```

⚠️ **Security Note**: Never commit `.env.production` to git! Use EigenCompute secrets instead:

```bash
# Set secrets securely
eigenx secret create MERCHANT_WALLET "0xYourWalletAddress"
eigenx secret create MERCHANT_PRIVATE_KEY "0xYourPrivateKey"
```

### Step 3: Build Docker Image

Build for **linux/amd64** platform (required for EigenCompute):

```bash
docker build --platform linux/amd64 -t my-tee-service:latest .
```

Test locally:
```bash
docker run -p 8080:8080 --env-file .env my-tee-service:latest
```

Verify health check:
```bash
curl http://localhost:8080/health
```

### Step 4: Tag and Push to Registry

EigenCompute can pull from:
- Docker Hub
- GitHub Container Registry (ghcr.io)
- AWS ECR
- Google Container Registry (gcr.io)

#### Option A: Docker Hub

```bash
# Login
docker login

# Tag
docker tag my-tee-service:latest yourusername/my-tee-service:latest

# Push
docker push yourusername/my-tee-service:latest
```

#### Option B: GitHub Container Registry

```bash
# Login (use GitHub personal access token)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag
docker tag my-tee-service:latest ghcr.io/username/my-tee-service:latest

# Push
docker push ghcr.io/username/my-tee-service:latest
```

### Step 5: Deploy to EigenCompute

#### Deploy Command

```bash
eigenx app deploy \
  --name my-tee-service \
  --image yourusername/my-tee-service:latest \
  --port 8080 \
  --tee \
  --env PORT=8080 \
  --env PRICE_USDC=0.05 \
  --env NETWORK=base-sepolia \
  --env USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  --env ENABLE_REAL_SETTLEMENT=true \
  --secret MERCHANT_WALLET \
  --secret MERCHANT_PRIVATE_KEY
```

Parameters:
- `--name` - Your app name (must be unique)
- `--image` - Docker image URL
- `--port` - Exposed port (must match Dockerfile EXPOSE)
- `--tee` - Enable TEE (SGX/SEV-SNP)
- `--env` - Public environment variables
- `--secret` - Reference to secrets (set with `eigenx secret create`)

#### Alternative: Use Config File

Create `eigenx.yaml`:

```yaml
name: my-tee-service
image: yourusername/my-tee-service:latest
port: 8080
tee: true

env:
  PORT: 8080
  PRICE_USDC: "0.05"
  NETWORK: base-sepolia
  USDC_ADDRESS: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  ENABLE_REAL_SETTLEMENT: "true"

secrets:
  - MERCHANT_WALLET
  - MERCHANT_PRIVATE_KEY

resources:
  cpu: 1
  memory: 2048

healthCheck:
  path: /health
  interval: 30s
  timeout: 3s
```

Deploy:
```bash
eigenx app deploy -f eigenx.yaml
```

### Step 6: Verify Deployment

#### Check App Status

```bash
eigenx app info my-tee-service
```

Output:
```
App: my-tee-service
URL: https://my-tee-service-abc123.eigencloud.xyz
Status: Running
Image Digest: sha256:abc123def456789...
TEE: Enabled (Intel SGX)
Platform: linux/amd64
Port: 8080
Health: Healthy

Environment:
  PORT: 8080
  PRICE_USDC: 0.05
  NETWORK: base-sepolia
  EIGEN_IMAGE_DIGEST: sha256:abc123... (auto-set)
  EIGEN_ATTESTATION_URL: https://... (auto-set)
```

#### Check Health

```bash
curl https://my-tee-service-abc123.eigencloud.xyz/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "TEE Service Template",
  "timestamp": "2025-01-15T12:00:00Z",
  "tee": {
    "imageDigest": "sha256:abc123...",
    "attestationAvailable": true
  }
}
```

#### View Logs

```bash
# Stream logs in real-time
eigenx app logs my-tee-service --follow

# View last 100 lines
eigenx app logs my-tee-service --tail 100

# Filter by level
eigenx app logs my-tee-service --level error
```

### Step 7: Test Payment Flow

#### Test Without Payment (Should Return 402)

```bash
curl -X POST https://my-tee-service-abc123.eigencloud.xyz/api/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello world", "seed": 42}'
```

Expected response:
```json
{
  "error": "Payment Required",
  "paymentRequired": {
    "x402Version": 1,
    "accepts": [
      {
        "scheme": "exact",
        "network": "base-sepolia",
        "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "payTo": "0xYourMerchantWallet",
        "maxAmountRequired": "50000",
        "resource": "/api/generate-text",
        "description": "AI inference job",
        "maxTimeoutSeconds": 3600
      }
    ]
  }
}
```

✅ If you see this, payment protection is working!

#### Test With Widget

Create test HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test TEE Service</title>
</head>
<body>
  <h1>AI Text Generator (TEE)</h1>

  <eigenx402-widget
    api-url="https://my-tee-service-abc123.eigencloud.xyz"
    endpoint="/api/generate-text"
    price="0.05"
    title="AI Text Generator"
    mode="ai">
  </eigenx402-widget>

  <script src="https://cdn.eigenx402.com/widget.js"></script>
</body>
</html>
```

Open in browser, connect wallet, make payment, and test!

### Step 8: Get TEE Attestation

Your service automatically gets TEE attestation data in environment variables:

```typescript
// In your service code
const teeInfo = {
  imageDigest: process.env.EIGEN_IMAGE_DIGEST,
  attestationUrl: process.env.EIGEN_ATTESTATION_URL
};

// Fetch full attestation
const attestation = await fetch(process.env.EIGEN_ATTESTATION_URL);
const teeQuote = await attestation.json();

// Include in your response
res.json({
  result: yourData,
  proof: {
    outputHash: hash(yourData),
    containerImageDigest: process.env.EIGEN_IMAGE_DIGEST,
    attestation: teeQuote  // Hardware-backed proof
  }
});
```

## Management Commands

### Update Deployment

After building and pushing new image:

```bash
eigenx app update my-tee-service --image yourusername/my-tee-service:v2
```

### Scale Resources

```bash
eigenx app scale my-tee-service --cpu 2 --memory 4096
```

### Update Environment Variables

```bash
eigenx app env set my-tee-service PRICE_USDC=0.10
```

### Restart App

```bash
eigenx app restart my-tee-service
```

### Delete App

```bash
eigenx app delete my-tee-service
```

## Production Checklist

Before going to production:

### Security
- [ ] Use `eigenx secret` for all sensitive data (never use --env for secrets)
- [ ] Enable `ENABLE_REAL_SETTLEMENT=true` for real on-chain payments
- [ ] Use production merchant wallet (not test wallet)
- [ ] Verify TEE attestation is enabled (`--tee` flag)
- [ ] Review and test all error handling

### Configuration
- [ ] Switch to Base Mainnet (not Sepolia)
  - `NETWORK=base`
  - `CHAIN_ID=8453`
  - `USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- [ ] Set appropriate prices
- [ ] Configure rate limiting (in your service code)
- [ ] Set up monitoring and alerts

### Testing
- [ ] Test all endpoints with 402 flow
- [ ] Test payment verification
- [ ] Test on-chain settlement (small amount first!)
- [ ] Verify TEE attestation in responses
- [ ] Load test (use `eigenx app scale` to increase resources)

### Monitoring
- [ ] Set up log monitoring: `eigenx app logs --follow`
- [ ] Configure alerts for errors
- [ ] Monitor payment transactions on BaseScan
- [ ] Track resource usage: `eigenx app metrics my-tee-service`

### Documentation
- [ ] Document your API endpoints
- [ ] Provide example widget integration code
- [ ] Create user guide for payment flow

## Troubleshooting

### Deployment Fails

**Error: "Image pull failed"**
```bash
# Make sure image is public or auth is configured
docker push yourusername/my-tee-service:latest

# Verify image exists
docker pull yourusername/my-tee-service:latest
```

**Error: "Health check failed"**
```bash
# Check your /health endpoint
curl http://localhost:8080/health

# Check logs
eigenx app logs my-tee-service
```

**Error: "Port already in use"**
```bash
# Make sure PORT matches Dockerfile EXPOSE
# Update deployment:
eigenx app update my-tee-service --port 8080
```

### Payment Issues

**402 response not working**
```bash
# Check middleware is applied
# Verify MERCHANT_WALLET is set correctly
eigenx app env list my-tee-service
```

**Signature verification fails**
```bash
# Check USDC_ADDRESS matches network
# Verify NETWORK is correct (base-sepolia or base)
# Check logs for detailed error
eigenx app logs my-tee-service --tail 50
```

**On-chain settlement fails**
```bash
# Verify MERCHANT_PRIVATE_KEY is set (use secrets!)
eigenx secret list

# Check merchant wallet has ETH for gas
# View transaction on BaseScan
```

### TEE Issues

**No attestation available**
```bash
# Make sure --tee flag was used
eigenx app info my-tee-service | grep TEE

# Redeploy with TEE enabled
eigenx app update my-tee-service --tee
```

## Resources

- **EigenCompute Docs**: https://docs.eigencloud.xyz
- **EigenX CLI**: https://github.com/eigenlayer/eigenx-cli
- **x402 Protocol**: https://github.com/coinbase/x402
- **Base Network**: https://docs.base.org
- **USDC on Base**: https://www.circle.com/en/usdc

## Support

- **GitHub Issues**: https://github.com/yourusername/eigenx402/issues
- **Discord**: https://discord.gg/eigencompute
- **Email**: support@eigenx402.com

---

**Ready to deploy! 🚀**

Your TEE service will be accessible at:
`https://[app-name]-[random].eigencloud.xyz`

Users can pay with the EigenX402 widget and your API will automatically handle payment verification and proof generation!
