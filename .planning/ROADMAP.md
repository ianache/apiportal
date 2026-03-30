# Roadmap: Nexus API Manager

## Phases

- [x] **Phase 1: Foundation & Identity** - Scaffolding BFF (Node) and Portal (Vue), Keycloak integration, and RBAC setup.
  **Requirements:** [FOUND-01, FOUND-02, IDEN-01, IDEN-02, UI-01]
  **Plans:** 4 plans (COMPLETED 2026-03-29)
- [x] **Phase 2: API Registry & Lifecycle** - CRUD for APIs, versioning, and Approval/Publication workflow logic.
  **Requirements:** [API-01, API-02, VER-01, VER-02, LIF-01, LIF-02, RBAC-01]
  **Plans:** 2 plans (COMPLETED 2026-03-29)
- [ ] **Phase 3: Portal UX Polish & Environment Catalog** - Rename nav labels, Settings submenu (Environments/Preferences/Platform), inline API metadata editing, new version creation, version status filter, and API endpoint URLs per environment with tagged environment catalog.
  **Requirements:** [UX-01, ENV-01, ENV-02]
  **Plans:** 3 plans
- [ ] **Phase 4: Visual Flow Designer Core** - Integration Flow canvas (Vue-based) with Incoming/Response/Exception flow types.
- [ ] **Phase 5: Node Library & Properties** - Implementation of specific node types (Transform, Validate, Route) and property panels.
- [ ] **Phase 6: Developer Portal & Explorer** - Categorized catalog, documentation view, and subscription management.
- [ ] **Phase 7: Gateway Integration** - Syncing configurations with the Spring Boot Gateway Admin API.

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Identity | 4/4 | Completed | 2026-03-29 |
| 2. API Registry | 2/2 | Completed | 2026-03-29 |
| 3. Portal UX Polish & Environment Catalog | 0/3 | Not started | - |
| 4. Visual Flow Designer | 0/0 | Not started | - |
| 5. Node Library | 0/0 | Not started | - |
| 6. Developer Portal | 0/0 | Not started | - |
| 7. Gateway Sync | 0/0 | Not started | - |

## Plan List: Phase 1
- [x] 01-01-PLAN.md — Scaffolding & Shared Base
- [x] 01-02-PLAN.md — Persistence & Contracts
- [x] 01-03-PLAN.md — Identity Layer
- [x] 01-04-PLAN.md — UI Shell & Verification
- [x] 01-VALIDATION.md — Phase-wide Verification & Truths

## Plan List: Phase 2
- [x] 02-01-PLAN.md — Data Model & BFF Registry API
- [x] 02-02-PLAN.md — Portal UI for API Management
- [x] 02-VALIDATION.md — Phase-wide Verification & Truths

## Plan List: Phase 3
- [ ] 03-01-PLAN.md — Wave 1: UX/UI Shell
- [ ] 03-02-PLAN.md — Wave 2: Versioning & Editing
- [ ] 03-03-PLAN.md — Wave 3: Environment Catalog

## Phase Detail Sections

### Phase 3: Portal UX Polish & Environment Catalog

**Goal:** Polish the Portal UX with renamed nav labels, a structured Settings submenu (Environments/Preferences/Platform), inline API metadata editing, new version creation flow, version status filtering, and a tagged environment catalog with API endpoint URLs per environment.

**Deliverables:**
- Rename navigation labels for clarity
- Settings page refactored into submenu: Environments, Preferences, Platform
- Inline edit of API name and description in ProjectDetail with auto-save
- New API version creation from ProjectDetail
- Version status filter and sort in ProjectDetail sidebar
- API endpoint URLs displayed per environment
- Tagged environment catalog (e.g., dev, staging, prod)

**Requirements:** [UX-01, ENV-01, ENV-02]

### Phase 4: Visual Flow Designer Core

**Goal:** Build the Integration Flow canvas with Vue-based drag-and-drop, supporting Incoming/Response/Exception flow types.

**Requirements:** [FLOW-01, FLOW-02]

### Phase 5: Node Library & Properties

**Goal:** Implement Transform, Validate, Route node types with their property panels.

**Requirements:** [NODE-01, NODE-02]

### Phase 6: Developer Portal & Explorer

**Goal:** Build the categorized catalog, documentation view, and subscription management for API Developers.

**Requirements:** [DEV-01, DEV-02, DEV-03]

### Phase 7: Gateway Integration

**Goal:** Sync configurations with the Spring Boot Gateway Admin API.

**Requirements:** [GW-01, GW-02]

## Deferred & Seeds (Future)
- **SEED-001:** API Design Studio (from `documentations/FEAT01.md`). Surfaced in Phase 4 or later. Visual node-based OpenAPI designer.
