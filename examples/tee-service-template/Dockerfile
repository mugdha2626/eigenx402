# Dockerfile for EigenCompute TEE Deployment
# Platform: linux/amd64 (required for EigenCompute)

FROM --platform=linux/amd64 node:18-alpine

# Run as root (required by EigenCompute)
USER root

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --production

# Copy source code
COPY src ./src

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
