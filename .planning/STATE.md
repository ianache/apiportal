---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-03-30T03:30:53.474Z"
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 100
---

# Project State: Nexus API Manager

## Project Reference

**Core Value:** A comprehensive API Management Platform that empowers developers to explore, register, and visually design API flows with high performance and OAuth 2.1 security.

**Current Focus:** Phase 03 — Visual Flow Designer Core

## Current Position

Phase: 03 (Visual Flow Designer Core) — PLANNING
Plan: 0 of TBD

- **Phase:** 3 (Visual Flow Designer Core)
- **Plan:** N/A
- **Status:** Planning Phase 03
- **Progress:** [██████████] 100%

## Performance Metrics

- **Velocity:** 2 plans/session
- **Quality:** High (Phase 2 validated via UAT)
- **Predictability:** High

## Accumulated Context

### Core Decisions

- **Registry Foundation:** Parent-Child versioning model with `API` and `APIVersion`.
- **State Machine:** Enforced `DESIGN -> REVIEW -> APPROVED -> PUBLISHED` lifecycle.
- **RBAC:** Integrated Keycloak roles (`API-Designer`, `API-Manager`) into Registry & Lifecycle.
- **Persistence:** PostgreSQL (Prisma) with `JsonB` support for future flow configurations.

### Roadmap Evolution

- Phase 3 added: Portal UX Polish & Environment Catalog (inserted before Visual Designer; former Phase 3-6 renumbered to 4-7)
- Phase 8 added: diseñar flujos de integracion usando la especificacion de requerimientos de documentations/FEAT02.md

### Major Achievements

- **Phase 1 Complete:** Identity and Base Shell.
- **Phase 2 Complete:** API Registry & Lifecycle management (Portal + BFF + DB).
- **UAT Phase 2:** Passed (Verified API creation, listing, and status transitions).

## Session Continuity

### Current Session Goals

- Phase 2 Implementation and Validation (Done).
- Start Phase 3 Planning.

### Upcoming Milestones

- Phase 3: Visual Designer canvas integration.
- Phase 4: Integration Flow node library.

### Pending Todos

- **Implement New Version creation in ProjectDetail** (`ui`) — Create button in modal has no handler; needs BFF route, store action, and view wiring. See `.planning/todos/pending/2026-03-30-implement-new-version-creation-in-projectdetail.md`
- **Rename Projects to APIs Catalog in nav and workspace label** (`ui`) — Sidebar nav label → "APIs Catalog"; page heading → "APIs"; breadcrumb → consistent. See `.planning/todos/pending/2026-03-30-rename-projects-to-apis-catalog-in-nav-and-workspace-label.md`
- **Add version status filter and sort to ProjectDetail sidebar** (`ui`) — Status filter (default: PUBLISHED) + descending date sort left of "+ New" button. Client-side only. See `.planning/todos/pending/2026-03-30-add-version-status-filter-and-sort-to-projectdetail-sidebar.md`
- **Inline edit API name and description in ProjectDetail with auto-save** (`ui`) — Click-to-edit h1/p fields, save on blur, locked when version is PUBLISHED. Needs PATCH /apis/:id BFF route + store action. See `.planning/todos/pending/2026-03-30-inline-edit-api-name-and-description-in-projectdetail-with-auto-save.md`
- **API endpoint URLs per environment with tagged environment catalog** (`api`) — Global Environment catalog (slug, name, tags[]). APIEndpoint table linking APIVersion + Environment + baseUrl. New BFF routes, shared types, portal catalog page, and endpoint panel in ProjectDetail. See `.planning/todos/pending/2026-03-30-api-endpoint-urls-per-environment-with-tagged-environment-catalog.md`
- **Expand Settings into submenu with Environments, Preferences and Platform sections** (`ui`) — Collapsible Settings group in sidebar with 3 sub-items (dns/Environments, manage_accounts/Preferences, tune/Platform) + router child routes. See `.planning/todos/pending/2026-03-30-expand-settings-into-submenu-with-environments-preferences-and-platform-sections.md`

### Blockers / Risks

- Visual Designer (Phase 3) complexity in state management (Vue Flow).
