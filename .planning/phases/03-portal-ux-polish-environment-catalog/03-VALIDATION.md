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
- [ ] Navigation terminology matches the domain language ("APIs Catalog").
- [ ] Settings submenu correctly routes to distinct placeholder views.
- [ ] Inline editing of API metadata persists to the backend without full page reloads.
- [ ] Version creation and status filtering function correctly in the UI.
- [ ] Environment catalog CRUD works end-to-end (Database -> BFF -> Portal).
- [ ] API Endpoints can be associated with Environments on a per-version basis.
- [ ] Automated tests for BFF routes (`apis.ts`, `environments.ts`) pass without errors.
