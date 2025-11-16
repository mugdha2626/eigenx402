# EigenX402 Payment Gateway

**Universal payment gateway with x402 protocol + EigenCompute verification**

Drop-in payment widgets for any website or dApp. Accept crypto payments with cryptographic proof of execution.

## What is EigenX402?

A complete payment gateway platform that combines:
- **x402 Protocol** - Standard for HTTP-based crypto payments (by Coinbase)
- **EigenCompute** - Trusted Execution Environment for verifiable computation
- **USDC Payments** - Stablecoin payments on Base Layer 2
- **Drop-in Widgets** - Embeddable payment components (3 lines of code)

## Why Use EigenX402?

| Traditional Payments | EigenX402 |
|---------------------|-----------|
| Credit card processing | Crypto wallet payments |
| Trust payment processor | Cryptographic verification |
| High fees (2-3%) | Low L2 fees (<$0.01) |
| Chargebacks | Immutable settlements |
| Complex integration | 3 lines of code |
| API keys & servers | Wallet-based auth |

## Quick Start - Widget Integration

Add a payment gateway to any website in 3 lines:

```html
<!-- 1. Include the widget -->
<script src="https://cdn.eigenx402.com/widget.js"></script>

<!-- 2. Add the payment widget -->
<eigenx402-widget
  api-url="https://api.yourservice.com"
  price="0.05"
  title="Premium Content">
</eigenx402-widget>
```

Or use the payment button:

```html
<eigenx402-button
  api-url="https://api.yourservice.com"
  endpoint="/api/resource"
  price="1.00"
  label="Unlock Now">
</eigenx402-button>
```

## Quick Start - React Integration

```bash
npm install @eigenx402/widget-react
```

```tsx
import { EigenPayWidget, EigenPayButton } from '@eigenx402/widget-react';

function App() {
  return (
    <>
      {/* Full widget */}
      <EigenPayWidget
        apiUrl="https://api.yourservice.com"
        price="0.05"
        title="AI Assistant"
        mode="ai"
      />

      {/* Simple button */}
      <EigenPayButton
        apiUrl="https://api.yourservice.com"
        endpoint="/api/premium"
        price="1.00"
        label="Unlock Premium"
        onPaymentSuccess={(result) => console.log('Paid!', result)}
      />
    </>
  );
}
```

## What Makes It Verifiable?

Every payment includes **cryptographic proof from EigenCompute** TEE:

1. **Payment Settled On-Chain** - Real USDC transfer on Base (view on BaseScan)
2. **Verifiable Execution** - Code runs in Trusted Execution Environment (Intel SGX/AMD SEV)
3. **Cryptographic Proof** - SHA-256 hashes of inputs, outputs, and container image
4. **TEE Attestation** - Hardware-backed proof of secure execution
5. **Replay Verification** - Anyone can verify computation was correct

Users get transparency and trust without intermediaries.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web UI)                          │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────────────┐ │
│  │ MetaMask     │  │ Client SDK  │  │ Next.js UI             │ │
│  │ (USDC Base   │──│ (@eigenx402/│──│ - Job Form             │ │
│  │  Sepolia)    │  │  client-sdk)│  │ - Payment Flow         │ │
│  └──────────────┘  └─────────────┘  │ - Proof Display        │ │
│                                      │ - Verify Results       │ │
└──────────────────────────────────────┴────────────────────────┘
                          │
                          │ 1. POST /jobs/create
                          │    (no payment)
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ x402 Middleware (@eigenx402/server-sdk)                    │ │
│  │ ┌──────────────────┐  ┌─────────────────────────────────┐ │ │
│  │ │ Payment Verifier │  │ EIP-3009 Signature Verification │ │ │
│  │ │ - Check headers  │  │ - Verify USDC authorization     │ │ │
│  │ │ - Validate auth  │  │ - Check amounts & recipients    │ │ │
│  │ └──────────────────┘  └─────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Routes                                                      │ │
│  │ - POST /jobs/create  → 402 with invoice                   │ │
│  │ - POST /jobs/run     → verify payment → call EigenCompute │ │
│  │ - GET  /jobs/:id     → return job details                 │ │
│  │ - POST /jobs/:id/replay → verify determinism              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Database (SQLite/Postgres)                                 │ │
│  │ - Job records (prompt, model, seed, txHash, proof)        │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                          │
                          │ 2. Return 402 Payment Required
                          │    {x402: {accepts: [...]}}
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web UI)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Payment Flow                                               │ │
│  │ 1. Parse payment requirements                              │ │
│  │ 2. Sign EIP-3009 transferWithAuthorization                │ │
│  │ 3. Create X-PAYMENT header (base64 encoded)               │ │
│  │ 4. Retry POST /jobs/run with X-PAYMENT                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                          │
                          │ 3. POST /jobs/run + X-PAYMENT header
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Payment verification succeeds                              │ │
│  │ ✓ Signature valid                                          │ │
│  │ ✓ Amount matches                                           │ │
│  │ ✓ Recipient correct                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  4. Call EigenCompute ──────────────────────────┐               │
└─────────────────────────────────────────────────│───────────────┘
                                                   │
                                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│            EIGENCOMPUTE (TEE Container)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Compute App (@eigenx402/compute-app)                       │ │
│  │                                                            │ │
│  │ POST /infer                                                │ │
│  │ {prompt, model, seed}                                      │ │
│  │                                                            │ │
│  │ ┌──────────────────────────────────────────────────────┐  │ │
│  │ │ Deterministic Inference (EigenAI)                   │  │ │
│  │ │ - Seeded random generation with fixed seed          │  │ │
│  │ │ - EigenAI models: gpt-oss-120b-f16, qwen3-32b       │  │ │
│  │ │ - Same inputs → Same output (guaranteed)            │  │ │
│  │ └──────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │ ┌──────────────────────────────────────────────────────┐  │ │
│  │ │ Proof Generation                                     │  │ │
│  │ │ - modelHash    = SHA256(model)                       │  │ │
│  │ │ - inputHash    = SHA256({prompt,seed,model})         │  │ │
│  │ │ - outputHash   = SHA256(output)                      │  │ │
│  │ │ - imageDigest  = Docker image SHA256                 │  │ │
│  │ │ - attestation  = TEE quote (if available)            │  │ │
│  │ └──────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │ Return: {output, proof}                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🔒 TEE Guarantees:                                             │
│  - Code execution in secure enclave                             │
│  - Container image attestation                                  │
│  - No external tampering possible                               │
└──────────────────────────────────────────────────────────────────┘
                          │
                          │ 5. Return {output, proof}
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Store Results in Database                                  │ │
│  │ - Job ID, prompt, model, seed                              │ │
│  │ - Transaction hash (simulated or real)                     │ │
│  │ - Proof JSON with all hashes                               │ │
│  │ - Container image digest                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Return: {jobId, output, proof, txHash}                         │
└──────────────────────────────────────────────────────────────────┘
                          │
                          │ 6. Display result + proof
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web UI)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Job Result Display                                         │ │
│  │ - Generated output text                                    │ │
│  │ - Transaction hash (link to BaseScan)                      │ │
│  │ - All cryptographic hashes                                 │ │
│  │ - Container image digest                                   │ │
│  │ - TEE attestation (if available)                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Verification Option                                        │ │
│  │ [Verify Output] button                                     │ │
│  │ → POST /jobs/:id/replay                                    │ │
│  │ → Re-run with same inputs                                  │ │
│  │ → Compare output hashes                                    │ │
│  │ → ✓ PASSED or ✗ FAILED                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Payment Flow (x402 Protocol)

```
Client                 API Server              Blockchain
  │                         │                       │
  │  1. POST /jobs/create   │                       │
  │ ───────────────────────>│                       │
  │                         │                       │
  │  2. HTTP 402           │                       │
  │  Payment Required       │                       │
  │  {x402: {accepts: [     │                       │
  │    scheme: 'exact',     │                       │
  │    network: 'base-sep', │                       │
  │    asset: '0xUSDC',     │                       │
  │    amount: '50000',     │                       │
  │    payTo: '0xMerch'     │                       │
  │  ]}}                    │                       │
  │ <───────────────────────│                       │
  │                         │                       │
  │  3. Sign EIP-3009      │                       │
  │     authorization       │                       │
  │     (MetaMask)          │                       │
  │                         │                       │
  │  4. POST /jobs/run     │                       │
  │     X-PAYMENT: base64({ │                       │
  │       from, to, value,  │                       │
  │       validAfter,       │                       │
  │       validBefore,      │                       │
  │       nonce, v, r, s    │                       │
  │     })                  │                       │
  │ ───────────────────────>│                       │
  │                         │                       │
  │                         │  5. Verify signature  │
  │                         │     (EIP-712)         │
  │                         │                       │
  │                         │  6. [Optional] Settle │
  │                         │     transferWith      │
  │                         │     Authorization()   │
  │                         │ ─────────────────────>│
  │                         │                       │
  │                         │  7. Confirm TX        │
  │                         │ <─────────────────────│
  │                         │                       │
  │                         │  8. Execute compute   │
  │                         │     (EigenCompute)    │
  │                         │                       │
  │  9. HTTP 200           │                       │
  │  {output, proof, tx}    │                       │
  │ <───────────────────────│                       │
  │                         │                       │
```

## Project Structure

```
eigenx402-payperproof/
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── compute-app/        # Deterministic inference service (Docker)
│   │   ├── src/
│   │   │   ├── index.ts    # Express server
│   │   │   ├── inference.ts # Seeded generation
│   │   │   ├── proof.ts    # Hash computation
│   │   │   └── config.ts
│   │   ├── Dockerfile      # linux/amd64 for EigenCompute
│   │   └── package.json
│   ├── server-sdk/         # x402 Express middleware
│   │   ├── src/
│   │   │   ├── middleware.ts # requirePayment()
│   │   │   ├── verifier.ts   # EIP-3009 verification
│   │   │   └── utils.ts      # Header parsing
│   │   └── package.json
│   ├── server/             # Main API server
│   │   ├── src/
│   │   │   ├── index.ts    # Express app
│   │   │   ├── routes/     # /jobs endpoints
│   │   │   ├── db/         # Drizzle ORM + SQLite
│   │   │   └── config.ts
│   │   └── package.json
│   └── client-sdk/         # Frontend SDK
│       ├── src/
│       │   ├── client.ts   # EigenX402Client
│       │   └── signer.ts   # EIP-3009 signing
│       └── package.json
├── apps/
│   ├── web/                # Next.js UI
│   │   ├── src/
│   │   │   ├── app/        # App router
│   │   │   ├── components/ # React components
│   │   │   └── hooks/      # useWallet
│   │   └── package.json
│   └── scripts/            # Deployment scripts
│       ├── build-docker.sh
│       ├── deploy-eigencompute.sh
│       ├── test-local.sh
│       └── run-tests.sh
├── .env.example
├── package.json            # Workspace root
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for compute app)
- MetaMask or Web3 wallet
- Base Sepolia ETH + USDC (for testing)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Network
BASE_RPC_URL=https://sepolia.base.org
NETWORK=base-sepolia
CHAIN_ID=84532

# USDC Token (Base Sepolia)
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Merchant Wallet (your receiving address)
MERCHANT_WALLET=0xYourAddress
MERCHANT_PRIVATE_KEY=0xYourPrivateKey

# Payment Config
PRICE_USDC=0.05

# For local development
COMPUTE_APP_URL=http://localhost:8080
EIGEN_IMAGE_DIGEST=sha256:local-dev
```

### 3. Build All Packages

```bash
npm run build:all
```

### 4. Run Locally

Option A: Use the test script (starts all services):
```bash
cd apps/scripts
chmod +x test-local.sh
./test-local.sh
```

Option B: Start services individually:

Terminal 1 - Compute App:
```bash
cd packages/compute-app
npm run dev  # Port 8080
```

Terminal 2 - API Server:
```bash
cd packages/server
npm run dev  # Port 3001
```

Terminal 3 - Web App:
```bash
cd apps/web
cp .env.local.example .env.local
npm run dev  # Port 3000
```

### 5. Open Browser

Navigate to http://localhost:3000

## Deploy to EigenCompute

### Setup

1. Install eigenx-cli:
```bash
npm install -g @eigenlayer/cli
```

2. Authenticate:
```bash
eigenx auth login
```

3. Set up billing:
```bash
eigenx billing subscribe
```

### Deploy

```bash
cd apps/scripts
chmod +x deploy-eigencompute.sh
./deploy-eigencompute.sh
```

The script will:
1. Build Docker image (linux/amd64)
2. Deploy to EigenCompute TEE
3. Return app URL and image digest

### Update Environment

After deployment, update `.env`:

```env
COMPUTE_APP_URL=https://your-app.eigencloud.xyz
EIGEN_IMAGE_DIGEST=sha256:abc123...
```

### Monitor

```bash
# View app info
eigenx app info eigenx402-compute

# Stream logs
eigenx app logs eigenx402-compute --watch

# Check health
curl https://your-app.eigencloud.xyz/health
```

## Testing

Run all tests:

```bash
npm run test
```

Or use the test script:

```bash
cd apps/scripts
chmod +x run-tests.sh
./run-tests.sh
```

Tests include:
- ✅ Determinism: Same inputs → same outputs
- ✅ x402 flow: 402 → payment → success
- ✅ Replay verification: Output hash matching

## API Reference

### POST /api/jobs/create

Create a new job. Returns 402 with payment requirements.

**Request:**
```json
{
  "prompt": "Tell me about AI",
  "model": "gpt-oss-120b-f16",
  "seed": 42
}
```

**Response (402):**
```json
{
  "jobId": "abc123...",
  "status": "pending_payment",
  "paymentRequired": {
    "x402Version": 1,
    "accepts": [{
      "scheme": "exact",
      "network": "base-sepolia",
      "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "payTo": "0xMerchant...",
      "maxAmountRequired": "50000",
      "resource": "/api/jobs/run",
      "description": "AI inference job",
      "maxTimeoutSeconds": 3600
    }]
  }
}
```

### POST /api/jobs/run

Execute job after payment verification.

**Headers:**
```
X-PAYMENT: base64(JSON({
  x402Version: 1,
  scheme: 'exact',
  network: 'base-sepolia',
  payload: {
    from, to, value,
    validAfter, validBefore, nonce,
    v, r, s
  }
}))
```

**Request:**
```json
{
  "jobId": "abc123..."
}
```

**Response (200):**
```json
{
  "jobId": "abc123...",
  "output": "Generated text...",
  "proof": {
    "modelHash": "sha256:...",
    "inputHash": "sha256:...",
    "outputHash": "sha256:...",
    "containerImageDigest": "sha256:...",
    "producedAt": "2025-01-15T12:00:00Z",
    "attestation": null
  },
  "txHash": "0x...",
  "status": "completed"
}
```

### GET /api/jobs/:id

Get job details and proof.

### POST /api/jobs/:id/replay

Verify job by replaying computation.

**Response:**
```json
{
  "jobId": "abc123...",
  "verified": true,
  "originalOutputHash": "sha256:...",
  "recomputedOutputHash": "sha256:...",
  "message": "Output verified - deterministic computation confirmed"
}
```

## Use Cases

### 💰 API Paywalls
Monetize your APIs with per-call pricing:
```html
<eigenx402-button
  api-url="https://api.yourservice.com"
  endpoint="/v1/premium-data"
  price="0.10"
  label="Access Data">
</eigenx402-button>
```

### 🤖 AI Services
Charge for AI inference with verifiable results:
```html
<eigenx402-widget
  api-url="https://api.yourservice.com"
  price="0.05"
  title="AI Assistant"
  mode="ai">
</eigenx402-widget>
```

### 📄 Premium Content
Unlock articles, videos, or downloads:
```html
<eigenx402-button
  endpoint="/api/premium-article"
  price="0.50"
  label="Read Article">
</eigenx402-button>
```

### ⚙️ Compute Resources
Charge for computation, rendering, or processing:
```html
<eigenx402-widget
  endpoint="/api/render-video"
  price="2.00"
  title="Video Rendering"
  mode="generic">
</eigenx402-widget>
```

## Key Technologies

- **x402 Protocol**: HTTP 402 payment standard by Coinbase
- **EigenCompute**: Trusted Execution Environment (TEE) for verifiable compute
- **EIP-3009**: `transferWithAuthorization` for gasless USDC payments
- **Base Layer 2**: Low-cost, fast blockchain transactions
- **USDC**: Stablecoin payments (no volatility)
- **Web Components**: Framework-agnostic widgets

## Security Considerations

### Current Implementation (Demo)

This is a **demonstration** implementation with simulated payment settlement:

- ✅ Signature verification (EIP-3009) is **real**
- ✅ Payment requirements are **correct**
- ⚠️ On-chain settlement is **simulated** (returns mock txHash)

### Production Requirements

For production deployment:

1. **Real Payment Settlement**
   - Implement actual `transferWithAuthorization` calls
   - Use merchant private key to submit transactions
   - Wait for blockchain confirmations
   - Store real transaction hashes

2. **Payment Verification**
   - Check on-chain nonce usage to prevent replay
   - Verify transaction succeeded before processing job
   - Handle failed transactions gracefully

3. **TEE Attestation**
   - Integrate EigenCompute runtime attestation API
   - Include full TEE quote in proof
   - Verify attestation signatures

4. **Security Best Practices**
   - Store private keys in secure vaults (not .env)
   - Use rate limiting on API endpoints
   - Implement proper error handling
   - Add request validation and sanitization
   - Use HTTPS everywhere
   - Implement CORS policies

## Roadmap

### Phase 1 (Current)
- ✅ x402 payment gating
- ✅ Deterministic inference with proofs
- ✅ EigenCompute deployment
- ✅ Basic UI with wallet integration

### Phase 2
- [ ] Real on-chain payment settlement
- [ ] Full TEE attestation integration
- [ ] PostgreSQL database
- [ ] Multiple payment tokens
- [ ] Job queue with background processing

### Phase 3
- [ ] Advanced LLM integration (EigenAI, OpenAI)
- [ ] Multi-model support
- [ ] Batch inference
- [ ] API key authentication
- [ ] Usage analytics dashboard

### Phase 4
- [ ] ZK proofs for additional verification
- [ ] Cross-chain payment support
- [ ] Marketplace for inference providers
- [ ] SLA guarantees and refunds

## Troubleshooting

### Local Development

**Port already in use:**
```bash
# Find and kill process
lsof -ti:8080 | xargs kill
lsof -ti:3001 | xargs kill
lsof -ti:3000 | xargs kill
```

**Dependencies not found:**
```bash
npm install
npm run build:all
```

**Wallet connection fails:**
- Ensure MetaMask is installed
- Switch to Base Sepolia network
- Check that you have ETH for gas

### EigenCompute Deployment

**eigenx command not found:**
```bash
npm install -g @eigenlayer/cli
```

**Authentication error:**
```bash
eigenx auth login
```

**Billing not set up:**
```bash
eigenx billing subscribe
```

**Docker build fails:**
- Ensure Docker is running
- Check platform is linux/amd64
- Verify all package.json files are correct

## Resources

- [x402 Protocol](https://github.com/coinbase/x402)
- [EigenCompute Docs](https://docs.eigencloud.xyz)
- [EIP-3009 Spec](https://eips.ethereum.org/EIPS/eip-3009)
- [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)
- [USDC Test Tokens](https://faucet.circle.com/)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For questions or issues:
- Open a GitHub issue
- Check the troubleshooting section
- Review deployment scripts README

---

Built with ❤️ using EigenCompute, x402, and Next.js
