#!/bin/bash

# EigenCompute Deployment Script
#
# This script builds and deploys the compute app to EigenCompute TEE infrastructure.
# Prerequisites:
#   - eigenx-cli installed (npm install -g @eigenlayer/cli)
#   - Docker installed and running
#   - Authenticated with eigenx auth login
#   - Billing account set up

set -e

echo "=== EigenCompute Deployment ==="
echo

# Configuration
COMPUTE_APP_DIR="../../packages/compute-app"
IMAGE_NAME="eigenx402/compute-app"
IMAGE_TAG="latest"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
REGISTRY_PREFIX="${REGISTRY_PREFIX:-}"  # Optional: your container registry

if [ -n "$REGISTRY_PREFIX" ]; then
  FULL_IMAGE="${REGISTRY_PREFIX}/${FULL_IMAGE}"
fi

echo "Step 1: Building Docker image..."
echo "Image: ${FULL_IMAGE}"
echo

cd "${COMPUTE_APP_DIR}"

# Build for linux/amd64 (EigenCompute requirement)
docker build --platform linux/amd64 -t "${FULL_IMAGE}" .

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed"
  exit 1
fi

echo "✅ Docker image built successfully"
echo

# Push to registry if using one
if [ -n "$REGISTRY_PREFIX" ]; then
  echo "Step 2: Pushing to registry..."
  docker push "${FULL_IMAGE}"

  if [ $? -ne 0 ]; then
    echo "❌ Docker push failed"
    exit 1
  fi

  echo "✅ Image pushed to registry"
  echo
fi

# Deploy to EigenCompute
echo "Step 3: Deploying to EigenCompute..."
echo

# Check if app already exists
APP_NAME="${APP_NAME:-eigenx402-compute}"

echo "Deploying app: ${APP_NAME}"
echo

# Deploy (or upgrade if exists)
eigenx app deploy "${APP_NAME}" "${FULL_IMAGE}" \
  --env MODEL_ID="${MODEL_ID:-qwen2-1.5b}" \
  --env DEFAULT_SEED="${DEFAULT_SEED:-42}" \
  --env PORT="8080"

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed"
  echo
  echo "Troubleshooting:"
  echo "  - Ensure you're authenticated: eigenx auth login"
  echo "  - Check billing: eigenx billing subscribe"
  echo "  - Verify image exists: docker images | grep eigenx402"
  exit 1
fi

echo
echo "✅ Deployment successful!"
echo

# Get app info
echo "Fetching app details..."
eigenx app info "${APP_NAME}"

echo
echo "=== Next Steps ==="
echo "1. Get your app URL: eigenx app info ${APP_NAME}"
echo "2. Get image digest: docker inspect ${FULL_IMAGE} --format='{{.RepoDigests}}'"
echo "3. Update .env with COMPUTE_APP_URL and EIGEN_IMAGE_DIGEST"
echo "4. Test health: curl <app-url>/health"
echo

# Extract and display image digest
echo "Image Digest:"
docker inspect "${FULL_IMAGE}" --format='{{index .RepoDigests 0}}' 2>/dev/null || echo "Run: docker inspect ${FULL_IMAGE}"
echo
