# Requirements: Nexus API Manager

## 1. Product Overview
A control plane for API management, focused on visual flow design and developer self-service.

## 2. Functional Requirements

### 2.1 User Management (API Manager)
- Manage users under roles: API Manager, API Designer, API Developer.
- Integration with Keycloak for RBAC.

### 2.2 API Lifecycle (Designer & Manager)
- **Design:** Create/Edit APIs with versioning.
- **Approval:** Manager reviews and approves designs.
- **Publication:** Manager publishes approved APIs to the Gateway.
- **Schema:** Restful API specifications (endpoints, components).

### 2.3 Integration Flows (Designer)
- **Flow Types:** Incoming flow, Response flow, Exception flow.
- **Pattern:** Pipe & Filters.
- **Nodes:** Transform, Validate, Route (to Gateway endpoint).
- **Initial Nodes:** HTTP (Methods, Routes), Kafka, etc.
- **Visual Designer:** Drag-and-drop canvas for connecting nodes.

### 2.4 API Explorer (Developer)
- Browse published APIs by categories.
- Subscribe to APIs.
- Documentation and interactive testing (Try It).

## 3. Technical Requirements
- **Integration:** Must connect to the Spring Boot Gateway Admin API.
- **Persistence:** All configurations stored in PostgreSQL.
- **Frontend:** Vue.js + Pinia.
- **Backend:** Node.js (BFF).

## 4. Success Criteria
- Complete RBAC implementation via Keycloak.
- Visual flow design successfully persisted to PostgreSQL.
- API publication successfully synchronized with the Spring Boot Gateway.
