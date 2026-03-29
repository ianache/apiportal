# Phase 1: Foundation & Identity - Research

**Researched:** 2026-03-29
**Domain:** Infrastructure, Authentication (Keycloak v26+), Backend-for-Frontend (BFF), PostgreSQL
**Confidence:** HIGH

## Summary

This phase establishes the bedrock for the **Nexus API Manager**. It involves scaffolding a monorepo containing a **Vue 3** frontend (Portal) and a **Node.js (Fastify)** BFF, integrated with **Keycloak v26+** for robust Role-Based Access Control (RBAC). 

Key findings indicate that the official Keycloak Node.js adapter (`keycloak-connect`) is deprecated; therefore, the industry standard `openid-client` (v6+) will be used for the BFF. On the frontend, `keycloak-js` with PKCE remains the recommended approach. **Prisma** is selected as the PostgreSQL ORM for its superior developer experience in enterprise contexts.

**Primary recommendation:** Use a monorepo structure with `npm workspaces` and implement the "BFF as Proxy/Aggregator" pattern to encapsulate Keycloak complexity from the frontend.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite` | 8.0.3 | Build tool & Dev server | Standard for Vue 3; extremely fast HMR. |
| `vue` | 3.x | Frontend Framework | Required by project vision. |
| `pinia` | 3.0.4 | State Management | Official Vue 3 store; simpler than Vuex. |
| `tailwindcss`| 4.2.2 | CSS Framework | Modern utility-first CSS; native CSS engine in v4. |
| `fastify` | 5.8.4 | BFF Framework | High-performance, low-overhead Node.js framework. |
| `prisma` | 7.6.0 | ORM | Type-safe SQL client with excellent migrations and DX. |
| `keycloak-js`| 26.2.3 | Auth Client (Frontend) | Official client for Keycloak integration. |
| `openid-client`| 6.8.2 | OIDC Client (BFF) | OIDC-certified; recommended replacement for `keycloak-connect`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `jose` | 5.x | JWT Utilities | For manual token validation/decoding if needed. |
| `zod` | 3.x | Schema Validation | Validating API payloads and env variables. |
| `vitest` | 3.x | Test Framework | Shared test runner for both Portal and BFF. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fastify` | `express` | Express is slower and lacks native async error handling; Fastify is 2025 standard. |
| `prisma` | `drizzle-orm`| Drizzle is better for Serverless/Edge; Prisma is better for long-lived Enterprise containers. |
| `npm workspaces`| `pnpm` | `pnpm` is not available in the current environment; `npm` is pre-installed. |

**Installation:**
```bash
# Portal (apps/portal)
npm install vue pinia vue-router tailwindcss keycloak-js
# BFF (apps/bff)
npm install fastify @fastify/cors @fastify/env @fastify/prisma openid-client zod
npm install -D prisma
```

## Architecture Patterns

### Recommended Project Structure (Monorepo)
```
/ (root)
├── apps/
│   ├── portal/        # Vue 3 SPA
│   │   ├── src/stores/auth.ts  # Keycloak integration
│   │   └── tailwind.config.ts  # v4 uses CSS imports mostly
│   └── bff/           # Fastify server
│       ├── src/plugins/auth.ts # openid-client middleware
│       └── src/routes/         # API orchestration
├── packages/
│   └── shared-types/  # Shared DTOs/Interfaces
├── .env               # Shared env vars (DB_URL, KEYCLOAK_URL)
├── package.json       # "workspaces": ["apps/*", "packages/*"]
└── docker-compose.yml # Keycloak + PostgreSQL + Adminer/pgAdmin
```

### Pattern 1: BFF Auth Proxy
The BFF handles token validation and session management. The Portal sends the Access Token (Bearer) to the BFF, which validates it against Keycloak's JWKS before proceeding with database or gateway calls.

### Anti-Patterns to Avoid
- **Implicit Flow:** Do not use. **Authorization Code Flow with PKCE** is mandatory for SPAs.
- **Hand-rolling RBAC:** Don't check roles by string comparison in components only; enforce at the BFF layer.
- **Leaking Secrets:** Ensure `client_secret` (if using confidential client) never reaches the frontend.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT Validation | Custom decode | `openid-client` / `jose` | Edge cases in signature/expiry/issuer verification. |
| DB Migrations | Manual SQL scripts | `prisma migrate` | Version control, drift detection, and type-safety. |
| Auth Store | Custom reactivity | `pinia` + `keycloak-js` | Handles token refreshing and session lifecycle. |

## Common Pitfalls

### Pitfall 1: Token Expiry Flicker
**What goes wrong:** The app makes an API call with an expired token, getting a 401.
**How to avoid:** Use `keycloak.updateToken(30)` in an Axios interceptor before every request to ensure the token is valid for at least 30 more seconds.

### Pitfall 2: Cold Start Keycloak Init
**What goes wrong:** App mounts before Keycloak is ready, causing unauthorized flashes.
**How to avoid:** Initialize Keycloak in `main.ts` and await the `init()` promise before calling `app.mount('#app')`.

### Pitfall 3: Keycloak v26 Standalone Adapter
**What goes wrong:** Attempting to load `keycloak.js` from `<keycloak-url>/auth/js/keycloak.js` (legacy).
**How to avoid:** Install `keycloak-js` via npm; v26 no longer serves the JS adapter from the server.

## Code Examples

### 1. Keycloak v26+ Frontend Init (Vue 3 + Pinia)
```typescript
// Source: https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: process.env.VITE_KEYCLOAK_URL,
  realm: 'nexus',
  clientId: 'nexus-portal',
});

export const useAuthStore = defineStore('auth', {
  actions: {
    async init() {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      });
      // ... store state
    }
  }
});
```

### 2. Keycloak v26+ Backend Validation (Node.js/Fastify)
```javascript
// Source: https://github.com/panva/node-openid-client
import { issuer } from 'openid-client';

const keycloakIssuer = await issuer.discover('https://keycloak/realms/apps');
const client = new keycloakIssuer.Client({
  client_id: 'apiportal',
  client_secret: '...', // if confidential
});

fastify.addHook('preHandler', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  try {
    const claims = await client.userinfo(token); // Or local validation with JWKS
    request.user = claims;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | 22.14.0 | — |
| npm | All | ✓ | 11.9.0 | — |
| Docker | DB/Keycloak | ✗ | — | Manual installation of Postgres/Keycloak or use Cloud/External. |
| PostgreSQL | Persistence | ✗ | — | Install via OS package manager or use Docker (if fixed). |

**Missing dependencies with no fallback:**
- **Docker:** Critical for local development consistency. Recommend installing Docker Desktop or OrbStack.
- **PostgreSQL:** Required for BFF state.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test` |
| Full suite command | `npm run test:full` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| AUTH-01 | Keycloak init succeeds | Integration | `npx vitest apps/portal/src/stores/auth.test.ts` |
| AUTH-02 | BFF validates JWT | Integration | `npx vitest apps/bff/test/auth.test.ts` |
| DB-01   | Prisma connects to DB | Smoke | `npx prisma db pull` |

## Sources

### Primary (HIGH confidence)
- [keycloak-js (npm)](https://www.npmjs.com/package/keycloak-js) - v26 release notes.
- [openid-client (GitHub)](https://github.com/panva/node-openid-client) - Recommended OIDC client for Node.js.
- [Prisma v7 Docs](https://www.prisma.io/docs) - Database integration patterns.

### Secondary (MEDIUM confidence)
- Community blogs on "Fastify vs Express 2025" for BFF orchestration.
- Keycloak v26 "Organizations" feature for future multi-tenancy.

## Metadata
**Research date:** 2026-03-29
**Valid until:** 2026-04-28
