# Guía de Migraciones Seguras con Prisma

## ⚠️ Reglas de Seguridad de Datos

**NUNCA ejecutes `prisma migrate reset` o comandos que puedan destruir datos en producción.**

### Comandos Seguros vs Inseguros

#### ✅ Comandos Seguros

```bash
# Ver cambios antes de aplicar (recomendado)
npx prisma migrate dev --create-only

# Aplicar migraciones en desarrollo
npx prisma migrate dev

# Sincronizar schema sin crear archivos de migración
npx prisma db push

# Verificar estado de migraciones
npx prisma migrate status
```

#### ❌ Comandos Peligrosos (EVITAR)

```bash
# DESTRUYE TODOS LOS DATOS - NUNCA USAR
npx prisma migrate reset

# Forzar migración puede causar pérdida de datos
npx prisma migrate dev --force
```

## Flujo de Migración Segura

### 1. Antes de Cualquier Migración

1. **Hacer backup de la base de datos:**
   ```bash
   # PostgreSQL
   pg_dump -h localhost -U usuario -d basededatos > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Revisar el SQL generado:**
   ```bash
   npx prisma migrate dev --create-only
   cat prisma/migrations/YYYYMMDDHHMMSS_nombre/migration.sql
   ```

3. **Verificar compatibilidad de datos:**
   - ¿Hay datos que no cumplan las nuevas constraints?
   - ¿Hay columnas que se volverán NOT NULL?

### 2. Estrategias de Migración de Datos

#### A. Agregar Nuevas Tablas/Columnas (Sin Riesgo)

```sql
-- Siempre seguro, no afecta datos existentes
CREATE TABLE "NewTable" (...);
ALTER TABLE "ExistingTable" ADD COLUMN "newField" TEXT;
```

#### B. Modificar Columnas Existentes (Requiere Precaución)

```sql
-- ESTRATEGIA 1: Agregar columna nullable, migrar datos, luego hacer NOT NULL
ALTER TABLE "Product" ADD COLUMN "diagramData" JSONB;

-- Migrar datos en una transacción
UPDATE "Product" SET "diagramData" = jsonb_build_object(
  'nodes', COALESCE("diagram"->'nodes', '[]'),
  'edges', COALESCE("diagram"->'edges', '[]')
) WHERE "diagram" IS NOT NULL;

-- Hacer NOT NULL solo después de verificar datos
ALTER TABLE "Product" ALTER COLUMN "diagramData" SET NOT NULL;
```

#### C. Migrar Datos JSON a Tablas Relacionales

```sql
-- Paso 1: Crear nueva tabla
CREATE TABLE "Diagram" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"("id"),
  "nodes" JSONB DEFAULT '[]',
  "edges" JSONB DEFAULT '[]'
);

-- Paso 2: Migrar datos
INSERT INTO "Diagram" ("id", "productId", "nodes", "edges")
SELECT 
  gen_random_uuid()::text,
  "id",
  COALESCE("diagram"->'nodes', '[]'),
  COALESCE("diagram"->'edges', '[]')
FROM "Product" 
WHERE "diagram" IS NOT NULL;

-- Paso 3: Verificar migración
SELECT COUNT(*) as total_migrated FROM "Diagram";

-- Paso 4: Marcar campos antiguos como deprecated (NO eliminar todavía)
-- ALTER TABLE "Product" DROP COLUMN "diagram"; -- ⚠️ Solo después de validar
```

### 3. Manejo de Errores en Migraciones

#### Si una migración falla:

```bash
# 1. Verificar estado
npx prisma migrate status

# 2. Si quedó en estado inconsistente, marcar como rollback
npx prisma migrate resolve --rolled-back "20250101120000_migration_name"

# 3. Corregir el problema y reaplicar
npx prisma db push  # O crear nueva migración
```

#### Recuperación ante Fallos:

```bash
# Si la BD quedó en estado inconsistente
# 1. Restaurar desde backup (último recurso)
psql -h localhost -U usuario -d basededatos < backup_fecha.sql

# 2. O forzar sincronización (si estás seguro)
npx prisma db push --accept-data-loss  # ⚠️ Solo en desarrollo
```

## Buenas Prácticas

### 1. Migraciones Incrementales

- Una sola responsabilidad por migración
- Nombres descriptivos: `add_diagram_table`, `migrate_json_to_relational`
- Evitar migraciones que hagan múltiples cambios complejos

### 2. Compatibilidad Hacia Atrás

Mantener ambos formatos durante la transición:

```prisma
model Product {
  // Nuevo campo
  diagrams Diagram[]
  
  // Campos antiguos preservados temporalmente
  diagram Json? @deprecated
}
```

### 3. Validación de Datos

```typescript
// Script de verificación post-migración
async function verifyMigration(prisma: PrismaClient) {
  // Verificar que todos los productos tienen diagramas
  const productsWithoutDiagrams = await prisma.product.findMany({
    where: { diagrams: { none: {} } },
    include: { diagrams: true }
  });
  
  if (productsWithoutDiagrams.length > 0) {
    console.error('⚠️ Productos sin diagramas:', productsWithoutDiagrams.map(p => p.id));
    throw new Error('Migración incompleta');
  }
  
  console.log('✅ Verificación exitosa');
}
```

### 4. Tests de Migración

```typescript
// test/migrations.test.ts
describe('Diagram Migration', () => {
  it('should migrate old format to new table', async () => {
    // Crear producto con formato antiguo
    const product = await prisma.product.create({
      data: {
        name: 'Test',
        diagram: { nodes: [{ id: '1' }], edges: [] }
      }
    });
    
    // Ejecutar migración
    await runMigration();
    
    // Verificar resultado
    const migrated = await prisma.product.findUnique({
      where: { id: product.id },
      include: { diagrams: true }
    });
    
    expect(migrated?.diagrams).toHaveLength(1);
    expect(migrated?.diagrams[0].nodes).toEqual([{ id: '1' }]);
  });
});
```

## Checklist Pre-Migración

- [ ] Backup de base de datos creado
- [ ] SQL revisado manualmente
- [ ] Plan de rollback definido
- [ ] Tests ejecutados en ambiente de staging
- [ ] Ventana de mantenimiento coordinada (si aplica)
- [ ] Script de verificación preparado
- [ ] Documentación actualizada

## Comandos Útiles

```bash
# Ver diferencias entre schema y BD
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma

# Formatear schema
npx prisma format

# Validar schema
npx prisma validate

# Generar cliente sin migrar
npx prisma generate

# Ver consultas SQL generadas (debug)
export DEBUG="prisma:query"
npx ts-node script.ts
```

## Referencias

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Data Migration Patterns](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)
