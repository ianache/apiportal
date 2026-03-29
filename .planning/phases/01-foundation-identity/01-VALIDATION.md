# Validation: Phase 1 (Foundation & Identity)

This document tracks the observable truths and verification steps for the completion of Phase 1.

## Phase Goal
Foundation & Identity - Scaffolding BFF (Node) and Portal (Vue), Keycloak integration, and RBAC setup.

## Observable Truths

| ID | Truth | Evidence | Plan |
|----|-------|----------|------|
| T-01 | Monorepo root is configured with npm workspaces | `package.json` contains `"workspaces": ["apps/*", "packages/*"]` | 01-01 |
| T-02 | Portal (Vue 3) and BFF (Fastify) are scaffolded | `apps/portal` and `apps/bff` exist and have valid build scripts | 01-01 |
| T-03 | Shared types package is linked and usable | `packages/shared-types` contains core interfaces used by both apps | 01-02 |
| T-04 | Persistence layer is configured with Prisma | `apps/bff/prisma/schema.prisma` contains User and AuditLog models | 01-02 |
| T-05 | Keycloak integration provides OIDC/PKCE | Portal redirects to Keycloak; BFF validates JWT tokens | 01-03 |
| T-06 | Role-Based Access Control (RBAC) is established | Keycloak roles (API-Manager, etc.) are mapped to application logic | 01-03 |
| T-07 | UI Shell implements design language | Portal has Sidebar/Topbar layout with Material Symbols | 01-04 |
| T-08 | Dashboard provides operational diagnostics | UI shows current User Role and Backend/DB health status | 01-04 |

## Verification Steps

### Automated Verification
Run the following commands from the root directory:

```bash
# Workspace integrity
node -e "const pkg = require('./package.json'); if(!pkg.workspaces) throw new Error('Workspaces missing');"

# Portal Build
npm run build --workspace=apps/portal

# BFF Build & Prisma Validation
npm run build --workspace=apps/bff
npx prisma validate --schema=apps/bff/prisma/schema.prisma

# Shared Types
node -e "require('./packages/shared-types/package.json')"
```

### Manual Verification (UAT)
Follow these steps to verify the end-to-end integration:

1. **Infrastructure Setup:**
   - Ensure a PostgreSQL instance is running and reachable.
   - Ensure a Keycloak instance is running with the `nexus` realm configured (per Plan 03).
2. **Environment Configuration:**
   - Check `.env` in root contains `DATABASE_URL`, `KEYCLOAK_URL`, and client secrets.
3. **Execution:**
   - Run `npm run dev` (root) or start apps individually.
4. **Behavioral Checks:**
   - Visit `http://localhost:5173`. Expect: Landing page with "Login" button.
   - Click "Login". Expect: Redirection to Keycloak.
   - Authenticate with a test user. Expect: Redirection back to `/dashboard`.
   - On Dashboard, verify:
     - "Role: [User Role]" matches Keycloak assignment.
     - "Database Status: Connected" (indicating BFF successfully queried DB).

## Success Criteria
- [ ] 100% of automated build/test commands pass.
- [ ] User can log in and see their specific role in the UI.
- [ ] The platform foundation supports parallel development for subsequent phases.
