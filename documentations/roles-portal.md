# Roles de Acceso al Portal y API

El acceso al **Nexus API Manager** (tanto al Portal Web como al BFF) está gobernado por roles definidos en Keycloak. A nivel de infraestructura, la aplicación lee los "Client Roles" (roles a nivel de cliente, no de Realm) desde el token de acceso JWT y los mapea a los perfiles internos de la plataforma.

## Roles Requeridos en Keycloak

Para poder interactuar con el sistema, cada usuario debe tener asignado al menos uno de los siguientes **Roles de Cliente** directamente dentro del cliente Keycloak (por ejemplo, en el cliente `nexus-portal` o `nexus-bff` según la configuración del servidor):

### 1. `API-Manager` (o `API-Admin`)
- **Rol Interno de la App:** `API_MANAGER`
- **Descripción:** Nivel máximo de administración. Este rol está diseñado para los administradores globales de la plataforma y dueños del producto. Tendrían permisos para ver toda la actividad, generar tokens de alto nivel, suspender APIs y manejar aprobaciones globales.

### 2. `API-Designer`
- **Rol Interno de la App:** `API_DESIGNER`
- **Descripción:** Nivel de diseño técnico. Este rol permite crear, diseñar y definir especificaciones de las APIs (esquemas, arquitecturas, políticas). Típicamente asignado a líderes técnicos y arquitectos de soluciones que mantienen el catálogo.

### 3. `API-Developer`
- **Rol Interno de la App:** `API_DEVELOPER`
- **Descripción:** Nivel de acceso y consumo. Es el rol básico por defecto si el usuario tiene acceso pero no ostenta ningún otro rol superior. Un desarrollador puede explorar el catálogo de APIs, leer su documentación, generar llaves/credenciales propias y probar los endpoints.

---

## Proceso de Mapeo Técnico (Contexto OIDC)
Cuando un usuario inicia sesión en el Portal a través del flujo PKCE (S256), Keycloak devuelve un JWT (JSON Web Token).
El Backend for Frontend (BFF) captura este token y revisa la estructura `resource_access` para descifrar el rol de la siguiente manera:

```json
{
  "resource_access": {
    "nexus-bff": {
      "roles": [
        "API-Manager"
      ]
    }
  }
}
```
*Si un usuario no cuenta con ninguno de los roles `API-Manager`, `API-Admin`, o `API-Designer`, el sistema por seguridad le inferirá el acceso básico de `API-Developer` asumiendo que al menos está autenticado en la plataforma.*
