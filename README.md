# EigenX402 - EigenAI with x402 Crypto Payments

Pay-per-use AI inference with crypto payments, running in a Trusted Execution Environment (TEE).

## What is This?

A production-ready service that combines:
- **EigenAI** - Deterministic LLM inference with cryptographic signatures
- **x402 Protocol** - HTTP-based crypto payment standard (by Coinbase)
- **EigenCompute TEE** - Verifiable computation in secure hardware
- **USDC Payments** - Stablecoin payments on Base Layer 2

Users pay $0.05 USDC per AI request. No API keys, no subscriptions - just pay and use.

## Live Service

**Endpoint:** `http://34.9.138.101:8080`

**Pricing:** $0.05 USDC per request (Base Sepolia testnet)

## Quick Start

### For Developers Using the Service

Install the client SDK:

```bash
npm install @eigenx402/client-sdk ethers
```

Make a paid AI request:

```typescript
import { EigenX402Client } from '@eigenx402/client-sdk';
import { ethers } from 'ethers';

// Connect wallet
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Initialize client
const client = new EigenX402Client({
  serverUrl: 'http://34.9.138.101:8080',
  signerOrProvider: signer
});

// Make paid request (handles payment automatically)
const result = await client.makeX402Request('/api/generate-text', {
  method: 'POST',
  body: {
    prompt: "What is the meaning of life?",
    model: "gpt-oss-120b-f16",
    seed: 42
  }
});

console.log(result.output);      // AI response
console.log(result.proof);       // Cryptographic proof
console.log(result.txHash);      // Payment transaction
```

That's it! The SDK handles:
- Payment authorization (EIP-3009)
- USDC approval
- x402 protocol flow
- Error handling

### What You Need

1. **MetaMask** or any Web3 wallet
2. **Base Sepolia ETH** for gas ([get from faucet](https://www.alchemy.com/faucets/base-sepolia))
3. **Base Sepolia USDC** ([get from Circle](https://faucet.circle.com/))

## How It Works

```
User Wallet → Pay $0.05 USDC → TEE Service
                                    ↓
                              Calls EigenAI
                                    ↓
                           Returns AI Response
                                    ↓
                        With Cryptographic Proof
```

### Payment Flow

1. User makes request (no payment yet)
2. Service returns `402 Payment Required` with payment details
3. User signs USDC authorization (EIP-3009)
4. Request retried with payment proof
5. Service verifies payment → calls EigenAI → returns result

### What You Get Back

```json
{
  "jobId": "tee-1234567890",
  "output": "The AI response text...",
  "proof": {
    "modelHash": "sha256:abc...",
    "inputHash": "sha256:def...",
    "outputHash": "sha256:ghi...",
    "containerImageDigest": "sha256:jkl...",
    "producedAt": "2025-11-17T04:33:20.409Z",
    "attestation": null
  },
  "txHash": "0x123...",
  "status": "completed"
}
```

## Repository Structure

```
├── examples/
│   └── eigenx402-service/     # TEE service (deployed at 34.9.138.101)
├── packages/
│   ├── client-sdk/            # Client library for making requests
│   ├── server-sdk/            # Payment middleware for TEE service
│   └── types/                 # Shared TypeScript types
└── apps/
    └── web/                   # Demo Next.js frontend
```

## For Service Operators

Want to run your own instance?

### Deploy to EigenCompute

```bash
cd examples/eigenx402-service

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Deploy
eigenx app deploy your-dockerhub-username/eigenx402-service
```

See [examples/eigenx402-service/README.md](examples/eigenx402-service/README.md) for details.

## Development

### Run Demo Frontend

```bash
npm install
npm run dev:web

# Open http://localhost:3000
```

### Test Locally

```bash
cd examples/eigenx402-service
npm install
npm run dev

# Service runs on http://localhost:8080
```

## Economics

**Revenue per request:** $0.05 USDC
**Cost (EigenAI):** ~$0.01 per request
**Profit margin:** ~80%

## Why Use This?

### vs. Traditional AI APIs
- No API keys needed
- Pay per use (no subscriptions)
- Crypto-native payments
- Cryptographic proof of execution

### vs. Direct EigenAI
- No need to manage API keys
- Built-in payment handling
- TEE security guarantees
- Ready-to-use client SDK

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express
- **Blockchain:** Base Sepolia (L2)
- **Payment:** USDC + x402 protocol
- **AI:** EigenAI (deterministic LLMs)
- **Security:** EigenCompute TEE

## Links

- [x402 Protocol Spec](https://docs.cdp.coinbase.com/x402/docs/welcome)
- [EigenAI Docs](https://docs.eigencloud.xyz)
- [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [Circle USDC Faucet](https://faucet.circle.com/)

## License

MIT
