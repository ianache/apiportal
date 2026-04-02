<template>
  <Shell>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[60vh]">
      <span class="material-symbols-outlined animate-spin text-4xl" style="color: #006e28;">progress_activity</span>
      <p class="mt-4 font-medium" style="color: #414755;">Loading integration details…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-8 max-w-7xl mx-auto">
      <div class="p-6 rounded-2xl flex flex-col items-center gap-4"
           style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;">
        <span class="material-symbols-outlined text-4xl">error</span>
        <p class="text-lg font-bold">{{ error }}</p>
        <button
          @click="fetchData"
          class="py-2 px-6 rounded-xl font-bold transition-opacity hover:opacity-80"
          style="background: #ffffff; color: #991b1b; border: 1px solid #fecaca;"
        >Try Again</button>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="integration" class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 mb-6 text-sm">
        <router-link
          to="/integrations"
          class="transition-colors hover:underline"
          style="color: #717786;"
        >Integrations Catalog</router-link>
        <span class="material-symbols-outlined text-sm" style="color: #a0a7b5;">chevron_right</span>
        <span class="font-semibold" style="color: #1a1b1f;">{{ integration.name }}</span>
      </nav>

      <!-- Header -->
      <header class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style="background: #006e28; box-shadow: 0 4px 14px rgba(0,110,40,0.28);">
              <span class="material-symbols-outlined text-3xl text-white"
                    style="font-variation-settings: 'FILL' 1;">{{ integration.icon }}</span>
            </div>
            <div>
              <h1 class="text-4xl font-extrabold tracking-tight" style="color: #1a1b1f;">{{ integration.name }}</h1>
              <p class="font-medium text-sm" style="color: #717786;">{{ integration.type }}</p>
            </div>
          </div>
          
          <div v-if="integration.domainId" class="flex items-center gap-2 mb-3">
            <span class="material-symbols-outlined" style="font-size:14px;color:#0058bc;">category</span>
            <span class="text-sm font-semibold" style="color:#0058bc;">{{ domainTitle(integration.domainId) }}</span>
          </div>

          <p class="text-lg leading-relaxed" style="color: #414755;">
            {{ integration.description || 'No description provided for this integration.' }}
          </p>
        </div>

        <!-- Lifecycle card -->
        <div class="rounded-3xl p-6 flex flex-col justify-center border"
             style="background: #f4f3f8; border-color: #e3e2e7;">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Status</span>
            <span
              class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
              :style="getStatusStyle(integration.status)"
            >{{ integration.status }}</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span style="color: #717786;">Latest Version</span>
              <span class="font-bold" style="color: #1a1b1f;">v{{ activeVersion?.version || '—' }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span style="color: #717786;">Created</span>
              <span style="color: #1a1b1f;">{{ formatDate(integration.createdAt) }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Grid: sidebar + main -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

        <!-- Versions Sidebar -->
        <aside class="lg:col-span-1">
          <div class="flex items-center justify-between mb-4 px-1 gap-2">
            <h2 class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Versions</h2>
            <select
              v-model="statusFilter"
              class="text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color: #e3e2e7; color: #414755;"
            >
              <option value="ALL">All Status</option>
              <option value="Design">Design</option>
              <option value="Testing">Testing</option>
              <option value="Published">Published</option>
              <option value="Deprecated">Deprecated</option>
            </select>
            <button
              @click="showNewVersionModal = true"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style="background: #006e28; color: #ffffff;"
              title="Create new version"
            >
              <span class="material-symbols-outlined" style="font-size: 15px;">add</span>
              New
            </button>
          </div>
          <div class="space-y-2">
            <button
              v-for="v in filteredVersions"
              :key="v.id"
              @click="selectedVersion = v"
              class="w-full text-left p-4 rounded-2xl border transition-all duration-200"
              :style="selectedVersion?.id === v.id
                ? 'background: #ffffff; border-color: #006e28; box-shadow: 0 2px 8px rgba(0,110,40,0.12); transform: scale(1.02);'
                : 'background: #f4f3f8; border-color: transparent;'"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="font-bold"
                  :style="selectedVersion?.id === v.id ? 'color: #006e28;' : 'color: #1a1b1f;'"
                >v{{ v.version }}</span>
                <span
                  class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  :style="getVersionStatusStyle(v.status)"
                >{{ v.status }}</span>
              </div>
              <p v-if="v.description" class="text-xs line-clamp-2" style="color: #717786;">{{ v.description }}</p>
              <p class="text-[9px]" style="color: #a0a7b5;">{{ formatDate(v.updatedAt) }}</p>
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="lg:col-span-3">
          <div v-if="selectedVersion" class="space-y-6">
            <!-- Version Header -->
            <div class="rounded-3xl p-6 border" style="background: #ffffff; border-color: #e3e2e7;">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold" style="color: #1a1b1f;">v{{ selectedVersion.version }}</h3>
                <div class="flex items-center gap-2">
                  <!-- Botón según estado actual -->
                  <button
                    v-if="selectedVersion.status === 'Design'"
                    @click="changeVersionStatus('Testing')"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                    style="background:#7c3aed;color:#ffffff;"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;">send</span>
                    Submit for Review
                  </button>
                  
                  <button
                    v-if="selectedVersion.status === 'Testing'"
                    @click="changeVersionStatus('Published')"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                    style="background:#047857;color:#ffffff;"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;">publish</span>
                    Publish
                  </button>
                  
                  <button
                    v-if="selectedVersion.status === 'Published'"
                    @click="changeVersionStatus('Deprecated')"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                    style="background:#717786;color:#ffffff;"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;">archive</span>
                    Deprecate
                  </button>
                  
                  <button
                    v-if="selectedVersion.status === 'Deprecated'"
                    @click="changeVersionStatus('Published')"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                    style="background:#047857;color:#ffffff;"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;">refresh</span>
                    Reactivate
                  </button>

                  <!-- Design Flow solo en Design -->
                  <button
                    v-if="selectedVersion.status === 'Design'"
                    @click="openDesigner"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                    style="background:#0058bc;color:#ffffff;"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;">tune</span>
                    Design Flow
                  </button>
                </div>
              </div>
              
              <!-- Details grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div class="p-5 rounded-2xl border" style="background: #f4f3f8; border-color: #e3e2e7;">
                  <h4 class="text-xs font-bold uppercase tracking-wider mb-4" style="color: #717786;">
                    Version Details
                  </h4>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between text-sm">
                      <span style="color: #717786;">Version ID</span>
                      <code
                        class="text-[11px] px-2 py-0.5 rounded font-mono"
                        style="background: #ffffff; color: #1a1b1f; border: 1px solid #e3e2e7;"
                      >{{ selectedVersion.id }}</code>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span style="color: #717786;">Last Updated</span>
                      <span class="font-medium" style="color: #1a1b1f;">{{ formatDate(selectedVersion.updatedAt) }}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span style="color: #717786;">Status</span>
                      <span
                        class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                        :style="getVersionStatusStyle(selectedVersion.status)"
                      >{{ selectedVersion.status }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Inline Edit: Description -->
              <div v-if="editingVersionDesc" class="flex flex-col gap-2 mt-4">
                <textarea
                  v-model="editVersionDesc"
                  ref="versionDescInput"
                  @blur="saveVersionDesc"
                  @keydown.escape="cancelEditVersionDesc"
                  class="text-sm px-3 py-2 rounded-lg border outline-none resize-none"
                  style="color: #414755; border-color: #006e28; width: 100%; min-height: 80px;"
                  placeholder="Enter description..."
                />
                <div class="flex gap-2">
                  <button @click="saveVersionDesc" class="px-3 py-1 rounded-lg text-sm font-bold" style="background: #047857; color: white;">Save</button>
                  <button @click="cancelEditVersionDesc" class="px-3 py-1 rounded-lg text-sm font-bold" style="background: #991b1b; color: white;">Cancel</button>
                </div>
              </div>
              <p v-else-if="selectedVersion.description" @click="startEditVersionDesc" class="text-sm mt-4 cursor-pointer hover:underline" style="color: #414755;" title="Click to edit">
                {{ selectedVersion.description }}
              </p>
              <p v-else @click="startEditVersionDesc" class="text-sm mt-4 italic cursor-pointer hover:underline" style="color: #a0a7b5;" title="Click to add description">
                No description — click to add
              </p>
            </div>
          </div>

          <div v-else class="text-center py-12">
            <span class="material-symbols-outlined text-5xl mb-4" style="color: #a0a7b5;">folder_open</span>
            <p class="text-lg font-medium" style="color: #717786;">Select a version to view details</p>
          </div>
        </main>
      </div>
    </div>

    <!-- New Version Modal -->
    <div v-if="showNewVersionModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-md p-8 shadow-2xl" style="background:#fff;">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color:#1a1b1f;">New Version</h2>
            <p class="text-sm mt-1" style="color:#717786;">Create a new version for this integration.</p>
          </div>
          <button @click="showNewVersionModal = false" class="p-1.5 rounded-full hover:bg-gray-100 ml-4" style="color:#717786;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="modal-label">Version <span style="color:#991b1b;">*</span></label>
            <input v-model="newVersion" type="text" class="modal-input" placeholder="e.g. 1.0.0" />
          </div>
          <div>
            <label class="modal-label">Description</label>
            <textarea v-model="newVersionDesc" class="modal-input" rows="3" style="resize:none;" placeholder="Describe this version…" />
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="showNewVersionModal = false"
            class="flex-1 py-3 px-6 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 border"
            style="color:#414755;border-color:#e3e2e7;">
            <span class="material-symbols-outlined text-base">close</span>Cancel
          </button>
          <button @click="handleCreateVersion" :disabled="!newVersion"
            class="flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            :style="newVersion ? 'background:#006e28;color:#fff;box-shadow:0 4px 14px rgba(0,110,40,0.28);' : 'background:#006e28;color:#fff;opacity:0.4;cursor:not-allowed;'">
            <span class="material-symbols-outlined text-base">add</span>Create Version
          </button>
        </div>
      </div>
    </div>

  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useIntegrationsStore, type Integration, type IntegrationVersion } from '../stores/integrations';
import { useDomainsStore } from '../stores/domains';
import type { IntegrationStatus } from '../stores/integrations';

const router = useRouter();
const route = useRoute();
const store = useIntegrationsStore();
const domainsStore = useDomainsStore();

const loading = ref(true);
const error = ref<string | null>(null);
const integration = ref<Integration | null>(null);
const selectedVersion = ref<IntegrationVersion | null>(null);
const statusFilter = ref('ALL');
const showNewVersionModal = ref(false);
const newVersion = ref('');
const newVersionDesc = ref('');

// Inline edit version description
const editingVersionDesc = ref(false);
const editVersionDesc = ref('');
const versionDescInput = ref<HTMLTextAreaElement | null>(null);

function startEditVersionDesc() {
  editVersionDesc.value = selectedVersion.value?.description || '';
  editingVersionDesc.value = true;
  nextTick(() => {
    versionDescInput.value?.focus();
  });
}

async function saveVersionDesc() {
  if (!integration.value || !selectedVersion.value) return;
  
  try {
    const updated = await store.updateVersion(
      integration.value.id,
      selectedVersion.value.id,
      { description: editVersionDesc.value }
    );
    
    const idx = integration.value.versions?.findIndex(v => v.id === updated.id);
    if (idx !== undefined && idx !== -1 && integration.value.versions) {
      integration.value.versions[idx] = updated;
      selectedVersion.value = updated;
    }
    
    editingVersionDesc.value = false;
  } catch (e) {
    console.error('Failed to update version description:', e);
  }
}

function cancelEditVersionDesc() {
  editingVersionDesc.value = false;
}

const versionStatusOptions = [
  { label: 'Design', value: 'Design' },
  { label: 'Testing', value: 'Testing' },
  { label: 'Published', value: 'Published' },
  { label: 'Deprecated', value: 'Deprecated' },
];

const filteredVersions = computed(() => {
  if (!integration.value?.versions) return [];
  if (statusFilter.value === 'ALL') return integration.value.versions;
  return integration.value.versions.filter(v => v.status === statusFilter.value);
});

const activeVersion = computed(() => {
  if (!integration.value?.versions || integration.value.versions.length === 0) return null;
  const published = integration.value.versions.find(v => v.status === 'Published');
  return published ?? integration.value.versions[0];
});

onMounted(async () => {
  await domainsStore.fetch();
  await fetchData();
});

async function fetchData() {
  loading.value = true;
  error.value = null;
  
  const id = route.params.id as string;
  try {
    const data = await store.fetchById(id);
    if (data) {
      integration.value = data;
      if (data.versions && data.versions.length > 0) {
        selectedVersion.value = data.versions[0];
      }
    } else {
      error.value = 'Integration not found';
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load integration';
  } finally {
    loading.value = false;
  }
}

function domainTitle(id: string | null) {
  return id ? (domainsStore.byId(id)?.title ?? '') : '';
}

async function handleCreateVersion() {
  if (!newVersion.value || !integration.value) return;
  
  try {
    const version = await store.createVersion(integration.value.id, {
      version: newVersion.value,
      description: newVersionDesc.value,
    });
    
    if (integration.value.versions) {
      integration.value.versions.unshift(version);
    } else {
      integration.value.versions = [version];
    }
    
    selectedVersion.value = version;
    showNewVersionModal.value = false;
    newVersion.value = '';
    newVersionDesc.value = '';
  } catch (e) {
    console.error('Failed to create version:', e);
  }
}

async function changeVersionStatus(newStatus: string) {
  if (!integration.value || !selectedVersion.value) return;
  
  try {
    const updated = await store.updateVersion(
      integration.value.id,
      selectedVersion.value.id,
      { status: newStatus }
    );
    
    const idx = integration.value.versions?.findIndex(v => v.id === updated.id);
    if (idx !== undefined && idx !== -1 && integration.value.versions) {
      integration.value.versions[idx] = updated;
      selectedVersion.value = updated;
    }
  } catch (e) {
    console.error('Failed to update version status:', e);
  }
}

function openDesigner() {
  router.push(`/integrations/${integration.value?.id}/design`);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusStyle(status: IntegrationStatus): Record<string, string> {
  switch (status) {
    case 'ACTIVE':   return { background: '#dcfce7', color: '#166534' };
    case 'INACTIVE': return { background: '#f1f5f9', color: '#334155' };
    case 'DRAFT':    return { background: '#dbeafe', color: '#1e40af' };
    case 'ERROR':    return { background: '#fee2e2', color: '#991b1b' };
    default:         return { background: '#f1f5f9', color: '#334155' };
  }
}

function getVersionStatusStyle(status: string): Record<string, string> {
  switch (status) {
    case 'Design':      return { background: '#dbeafe', color: '#1e40af' };
    case 'Testing':     return { background: '#fef3c7', color: '#b45309' };
    case 'Published':   return { background: '#dcfce7', color: '#166534' };
    case 'Deprecated':  return { background: '#f1f5f9', color: '#64748b' };
    default:            return { background: '#f1f5f9', color: '#64748b' };
  }
}
</script>

<style scoped>
.modal-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #414755; margin-bottom: 6px; margin-left: 2px; }
.modal-input {
  width: 100%; padding: 10px 14px; border: 1px solid #e3e2e7; border-radius: 12px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #1a1b1f; background: #f4f3f8;
  outline: none; box-sizing: border-box; transition: border-color 0.15s;
}
.modal-input:focus { border-color: #006e28; background: #fff; }
</style>