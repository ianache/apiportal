<template>
  <Shell>
  <div class="p-8 max-w-7xl mx-auto w-full" style="font-family: 'Inter', sans-serif;">

    <!-- Header -->
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold" style="color: #1a1b1f;">Preferences</h1>
        <p class="mt-1 text-sm" style="color: #717786;">Configure application preferences and integrations.</p>
      </div>
    </header>

    <!-- Two-column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- ── LEFT: AI Designer ───────────────────────── -->
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
            <select v-model="form.provider" class="pref-select" @change="onProviderChange" :disabled="llmPrefs.isLoadingProviders">
              <option v-for="p in llmPrefs.providersList" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
          </div>

          <!-- Custom Base URL -->
          <div class="pref-field">
            <label class="pref-label">Base URL / Endpoint (Optional)</label>
            <input v-model="form.apiUrl" type="text" class="pref-input"
              placeholder="e.g. http://127.0.0.1:11434/v1 for Ollama" autocomplete="off" />
            <p class="pref-hint">Leave blank to use the provider's default public URL.</p>
          </div>

          <!-- Model -->
          <div class="pref-field">
            <label class="pref-label">Model</label>
            <select v-model="form.model" class="pref-select">
              <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>

          <!-- Add new model -->
          <div class="pref-field">
            <label class="pref-label">Add New Model</label>
            <div style="display:flex;gap:6px;">
              <input
                v-model="newModel"
                type="text"
                class="pref-input"
                placeholder="e.g. llama3.2, gpt-4-turbo..."
                autocomplete="off"
                @keydown.enter="addNewModel"
              />
              <button @click="addNewModel" type="button" :disabled="!newModel.trim() || addingModel"
                class="pref-btn-primary pref-btn-sm" style="white-space:nowrap;">
                <span v-if="addingModel" class="material-symbols-outlined animate-spin" style="font-size:13px;">progress_activity</span>
                <span v-else class="material-symbols-outlined" style="font-size:13px;">add</span>
                Add
              </button>
            </div>
            <p class="pref-hint">Adds the model to the selected provider globally and persists in the database.</p>
          </div>
        </div>

        <!-- Status -->
        <div v-if="saved" class="pref-saved">
          <span class="material-symbols-outlined" style="font-size:16px;color:#047857;">check_circle</span>
          Settings saved
        </div>

        <!-- Actions -->
        <div class="pref-actions">
          <button @click="saveSettings" class="pref-btn-primary">
            Save Settings
          </button>
          <button v-if="llmPrefs.isConfigured" @click="clearSettings" class="pref-btn-ghost">
            Clear
          </button>
        </div>
      </section>

      <!-- ── RIGHT: Manage API Keys ──────────────────── -->
      <section class="pref-card">
        <div class="pref-card-header">
          <span class="material-symbols-outlined" style="font-size:20px;color:#0058bc;">key</span>
          <div>
            <h2 class="pref-card-title">Manage API Keys</h2>
            <p class="pref-card-desc">One API Key per provider, stored securely in the database.</p>
          </div>
        </div>

        <div v-if="llmPrefs.isLoadingProviders" class="flex justify-center py-8">
          <span class="material-symbols-outlined animate-spin" style="color:#a0a7b5;font-size:24px;">progress_activity</span>
        </div>

        <div v-else class="space-y-3">
          <div v-for="p in llmPrefs.providersList" :key="p.id" class="key-row">
            <div class="key-row-header">
              <span class="key-provider-label">{{ p.label }}</span>
              <span v-if="llmPrefs.apiKeys[p.id]" class="key-set-badge">Set</span>
            </div>

            <div class="pref-secret-wrap">
              <input
                v-model="draftKeys[p.id]"
                :type="visibleKeys[p.id] ? 'text' : 'password'"
                class="pref-input"
                :placeholder="llmPrefs.apiKeys[p.id] ? '••••••••••••••••' : 'Enter API key...'"
                autocomplete="off"
              />
              <button class="pref-secret-toggle" @click="toggleVisible(p.id)" type="button" tabindex="-1">
                <span class="material-symbols-outlined" style="font-size:17px;">
                  {{ visibleKeys[p.id] ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>

            <div class="key-row-actions">
              <button @click="saveKey(p.id)" :disabled="!draftKeys[p.id]?.trim() || savingKey === p.id"
                class="pref-btn-primary pref-btn-sm">
                <span v-if="savingKey === p.id" class="material-symbols-outlined animate-spin" style="font-size:14px;">progress_activity</span>
                <span v-else class="material-symbols-outlined" style="font-size:14px;">save</span>
                Save
              </button>
              <button v-if="llmPrefs.apiKeys[p.id]" @click="removeKey(p.id)"
                class="pref-btn-ghost pref-btn-sm">
                <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
                Remove
              </button>
            </div>

            <p v-if="savedKey === p.id" class="pref-saved" style="margin-top:6px;">
              <span class="material-symbols-outlined" style="font-size:14px;color:#047857;">check_circle</span>
              Saved!
            </p>
          </div>
        </div>
      </section>

    </div>
  </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import Shell from '../../components/layout/Shell.vue';
import { useLLMPreferencesStore } from '../../stores/preferences';

const llmPrefs = useLLMPreferencesStore();

const form = ref({
  provider: llmPrefs.provider,
  apiUrl:   llmPrefs.apiUrl || '',
  model:    llmPrefs.model,
});

const saved   = ref(false);
const savingKey = ref<string | null>(null);
const savedKey  = ref<string | null>(null);
const newModel   = ref('');
const addingModel = ref(false);
let savedTimer: ReturnType<typeof setTimeout> | null = null;

// draft values for each provider's key (not committed until "Save" is clicked)
const draftKeys  = reactive<Record<string, string>>({});
// visibility toggle per provider
const visibleKeys = reactive<Record<string, boolean>>({});

const availableModels = computed(
  () => llmPrefs.providersList.find(p => p.id === form.value.provider)?.models ?? []
);

onMounted(async () => {
  if (llmPrefs.providersList.length === 0) {
    await llmPrefs.fetchProviders();
  }
  await llmPrefs.fetchFromDB();
});

function onProviderChange() {
  form.value.model = availableModels.value[0] ?? '';
}

function toggleVisible(providerId: string) {
  visibleKeys[providerId] = !visibleKeys[providerId];
}

async function saveSettings() {
  // Use the stored key for the selected provider (don't pass the API key here — managed separately)
  await llmPrefs.persist(form.value.provider, form.value.apiUrl, llmPrefs.currentApiKey, form.value.model);
  saved.value = true;
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { saved.value = false; }, 3000);
}

async function clearSettings() {
  form.value = { provider: 'openai', apiUrl: '', model: 'gpt-4o' };
  await llmPrefs.persist('openai', '', '', 'gpt-4o');
}

async function saveKey(providerId: string) {
  const val = draftKeys[providerId]?.trim();
  if (!val) return;
  savingKey.value = providerId;
  try {
    await llmPrefs.saveApiKey(providerId, val);
    draftKeys[providerId] = '';
    savedKey.value = providerId;
    setTimeout(() => { if (savedKey.value === providerId) savedKey.value = null; }, 2500);
  } finally {
    savingKey.value = null;
  }
}

async function removeKey(providerId: string) {
  await llmPrefs.deleteApiKey(providerId);
  draftKeys[providerId] = '';
}

async function addNewModel() {
  const name = newModel.value.trim();
  if (!name || addingModel.value) return;
  addingModel.value = true;
  try {
    await llmPrefs.addModel(form.value.provider, name);
    // auto-select the newly added model
    form.value.model = name;
    newModel.value = '';
  } finally {
    addingModel.value = false;
  }
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
  width: 100%;
  box-sizing: border-box;
}
.pref-input:focus,
.pref-select:focus { border-color: #0058bc; }

.pref-secret-wrap { position: relative; }
.pref-secret-wrap .pref-input { padding-right: 38px; }
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
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: #0058bc; color: #fff; border: none; cursor: pointer;
  transition: opacity 0.15s;
}
.pref-btn-primary:hover  { opacity: 0.85; }
.pref-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.pref-btn-ghost {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
  background: none; color: #991b1b; border: 1px solid #fecaca; cursor: pointer;
  transition: background 0.12s;
}
.pref-btn-ghost:hover { background: #fef2f2; }
.pref-btn-sm { padding: 5px 12px; font-size: 12px; }

/* Key rows */
.key-row {
  padding: 14px;
  border: 1px solid #e3e2e7;
  border-radius: 12px;
  background: #faf9fe;
}
.key-row-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.key-provider-label { font-size: 13px; font-weight: 700; color: #1a1b1f; }
.key-set-badge {
  font-size: 10px; font-weight: 700; color: #047857;
  background: #dcfce7; border-radius: 999px; padding: 2px 8px;
}
.key-row-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>
