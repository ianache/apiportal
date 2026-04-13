import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando Seed de Arquitectura SWCI...');

  // 1. Definición de Tipos de Componentes (ConfigurationItemType)
  // Basado en el catálogo estándar de arquitectura
  const swciTypes = [
    {
      name: 'API',
      icon: 'api',
      description: 'Interfaz de programación de aplicaciones expuesta para consumo.',
      specifications: [
        { name: 'Protocol', dataType: 'string', required: true, description: 'Protocolo de comunicación (REST, GraphQL, SOAP, etc.)' },
        { name: 'Base Path', dataType: 'string', required: true, description: 'Ruta base del recurso' },
        { name: 'Is Public', dataType: 'boolean', required: false, description: 'Define si el API es accesible externamente' },
        { name: 'Max Latency MS', dataType: 'integer', required: false, description: 'Latencia máxima permitida en milisegundos' }
      ]
    },
    {
      name: 'MICROSERVICE',
      icon: 'settings_input_component',
      description: 'Servicio independiente que encapsula una lógica de negocio específica.',
      specifications: [
        { name: 'Runtime', dataType: 'string', required: true, description: 'Entorno de ejecución (Node.js, Java, Go, etc.)' },
        { name: 'Repository URL', dataType: 'string', required: false, description: 'Enlace al repositorio de código fuente' },
        { name: 'Replicas', dataType: 'integer', required: true, description: 'Número de instancias en ejecución' },
        { name: 'Auto-scale', dataType: 'boolean', required: false, description: 'Habilitar escalado automático' }
      ]
    },
    {
      name: 'DATABASE',
      icon: 'database',
      description: 'Almacén de datos persistente (SQL o NoSQL).',
      specifications: [
        { name: 'Engine', dataType: 'string', required: true, description: 'Motor de base de datos (Postgres, MongoDB, Redis, etc.)' },
        { name: 'Port', dataType: 'integer', required: true, description: 'Puerto de conexión' },
        { name: 'Version', dataType: 'string', required: false, description: 'Versión del motor' },
        { name: 'Read Only', dataType: 'boolean', required: false, description: 'Instancia de solo lectura (Replica)' }
      ]
    },
    {
      name: 'FRONTEND',
      icon: 'web',
      description: 'Aplicación cliente o interfaz de usuario.',
      specifications: [
        { name: 'Framework', dataType: 'string', required: true, description: 'Framework utilizado (React, Vue, Angular, etc.)' },
        { name: 'Public URL', dataType: 'string', required: true, description: 'URL pública de la aplicación' },
        { name: 'Analytics ID', dataType: 'string', required: false, description: 'ID de seguimiento para analítica' }
      ]
    },
    {
      name: 'MESSAGE_BROKER',
      icon: 'swap_horiz',
      description: 'Sistema de mensajería asíncrona o bus de eventos.',
      specifications: [
        { name: 'Technology', dataType: 'string', required: true, description: 'Tecnología (Kafka, RabbitMQ, SQS, etc.)' },
        { name: 'Topic Count', dataType: 'integer', required: false, description: 'Número de tópicos o colas definidas' },
        { name: 'Is Persistent', dataType: 'boolean', required: true, description: 'Define si los mensajes se persisten en disco' }
      ]
    },
    {
      name: 'EXTERNAL_SERVICE',
      icon: 'cloud',
      description: 'Servicio proveído por un tercero (SaaS, Cloud Provider).',
      specifications: [
        { name: 'Vendor', dataType: 'string', required: true, description: 'Proveedor del servicio (AWS, Azure, Google, Stripe, etc.)' },
        { name: 'SLA Guaranteed', dataType: 'boolean', required: false, description: 'Define si existe un contrato de nivel de servicio' },
        { name: 'Cost Center', dataType: 'string', required: false, description: 'Centro de costos asociado' }
      ]
    },
    {
      name: 'APP_MOBILE',
      icon: 'smartphone',
      description: 'Aplicación nativa o híbrida para dispositivos móviles.',
      specifications: [
        { name: 'Platform', dataType: 'string', required: true, description: 'Plataforma (Android, iOS, Huawei)' },
        { name: 'Min OS Version', dataType: 'string', required: false, description: 'Versión mínima de SO soportada' },
        { name: 'Push Notifications', dataType: 'boolean', required: false, description: 'Habilitar soporte para notificaciones push' }
      ]
    }
  ];

  for (const typeData of swciTypes) {
    const { specifications, ...typeInfo } = typeData;

    // Crear o actualizar el Tipo de SWCI
    const createdType = await prisma.configurationItemType.upsert({
      where: { name: typeInfo.name },
      update: { 
        icon: typeInfo.icon,
        // Eliminamos la descripción del update si el modelo no la tiene aún, 
        // pero la incluimos en el create por si acaso se añade al schema.
      },
      create: {
        name: typeInfo.name,
        icon: typeInfo.icon
      }
    });

    console.log(`✅ Tipo Procesado: ${createdType.name}`);

    // Crear especificaciones de propiedades para este tipo
    for (const spec of specifications) {
      const specId = `spec-${createdType.name}-${spec.name}`.toLowerCase().replace(/ /g, '-');
      
      await prisma.propertySpecification.upsert({
        where: { id: specId },
        update: {
          dataType: spec.dataType,
          required: spec.required,
          // description: spec.description (si el modelo soporta description en el futuro)
        },
        create: {
          id: specId,
          name: spec.name,
          dataType: spec.dataType,
          required: spec.required,
          typeId: createdType.id
        }
      });
      console.log(`   🔸 Propiedad: ${spec.name} (${spec.dataType})`);
    }
  }

  console.log('✨ Seed finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
