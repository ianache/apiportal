import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const fieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'integer', 'date']),
  required: z.boolean().default(false),
});

const createTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
});

const updateTypeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  fields: z.array(fieldSchema).optional(),
});

const knowledgePieceRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /knowledge-types - List all knowledge piece types
  fastify.get('/knowledge-types', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const types = await fastify.prisma.knowledgePieceType.findMany({
      orderBy: { name: 'asc' }
    });
    return types;
  });

  // GET /knowledge-types/:id - Get a knowledge piece type by ID
  fastify.get('/knowledge-types/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const type = await fastify.prisma.knowledgePieceType.findUnique({
      where: { id }
    });
    if (!type) return reply.code(404).send({ error: 'Knowledge piece type not found' });
    return type;
  });

  // POST /knowledge-types - Create a new knowledge piece type
  fastify.post('/knowledge-types', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const data = createTypeSchema.parse(request.body);
    try {
      const type = await fastify.prisma.knowledgePieceType.create({
        data: {
          name: data.name,
          description: data.description,
          fields: data.fields,
        }
      });
      return type;
    } catch (e: any) {
      if (e.code === 'P2002') 
        return reply.code(409).send({ error: 'A knowledge piece type with this name already exists' });
      throw e;
    }
  });

  // PATCH /knowledge-types/:id - Update a knowledge piece type
  fastify.patch('/knowledge-types/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const data = updateTypeSchema.parse(request.body);

    const existing = await fastify.prisma.knowledgePieceType.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Knowledge piece type not found' });

    try {
      const type = await fastify.prisma.knowledgePieceType.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          fields: data.fields,
        }
      });
      return type;
    } catch (e: any) {
      if (e.code === 'P2002')
        return reply.code(409).send({ error: 'A knowledge piece type with this name already exists' });
      throw e;
    }
  });

  // DELETE /knowledge-types/:id - Delete a knowledge piece type
  fastify.delete('/knowledge-types/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.knowledgePieceType.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Knowledge piece type not found' });

    await fastify.prisma.knowledgePieceType.delete({ where: { id } });
    return reply.code(204).send();
  });

  // POST /knowledge - Add a new knowledge piece
  fastify.post('/knowledge', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const schema = z.object({
      typeId: z.string(),
      domainId: z.string(),
      title: z.string().min(1),
      content: z.string().min(1),
      metadata: z.any().optional(),
    });

    const data = schema.parse(request.body);

    const typeExists = await fastify.prisma.knowledgePieceType.findUnique({ where: { id: data.typeId } });
    if (!typeExists) return reply.code(400).send({ error: 'Invalid knowledge piece type' });

    const piece = await fastify.prisma.knowledgePiece.create({
      data: {
        typeId: data.typeId,
        domainId: data.domainId,
        title: data.title,
        content: data.content,
        metadata: data.metadata || {},
      }
    });

    return piece;
  });

  // POST /knowledge/search - Search knowledge pieces
  fastify.post('/knowledge/search', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const schema = z.object({
      query: z.string().min(1).optional(),
      domainId: z.string(),
      typeId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    });

    const { query, domainId, typeId, limit, offset } = schema.parse(request.body);

    const where: any = { domainId };
    if (typeId) where.typeId = typeId;

    let pieces = await fastify.prisma.knowledgePiece.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: { 
        type: { select: { id: true, name: true, fields: true } }
      }
    });

    let results = pieces.map(piece => ({
      id: piece.id,
      title: piece.title,
      content: piece.content,
      metadata: piece.metadata,
      typeName: piece.type.name,
      createdAt: piece.createdAt,
    }));

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.content.toLowerCase().includes(q)
      );
    }

    const total = await fastify.prisma.knowledgePiece.count({ where });

    return { results, total };
  });

  // GET /knowledge/:id - Get a knowledge piece
  fastify.get('/knowledge/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const { id } = request.params as { id: string };
    const piece = await fastify.prisma.knowledgePiece.findUnique({
      where: { id },
      include: { 
        type: { select: { id: true, name: true, fields: true } }
      }
    });
    if (!piece) return reply.code(404).send({ error: 'Knowledge piece not found' });

    return {
      id: piece.id,
      typeId: piece.typeId,
      typeName: piece.type.name,
      typeFields: piece.type.fields,
      domainId: piece.domainId,
      title: piece.title,
      content: piece.content,
      metadata: piece.metadata,
      createdAt: piece.createdAt,
      updatedAt: piece.updatedAt,
    };
  });

  // DELETE /knowledge/:id - Delete a knowledge piece
  fastify.delete('/knowledge/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.knowledgePiece.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Knowledge piece not found' });

    await fastify.prisma.knowledgePiece.delete({ where: { id } });
    return reply.code(204).send();
  });

};

export default knowledgePieceRoutes;
