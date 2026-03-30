---
phase: 8
slug: 08-dise-ar-flujos-de-integracion-usando-la-especificacion-de-requerimientos-de-documentations-feat02-md
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (portal: ^4.1.2, bff: ^4.1.2) |
| **Config file** | `apps/portal/vite.config.ts` (implicit), `apps/bff/vitest.config.ts` |
| **Quick run command** | `cd apps/portal && npm run test` |
| **Full suite command** | `npm run test` (root, all workspaces) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/bff && npx vitest run` and `cd apps/portal && npm run test`
- **After every plan wave:** Run `npm run test` (root)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 0 | FLOW-01 | unit | `cd apps/bff && npx vitest run src/routes/flows.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 0 | FLOW-02 | unit | `cd apps/portal && npm run test -- --reporter=verbose` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 0 | NODE-01 | unit | `cd apps/portal && npm run test` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | DATA-01 | unit | `cd apps/bff && npx vitest run src/routes/flows.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | RBAC-02 | unit | `cd apps/bff && npx vitest run src/routes/flows.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | FLOW-01 | unit | `cd apps/portal && npm run test` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | FLOW-02 | unit | `cd apps/portal && npm run test` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 3 | FLOW-02 | manual | Open designer, drag Validate node to canvas, verify Properties panel updates | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/bff/src/routes/flows.test.ts` — Zod schema unit tests for createFlowSchema, updateFlowSchema, saveFlowConfigSchema + RBAC assertions (follows `environments.test.ts` pattern)
- [ ] `apps/portal/src/stores/flowDesigner.test.ts` — Pinia store unit tests for sub-flow switching, node/edge updates, toPayload serialization
- [ ] Vue Flow CSS imports added to `apps/portal/src/style.css` — install step before canvas tests run

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop node from toolbox to canvas | FLOW-02 | Vue Flow DnD requires real DOM mouse events not reproducible in jsdom | Open designer at `/flows/:id/designer`, drag "Validate" node from toolbox, verify it appears on canvas with default position |
| Sub-flow tab switching preserves canvas state | FLOW-02 | Requires visual DOM state inspection | Switch from Incoming → Response → Incoming tabs, verify nodes/edges are preserved (uses `v-show` not `v-if`) |
| Properties panel updates on node selection | FLOW-02 | Requires real Vue Flow event system | Click a canvas node, verify Properties panel renders the node's config form |
| Delete flow confirmation dialog | FLOW-01 | Requires UI interaction testing | Click Delete on a flow card, verify modal shows "Delete Flow" / "Keep Flow" buttons, confirm deletion removes the flow from catalog |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
