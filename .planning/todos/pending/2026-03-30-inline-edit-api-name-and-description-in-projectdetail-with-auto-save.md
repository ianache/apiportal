---
created: 2026-03-30T00:48:55.346Z
title: Inline edit API name and description in ProjectDetail with auto-save
area: ui
files:
  - apps/portal/src/views/ProjectDetail.vue
  - apps/portal/src/stores/registry.ts
  - apps/bff/src/routes/apis.ts
---

## Problem

In the ProjectDetail header, the API name (`<h1>`) and description (`<p>`) are read-only. There is no way to update them from the UI. The user needs click-to-edit inline fields that save directly on blur/confirm, with one constraint: editing must be **disabled when the current (latest) version status is `PUBLISHED`** — a published API's metadata should be locked.

## Solution

### BFF
Add `PATCH /apis/:id` route in `apps/bff/src/routes/apis.ts`:
- Accepts `{ name?, description? }` (zod partial schema).
- RBAC: Designer or Manager only.
- Returns the updated API record.

### Store
Add `updateApi(id, payload: { name?: string; description?: string })` action to `useRegistryStore`:
- Calls `PATCH /apis/:id` with fresh token.
- On success, patches the local `api` ref in place (no full refetch needed).

### View (`ProjectDetail.vue`)
- Add `isEditingName` and `isEditingDescription` boolean refs.
- Compute `canEditMetadata`: true when `currentVersion?.status !== 'PUBLISHED'` AND user role is Designer or Manager.
- **Name field**: render `<h1>` normally; on click (if `canEditMetadata`) swap to `<input>` focused. On `blur` or `Enter` call `handleUpdateApi()`. On `Escape` cancel and restore original value.
- **Description field**: same pattern with `<textarea>` (auto-height).
- Show a small pencil icon (`edit` material symbol) on hover when editable.
- When `canEditMetadata` is false (PUBLISHED), show a locked tooltip (`lock` icon) on hover to communicate why editing is disabled.
- Optimistic UI: update local value immediately, revert on API error.
