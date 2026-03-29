# Seed: SEED-001-api-design-studio

## Meta
- **Slug:** api-design-studio
- **Author:** Gemini CLI
- **Date:** 2026-03-29
- **Status:** Planted
- **Priority:** Medium
- **Tags:** [ui, designer, openapi, phase-3]

## The Idea
Implement a visual API Design Studio (Studio) that allows designers to define RESTful HTTP/JSON APIs using a modern, node-based visual approach fully aligned with the OpenAPI specification.

### Why it's too big for now
Phase 1 and 2 focus on foundation, identity, and basic CRUD API management. A full-blown visual designer with a canvas, palette, and properties panel requires a mature UI framework (likely a node-link library like Vue Flow or similar) and a stable backend for serializing these designs.

### When to surface
- **Milestone:** v1.1 or v2.0
- **Phase:** Phase 3 (Visual Flow Designer Core) or Phase 4 (Node Library).
- **Trigger:** When Phase 2 (API Registry) is completed and we need to move beyond simple metadata management.

## Details & Breadcrumbs
- **Source:** `documentations/FEAT01.md`
- **Key Components:**
  - Canvas-based visual interface.
  - Node palette (OpenAPI operations, schemas).
  - Properties panel for node configuration.
  - OpenAPI import/export capabilities.
  - Validation engine for API designs.

## Success Criteria (Future)
- A designer can create a complete OpenAPI-compliant API definition visually without writing YAML.
- Existing OpenAPI specs can be imported and rendered on the canvas.
- Real-time validation of the API design.
