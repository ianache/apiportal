---
created: 2026-03-30T00:48:55.346Z
title: Rename Projects to APIs Catalog in nav and workspace label
area: ui
files:
  - apps/portal/src/components/layout/Shell.vue
  - apps/portal/src/views/Projects.vue
  - apps/portal/src/views/ProjectDetail.vue
---

## Problem

The term "Projects" is used in two places with different desired labels:
- **Sidebar navigation** (Shell.vue `mainNav` array): label reads "Projects" → should be "APIs Catalog"
- **Page heading** (Projects.vue `<h1>`): workspace label reads "Projects" → should be "APIs"
- **Breadcrumb** (ProjectDetail.vue): "Projects" link back → should match new label "APIs Catalog" or "APIs"

## Solution

1. `Shell.vue` — in `mainNav`, change `label: 'Projects'` to `label: 'APIs Catalog'`.
2. `Projects.vue` — change the `<span>Workspace</span>` eyebrow label and `<h1>Projects</h1>` heading to `<h1>APIs</h1>`.
3. `ProjectDetail.vue` — update the breadcrumb `<router-link>Projects</router-link>` to `APIs Catalog` (or `APIs`) to stay consistent.

No route path changes needed — `/projects` route stays the same, only display labels change.
