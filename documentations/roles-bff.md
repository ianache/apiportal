# Roles de Acceso al BFF y Endpoints

El Backend for Frontend (BFF) utiliza los roles mapeados de Keycloak para gobernar el acceso granular a nivel de rutas y código. Las siguientes políticas se aplican en los distintos endpoints (`src/routes/*`):

## Importante: Nivel de Configuración de los Roles
Tanto el BFF como el Portal están programados para leer **Resource Roles (Client Roles)**, **NO** roles de Realm. 
Técnicamente, el archivo `auth.ts` extrae los permisos leyendo la propiedad `resource_access.{clientId}.roles` del token JWT en lugar de `realm_access.roles`.
Por lo tanto, en Keycloak, los roles (`API-Manager`, `API-Designer` y `API-Developer`) deben ser creados y asignados directamente dentro de la configuración del **Cliente** específico (por ejemplo, en el cliente `nexus-bff`), en lugar de asignarlos globalmente a nivel de Reino (Realm).

## 1. `API_MANAGER`
Es el rol de administración total, diseñado para dueños y mantenedores globales del sistema.

### Permisos Exclusivos:
- **Gestión de Entornos (`environments.ts`):** Es el **único** rol que puede interactuar plenamente con los endpoints relacionados a infraestructura y entornos de despliegue. Cualquier petición hacia `/environments` por parte de un diseñador o desarrollador será rechazada de plano.
- **Sin restricciones de mutación:** Puede modificar, eliminar, publicar o alterar el estado de cualquier API o Servicio, Integración y Catálogo de nodos sin recibir los bloqueos que limitan a los otros roles.

## 2. `API_DESIGNER`
Un rol de creador. Está autorizado para diseñar y subir las descripciones arquitectónicas y los flujos OpenAPI.

### Permisos de Creación:
- **Diseño de APIs y Catálogos:** Posee acceso para registrar nuevas APIs, subir contratos o registrar nuevos *Node Types* en base al esquema del catálogo.
- Carece de privilegios sobre la gestión puramente de infraestructura (como la configuración del dominio o los despliegues de entornos completos, exclusivos para el Manager).

## 3. `API_DEVELOPER`
Este es el permiso restrictivo asignado **por defecto** cuando un token Bearer es válido pero no incluye ninguno de los roles superiores previamente mencionados.

### Restricciones Aplicadas:
A lo largo de múltiples controladores (`apis.ts`, `integrations.ts`, `nodeTypesCatalog.ts` y `domains.ts`), se realizan validaciones explícitas:

```typescript
if (request.user.role === 'API_DEVELOPER') {
   return reply.code(403).send({ error: 'Forbidden, insufficient permissions ...' })
}
```

- **Acceso Únicamente de Lectura:** El desarrollador tiene privilegios para realizar peticiones `GET`. Puede consultar endpoints para leer los esquemas, ver listas de integración e investigar el catálogo abierto.
- **Mutaciones Bloqueadas:** Cualquier intento de crear (`POST`), modificar (`PUT`/`PATCH`) o eliminar (`DELETE`) recursos devolverá automáticamente un error **403 Forbidden**.
