# @eigenx402/client-sdk

Client SDK for EigenX402 - Pay-per-use AI inference with crypto payments in a TEE.

## Installation

```bash
npm install @mugdha26/eigenx402-client-sdk ethers
```

## Quick Start

```typescript
import { EigenX402Client } from '@eigenx402/client-sdk';
import { ethers } from 'ethers';

// Connect wallet
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Initialize client
const client = new EigenX402Client({
  serverUrl: 'https://eigenx402-production.up.railway.app',
  signerOrProvider: signer
});

// Make paid AI request
const result = await client.makeX402Request('/api/generate-text', {
  method: 'POST',
  body: {
    prompt: "Explain quantum computing",
    model: "gpt-oss-120b-f16",
    seed: 42
  }
});

console.log(result.output);      // AI response
console.log(result.proof);       // Cryptographic proof
console.log(result.txHash);      // Payment transaction hash
```

## Features

- **Automatic Payment Handling** - SDK manages the complete x402 payment flow
- **EIP-3009 Signatures** - USDC transferWithAuthorization for gasless payments
- **TypeScript Support** - Full type definitions included
- **Error Handling** - Clear error messages and retries
- **Verifiable Compute** - Get cryptographic proofs with every response

## API Reference

### `EigenX402Client`

Main client for making paid requests.

#### Constructor

```typescript
new EigenX402Client(config: ClientConfig)
```

**ClientConfig:**
- `serverUrl: string` - TEE service endpoint
- `signerOrProvider?: ethers.Signer` - Wallet signer (optional, can set later)

#### Methods

##### `makeX402Request<T>(endpoint, options?)`

Make a paid request to any x402-protected endpoint.

**Parameters:**
- `endpoint: string` - API endpoint path (e.g., `/api/generate-text`)
- `options?: object`
  - `method?: string` - HTTP method (default: 'POST')
  - `body?: any` - Request body
  - `headers?: Record<string, string>` - Additional headers

**Returns:** `Promise<T>` - Response from the API

**Example:**
```typescript
const result = await client.makeX402Request('/api/generate-text', {
  method: 'POST',
  body: { prompt: "Hello", seed: 42 }
});
```

##### `setSigner(signer)`

Set or update the wallet signer.

**Parameters:**
- `signer: ethers.Signer` - ethers.js Signer instance

**Example:**
```typescript
const signer = provider.getSigner();
client.setSigner(signer);
```

## Response Format

All requests return:

```typescript
{
  jobId: string;           // Unique job identifier
  output: string;          // AI-generated response
  proof: {
    modelHash: string;     // SHA-256 of model
    inputHash: string;     // SHA-256 of input
    outputHash: string;    // SHA-256 of output
    containerImageDigest: string;  // TEE container digest
    producedAt: string;    // ISO timestamp
    attestation: string | null;    // TEE attestation
  };
  txHash: string;          // Payment transaction hash
  status: 'completed';
}
```

## Payment Flow

1. **Initial Request** - SDK makes request without payment
2. **402 Response** - Server returns payment requirements
3. **Sign Payment** - SDK prompts wallet to sign USDC authorization
4. **Retry with Payment** - SDK retries request with payment proof
5. **Get Result** - Server processes payment and returns AI response

## Requirements

- **Wallet:** MetaMask or any Web3 wallet
- **Network:** Base Sepolia testnet
- **Tokens:**
  - Base Sepolia ETH for gas ([faucet](https://www.alchemy.com/faucets/base-sepolia))
  - Base Sepolia USDC ([faucet](https://faucet.circle.com/))

## Error Handling

```typescript
try {
  const result = await client.makeX402Request('/api/generate-text', {
    body: { prompt: "Hello", seed: 42 }
  });
} catch (error) {
  if (error.message.includes('Payment Required')) {
    // User needs to approve payment
  } else if (error.message.includes('Insufficient balance')) {
    // User needs more USDC
  } else {
    // Other error
    console.error(error);
  }
}
```

## TypeScript

Full TypeScript support with type definitions:

```typescript
import type { 
  JobResult, 
  ClientConfig,
  X402PaymentPayload 
} from '@mugdha26/eigenx402-client-sdk';
```

## Links

- [GitHub Repository](https://github.com/mugdha2626/eigenx402)
- [x402 Protocol](https://docs.cdp.coinbase.com/x402/docs/welcome)
- [EigenAI Documentation](https://docs.eigencloud.xyz)

## License

MIT
