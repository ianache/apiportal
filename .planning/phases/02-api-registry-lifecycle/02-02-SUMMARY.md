---
phase: 02-api-registry-lifecycle
plan: 02
subsystem: ui
tags: [vue3, pinia, registry, lifecycle, rbac]

requires:
  - phase: 02-01
    provides: BFF endpoints for APIs and Versions

provides:
  - Projects view with Grid/Table toggle for API management
  - Project Detail view with version history and lifecycle operations
  - API Registry Pinia store for data management
  - RBAC-aware UI: Buttons for Approval/Publication are restricted by role
  - API creation modal integrated with BFF

affects: [portal-ui, navigation, registry-store]

tech-stack:
  added: []
  patterns:
    - Contextual action buttons based on lifecycle state and user roles
    - Synchronous registry store reflecting server-side state machine
    - Component-based layout using Shell.vue slot

key-files:
  created:
    - apps/portal/src/views/Projects.vue
    - apps/portal/src/views/ProjectDetail.vue
    - apps/portal/src/stores/registry.ts
  modified:
    - apps/portal/src/router/index.ts
    - apps/portal/src/components/layout/Shell.vue

key-decisions:
  - "Integrated all version actions into ProjectDetail.vue for simplicity in Phase 2."
  - "Used Material Symbols and Tailwind for a high-fidelity 'Bento' grid experience."
  - "Ensured status colors are consistent across the entire platform."

requirements-completed: [UI-02, API-02, VER-02, LIF-02]

duration: 40min
completed: 2026-03-29
---

# Phase 02 Plan 02: Portal UI for API Registry Summary

**Fully functional UI for managing the API lifecycle, featuring a responsive registry dashboard and detailed project management views with role-based action gating.**

## Accomplishments

- **Registry Store:** Created a Pinia store to handle all CRUD and lifecycle operations with the BFF.
- **Projects Dashboard:** Implemented a modern "Projects" view that supports toggling between a visual Grid and a detailed Table view.
- **Project Creation:** Added a modal for API designers to register new projects, integrated with the BFF `/apis` endpoint.
- **Project Detail View:** Built a comprehensive management view for individual APIs, showing:
  - Project metadata and current lifecycle status.
  - Sidebar for switching between versions.
  - Context-aware action buttons (Submit for Review, Approve, Publish, Design Flow).
- **RBAC in UI:** 
  - "New Project" button only visible to Designers/Managers.
  - "Approve" and "Publish" buttons only visible to Managers.
  - "Submit for Review" gated by version status and user role.
- **Navigation:** Updated the global Shell and Router to include the new Registry paths.

## Next Steps

- **Phase 02 Verification:** User needs to verify the end-to-end flow from API creation to publication.
- **Phase 03 Preparation:** The "Design Flow" button is ready to link to the Visual Flow Designer canvas in the next phase.
