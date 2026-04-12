import { FastifyPluginAsync } from 'fastify';

interface SyncModelsBody {
  apiKey: string;
  apiUrl?: string;
}

const ANTHROPIC_MODELS = [
  'claude-3-5-sonnet-latest',
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-latest',
  'claude-3-opus-20240229',
  'claude-3-sonnet-latest',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-latest',
  'claude-3-haiku-20240307',
];

const llmProvidersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    try {
      const providers = await fastify.prisma.lLMProvider.findMany({
        orderBy: { label: 'asc' }
      });
      return reply.send(providers);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/', async (request, reply) => {
    if (request.user.role !== 'API_MANAGER') {
      return reply.code(403).send({ error: 'Forbidden', message: 'Only API_MANAGER can modify LLM Providers' });
    }

    const { id, label, models } = request.body as any;
    if (!id || !label || !models || !Array.isArray(models)) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Invalid payload. Requires id, label and models array.' });
    }

    try {
      const provider = await fastify.prisma.lLMProvider.upsert({
        where: { id },
        update: { label, models },
        create: { id, label, models }
      });
      return reply.status(201).send(provider);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.patch('/:id/models', async (request, reply) => {
    const { id } = request.params as any;
    const { model } = request.body as any;
    if (!model?.trim()) return reply.code(400).send({ error: 'model is required' });

    const provider = await fastify.prisma.lLMProvider.findUnique({ where: { id } });
    if (!provider) return reply.code(404).send({ error: 'Provider not found' });

    const models = [...new Set([...provider.models, model.trim()])];
    const updated = await fastify.prisma.lLMProvider.update({ where: { id }, data: { models } });
    return reply.send(updated);
  });

  fastify.post('/:id/sync-models', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { apiKey, apiUrl } = request.body as SyncModelsBody;

    if (!apiKey?.trim()) {
      return reply.code(400).send({ error: 'API key is required to sync models' });
    }

    let availableModels: string[] = [];

    try {
      if (id === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          fastify.log.error({ status: res.status, error: err }, 'OpenAI models sync error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Failed to fetch OpenAI models' });
        }
        const data: any = await res.json();
        availableModels = (data.data || [])
          .map((m: any) => m.id)
          .filter((id: string) => !id.startsWith('gpt-3') && !id.startsWith('dall-e') && !id.startsWith('babbage'))
          .sort();

      } else if (id === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          fastify.log.error({ status: res.status, error: err }, 'Groq models sync error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Failed to fetch Groq models' });
        }
        const data: any = await res.json();
        availableModels = (data.data || [])
          .map((m: any) => m.id)
          .sort();

      } else if (id === 'anthropic') {
        availableModels = ANTHROPIC_MODELS;

      } else if (id === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          fastify.log.error({ status: res.status, error: err }, 'Gemini models sync error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Failed to fetch Gemini models' });
        }
        const data: any = await res.json();
        availableModels = (data.models || [])
          .map((m: any) => m.name?.replace('models/', ''))
          .filter(Boolean)
          .sort();

      } else if (id === 'ollama') {
        const baseUrl = (apiUrl || 'http://localhost:11434').replace(/\/$/, '');
        let url = `${baseUrl}/api/tags`;
        
        const res = await fetch(url);
        if (!res.ok) {
          fastify.log.error({ status: res.status, url }, 'Ollama models sync error');
          return reply.code(res.status).send({ error: 'Failed to fetch Ollama models' });
        }
        const data: any = await res.json();
        availableModels = (data.models || [])
          .map((m: any) => m.name)
          .filter(Boolean)
          .sort();

      } else {
        return reply.code(400).send({ error: `Provider ${id} does not support model sync` });
      }

      return reply.send({ models: availableModels });

    } catch (err: any) {
      fastify.log.error({ provider: id, error: err.message, stack: err.stack }, 'Models sync error');
      return reply.code(500).send({ error: 'Failed to sync models: ' + err.message });
    }
  });

};

export default llmProvidersRoute;
