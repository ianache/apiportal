# Phase 8: Integration Flow Designer - Research

**Researched:** 2026-03-30
**Domain:** Vue Flow drag-and-drop canvas, Prisma schema extension, Fastify CRUD routes, Pinia state management
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Domain Model (Locked — from PRD)**
- Integration Flow is the top-level entity: id, name, description, tags[], status
- VETRO Pattern: each flow executes steps to Validate, Enrich, Transform, Route, and Operate on a message
- Flow Composition: every flow has three sub-flows:
  - `IncomingFlow`: sequential filters executed on request receipt
  - `ResponseFlow`: sequential filters executed when returning a response
  - `ExceptionFlow`: sequential filters executed when IncomingFlow or ResponseFlow throws
- Pipe: connects two sequential filters (the mechanism linking filter nodes)
- Filter: a processing unit that executes transformation/processing logic on a message
- Message: the data payload transmitted between filters
- API: mechanism that exposes the integration flow as a RESTful service

**Integration Flow Catalog (Locked — from PRD)**
- List view supporting both card layout and table layout
- Each item displays: id, name, description, tags (for search/filter), status
- Each item has Edit and Delete actions
- Supports filtering/searching by tags

**Integration Flow Designer (Locked — from PRD)**
- Visual drag-and-drop canvas for building flows
- Users can drag filters onto the canvas and connect them via pipes
- Must support the three sub-flow types (Incoming, Response, Exception) — likely as tabs or sections within the designer
- Designer referenced in mockup: `documentations/images/integration_flow_design.png`

**Data Model (Locked — from PRD + Data Model in drawio)**
- Refer to `documentations/apiportal.drawio` sheet "Data Model" for the conceptual model
- Flow configurations stored in PostgreSQL (JSON/JsonB for flexible filter configurations)

### Claude's Discretion
- Vue Flow vs React Flow vs custom SVG canvas for the drag-and-drop designer (Vue-based per REQUIREMENTS.md)
- Exact Prisma schema for IntegrationFlow, SubFlow, FilterNode, Pipe
- Filter node types to implement in this phase (Transform, Validate, Route per REQUIREMENTS.md §2.3)
- BFF route structure for flows CRUD
- State management pattern (Pinia store) for designer canvas state
- Whether designer is a separate page/route or a modal/panel in the catalog view

### Deferred Ideas (OUT OF SCOPE)
- Gateway synchronization of flow configurations (covered by Phase 7 — Gateway Integration)
- Interactive testing / Try It functionality (covered by Phase 6 — Developer Portal)
- Kafka and other non-HTTP initial node types (mentioned in REQUIREMENTS.md §2.3 as future)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-01 | Integration Flow catalog — list (card + table), tags filter, edit/delete actions | BFF CRUD routes pattern, Pinia store pattern, Vue component patterns from portal |
| FLOW-02 | Integration Flow designer — drag-and-drop canvas, Incoming/Response/Exception sub-flow tabs, filter nodes (Validate/Enrich/Transform/Route/Operate), pipe connections | Vue Flow 1.48.2 DnD pattern, useVueFlow composable, custom node components |
| NODE-01 | VETRO filter node types — Validate, Enrich, Transform, Route, Operate — as distinct draggable node types in the toolbox | Vue Flow custom node type registration, node data shape |
| DATA-01 | Persist integration flow configurations to PostgreSQL | Prisma schema extension with IntegrationFlow model, JsonB for sub-flow configs |
| RBAC-02 | Only API_DESIGNER and API_MANAGER can create/edit flows; API_DEVELOPER has read-only access | Follows existing RBAC pattern in BFF routes |
</phase_requirements>

---

## Summary

Phase 8 delivers two main capabilities: (1) an Integration Flow Catalog page for browsing and managing flows, and (2) a visual Integration Flow Designer for building flows using the Pipe & Filter / VETRO pattern with drag-and-drop filter nodes. The mockup (`documentations/images/integration_flow_design.png`) shows a three-panel layout: a left Toolbox panel with draggable node types, a center canvas area with drag-and-drop interaction, and a right Properties panel for selected node configuration. The canvas is divided into three sub-flow sections navigated by tabs: Incoming, Response, and Exception.

The canonical Vue 3 library for this use case is **Vue Flow** (`@vue-flow/core` v1.48.2). It is purpose-built for Vue 3, actively maintained, and provides built-in zoom/pan, drag-and-drop node creation, custom node components, edge connections, and a Pinia-compatible state model. It is the only serious Vue 3 native graph/flow editor library with production-level documentation and a demonstrated DnD-from-sidebar pattern.

On the data side, the existing `APIVersion.flowConfig Json?` column in Prisma foreshadows a flow storage approach but is insufficient for the Phase 8 domain model. IntegrationFlow must be a **top-level entity independent of APIVersion** with a relationship to it. Sub-flow configurations (nodes + edges per sub-flow) should use JsonB fields since the VETRO filter configuration schemas differ per node type and benefit from schema flexibility.

**Primary recommendation:** Use `@vue-flow/core` v1.48.2 for the canvas with three separate Vue Flow instances (one per sub-flow tab). Store flow topology as JsonB per sub-flow in Prisma. Follow the existing Fastify + Zod + Prisma route pattern from `environments.ts` and the Pinia store pattern from `registry.ts`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@vue-flow/core` | 1.48.2 | Drag-and-drop node graph canvas for Vue 3 | Only production-grade Vue 3 native flow editor; built by the same team as Revue Draggable; Vue 3 exclusive |
| `@vue-flow/background` | 1.3.2 | Dot/line grid background for canvas | Official companion package |
| `@vue-flow/controls` | 1.1.3 | Zoom in/out/fit-view control panel | Official companion package |
| `@vue-flow/minimap` | 1.5.4 | Overview minimap in corner | Official companion package (optional for this phase) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` (already installed) | ^4.3.6 | BFF route body validation | Always — existing pattern in all routes |
| `@prisma/client` (already installed) | ^6.4.1 | Prisma queries for IntegrationFlow | Always |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vue-flow/core` | Custom SVG canvas | Vue Flow saves months of work; hand-rolling misses zoom/pan/snap/selection edge cases |
| `@vue-flow/core` | React Flow | React Flow is React-only; incompatible with Vue 3 |
| `@vue-flow/core` | `flowchart-vue` | Unmaintained; no TypeScript types; poor node customization |
| Per-sub-flow `VueFlow` instances | Single canvas with partitions | Separate instances map cleanly to the Incoming/Response/Exception data model and allow independent serialization |

**Installation:**
```bash
cd apps/portal
npm install @vue-flow/core @vue-flow/background @vue-flow/controls
```

**Version verification (confirmed via npm registry 2026-03-30):**
- `@vue-flow/core`: 1.48.2 (latest)
- `@vue-flow/background`: 1.3.2 (latest)
- `@vue-flow/controls`: 1.1.3 (latest)
- `@vue-flow/minimap`: 1.5.4 (latest, optional)

---

## Architecture Patterns

### Recommended Project Structure

```
apps/portal/src/
├── views/
│   ├── IntegrationFlows.vue        # Catalog page (card/table list + tag filter)
│   └── IntegrationFlowDesigner.vue # Designer page (full-screen canvas)
├── components/
│   └── flow/
│       ├── FlowToolbox.vue         # Left panel: draggable node types
│       ├── FlowCanvas.vue          # Center: VueFlow canvas wrapper + drop handler
│       ├── FlowNodeProperties.vue  # Right panel: selected node property form
│       ├── nodes/
│       │   ├── ValidateNode.vue    # Custom VueFlow node component
│       │   ├── EnrichNode.vue
│       │   ├── TransformNode.vue
│       │   ├── RouteNode.vue
│       │   └── OperateNode.vue
│       └── FlowSubFlowTabs.vue     # Tab switcher (Incoming/Response/Exception)
├── stores/
│   └── flowDesigner.ts             # Pinia store for designer state
└── router/index.ts                 # Add /flows and /flows/:id/designer routes

apps/bff/src/
├── routes/
│   └── flows.ts                    # Fastify plugin: CRUD for IntegrationFlow

packages/shared-types/
└── index.ts                        # Add IntegrationFlow, SubFlowType, FilterNodeType
```

### Pattern 1: Vue Flow Canvas Setup

**What:** Wrap `<VueFlow>` with registered custom node types and handle the connect event to add edges.

**When to use:** In `FlowCanvas.vue` — one instance per sub-flow tab.

```typescript
// Source: https://vueflow.dev/guide/vue-flow/config.html
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// In component setup:
const { onConnect, addEdges } = useVueFlow()
onConnect((params) => addEdges(params))

const nodeTypes = {
  validate: ValidateNode,
  enrich: EnrichNode,
  transform: TransformNode,
  route: RouteNode,
  operate: OperateNode,
}
```

```vue
<!-- Source: https://vueflow.dev/guide/getting-started.html -->
<VueFlow
  :nodes="nodes"
  :edges="edges"
  :node-types="nodeTypes"
  @nodes-change="onNodesChange"
  @edges-change="onEdgesChange"
>
  <Background />
  <Controls />
</VueFlow>
```

### Pattern 2: Drag-and-Drop from Toolbox

**What:** HTML5 native drag events on toolbox items + `onDrop` handler on the canvas that converts screen coordinates to canvas coordinates via `screenToFlowCoordinate`.

**When to use:** In `FlowToolbox.vue` (drag source) and `FlowCanvas.vue` (drop target).

```typescript
// Source: https://vueflow.dev/typedocs/interfaces/Actions.html
// FlowToolbox.vue — drag source
function onDragStart(event: DragEvent, nodeType: string) {
  event.dataTransfer!.setData('application/vueflow', nodeType)
  event.dataTransfer!.effectAllowed = 'move'
}

// FlowCanvas.vue — drop target
const { screenToFlowCoordinate, addNodes } = useVueFlow()

function onDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('application/vueflow')
  if (!nodeType) return

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })

  addNodes([{
    id: `${nodeType}-${Date.now()}`,
    type: nodeType,
    position,
    data: { label: nodeType, config: {} },
  }])
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}
```

### Pattern 3: Pinia Store for Designer State

**What:** A Pinia store that holds the three sub-flows' nodes/edges and the active flow metadata. The store is the source of truth; Vue Flow reads from it reactively.

**When to use:** `stores/flowDesigner.ts` — consumed by `FlowCanvas.vue` and `FlowNodeProperties.vue`.

```typescript
// Source: https://vueflow.dev/examples/pinia.html + existing registry.ts pattern
import { defineStore } from 'pinia'
import type { Node, Edge } from '@vue-flow/core'
import type { SubFlowType, IntegrationFlow } from 'shared-types'

export const useFlowDesignerStore = defineStore('flowDesigner', {
  state: () => ({
    flow: null as IntegrationFlow | null,
    activeSubFlow: 'incoming' as SubFlowType,
    subFlows: {
      incoming: { nodes: [] as Node[], edges: [] as Edge[] },
      response: { nodes: [] as Node[], edges: [] as Edge[] },
      exception: { nodes: [] as Node[], edges: [] as Edge[] },
    },
    selectedNodeId: null as string | null,
    loading: false,
    error: null as string | null,
  }),
  getters: {
    activeNodes: (state) => state.subFlows[state.activeSubFlow].nodes,
    activeEdges: (state) => state.subFlows[state.activeSubFlow].edges,
    selectedNode: (state) => {
      if (!state.selectedNodeId) return null
      return state.subFlows[state.activeSubFlow].nodes
        .find(n => n.id === state.selectedNodeId) ?? null
    },
  },
  actions: {
    setActiveSubFlow(type: SubFlowType) {
      this.activeSubFlow = type
    },
    updateNodes(nodes: Node[]) {
      this.subFlows[this.activeSubFlow].nodes = nodes
    },
    updateEdges(edges: Edge[]) {
      this.subFlows[this.activeSubFlow].edges = edges
    },
    // serialize for persistence
    toPayload() {
      return {
        incomingFlow: this.subFlows.incoming,
        responseFlow: this.subFlows.response,
        exceptionFlow: this.subFlows.exception,
      }
    },
    // ... fetchFlow, saveFlow, etc.
  }
})
```

### Pattern 4: BFF Route for Integration Flows

**What:** `flows.ts` Fastify plugin following the exact same structure as `environments.ts` — Zod schemas at top, FastifyPluginAsync function, RBAC checks, Prisma queries.

**When to use:** In `apps/bff/src/routes/flows.ts`, registered in `app.ts`.

```typescript
// Pattern: follows apps/bff/src/routes/environments.ts exactly
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const createFlowSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
})

const updateFlowSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED']).optional(),
})

const saveFlowConfigSchema = z.object({
  incomingFlow: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }),
  responseFlow: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }),
  exceptionFlow: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }),
})

const flowRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /flows, GET /flows/:id, POST /flows,
  // PATCH /flows/:id, DELETE /flows/:id
  // PUT /flows/:id/config (save canvas state)
}

export default flowRoutes
```

### Pattern 5: Custom Node Component

**What:** A Vue SFC that Vue Flow renders in place of a default node. Uses `<Handle>` components to define connection points.

**When to use:** One component per VETRO filter type.

```vue
<!-- Source: https://vueflow.dev/guide/getting-started.html (node-special slot pattern) -->
<!-- apps/portal/src/components/flow/nodes/TransformNode.vue -->
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
defineProps<{ data: { label: string; config: Record<string, any> } }>()
</script>

<template>
  <div class="flow-node flow-node--transform">
    <Handle type="target" :position="Position.Left" />
    <div class="node-label">{{ data.label }}</div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
```

### Anti-Patterns to Avoid

- **Using a single VueFlow instance for all three sub-flows with filtering:** Makes serialization complex and risks state leakage between sub-flows. Use three separate instances, one per tab.
- **Storing Vue Flow `Node` objects directly in Pinia without extracting only the serializable parts:** Vue Flow Node objects contain internal reactive references. Serialize only `id`, `type`, `position`, and `data` for persistence.
- **Putting flow config in `APIVersion.flowConfig`:** The CONTEXT.md domain model says IntegrationFlow is a top-level entity, not attached to APIVersion. Do not reuse the existing `flowConfig` field.
- **Calling `useVueFlow()` outside a Vue component tree or before the `<VueFlow>` component mounts:** Always use within a component `setup()` or inside the `<VueFlow>` subtree.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Node graph canvas with zoom/pan | Custom SVG/canvas drag system | `@vue-flow/core` | Vue Flow handles hit-testing, viewport transforms, minimap, keyboard shortcuts, touch support |
| Coordinate conversion for DnD | Manual `getBoundingClientRect` math | `screenToFlowCoordinate()` from `useVueFlow()` | Accounts for current zoom level and pan offset automatically |
| Edge connection handles | Custom SVG circles with mouse events | `<Handle>` component from `@vue-flow/core` | Handles connection validation, port type (source/target), and snapping |
| Node selection state | Custom click handlers + ref tracking | Vue Flow built-in selection (`selected` prop on nodes) | Multi-select, keyboard deselect all built-in |

**Key insight:** Building a flow canvas from scratch requires handling viewport transforms, hit testing, edge routing, connection handles, and zoom/pan — all of which Vue Flow solves. Custom SVG canvas would take weeks and remain fragile.

---

## Prisma Schema Extension

### Recommended Schema

Add to `apps/bff/prisma/schema.prisma`:

```prisma
enum FlowStatus {
  DRAFT
  ACTIVE
  DEPRECATED
}

model IntegrationFlow {
  id           String     @id @default(uuid())
  name         String     @unique
  description  String?
  tags         String[]
  status       FlowStatus @default(DRAFT)
  // Sub-flow configurations stored as JsonB
  // Each contains: { nodes: Node[], edges: Edge[] }
  // where Node = { id, type, position, data } and Edge = { id, source, target }
  incomingFlow Json?      @db.JsonB
  responseFlow Json?      @db.JsonB
  exceptionFlow Json?     @db.JsonB
  createdBy    String
  creator      User       @relation("FlowCreator", fields: [createdBy], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

Also add to `User` model:
```prisma
createdFlows IntegrationFlow[] @relation("FlowCreator")
```

**Rationale for JsonB per sub-flow (not a separate table):**
- The node/edge topology changes frequently during design; JsonB avoids N+1 queries for loading a flow
- Node configuration schemas differ per VETRO type (a Validate node has different config fields than a Route node) — JsonB handles schema heterogeneity cleanly
- The existing `APIVersion.flowConfig Json?` field confirms this project has already adopted JsonB for flow data
- A relational `FilterNode` table would require a migration for every new node property field

### Migration command

```bash
cd apps/bff
npx prisma migrate dev --name add-integration-flow
npx prisma generate
```

---

## Shared Types to Add

Add to `packages/shared-types/index.ts`:

```typescript
export type FlowStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
export type SubFlowType = 'incoming' | 'response' | 'exception';
export type FilterNodeType = 'validate' | 'enrich' | 'transform' | 'route' | 'operate';

export interface FlowNodeData {
  label: string;
  nodeType: FilterNodeType;
  config: Record<string, any>; // node-type-specific properties
}

export interface SubFlowConfig {
  nodes: Array<{
    id: string;
    type: FilterNodeType;
    position: { x: number; y: number };
    data: FlowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

export interface IntegrationFlow {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  status: FlowStatus;
  incomingFlow?: SubFlowConfig;
  responseFlow?: SubFlowConfig;
  exceptionFlow?: SubFlowConfig;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Phase 4 and Phase 5 Overlap Analysis

**Conclusion: Phase 8 SUPERSEDES Phases 4 and 5 for the Integration Flow domain.**

From `ROADMAP.md`:
- Phase 4 "Visual Flow Designer Core" — goal: build Integration Flow canvas with Incoming/Response/Exception flows
- Phase 5 "Node Library & Properties" — goal: implement Transform, Validate, Route node types

Phase 8 was added later (see STATE.md) and given a full PRD (FEAT02.md) with explicit requirements. Phase 4 and Phase 5 have 0 plans and are `Not started`. Phase 8 covers everything Phases 4 and 5 were scoped to do:
- Full drag-and-drop canvas (Phase 4's goal)
- VETRO node types including Transform/Validate/Route (Phase 5's goal)
- Plus: Catalog, persistence, CRUD API

**Planning implication:** The planner should treat Phase 8 as a self-contained delivery of what Phases 4 and 5 described. Do not plan Phase 8 as a continuation of work from Phase 4 (there is no Phase 4 work to continue). Phases 4 and 5 can be marked as superseded by Phase 8 in the roadmap.

---

## Common Pitfalls

### Pitfall 1: Vue Flow CSS Not Imported

**What goes wrong:** Canvas renders with no handles, edges draw incorrectly, nodes overlap.
**Why it happens:** Vue Flow requires two CSS imports that are not auto-loaded.
**How to avoid:** Add to `apps/portal/src/style.css` or directly in `FlowCanvas.vue`:
```css
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
```
**Warning signs:** Nodes appear without handles; edges are invisible.

### Pitfall 2: Serializing Vue Flow Internal State Directly

**What goes wrong:** Saving reactive Vue Flow Node objects to the store or API results in circular reference errors or oversized JSON payloads.
**Why it happens:** Vue Flow's internal Node objects contain reactive proxies and internal tracking fields.
**How to avoid:** When saving, use `toObject()` from `useVueFlow()` to get a clean serializable snapshot:
```typescript
const { toObject } = useVueFlow()
const snapshot = toObject() // { nodes, edges, viewport } — all plain objects
```
**Warning signs:** `JSON.stringify` throws or produces huge payloads.

### Pitfall 3: `useVueFlow()` Called in Wrong Scope

**What goes wrong:** Runtime error "No VueFlow instance found" when calling `useVueFlow()`.
**Why it happens:** `useVueFlow()` must be called inside a component that is a descendant of `<VueFlow>`, or with the same `id` prop to target the correct instance.
**How to avoid:** Pass an `id` to `<VueFlow id="incoming-flow">` and call `useVueFlow('incoming-flow')` in child components. Or keep all `useVueFlow()` calls in the direct parent of `<VueFlow>`.
**Warning signs:** Console error about missing VueFlow instance.

### Pitfall 4: Three Sub-Flow Tabs Destroying/Recreating Canvas

**What goes wrong:** Using `v-if` to switch between sub-flow tabs destroys Vue Flow state on tab change, losing unsaved node positions.
**Why it happens:** `v-if` unmounts and remounts the component, reinitializing Vue Flow state.
**How to avoid:** Use `v-show` to hide/show sub-flow canvases while keeping them mounted:
```vue
<FlowCanvas v-show="activeSubFlow === 'incoming'" sub-flow="incoming" />
<FlowCanvas v-show="activeSubFlow === 'response'" sub-flow="response" />
<FlowCanvas v-show="activeSubFlow === 'exception'" sub-flow="exception" />
```
**Warning signs:** Node positions reset when switching tabs.

### Pitfall 5: Missing `onDragOver` preventDefault

**What goes wrong:** Drop event never fires on the canvas.
**Why it happens:** The browser's default behavior prevents drops on non-droppable elements unless `event.preventDefault()` is called in `dragover`.
**How to avoid:** Always attach `@dragover.prevent` or call `event.preventDefault()` in the `onDragOver` handler on the canvas element.
**Warning signs:** `onDrop` never fires even though `onDragStart` works.

### Pitfall 6: RBAC on Flow Config Save Route

**What goes wrong:** API_DEVELOPER users can overwrite flow configurations.
**Why it happens:** Missing RBAC check on the `PUT /flows/:id/config` route.
**How to avoid:** Follow the same RBAC guard pattern from `environments.ts` — check `request.user?.role` before write operations. API_DEVELOPER gets 403 on POST/PATCH/DELETE/PUT routes.

---

## Code Examples

### Vue Flow Sub-Flow Canvas Component (Pattern)

```typescript
// Source: https://vueflow.dev/guide/composables.html
// apps/portal/src/components/flow/FlowCanvas.vue
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useFlowDesignerStore } from '@/stores/flowDesigner'

const props = defineProps<{ subFlow: 'incoming' | 'response' | 'exception' }>()
const store = useFlowDesignerStore()
const { onConnect, addEdges, screenToFlowCoordinate, addNodes, toObject } = useVueFlow(props.subFlow)

onConnect((params) => {
  addEdges(params)
  store.subFlows[props.subFlow].edges = /* sync back */
})

function onDrop(event: DragEvent) {
  event.preventDefault()
  const nodeType = event.dataTransfer?.getData('application/vueflow')
  if (!nodeType) return
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  addNodes([{
    id: `${nodeType}-${Date.now()}`,
    type: nodeType,
    position,
    data: { label: nodeType, nodeType, config: {} },
  }])
}

function onNodesChange(changes: any) {
  // apply changes then sync to store for persistence
}
```

### BFF Flow Routes (Structural Pattern)

```typescript
// Pattern mirrors apps/bff/src/routes/environments.ts
// apps/bff/src/routes/flows.ts
const flowRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /flows — list with optional ?tags= query param filter
  fastify.get('/flows', async (request) => {
    const { tags } = request.query as { tags?: string }
    const where = tags
      ? { tags: { hasSome: tags.split(',') } }
      : {}
    return fastify.prisma.integrationFlow.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })
  })

  // GET /flows/:id — single flow with full config
  // POST /flows — create (RBAC: API_DESIGNER or API_MANAGER only)
  // PATCH /flows/:id — update metadata (RBAC guard)
  // DELETE /flows/:id — delete (RBAC guard)
  // PUT /flows/:id/config — save canvas state { incomingFlow, responseFlow, exceptionFlow }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useVueFlow().project()` for coordinate conversion | `useVueFlow().screenToFlowCoordinate()` | Vue Flow ~v1.20+ | Old `project()` still works as alias but new API is clearer |
| Single `v-model:nodes` / `v-model:edges` props | Explicit `@nodes-change` / `@edges-change` events + controlled state | Vue Flow v1.0+ | Controlled flow pattern is preferred for Pinia integration |

**Deprecated/outdated:**
- `useVueFlow().project()`: Works but `screenToFlowCoordinate()` is the documented current name
- `<BezierEdge>` direct import: Now accessed through edge type configuration

---

## Open Questions

1. **DrawIO data model alignment**
   - What we know: CONTEXT.md references `documentations/apiportal.drawio` sheet "Data Model" as authoritative
   - What's unclear: The drawio file exists but cannot be parsed in this research pass; it may specify additional fields on IntegrationFlow (e.g., an HTTP method/path for the API exposure mechanism)
   - Recommendation: The planner should instruct implementers to open the drawio file in draw.io and verify the IntegrationFlow entity fields before finalizing the Prisma schema

2. **Flow-to-APIVersion relationship**
   - What we know: PRD says "API: mechanism that exposes an integration flow as a RESTful service" suggesting flows are related to APIs
   - What's unclear: Whether IntegrationFlow should have a direct FK to `APIVersion` or be a standalone entity (Phase 7 Gateway sync may establish this link)
   - Recommendation: Keep IntegrationFlow standalone for Phase 8 (no FK to APIVersion); the Gateway sync in Phase 7 can add the link. This unblocks Phase 8 from being blocked by Phase 7.

3. **Phase 8 depends on Phase 7 (per ROADMAP.md) but Phase 7 is not implemented**
   - What we know: ROADMAP.md says Phase 8 "Depends on: Phase 7" but Phases 4-7 are all not started
   - What's unclear: Whether Phase 8 can be delivered independently
   - Recommendation: Phase 8 can stand alone. The dependency was likely about Gateway sync, which is explicitly deferred. Plan Phase 8 as a self-contained feature.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install, BFF | ✓ | v22.14.0 | — |
| npm | Package install | ✓ | (present) | — |
| PostgreSQL | Prisma migrations | Must be running manually (no Docker per CLAUDE.md) | — | Documented in CLAUDE.md |
| `@vue-flow/core` | Portal canvas | ✗ (not yet installed) | — | No fallback — must install |
| `@vue-flow/background` | Portal canvas | ✗ (not yet installed) | — | No fallback — must install |
| `@vue-flow/controls` | Portal canvas | ✗ (not yet installed) | — | No fallback — must install |

**Missing dependencies with no fallback:**
- `@vue-flow/core`, `@vue-flow/background`, `@vue-flow/controls` — install in Wave 0 of planning

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (portal: ^4.1.2, bff: ^4.1.2) |
| Config file | `apps/portal/vite.config.ts` (implicit), `apps/bff/vitest.config.ts` (if present) |
| Quick run command | `cd apps/portal && npm run test` |
| Full suite command | `npm run test` (root, all workspaces) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-01 | IntegrationFlow Zod schema validation (create/update) | unit | `cd apps/bff && npx vitest run src/routes/flows.test.ts` | ❌ Wave 0 |
| FLOW-02 | FlowDesigner store: sub-flow switching, node update, edge update, serialization | unit | `cd apps/portal && npm run test -- --reporter=verbose` | ❌ Wave 0 |
| NODE-01 | VETRO node type enum validates correctly in shared-types | unit | `cd apps/portal && npm run test` | ❌ Wave 0 |
| DATA-01 | BFF route accepts valid flow config and rejects invalid | unit | `cd apps/bff && npx vitest run src/routes/flows.test.ts` | ❌ Wave 0 |
| RBAC-02 | API_DEVELOPER gets 403 on POST/PATCH/DELETE flow routes | unit | `cd apps/bff && npx vitest run src/routes/flows.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd apps/bff && npx vitest run` and `cd apps/portal && npm run test`
- **Per wave merge:** `npm run test` (root)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/bff/src/routes/flows.test.ts` — Zod schema unit tests for createFlowSchema, updateFlowSchema, saveFlowConfigSchema + RBAC assertions (follows `environments.test.ts` pattern)
- [ ] `apps/portal/src/stores/flowDesigner.test.ts` — Pinia store unit tests for sub-flow switching, node/edge updates, toPayload serialization
- [ ] Vue Flow CSS imports in `apps/portal/src/style.css` — install step before canvas tests

---

## Project Constraints (from CLAUDE.md)

| Constraint | Detail |
|-----------|--------|
| Monorepo | npm workspaces: `apps/portal`, `apps/bff`, `packages/shared-types` |
| Frontend stack | Vue 3 + Pinia + Vue Router + Tailwind CSS v4 |
| Backend stack | Fastify 5 + Prisma 6 + Zod 4 + openid-client |
| Auth | Keycloak OIDC; roles: `API-Manager`, `API-Designer`, `API-Developer` |
| Database | PostgreSQL via Prisma; no Docker — start manually |
| Dev server | `npm run dev:bff` (port 3000), `npm run dev:portal` (Vite) |
| Shared types | Both portal and bff import from `'shared-types'` — update `packages/shared-types/index.ts` |
| After schema changes | Run `npx prisma migrate dev` then `npx prisma generate` |
| BFF unauthenticated mode | In dev, OIDC failure starts server without auth (does not throw) |
| No forbidden patterns | No custom SVG canvas when a library solves the problem |

---

## Sources

### Primary (HIGH confidence)
- `@vue-flow/core` npm registry (confirmed v1.48.2 current, 2026-03-30)
- `@vue-flow/background` npm registry (confirmed v1.3.2)
- `@vue-flow/controls` npm registry (confirmed v1.1.3)
- `@vue-flow/minimap` npm registry (confirmed v1.5.4)
- https://vueflow.dev/guide/getting-started.html — installation, node setup, CSS requirements
- https://vueflow.dev/guide/vue-flow/config.html — VueFlow component props, node-types registration
- https://vueflow.dev/typedocs/interfaces/Actions.html — screenToFlowCoordinate, addNodes, addEdges, toObject
- https://vueflow.dev/guide/composables.html — useVueFlow, useHandleConnections, useNodeId
- `apps/bff/src/routes/environments.ts` — canonical BFF route pattern (Zod + Prisma + RBAC)
- `apps/portal/src/stores/registry.ts` — canonical Pinia store pattern
- `apps/bff/prisma/schema.prisma` — existing schema to extend
- `packages/shared-types/index.ts` — existing types to extend
- `documentations/FEAT02.md` — PRD domain definitions and requirements
- `documentations/images/integration_flow_design.png` — mockup (three-panel: Toolbox / Canvas / Properties)

### Secondary (MEDIUM confidence)
- https://vueflow.dev/examples/pinia.html — Pinia + Vue Flow integration pattern (state agnostic)
- https://vueflow.dev/examples/dnd.html — DnD from sidebar pattern description (code not extractable from page)
- https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields — JsonB usage pattern

### Tertiary (LOW confidence)
- None — all critical claims verified against official sources

---

## Metadata

**Confidence breakdown:**
- Standard stack (Vue Flow): HIGH — verified via npm registry + official docs
- Architecture patterns: HIGH — derived from existing codebase conventions + Vue Flow official docs
- Prisma schema design: MEDIUM — based on PRD requirements and existing schema patterns; drawio file not parsed
- Pitfalls: HIGH — verified against Vue Flow documentation and common Vue reactivity rules

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (Vue Flow is stable; versions unlikely to change within 30 days)
