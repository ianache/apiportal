<template>
  <div class="p-6 max-w-2xl mx-auto w-full" style="font-family:'Inter',sans-serif;">
    <h1 class="text-2xl font-bold mb-1" style="color:#1a1b1f;">Preferences</h1>
    <p class="text-sm mb-8" style="color:#6b7280;">Configure application preferences and integrations.</p>

    <!-- AI Designer section -->
    <section class="pref-card">
      <div class="pref-card-header">
        <span class="material-symbols-outlined" style="font-size:20px;color:#7c3aed;">auto_awesome</span>
        <div>
          <h2 class="pref-card-title">AI Designer</h2>
          <p class="pref-card-desc">Connect an LLM to generate API designs from natural language.</p>
        </div>
      </div>

      <div class="pref-fields">
        <!-- Provider -->
        <div class="pref-field">
          <label class="pref-label">Provider</label>
          <select v-model="form.provider" class="pref-select" @change="onProviderChange">
            <option v-for="p in LLM_PROVIDERS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </div>

        <!-- API Key -->
        <div class="pref-field">
          <label class="pref-label">API Key</label>
          <div class="pref-secret-wrap">
            <input
              v-model="form.apiKey"
              :type="showKey ? 'text' : 'password'"
              class="pref-input"
              placeholder="sk-…"
              autocomplete="off"
            />
            <button class="pref-secret-toggle" @click="showKey = !showKey" type="button" tabindex="-1">
              <span class="material-symbols-outlined" style="font-size:18px;">{{ showKey ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          <p class="pref-hint">Stored locally in your browser. Never sent to our servers beyond proxying your requests.</p>
        </div>

        <!-- Model -->
        <div class="pref-field">
          <label class="pref-label">Model</label>
          <select v-model="form.model" class="pref-select">
            <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>

      <!-- Status -->
      <div v-if="saved" class="pref-saved">
        <span class="material-symbols-outlined" style="font-size:16px;color:#047857;">check_circle</span>
        Settings saved
      </div>

      <!-- Actions -->
      <div class="pref-actions">
        <button @click="saveSettings" class="pref-btn-primary" :disabled="!form.apiKey.trim()">
          Save Settings
        </button>
        <button v-if="llmPrefs.isConfigured" @click="clearSettings" class="pref-btn-ghost">
          Clear
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLLMPreferencesStore, LLM_PROVIDERS } from '../../stores/preferences';

const llmPrefs = useLLMPreferencesStore();

const form = ref({
  provider: llmPrefs.provider,
  apiKey:   llmPrefs.apiKey,
  model:    llmPrefs.model,
});

const showKey = ref(false);
const saved   = ref(false);
let savedTimer: ReturnType<typeof setTimeout> | null = null;

const availableModels = computed(
  () => LLM_PROVIDERS.find(p => p.id === form.value.provider)?.models ?? []
);

function onProviderChange() {
  form.value.model = availableModels.value[0] ?? '';
}

function saveSettings() {
  llmPrefs.persist(form.value.provider, form.value.apiKey, form.value.model);
  saved.value = true;
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { saved.value = false; }, 3000);
}

function clearSettings() {
  form.value = { provider: 'openai', apiKey: '', model: 'gpt-4o' };
  llmPrefs.persist('openai', '', 'gpt-4o');
}
</script>

<style scoped>
.pref-card {
  background: #ffffff;
  border: 1px solid #e3e2e7;
  border-radius: 16px;
  padding: 24px;
}
.pref-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}
.pref-card-title  { font-size: 15px; font-weight: 700; color: #1a1b1f; margin: 0; }
.pref-card-desc   { font-size: 13px; color: #6b7280; margin-top: 2px; }

.pref-fields      { display: flex; flex-direction: column; gap: 16px; }
.pref-field       { display: flex; flex-direction: column; gap: 6px; }
.pref-label       { font-size: 12px; font-weight: 600; color: #414755; text-transform: uppercase; letter-spacing: 0.04em; }
.pref-hint        { font-size: 11px; color: #a0a7b5; margin-top: 4px; }

.pref-input,
.pref-select {
  padding: 8px 12px;
  border: 1px solid #e3e2e7;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #1a1b1f;
  background: #faf9fe;
  outline: none;
  transition: border-color 0.15s;
}
.pref-input:focus,
.pref-select:focus { border-color: #0058bc; }

.pref-secret-wrap { position: relative; }
.pref-secret-wrap .pref-input { width: 100%; padding-right: 40px; box-sizing: border-box; }
.pref-secret-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  color: #a0a7b5; background: none; border: none; cursor: pointer; padding: 0; display: flex;
}
.pref-secret-toggle:hover { color: #414755; }

.pref-saved {
  display: flex; align-items: center; gap: 6px;
  margin-top: 16px;
  font-size: 12px; font-weight: 600; color: #047857;
}

.pref-actions { display: flex; gap: 8px; margin-top: 20px; }
.pref-btn-primary {
  padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: #0058bc; color: #fff; border: none; cursor: pointer;
  transition: opacity 0.15s;
}
.pref-btn-primary:hover  { opacity: 0.85; }
.pref-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.pref-btn-ghost {
  padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
  background: none; color: #991b1b; border: 1px solid #fecaca; cursor: pointer;
  transition: background 0.12s;
}
.pref-btn-ghost:hover { background: #fef2f2; }
</style>
