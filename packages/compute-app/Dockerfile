# Dockerfile for EigenCompute Deployment
# Target platform: linux/amd64 (required by EigenCompute)
# Must run as root user per EigenCompute requirements

FROM --platform=linux/amd64 node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm install -D typescript @types/node @types/express @types/seedrandom
RUN npm run build

# Expose port (default 8080, configurable via PORT env var)
EXPOSE 8080

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=8080
ENV MODEL_ID=qwen2-1.5b
ENV DEFAULT_SEED=42

# Run as root (EigenCompute requirement)
USER root

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start the server
CMD ["node", "dist/index.js"]
