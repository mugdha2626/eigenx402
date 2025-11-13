#!/bin/bash

# Build Docker image for compute app
# Can be run locally or in CI/CD

set -e

echo "=== Building Compute App Docker Image ==="
echo

COMPUTE_APP_DIR="../../packages/compute-app"
IMAGE_NAME="eigenx402/compute-app"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

cd "${COMPUTE_APP_DIR}"

echo "Building ${IMAGE_NAME}:${IMAGE_TAG} for ${PLATFORM}..."
echo

docker build \
  --platform "${PLATFORM}" \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  .

if [ $? -eq 0 ]; then
  echo
  echo "✅ Build successful!"
  echo
  echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
  echo
  echo "To run locally:"
  echo "  docker run -p 8080:8080 ${IMAGE_NAME}:${IMAGE_TAG}"
  echo
  echo "To get digest:"
  echo "  docker inspect ${IMAGE_NAME}:${IMAGE_TAG} --format='{{.Id}}'"
  echo
else
  echo "❌ Build failed"
  exit 1
fi
