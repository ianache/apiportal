# UAT: Phase 01 (Foundation & Identity)

## Summary
- **Status:** COMPLETED
- **Last Updated:** 2026-03-29
- **Overall Result:** PASS

## Automated Verification

| ID | Test Case | Expected Result | Actual Result | Status |
|----|-----------|-----------------|---------------|--------|
| A-01 | Workspace Integrity | package.json has workspaces | Workspaces found | PASS |
| A-02 | Portal Build | `npm run build` succeeds | Build successful | PASS |
| A-03 | BFF Build | `npm run build` succeeds | Build successful | PASS |
| A-04 | Prisma Validation | `prisma validate` succeeds | Schema is valid | PASS |
| A-05 | Shared Types | `shared-types` package exists | Package found | PASS |

## Manual Verification (Conversational Testing)

| ID | Test Case | Steps | Expected Result | Actual Result | Status |
|----|-----------|-------|-----------------|---------------|--------|
| M-01 | Landing Page Access | Visit `http://localhost:5173` | Landing page with Login button | "Nexus API Manager" with button | PASS |
| M-02 | Authentication Redirect | Click "Login" | Redirected to Keycloak | Redirected to Keycloak | PASS |
| M-03 | Successful Login | Authenticate via Keycloak | Redirected back to Dashboard | Redirected back to /dashboard | PASS |
| M-04 | Dashboard RBAC | Verify role display | Correct role displayed from Keycloak | Initially Guest, fixed by adding "API-Admin" mapping | PASS |
| M-05 | Backend Health | Verify DB connection status | "Database Status: Connected" | Initially Unavailable, fixed by resolving port 3001 conflict | PASS |

## Issues & Diagnoses

### Issue 1: Dashboard Missing Diagnostic Content
- **Symptoms:** User saw "API Explorer" placeholder instead of diagnostic cards.
- **Diagnosis:** `Dashboard.vue` was incorrectly overwritten after commit `aab7eea`.
- **Fix:** Restored `Dashboard.vue` from commit `aab7eea`.

### Issue 2: Role Displayed as "Guest"
- **Symptoms:** User with `API-Admin` role was shown as "Guest".
- **Diagnosis:** Hardcoded role mapping only expected `API-Manager`.
- **Fix:** Updated `Dashboard.vue` and `apps/bff/src/plugins/auth.ts` to include `API-Admin` as a valid manager role.

### Issue 3: Database Status "Unavailable"
- **Symptoms:** Dashboard showed database as unavailable even after restore.
- **Diagnosis:** 
  1. `VITE_API_URL` in `apps/portal/.env` was pointing to port 3000 while BFF was on 3001.
  2. Port 3001 had a conflict with two Node processes, one of which was an old service (using `dashboard-app` client ID).
- **Fix:** 
  1. Updated `apps/portal/.env` to port 3001.
  2. Killed conflicting processes on port 3001 and restarted BFF.
