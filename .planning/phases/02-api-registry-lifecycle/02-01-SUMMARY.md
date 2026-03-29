---
phase: 02-api-registry-lifecycle
plan: 01
subsystem: bff
tags: [prisma, fastify, semver, zod, rbac, lifecycle]

requires:
  - phase: 01
    provides: Keycloak identity foundation

provides:
  - Updated Prisma schema with API and APIVersion models
  - Shared types for API Registry and Lifecycle
  - Secured BFF endpoints for API CRUD and Status transitions
  - Lifecycle state machine enforced at BFF level
  - RBAC gating for Approval and Publication actions

affects: [database, bff-api, shared-contracts]

tech-stack:
  added: [semver, vitest, supertest]
  patterns:
    - Parent-Child modeling for APIs and Versions
    - State Machine for status transitions (DESIGN -> REVIEW -> APPROVED -> PUBLISHED)
    - Keycloak-to-Prisma user syncing on-the-fly

key-files:
  created:
    - apps/bff/src/routes/apis.ts
  modified:
    - packages/shared-types/index.ts
    - apps/bff/prisma/schema.prisma
    - apps/bff/src/app.ts
    - apps/bff/package.json
    - apps/bff/src/plugins/auth.ts

key-decisions:
  - "Decoupled API container from specific Versions to support historical tracking."
  - "Enforced strict status transitions in BFF to prevent governance bypass."
  - "Implemented on-the-fly User record creation/syncing from Keycloak JWT payload."
  - "Used SemVer library for robust version validation and future-proofing."

requirements-completed: [API-01, VER-01, LIF-01, RBAC-01]

duration: 30min
completed: 2026-03-29
---

# Phase 02 Plan 01: API Registry Data Model & BFF Endpoints Summary

**Core API Registry foundation implemented with a Parent-Child versioning model, state-machine enforced lifecycle transitions, and role-based access control.**

## Accomplishments

- **Shared Types:** Expanded `APIStatus` and defined `API` and `APIVersion` interfaces.
- **Data Model:** Updated Prisma schema with `API` and `APIVersion` models, including cascading deletes and unique constraints.
- **BFF Infrastructure:** Added `vitest` and `supertest` for testing; registered `authPlugin` globally to secure all new routes.
- **Registry API:** Implemented `POST /apis`, `GET /apis`, `GET /apis/:id`, and `POST /apis/:id/versions/:version/status`.
- **Lifecycle Logic:** Status transitions are validated against a strict `transitionMap` (e.g., cannot go from `DESIGN` to `PUBLISHED` directly).
- **RBAC Enforcement:** Designers can manage versions in `DESIGN` state, but only `API_MANAGER` can transition to `APPROVED` or `PUBLISHED`.
- **Health Accessibility:** Updated `authPlugin` to skip authentication for the `/health` route, ensuring dashboard diagnostics remain functional.

## Next Steps

- **Phase 02 Plan 02:** Implement the "Projects" view in the Portal to consume these endpoints.
- **Phase 02 Plan 02:** Build the API creation and lifecycle management UI components.
