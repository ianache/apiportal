<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | Polish the Portal UX with renamed nav labels, Settings submenu, inline metadata editing, new version creation flow, version status filtering. | Supported by Vue Router subroutes, debounced inputs, and new Fastify endpoints for creating versions/patching API. |
| ENV-01 | API endpoint URLs displayed per environment | Supported by new Prisma models `Environment` and `APIEndpoint`. |
| ENV-02 | Tagged environment catalog (e.g., dev, staging, prod) | Supported by Prisma model `Environment` with unique `tag` field. |
</phase_requirements>

# Phase 03: Portal UX Polish & Environment Catalog - Research

**Researched:** 2026-03-30
**Domain:** Frontend UI / API Lifecycle Management
**Confidence:** HIGH

## Summary

This phase polishes the Control Plane Portal UX and introduces the Environment Catalog. A primary UI update is the renaming of "Projects" to "APIs Catalog" across navigation and views. The Settings menu will expand into a nested submenu (Environments, Preferences, Platform). On the API Management side, inline editing for API metadata and API version creation are introduced in the detail view, alongside version filtering and sorting.

Finally, an Environment Catalog is built to track different target environments (e.g., dev, staging, prod) and assign specific API Endpoint URLs for a published API Version in each environment.

**Primary recommendation:** Implement the rename and UI nested routing first, followed by Prisma schema updates for Environments, concluding with BFF endpoint additions and the corresponding frontend API calls.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue | ^3.5.30 | UI Framework | Project's established frontend standard |
| Vue Router | ^5.0.4 | Client-side routing | Native to Vue ecosystem, handles nested submenus perfectly |
| Fastify | ^5.2.1 | API Framework | Standard project BFF backend |
| Prisma | ^6.4.1 | Database ORM | Declarative state management, cascade deletions for endpoints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Nested Vue Routes | Single huge component | Subroutes enable direct deep-linking (e.g., `/settings/platform`) and maintain clean component boundaries. |
| Debounced Auto-Save | Manual Save button | Auto-save offers a superior UX, fitting a modern Control Plane, although it requires careful state synchronization. |

## Architecture Patterns

### Recommended Project Structure
```
apps/portal/src/
├── views/
│   ├── ApisCatalog.vue        # Renamed from Projects.vue
│   ├── ApiDetail.vue          # Renamed from ProjectDetail.vue
│   └── settings/
│       ├── Layout.vue         # Settings shell
│       ├── Environments.vue   # Environment catalog
│       ├── Preferences.vue    # User prefs
│       └── Platform.vue       # Platform config
```

### Pattern 1: Nested Router for Settings Submenus
**What:** Define child routes in Vue Router for the Settings sections.
**When to use:** When navigating a multi-tab view where each tab has unique logic and should be linkable.
**Example:**
```typescript
{
  path: '/settings',
  component: () => import('../views/settings/Layout.vue'),
  children: [
    { path: '', redirect: '/settings/environments' },
    { path: 'environments', component: () => import('../views/settings/Environments.vue') },
    { path: 'preferences', component: () => import('../views/settings/Preferences.vue') },
    { path: 'platform', component: () => import('../views/settings/Platform.vue') }
  ]
}
```

### Anti-Patterns to Avoid
- **Orphaned Endpoints:** Failing to cascade deletions from Environments/APIVersions to APIEndpoints in the database.
- **Stale Global State:** Patching the API metadata via BFF but forgetting to refresh the Pinia registry store, leading to mismatched UI data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route active state | Custom JS matching | `router-link-active` classes or Vue Router's `isActive()` | Vue Router natively handles hierarchical nested matching for submenus. |
| Cascade Deletions | Application logic | Prisma `@relation(onDelete: Cascade)` | Prevents orphaned `APIEndpoint` records at the database level when an Environment is removed. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — backend schema uses `API` and `APIVersion` | None |
| Live service config | None — strictly UI labels and Vue routes | None |
| OS-registered state | None — entirely frontend and BFF | None |
| Secrets/env vars | None — no "Projects" references | None |
| Build artifacts | `apps/portal/dist/assets/Projects*.js` chunk name | Clean and rebuild frontend |

## Common Pitfalls

### Pitfall 1: Breaking Navigation Links and Guards
**What goes wrong:** Changing `/projects` to `/apis-catalog` orphans breadcrumb navigation and potential auth redirection targets.
**Why it happens:** Incomplete rename sweeping across Vue files.
**How to avoid:** Use regex search for `to="/projects"` and `router.push('/projects')` to catch all imperative and declarative navigation instances.

### Pitfall 2: Race Conditions in Auto-Save
**What goes wrong:** A user types quickly, the auto-save triggers multiple BFF requests out of order, and the final state is an older payload.
**Why it happens:** Missing debouncing on the inline input elements.
**How to avoid:** Implement a robust debounce function (e.g., 500ms delay) before dispatching the `PATCH` request to the BFF.

## Code Examples

### Prisma Models for Environments and Endpoints
```prisma
model Environment {
  id          String        @id @default(uuid())
  name        String        @unique
  tag         String        @unique
  description String?
  endpoints   APIEndpoint[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model APIEndpoint {
  id            String      @id @default(uuid())
  apiVersionId  String
  apiVersion    APIVersion  @relation(fields: [apiVersionId], references: [id], onDelete: Cascade)
  environmentId String
  environment   Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)
  url           String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([apiVersionId, environmentId])
}
```

### BFF Endpoint for API Updates
```typescript
fastify.patch('/apis/:id', async (request, reply) => {
  // Update name and description with auto-save
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Large monolith views | Nested Router Layouts | Standard practice | Submenus like Settings are modular and URL-addressable |
| Explicit "Save" forms | Debounced Auto-save | Modern SPA standard | Reduced click fatigue and seamless inline editing |

## Open Questions

1. **Environment Seeding Strategy**
   - What we know: The phase requires a tagged environment catalog.
   - What's unclear: Should we provide initial seed data (e.g., `dev`, `prod`) automatically, or leave the table empty for manual creation?
   - Recommendation: The frontend should provide a full CRUD UI under Settings -> Environments, but backend migrations can provide initial minimal seeds.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | BFF, Portal dev | ✓ | 22.x | — |
| PostgreSQL | Prisma Data layer | ✓ | — | — |
| Vite | Portal build | ✓ | 8.0.1 | — |

**Missing dependencies with no fallback:**
- None. All standard tools are natively available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 |
| Config file | `apps/portal/vite.config.ts`, `apps/bff/package.json` |
| Quick run command | `npm run test --workspace=apps/portal` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | Inline edit saves metadata | integration | `npm run test --workspace=apps/bff` | ❌ Wave 0 |
| UX-01 | New API version created | integration | `npm run test --workspace=apps/bff` | ❌ Wave 0 |
| ENV-01 | Environments CRUD | integration | `npm run test --workspace=apps/bff` | ❌ Wave 0 |
| ENV-02 | Endpoints link to Env | unit | `npm run test --workspace=apps/bff` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test --workspace=apps/bff`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/bff/src/tests/apis.test.ts` — Required for version creation and patch updates
- [ ] `apps/bff/src/tests/environments.test.ts` — Required for Env & Endpoint mapping

## Sources

### Primary (HIGH confidence)
- Existing BFF Prisma Schema (`apps/bff/prisma/schema.prisma`)
- Existing Portal Store (`apps/portal/src/stores/registry.ts`)
- Existing Portal Views (`ProjectDetail.vue`, `Projects.vue`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Confirmed via `package.json` and established project norms.
- Architecture: HIGH - Matches standard Vue Router and Prisma relationship designs.
- Pitfalls: HIGH - Common issues related to Vue Router navigation and uncontrolled inputs.

**Research date:** 2026-03-30
**Valid until:** 2026-04-30
