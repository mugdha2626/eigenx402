# @eigenx402/types

TypeScript type definitions for the EigenX402 protocol.

## Installation

```bash
npm install @mugdha26/eigenx402-types
```

## Usage

```typescript
import type {
  X402PaymentPayload,
  X402PaymentRequired,
  JobCreateResponse,
  JobResult
} from '@mugdha26/eigenx402-types';
```

## Type Definitions

### Payment Types

```typescript
// x402 payment payload (signed by user)
interface X402PaymentPayload {
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };
}

// x402 payment requirement (from server)
interface X402PaymentRequired {
  x402Version: number;
  accepts: X402PaymentRequirement[];
}

interface X402PaymentRequirement {
  scheme: 'exact';
  network: string;
  asset: string;
  payTo: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  maxTimeoutSeconds: number;
}
```

### Job Types

```typescript
// Response after creating a job (402 Payment Required)
interface JobCreateResponse {
  jobId: string;
  paymentRequired: X402PaymentRequired;
}

// Result after paying and running a job
interface JobResult {
  jobId: string;
  output: string;
  proof: JobProof;
  txHash: string;
  status: 'completed';
}

interface JobProof {
  modelHash: string;
  inputHash: string;
  outputHash: string;
  containerImageDigest: string;
  producedAt: string;
  attestation: string | null;
}
```

## License

MIT
