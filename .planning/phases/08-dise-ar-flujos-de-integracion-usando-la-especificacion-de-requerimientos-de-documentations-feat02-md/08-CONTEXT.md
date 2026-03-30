# Phase 8: Integration Flow Designer - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning
**Source:** PRD Express Path (documentations/FEAT02.md)

<domain>
## Phase Boundary

This phase delivers the Integration Flow Designer: a catalog view for managing integration flows and a visual drag-and-drop designer for creating/editing them. Integration flows expose RESTful APIs that orchestrate business core services using the VETRO pattern (Validate, Enrich, Transform, Route, Operate) with a Pipe & Filter architecture. Each flow is composed of three sub-flows: Incoming, Response, and Exception.

This phase covers:
- Integration Flow Catalog (list with cards/table: id, name, description, tags, status + edit/delete)
- Integration Flow Designer (drag-and-drop filter builder per sub-flow type)
- Data model for persisting flow configurations to PostgreSQL
- BFF API routes for CRUD on integration flows
- Portal UI for catalog and designer views

</domain>

<decisions>
## Implementation Decisions

### Domain Model (Locked — from PRD)
- **Integration Flow** is the top-level entity: id, name, description, tags[], status
- **VETRO Pattern**: each flow executes steps to Validate, Enrich, Transform, Route, and Operate on a message
- **Flow Composition**: every flow has three sub-flows:
  - `IncomingFlow`: sequential filters executed on request receipt
  - `ResponseFlow`: sequential filters executed when returning a response
  - `ExceptionFlow`: sequential filters executed when IncomingFlow or ResponseFlow throws
- **Pipe**: connects two sequential filters (the mechanism linking filter nodes)
- **Filter**: a processing unit that executes transformation/processing logic on a message
- **Message**: the data payload transmitted between filters
- **API**: mechanism that exposes the integration flow as a RESTful service

### Integration Flow Catalog (Locked — from PRD)
- List view supporting both card layout and table layout
- Each item displays: id, name, description, tags (for search/filter), status
- Each item has Edit and Delete actions
- Supports filtering/searching by tags

### Integration Flow Designer (Locked — from PRD)
- Visual drag-and-drop canvas for building flows
- Users can drag filters onto the canvas and connect them via pipes
- Must support the three sub-flow types (Incoming, Response, Exception) — likely as tabs or sections within the designer
- Designer referenced in mockup: `documentations/images/integration_flow_design.png`

### Data Model (Locked — from PRD + Data Model in drawio)
- Refer to `documentations/apiportal.drawio` sheet "Data Model" for the conceptual model
- Flow configurations stored in PostgreSQL (JSON/JsonB for flexible filter configurations)

### Claude's Discretion
- Vue Flow vs React Flow vs custom SVG canvas for the drag-and-drop designer (Vue-based per REQUIREMENTS.md)
- Exact Prisma schema for IntegrationFlow, SubFlow, FilterNode, Pipe
- Filter node types to implement in this phase (Transform, Validate, Route per REQUIREMENTS.md §2.3)
- BFF route structure for flows CRUD
- State management pattern (Pinia store) for designer canvas state
- Whether designer is a separate page/route or a modal/panel in the catalog view

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PRD & Mockups
- `documentations/FEAT02.md` — Full feature specification: definitions, requirements, mockup reference
- `documentations/images/integration_flow_design.png` — Designer mockup (read as image)
- `documentations/apiportal.drawio` — Data model sheet "Data Model" — conceptual flow entity model

### Project Architecture
- `CLAUDE.md` — Monorepo structure, commands, BFF/Portal architecture, database setup
- `.planning/REQUIREMENTS.md` — Requirements §2.3 Integration Flows: flow types, pattern, nodes
- `.planning/ROADMAP.md` — Phase 4 (Visual Flow Designer Core) and Phase 5 (Node Library) for context overlap

### Existing Implementation Patterns
- `apps/bff/prisma/schema.prisma` — Existing Prisma schema to extend
- `apps/bff/src/routes/` — Existing BFF route patterns to follow
- `apps/portal/src/stores/` — Existing Pinia store patterns
- `packages/shared-types/index.ts` — Shared type definitions to extend

</canonical_refs>

<specifics>
## Specific Ideas

- **VETRO pattern** is the core execution model — filters in the flow implement one of: Validate, Enrich, Transform, Route, Operate
- **Three sub-flows per integration flow** — each flow must have Incoming, Response, and Exception sub-flow sections in the designer
- **Tags array** on each flow entity enables search/filtering in the catalog
- **Status field** on each flow (likely: DRAFT, ACTIVE, DEPRECATED or similar)
- Mockup at `documentations/images/integration_flow_design.png` shows the designer layout — reference it before planning the UI

</specifics>

<deferred>
## Deferred Ideas

- Gateway synchronization of flow configurations (covered by Phase 7 — Gateway Integration)
- Interactive testing / Try It functionality (covered by Phase 6 — Developer Portal)
- Kafka and other non-HTTP initial node types (mentioned in REQUIREMENTS.md §2.3 as future)

</deferred>

---

*Phase: 08-dise-ar-flujos-de-integracion-usando-la-especificacion-de-requerimientos-de-documentations-feat02-md*
*Context gathered: 2026-03-30 via PRD Express Path*
