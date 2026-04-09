/**
 * Configuración externalizada para el Portal Nexus.
 * Estas variables pueden ser modificadas directamente en el servidor
 * de despliegue sin necesidad de re-compilar el código fuente.
 */
window.NEXUS_ENV = {
  KEYCLOAK_URL: "https://oauth2.qa.comsatel.com.pe",
  KEYCLOAK_REALM: "Apps",
  KEYCLOAK_CLIENT_ID: "nexus-portal",
  VITE_API_URL: "http://localhost:3001"
};
