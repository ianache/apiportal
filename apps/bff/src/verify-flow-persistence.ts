import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Integration Flow E2E Verification...');

  try {
    // 1. Create a test Integration
    console.log('1. Creating test integration...');
    const integration = await prisma.integration.create({
      data: {
        name: 'E2E Test Integration',
        type: 'HTTP',
        description: 'Verification of flow persistence',
        status: 'DRAFT',
      }
    });
    console.log('✅ Integration created:', integration.id);

    // 2. Create a version for this integration
    console.log('2. Creating integration version...');
    const version = await prisma.integrationVersion.create({
      data: {
        integrationId: integration.id,
        version: '1.0.0',
        status: 'Design',
        description: 'Initial design',
      }
    });
    console.log('✅ Version created:', version.id);

    // 3. Define a complex flow
    const testFlow = {
      type: 'integration-flow',
      nodes: [
        { id: 'n1', type: 'protocol', data: { typeId: 'http-listener@v1', label: 'Inbound' } },
        { id: 'n2', type: 'filter', data: { typeId: 'schema-validator@v1', label: 'Validate' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' }
      ]
    };

    // 4. Update definition
    console.log('3. Updating flow definition...');
    const updatedVersion = await prisma.integrationVersion.update({
      where: { id: version.id },
      data: { definition: testFlow }
    });
    console.log('✅ Definition updated');

    // 5. Verify persistence
    console.log('4. Verifying persistence...');
    const fetched = await prisma.integrationVersion.findUnique({
      where: { id: version.id }
    });

    const isMatch = (a: any, b: any) => JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort());

    // Simple deep equality check for verification
    const deepEqual = (x: any, y: any): boolean => {
      return (x && y && typeof x === 'object' && typeof y === 'object') ?
        (Object.keys(x).length === Object.keys(y).length &&
          Object.keys(x).every(key => deepEqual(x[key], y[key]))) : (x === y);
    };

    if (deepEqual(fetched?.definition, testFlow)) {
      console.log('✅ E2E SUCCESS: Flow definition persisted and retrieved correctly.');
    } else {
      console.error('❌ E2E FAILURE: Retreived definition does not match.');
      console.log('Expected:', JSON.stringify(testFlow));
      console.log('Actual:', JSON.stringify(fetched?.definition));
      process.exit(1);
    }

    // Cleanup
    console.log('5. Cleaning up...');
    await prisma.integration.delete({ where: { id: integration.id } });
    console.log('✅ Cleanup complete.');

  } catch (error) {
    console.error('❌ ERROR during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
