import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const ENVIRONMENTS = [
    {
        id: 'a272f1eb-9ca5-4b6b-8d74-1315f228f6be',
        slug: 'devk8sc',
        name: 'DEV Kubernetes Cloud',
        tags: ['dev', 'cloud', 'kubernetes'],
    },
    {
        id: '22d30935-783e-4234-aa00-6f2b2ea34785',
        slug: 'qak8sc',
        name: 'DEV Kubernetes QA',
        tags: ['qa', 'kubernetes', 'cloud'],
    },
    {
        id: 'dde060d2-a7ed-457f-8f4a-72b8a460a74e',
        slug: 'prodk8sc',
        name: 'PROD Kubernetes Cloud',
        tags: ['prod', 'kubernetes', 'cloud'],
    },
    {
        id: '3a608ff5-085b-476c-a55b-0f5e0e4847cb',
        slug: 'devk8op',
        name: 'DEV Kubernetes OnPremise',
        tags: ['dev', 'kubernetes', 'on-premise'],
    },
    {
        id: '56b6613c-eeb1-4b54-84ea-8dc7d74ca2be',
        slug: 'qak8op',
        name: 'QA Kubernetes OnPremise',
        tags: ['qa', 'kubernetes', 'on-premise'],
    },
    {
        id: '92cc7401-9374-4a95-b0d8-3f29241e66fb',
        slug: 'prodk8op',
        name: 'PROD Kubernetes OnPremise',
        tags: ['prod', 'kubernetes', 'on-premise'],
    },
];
async function main() {
    console.log('Seeding Environments...');
    for (const env of ENVIRONMENTS) {
        await prisma.environment.upsert({
            where: { id: env.id },
            update: { slug: env.slug, name: env.name, tags: env.tags },
            create: { id: env.id, slug: env.slug, name: env.name, tags: env.tags },
        });
        console.log(`✓ ${env.name}`);
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
