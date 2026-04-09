import { FastifyPluginAsync } from 'fastify';

interface ChatMessage { role: string; content: string; }
interface AiChatBody {
  provider: string;
  apiKey: string;
  model: string;
  customApiUrl?: string;
  messages: ChatMessage[];
}

const aiRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.post('/ai/chat', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const body = request.body as AiChatBody;
    fastify.log.info({ body }, 'AI chat raw body');

    const { provider, apiKey, model, customApiUrl, messages } = body;

    fastify.log.info({ provider, apiKey: apiKey?.slice(0,10), model, messagesLen: messages?.length }, 'AI chat request');

    if (!model?.trim())     return reply.code(400).send({ error: 'Model is required' });
    if (!Array.isArray(messages) || !messages.length)
      return reply.code(400).send({ error: 'Messages are required' });

    const needsApiKey = provider !== 'ollama';
    if (needsApiKey && !apiKey?.trim()) return reply.code(400).send({ error: 'API key is required' });

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

      if (provider === 'gemini') {
        const systemMsg = messages.find(m => m.role === 'system');
        const chatMsgs = messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        if (systemMsg) {
          chatMsgs.unshift({ role: 'user', parts: [{ text: systemMsg.content }] });
        }
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: chatMsgs }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Gemini request failed' });
        }
        const data: any = await res.json();
        return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' };
      }

      if (provider === 'ollama') {
        const baseUrl = (customApiUrl || 'http://localhost:11434').replace(/\/$/, '');
        const useOpenAiFormat = baseUrl.includes('/v1');
        
        let url: string;
        let body: any;

        if (useOpenAiFormat) {
          url = `${baseUrl}/chat/completions`;
          body = { model, messages: messages.filter(m => m.role !== 'system') };
        } else {
          url = `${baseUrl}/api/chat`;
          body = { model, messages: messages.filter(m => m.role !== 'system'), stream: false };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ status: res.status, err }, 'Ollama request failed');
          return reply.code(res.status).send({ error: err?.error ?? err?.message ?? 'Ollama request failed' });
        }
        const data: any = await res.json();
        const content = useOpenAiFormat 
          ? data.choices?.[0]?.message?.content ?? ''
          : data.message?.content ?? '';
        return { content };
      }

      return reply.code(400).send({ error: `Unsupported provider: ${provider}` });

    } catch (err: any) {
      fastify.log.error(err, 'AI chat proxy error');
      return reply.code(502).send({ error: 'Failed to reach AI provider' });
    }
  });

};

export default aiRoutes;
