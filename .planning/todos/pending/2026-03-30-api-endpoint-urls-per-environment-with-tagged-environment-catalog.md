---
created: 2026-03-30T00:48:55.346Z
title: API endpoint URLs per environment with tagged environment catalog
area: api
files:
  - apps/bff/prisma/schema.prisma
  - apps/bff/src/routes/apis.ts
  - apps/portal/src/views/ProjectDetail.vue
  - apps/portal/src/stores/registry.ts
  - packages/shared-types/index.ts
---

## Problem

APIs currently have no record of where they are deployed. Users need:

1. **Environment Catalog** — a global catalog of environments (e.g. DEV, QA, PROD) with:
   - `slug` (sigla única, e.g. "PRD")
   - `name` (descripción, e.g. "Production")
   - `tags[]` — lista de etiquetas con significado libre (e.g. "external", "ha", "eu-west") que se pueden añadir al registrar el entorno

2. **API Endpoint URLs per environment** — each `APIVersion` can have one or more endpoint registrations linking it to an environment with a base URL (e.g. `https://api.company.com/payments/v1`).

## Solution

### Database (Prisma schema)
Add two new models:

```prisma
model Environment {
  id          String   @id @default(cuid())
  slug        String   @unique  // e.g. "PRD"
  name        String            // e.g. "Production"
  tags        String[]          // e.g. ["external", "ha"]
  createdAt   DateTime @default(now())
  endpoints   APIEndpoint[]
}

model APIEndpoint {
  id            String      @id @default(cuid())
  apiVersionId  String
  environmentId String
  baseUrl       String      // e.g. https://api.company.com/payments/v1
  createdAt     DateTime    @default(now())
  apiVersion    APIVersion  @relation(fields: [apiVersionId], references: [id])
  environment   Environment @relation(fields: [environmentId], references: [id])
  @@unique([apiVersionId, environmentId])
}
```

### BFF routes
- `GET/POST /environments` — list and create environments (with tags).
- `PATCH /environments/:id` — update tags or metadata.
- `GET/POST /apis/:id/versions/:version/endpoints` — list and register endpoint URLs for a version.
- `DELETE /apis/:id/versions/:version/endpoints/:envId` — remove an endpoint registration.

### Shared types
Add `Environment` and `APIEndpoint` types to `packages/shared-types/index.ts`.

### Portal — Environment Catalog page (new view)
- New route `/settings/environments` (or `/environments`).
- Table of environments with slug, name, tags (chips).
- Inline "Add tag" input per row. Create/delete environment modal.

### Portal — ProjectDetail endpoint panel
- In the version detail section, add an "Endpoints" tab or card.
- Lists registered environments with their base URL.
- "Register endpoint" button opens a modal: select environment from catalog + enter URL.
- Only editable when version status is not RETIRED.
