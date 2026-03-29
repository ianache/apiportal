# Feature Landscape: API Manager

**Domain:** API Management Platform
**Researched:** March 2024

## Table Stakes (Mandatory)

Features users expect in any modern APIM.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **OpenAPI Ingestion** | Standard way to register APIs. | Medium | Support 3.0.x and 3.1. |
| **OAuth 2.1 Support** | Modern secure authentication. | High | Must support PKCE and Refresh Token rotation. |
| **Rate Limiting** | Protects backends from abuse. | Medium | IP-based, User-based, and Key-based. |
| **Developer Portal** | Discovery and documentation. | High | Interactive "Try It" console is key. |
| **API Key Management** | Basic access control. | Low | Scoped keys with expiration. |
| **Logging & Metrics** | Visibility into API health. | Medium | Latency (P99), Error rates, Throughput. |

## Differentiators

Features that set the product apart.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Visual Flow Designer** | No-code logic orchestration. | High | Chain policies (Transform -> Auth -> Cache). |
| **Mocking-as-a-Service** | Frontend dev without backend. | Medium | Generate mock responses from OpenAPI examples. |
| **AI Documentation Asst** | Faster onboarding. | Medium | LLM-powered search and "How to use" guide generation. |
| **Contract Testing** | Prevent breaking changes. | High | Verify that API changes don't break consumers. |
| **DPoP Support** | Ultra-secure token handling. | Medium | Binds tokens to specific client machines. |

## Anti-Features (Avoid)

Features to explicitly NOT build (initially).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full Service Mesh** | High complexity/overlap with K8s. | Focus on Ingress/Gateway API patterns. |
| **Custom Auth Provider** | Huge security risk and maintenance. | Integrate with Keycloak, Ory, or Auth0. |
| **Legacy Soap/XML Sup** | Decreasing market share. | Focus on REST (OpenAPI) and GraphQL. |

## Feature Dependencies

```
OpenAPI Ingestion → Interactive Docs (Portal)
OAuth 2.1 Support → Visual Policy Designer (for custom auth flows)
Mocking-as-a-Service → OpenAPI Ingestion (requires schema)
Visual Flow Designer → Plugin System (WASM/JS)
```

## MVP Recommendation

Prioritize:
1. **OpenAPI Ingestion (3.0.x):** Foundation for all other features.
2. **Standard Security:** API Keys and OAuth 2.1 validation.
3. **Basic Developer Portal:** Auto-generated docs and "Try It" console.
4. **Basic Rate Limiting:** Fixed-window throttling.

Defer: **Visual Flow Designer** and **AI Assistance** to Phase 2/3 as they require a stable core gateway first.

## Sources

- [Harness.io API Portal Trends 2024]
- [Stoplight API Design-First Guide]
- [Postman State of the API Report 2023]
