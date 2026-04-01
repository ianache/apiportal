import { FastifyPluginAsync } from 'fastify';

interface ChatMessage { role: string; content: string; }
interface AiChatBody {
  provider: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
}

const aiRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.post('/ai/chat', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const { provider, apiKey, model, messages } = request.body as AiChatBody;

    if (!apiKey?.trim())    return reply.code(400).send({ error: 'API key is required' });
    if (!model?.trim())     return reply.code(400).send({ error: 'Model is required' });
    if (!Array.isArray(messages) || !messages.length)
      return reply.code(400).send({ error: 'Messages are required' });

    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 4096 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          return reply.code(res.status).send({ error: err?.error?.message ?? 'OpenAI request failed' });
        }
        const data: any = await res.json();
        return { content: data.choices?.[0]?.message?.content ?? '' };
      }

      if (provider === 'anthropic') {
        const systemMsg = messages.find(m => m.role === 'system');
        const chatMsgs  = messages.filter(m => m.role !== 'system');
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            ...(systemMsg ? { system: systemMsg.content } : {}),
            messages: chatMsgs,
          }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Anthropic request failed' });
        }
        const data: any = await res.json();
        return { content: data.content?.[0]?.text ?? '' };
      }

      if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 4096 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Groq request failed' });
        }
        const data: any = await res.json();
        return { content: data.choices?.[0]?.message?.content ?? '' };
      }

      return reply.code(400).send({ error: `Unsupported provider: ${provider}` });

    } catch (err: any) {
      fastify.log.error(err, 'AI chat proxy error');
      return reply.code(502).send({ error: 'Failed to reach AI provider' });
    }
  });

};

export default aiRoutes;
