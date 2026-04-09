const { PrismaClient } = require('./apps/bff/node_modules/@prisma/client/index.js');
const prisma = new PrismaClient();

const LLM_PROVIDERS = [
  {
    id: 'openai',
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  },
  {
    id: 'groq',
    label: 'Groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  },
  {
    id: 'ollama',
    label: 'Ollama',
    models: ['llama3', 'llama3:70b', 'mistral', 'gemma:7b', 'phi3'],
  },
  {
    id: 'gemini',
    label: 'Gemini',
    models: ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'],
  },
  {
    id: 'grok',
    label: 'Grok',
    models: ['grok-3', 'grok-2', 'grok-1.5', 'grok-beta'],
  },
];

async function seed() {
  for (const p of LLM_PROVIDERS) {
    await prisma.lLMProvider.upsert({
      where: { id: p.id },
      update: { label: p.label, models: p.models },
      create: { id: p.id, label: p.label, models: p.models }
    });
  }
}

seed()
  .then(() => console.log('Seeded database with LLM Providers.'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
