#!/bin/bash

# Setup Verification Script
# Checks that all prerequisites and configuration are correct before running

set -e

echo "=== EigenX402 Setup Verification ==="
echo

ERRORS=0

# Check Node.js
echo -n "Checking Node.js... "
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v)
  echo "✅ $NODE_VERSION"
else
  echo "❌ Not found"
  echo "   Install from https://nodejs.org"
  ERRORS=$((ERRORS + 1))
fi

# Check npm
echo -n "Checking npm... "
if command -v npm >/dev/null 2>&1; then
  NPM_VERSION=$(npm -v)
  echo "✅ $NPM_VERSION"
else
  echo "❌ Not found"
  ERRORS=$((ERRORS + 1))
fi

# Check Docker (optional for local dev, required for deployment)
echo -n "Checking Docker... "
if command -v docker >/dev/null 2>&1; then
  DOCKER_VERSION=$(docker -v | awk '{print $3}' | sed 's/,$//')
  if docker ps >/dev/null 2>&1; then
    echo "✅ $DOCKER_VERSION (running)"
  else
    echo "⚠️  $DOCKER_VERSION (not running)"
    echo "   Start Docker Desktop if you plan to deploy"
  fi
else
  echo "⚠️  Not found (optional for local dev)"
fi

echo

# Check .env file
echo "Checking configuration..."
if [ -f "../../.env" ]; then
  echo "✅ .env file exists"

  # Check required variables
  source ../../.env

  echo -n "  - MERCHANT_WALLET: "
  if [ -z "$MERCHANT_WALLET" ] || [ "$MERCHANT_WALLET" = "0xYourMerchantWalletAddress" ]; then
    echo "❌ Not configured"
    echo "     Set your wallet address in .env"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ ${MERCHANT_WALLET:0:10}..."
  fi

  echo -n "  - BASE_RPC_URL: "
  if [ -z "$BASE_RPC_URL" ]; then
    echo "❌ Not configured"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ $BASE_RPC_URL"
  fi

  echo -n "  - USDC_ADDRESS: "
  if [ -z "$USDC_ADDRESS" ]; then
    echo "❌ Not configured"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ ${USDC_ADDRESS:0:10}..."
  fi

  echo -n "  - COMPUTE_APP_URL: "
  if [ -z "$COMPUTE_APP_URL" ]; then
    echo "❌ Not configured"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ $COMPUTE_APP_URL"
  fi

else
  echo "❌ .env file not found"
  echo "   Run: cp .env.example .env"
  ERRORS=$((ERRORS + 1))
fi

echo

# Check package installation
echo "Checking dependencies..."
cd ../..

if [ -d "node_modules" ]; then
  echo "✅ Dependencies installed"
else
  echo "❌ Dependencies not installed"
  echo "   Run: npm install"
  ERRORS=$((ERRORS + 1))
fi

# Check if packages are built
echo -n "Checking build status... "
if [ -d "packages/types/dist" ] && [ -d "packages/server-sdk/dist" ] && [ -d "packages/client-sdk/dist" ]; then
  echo "✅ Packages built"
else
  echo "⚠️  Not built"
  echo "   Run: npm run build:all"
fi

echo

# Summary
echo "=== Summary ==="
if [ $ERRORS -eq 0 ]; then
  echo "✅ All checks passed!"
  echo
  echo "You're ready to start:"
  echo "  cd apps/scripts"
  echo "  ./test-local.sh"
  echo
  echo "Or start services individually:"
  echo "  Terminal 1: cd packages/compute-app && npm run dev"
  echo "  Terminal 2: cd packages/server && npm run dev"
  echo "  Terminal 3: cd apps/web && npm run dev"
  echo
else
  echo "❌ Found $ERRORS error(s)"
  echo
  echo "Fix the errors above and run this script again."
  echo
  exit 1
fi

# Optional: Check eigenx-cli for deployment
echo "=== Optional Deployment Tools ==="
echo -n "Checking eigenx-cli... "
if command -v eigenx >/dev/null 2>&1; then
  echo "✅ Installed"

  echo -n "  - Authentication: "
  if eigenx auth whoami >/dev/null 2>&1; then
    echo "✅ Logged in"
  else
    echo "⚠️  Not logged in"
    echo "     Run: eigenx auth login"
  fi
else
  echo "⚠️  Not installed (needed for EigenCompute deployment)"
  echo "   Install: npm install -g @eigenlayer/cli"
fi

echo
echo "=== Next Steps ==="
echo "1. Follow QUICKSTART.md for 10-minute setup"
echo "2. Or run: ./test-local.sh to start all services"
echo "3. Open http://localhost:3000 in your browser"
echo
