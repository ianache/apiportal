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

interface AiSqlGenerateBody {
  prompt: string;
  provider: string;
  apiKey: string;
  model: string;
  customApiUrl?: string;
}

interface AiERGenerateBody {
  prompt: string;
  provider: string;
  apiKey: string;
  model: string;
  customApiUrl?: string;
  domainId?: string;
}

function parseERResponse(content: string): { tables: any[]; relationships: any[]; error?: string } {
  try {
    let jsonStr = content;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { tables: [], relationships: [], error: 'No JSON found in response' };
    }
    
    let parsed = JSON.parse(jsonMatch[0]);
    if (parsed.content) {
      const innerStr = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
      const innerMatch = innerStr.match(/\{[\s\S]*\}/);
      if (innerMatch) {
        parsed = JSON.parse(innerMatch[0]);
      }
    }
    
    const tables = Array.isArray(parsed.tables) ? parsed.tables : 
                   Array.isArray(parsed.Tables) ? parsed.Tables : 
                   Array.isArray(parsed.TABLE) ? parsed.TABLE : [];
    
    const relationships = Array.isArray(parsed.relationships) ? parsed.relationships :
                         Array.isArray(parsed.relations) ? parsed.relations :
                         Array.isArray(parsed.Relations) ? parsed.Relations : [];
    
    if (tables.length === 0) {
      return { tables: [], relationships: [], error: 'No tables found in response' };
    }
    
    return { tables, relationships };
  } catch (e: any) {
    return { tables: [], relationships: [], error: `JSON parse error: ${e.message}` };
  }
}

const ER_GENERATE_SYSTEM_PROMPT = `You are an expert Entity-Relationship Data Model Designer. Based on the user's description and the Concept Model context provided, generate a structured ER model with tables, columns, and relationships.

## Concept Model Knowledge Base (use as context):
{conceptModel}

## Response Format - IMPORTANT:
You MUST respond with ONLY valid JSON, no markdown, no explanations, no code blocks. The JSON must be well-formed and complete.

Example of valid response (no markdown code blocks):
{"tables":[{"name":"users","columns":[{"name":"id","dataType":"UUID","isPrimaryKey":true,"isForeignKey":false,"isNullable":false},{"name":"email","dataType":"VARCHAR(255)","isPrimaryKey":false,"isForeignKey":false,"isNullable":false}]}],"relationships":[],"explanation":"User entity"}

## Guidelines:
- Generate tables that represent the entities from the Concept Model
- Each table should have appropriate columns with data types
- Include PRIMARY KEYs (usually UUID or auto-incrementing integer)
- Add FOREIGN KEY columns to represent relationships
- Use appropriate data types: UUID, VARCHAR(n), TEXT, INTEGER, BIGINT, DECIMAL(p,s), BOOLEAN, DATE, TIMESTAMP, JSONB
- Use snake_case for table and column names
- isPrimaryKey: true for primary key columns
- isForeignKey: true for foreign key columns  
- isNullable: false for columns that cannot be null

## JSON Structure:
{
  "tables": [
    {
      "name": "table_name",
      "columns": [
        { "name": "id", "dataType": "UUID", "isPrimaryKey": true, "isForeignKey": false, "isNullable": false },
        { "name": "name", "dataType": "VARCHAR(255)", "isPrimaryKey": false, "isForeignKey": false, "isNullable": false }
      ]
    }
  ],
  "relationships": [
    { "source": "parent_table", "sourceColumn": "id", "target": "child_table", "targetColumn": "parent_id", "sourceMultiplicity": "1", "targetMultiplicity": "0..*" }
  ]
}

## Multiplicity Options:
- "1" = exactly one
- "0..1" = zero or one
- "1..*" = one or many
- "0..*" = zero or many

## CRITICAL RULES:
1. Respond with ONLY valid JSON - no markdown code blocks, no explanations
2. The JSON must be well-formed and complete (all brackets and quotes matched)
3. If you cannot generate a complete response, return at least the tables array with valid JSON`;

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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'OpenAI chat API error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Anthropic chat API error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Groq chat API error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Gemini chat API error');
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
          fastify.log.error({ provider, model, baseUrl, status: res.status, error: err?.error ?? err?.message }, 'Ollama chat API error');
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
      fastify.log.error({ provider, model, error: err.message, stack: err.stack }, 'AI chat proxy error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'OpenAI review API error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Anthropic review API error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Groq review API error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Gemini review API error');
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
          fastify.log.error({ provider, model, baseUrl, status: res.status, error: err?.error ?? err?.message }, 'Ollama review API error');
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
      fastify.log.error({ provider, model, error: err.message, stack: err.stack }, 'AI review proxy error');
      return reply.code(502).send({ error: 'Failed to reach AI provider' });
    }
  });

  fastify.post('/ai/sql-generate', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const body = request.body as AiSqlGenerateBody;
    const { prompt, provider, apiKey, model, customApiUrl } = body;

    if (!model?.trim()) return reply.code(400).send({ error: 'Model is required' });
    if (!prompt?.trim()) return reply.code(400).send({ error: 'Prompt is required' });

    const needsApiKey = provider !== 'ollama';
    if (needsApiKey && !apiKey?.trim()) return reply.code(400).send({ error: 'API key is required' });

    const messages = [
      { role: 'system', content: SQL_GENERATE_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'OpenAI sql-generate API error');
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
            system: SQL_GENERATE_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Anthropic sql-generate API error');
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
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Groq sql-generate API error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Groq request failed' });
        }
        const data: any = await res.json();
        return { content: data.choices?.[0]?.message?.content ?? '' };
      }

      if (provider === 'gemini') {
        const chatMsgs = [{ role: 'user', parts: [{ text: prompt }] }];
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: chatMsgs,
            systemInstruction: { parts: [{ text: SQL_GENERATE_SYSTEM_PROMPT }] }
          }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Gemini sql-generate API error');
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
          fastify.log.error({ provider, model, baseUrl, status: res.status, error: err?.error ?? err?.message }, 'Ollama sql-generate API error');
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
      fastify.log.error({ provider, model, error: err.message, stack: err.stack }, 'AI sql-generate proxy error');
      return reply.code(502).send({ error: 'Failed to reach AI provider' });
    }
  });

  fastify.post('/ai/er-generate', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const body = request.body as AiERGenerateBody;
    const { prompt, provider, apiKey, model, customApiUrl, domainId } = body;

    if (!model?.trim()) return reply.code(400).send({ error: 'Model is required' });
    if (!prompt?.trim()) return reply.code(400).send({ error: 'Prompt is required' });

    const needsApiKey = provider !== 'ollama';
    if (needsApiKey && !apiKey?.trim()) return reply.code(400).send({ error: 'API key is required' });

    let conceptModelContext = 'No concept model available';
    
    if (domainId) {
      try {
        const domain = await fastify.prisma.domain.findUnique({ where: { id: domainId } });
        if (domain?.conceptModel) {
          const cm = domain.conceptModel as any;
          const concepts = cm.nodes || [];
          const relations = cm.edges || [];
          
          if (concepts.length > 0) {
            conceptModelContext = concepts.map((c: any) => {
              const attrs = (c.data?.attributes || []).map((a: any) => 
                `${a.name} (${a.dataType?.name || 'String'}${a.mandatory ? ', required' : ''})`
              ).join('; ');
              return `- ${c.data?.label}: ${c.data?.description || ''}${attrs ? `\n  Attributes: ${attrs}` : ''}`;
            }).join('\n');
            
            if (relations.length > 0) {
              conceptModelContext += '\n\nRelationships:\n' + relations.map((r: any) => {
                const sourceLabel = concepts.find((c: any) => c.id === r.source)?.data?.label || r.source;
                const targetLabel = concepts.find((c: any) => c.id === r.target)?.data?.label || r.target;
                return `- ${sourceLabel} "${r.data?.label || 'relates to'}" ${targetLabel}`;
              }).join('\n');
            }
          }
        }
      } catch (e) {
        fastify.log.warn('Could not fetch concept model for ER generation');
      }
    }

    const systemPrompt = ER_GENERATE_SYSTEM_PROMPT.replace('{conceptModel}', conceptModelContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 8192 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'OpenAI API error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'OpenAI request failed' });
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const result = parseERResponse(content);
        if (result.error) {
          fastify.log.error({ provider, model, error: result.error, content }, 'OpenAI response parse error');
        }
        return { tables: result.tables, relationships: result.relationships };
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
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Anthropic API error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Anthropic request failed' });
        }
        const data: any = await res.json();
        const content = data.content?.[0]?.text ?? '';
        const result = parseERResponse(content);
        if (result.error) {
          fastify.log.error({ provider, model, error: result.error, content }, 'Anthropic response parse error');
        }
        return { tables: result.tables, relationships: result.relationships };
      }

      if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 8192 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Groq API error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Groq request failed' });
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const result = parseERResponse(content);
        if (result.error) {
          fastify.log.error({ provider, model, error: result.error, content }, 'Groq response parse error');
        }
        return { tables: result.tables, relationships: result.relationships };
      }

      if (provider === 'gemini') {
        const chatMsgs = [{ role: 'user', parts: [{ text: prompt }] }];
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: chatMsgs,
            systemInstruction: { parts: [{ text: systemPrompt }] }
          }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Gemini API error');
          return reply.code(res.status).send({ error: err?.error?.message ?? 'Gemini request failed' });
        }
        const data: any = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const result = parseERResponse(content);
        if (result.error) {
          fastify.log.error({ provider, model, error: result.error, content }, 'Gemini response parse error');
        }
        return { tables: result.tables, relationships: result.relationships };
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
          fastify.log.error({ provider, model, baseUrl, status: res.status, error: err?.error ?? err?.message }, 'Ollama API error');
          return reply.code(res.status).send({ error: err?.error ?? err?.message ?? 'Ollama request failed' });
        }
        const data: any = await res.json();
        const content = useOpenAiFormat 
          ? data.choices?.[0]?.message?.content ?? ''
          : data.message?.content ?? '';
        const result = parseERResponse(content);
        if (result.error) {
          fastify.log.error({ provider, model, baseUrl, error: result.error, content }, 'Ollama response parse error');
        }
        return { tables: result.tables, relationships: result.relationships };
      }

      return reply.code(400).send({ error: `Unsupported provider: ${provider}` });

    } catch (err: any) {
      fastify.log.error({ provider, model, error: err.message, stack: err.stack }, 'AI er-generate proxy error');
      return reply.code(502).send({ error: 'Failed to reach AI provider' });
    }
  });

  const DDL_SYSTEM_PROMPT = `You are an expert Database Engineer. Generate complete DDL (Data Definition Language) SQL statements from the provided Entity-Relationship model.

## Supported Database Engines:
- PostgreSQL (default)
- MySQL
- SQL Server (T-SQL)
- SQLite

## Response Format:
Return ONLY valid SQL DDL statements, NO markdown, NO explanations, NO code blocks. Just pure SQL.

## Guidelines:
- Use appropriate data type mappings:
  * PostgreSQL: UUID, VARCHAR(n), TEXT, INTEGER, BIGINT, DECIMAL(p,s), BOOLEAN, DATE, TIMESTAMP, JSONB, SERIAL
  * MySQL: CHAR(n), VARCHAR(n), TEXT, INT, BIGINT, DECIMAL(p,s), TINYINT(1), DATE, DATETIME, JSON
  * SQL Server: UNIQUEIDENTIFIER, NVARCHAR(n), TEXT, INT, BIGINT, DECIMAL(p,s), BIT, DATE, DATETIME2, JSON
  * SQLite: TEXT, INTEGER, REAL, NUMERIC

- Include PRIMARY KEY constraints (prefer UUID or SERIAL/IDENTITY)
- Add NOT NULL constraints where appropriate
- Add FOREIGN KEY constraints with appropriate ON DELETE/UPDATE actions
- Include INDEXES for foreign keys
- Add CHECK constraints where appropriate
- Include table and column comments if specified

## Example Output (PostgreSQL):
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);`;

interface AiDDLGenerateBody {
  tables: any[];
  relationships: any[];
  provider: string;
  apiKey: string;
  model: string;
  customApiUrl?: string;
  databaseEngine?: string;
}

  fastify.post('/ai/ddl-generate', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const body = request.body as AiDDLGenerateBody;
    const { tables, relationships, provider, apiKey, model, customApiUrl, databaseEngine } = body;

    if (!model?.trim()) return reply.code(400).send({ error: 'Model is required' });
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return reply.code(400).send({ error: 'Tables are required' });
    }

    const needsApiKey = provider !== 'ollama';
    if (needsApiKey && !apiKey?.trim()) return reply.code(400).send({ error: 'API key is required' });

    const modelContext = JSON.stringify({ tables, relationships }, null, 2);
    const userPrompt = `Generate DDL for ${databaseEngine || 'PostgreSQL'} based on this ER model:\n\n${modelContext}`;

    const messages = [
      { role: 'system', content: DDL_SYSTEM_PROMPT },
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
          body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 8192 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'OpenAI ddl-generate API error');
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
            max_tokens: 8192,
            system: DDL_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Anthropic ddl-generate API error');
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
          body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 8192 }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Groq ddl-generate API error');
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
            systemInstruction: { parts: [{ text: DDL_SYSTEM_PROMPT }] }
          }),
        });
        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          fastify.log.error({ provider, model, status: res.status, error: err?.error?.message }, 'Gemini ddl-generate API error');
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
          fastify.log.error({ provider, model, baseUrl, status: res.status, error: err?.error ?? err?.message }, 'Ollama ddl-generate API error');
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
      fastify.log.error({ provider, model, error: err.message, stack: err.stack }, 'AI ddl-generate proxy error');
      return reply.code(502).send({ error: 'Failed to reach AI provider' });
    }
  });

};

export default aiRoutes;
