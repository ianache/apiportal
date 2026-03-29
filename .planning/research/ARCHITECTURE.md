# Architecture Patterns: API Manager

**Domain:** API Gateway & Management
**Researched:** March 2024

## Recommended Architecture

### Distributed Gateway Pattern
A **Control Plane** for management and a **Data Plane** for high-speed traffic.

- **Control Plane (Node.js/NestJS):** Manages the dashboard, API registry, user auth, and policy definitions. Pushes configuration to the Data Plane.
- **Data Plane (Go/Fiber):** The high-performance gateway instance. It receives config updates (via gRPC or polling), validates incoming requests, enforces policies, and proxies traffic to backends.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Admin UI** | Visual Designer, Dashboard | Control Plane API |
| **Control Plane** | Policy compilation, User management | DB, Data Plane |
| **Data Plane** | Auth validation, Rate limiting, Proxying | Backends, Redis, Control Plane |
| **Identity Server** | OAuth 2.1 / OIDC flows | Control Plane, Data Plane |

### Data Flow

1. **Management Flow:** Admin defines a policy in UI -> Control Plane compiles UI graph to JSON/YAML -> Data Plane fetches new config -> Config hot-reloaded.
2. **Request Flow:** Client calls Gateway -> Data Plane checks Redis for Rate Limit -> Data Plane validates JWT/Key -> Data Plane applies transformations -> Data Plane proxies to Backend -> Response returned.

## Patterns to Follow

### Pattern 1: Node-Based Visual Logic (DAG)
**What:** Using a Directed Acyclic Graph (DAG) for policy orchestration.
**When:** For complex request/response manipulation.
**Example:**
```typescript
// Visual Node Structure
{
  id: "node-1",
  type: "authentication",
  data: { method: "oauth2", scopes: ["read:data"] },
  next: "node-2"
}
```

### Pattern 2: Sidecar/Micro-Gateway
**What:** Deploying small gateway instances alongside individual microservices.
**When:** For hybrid or large-scale cloud environments to reduce latency and "Blast Radius."

## Anti-Patterns to Avoid

### Anti-Pattern 1: The "Monolithic Proxy"
**What:** Putting ALL logic (auth, business logic, heavy transformations) into a single gateway instance.
**Why bad:** High latency, hard to scale, single point of failure.
**Instead:** Keep the gateway for "Cross-Cutting Concerns" (Auth, Throttling) and move heavy business logic to dedicated services.

### Anti-Pattern 2: Blocking I/O in the Gateway
**What:** Making synchronous calls to slow external services during a request.
**Why bad:** Exhausts the gateway's connection pool.
**Instead:** Use caching (Redis) and non-blocking I/O patterns.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Rate Limiting** | Local memory | Redis (Single) | Redis Cluster / Local Sharding |
| **Config Sync** | Polling DB | gRPC Streaming | Distributed Config (Etcd/Consul) |
| **Log Storage** | Standard SQL | ElasticSearch | Kafka + ClickHouse |

## Sources

- [KrakenD Performance Architecture]
- [Envoy Proxy Architecture Deep Dive]
- [Martin Fowler: Microservices Gateway Patterns]
