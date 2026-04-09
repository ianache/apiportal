# Nexus API Manager

## Primeros Pasos (Setup)

Antes de ejecutar el proyecto por primera vez, instala todas las dependencias desde la raíz del proyecto para que todos los workspaces estén listos:

```bash
npm install
```

Luego, es **muy importante** generar el cliente de Prisma para que el Backend (BFF) pueda conectarse a la base de datos sin errores:

```bash
npm run prisma --workspace=apps/bff -- generate
```

*(Opcional - Migraciones)* Si hay nuevas actualizaciones en el esquema de la base de datos, ejecuta la migración para tu entorno de desarrollo:
```bash
npm run prisma --workspace=apps/bff -- migrate dev --name init_db
```

## Comandos de Ejecución

Una vez que tengas configuradas las variables de entorno (`.env` con PostgreSQL y Keycloak) y las dependencias instaladas, puedes ejecutar los proyectos directamente desde la raíz utilizando los siguientes comandos:

- **Para ejecutar ambos proyectos (Front y Back) simultáneamente:**
  ```bash
  npm run dev
  ```

- **Para ejecutar sólo el Portal (Frontend Vue):**
  ```bash
  npm run dev:portal
  ```

  En windows:

  ```PowerShell
  $env:PORT=3001; npm run dev:bff
  ```

- **Para ejecutar sólo el BFF (Backend Fastify):**
  ```bash
  npm run dev:bff
  ```

---

# Steps

- gsd:verify-work
- gsd:ui-review
- gsd:code-review