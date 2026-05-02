# Migración de Diagramas - Product Designer

## Resumen

Se ha migrado el almacenamiento de diagramas desde campos JSON (`diagram`, `diagrams`) en la tabla `Product` a una tabla relacional separada `Diagram` para mejor:
- **Integridad de datos**: Constraints y validaciones a nivel de BD
- **Escalabilidad**: Mejor rendimiento con grandes volúmenes
- **Evolución**: Facilidad para agregar nuevas propiedades a diagramas
- **Recuperación**: Menor riesgo de corrupción de datos

## Cambios Realizados

### 1. Schema de Base de Datos

```prisma
// NUEVO: Tabla Diagram separada
model Diagram {
  id          String   @id @default(uuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  name        String   @default("main")
  diagramId   String   @default("main")
  nodes       Json     @default("[]")
  edges       Json     @default("[]")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([productId, diagramId])
}

model Product {
  // ... campos existentes ...
  diagram        Json?        // Deprecated: preservado para rollback
  diagrams       Json?        // Deprecated: preservado para rollback
  diagramList    Diagram[]    // Nueva relación
}
```

### 2. APIs Actualizadas

- `GET /products/:id` - Ahora incluye `diagramList` y convierte a formato `diagrams`
- `PATCH /products/:id` - Guarda en tabla `Diagram`, mantiene compatibilidad hacia atrás
- `POST /organizations/:orgId/products` - Crea producto con diagrama inicial

### 3. Compatibilidad

✅ **Totalmente backward compatible**
- Frontend sigue enviando/recibiendo `diagrams` array
- APIs manejan automáticamente la conversión
- Datos antiguos se migran automáticamente

## Instrucciones de Migración

### Paso 1: Backup (OBLIGATORIO)

```bash
# Crear backup de la base de datos
pg_dump -h localhost -U usuario -d basededatos > backup_pre_diagram_migration_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 2: Aplicar Migración SQL

```bash
cd apps/bff

# Opción A: Usando Prisma Migrate (recomendado)
npx prisma migrate dev

# Opción B: Aplicar SQL manualmente (si prefieres control total)
psql -h localhost -U usuario -d basededatos -f prisma/migrations/20250501000000_migrate_diagrams_to_table/migration.sql
```

### Paso 3: Regenerar Cliente Prisma

```bash
npx prisma generate
```

### Paso 4: Verificar Migración

```bash
# Ejecutar script de verificación
npx ts-node src/scripts/verify-diagram-migration.ts
```

Deberías ver:
```
📦 Total de productos: X
📊 Total de diagramas migrados: Y
📝 Productos con formato antiguo: Z
📈 Estadísticas:
   - Productos con múltiples diagramas: N
   - Promedio de diagramas por producto: M

✅ Verificación completada exitosamente
```

### Paso 5: Reiniciar Servicios

```bash
# BFF
npm run dev  # o tu comando de inicio

# Portal
npm run dev
```

## Rollback (En caso de emergencia)

Si necesitas revertir la migración:

```bash
# 1. Restaurar desde backup
psql -h localhost -U usuario -d basededatos < backup_pre_diagram_migration_xxx.sql

# 2. Eliminar tabla Diagram (opcional)
DROP TABLE IF EXISTS "Diagram";

# 3. Regenerar cliente Prisma
npx prisma generate
```

⚠️ **Nota**: El rollback restaurará todos los datos al estado anterior, incluyendo cualquier cambio realizado después de la migración.

## Limpieza Post-Migración

Después de confirmar que todo funciona correctamente por 1-2 semanas:

```sql
-- Eliminar campos JSON deprecados (solo después de validación)
-- ALTER TABLE "Product" DROP COLUMN "diagram";
-- ALTER TABLE "Product" DROP COLUMN "diagrams";
```

## Troubleshooting

### Error: "diagramList does not exist"

```bash
# El cliente Prisma no tiene el nuevo modelo
npx prisma generate
```

### Error: "No migrations found"

```bash
# Marcar migración como aplicada si ya existe la tabla
npx prisma migrate resolve --applied "20250501000000_migrate_diagrams_to_table"
```

### Datos faltantes después de migración

```bash
# Verificar estado
npx prisma migrate status

# Si falló, marcar como rollback y reintentar
npx prisma migrate resolve --rolled-back "20250501000000_migrate_diagrams_to_table"
npx prisma migrate dev
```

## Contacto

En caso de problemas durante la migración:
1. No elimines los backups
2. Documenta el error completo
3. Contacta al equipo de desarrollo

## Referencias

- [Guía de Migraciones Seguras](./MIGRATION_GUIDE.md)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
