# Dockerfile for EigenCompute TEE Deployment
# Platform: linux/amd64 (required for EigenCompute)

FROM --platform=linux/amd64 node:18-alpine

# Run as root (required by EigenCompute)
USER root

WORKDIR /app

# Copy package files and workspace dependencies
# This Dockerfile should be run from the monorepo root with:
# docker build -f examples/tee-service-template/Dockerfile .
COPY packages/types ./packages/types
COPY packages/server-sdk ./packages/server-sdk
COPY examples/tee-service-template/package*.json ./
COPY examples/tee-service-template/tsconfig.json ./
COPY examples/tee-service-template/src ./src

# Install dependencies
RUN npm install --production

# Build TypeScript
RUN npm install -g typescript
RUN tsc

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the service
CMD ["node", "dist/index.js"]
