# Vanilla HTML Example

Simple HTML page demonstrating EigenX402 payment gateway widgets.

## Quick Start

1. Build the widget:
```bash
cd ../../packages/widget
npm run build
```

2. Open the HTML file:
```bash
open index.html
```

Or serve with a local server:
```bash
npx serve .
```

## What's Included

- **AI Assistant Widget** - Full form for AI inference
- **Generic Payment Widget** - For any paid API
- **Payment Buttons** - One-click payment buttons
- **Event Handling** - JavaScript event examples

## Requirements

- MetaMask or Web3 wallet
- USDC on Base Sepolia (testnet)
- Modern browser with Web Components support

## Integration

Just include the widget script and add the HTML element:

```html
<!-- 1. Include widget -->
<script src="widget.js"></script>

<!-- 2. Add widget -->
<eigenx402-widget
  api-url="https://api.yourservice.com"
  price="0.05">
</eigenx402-widget>
```

## Payment Flow

1. User connects MetaMask
2. User submits request
3. Widget signs payment authorization (EIP-3009)
4. Payment verified by API server
5. Request executed in EigenCompute TEE
6. Response returned with cryptographic proof
7. Payment settles on-chain (USDC transfer)

## Features

- ✅ x402 protocol payments
- ✅ EigenCompute verification
- ✅ Cryptographic proofs
- ✅ No backend code needed
- ✅ Works in any HTML page
