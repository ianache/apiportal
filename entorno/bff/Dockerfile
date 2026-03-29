# =============================================================================
# Nexus BFF — Dockerfile
# Build context: monorepo root  (docker-compose sets context: ../)
# =============================================================================

FROM node:22-alpine

WORKDIR /app

# --- Install dependencies (layer-cache friendly) --------------------------
# Copy only package manifests first so npm ci is cached unless deps change
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/bff/package.json             ./apps/bff/
# Portal manifest needed so npm workspaces can resolve the full graph
COPY apps/portal/package.json          ./apps/portal/

RUN npm ci --ignore-scripts

# --- Copy source ----------------------------------------------------------
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/bff/               ./apps/bff/

# Generate Prisma client (must run after prisma/schema.prisma is present)
WORKDIR /app/apps/bff
RUN npx prisma generate

EXPOSE 3000

# Apply pending migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/app.ts"]
