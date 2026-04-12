import { FastifyPluginAsync } from 'fastify';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users - Obtiene todos los usuarios para asignación de roles/owners
  fastify.get('/users', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    
    return fastify.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { 
        name: 'asc' 
      }
    });
  });
};

export default userRoutes;
