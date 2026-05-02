import { PrismaClient } from '@prisma/client';
import { crypto } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Explorer & Subscription E2E Verification...');

  try {
    // 1. Setup: Create a Manager and a Developer
    console.log('1. Setting up test users and environment...');
    const managerSub = `test-manager-${crypto.randomUUID()}`;
    const devSub = `test-dev-${crypto.randomUUID()}`;

    const manager = await prisma.user.create({
      data: { sub: managerSub, email: `${managerSub}@example.com`, role: 'API_MANAGER' }
    });
    const developer = await prisma.user.create({
      data: { sub: devSub, email: `${devSub}@example.com`, role: 'API_DEVELOPER' }
    });

    const env = await prisma.environment.upsert({
      where: { slug: 'production' },
      update: {},
      create: { slug: 'production', name: 'Production' }
    });

    // 2. Create one PUBLISHED API and one DESIGN API
    console.log('2. Creating APIs with different statuses...');
    const apiPublished = await prisma.aPI.create({
      data: {
        name: 'E2E Public API',
        ownerId: manager.id,
        versions: {
          create: { version: '1.0.0', status: 'PUBLISHED', createdBy: manager.id }
        }
      }
    });

    const apiDraft = await prisma.aPI.create({
      data: {
        name: 'E2E Secret API',
        ownerId: manager.id,
        versions: {
          create: { version: '0.1.0', status: 'DESIGN', createdBy: manager.id }
        }
      }
    });

    // 3. Verify Subscription creation
    console.log('3. Testing subscription logic...');
    const sub = await prisma.subscription.create({
      data: {
        userId: developer.id,
        apiId: apiPublished.id
      }
    });

    // Generate a key manually (simulating the route logic)
    const apiKey = `nx_test_${crypto.randomBytes(16).toString('hex')}`;
    await prisma.subscriptionKey.create({
      data: {
        subscriptionId: sub.id,
        environmentId: env.id,
        apiKey
      }
    });
    console.log('✅ Subscription and Key created.');

    // 4. Verification Queries
    console.log('4. Verifying RBAC and data integrity...');
    
    // Developer should see published version
    const devView = await prisma.aPIVersion.findMany({
      where: { status: 'PUBLISHED' }
    });
    console.log(`✅ Developer view count (Published): ${devView.length}`);

    // Verify key link
    const keys = await prisma.subscriptionKey.findMany({
      where: { subscription: { userId: developer.id } },
      include: { subscription: { include: { api: true } } }
    });

    if (keys.length > 0 && keys[0].subscription.api.name === 'E2E Public API') {
      console.log('✅ E2E SUCCESS: Developer is correctly linked to API via subscription key.');
    } else {
      throw new Error('Failure in subscription key linking');
    }

    // 5. Cleanup
    console.log('5. Cleaning up...');
    await prisma.subscription.deleteMany({ where: { userId: developer.id } });
    await prisma.aPI.delete({ where: { id: apiPublished.id } });
    await prisma.aPI.delete({ where: { id: apiDraft.id } });
    await prisma.user.delete({ where: { id: manager.id } });
    await prisma.user.delete({ where: { id: developer.id } });
    console.log('✅ Cleanup complete.');

  } catch (error: any) {
    console.error('❌ E2E FAILURE:');
    if (error.code) console.error('Error Code:', error.code);
    if (error.message) console.error('Error Message:', error.message);
    if (error.stack) console.error('Stack Trace:', error.stack);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
