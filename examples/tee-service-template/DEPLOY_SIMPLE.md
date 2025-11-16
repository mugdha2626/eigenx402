# Simple Deployment Fix

The template has workspace dependencies. Deploy from the monorepo root instead:

```bash
# Go to monorepo root
cd /Users/mugdha/Desktop/blockchain/vault

# Create Dockerfile at root for the TEE service
cat > Dockerfile.tee <<'EOF'
FROM --platform=linux/amd64 node:18-alpine

USER root
WORKDIR /app

# Copy all packages
COPY packages ./packages
COPY examples/tee-service-template ./service

WORKDIR /app/service

# Install dependencies
RUN npm install --production

# Build TypeScript
RUN npm install -g typescript
RUN tsc

# Expose port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
EOF

# Copy .env
cp examples/tee-service-template/.env.example .env
# Edit .env with your settings

# Deploy
eigenx app deploy
```

When prompted:
- Dockerfile path: `./Dockerfile.tee`
- .env path: `./.env`
- Image: `mugdhapatil26/eigenx402:latest`
- App name: `eigenx402`
