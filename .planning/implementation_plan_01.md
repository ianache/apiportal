# Migrate LLM Providers to DB
El objetivo es eliminar los proveedores LLM estáticos de la interfaz ([stores/preferences.ts](file:///c:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/103-APIManager/apps/portal/src/stores/preferences.ts)), centralizándolos en una tabla en la base de datos controlada por el API Backend (BFF).

## Proposed Changes

### Database Layer
#### [MODIFY] [schema.prisma](file:///c:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/103-APIManager/apps/bff/prisma/schema.prisma)
Agregar el modelo `LLMProvider`:
```prisma
model LLMProvider {
  id        String   @id // Ej: "openai", "ollama", "gemini"
  label     String   // Ej: "OpenAI", "Ollama", "Gemini"
  models    String[] // Ej: ["gpt-4o", "llama3"]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### Backend (BFF)
#### [NEW] [llmProviders.ts](file:///c:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/103-APIManager/apps/bff/src/routes/llmProviders.ts)
Crear un controlador de Fastify para los endpoints:
- `GET /llm-providers`: Retorna la lista de proveedores (Abierto para cualquier autenticado).
- `POST /llm-providers`: Permite crear nuevos proveedores (Retringido a `API_MANAGER`).

#### [MODIFY] [app.ts](file:///c:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/103-APIManager/apps/bff/src/app.ts)
Registrar el nuevo router como plugin (`{ prefix: '/llm-providers' }`).

---

### Frontend (Portal)
#### [MODIFY] [preferences.ts](file:///c:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/103-APIManager/apps/portal/src/stores/preferences.ts)
- Eliminar la constante harcodeada `LLM_PROVIDERS`.
- Añadir la lógica async `fetchProviders()` en el store Pinia que consume el endpoint `GET /llm-providers`.
- Mantener los proveedores en el estado central para reactividad.

#### [MODIFY] [SettingsPreferences.vue](file:///c:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/103-APIManager/apps/portal/src/views/settings/SettingsPreferences.vue)
- En el `onMounted()`, llamar al método asíncrono para cargar los proveedores, indicando estados de carga mediante Spinners (`loading = true`).
- Enlazar la vista a los proveedores reáctivos alojados localmente.

## Verification Plan

### Database & Server Commands
```bash
npm run prisma --workspace=apps/bff -- migrate dev --name add_llm_providers
npm run dev:bff
```

### Automated Tests
_This change is purely integration so there are no specific current unit tests for LLM DB to run, however standard integration testing with `curl` or ThunderClient on the BFF will run against:_
`GET http://localhost:3001/llm-providers`

### Manual Verification
1. Ingresaremos a `npx prisma studio` (o insertaremos data usando Postman).
2. Verificaremos recargando la vista `Settings / Preferences` en el portal local (Vue).
3. Asegurarse que el `select Box` de Providers lea directamente desde la DB y actualice sus modelos disponibles acordemente.
