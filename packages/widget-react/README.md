# @eigenx402/widget-react

React components for EigenX402 payment gateway widgets with x402 crypto payments and EigenCompute verification.

## Installation

```bash
npm install @eigenx402/widget-react
```

## Components

### EigenPayWidget

Full payment gateway widget with input form.

```tsx
import { EigenPayWidget } from '@eigenx402/widget-react';

function App() {
  return (
    <EigenPayWidget
      apiUrl="https://api.yourservice.com"
      price="0.05"
      title="AI Assistant"
      description="Ask me anything!"
      mode="ai"
    />
  );
}
```

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiUrl` | string | Yes | - | Your API server URL |
| `price` | string | Yes | - | Price in USDC (e.g., "0.05") |
| `endpoint` | string | No | "/api/jobs" | API endpoint path |
| `title` | string | No | "Payment Gateway" | Widget title |
| `description` | string | No | - | Widget description |
| `mode` | 'ai' \| 'generic' | No | 'ai' | Widget mode |
| `model` | string | No | - | AI model (for AI mode) |
| `buttonText` | string | No | "Pay & Access" | Submit button text |
| `network` | string | No | "base-sepolia" | Blockchain network |
| `currency` | string | No | "USDC" | Payment currency |

### EigenPayButton

Simple payment button for one-click payments.

```tsx
import { EigenPayButton } from '@eigenx402/widget-react';

function App() {
  const handleSuccess = (result) => {
    console.log('Payment successful!', result);
    console.log('TX Hash:', result.txHash);
    console.log('Proof:', result.proof);
  };

  const handleError = (error) => {
    console.error('Payment failed:', error);
  };

  return (
    <EigenPayButton
      apiUrl="https://api.yourservice.com"
      endpoint="/api/premium-feature"
      price="0.10"
      label="Unlock Premium"
      onPaymentSuccess={handleSuccess}
      onPaymentError={handleError}
    />
  );
}
```

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiUrl` | string | Yes | - | Your API server URL |
| `price` | string | Yes | - | Price in USDC |
| `endpoint` | string | No | "/api/resource" | API endpoint path |
| `label` | string | No | "Pay & Access" | Button label |
| `network` | string | No | "base-sepolia" | Blockchain network |
| `currency` | string | No | "USDC" | Payment currency |
| `onPaymentSuccess` | function | No | - | Success callback |
| `onPaymentError` | function | No | - | Error callback |

## Examples

### AI Inference

```tsx
<EigenPayWidget
  apiUrl="https://api.yourservice.com"
  price="0.05"
  title="AI Assistant"
  mode="ai"
  model="gpt-oss-120b-f16"
/>
```

### Premium Content Access

```tsx
<EigenPayButton
  apiUrl="https://api.yourservice.com"
  endpoint="/api/premium-article"
  price="0.50"
  label="Read Premium Article"
  onPaymentSuccess={(result) => {
    // Show the premium content
    displayContent(result.output);
  }}
/>
```

### API Paywall

```tsx
<EigenPayWidget
  apiUrl="https://api.yourservice.com"
  endpoint="/api/data-export"
  price="2.00"
  title="Export Data"
  description="Download your data in CSV format"
  mode="generic"
  buttonText="Pay & Export"
/>
```

## Features

- ✅ **x402 Payment Protocol** - Seamless crypto payments
- ✅ **EigenCompute Verification** - Cryptographic proofs for all requests
- ✅ **MetaMask Integration** - Automatic wallet connection
- ✅ **Base Sepolia** - Low-cost L2 transactions
- ✅ **USDC Payments** - Stablecoin pricing
- ✅ **TypeScript Support** - Full type safety

## How It Works

1. User connects wallet (MetaMask)
2. User submits request
3. Widget signs payment authorization (EIP-3009)
4. Payment sent to API with x402 headers
5. API verifies payment signature
6. Request executed in EigenCompute TEE
7. Cryptographic proof generated
8. Result returned with proof

## License

MIT
