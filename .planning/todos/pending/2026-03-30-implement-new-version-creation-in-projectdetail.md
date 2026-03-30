---
created: 2026-03-30T00:48:55.346Z
title: Implement New Version creation in ProjectDetail
area: ui
files:
  - apps/portal/src/views/ProjectDetail.vue
  - apps/portal/src/stores/registry.ts
  - apps/bff/src/routes/apis.ts
---

## Problem

The "New Version" modal in ProjectDetail.vue has a working UI (input for SemVer, Cancel/Create buttons) but the Create button has no `@click` handler — clicking it does nothing. There is also no `createVersion` action in the registry store and no BFF route to create a new version under an existing API.

## Solution

1. **BFF** — add `POST /apis/:id/versions` route in `apps/bff/src/routes/apis.ts`. Validate SemVer with zod (same pattern as createApi). Enforce RBAC (Designer/Manager only). Create `APIVersion` record linked to the API.
2. **Store** — add `createVersion(apiId, version)` action to `useRegistryStore` in `apps/portal/src/stores/registry.ts`. Uses `getToken()` for auth. On success, refresh the local api entry.
3. **View** — wire the Create button in the modal (`@click="handleCreateVersion"`) and add the handler in `ProjectDetail.vue`. Disable button while loading. Clear `newVersionNumber` and close modal on success.
