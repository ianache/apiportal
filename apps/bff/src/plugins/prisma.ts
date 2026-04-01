import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
};

export default fp(prismaPlugin);
