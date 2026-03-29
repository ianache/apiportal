# Phase 2: API Registry & Lifecycle - Research

**Researched:** 2026-03-29
**Domain:** API Management, Lifecycle, Persistence (Prisma), UI/UX (Vue 3)
**Confidence:** HIGH

## Summary

This phase focuses on the core "Control Plane" functionality: managing the inventory of APIs and their evolutionary versions. We will implement a parent-child relationship between APIs (the project container) and APIVersions (the specific configuration and status). 

**Primary recommendation:** Use a standardized lifecycle state machine enforced by the BFF, and implement a robust "Projects" view in the Portal using a card-based grid for discovery and a table-based version history for management.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `prisma` | 6.4.1 | Persistence | Already configured in Phase 1; provides strong typing and migrations. |
| `fastify` | 5.2.1 | BFF API | High-performance, plugin-based architecture already in place. |
| `zod` | 3.24.2 | Validation | Standard for schema validation in Node.js/Fastify. |
| `semver` | 7.7.4 | Versioning | The industry standard for parsing and comparing semantic versions. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `lucide-vue-next` | 1.0.0 | UI Icons | Already in Portal; used for status indicators. |
| `@vue-flow/core` | 1.41.0 | Flow Designer | Recommended for Phase 3 (Visual Flows) - keep data format in mind. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SemVer | Simple Integer (v1, v2) | Simple increments are easier for internal APIs but lack granularity for public-facing contracts. We will use SemVer for flexibility. |
| No-Child Model | Single API Table | Hard to track historical changes and staged deployments. Parent-Child (API-Version) is essential for a lifecycle manager. |

## Architecture Patterns

### Recommended Project Structure
```
apps/
├── bff/
│   └── src/
│       └── routes/
│           └── apis.ts       # API & Version endpoints
├── portal/
│   └── src/
│       ├── views/
│       │   ├── Projects.vue  # Main grid
│       │   └── ProjectDetail.vue # Version management
│       └── components/
│           └── registry/     # Reusable components
packages/
└── shared-types/
    └── index.ts              # Updated with API & APIVersion types
```

### Pattern 1: Parent-Child API Modeling
**What:** Decouple the "Project" identity from its "Configuration" state.
**When to use:** When a single resource (API) needs to evolve over time with different stages (Design -> Published).
**Example (Prisma):**
```prisma
model API {
  id        String       @id @default(uuid())
  name      String       @unique
  versions  APIVersion[]
  ownerId   String
}

model APIVersion {
  id      String    @id @default(uuid())
  apiId   String
  version String    // SemVer e.g., "1.0.0"
  status  APIStatus @default(DESIGN)
}
```

### Pattern 2: State Machine Lifecycle
**What:** Enforce strict status transitions in the BFF.
**When to use:** `APPROVED` can only happen from `REVIEW`, `PUBLISHED` can only happen from `APPROVED`.
**Anti-Patterns to Avoid:**
- **Direct Status Update:** Allowing any status to change to any status without validation.
- **Hand-rolling SemVer:** Don't use regex for version comparison; use the `semver` library.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SemVer Validation | Custom Regex | `semver` | Handles edge cases (pre-releases, build metadata). |
| Flow Serialization | Custom Format | `Vue Flow / React Flow` compatible JSON | Avoids massive refactor in Phase 3. |
| RBAC Logic | In-code `if (user.role === ...)` | Fastify PreHandler hooks | Centralized, testable, and harder to bypass. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ | 16.0 | — |
| Prisma CLI | Migrations | ✓ | 6.4.1 | — |
| npm | Dependencies| ✓ | 11.9.0 | — |
| Node.js | Runtime | ✓ | 22.14.0 | — |

## Common Pitfalls

### Pitfall 1: Breaking Changes without Major Version
**What goes wrong:** A "minor" update changes a required field in the API definition.
**Prevention:** Implement a UI warning when updating an `APPROVED` version, or force a major increment.

### Pitfall 2: Orphaning Data
**What goes wrong:** Deleting an API without cleaning up AuditLogs or Versions.
**Prevention:** Use Prisma's `onDelete: Cascade` for Versions, but `SetNull` or soft-delete for AuditLogs to maintain history.

## Code Examples

### Prisma Schema (Proposed)
```prisma
enum APIStatus {
  DESIGN
  REVIEW
  APPROVED
  PUBLISHED
  DEPRECATED
  RETIRED
}

model API {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  ownerId     String
  owner       User         @relation("ApiOwner", fields: [ownerId], references: [id])
  versions    APIVersion[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model APIVersion {
  id          String    @id @default(uuid())
  apiId       String
  api         API       @relation(fields: [apiId], references: [id], onDelete: Cascade)
  version     String    @default("0.1.0")
  status      APIStatus @default(DESIGN)
  definition  Json?     // OpenAPI-like metadata
  flowConfig  Json?     // Visual Designer nodes/edges (Phase 3)
  createdBy   String
  creator     User      @relation("VersionCreator", fields: [createdBy], references: [id])
  approvedBy  String?
  approver    User?     @relation("VersionApprover", fields: [approvedBy], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([apiId, version])
}

// Update User model in schema.prisma
model User {
  // ... existing fields
  ownedApis       API[]        @relation("ApiOwner")
  createdVersions APIVersion[] @relation("VersionCreator")
  approvedVersions APIVersion[] @relation("VersionApprover")
}
```

### Lifecycle Transition Logic (BFF)
```typescript
// Validation for transitions
const transitionMap: Record<APIStatus, APIStatus[]> = {
  'DESIGN': ['REVIEW'],
  'REVIEW': ['DESIGN', 'APPROVED'],
  'APPROVED': ['PUBLISHED', 'DESIGN'],
  'PUBLISHED': ['DEPRECATED'],
  'DEPRECATED': ['RETIRED', 'PUBLISHED'],
  'RETIRED': []
};

function canTransition(from: APIStatus, to: APIStatus): boolean {
  return transitionMap[from]?.includes(to) ?? false;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Git-based versioning | DB-managed versions | Current | Allows real-time lifecycle tracking in UI without CI/CD dependency. |
| String-only status | Enforced State Machine | Current | Prevents invalid states (e.g., publishing a "Review" version). |

## Open Questions

1. **How to handle large `flowConfig` JSON?**
   - Recommendation: Use PostgreSQL `JsonB` (native in Prisma) for efficient querying and storage.
2. **Should we support multiple `PUBLISHED` versions simultaneously?**
   - Recommendation: Technically possible, but usually one is "Current". Phase 2 should allow multiple, but the UI should highlight the highest SemVer with status `PUBLISHED`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Portal) / Node Tap or Jest (BFF) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | Create API record | Integration | `npm run test:api` | ❌ Wave 0 |
| VER-01 | Increment Version | Unit | `npm run test:version` | ❌ Wave 0 |
| RBAC-01| Block Designer from Approval | E2E | `npm run test:rbac` | ❌ Wave 0 |

## Sources

### Primary (HIGH confidence)
- [Prisma Docs] - Schema relations and Json fields.
- [SemVer.org] - Versioning specification.
- [Keycloak Docs] - Role management (referenced from Phase 1).

### Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries already in project or standard in Node ecosystem.
- Architecture: HIGH - Proven parent-child versioning pattern.
- Pitfalls: MEDIUM - Based on common API management challenges.

**Research date:** 2026-03-29
**Valid until:** 2026-04-29
