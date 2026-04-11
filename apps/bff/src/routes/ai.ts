import { FastifyPluginAsync } from 'fastify';

interface ChatMessage { role: string; content: string; }
interface AiChatBody {
  provider: string;
  apiKey: string;
  model: string;
  customApiUrl?: string;
  messages: ChatMessage[];
}

interface AiReviewBody {
  provider: string;
  apiKey: string;
  model: string;
  customApiUrl?: string;
  spec: any;
}

const REVIEW_SYSTEM_PROMPT = `You are an expert REST API Design Reviewer. Analyze the provided OpenAPI specification and produce a formal, structured review report.

## Evaluation Criteria
1. **Resource URI Semantic**: Evaluate path naming, hierarchical structure, consistency
2. **HTTP Methods Usage**: Verify correct usage of GET, POST, PUT, PATCH, DELETE
3. **Status Codes**: Check appropriate status codes (200, 201, 400, 401, 403, 404, 500, etc.)
4. **Error Handling**: Assess error response schemas, consistency, meaningful messages
5. **Security Headers & Practices**: Check for security schemes, OAuth flows, API keys
6. **Naming Conventions**: Evaluate consistency of naming across paths, parameters, schemas
7. **Documentation Quality**: Assess descriptions, summaries, examples completeness

## Report Format
Produce a markdown report with the following structure:

### RESTful Maturity Score
Provide a visual KPI using ASCII art showing a score 0-100 with a progress bar and breakdown by category. Example:
\`\`\`
Overall Score: 72/100
[████████████████████░░░░░░░░░░░░░░░░░░░░░░] 72%

Categories:
  URI Design        [██████████████░░░░░░░░░] 65%
  HTTP Methods      [████████████████░░░░░░] 80%
  Status Codes     [████████████████████░░░] 85%
  Error Handling   [██████████░░░░░░░░░░░░░░] 50%
  Security         [██████████████████████░░] 90%
  Naming          [██████████████░░░░░░░░░░░] 65%
  Documentation    [████████████░░░░░░░░░░░░░] 60%
\`\`\`

### Critical Issues 🔴
For each critical issue found:
**Headline:** [Clear title of the issue]
**Description:** [Detailed explanation of why this is a problem and its impact]
**Example from Spec:** [Extract relevant YAML/JSON from the specification that demonstrates the issue]

### Warnings ⚠️
For each warning found:
**Headline:** [Clear title of the warning]
**Description:** [Explanation of the concern]
**Example from Spec:** [Relevant extract]

### Suggestions 💡
For each improvement suggestion:
**Headline:** [Clear title]
**Description:** [How to implement the improvement and why it helps]
**Example (if applicable):** [Suggested fix or best practice example]

### Summary of Findings
- **Total Critical Issues:** X
- **Total Warnings:** X
- **Total Suggestions:** X
- **Overall Assessment:** [Brief paragraph on API readiness for production]

Be specific, cite actual paths/operations from the spec, and ensure examples are real extracts not fabricated.`;

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

  fastify.post('/ai/review', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const body = request.body as AiReviewBody;
    const { provider, apiKey, model, customApiUrl, spec } = body;

    if (!model?.trim()) return reply.code(400).send({ error: 'Model is required' });
    if (!spec) return reply.code(400).send({ error: 'OpenAPI spec is required' });

    const specString = typeof spec === 'string' ? spec : JSON.stringify(spec);
    const userPrompt = `Please review the following OpenAPI specification:\n\n${specString.slice(0, 8000)}`;

    const needsApiKey = provider !== 'ollama';
    if (needsApiKey && !apiKey?.trim()) return reply.code(400).send({ error: 'API key is required' });

    const messages = [
      { role: 'system', content: REVIEW_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ];

    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 4096 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          return reply.code(res.status).send({ error: err?.error?.message ?? 'OpenAI request failed' });
        }
        const data: any = await res.json();
        return { content: data.choices?.[0]?.message?.content ?? '' };
      }

      if (provider === 'anthropic') {
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
            system: REVIEW_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
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
          body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 4096 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Groq request failed' });
        }
        const data: any = await res.json();
        return { content: data.choices?.[0]?.message?.content ?? '' };
      }

      if (provider === 'gemini') {
        const chatMsgs = [{ role: 'user', parts: [{ text: userPrompt }] }];
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: chatMsgs,
            systemInstruction: { parts: [{ text: REVIEW_SYSTEM_PROMPT }] }
          }),
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
        let reqBody: any;

        if (useOpenAiFormat) {
          url = `${baseUrl}/chat/completions`;
          reqBody = { model, messages };
        } else {
          url = `${baseUrl}/api/chat`;
          reqBody = { model, messages, stream: false };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ status: res.status, err }, 'Ollama review request failed');
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
      fastify.log.error(err, 'AI review proxy error');
      return reply.code(502).send({ error: 'Failed to reach AI provider' });
    }
  });

};

export default aiRoutes;
