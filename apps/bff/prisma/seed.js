import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const LLM_PROVIDERS = [
    {
        id: 'openai',
        label: 'OpenAI ChatGPT',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    },
    {
        id: 'groq',
        label: 'Groq',
        models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    },
    {
        id: 'gemini',
        label: 'Google Gemini',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    },
    {
        id: 'ollama',
        label: 'Ollama',
        models: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'phi3', 'qwen2.5', 'deepseek-coder'],
    },
    {
        id: 'anthropic',
        label: 'Anthropic Claude',
        models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    },
];
async function main() {
    console.log('Seeding LLM Providers...');
    for (const provider of LLM_PROVIDERS) {
        await prisma.lLMProvider.upsert({
            where: { id: provider.id },
            update: { label: provider.label, models: provider.models },
            create: { id: provider.id, label: provider.label, models: provider.models },
        });
        console.log(`✓ ${provider.label}`);
    }
    console.log('Done!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
