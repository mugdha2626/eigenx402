# EigenX402 AI Widget

Embeddable AI widget with x402 crypto payments. Add AI to any website in 3 lines of code.

## Quick Start

```html
<!-- 1. Include the widget script -->
<script src="./widget.js"></script>

<!-- 2. Add the widget to your page -->
<eigenx402-ai
  api-url="http://localhost:3001"
  model="gpt-oss-120b-f16"
  price="0.05">
</eigenx402-ai>
```

## Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `api-url` | Yes | - | Your API server URL |
| `model` | No | `gpt-oss-120b-f16` | EigenAI model to use |
| `price` | No | `0.05` | Price in USDC per prompt |

## Features

- **No Backend Required** - Widget handles all payment and compute logic
- **Crypto Payments** - Users pay with USDC via MetaMask
- **Verifiable Compute** - Every response includes cryptographic proof
- **Pay Per Use** - Users only pay when they use it

## How It Works

1. User clicks "Connect Wallet"
2. MetaMask connects and switches to Base Sepolia
3. User enters a question
4. User signs USDC payment authorization (gasless for user)
5. Widget sends payment + request to API
6. API verifies payment and runs AI inference via EigenAI
7. User receives AI response + cryptographic proof
8. Payment settles on-chain

## Requirements

- MetaMask or Web3 wallet
- USDC on Base Sepolia (testnet)
- Modern browser with Web Components support

## Build

```bash
npm install
npm run build
```

Output: `dist/widget.js` (745KB bundled)

## Development

The widget uses the working payment flow from the web app:
- Exact same `EigenX402Client` usage
- Same wallet connection logic
- Same Base Sepolia network switching
- Same x402 payment authorization

## License

MIT
