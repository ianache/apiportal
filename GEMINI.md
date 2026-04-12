# Nexus API Manager - Gemini CLI Mandates

This file provides foundational mandates and context for Gemini CLI when working in this workspace. These instructions take absolute precedence over general workflows.

## 🚀 Project Overview
**Nexus API Manager** is a monorepo API Management Platform (Control Plane) built with Vue 3, Fastify, Prisma, and Keycloak.

### Monorepo Structure
- `apps/portal`: Vue 3 + Pinia + Vite + Tailwind CSS v4 (Frontend).
- `apps/bff`: Fastify + Prisma + PostgreSQL + Keycloak (Backend-for-Frontend).
- `packages/shared-types`: Common TypeScript definitions used by both apps.

---

## 🛠️ Critical Commands & Workflows

### Setup & Development
1. **Initial Setup:** `npm install` from the root.
2. **Prisma Generation:** `npm run prisma --workspace=apps/bff -- generate`.
3. **Run All:** `npm run dev` (starts portal and bff).
4. **Individual Apps:**
   - `npm run dev:portal`
   - `npm run dev:bff`

### Database (Prisma)
- **Schema Location:** `apps/bff/prisma/schema.prisma`
- **Apply Changes:** Use `npx prisma migrate dev --name <description>` or `npx prisma db push`.
- **🛑 DATA SAFETY RULE:** **NEVER** run `npx prisma migrate reset` or any command that destroys data.

---

## 🏗️ Architectural Mandates

### Type Safety & Shared Types
- **Shared Definitions:** ALWAYS use `packages/shared-types` for entities common to both Frontend and BFF (e.g., `User`, `Role`, `API`, `APIVersion`).
- **Imports:** Import from `'shared-types'` in both workspaces.
- **Syncing:** If you update `shared-types`, ensure both `apps/portal` and `apps/bff` are aware of the changes.

### Authentication & Authorization
- **Identity Provider:** Keycloak v26+.
- **BFF Auth:** Handled via `apps/bff/src/plugins/auth.ts`. It maps Keycloak realm roles (`API-Manager`, `API-Designer`, `API-Developer`) to the `Role` enum.
- **Portal Auth:** Pinia store `apps/portal/src/stores/auth.ts` wraps `keycloak-js`.
- **Dev Mode:** In development, the BFF may start in **unauthenticated mode** if Keycloak is unreachable. DO NOT assume authentication is always enforced during local testing unless explicitly verified.

### Backend (BFF) Patterns
- **Framework:** Fastify.
- **Plugins:** Use Fastify plugins for cross-cutting concerns (Prisma, Auth).
- **Routes:** Registered in `apps/bff/src/app.ts`, located in `apps/bff/src/routes/`.

### Frontend (Portal) Patterns
- **Framework:** Vue 3 (Composition API).
- **State:** Pinia.
- **Styling:** Tailwind CSS v4 (Vanilla CSS preferred for custom components).
- **Icons:** Use Google Material Symbols (as seen in `Shell.vue`).

---

## 📍 Current Status: Phase 03
We are currently in **Phase 03: Portal UX Polish & Environment Catalog**.
Key priorities:
- UI consistency (APIs Catalog, navigation labels).
- API version creation and lifecycle state transitions.
- Environment catalog implementation.
- Visual Flow Designer (Vue Flow) preparation.

---

## 📝 Engineering Standards
1. **Surgical Edits:** Use the `replace` tool for precise updates.
2. **Validation:** Always run `npm run test` or workspace-specific tests after changes.
3. **Documentation:** Keep `.planning/STATE.md` and relevant phase documents updated when completing major tasks.
4. **Environment Variables:** Reference `.env.template` for required keys. NEVER commit `.env` files.
