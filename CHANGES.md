# 🎉 EigenX402 - Generic x402 Payment Gateway (Refactored)

## What Changed?

The EigenX402 payment gateway has been **refactored from a specific AI inference platform to a universal payment gateway framework** that works with ANY API service running in EigenCompute TEE.

---

## Before vs After

### ❌ Before: Specific AI Use Case

```typescript
// Could ONLY be used for AI inference jobs
const result = await client.createAndPayJob({
  prompt: "Hello",
  model: "gpt-oss-120b-f16",
  seed: 42
});

// Widget was hardcoded to /api/jobs/create and /api/jobs/run
<eigenx402-widget
  api-url="https://api.yourservice.com"
  price="0.05">
</eigenx402-widget>
```

**Limitations:**
- ❌ Tied to specific API structure (/api/jobs/*)
- ❌ Could only handle AI inference
- ❌ Response had to match JobResult type
- ❌ Not suitable for custom APIs

### ✅ After: Universal x402 Gateway

```typescript
// Works with ANY endpoint and ANY response structure!
const result = await client.makeX402Request('/api/my-custom-endpoint', {
  method: 'POST',
  body: { anything: 'you want' }
});

// Widget works with ANY x402-protected API
<eigenx402-widget
  api-url="https://my-tee-service.eigencloud.xyz"
  endpoint="/api/generate-image"
  price="0.10">
</eigenx402-widget>
```

**Benefits:**
- ✅ Works with ANY endpoint
- ✅ Supports ANY service (AI, images, data, etc.)
- ✅ Flexible response handling
- ✅ Perfect for custom TEE services

---

## Key Changes

### 1. Client SDK - New Generic Method

**File**: `packages/client-sdk/src/client.ts`

**Added**: `makeX402Request<T>()` method

```typescript
// NEW: Universal x402 payment method
async makeX402Request<T = any>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T>
```

**How it works:**
1. Makes initial request to ANY endpoint
2. Receives 402 Payment Required response
3. Signs payment authorization (EIP-3009)
4. Retries request with X-PAYMENT header
5. Returns whatever YOUR API returns

**Example:**
```typescript
// Image generation API
const result = await client.makeX402Request('/api/generate-image', {
  method: 'POST',
  body: {
    prompt: 'A sunset over mountains',
    style: 'photorealistic'
  }
});

// Data transformation API
const result = await client.makeX402Request('/api/transform', {
  method: 'POST',
  body: {
    data: csvData,
    format: 'json'
  }
});

// Any API you want!
const result = await client.makeX402Request('/api/your-endpoint', {
  body: { your: 'data' }
});
```

**Backward Compatibility:**
The old `createAndPayJob()` method still exists for AI inference use cases.

---

### 2. Widgets - Generic Endpoint Support

**Files**:
- `packages/widget/src/widget.ts`
- `packages/widget/src/button-widget.ts`

**Changed**: Now uses `makeX402Request()` instead of `createAndPayJob()`

**Before:**
```html
<!-- Hardcoded to /api/jobs/* -->
<eigenx402-widget
  api-url="https://api.service.com"
  price="0.05">
</eigenx402-widget>
```

**After:**
```html
<!-- Works with ANY endpoint! -->
<eigenx402-widget
  api-url="https://my-tee-service.eigencloud.xyz"
  endpoint="/api/my-custom-endpoint"
  price="0.05"
  title="My Service"
  mode="generic">
</eigenx402-widget>
```

**New Features:**
- ✅ Flexible response rendering (handles any structure)
- ✅ Dispatches `payment-success` and `payment-error` events
- ✅ Works with custom TEE services
- ✅ Supports any endpoint path

---

### 3. TEE Service Template

**New Directory**: `examples/tee-service-template/`

**What it is**: A complete template for building ANY paid API service that runs in EigenCompute TEE.

**Includes:**
- ✅ Express server with x402 middleware
- ✅ Multiple endpoint examples (AI, images, data)
- ✅ Docker configuration for EigenCompute
- ✅ Environment configuration
- ✅ Deployment scripts
- ✅ Comprehensive documentation

**Usage:**
```bash
# 1. Copy template
cd examples/tee-service-template

# 2. Add your logic
# Edit src/index.ts

# 3. Deploy
docker build --platform linux/amd64 -t my-service .
eigenx app deploy --name my-service --image my-service --tee
```

**Example endpoints included:**
- `/api/generate-text` - AI text generation
- `/api/process-image` - Image processing
- `/api/transform-data` - Data transformation
- `/health` - Health check

You can add ANY endpoint you want!

---

### 4. Documentation

**New Files:**
- `QUICKSTART_TEE.md` - 10-minute quick start guide
- `DEPLOY_TO_EIGENCOMPUTE.md` - Complete deployment guide
- `examples/tee-service-template/README.md` - Template docs
- `examples/vanilla-html/tee-service-example.html` - Live examples

**Updated Files:**
- `README.md` - Updated with generic capabilities
- `SETUP.md` - Updated setup instructions

---

## Architecture Overview

### New Generic Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    ANY WEBSITE/APP                          │
│                                                             │
│  Option 1: Vanilla HTML                                    │
│  <eigenx402-widget endpoint="/api/anything">               │
│                                                             │
│  Option 2: React                                            │
│  <EigenPayWidget endpoint="/api/anything">                 │
│                                                             │
│  Option 3: Custom JS                                        │
│  client.makeX402Request('/api/anything', {...})            │
└────────────────────────────────────────────────────────────┘
                           ↓
                 x402 Payment Protocol
                           ↓
┌────────────────────────────────────────────────────────────┐
│              YOUR CUSTOM TEE SERVICE                        │
│          (EigenCompute Trusted Execution)                   │
│                                                             │
│  Express Server + x402 Middleware                          │
│                                                             │
│  app.post('/api/anything',                                 │
│    requirePayment({ price: '0.05' }),                      │
│    async (req, res) => {                                   │
│      // YOUR CUSTOM LOGIC HERE                             │
│      const result = await yourFunction(req.body);          │
│      res.json({ result, txHash: req.txHash });            │
│    }                                                       │
│  );                                                        │
│                                                             │
│  Build ANYTHING:                                           │
│  • AI inference                                            │
│  • Image/video processing                                  │
│  • Data transformation                                     │
│  • API gateway                                             │
│  • Confidential computing                                  │
│  • Whatever you want!                                      │
└────────────────────────────────────────────────────────────┘
```

---

## Migration Guide

If you were using the old AI-specific version:

### For Frontend Users

**Before:**
```html
<eigenx402-widget
  api-url="https://api.yourservice.com"
  price="0.05">
</eigenx402-widget>
```

**After:**
```html
<!-- Add endpoint attribute -->
<eigenx402-widget
  api-url="https://api.yourservice.com"
  endpoint="/api/jobs/create"
  price="0.05"
  mode="ai">
</eigenx402-widget>
```

The widget is backward compatible - if `endpoint` is not specified, it defaults to `/api/jobs`.

### For SDK Users

**Before:**
```typescript
const result = await client.createAndPayJob({
  prompt: "Hello",
  model: "gpt-oss-120b-f16",
  seed: 42
});
```

**After (recommended):**
```typescript
// Use generic method
const result = await client.makeX402Request('/api/jobs/create', {
  method: 'POST',
  body: {
    prompt: "Hello",
    model: "gpt-oss-120b-f16",
    seed: 42
  }
});
```

**Or keep using the old method** (still works!):
```typescript
const result = await client.createAndPayJob({
  prompt: "Hello",
  model: "gpt-oss-120b-f16",
  seed: 42
});
```

---

## What's Unchanged?

The **core x402 payment infrastructure** remains the same:

- ✅ `packages/server-sdk` - Payment verification middleware
- ✅ `packages/types` - TypeScript types
- ✅ `packages/server` - Job API server (for AI use case)
- ✅ `packages/compute-app` - Deterministic inference engine
- ✅ EIP-3009 payment signing
- ✅ USDC on Base L2
- ✅ Payment verification
- ✅ On-chain settlement

**You can still use the AI inference system exactly as before!**

---

## New Use Cases Enabled

### 1. Image Generation API

```typescript
// Backend (TEE service)
app.post('/api/generate-image',
  requirePayment({ price: '0.10' }),
  async (req, res) => {
    const image = await generateImage(req.body.prompt);
    res.json({ imageUrl: image });
  }
);

// Frontend
<eigenx402-widget
  endpoint="/api/generate-image"
  price="0.10">
</eigenx402-widget>
```

### 2. Video Processing API

```typescript
// Backend
app.post('/api/process-video',
  requirePayment({ price: '1.00' }),
  async (req, res) => {
    const processed = await processVideo(req.body.videoUrl);
    res.json({ processedUrl: processed });
  }
);
```

### 3. API Gateway

```typescript
// Paywall any external API
app.post('/api/premium-data',
  requirePayment({ price: '0.50' }),
  async (req, res) => {
    const data = await fetch('https://premium-api.com/data');
    res.json(await data.json());
  }
);
```

### 4. Confidential Computing

```typescript
// Process sensitive data in TEE
app.post('/api/analyze-health',
  requirePayment({ price: '2.00' }),
  async (req, res) => {
    const analysis = await analyzeHealthData(req.body.records);
    res.json({
      analysis,
      proof: teeAttestation  // Cryptographic proof
    });
  }
);
```

---

## Files Modified

### Core SDK
- ✅ `packages/client-sdk/src/client.ts` - Added `makeX402Request()`
- ✅ `packages/widget/src/widget.ts` - Generic endpoint support
- ✅ `packages/widget/src/button-widget.ts` - Generic endpoint support

### New Files
- ✅ `examples/tee-service-template/` - Complete TEE service template
- ✅ `examples/vanilla-html/tee-service-example.html` - Integration examples
- ✅ `QUICKSTART_TEE.md` - Quick start guide
- ✅ `DEPLOY_TO_EIGENCOMPUTE.md` - Deployment guide
- ✅ `CHANGES.md` - This file

### Documentation
- ✅ `README.md` - Updated for generic usage
- ✅ `SETUP.md` - Updated setup instructions

---

## Build Status

✅ All packages built successfully:
```bash
npm run build:all
```

Output:
- ✅ `@eigenx402/client-sdk` - Compiled
- ✅ `@eigenx402/server-sdk` - Compiled
- ✅ `@eigenx402/widget` - Bundled (747KB)
- ✅ `@eigenx402/widget-react` - Compiled
- ✅ All other packages - Compiled

---

## Next Steps

### For Developers

1. **Try the TEE template**: `cd examples/tee-service-template && npm install && npm run dev`
2. **Read quick start**: `QUICKSTART_TEE.md`
3. **Deploy to EigenCompute**: `DEPLOY_TO_EIGENCOMPUTE.md`

### For Users

1. **Use the widgets**: See `examples/vanilla-html/tee-service-example.html`
2. **Connect wallet**: MetaMask on Base Sepolia
3. **Make payment**: Sign USDC authorization
4. **Get result**: With cryptographic proof!

---

## Summary

🎉 **EigenX402 is now a universal payment gateway framework!**

**Before**: AI inference platform with payment protection
**After**: Universal framework for ANY paid API service in TEE

**Key Achievement**: You can now build ANY service (AI, images, data, APIs, etc.) that:
- Runs in EigenCompute TEE
- Accepts crypto payments via x402
- Returns cryptographic proofs
- Integrates with 3 lines of HTML

**The vision is complete**: Drop-in payment widgets for any website that work with any backend service running in a TEE.

---

Ready to build your paid API service? 🚀

Start here: `QUICKSTART_TEE.md`
