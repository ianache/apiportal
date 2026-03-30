---
created: 2026-03-30T00:48:55.346Z
title: Expand Settings into submenu with Environments, Preferences and Platform sections
area: ui
files:
  - apps/portal/src/components/layout/Shell.vue
  - apps/portal/src/router/index.ts
---

## Problem

"Settings" is currently a single flat nav item in the sidebar (`mainNav`) that links to `/settings` but renders the Dashboard placeholder. It needs to become an expandable submenu grouping three distinct admin areas, each with a representative icon and a concise 1-2 word label.

## Solution

### Proposed submenu items

| Icon (Material Symbols) | Label | Route | Purpose |
|---|---|---|---|
| `dns` | Environments | `/settings/environments` | Manage environment catalog (slug, name, tags) — see related todo |
| `manage_accounts` | Preferences | `/settings/preferences` | User-level preferences (theme, language, notification settings) |
| `tune` | Platform | `/settings/platform` | Global platform parameters (token TTL, rate limits, feature flags) |

### Shell.vue changes
- Replace the single `settings` entry in `mainNav` with a collapsible group.
- Add `settingsOpen` ref (default: true when any `/settings/*` route is active).
- Render the parent row as a toggle button (icon `settings`, label "Settings", chevron indicator).
- On click toggle `settingsOpen`; indent sub-items beneath it.
- Each sub-item uses the icon + label from the table above.
- Active state: sub-item highlights when its exact route matches (same `isActive` logic).

### Router changes
Add three child routes under `/settings`:
```
/settings/environments  → EnvironmentsView (new)
/settings/preferences   → PreferencesView (new, placeholder ok initially)
/settings/platform      → PlatformView (new, placeholder ok initially)
```
Redirect `/settings` → `/settings/environments` as the default landing.

### Design constraints
- Sub-item rows: slightly smaller font (text-xs), indented ~12px, same hover/active style as mainNav.
- Icons: filled variant (`font-variation-settings: 'FILL' 1`) for active state, outlined for inactive.
- No external dependencies — pure CSS expand/collapse with Vue transition.
