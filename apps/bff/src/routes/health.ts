import { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    try {
      // Basic check: database connectivity
      await fastify.prisma.$queryRaw`SELECT 1`;
      
      return { 
        status: 'UP', 
        database: 'CONNECTED',
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(503).send({ 
        status: 'DOWN', 
        database: 'UNAVAILABLE',
        timestamp: new Date().toISOString() 
      });
    }
  });
};

export default healthRoutes;
