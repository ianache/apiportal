# AGENT.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

**Nexus API Manager** — a monorepo API Management Platform with OAuth 2.1 security, built with npm workspaces.

## Monorepo Structure

```
apps/portal        # Vue 3 frontend (Control Plane UI)
apps/bff           # Fastify backend (Backend-for-Frontend / Control Plane API)
packages/shared-types  # Shared TypeScript types (User, API, AuditLog, Role, APIStatus)
```

Workspaces are declared in the root `package.json`. The `shared-types` package is consumed by both `portal` and `bff`.

## Development Commands

### Root (all workspaces)
- `npm run dev` : Start all apps in dev mode
- `npm run build` : Build all apps
- `npm run test` : Run all tests

### Individual apps
- `npm run dev:portal` : Vite dev server for portal
- `npm run dev:bff` : ts-node dev server for BFF (port 3000)

### BFF only (`apps/bff`)
- `npx prisma migrate dev` : Run DB migrations
- `npx prisma generate` : Regenerate Prisma client after schema changes
- `npx prisma studio` : Open Prisma Studio GUI

### Portal only (`apps/portal`)
- `npm run test` : Run Vitest

## Architecture

### BFF (`apps/bff`) — Fastify + Prisma + Keycloak
- **Entry:** `src/app.ts` — registers plugins and routes, starts server.
- **Prisma:** `src/plugins/prisma.ts` — decorates `fastify.prisma` (PrismaClient), connects/disconnects via lifecycle hooks.
- **Auth:** `src/plugins/auth.ts` — OIDC discovery against Keycloak, validates Bearer tokens via `openid-client`, maps Keycloak realm roles (`API-Manager`, `API-Designer`, `API-Developer`) to `Role` enum, attaches `request.user`.
- **Routes:** `src/routes/` — Fastify route plugins registered in `app.ts`.
- In development, if OIDC discovery fails the server starts in **unauthenticated mode** (does not throw). In production it throws.

### Portal (`apps/portal`) — Vue 3 + Pinia + Vue Router + Tailwind CSS v4
- **Auth:** `src/stores/auth.ts` (Pinia) — wraps `keycloak-js`, initializes with `check-sso` + PKCE S256; reads `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` from env. Sets realm to `nexus` and clientId to `nexus-portal`.
- **Router:** `src/router/index.ts` — guards routes with `meta: { requiresAuth: true }`, triggers `keycloak.login()` when unauthenticated.
- **Layout:** `src/components/layout/Shell.vue`.

### Shared Types (`packages/shared-types`)
- **Single file:** `index.ts` — exports `Role`, `User`, `AuditLog`, `API`, `APIStatus`.
- Both portal and bff import from `'shared-types'`.

### Database (PostgreSQL via Prisma)
- **Schema:** `apps/bff/prisma/schema.prisma`
- **Models:** `User` (linked to Keycloak via `sub`), `AuditLog`.
- `Role` enum mirrors `shared-types`: `API_MANAGER | API_DESIGNER | API_DEVELOPER`.

## Environment Setup

Copy `.env.template` to `.env` in the repo root and in `apps/bff/`. Required variables:

- `KEYCLOAK_URL`: BFF auth plugin (OIDC issuer URL, e.g. `http://localhost:8080/realms/nexus`)
- `KEYCLOAK_BFF_CLIENT_ID`: BFF auth plugin
- `KEYCLOAK_BFF_CLIENT_SECRET`: BFF auth plugin
- `DATABASE_URL`: Prisma (`postgresql://...`)
- `PORT`: BFF server (default: 3000)
- `VITE_KEYCLOAK_URL`: Portal Keycloak init

## Infrastructure Dependencies

Keycloak and PostgreSQL must be started manually before running the BFF since there is no Docker setup for them in this environment.

## Prisma Migration Guidelines

### ⚠️ Data Safety Rule

**NEVER run `prisma migrate reset` or commands that can destroy data.**

When executing Prisma migrations:
- Use `prisma migrate dev` for development schema changes
- Use `prisma db push` to sync schema without migration history
- If a migration fails, use `prisma migrate resolve --rolled-back <migration_name>` to mark it as rolled back
- Always verify the migration SQL preview before applying
- **Avoid `prisma migrate reset`** - it deletes all data in the database

### Safe Migration Workflow

1. Before applying migrations, review the planned SQL changes
2. For schema changes that don't require migration history: use `prisma db push`
3. For complex schema changes: create a new migration with `prisma migrate dev --name <description>`
4. Test migrations on a backup/dev database first

### Fixing Stuck Migrations

If a migration fails and leaves the database in an inconsistent state:

```bash
# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Push the current schema state to the database
npx prisma db push
```
