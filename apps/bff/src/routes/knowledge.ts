import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { embeddingService } from '../services/embedding.js';
import { qdrantService } from '../services/qdrant.js';

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

    try {
      const textToEmbed = `${data.title}\n\n${data.content}`;
      fastify.log.info(`Generating embedding for: ${data.title}`);
      const embedding = await embeddingService.generateEmbedding(textToEmbed);
      fastify.log.info({ vectorSize: embedding.length, vectorSample: embedding.slice(0, 5) }, `Embedding generated`);

      fastify.log.info(`Ensuring collection 'kbapi' exists with vector size ${embedding.length}`);
      await qdrantService.ensureCollection(embedding.length);
      fastify.log.info(`Collection 'kbapi' ready`);

      const point = {
        id: piece.id,
        vector: embedding,
        payload: {
          title: data.title,
          content: data.content,
          typeId: data.typeId,
          domainId: data.domainId,
          metadata: data.metadata || {},
          createdAt: piece.createdAt.toISOString(),
        }
      };
      fastify.log.info({ pointId: point.id, vectorLength: point.vector.length }, `Upserting point to QDrant`);
      await qdrantService.upsertPoint(point);
      fastify.log.info(`Point ${piece.id} upserted successfully to collection 'kbapi'`);
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to store embedding in QDrant');
    }

    return piece;
  });

  // POST /knowledge/search - Search knowledge pieces using QDrant vector search
  fastify.post('/knowledge/search', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const schema = z.object({
      query: z.string().min(1),
      domainId: z.string().optional(),
      typeId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    });

    const { query, domainId, typeId, limit } = schema.parse(request.body);

    fastify.log.info(`Searching knowledge base with query: "${query}"`);

    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      fastify.log.info(`Query embedding generated, vector size: ${queryEmbedding.length}`);

      const searchResults = await qdrantService.searchPoints(queryEmbedding, limit, { domainId, typeId });
      fastify.log.info(`QDrant returned ${searchResults.length} results`);

      const results = searchResults.map((result: any) => ({
        id: result.id,
        title: result.payload?.title || '',
        content: result.payload?.content || '',
        metadata: result.payload?.metadata || {},
        typeId: result.payload?.typeId || '',
        domainId: result.payload?.domainId || '',
        score: result.score,
        createdAt: result.payload?.createdAt,
      }));

      return { results, total: results.length };
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to search in QDrant');
      return reply.code(500).send({ error: 'Search failed', details: (error as Error).message });
    }
  });

  // GET /knowledge/:id - Get a knowledge piece
  fastify.get('/knowledge/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const { id } = request.params as { id: string };
    const piece = await fastify.prisma.knowledgePiece.findUnique({
      where: { id }
    });
    if (!piece) return reply.code(404).send({ error: 'Knowledge piece not found' });

    const type = await fastify.prisma.knowledgePieceType.findUnique({
      where: { id: piece.typeId },
      select: { id: true, name: true, fields: true }
    });

    return {
      id: piece.id,
      typeId: piece.typeId,
      typeName: type?.name || 'Unknown',
      typeFields: type?.fields || [],
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

    try {
      await qdrantService.deletePoint(id);
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to delete embedding from QDrant');
    }

    return reply.code(204).send();
  });

};

export default knowledgePieceRoutes;
