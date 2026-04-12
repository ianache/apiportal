import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USERS = [
  {
    sub: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'API_MANAGER' as const,
  },
  {
    sub: 'user-2',
    email: 'designer@example.com',
    name: 'Designer User',
    role: 'API_DESIGNER' as const,
  },
  {
    sub: 'user-3',
    email: 'dev1@example.com',
    name: 'Developer One',
    role: 'API_DEVELOPER' as const,
  },
  {
    sub: 'user-4',
    email: 'dev2@example.com',
    name: 'Developer Two',
    role: 'API_DEVELOPER' as const,
  },
];

async function main() {
  console.log('Seeding mock users...');

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { sub: user.sub },
      update: { 
        name: user.name, 
        email: user.email,
        role: user.role
      },
      create: user,
    });
    console.log(`✓ ${user.name}`);
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
