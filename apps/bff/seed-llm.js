import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const LLM_PROVIDERS = [
    { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { id: 'gemini', label: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
    { id: 'groq', label: 'Groq', models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'] },
    { id: 'ollama', label: 'Ollama', models: ['llama3', 'mistral', 'gemma', 'phi3'] },
    { id: 'anthropic', label: 'Anthropic', models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'] }
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
main()
    .then(() => {
    console.log('Database successfully seeded with LLM Providers.');
    return prisma.$disconnect();
})
    .then(() => process.exit(0))
    .catch(e => {
    console.error('Failed to seed:', e);
    process.exit(1);
});
