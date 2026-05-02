/**
 * Script de verificación post-migración de diagramas
 * 
 * Este script verifica que:
 * 1. Todos los productos tienen al menos un diagrama
 * 2. Los datos migrados son consistentes
 * 3. No hay productos huérfanos sin diagramas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDiagramMigration() {
  console.log('🔍 Iniciando verificación de migración de diagramas...\n');

  try {
    // 1. Contar productos totales
    const totalProducts = await prisma.product.count();
    console.log(`📦 Total de productos: ${totalProducts}`);

    // 2. Contar diagramas en tabla nueva
    const totalDiagrams = await prisma.diagram.count();
    console.log(`📊 Total de diagramas migrados: ${totalDiagrams}`);

    // 3. Productos con datos en formato antiguo (JSON)
    const productsWithOldFormat = await prisma.product.count({
      where: {
        OR: [
          { diagram: { not: null } },
          { diagrams: { not: null } }
        ]
      }
    });
    console.log(`📝 Productos con formato antiguo: ${productsWithOldFormat}`);

    // 4. Productos sin diagramas (problema!)
    const productsWithoutDiagrams = await prisma.product.findMany({
      where: {
        diagramList: { none: {} }
      },
      select: {
        id: true,
        name: true,
        diagram: true,
        diagrams: true
      }
    });

    if (productsWithoutDiagrams.length > 0) {
      console.error(`\n❌ ERROR: ${productsWithoutDiagrams.length} productos sin diagramas:`);
      productsWithoutDiagrams.forEach(p => {
        console.error(`   - ${p.name} (${p.id})`);
        console.error(`     diagram: ${p.diagram ? 'Sí' : 'No'}, diagrams: ${p.diagrams ? 'Sí' : 'No'}`);
      });
      throw new Error('Migración incompleta: hay productos sin diagramas');
    }

    // 5. Verificar consistencia de datos
    const inconsistentProducts = await prisma.product.findMany({
      where: {
        diagramList: { some: {} }
      },
      include: {
        diagramList: true
      }
    });

    let inconsistencies = 0;
    for (const product of inconsistentProducts) {
      for (const diagram of product.diagramList) {
        // Verificar que nodes y edges son arrays válidos
        if (!Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) {
          console.error(`⚠️ Diagrama inconsistente: ${diagram.id} del producto ${product.name}`);
          console.error(`   nodes: ${typeof diagram.nodes}, edges: ${typeof diagram.edges}`);
          inconsistencies++;
        }
      }
    }

    if (inconsistencies > 0) {
      throw new Error(`Hay ${inconsistencies} diagramas con datos inconsistentes`);
    }

    // 6. Estadísticas adicionales
    const diagramStats = await prisma.diagram.groupBy({
      by: ['productId'],
      _count: {
        id: true
      }
    });

    const productsWithMultipleDiagrams = diagramStats.filter(s => s._count.id > 1);
    console.log(`\n📈 Estadísticas:`);
    console.log(`   - Productos con múltiples diagramas: ${productsWithMultipleDiagrams.length}`);
    console.log(`   - Promedio de diagramas por producto: ${(totalDiagrams / totalProducts).toFixed(2)}`);

    console.log('\n✅ Verificación completada exitosamente');
    console.log('   Todos los productos tienen sus diagramas correctamente migrados.\n');

  } catch (error) {
    console.error('\n❌ Verificación fallida:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyDiagramMigration();
}

export { verifyDiagramMigration };
