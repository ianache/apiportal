# Modelo de Datos - API Manager

Este documento describe el modelo de datos completo del sistema API Manager basado en el schema de Prisma.

## Resumen

- **Total de tablas**: 28
- **Total de enums**: 4
- **Base de datos**: PostgreSQL
- **ORM**: Prisma

---

## Tablas Principales

### User
Usuarios del sistema autenticados via Auth0.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `sub` | String | Unique | Subject ID (Auth0) |
| `email` | String | Unique | Email del usuario |
| `name` | String | Nullable | Nombre completo |
| `role` | Role | Default: API_DEVELOPER | Rol del usuario |

**Relaciones:**
- `ownedApis` → API[] (1:N)
- `approvedVersions` → APIVersion[] (1:N)
- `createdVersions` → APIVersion[] (1:N)
- `auditLogs` → AuditLog[] (1:N)
- `favorites` → UserAPIFavorite[] (1:N)
- `createdOrganizations` → Organization[] (1:N)
- `ownedOrganizations` → Organization[] (1:N)
- `createdProducts` → Product[] (1:N)
- `subscriptions` → Subscription[] (1:N)

---

### API
APIs registradas en el sistema.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | Unique | Nombre de la API |
| `description` | String | Nullable | Descripción |
| `ownerId` | String | FK → User.id | Propietario |
| `organizationId` | String | Nullable, FK → Organization.id | Organización |
| `domainId` | String | Nullable, Indexed | Dominio |
| `label` | String | Nullable, Indexed | Etiqueta |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Índices:**
- `@@index([domainId])`
- `@@index([label])`

**Relaciones:**
- `owner` → User (N:1)
- `organization` → Organization (N:1)
- `versions` → APIVersion[] (1:N)
- `favorites` → UserAPIFavorite[] (1:N)
- `subscriptions` → Subscription[] (1:N)

---

### APIVersion
Versiones de las APIs.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `apiId` | String | FK → API.id | API padre |
| `version` | String | Default: "0.1.0" | Número de versión |
| `status` | APIStatus | Default: DESIGN | Estado de la versión |
| `definition` | Json | Nullable | Definición OpenAPI |
| `flowConfig` | Json | Nullable | Configuración de flujo |
| `openApiSpec` | Json | Nullable | Especificación OpenAPI |
| `createdBy` | String | FK → User.id | Creador |
| `approvedBy` | String | Nullable, FK → User.id | Aprobador |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Constraints:**
- `@@unique([apiId, version])`

**Relaciones:**
- `api` → API (N:1, Cascade Delete)
- `creator` → User (N:1)
- `approver` → User (N:1)
- `endpoints` → APIEndpoint[] (1:N)
- `swcis` → SoftwareConfigurationItem[] (N:M)

---

### Product
Productos o proyectos dentro de organizaciones.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | - | Nombre del producto |
| `description` | String | Nullable | Descripción |
| `organizationId` | String | FK → Organization.id | Organización |
| `createdById` | String | FK → User.id | Creador |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `organization` → Organization (N:1, Cascade Delete)
- `createdBy` → User (N:1)

---

### Organization
Organizaciones que agrupan APIs y productos.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | Unique | Nombre único |
| `description` | String | Nullable | Descripción |
| `createdById` | String | FK → User.id | Creador |
| `ownerId` | String | Nullable, FK → User.id | Propietario |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `createdBy` → User (N:1)
- `owner` → User (N:1)
- `products` → Product[] (1:N)
- `apis` → API[] (1:N)
- `swcis` → SoftwareConfigurationItem[] (1:N)
- `transformations` → DataTransformation[] (1:N)

---

### Domain
Dominios de negocio para categorizar APIs.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | Unique | Nombre único |
| `title` | String | - | Título descriptivo |
| `description` | String | Nullable | Descripción |
| `labels` | String[] | - | Etiquetas |
| `conceptModel` | Json | Nullable | Modelo conceptual |
| `erModel` | Json | Nullable | Modelo ER |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `integrations` → Integration[] (1:N)
- `transformations` → DataTransformation[] (1:N)

---

### Integration
Integraciones entre sistemas.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | - | Nombre de la integración |
| `type` | String | - | Tipo de integración |
| `description` | String | Nullable | Descripción |
| `status` | IntegrationStatus | Default: DRAFT | Estado |
| `icon` | String | Nullable | Icono |
| `linkedApis` | Int | Default: 0 | APIs vinculadas |
| `domainId` | String | Nullable, FK → Domain.id | Dominio |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `domain` → Domain (N:1)
- `versions` → IntegrationVersion[] (1:N)

---

### IntegrationVersion
Versiones de integraciones.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `version` | String | - | Número de versión |
| `status` | IntegrationVersionStatus | Default: Design | Estado |
| `description` | String | Nullable | Descripción |
| `definition` | Json | Nullable | Definición |
| `integrationId` | String | FK → Integration.id | Integración padre |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `integration` → Integration (N:1, Cascade Delete)

---

### SoftwareConfigurationItem (SWCI)
Items de configuración de software.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | - | Nombre del item |
| `description` | String | Nullable | Descripción |
| `typeId` | String | FK → ConfigurationItemType.id | Tipo |
| `organizationId` | String | FK → Organization.id | Organización |
| `apiVersionId` | String | Nullable, FK → APIVersion.id | Versión de API vinculada |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `type` → ConfigurationItemType (N:1)
- `organization` → Organization (N:1, Cascade Delete)
- `apiVersion` → APIVersion (N:1)
- `properties` → Property[] (1:N)

---

### ConfigurationItemType
Tipos de items de configuración (API, DATABASE, MICROSERVICE, etc.).

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | Unique | Nombre único |
| `icon` | String | Nullable | Icono |

**Relaciones:**
- `specifications` → PropertySpecification[] (1:N)
- `swcis` → SoftwareConfigurationItem[] (1:N)

---

### PropertySpecification
Especificaciones de propiedades para tipos de SWCI.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | - | Nombre de la propiedad |
| `dataType` | String | - | Tipo de dato (string, integer, boolean) |
| `required` | Boolean | Default: false | ¿Es requerida? |
| `typeId` | String | FK → ConfigurationItemType.id | Tipo de SWCI |

**Relaciones:**
- `type` → ConfigurationItemType (N:1, Cascade Delete)
- `properties` → Property[] (1:N)

---

### Property
Valores de propiedades para SWCI.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `value` | String | - | Valor (almacenado como string) |
| `specificationId` | String | FK → PropertySpecification.id | Especificación |
| `swciId` | String | FK → SoftwareConfigurationItem.id | SWCI |

**Constraints:**
- `@@unique([swciId, specificationId])`

**Relaciones:**
- `specification` → PropertySpecification (N:1, Cascade Delete)
- `swci` → SoftwareConfigurationItem (N:1, Cascade Delete)

---

### Environment
Ambientes de despliegue (dev, staging, prod).

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `slug` | String | Unique | Slug único |
| `name` | String | - | Nombre del ambiente |
| `tags` | String[] | - | Etiquetas |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `endpoints` → APIEndpoint[] (1:N)

---

### APIEndpoint
Endpoints de APIs por ambiente.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `versionId` | String | FK → APIVersion.id | Versión de API |
| `environmentId` | String | FK → Environment.id | Ambiente |
| `baseUrl` | String | - | URL base |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Constraints:**
- `@@unique([versionId, environmentId])`

**Relaciones:**
- `version` → APIVersion (N:1, Cascade Delete)
- `environment` → Environment (N:1, Cascade Delete)

---

### Subscription
Suscripciones de usuarios a APIs.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `userId` | String | FK → User.id | Usuario |
| `apiId` | String | FK → API.id | API |
| `status` | String | Default: "ACTIVE" | Estado (ACTIVE, REVOKED) |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Constraints:**
- `@@unique([userId, apiId])`

**Relaciones:**
- `user` → User (N:1, Cascade Delete)
- `api` → API (N:1, Cascade Delete)
- `keys` → SubscriptionKey[] (1:N)

---

### SubscriptionKey
Claves de API para suscripciones.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `subscriptionId` | String | FK → Subscription.id | Suscripción |
| `environmentId` | String | - | Ambiente |
| `apiKey` | String | Unique | Clave de API |
| `createdAt` | DateTime | Default: now() | Fecha de creación |

**Constraints:**
- `@@unique([subscriptionId, environmentId])`

**Relaciones:**
- `subscription` → Subscription (N:1, Cascade Delete)

---

### DataTransformation
Transformaciones de datos entre formatos.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | - | Nombre de la transformación |
| `description` | String | Nullable | Descripción |
| `source` | String | Nullable | Fuente |
| `target` | String | Nullable | Destino |
| `code` | String | Nullable | Código de transformación |
| `language` | String | Default: "javascript" | Lenguaje |
| `definition` | Json | Nullable | Definición estructurada |
| `organizationId` | String | Nullable, FK → Organization.id | Organización |
| `domainId` | String | Nullable, FK → Domain.id | Dominio |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `organization` → Organization (N:1)
- `domain` → Domain (N:1)

---

### KnowledgePiece
Piezas de conocimiento/documentación.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `typeId` | String | FK → KnowledgePieceType.id | Tipo |
| `domainId` | String | FK → Domain.id | Dominio |
| `title` | String | - | Título |
| `content` | String | - | Contenido |
| `metadata` | Json | Default: "{}" | Metadatos |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Índices:**
- `@@index([domainId])`
- `@@index([typeId])`

**Relaciones:**
- `type` → KnowledgePieceType (N:1)

---

### KnowledgePieceType
Tipos de piezas de conocimiento.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | Unique | Nombre único |
| `description` | String | Nullable | Descripción |
| `fields` | Json | Default: "[]" | Campos personalizados |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `knowledgePieces` → KnowledgePiece[] (1:N)

---

### AuditLog
Logs de auditoría del sistema.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `action` | String | - | Acción realizada |
| `userId` | String | FK → User.id | Usuario |
| `timestamp` | DateTime | Default: now() | Fecha/hora |
| `details` | Json | Nullable | Detalles adicionales |

**Relaciones:**
- `user` → User (N:1)

---

### UserAPIFavorite
APIs favoritas de usuarios.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `userId` | String | FK → User.id | Usuario |
| `apiId` | String | FK → API.id | API |
| `createdAt` | DateTime | Default: now() | Fecha de creación |

**Constraints:**
- `@@unique([userId, apiId])`
- `@@index([userId])`

**Relaciones:**
- `user` → User (N:1, Cascade Delete)
- `api` → API (N:1, Cascade Delete)

---

### ApiReviewReport
Reportes de revisión de APIs.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `apiId` | String | - | API |
| `version` | String | - | Versión |
| `userId` | String | - | Usuario |
| `userEmail` | String | - | Email del usuario |
| `content` | String | - | Contenido del reporte |
| `createdAt` | DateTime | Default: now() | Fecha de creación |

**Índices:**
- `@@index([apiId])`
- `@@index([userId])`

---

### LLMProvider
Proveedores de modelos de lenguaje (LLM).

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK | Identificador (openai, anthropic, etc.) |
| `label` | String | - | Nombre descriptivo |
| `models` | String[] | - | Lista de modelos disponibles |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Relaciones:**
- `apiKeys` → UserLLMApiKey[] (1:N)

---

### UserLLMApiKey
Claves de API de LLM por usuario.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `userId` | String | - | Usuario |
| `providerId` | String | FK → LLMProvider.id | Proveedor |
| `apiKey` | String | - | Clave de API (encriptada) |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

**Constraints:**
- `@@unique([userId, providerId])`

**Relaciones:**
- `provider` → LLMProvider (N:1, Cascade Delete)

---

### UserPreferences
Preferencias de usuario.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `userId` | String | PK, FK → User.id | Usuario |
| `preferredProvider` | String | Default: "openai" | Proveedor preferido |
| `preferredModel` | String | Default: "gpt-4o" | Modelo preferido |
| `customApiUrl` | String | Nullable | URL de API personalizada |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

---

### NodeTypeCatalog
Catálogo de tipos de nodos.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | Unique | Nombre único |
| `description` | String | Nullable | Descripción |
| `properties` | Json | Default: "[]" | Propiedades |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

---

### TxNodeTypeCatalog
Catálogo de tipos de nodos de transformación.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String | PK, UUID | Identificador único |
| `name` | String | Unique | Nombre único |
| `description` | String | Nullable | Descripción |
| `icon` | String | Default: "transform" | Icono |
| `color` | String | Default: "#0058bc" | Color |
| `properties` | Json | Default: "[]" | Propiedades |
| `createdAt` | DateTime | Default: now() | Fecha de creación |
| `updatedAt` | DateTime | Auto-update | Fecha de actualización |

---

## Enums

### Role
Roles de usuario en el sistema.

| Valor | Descripción |
|-------|-------------|
| `API_MANAGER` | Gestor de APIs |
| `API_DESIGNER` | Diseñador de APIs |
| `API_DEVELOPER` | Desarrollador de APIs |

---

### APIStatus
Estados de una versión de API.

| Valor | Descripción |
|-------|-------------|
| `DESIGN` | En diseño |
| `REVIEW` | En revisión |
| `APPROVED` | Aprobada |
| `PUBLISHED` | Publicada |
| `DEPRECATED` | Deprecada |
| `RETIRED` | Retirada |

---

### IntegrationStatus
Estados de una integración.

| Valor | Descripción |
|-------|-------------|
| `ACTIVE` | Activa |
| `INACTIVE` | Inactiva |
| `DRAFT` | Borrador |
| `ERROR` | Con error |

---

### IntegrationVersionStatus
Estados de una versión de integración.

| Valor | Descripción |
|-------|-------------|
| `Design` | En diseño |
| `Testing` | En pruebas |
| `Published` | Publicada |
| `Deprecated` | Deprecada |

---

## Diagrama de Relaciones

```
User (1) ───────< (N) API (owner)
     │
     ├──────────< (N) APIVersion (creator/approver)
     │
     ├──────────< (N) Organization (creator/owner)
     │
     ├──────────< (N) Product (creator)
     │
     ├──────────< (N) Subscription
     │
     ├──────────< (N) UserAPIFavorite
     │
     └──────────< (N) AuditLog

Organization (1) ───────< (N) API
            │
            ├──────────< (N) Product
            │
            ├──────────< (N) SoftwareConfigurationItem
            │
            └──────────< (N) DataTransformation

API (1) ───────< (N) APIVersion
  │
  ├──────────< (N) UserAPIFavorite
  │
  └──────────< (N) Subscription

APIVersion (1) ───────< (N) APIEndpoint
         │
         └──────────< (N) SoftwareConfigurationItem

Domain (1) ───────< (N) Integration
     │
     ├──────────< (N) DataTransformation
     │
     └──────────< (N) KnowledgePiece

Integration (1) ───────< (N) IntegrationVersion

ConfigurationItemType (1) ───────< (N) PropertySpecification
                 │
                 └──────────< (N) SoftwareConfigurationItem

SoftwareConfigurationItem (1) ───────< (N) Property

Environment (1) ───────< (N) APIEndpoint

Subscription (1) ───────< (N) SubscriptionKey

LLMProvider (1) ───────< (N) UserLLMApiKey

KnowledgePieceType (1) ───────< (N) KnowledgePiece
```

---

## Notas de Implementación

1. **Cascading Deletes**: Las relaciones marcadas con `onDelete: Cascade` eliminarán automáticamente los registros hijos cuando se elimine el padre.

2. **Soft Deletes**: No se implementan soft deletes; las eliminaciones son permanentes.

3. **Auditoría**: El campo `updatedAt` se actualiza automáticamente en cada modificación.

4. **JSON Fields**: Los campos tipo `Json` almacenan estructuras flexibles sin validación de schema a nivel de BD.

5. **Indexes**: Los índices definidos mejoran el rendimiento de búsquedas frecuentes.

---

## Archivo de Schema

**Ubicación**: `apps/bff/prisma/schema.prisma`

**Generación de Cliente**:
```bash
cd apps/bff
npx prisma generate
```

**Migraciones**:
```bash
npx prisma migrate dev
```

**Visualización**:
```bash
npx prisma studio
```

---

*Documento generado automáticamente desde el schema de Prisma*
*Fecha de generación: 2026-05-01*
