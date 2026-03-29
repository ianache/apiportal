# Technology Stack: API Manager

**Project:** APIManager
**Researched:** March 2024

## Recommended Stack

### Core Gateway (Data Plane)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Go (Golang)** | 1.22+ | Gateway Core | **Industry Standard.** Best-in-class networking, Goroutines for concurrency, and sub-millisecond GC pauses. |
| **Gin** or **Fiber** | Latest | Web Framework | Gin is battle-tested; Fiber is faster (Express-like) for ultra-low latency. |
| **Redis** | 7.x | Rate Limiting/Caching | Atomic operations and high-throughput for stateful gateway policies. |

### Control Plane (API/Dashboard)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Node.js (NestJS)** | 20+ | Management API | Rapid development of complex business logic, RBAC, and OpenAPI management. |
| **PostgreSQL** | 16+ | Configuration Storage | Reliable relational storage for API metadata, user accounts, and policies. |

### Frontend & Designer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React** or **Vue 3** | Latest | Dashboard UI | Standard for modern SPAs. |
| **React Flow** / **Vue Flow** | Latest | Visual Logic Designer | **Best-in-class.** Specifically designed for building node-based UI/DAGs. |
| **Monaco Editor** | Latest | Code/Schema Editor | Powers VS Code; provides superior IntelliSense for YAML/JSON. |

### Infrastructure & Security
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Keycloak** or **Ory** | Latest | Identity/Auth Server | Full support for OAuth 2.1, OIDC, and JWT out of the box. |
| **Envoy** or **Traefik** | Latest | L7 Ingress | Optional alternative if building a "custom-policy" layer on top of a standard proxy. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Gateway Core** | Go | Rust | Rust has higher performance but Go has a more mature cloud-native ecosystem and faster dev speed. |
| **Gateway Core** | Go | Node.js (Fastify) | Node is great for orchestration but usually slower for raw high-throughput proxying. |
| **Visual Library** | React Flow | AntV X6 | X6 is more powerful for SVG but React Flow is significantly easier to build with for standard node logic. |

## Installation

### Gateway (Go)
```bash
go mod init gateway
go get -u github.com/gin-gonic/gin
go get -u github.com/redis/go-redis/v9
```

### Designer (React)
```bash
npm install reactflow
npm install @monaco-editor/react
```

## Sources

- [GopherCloud Networking Benchmarks 2024]
- [React Flow Documentation]
- [OWASP API Security Top 10 2023/2024]
- [OAuth 2.1 Specification Drafts]
