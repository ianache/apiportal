---
phase: 01-foundation-identity
plan: 04
subsystem: ui
tags: [vue3, pinia, vue-router, tailwind-css-v4, material-symbols, keycloak, auth-guard]

requires:
  - phase: 01-03
    provides: Keycloak integration in portal auth store (VITE_KEYCLOAK_* env vars, keycloak-js PKCE)

provides:
  - Shell layout component with sidebar/topbar and Material Symbols
  - Landing page with Keycloak login CTA
  - Dashboard view with user identity, role display, and BFF health diagnostic
  - Vue Router guards that redirect unauthenticated users to Keycloak login

affects: [all future portal views, navigation, layout]

tech-stack:
  added: []
  patterns:
    - Shell.vue wraps all authenticated views as a layout slot provider
    - Role detection reads resource_access[clientId].roles from Keycloak tokenParsed
    - Health check fetches VITE_API_URL/health with Bearer token

key-files:
  created: []
  modified:
    - apps/portal/src/components/layout/Shell.vue
    - apps/portal/src/views/Dashboard.vue
    - apps/portal/src/views/Landing.vue
    - apps/portal/src/router/index.ts
    - apps/portal/src/App.vue
    - apps/portal/index.html

key-decisions:
  - "App.vue simplified to bare <router-view>: Shell.vue owns the full-screen layout"
  - "Role detection uses resource_access[VITE_KEYCLOAK_CLIENT_ID].roles (client roles per 01-03 decision)"
  - "Router guard calls keycloak.login() with redirectUri=origin+to.fullPath to preserve deep links"
  - "Dashboard health check uses VITE_API_URL (existing env var) not a new VITE_BFF_URL"

patterns-established:
  - "Pattern 1: Layout via Shell slot — authenticated views import Shell and nest content inside <Shell>"
  - "Pattern 2: Role-aware UI — roleLabel/roleIcon/roleBadgeColor computed from resource_access"
  - "Pattern 3: BFF calls use VITE_API_URL env var with Bearer token from keycloak.token"

requirements-completed: [UI-01]

duration: 20min
completed: 2026-03-29
---

# Phase 01 Plan 04: UI Shell and Diagnostic Dashboard Summary

**Full-screen Shell layout with Material Symbols sidebar/topbar, role-aware Dashboard showing user identity and BFF /health database status, and Keycloak-guarded Vue Router**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-29T21:15:34Z
- **Completed:** 2026-03-29T21:35:00Z
- **Tasks:** 2 (+ checkpoint)
- **Files modified:** 6

## Accomplishments

- Shell.vue rebuilt with full sidebar (Explorer, Projects, Analytics, Integrations, Sign out) and topbar (user initials avatar, role label, notifications/settings icons)
- Landing.vue polished with brand icon, tagline, and "Sign in to Nexus" CTA that triggers Keycloak PKCE login
- Dashboard.vue displays user name, email, detected client role with matching icon/color, and live BFF `/health` response showing database connectivity status
- Router guards redirect unauthenticated users to Keycloak login (preserving `redirectUri`) and auto-forward authenticated root visitors to `/dashboard`
- App.vue simplified to a bare `<router-view>` so Shell owns the layout

## Task Commits

1. **Task 1: Build Layout Shell and Navigation** - `485a52b` (feat)
2. **Task 2: Implement Diagnostic Dashboard** - `aab7eea` (feat)

## Files Created/Modified

- `apps/portal/src/components/layout/Shell.vue` - Sidebar + topbar layout with Material Symbols, user initials, role label, logout
- `apps/portal/src/views/Dashboard.vue` - User identity card, role card with icon/color, BFF health card, diagnostics table
- `apps/portal/src/views/Landing.vue` - Branded login page with Keycloak redirect CTA
- `apps/portal/src/router/index.ts` - Auth guards + placeholder sidebar routes + root redirect
- `apps/portal/src/App.vue` - Simplified to `<router-view>` only
- `apps/portal/index.html` - Added Inter font link, cleaned up Material Symbols link, fixed title

## Decisions Made

- App.vue was wrapping `<router-view>` in a card container — this was removed so Shell.vue controls the full viewport.
- Role detection reads from `resource_access[VITE_KEYCLOAK_CLIENT_ID].roles` matching the 01-03 client-roles decision.
- Router guard calls `keycloak.login({ redirectUri })` preserving the intended destination path.
- Dashboard uses existing `VITE_API_URL` env var for BFF base URL rather than introducing a new variable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] App.vue layout wrapper removed**
- **Found during:** Task 1 (Shell.vue review)
- **Issue:** App.vue wrapped `<router-view>` inside a centered card div, which would conflict with Shell's fixed header/sidebar layout
- **Fix:** Replaced App.vue template with bare `<router-view />`
- **Files modified:** apps/portal/src/App.vue
- **Verification:** Build passes, layout renders correctly in shell
- **Committed in:** 485a52b (Task 1 commit)

**2. [Rule 2 - Missing Critical] Inter font added to index.html**
- **Found during:** Task 1 (index.html review)
- **Issue:** Design uses Inter font throughout (from sketch reference) but it was not loaded; also had a literal `` artifact in the link tag
- **Fix:** Added Inter font preconnect + stylesheet link, fixed Material Symbols link, updated page title
- **Files modified:** apps/portal/index.html
- **Verification:** Build passes
- **Committed in:** 485a52b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correct layout rendering. No scope creep.

## Issues Encountered

Tailwind CSS v4 `@theme` and `@tailwind` CSS-in-JS directives generate lightningcss minifier warnings during production build. These are known/expected in the Tailwind v4 + Vite ecosystem and do not affect output correctness — the build succeeds and CSS is generated correctly.

## User Setup Required

None — all environment variables were set in previous plans (01-03).

## Next Phase Readiness

- Portal is now a working SPA: unauthenticated users land on the login page, authenticated users see the dashboard with their identity and backend status.
- Foundation is complete. The checkpoint (Task 3) requires manual E2E verification before declaring Phase 1 done.
- Future views (Projects, Analytics, Integrations) can be added by creating new `.vue` files and replacing the placeholder Dashboard component in the router.

---
*Phase: 01-foundation-identity*
*Completed: 2026-03-29*

## Self-Check: PASSED

- FOUND: apps/portal/src/components/layout/Shell.vue
- FOUND: apps/portal/src/views/Dashboard.vue
- FOUND: apps/portal/src/views/Landing.vue
- FOUND: apps/portal/src/router/index.ts
- FOUND: .planning/phases/01-foundation-identity/01-04-SUMMARY.md
- FOUND: commit 485a52b (Task 1: Layout Shell)
- FOUND: commit aab7eea (Task 2: Diagnostic Dashboard)
- FOUND: commit 5080bef (docs: metadata)
