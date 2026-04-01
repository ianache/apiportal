import { defineStore } from 'pinia';

const STORAGE_KEY = 'nexus_llm_prefs';

function load(): Partial<LLMConfig> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

export interface LLMConfig {
  provider: string;
  apiKey: string;
  model: string;
}

export const LLM_PROVIDERS = [
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
] as const;

export const useLLMPreferencesStore = defineStore('llmPreferences', {
  state: (): LLMConfig => {
    const saved = load();
    return {
      provider: saved.provider ?? 'openai',
      apiKey:   saved.apiKey   ?? '',
      model:    saved.model    ?? 'gpt-4o',
    };
  },
  getters: {
    isConfigured: (s) => !!s.apiKey.trim(),
    providerLabel: (s) => LLM_PROVIDERS.find(p => p.id === s.provider)?.label ?? s.provider,
  },
  actions: {
    persist(provider: string, apiKey: string, model: string) {
      this.provider = provider;
      this.apiKey   = apiKey;
      this.model    = model;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, apiKey, model }));
    },
  },
});
