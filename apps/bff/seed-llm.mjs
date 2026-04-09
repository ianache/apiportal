import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const LLM_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { id: 'anthropic', label: 'Anthropic', models: ['claude-opus-4-6', 'claude-sonnet-4-6'] },
  { id: 'groq', label: 'Groq', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] },
  { id: 'ollama', label: 'Ollama', models: ['llama3', 'mistral'] },
  { id: 'gemini', label: 'Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'grok', label: 'Grok', models: ['grok-3', 'grok-beta'] },
];

async function main() {
  for (const p of LLM_PROVIDERS) {
    await prisma.lLMProvider.upsert({
      where: { id: p.id },
      update: { label: p.label, models: p.models },
      create: { id: p.id, label: p.label, models: p.models }
    });
  }
}
main().then(() => { console.log('DB Seeded!'); prisma.$disconnect(); process.exit(0); });
