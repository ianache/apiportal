<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Global Error Banner -->
      <div
        v-if="registry.error && !showCreateModal"
        class="mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm"
        style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;"
      >
        <span class="material-symbols-outlined">error</span>
        <p class="font-medium flex-1">{{ registry.error }}</p>
        <button
          @click="registry.fetchApis()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
          style="background: #fee2e2; color: #991b1b;"
        >
          <span class="material-symbols-outlined text-base">refresh</span>
          Retry
        </button>
      </div>

      <!-- Header -->
      <header class="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <span class="text-xs font-bold tracking-widest uppercase mb-2 block" style="color: #0058bc;">APIs Catalog</span>
          <h1 class="text-5xl font-extrabold tracking-tight" style="color: #1a1b1f;">APIs</h1>
          <p class="mt-2 max-w-md text-sm" style="color: #414755;">
            Manage your API registry and track their lifecycle from design to publication.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- View Toggle -->
          <div class="flex items-center p-1 rounded-xl" style="background: #f4f3f8;">
            <button
              @click="viewMode = 'grid'"
              class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :style="viewMode === 'grid'
                ? 'background: #ffffff; color: #0058bc; box-shadow: 0 1px 4px rgba(0,0,0,0.10);'
                : 'color: #717786;'"
            >
              <span class="material-symbols-outlined text-lg">grid_view</span>
              Grid
            </button>
            <button
              @click="viewMode = 'table'"
              class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :style="viewMode === 'table'
                ? 'background: #ffffff; color: #0058bc; box-shadow: 0 1px 4px rgba(0,0,0,0.10);'
                : 'color: #717786;'"
            >
              <span class="material-symbols-outlined text-lg">view_list</span>
              Table
            </button>
          </div>

          <!-- New Project -->
          <button
            v-if="canCreate"
            @click="openCreateModal"
            class="py-2.5 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 active:scale-95"
            style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 14px rgba(0,88,188,0.30);"
          >
            <span class="material-symbols-outlined" style="font-size: 18px;">add_circle</span>
            New API
          </button>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="registry.loading" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
        <p class="mt-4 font-medium" style="color: #414755;">Loading projects…</p>
      </div>

      <!-- Error (inline, no banner) -->
      <div
        v-else-if="registry.error"
        class="p-4 rounded-xl flex items-center gap-3"
        style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;"
      >
        <span class="material-symbols-outlined">error</span>
        <p class="flex-1">{{ registry.error }}</p>
        <button
          @click="registry.fetchApis()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
          style="background: #fee2e2; color: #991b1b;"
        >
          <span class="material-symbols-outlined text-base">refresh</span>
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="registry.apis.length === 0"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color: #c7c6d1;"
      >
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background: #f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color: #717786;">folder_open</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color: #1a1b1f;">No projects yet</h2>
        <p class="mb-8 max-w-sm text-sm" style="color: #414755;">
          Get started by creating your first API project to manage its design and lifecycle.
        </p>
        <button
          v-if="canCreate"
          @click="openCreateModal"
          class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 active:scale-95"
          style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 14px rgba(0,88,188,0.30);"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">add_circle</span>
          Create First API
        </button>
      </div>

      <!-- ── Grid View ──────────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="api in registry.apis"
          :key="api.id"
          class="group rounded-2xl border p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
          style="background: #ffffff; border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
          @click="navigateToDetail(api.id)"
        >
          <!-- Card header -->
          <div class="flex justify-between items-start mb-5">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: #eff4ff;">
              <span
                class="material-symbols-outlined text-2xl"
                style="color: #0058bc; font-variation-settings: 'FILL' 1;"
              >api</span>
            </div>
            <span
              class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
              :style="getStatusStyle(api.versions?.[0]?.status)"
            >
              {{ api.versions?.[0]?.status || 'N/A' }}
            </span>
          </div>

          <!-- Card body -->
          <h3 class="text-base font-bold mb-1.5" style="color: #1a1b1f;">{{ api.name }}</h3>
          <p class="text-sm leading-relaxed line-clamp-2 mb-5" style="color: #414755;">
            {{ api.description || 'No description provided.' }}
          </p>

          <!-- Card footer -->
          <div class="pt-4 border-t flex items-center justify-between" style="border-color: #e3e2e7;">
            <span class="text-xs font-semibold flex items-center gap-1" style="color: #717786;">
              <span class="material-symbols-outlined" style="font-size: 14px;">tag</span>
              v{{ api.versions?.[0]?.version || '0.0.0' }}
            </span>
            <span
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity group-hover:opacity-80"
              style="background: #eff4ff; color: #0058bc;"
            >
              <span class="material-symbols-outlined" style="font-size: 15px;">tune</span>
              Manage
            </span>
          </div>
        </div>
      </div>

      <!-- ── Table View ─────────────────────────────────────────────────── -->
      <div
        v-else
        class="overflow-hidden rounded-2xl border"
        style="background: #ffffff; border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
      >
        <table class="w-full text-left border-collapse">
          <thead>
            <tr style="background: #f4f3f8; border-bottom: 1px solid #e3e2e7;">
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">API Name</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Latest Version</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Status</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Updated</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style="color: #414755;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="api in registry.apis"
              :key="api.id"
              class="transition-colors cursor-pointer border-t hover:bg-gray-50"
              style="border-color: #e3e2e7;"
              @click="navigateToDetail(api.id)"
            >
              <td class="px-6 py-4 font-semibold" style="color: #1a1b1f;">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background: #eff4ff;">
                    <span class="material-symbols-outlined" style="color: #0058bc; font-size: 16px;">api</span>
                  </div>
                  {{ api.name }}
                </div>
              </td>
                <td class="px-6 py-4 text-sm font-medium" style="color: #414755;">
                v{{ api.versions?.[0]?.version || '0.0.0' }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-block"
                  :style="getStatusStyle(api.versions?.[0]?.status)"
                >
                  {{ api.versions?.[0]?.status || 'N/A' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm" style="color: #414755;">{{ formatDate(api.updatedAt) }}</td>
              <td class="px-6 py-4 text-right">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style="background: #eff4ff; color: #0058bc;"
                  title="Open project"
                  @click.stop="navigateToDetail(api.id)"
                >
                  <span class="material-symbols-outlined" style="font-size: 15px;">open_in_new</span>
                  Open
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- ── Create Modal ───────────────────────────────────────────────────── -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
    >
      <div
        class="rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        style="background: #ffffff;"
      >
        <!-- Modal header -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color: #1a1b1f;">Create New API Project</h2>
            <p class="text-sm mt-1" style="color: #717786;">Fill in the details to register your API.</p>
          </div>
          <button
            @click="showCreateModal = false"
            class="p-1.5 rounded-full transition-colors hover:bg-gray-100 ml-4 flex-shrink-0"
            style="color: #717786;"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal error -->
        <div
          v-if="registry.error"
          class="mb-5 p-3 rounded-xl text-sm font-medium flex items-center gap-2"
          style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;"
        >
          <span class="material-symbols-outlined text-lg">error</span>
          {{ registry.error }}
        </div>

        <!-- Fields -->
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
              API Name <span style="color: #991b1b;">*</span>
            </label>
            <input
              v-model="newApi.name"
              type="text"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="e.g. Payments Engine"
            />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
              Label (for search)
            </label>
            <input
              v-model="newApi.label"
              type="text"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="e.g. Payments"
            />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
              Domain
            </label>
            <select
              v-model="newApi.domainId"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
            >
              <option value="">Select a domain...</option>
              <option v-for="d in domainsStore.domains" :key="d.id" :value="d.id">{{ d.title }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
              Description
            </label>
            <textarea
              v-model="newApi.description"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all h-28 resize-none"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="Describe the purpose of this API…"
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-8">
          <button
            @click="showCreateModal = false"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
            style="color: #414755; border: 1px solid #e3e2e7;"
          >
            <span class="material-symbols-outlined text-base">close</span>
            Cancel
          </button>
          <button
            @click="handleCreate"
            :disabled="registry.loading || !newApi.name"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            :style="{
              background: '#0058bc',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,88,188,0.30)',
              opacity: registry.loading || !newApi.name ? 0.5 : 1,
              cursor: registry.loading || !newApi.name ? 'not-allowed' : 'pointer',
            }"
          >
            <span v-if="registry.loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
            <span v-else class="material-symbols-outlined text-base">rocket_launch</span>
            {{ registry.loading ? 'Creating…' : 'Create Project' }}
          </button>
        </div>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useRegistryStore } from '../stores/registry';
import { useAuthStore } from '../stores/auth';
import { useDomainsStore } from '../stores/domains';

const registry = useRegistryStore();
const auth = useAuthStore();
const router = useRouter();
const domainsStore = useDomainsStore();

const viewMode = ref<'grid' | 'table'>('grid');
const showCreateModal = ref(false);

const newApi = ref({ name: '', label: '', description: '', domainId: '' });

const canCreate = computed(() =>
  auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles?.includes('API-Designer') ||
  auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles?.includes('API-Admin')
);

onMounted(() => { registry.fetchApis(); domainsStore.fetch(); });

const openCreateModal = () => {
  registry.error = null;
  newApi.value = { name: '', label: '', description: '', domainId: '' };
  showCreateModal.value = true;
};

const navigateToDetail = (id: string) => { router.push(`/projects/${id}`); };

const handleCreate = async () => {
  if (!newApi.value.name) return;
  try {
    await registry.createApi(newApi.value);
    showCreateModal.value = false;
    newApi.value = { name: '', label: '', description: '', domainId: '' };
  } catch {
    // error handled by store
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** Inline style object for status badges — WCAG AA contrast on each bg */
const getStatusStyle = (status: string | undefined): Record<string, string> => {
  switch (status) {
    case 'DESIGN':     return { background: '#dbeafe', color: '#1e40af' }; // blue-100 / blue-800
    case 'REVIEW':     return { background: '#fef9c3', color: '#854d0e' }; // yellow-100 / yellow-800
    case 'APPROVED':   return { background: '#dcfce7', color: '#166534' }; // green-100 / green-800
    case 'PUBLISHED':  return { background: '#e0f2fe', color: '#075985' }; // sky-100 / sky-800
    case 'DEPRECATED': return { background: '#ffedd5', color: '#9a3412' }; // orange-100 / orange-800
    case 'RETIRED':    return { background: '#f1f5f9', color: '#334155' }; // slate-100 / slate-700
    default:           return { background: '#f1f5f9', color: '#334155' };
  }
};
</script>
