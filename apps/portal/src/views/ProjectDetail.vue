<template>
  <Shell>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[60vh]">
      <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
      <p class="mt-4 font-medium" style="color: #414755;">Loading project details…</p>
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
    <div v-else-if="api" class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 mb-6 text-sm">
        <router-link
          to="/projects"
          class="transition-colors hover:underline"
          style="color: #717786;"
        >APIs Catalog</router-link>
        <span class="material-symbols-outlined text-sm" style="color: #a0a7b5;">chevron_right</span>
        <span class="font-semibold" style="color: #1a1b1f;">{{ api.name }}</span>
      </nav>

      <!-- Header -->
      <header class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style="background: #0058bc; box-shadow: 0 4px 14px rgba(0,88,188,0.30);">
              <span class="material-symbols-outlined text-3xl text-white"
                    style="font-variation-settings: 'FILL' 1;">api</span>
            </div>
            <div>
              <!-- Inline Edit: API Name -->
              <div v-if="editingName" class="flex items-center gap-2">
                <input
                  v-model="editName"
                  ref="nameInput"
                  @blur="saveName"
                  @keydown.enter="saveName"
                  @keydown.escape="cancelEditName"
                  class="text-4xl font-extrabold tracking-tight px-2 py-1 rounded border outline-none"
                  style="color: #1a1b1f; border-color: #0058bc;"
                />
                <button @click="saveName" class="p-1 rounded hover:bg-green-100" style="color: #047857;">
                  <span class="material-symbols-outlined text-xl">check</span>
                </button>
                <button @click="cancelEditName" class="p-1 rounded hover:bg-red-100" style="color: #991b1b;">
                  <span class="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <h1 v-else @click="startEditName" class="text-4xl font-extrabold tracking-tight cursor-pointer hover:underline" style="color: #1a1b1f;" :title="canEditMetadata ? 'Click to edit' : ''">{{ api.name }}</h1>
              <p class="font-medium text-sm" style="color: #717786;">Project ID: {{ api.id }}</p>
            </div>
          </div>
          <!-- Inline Edit: Description -->
          <div v-if="editingDesc" class="flex flex-col gap-2">
            <textarea
              v-model="editDesc"
              ref="descInput"
              @blur="saveDesc"
              @keydown.escape="cancelEditDesc"
              class="text-lg leading-relaxed max-w-2xl px-2 py-1 rounded border outline-none resize-none"
              style="color: #414755; border-color: #0058bc; height: 80px;"
              placeholder="Enter description..."
            />
            <div class="flex gap-2">
              <button @click="saveDesc" class="px-3 py-1 rounded-lg text-sm font-bold" style="background: #047857; color: white;">Save</button>
              <button @click="cancelEditDesc" class="px-3 py-1 rounded-lg text-sm font-bold" style="background: #991b1b; color: white;">Cancel</button>
            </div>
          </div>
          <p v-else @click="startEditDesc" class="text-lg leading-relaxed max-w-2xl cursor-pointer hover:underline" style="color: #414755;" :title="canEditMetadata ? 'Click to edit' : ''">
            {{ api.description || 'No description provided for this API project.' }}
          </p>
        </div>

        <!-- Lifecycle card -->
        <div class="rounded-3xl p-6 flex flex-col justify-center border"
             style="background: #f4f3f8; border-color: #e3e2e7;">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Lifecycle Status</span>
            <span
              class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
              :style="getStatusStyle(currentVersion?.status)"
            >{{ currentVersion?.status || 'UNKNOWN' }}</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span style="color: #717786;">Latest Version</span>
              <span class="font-bold" style="color: #1a1b1f;">v{{ currentVersion?.version }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span style="color: #717786;">Created</span>
              <span style="color: #1a1b1f;">{{ formatDate(api.createdAt) }}</span>
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
              <option value="DESIGN">DESIGN</option>
              <option value="REVIEW">REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
            <button
              v-if="canCreateVersion"
              @click="showNewVersionModal = true"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style="background: #eff4ff; color: #0058bc;"
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
                ? 'background: #ffffff; border-color: #0058bc; box-shadow: 0 2px 8px rgba(0,88,188,0.12); transform: scale(1.02);'
                : 'background: #f4f3f8; border-color: transparent;'"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="font-bold"
                  :style="selectedVersion?.id === v.id ? 'color: #0058bc;' : 'color: #1a1b1f;'"
                >v{{ v.version }}</span>
                <span
                  class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  :style="getStatusStyle(v.status)"
                >{{ v.status }}</span>
              </div>
              <p class="text-[10px]" style="color: #717786;">{{ formatDate(v.createdAt) }}</p>
            </button>
          </div>
        </aside>

        <!-- Version Detail -->
        <main class="lg:col-span-3 space-y-8">
          <section
            v-if="selectedVersion"
            class="rounded-3xl p-8 border shadow-sm"
            style="background: #ffffff; border-color: #e3e2e7;"
          >
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 class="text-2xl font-bold" style="color: #1a1b1f;">Version v{{ selectedVersion.version }}</h3>
                <p class="text-sm mt-1" style="color: #717786;">Status Management & Operations</p>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-2">

                <!-- Submit for Review -->
                <button
                  v-if="canSubmitForReview"
                  @click="handleStatusTransition('REVIEW')"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style="background: #ffffff; border: 1.5px solid #0058bc; color: #0058bc;"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">rate_review</span>
                  Submit for Review
                </button>

                <!-- Approve — amber-700 para pasar WCAG AA con blanco -->
                <button
                  v-if="canApprove"
                  @click="handleStatusTransition('APPROVED')"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style="background: #b45309; color: #ffffff; box-shadow: 0 4px 12px rgba(180,83,9,0.25);"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
                  Approve Version
                </button>

                <!-- Publish — emerald-700 para pasar WCAG AA con blanco -->
                <button
                  v-if="canPublish"
                  @click="handleStatusTransition('PUBLISHED')"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style="background: #047857; color: #ffffff; box-shadow: 0 4px 12px rgba(4,120,87,0.25);"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">rocket_launch</span>
                  Publish API
                </button>

                <!-- Design Flow -->
                <button
                  v-if="selectedVersion.status === 'DESIGN'"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 active:scale-95"
                  style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 12px rgba(0,88,188,0.25);"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                  Design Flow
                </button>
              </div>
            </div>

            <!-- Details grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-5 rounded-2xl border" style="background: #f4f3f8; border-color: #e3e2e7;">
                <h4 class="text-xs font-bold uppercase tracking-widest mb-4" style="color: #717786;">
                  Implementation Details
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
                      :style="getStatusStyle(selectedVersion.status)"
                    >{{ selectedVersion.status }}</span>
                  </div>
                </div>
              </div>

              <div class="p-5 rounded-2xl border" style="background: #f4f3f8; border-color: #e3e2e7;">
                <h4 class="text-xs font-bold uppercase tracking-widest mb-4" style="color: #717786;">
                  Designer Insights
                </h4>
                <p class="text-sm leading-relaxed italic" style="color: #414755;">
                  "This version includes updated rate-limiting policies and new endpoints for batch
                  processing. Ready for security review."
                </p>
              </div>
            </div>

            <!-- Endpoints Section -->
            <section class="mt-8">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-bold" style="color: #1a1b1f;">API Endpoints</h4>
                <button
                  v-if="canManageEndpoints"
                  @click="showEndpointModal = true"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style="background: #eff4ff; color: #0058bc;"
                >
                  <span class="material-symbols-outlined" style="font-size: 15px;">add</span>
                  Add Endpoint
                </button>
              </div>

              <div v-if="!selectedVersion.endpoints?.length" class="p-6 rounded-2xl border text-center" style="background: #f4f3f8; border-color: #e3e2e7;">
                <p class="text-sm" style="color: #717786;">
                  No endpoints configured for this version yet.
                </p>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="endpoint in selectedVersion.endpoints"
                  :key="endpoint.id"
                  class="flex items-center justify-between p-4 rounded-xl border"
                  style="background: #ffffff; border-color: #e3e2e7;"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: #eff4ff;">
                      <span class="material-symbols-outlined" style="color: #0058bc;">http</span>
                    </div>
                    <div>
                      <p class="font-semibold" style="color: #1a1b1f;">{{ endpoint.environment?.name || 'Unknown' }}</p>
                      <p class="text-sm font-mono" style="color: #717786;">{{ endpoint.baseUrl }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style="background: #e0f2fe; color: #075985;"
                    >{{ endpoint.environment?.slug }}</span>
                    <button
                      v-if="canManageEndpoints"
                      @click="handleDeleteEndpoint(endpoint.id)"
                      class="p-2 rounded-lg transition-colors hover:bg-red-50"
                      title="Delete endpoint"
                    >
                      <span class="material-symbols-outlined" style="color: #991b1b; font-size: 18px;">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </main>

      </div>
    </div>

    <!-- New Version Modal -->
    <div
      v-if="showNewVersionModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
    >
      <div
        class="rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        style="background: #ffffff;"
      >
        <div class="flex items-start justify-between mb-2">
          <h2 class="text-2xl font-bold" style="color: #1a1b1f;">New Version</h2>
          <button
            @click="showNewVersionModal = false"
            class="p-1.5 rounded-full transition-colors hover:bg-gray-100 ml-4"
            style="color: #717786;"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <p class="text-sm mb-6" style="color: #717786;">Create a new branch from current state.</p>

        <div>
          <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
            Version Number (SemVer) <span style="color: #991b1b;">*</span>
          </label>
          <input
            v-model="newVersionNumber"
            type="text"
            class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
            style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
            placeholder="e.g. 1.0.0"
          />
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="showNewVersionModal = false"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
            style="color: #414755; border: 1px solid #e3e2e7;"
          >
            <span class="material-symbols-outlined text-base">close</span>
            Cancel
          </button>
          <button
            @click="handleCreateVersion"
            :disabled="!newVersionNumber || registry.loading"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            :style="{
              background: '#0058bc',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,88,188,0.30)',
              opacity: !newVersionNumber || registry.loading ? 0.5 : 1,
              cursor: !newVersionNumber || registry.loading ? 'not-allowed' : 'pointer'
            }"
          >
            <span v-if="registry.loading" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
            <span v-else class="material-symbols-outlined text-base">add_circle</span>
            {{ registry.loading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Endpoint Modal -->
    <div
      v-if="showEndpointModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
    >
      <div
        class="rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        style="background: #ffffff;"
      >
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color: #1a1b1f;">Add Endpoint</h2>
            <p class="text-sm mt-1" style="color: #717786;">Map an environment to this API version.</p>
          </div>
          <button
            @click="showEndpointModal = false"
            class="p-1.5 rounded-full transition-colors hover:bg-gray-100 ml-4"
            style="color: #717786;"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
              Environment <span style="color: #991b1b;">*</span>
            </label>
            <select
              v-model="newEndpoint.environmentId"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
            >
              <option value="">Select environment...</option>
              <option v-for="env in environments" :key="env.id" :value="env.id">
                {{ env.name }} ({{ env.slug }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
              Base URL <span style="color: #991b1b;">*</span>
            </label>
            <input
              v-model="newEndpoint.baseUrl"
              type="url"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="https://api.example.com"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="showEndpointModal = false"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
            style="color: #414755; border: 1px solid #e3e2e7;"
          >
            <span class="material-symbols-outlined text-base">close</span>
            Cancel
          </button>
          <button
            @click="handleAddEndpoint"
            :disabled="!newEndpoint.environmentId || !newEndpoint.baseUrl || registry.loading"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            :style="{
              background: '#0058bc',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,88,188,0.30)',
              opacity: !newEndpoint.environmentId || !newEndpoint.baseUrl || registry.loading ? 0.5 : 1,
              cursor: !newEndpoint.environmentId || !newEndpoint.baseUrl || registry.loading ? 'not-allowed' : 'pointer'
            }"
          >
            <span v-if="registry.loading" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
            <span v-else class="material-symbols-outlined text-base">add_circle</span>
            {{ registry.loading ? 'Adding...' : 'Add' }}
          </button>
        </div>
      </div>
    </div>

  </Shell>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useRegistryStore } from '../stores/registry';
import { useEnvironmentStore } from '../stores/environments';
import { useAuthStore } from '../stores/auth';
import type { API, APIVersion, APIStatus, Environment } from 'shared-types';

const route = useRoute();
const registry = useRegistryStore();
const environmentStore = useEnvironmentStore();
const auth = useAuthStore();

const api = ref<API | null>(null);
const selectedVersion = ref<APIVersion | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showNewVersionModal = ref(false);
const newVersionNumber = ref('');

// Endpoint modal state
const showEndpointModal = ref(false);
const newEndpoint = ref({ environmentId: '', baseUrl: '' });

const environments = computed(() => environmentStore.environments);
const canManageEndpoints = computed(() => userRole.value !== 'API_DEVELOPER');

// Inline editing state
const editingName = ref(false);
const editingDesc = ref(false);
const editName = ref('');
const editDesc = ref('');
const nameInput = ref<HTMLInputElement | null>(null);
const descInput = ref<HTMLTextAreaElement | null>(null);

// Version filter
const statusFilter = ref('ALL');

const filteredVersions = computed(() => {
  if (!api.value?.versions) return [];
  let versions = [...api.value.versions];
  if (statusFilter.value !== 'ALL') {
    versions = versions.filter(v => v.status === statusFilter.value);
  }
  // Sort descending by createdAt
  versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return versions;
});

const currentVersion = computed(() => api.value?.versions?.[0] || null);

const userRole = computed(() => {
  const roles = auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles || [];
  if (roles.includes('API-Admin') || roles.includes('API-Manager')) return 'API_MANAGER';
  if (roles.includes('API-Designer')) return 'API_DESIGNER';
  return 'API_DEVELOPER';
});

const canEditMetadata = computed(() =>
  userRole.value !== 'API_DEVELOPER' &&
  selectedVersion.value?.status !== 'PUBLISHED'
);

const canCreateVersion = computed(() =>
  userRole.value !== 'API_DEVELOPER'
);

const canSubmitForReview = computed(() =>
  selectedVersion.value?.status === 'DESIGN' &&
  (userRole.value === 'API_MANAGER' || userRole.value === 'API_DESIGNER')
);

const canApprove = computed(() =>
  selectedVersion.value?.status === 'REVIEW' && userRole.value === 'API_MANAGER'
);

const canPublish = computed(() =>
  selectedVersion.value?.status === 'APPROVED' && userRole.value === 'API_MANAGER'
);

// Inline editing methods
const startEditName = async () => {
  if (!canEditMetadata.value) return;
  editName.value = api.value?.name || '';
  editingName.value = true;
  await nextTick();
  nameInput.value?.focus();
};

const saveName = async () => {
  if (!api.value || !editName.value.trim()) {
    cancelEditName();
    return;
  }
  try {
    await registry.updateApi(api.value.id, { name: editName.value.trim() });
    api.value.name = editName.value.trim();
    editingName.value = false;
  } catch (err: any) {
    error.value = err.message;
  }
};

const cancelEditName = () => {
  editingName.value = false;
  editName.value = '';
};

const startEditDesc = async () => {
  if (!canEditMetadata.value) return;
  editDesc.value = api.value?.description || '';
  editingDesc.value = true;
  await nextTick();
  descInput.value?.focus();
};

const saveDesc = async () => {
  if (!api.value) {
    cancelEditDesc();
    return;
  }
  try {
    await registry.updateApi(api.value.id, { description: editDesc.value.trim() });
    api.value.description = editDesc.value.trim();
    editingDesc.value = false;
  } catch (err: any) {
    error.value = err.message;
  }
};

const cancelEditDesc = () => {
  editingDesc.value = false;
  editDesc.value = '';
};

// Create version handler
const handleCreateVersion = async () => {
  if (!api.value || !newVersionNumber.value) return;
  try {
    await registry.createVersion(api.value.id, newVersionNumber.value);
    showNewVersionModal.value = false;
    newVersionNumber.value = '';
    await fetchData();
  } catch (err: any) {
    error.value = err.message;
  }
};

// Endpoint handlers
const handleAddEndpoint = async () => {
  if (!api.value || !selectedVersion.value || !newEndpoint.value.environmentId || !newEndpoint.value.baseUrl) return;
  try {
    await registry.registerEndpoint(api.value.id, selectedVersion.value.version, {
      environmentId: newEndpoint.value.environmentId,
      baseUrl: newEndpoint.value.baseUrl
    });
    showEndpointModal.value = false;
    newEndpoint.value = { environmentId: '', baseUrl: '' };
    await fetchData();
  } catch (err: any) {
    error.value = err.message;
  }
};

const handleDeleteEndpoint = async (endpointId: string) => {
  if (!api.value || !selectedVersion.value) return;
  try {
    await registry.deleteEndpoint(api.value.id, selectedVersion.value.version, endpointId);
    await fetchData();
  } catch (err: any) {
    error.value = err.message;
  }
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id as string;
    const data = await registry.fetchApiById(id);
    api.value = data;
    if (data.versions?.length) selectedVersion.value = data.versions[0];
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchData();
  await environmentStore.fetchEnvironments();
});

const handleStatusTransition = async (status: APIStatus) => {
  if (!api.value || !selectedVersion.value) return;
  try {
    await registry.updateVersionStatus(api.value.id, selectedVersion.value.version, status);
    await fetchData();
  } catch {
    // handled by store
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

const getStatusStyle = (status?: string): Record<string, string> => {
  switch (status) {
    case 'DESIGN':     return { background: '#dbeafe', color: '#1e40af' };
    case 'REVIEW':     return { background: '#fef9c3', color: '#854d0e' };
    case 'APPROVED':   return { background: '#dcfce7', color: '#166534' };
    case 'PUBLISHED':  return { background: '#e0f2fe', color: '#075985' };
    case 'DEPRECATED': return { background: '#ffedd5', color: '#9a3412' };
    case 'RETIRED':    return { background: '#f1f5f9', color: '#334155' };
    default:           return { background: '#f1f5f9', color: '#334155' };
  }
};
</script>
