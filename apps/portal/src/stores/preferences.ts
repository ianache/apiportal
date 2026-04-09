import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const STORAGE_KEY = 'nexus_llm_prefs';

function bffBase() {
  const env = (window as any).NEXUS_ENV || import.meta.env;
  return env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
}

async function authHeaders(): Promise<Record<string, string>> {
  const auth = useAuthStore();
  const token = await auth.getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function loadLocal(): Partial<LLMConfig> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

export interface LLMConfig {
  provider: string;
  apiUrl?: string;
  apiKey: string;
  model: string;
}

export interface LLMProviderData {
  id: string;
  label: string;
  models: string[];
}

export interface LLMState extends LLMConfig {
  providersList: LLMProviderData[];
  isLoadingProviders: boolean;
  apiKeys: Record<string, string>;   // keyed by providerId
}

export const useLLMPreferencesStore = defineStore('llmPreferences', {
  state: (): LLMState => {
    const saved = loadLocal();
    return {
      provider: saved.provider ?? 'openai',
      apiUrl:   saved.apiUrl   ?? '',
      apiKey:   saved.apiKey   ?? '',
      model:    saved.model    ?? 'gpt-4o',
      providersList: [] as LLMProviderData[],
      isLoadingProviders: false,
      apiKeys: {},
    };
  },
  getters: {
    isConfigured: (s) => {
      const key = s.apiKeys[s.provider] ?? s.apiKey;
      return !!key.trim() || !!(s.apiUrl || '').trim() || s.provider === 'ollama';
    },
    providerLabel: (s) => s.providersList.find((p: LLMProviderData) => p.id === s.provider)?.label ?? s.provider,
    currentApiKey: (s) => s.apiKeys[s.provider] ?? s.apiKey,
  },
  actions: {
    /** Persist AI Designer general settings to BFF + localStorage */
    async persist(provider: string, apiUrl: string, apiKey: string, model: string) {
      this.provider = provider;
      this.apiUrl   = apiUrl;
      this.apiKey   = apiKey;
      this.model    = model;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, apiUrl, apiKey, model }));
      try {
        await fetch(`${bffBase()}/user-preferences`, {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify({ preferredProvider: provider, preferredModel: model, customApiUrl: apiUrl }),
        });
      } catch { /* silently ignore – localStorage is the fallback */ }
    },

    /** Fetch providers list from BFF */
    async fetchProviders() {
      this.isLoadingProviders = true;
      try {
        const h = await authHeaders();
        delete h['Content-Type'];
        const res = await fetch(`${bffBase()}/llm-providers`, { headers: h });
        if (res.ok) this.providersList = await res.json();
      } catch (err) {
        console.error('Failed to fetch LLM providers:', err);
      } finally {
        this.isLoadingProviders = false;
      }
    },

    /** Load preferences + all API keys from BFF for the logged-in user */
    async fetchFromDB() {
      try {
        const h = await authHeaders();
        delete h['Content-Type'];
        const res = await fetch(`${bffBase()}/user-preferences`, { headers: h });
        if (res.ok) {
          const data = await res.json();
          this.provider = data.preferredProvider ?? this.provider;
          this.model    = data.preferredModel    ?? this.model;
          this.apiUrl   = data.customApiUrl      ?? this.apiUrl;
          this.apiKeys  = data.apiKeys           ?? {};
          // sync legacy single-key field from stored keys
          if (this.apiKeys[this.provider]) this.apiKey = this.apiKeys[this.provider];
        }
      } catch { /* fallback to state from localStorage */ }
    },

    /** Upsert a single API key for a provider */
    async saveApiKey(providerId: string, apiKey: string) {
      this.apiKeys = { ...this.apiKeys, [providerId]: apiKey };
      if (providerId === this.provider) this.apiKey = apiKey;
      try {
        await fetch(`${bffBase()}/user-preferences/api-keys/${providerId}`, {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify({ apiKey }),
        });
      } catch { /* silently ignore */ }
    },

    /** Delete an API key for a provider */
    async deleteApiKey(providerId: string) {
      const next = { ...this.apiKeys };
      delete next[providerId];
      this.apiKeys = next;
      if (providerId === this.provider) this.apiKey = '';
      try {
        await fetch(`${bffBase()}/user-preferences/api-keys/${providerId}`, {
          method: 'DELETE',
          headers: await authHeaders(),
        });
      } catch { /* silently ignore */ }
    },

    /** Append a model name to a provider's global models list in the DB */
    async addModel(providerId: string, modelName: string) {
      const trimmed = modelName.trim();
      if (!trimmed) return;
      // Optimistic update — replace the whole item to ensure Vue 3 reactivity
      const idx = this.providersList.findIndex(p => p.id === providerId);
      if (idx !== -1) {
        const p = this.providersList[idx];
        if (!p.models.includes(trimmed)) {
          this.providersList.splice(idx, 1, { ...p, models: [...p.models, trimmed] });
        }
      }
      try {
        const res = await fetch(`${bffBase()}/llm-providers/${providerId}/models`, {
          method: 'PATCH',
          headers: await authHeaders(),
          body: JSON.stringify({ model: trimmed }),
        });
        if (res.ok) {
          const updated = await res.json();
          const i = this.providersList.findIndex(p => p.id === providerId);
          if (i !== -1) this.providersList.splice(i, 1, { ...this.providersList[i], models: updated.models });
        }
      } catch { /* silently ignore */ }
    },
  },
});
