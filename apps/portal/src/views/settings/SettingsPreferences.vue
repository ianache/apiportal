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
              <button @click="openSyncModal" type="button"
                class="pref-btn-secondary pref-btn-sm" style="white-space:nowrap;"
                title="Sync models from provider">
                <span class="material-symbols-outlined" style="font-size:13px;">sync</span>
                Sync
              </button>
            </div>
            <p class="pref-hint">Adds models manually or sync from provider to select available models.</p>
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

  <!-- Sync Models Modal -->
  <div v-if="showSyncModal" class="modal-overlay" @click.self="closeSyncModal">
    <div class="modal-content">
      <div class="modal-header">
        <span class="material-symbols-outlined" style="font-size:20px;color:#7c3aed;">sync</span>
        <h3 class="modal-title">Sync Models from {{ currentProviderLabel }}</h3>
        <button class="modal-close" @click="closeSyncModal">
          <span class="material-symbols-outlined" style="font-size:18px;">close</span>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-desc">Select the models you want to add to this provider.</p>

        <div v-if="syncLoading" class="sync-loading">
          <span class="material-symbols-outlined animate-spin" style="font-size:20px;color:#7c3aed;">progress_activity</span>
          <span>Syncing models from provider...</span>
        </div>

        <div v-else-if="syncError" class="sync-error">
          <span class="material-symbols-outlined" style="font-size:18px;color:#dc2626;">error</span>
          <span>{{ syncError }}</span>
        </div>

        <div v-else>
          <div class="sync-actions">
            <button @click="selectAllModels" class="pref-btn-secondary pref-btn-sm">Select All</button>
            <button @click="deselectAllModels" class="pref-btn-secondary pref-btn-sm">Deselect All</button>
          </div>

          <div class="models-list">
            <label
              v-for="model in availableToSync"
              :key="model"
              class="model-item"
              :class="{ 'model-item--selected': selectedModels.includes(model) }"
            >
              <input
                type="checkbox"
                :checked="selectedModels.includes(model)"
                @change="toggleModel(model)"
              />
              <span class="model-item-name">{{ model }}</span>
            </label>
          </div>

          <p class="models-count">{{ selectedModels.length }} of {{ availableToSync.length }} models selected</p>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeSyncModal" class="pref-btn-ghost">Cancel</button>
        <button
          @click="addSelectedModels"
          :disabled="selectedModels.length === 0 || addingModels"
          class="pref-btn-primary"
        >
          <span v-if="addingModels" class="material-symbols-outlined animate-spin" style="font-size:14px;">progress_activity</span>
          <span v-else class="material-symbols-outlined" style="font-size:14px;">add</span>
          Add {{ selectedModels.length }} Models
        </button>
      </div>
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

// Sync modal state
const showSyncModal = ref(false);
const syncLoading = ref(false);
const syncError = ref('');
const availableToSync = ref<string[]>([]);
const selectedModels = ref<string[]>([]);
const addingModels = ref(false);

const currentProviderLabel = computed(() =>
  llmPrefs.providersList.find(p => p.id === form.value.provider)?.label ?? form.value.provider
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
    form.value.model = name;
    newModel.value = '';
  } finally {
    addingModel.value = false;
  }
}

async function openSyncModal() {
  showSyncModal.value = true;
  syncError.value = '';
  selectedModels.value = [];

  const apiKey = llmPrefs.apiKeys[form.value.provider] || llmPrefs.currentApiKey;
  if (!apiKey) {
    syncError.value = 'API key required. Please save an API key for this provider first.';
    return;
  }

  syncLoading.value = true;
  try {
    availableToSync.value = await llmPrefs.syncModels(
      form.value.provider,
      apiKey,
      form.value.provider === 'ollama' ? form.value.apiUrl : undefined
    );
  } catch (err: any) {
    syncError.value = err.message || 'Failed to sync models';
  } finally {
    syncLoading.value = false;
  }
}

function closeSyncModal() {
  showSyncModal.value = false;
  availableToSync.value = [];
  selectedModels.value = [];
  syncError.value = '';
}

function toggleModel(model: string) {
  const idx = selectedModels.value.indexOf(model);
  if (idx === -1) {
    selectedModels.value.push(model);
  } else {
    selectedModels.value.splice(idx, 1);
  }
}

function selectAllModels() {
  selectedModels.value = [...availableToSync.value];
}

function deselectAllModels() {
  selectedModels.value = [];
}

async function addSelectedModels() {
  if (selectedModels.value.length === 0) return;
  addingModels.value = true;
  try {
    await llmPrefs.addModels(form.value.provider, selectedModels.value);
    closeSyncModal();
  } finally {
    addingModels.value = false;
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
.pref-btn-secondary {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 10px; font-size: 12px; font-weight: 600;
  background: #f4f3f8; color: #414755; border: 1px solid #e3e2e7; cursor: pointer;
  transition: background 0.12s;
}
.pref-btn-secondary:hover { background: #e3e2e7; }
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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #ffffff;
  border-radius: 16px;
  width: 90%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #e3e2e7;
}
.modal-title { font-size: 16px; font-weight: 700; color: #1a1b1f; margin: 0; flex: 1; }
.modal-close {
  background: none; border: none; cursor: pointer; padding: 4px; color: #717786;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
}
.modal-close:hover { background: #f4f3f8; color: #1a1b1f; }
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.modal-desc { font-size: 13px; color: #717786; margin: 0 0 16px 0; }
.sync-loading, .sync-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  font-size: 13px;
  color: #717786;
}
.sync-error { color: #dc2626; }
.sync-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.models-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e3e2e7;
  border-radius: 10px;
}
.model-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid #f4f3f8;
}
.model-item:last-child { border-bottom: none; }
.model-item:hover { background: #faf9fe; }
.model-item--selected { background: #f0f0ff; }
.model-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.model-item-name {
  font-size: 13px;
  color: #1a1b1f;
  font-family: 'Monaco', 'Menlo', monospace;
}
.models-count {
  font-size: 12px;
  color: #717786;
  margin: 12px 0 0 0;
  text-align: center;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e3e2e7;
}
</style>
