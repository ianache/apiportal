# Plan 01-03 Summary: Identity Layer

## Objective
Implement the Identity and Access layer using Keycloak v26+.

## What Was Built

### Task 1: Keycloak Infrastructure (Human Checkpoint)
- Realm: `apps` at `http://192.168.1.42:8080`
- Portal client: `apiportal` (Public, PKCE S256)
- BFF client: `apiportal` (Client Roles configured)
- Roles configured as **Client Roles** on `apiportal`: `API-Manager`, `API-Designer`, `API-Developer`

### Task 2: OIDC Authentication in BFF
- Rewrote `apps/bff/src/plugins/auth.ts` for openid-client v6 API
- Uses `discovery()` + `jose` `createRemoteJWKSet` / `jwtVerify` for JWT validation
- Maps Client Roles from `resource_access.apiportal.roles` to app `Role` enum
- Added `jose` dependency

### Task 3: Keycloak Integration in Portal
- Updated `apps/portal/src/stores/auth.ts` to read `realm` and `clientId` from env vars (`VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`) instead of hardcoded values

## Key Decisions
- **Client Roles over Realm Roles**: Role mapping reads from `resource_access.{clientId}.roles` per user requirement
- **jose for JWT validation**: openid-client v6 removed `validateJwtAccessToken`; now uses `jose.jwtVerify` directly against the JWKS endpoint

## Verification
- `npm run build --workspace=apps/bff` — clean ✓
- `npm run build --workspace=apps/portal` — clean ✓

## Files Modified
- `apps/bff/src/plugins/auth.ts` — rewritten for openid-client v6 + Client Roles
- `apps/bff/package.json` — added `jose`
- `apps/bff/.gitignore` — exclude compiled ts-node artifacts
- `apps/portal/src/stores/auth.ts` — env-var-driven Keycloak config
- `apps/portal/.env`, `apps/bff/.env` — populated with Keycloak config
