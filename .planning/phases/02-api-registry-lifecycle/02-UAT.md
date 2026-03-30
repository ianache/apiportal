# UAT: Phase 02 (API Registry & Lifecycle)

## Summary
- **Status:** COMPLETED
- **Last Updated:** 2026-03-29
- **Overall Result:** PASS

## Automated Verification

| ID | Test Case | Expected Result | Actual Result | Status |
|----|-----------|-----------------|---------------|--------|
| A-01 | Prisma Validation | Schema is valid | Validated | PASS |
| A-02 | Portal Build | Vite build succeeds | Successful | PASS |
| A-03 | BFF Build | TSC build succeeds | Successful | PASS |

## Manual Verification (Conversational Testing)

| ID | Test Case | Steps | Expected Result | Actual Result | Status |
|----|-----------|-------|-----------------|---------------|--------|
| M-01 | Projects Page Access | Visit `http://localhost:5173/projects` | List of projects or empty state | Workspace / Projects visible | PASS |
| M-02 | API Creation | Click "New Project", fill details, save | API appears in list | Created "Payment Service" | PASS |
| M-03 | Detail View & Versioning | Click on a project | Shows project info and v0.1.0 in DESIGN | v0.1.0 in DESIGN visible | PASS |
| M-04 | Status Transition (Designer) | Submit for Review | Status becomes REVIEW | Transitioned to REVIEW | PASS |
| M-05 | RBAC (Designer) | Verify Approve/Publish hidden | Buttons NOT visible for Designer | Buttons hidden | PASS |
| M-06 | RBAC (Manager) | Login as Manager, Verify buttons | Approve/Publish ARE visible | Buttons visible | PASS |
| M-07 | Full Lifecycle | Approve then Publish | Status becomes PUBLISHED | Transitioned to PUBLISHED | PASS |

## Issues & Diagnoses

### Issue 1: UI Polish & Contrast
- **Symptoms:** "+ New Project" button had poor text contrast.
- **Fix:** Improved button styling and added icon-only preference where appropriate (ongoing).

### Issue 2: OIDC Discovery Failure (HTTP vs HTTPS)
- **Symptoms:** "only requests to HTTPS are allowed" error in BFF.
- **Diagnosis:** `openid-client` v6 restricts HTTP discovery by default.
- **Fix:** 
  1. Synchronized plugin registration in `app.ts`.
  2. Used `dangerous__allow_http` option in `oidc.discovery`.
  3. Added manual OIDC metadata configuration fallback in `authPlugin.ts`.

### Issue 3: Missing User Context (Race Condition)
- **Symptoms:** "Cannot read properties of undefined (reading 'role')" in BFF routes.
- **Diagnosis:** `apiRoutes` were registered before `authPlugin` was fully established.
- **Fix:** Used `await fastify.register(authPlugin)` and `await fastify.after()` to ensure proper ordering.
