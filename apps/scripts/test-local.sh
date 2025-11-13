#!/bin/bash

# Local testing script
# Starts all services locally (without EigenCompute) for development

set -e

echo "=== Local Testing Setup ==="
echo

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm required but not installed."; exit 1; }

echo "✅ Prerequisites OK"
echo

# Install dependencies
echo "Installing dependencies..."
cd ../..
npm install

# Build packages
echo
echo "Building packages..."
npm run build:all

# Check .env file
if [ ! -f ".env" ]; then
  echo
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp .env.example .env
  echo "⚠️  Please edit .env with your configuration"
  echo
fi

echo
echo "=== Starting Services ==="
echo

# Start compute app in background
echo "Starting compute app on port 8080..."
(cd packages/compute-app && npm run dev) &
COMPUTE_PID=$!
echo "  PID: ${COMPUTE_PID}"

sleep 3

# Start server in background
echo "Starting server on port 3001..."
(cd packages/server && npm run dev) &
SERVER_PID=$!
echo "  PID: ${SERVER_PID}"

sleep 3

# Start web app in background
echo "Starting web app on port 3000..."
(cd apps/web && npm run dev) &
WEB_PID=$!
echo "  PID: ${WEB_PID}"

echo
echo "=== Services Running ==="
echo "  Compute App: http://localhost:8080"
echo "  API Server:  http://localhost:3001"
echo "  Web App:     http://localhost:3000"
echo
echo "To stop all services:"
echo "  kill ${COMPUTE_PID} ${SERVER_PID} ${WEB_PID}"
echo
echo "Or press Ctrl+C"
echo

# Wait for Ctrl+C
trap "kill ${COMPUTE_PID} ${SERVER_PID} ${WEB_PID} 2>/dev/null; exit" INT TERM

wait
