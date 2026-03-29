# Project: Nexus API Manager

## Vision
A centralized platform for managing the entire API lifecycle, acting as the control plane for a Spring Boot API Gateway. Nexus API Manager enables administrators to manage users, designers to create visual integration flows and API definitions, and developers to discover and subscribe to services.

## Core Pillars
1. **Identity & Access (Keycloak):** Role-based management for API Managers, Designers, and Developers.
2. **API Registration:** Management of RESTful specifications, versioning, and lifecycle (Design -> Approval -> Publication).
3. **Visual Flow Designer (Integration APIs):** A "Pipe & Filters" orchestration canvas for Incoming, Response, and Exception flows.
4. **API Explorer (Portal):** A self-service hub for discovery, documentation, and subscription.

## Tech Stack
- **Frontend:** Vue.js + Pinia (Tailwind CSS)
- **BFF (Backend for Frontend):** Node.js + JavaScript
- **Persistence:** PostgreSQL
- **Security:** Keycloak v26+ (OAuth 2.1 / JWT)
- **Execution Gateway:** Spring Boot (Existing/Out-of-Scope implementation)

## References
- `documentations/apiportal.drawio`: System Architecture
- `documentations/requerimientos.md`: Functional Requirements
- `documentations/sketchs/`: UI Design references
