<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">
      
      <!-- Header -->
      <header class="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <span class="text-xs font-bold text-primary tracking-widest uppercase mb-2 block">Workspace</span>
          <h1 class="text-5xl font-extrabold tracking-tight text-on-surface">Projects</h1>
          <p class="text-on-surface-variant mt-2 max-w-md">
            Manage your API registry and track their lifecycle from design to publication.
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- View Toggle -->
          <div class="flex items-center p-1 bg-surface-container-low rounded-xl">
            <button 
              @click="viewMode = 'grid'"
              class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :class="viewMode === 'grid' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'"
            >
              <span class="material-symbols-outlined text-lg">grid_view</span>
              Grid
            </button>
            <button 
              @click="viewMode = 'table'"
              class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :class="viewMode === 'table' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'"
            >
              <span class="material-symbols-outlined text-lg">view_list</span>
              Table
            </button>
          </div>

          <!-- Add Button -->
          <button
            @click="showCreateModal = true"
            v-if="canCreate"
            class="py-2.5 px-5 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <span class="material-symbols-outlined">add</span>
            New Project
          </button>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="registry.loading" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        <p class="mt-4 text-on-surface-variant font-medium">Loading projects...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="registry.error" class="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3">
        <span class="material-symbols-outlined">error</span>
        <p>{{ registry.error }}</p>
        <button @click="registry.fetchApis()" class="ml-auto underline text-sm font-bold">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="registry.apis.length === 0" class="border-2 border-dashed border-outline-variant/30 rounded-3xl p-20 text-center flex flex-col items-center">
        <div class="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-4xl text-outline">folder_open</span>
        </div>
        <h2 class="text-xl font-bold mb-2">No projects found</h2>
        <p class="text-on-surface-variant mb-8 max-w-sm">Get started by creating your first API project to manage its design and lifecycle.</p>
        <button
          @click="showCreateModal = true"
          v-if="canCreate"
          class="py-2.5 px-6 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          Create First API
        </button>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="api in registry.apis" 
          :key="api.id"
          class="group bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-low transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-sm hover:shadow-md"
          @click="navigateToDetail(api.id)"
        >
          <div class="flex justify-between items-start mb-6">
            <div class="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">api</span>
            </div>
            <span 
              class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
              :class="getStatusClass(api.versions[0]?.status)"
            >
              {{ api.versions[0]?.status || 'N/A' }}
            </span>
          </div>
          <h3 class="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{{ api.name }}</h3>
          <p class="text-on-surface-variant text-sm mb-6 leading-relaxed line-clamp-2">
            {{ api.description || 'No description provided.' }}
          </p>
          <div class="pt-6 border-t border-outline-variant/10 flex items-center justify-between">
            <span class="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">label</span>
              v{{ api.versions[0]?.version || '0.0.0' }}
            </span>
            <button class="text-primary text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              Manage <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-hidden bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low">
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">API Name</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Latest Version</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Updated</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/10">
            <tr 
              v-for="api in registry.apis" 
              :key="api.id"
              class="hover:bg-surface-container-low transition-colors cursor-pointer"
              @click="navigateToDetail(api.id)"
            >
              <td class="px-6 py-4 font-bold text-on-surface">{{ api.name }}</td>
              <td class="px-6 py-4 text-sm font-medium text-on-surface-variant">v{{ api.versions[0]?.version || '0.0.0' }}</td>
              <td class="px-6 py-4">
                <span 
                  class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-block"
                  :class="getStatusClass(api.versions[0]?.status)"
                >
                  {{ api.versions[0]?.status || 'N/A' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-on-surface-variant">{{ formatDate(api.updatedAt) }}</td>
              <td class="px-6 py-4 text-right">
                <button class="p-2 hover:bg-surface-container-high rounded-lg text-primary transition-colors">
                  <span class="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Create Modal (Placeholder for Task 2) -->
    <div v-if="showCreateModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 class="text-2xl font-bold mb-6">Create New API Project</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">API Name</label>
            <input v-model="newApi.name" type="text" class="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Payments Engine" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Description</label>
            <textarea v-model="newApi.description" class="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 h-32" placeholder="Describe the purpose of this API..."></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-8">
          <button @click="showCreateModal = false" class="flex-1 py-3 px-6 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-all">Cancel</button>
          <button @click="handleCreate" class="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">Create Project</button>
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

const registry = useRegistryStore();
const auth = useAuthStore();
const router = useRouter();

const viewMode = ref<'grid' | 'table'>('grid');
const showCreateModal = ref(false);

const newApi = ref({
  name: '',
  description: ''
});

const canCreate = computed(() => 
  auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles?.includes('API-Designer') ||
  auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles?.includes('API-Admin')
);

onMounted(() => {
  registry.fetchApis();
});

const navigateToDetail = (id: string) => {
  router.push(`/projects/${id}`);
};

const handleCreate = async () => {
  if (!newApi.value.name) return;
  try {
    await registry.createApi(newApi.value);
    showCreateModal.value = false;
    newApi.value = { name: '', description: '' };
  } catch (err) {
    // Error is handled by store
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'DESIGN': return 'bg-blue-100 text-blue-700';
    case 'REVIEW': return 'bg-amber-100 text-amber-700';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
    case 'PUBLISHED': return 'bg-secondary-container/30 text-secondary';
    case 'DEPRECATED': return 'bg-orange-100 text-orange-700';
    case 'RETIRED': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};
</script>
