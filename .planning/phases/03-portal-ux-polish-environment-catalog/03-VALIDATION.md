# Phase 03 Validation: Portal UX Polish & Environment Catalog

## Goal
Polish the Portal UX with renamed nav labels, a structured Settings submenu (Environments/Preferences/Platform), inline API metadata editing, new version creation flow, version status filtering, and a tagged environment catalog with API endpoint URLs per environment.

## Observable Truths
These statements must be true upon phase completion:

### Navigation and Shell
- Sidebar displays "APIs Catalog" instead of "Projects".
- Projects header reads "APIs" and eyebrow reads "APIs Catalog".
- "Settings" in the sidebar expands into a submenu with "Environments", "Preferences", and "Platform".
- Navigating to `/settings` redirects to `/settings/environments`.

### API Editing and Versioning
- Users can click an API name in the detail view to edit it inline, saving on blur or enter.
- Users can click an API description in the detail view to edit it inline.
- The version list in the sidebar can be filtered by status using a dropdown.
- Users can create a new version of an API via a "New Version" action.

### Environment Catalog
- Environment list can be retrieved, created, updated, and deleted in the Settings > Environments view.
- Environment metadata (slug, name, tags) persists correctly.
- Users can map API Endpoints (base URLs) to specific Environments for a given API Version.
- Endpoints mapped to a version are visible in the API detail view.

## Phase Acceptance Criteria
- [x] Navigation terminology matches the domain language ("APIs Catalog").
- [x] Settings submenu correctly routes to distinct placeholder views.
- [x] Inline editing of API metadata persists to the backend without full page reloads.
- [x] Version creation and status filtering function correctly in the UI.
- [x] Environment catalog CRUD works end-to-end (Database -> BFF -> Portal).
- [x] API Endpoints can be associated with Environments on a per-version basis.
- [x] Automated tests for BFF routes (`apis.ts`, `environments.ts`) pass without errors.

## Automated Test Coverage

### Portal Tests (Vitest)
| Requirement | Test File | Command | Status |
|-------------|-----------|---------|--------|
| Navigation label "APIs Catalog" | `apps/portal/src/navigation.test.ts` | `npm run test --workspace=apps/portal -- --run` | ✅ PASS |
| Settings submenu routing (Environments, Preferences, Platform) | `apps/portal/src/navigation.test.ts` | `npm run test --workspace=apps/portal -- --run` | ✅ PASS |
| /settings redirect to /settings/environments | `apps/portal/src/navigation.test.ts` | `npm run test --workspace=apps/portal -- --run` | ✅ PASS |
| Inline editing for name/description | `apps/portal/src/project-detail.test.ts` | `npm run test --workspace=apps/portal -- --run` | ✅ PASS |
| Version status filter dropdown | `apps/portal/src/project-detail.test.ts` | `npm run test --workspace=apps/portal -- --run` | ✅ PASS |

### BFF Tests (Vitest)
| Requirement | Test File | Command | Status |
|-------------|-----------|---------|--------|
| API schema validation | `apps/bff/src/routes/apis.test.ts` | `npm run test --workspace=apps/bff -- --run` | ✅ PASS |
| Environment schema validation | `apps/bff/src/routes/environments.test.ts` | `npm run test --workspace=apps/bff -- --run` | ✅ PASS |

### Test Results
- **Portal:** 51 tests passing
- **BFF:** 24 tests passing

## Validation Audit 2026-03-30
| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |
