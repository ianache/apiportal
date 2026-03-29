# =============================================================================
# Nexus Portal — Dockerfile (multi-stage)
# Build context: monorepo root  (docker-compose sets context: ../)
# VITE_* vars are baked in at build time — pass as build args.
# =============================================================================

# ---- Stage 1: build Vue SPA ------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/bff/package.json             ./apps/bff/
COPY apps/portal/package.json          ./apps/portal/

RUN npm ci --ignore-scripts

COPY packages/shared-types/ ./packages/shared-types/
COPY apps/portal/            ./apps/portal/

# Bake environment into the static bundle
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

WORKDIR /app/apps/portal
RUN npm run build

# ---- Stage 2: serve with nginx ---------------------------------------------
FROM nginx:alpine

COPY --from=builder /app/apps/portal/dist /usr/share/nginx/html
COPY entorno/portal/nginx.conf            /etc/nginx/conf.d/default.conf

EXPOSE 80
