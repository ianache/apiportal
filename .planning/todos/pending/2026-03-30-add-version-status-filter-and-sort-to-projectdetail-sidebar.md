---
created: 2026-03-30T00:48:55.346Z
title: Add version status filter and sort to ProjectDetail sidebar
area: ui
files:
  - apps/portal/src/views/ProjectDetail.vue
---

## Problem

In the ProjectDetail view, the versions sidebar lists all versions without filtering or sorting controls. When an API has many versions, there is no way to quickly find relevant ones. The user needs:
- A **status filter** dropdown/selector to the left of the "+ New" button in the sidebar header
- Default selection: **PUBLISHED** (show only published versions on load)
- **Sort order**: descending by `createdAt` date (newest first)

## Solution

All logic is client-side (no BFF changes needed — versions are already fetched with the API):

1. Add a `versionStatusFilter` ref (default: `'PUBLISHED'`) and a `filteredVersions` computed that:
   - Filters `api.versions` by selected status (or shows all if filter = `'ALL'`)
   - Sorts by `createdAt` descending

2. Replace the `v-for="v in api.versions"` in the sidebar with `v-for="v in filteredVersions"`.

3. Add a `<select>` or pill-button group in the sidebar header row (left of the "+ New" button) with options:
   `ALL | DESIGN | REVIEW | APPROVED | PUBLISHED | DEPRECATED | RETIRED`
   Styled consistently with the existing design system (hex tokens, same height as the New button).

4. When the selected version is filtered out (e.g., user switches filter and active version is hidden), auto-select the first visible version or set `selectedVersion` to null.
