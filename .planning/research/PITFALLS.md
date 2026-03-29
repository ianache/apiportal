# Domain Pitfalls: API Manager

**Domain:** API Management & Security
**Researched:** March 2024

## Critical Pitfalls

### Pitfall 1: Fragile OpenAPI 3.1 Support
**What goes wrong:** Developers assume full 3.1 compatibility, but many libraries (parsers, UI generators) only support 3.0.x keywords (e.g., `nullable: true` vs `type: ["string", "null"]`).
**Why it happens:** The shift to JSON Schema 2020-12 in OpenAPI 3.1 was a major architectural change.
**Consequences:** APIs fail to import, validation logic allows invalid data, or the documentation portal crashes.
**Prevention:** Support "Downgrade" or "Normalization" of specs during import. Explicitly validate with a 3.1-compliant parser (like Spectral or certain Go/Node libs).

### Pitfall 2: JWT Security Implementation Errors
**What goes wrong:** Relying on `alg: none`, ignoring expiration, or failing to validate the `iss` (issuer) and `aud` (audience).
**Why it happens:** Complexity of JWT specifications and "convenience" over security.
**Consequences:** Identity spoofing and unauthorized access.
**Prevention:** Use a well-vetted auth library (e.g., `golang-jwt` or `jose`) and strictly reject insecure algorithms. Enforce OAuth 2.1 standards.

### Pitfall 3: Gateway Latency "Death by 1000 Cuts"
**What goes wrong:** Adding too many visual policies (JSON transform, header check, external auth call) adds up to significant P99 latency.
**Why it happens:** Improper optimization of the "Data Plane" logic execution.
**Consequences:** Poor user experience and increased infrastructure costs.
**Prevention:** Profile the "Hot Path" of every policy. Use WASM or native Go plugins for high-performance logic instead of interpreted scripts.

## Moderate Pitfalls

### Pitfall 1: Rate Limiting "Thundering Herd"
**What goes wrong:** When the rate limiting service (Redis) goes down, the gateway either blocks everything or lets everything through.
**Prevention:** Implement "Fail-Open" logic for rate limiting with local fallback if Redis is unavailable.

### Pitfall 2: Secrets Sprawl in Visual Flows
**What goes wrong:** Users paste API keys or database strings directly into visual flow node configurations.
**Prevention:** Implement a dedicated "Environment Variables" or "Secret Vault" integration in the Visual Designer.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **OpenAPI Import** | Circular references in schemas | Implement a "Dereferencer" with a depth limit during import. |
| **Visual Flow** | Infinite loops in DAGs | Add a visual cycle detector during the "Save" operation in the UI. |
| **Portal Testing** | CORS issues in "Try It" console | Provide a "Gateway Proxy" for the portal to avoid browser CORS restrictions. |

## Sources

- [OWASP API Security Top 10 (2023)]
- [Cloudflare: Common API Gateway Pitfalls]
- [Apigee: Best Practices for API Proxy Design]
