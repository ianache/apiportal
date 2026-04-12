import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SWCI Types and Property Specifications...');

  const types = [
    {
      name: 'API',
      icon: 'api',
      specs: [
        { name: 'Protocol', dataType: 'string', required: true },
        { name: 'Auth Method', dataType: 'string', required: false },
        { name: 'Is Public', dataType: 'boolean', required: false },
      ]
    },
    {
      name: 'MICROSERVICE',
      icon: 'settings_input_component',
      specs: [
        { name: 'Runtime', dataType: 'string', required: true },
        { name: 'Auto-scale', dataType: 'boolean', required: false },
      ]
    },
    {
      name: 'DATABASE',
      icon: 'database',
      specs: [
        { name: 'Engine', dataType: 'string', required: true },
        { name: 'Port', dataType: 'integer', required: true },
      ]
    },
    {
      name: 'FRONTEND',
      icon: 'web',
      specs: [
        { name: 'Framework', dataType: 'string', required: true },
      ]
    },
    {
      name: 'EXTERNAL_SERVICE',
      icon: 'cloud',
      specs: [
        { name: 'Vendor', dataType: 'string', required: true },
      ]
    },
    {
      name: 'MESSAGE_BROKER',
      icon: 'swap_horiz',
      specs: [
        { name: 'Topic Count', dataType: 'integer', required: false },
      ]
    }
  ];

  for (const t of types) {
    const createdType = await prisma.configurationItemType.upsert({
      where: { name: t.name },
      update: { icon: t.icon },
      create: { 
        name: t.name,
        icon: t.icon
      }
    });

    for (const s of t.specs) {
      await prisma.propertySpecification.upsert({
        // We use a combination of typeId and name to uniquely identify specs if needed, 
        // but Prisma model doesn't have unique constraint on name+typeId yet.
        // For simplicity in seeding, we just create them if they don't exist.
        where: { id: `spec-${createdType.name}-${s.name}`.toLowerCase().replace(/ /g, '-') },
        update: { dataType: s.dataType, required: s.required },
        create: {
          id: `spec-${createdType.name}-${s.name}`.toLowerCase().replace(/ /g, '-'),
          name: s.name,
          dataType: s.dataType,
          required: s.required,
          typeId: createdType.id
        }
      });
    }
    console.log(`✓ Type: ${t.name}`);
  }

  // Populate existing SWCIs with a default type (MICROSERVICE) if they have no typeId
  const orphanSwcis = await prisma.softwareConfigurationItem.findMany({
    where: { typeId: null }
  });

  if (orphanSwcis.length > 0) {
    const defaultType = await prisma.configurationItemType.findUnique({ where: { name: 'MICROSERVICE' } });
    if (defaultType) {
      await prisma.softwareConfigurationItem.updateMany({
        where: { typeId: null },
        data: { typeId: defaultType.id }
      });
      console.log(`✓ Migrated ${orphanSwcis.length} orphan SWCIs to MICROSERVICE type`);
    }
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
