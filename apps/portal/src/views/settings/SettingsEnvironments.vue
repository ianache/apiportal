<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto w-full" style="font-family: 'Inter', sans-serif;">
      
      <!-- Header -->
      <header class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold" style="color: #1a1b1f;">Environments</h1>
          <p class="mt-1 text-sm" style="color: #717786;">Manage deployment environments for your APIs.</p>
        </div>
        <button
          v-if="canManage"
          @click="openCreateModal"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 14px rgba(0,88,188,0.30);"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
          Create Environment
        </button>
      </header>

      <!-- Error Banner -->
      <div
        v-if="environmentStore.error"
        class="mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm"
        style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;"
      >
        <span class="material-symbols-outlined">error</span>
        <p class="font-medium flex-1">{{ environmentStore.error }}</p>
        <button
          @click="environmentStore.fetchEnvironments()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold"
          style="background: #fee2e2; color: #991b1b;"
        >
          <span class="material-symbols-outlined text-base">refresh</span>
          Retry
        </button>
      </div>

      <!-- Loading -->
      <div v-if="environmentStore.loading" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
        <p class="mt-4 font-medium" style="color: #414755;">Loading environments…</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="environmentStore.environments.length === 0"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color: #c7c6d1;"
      >
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background: #f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color: #717786;">dns</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color: #1a1b1f;">No environments yet</h2>
        <p class="mb-8 max-w-sm text-sm" style="color: #414755;">
          Create environments to map API endpoints to different deployment targets (e.g., Production, Staging).
        </p>
        <button
          v-if="canManage"
          @click="openCreateModal"
          class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 14px rgba(0,88,188,0.30);"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">add_circle</span>
          Create First Environment
        </button>
      </div>

      <!-- Environments Table -->
      <div
        v-else
        class="overflow-hidden rounded-2xl border"
        style="background: #ffffff; border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
      >
        <table class="w-full text-left border-collapse">
          <thead>
            <tr style="background: #f4f3f8; border-bottom: 1px solid #e3e2e7;">
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Slug</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Name</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Tags</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style="color: #414755;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="env in environmentStore.environments"
              :key="env.id"
              class="transition-colors border-t hover:bg-gray-50"
              style="border-color: #e3e2e7;"
            >
              <td class="px-6 py-4">
                <code class="text-sm font-mono px-2 py-1 rounded" style="background: #f4f3f8; color: #0058bc;">{{ env.slug }}</code>
              </td>
              <td class="px-6 py-4 font-semibold" style="color: #1a1b1f;">{{ env.name }}</td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in env.tags"
                    :key="tag"
                    class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                    style="background: #e0f2fe; color: #075985;"
                  >{{ tag }}</span>
                  <span v-if="!env.tags?.length" class="text-sm" style="color: #717786;">—</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="canManage"
                    @click="openEditModal(env)"
                    class="p-2 rounded-lg transition-colors hover:bg-gray-100"
                    title="Edit"
                  >
                    <span class="material-symbols-outlined" style="color: #717786; font-size: 18px;">edit</span>
                  </button>
                  <button
                    v-if="canManage"
                    @click="confirmDelete(env)"
                    class="p-2 rounded-lg transition-colors hover:bg-red-50"
                    title="Delete"
                  >
                    <span class="material-symbols-outlined" style="color: #991b1b; font-size: 18px;">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <div
        v-if="showModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-6"
        style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
      >
        <div
          class="rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200"
          style="background: #ffffff;"
        >
          <div class="flex items-start justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold" style="color: #1a1b1f;">{{ editingEnv ? 'Edit' : 'Create' }} Environment</h2>
              <p class="text-sm mt-1" style="color: #717786;">{{ editingEnv ? 'Update environment details.' : 'Add a new deployment environment.' }}</p>
            </div>
            <button
              @click="closeModal"
              class="p-1.5 rounded-full transition-colors hover:bg-gray-100 ml-4"
              style="color: #717786;"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
                Slug <span v-if="!editingEnv" style="color: #991b1b;">*</span>
              </label>
              <input
                v-model="form.slug"
                type="text"
                :disabled="!!editingEnv"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
                :class="editingEnv ? 'opacity-50 cursor-not-allowed' : ''"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
                placeholder="e.g. production, staging"
              />
              <p class="text-[10px] mt-1 ml-1" style="color: #717786;">Lowercase letters, numbers, and dashes only</p>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
                Name <span style="color: #991b1b;">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
                placeholder="e.g. Production"
              />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
                Tags (comma-separated)
              </label>
              <input
                v-model="form.tags"
                type="text"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
                placeholder="e.g. prod, live, aws"
              />
            </div>
          </div>

          <div class="flex gap-3 mt-8">
            <button
              @click="closeModal"
              class="flex-1 py-3 px-6 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
              style="color: #414755; border: 1px solid #e3e2e7;"
            >
              <span class="material-symbols-outlined text-base">close</span>
              Cancel
            </button>
            <button
              @click="saveEnvironment"
              :disabled="!form.slug || !form.name || environmentStore.loading"
              class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              :style="{
                background: '#0058bc',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,88,188,0.30)',
                opacity: !form.slug || !form.name || environmentStore.loading ? 0.5 : 1,
                cursor: !form.slug || !form.name || environmentStore.loading ? 'not-allowed' : 'pointer',
              }"
            >
              <span v-if="environmentStore.loading" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined text-base">{{ editingEnv ? 'save' : 'add_circle' }}</span>
              {{ environmentStore.loading ? 'Saving...' : (editingEnv ? 'Save Changes' : 'Create') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-6"
        style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
      >
        <div
          class="rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200"
          style="background: #ffffff;"
        >
          <div class="flex flex-col items-center text-center mb-6">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4" style="background: #fef2f2;">
              <span class="material-symbols-outlined text-3xl" style="color: #991b1b;">warning</span>
            </div>
            <h2 class="text-xl font-bold" style="color: #1a1b1f;">Delete Environment?</h2>
            <p class="text-sm mt-2" style="color: #717786;">
              Are you sure you want to delete "<strong>{{ deletingEnv?.name }}</strong>"? This action cannot be undone.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              @click="showDeleteModal = false"
              class="flex-1 py-3 px-6 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
              style="color: #414755; border: 1px solid #e3e2e7;"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              :disabled="environmentStore.loading"
              class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              :style="{
                background: '#991b1b',
                color: '#ffffff',
                opacity: environmentStore.loading ? 0.5 : 1,
                cursor: environmentStore.loading ? 'not-allowed' : 'pointer',
              }"
            >
              <span v-if="environmentStore.loading" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined text-base">delete</span>
              {{ environmentStore.loading ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Shell from '../../components/layout/Shell.vue';
import { useEnvironmentStore } from '../../stores/environments';
import { useAuthStore } from '../../stores/auth';
import type { Environment } from 'shared-types';

const environmentStore = useEnvironmentStore();
const auth = useAuthStore();

const showModal = ref(false);
const showDeleteModal = ref(false);
const editingEnv = ref<Environment | null>(null);
const deletingEnv = ref<Environment | null>(null);

const form = ref({
  slug: '',
  name: '',
  tags: ''
});

const canManage = computed(() => {
  const roles = auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles || [];
  return roles.includes('API-Admin') || roles.includes('API-Manager');
});

onMounted(() => {
  environmentStore.fetchEnvironments();
});

const openCreateModal = () => {
  editingEnv.value = null;
  form.value = { slug: '', name: '', tags: '' };
  showModal.value = true;
};

const openEditModal = (env: Environment) => {
  editingEnv.value = env;
  form.value = {
    slug: env.slug,
    name: env.name,
    tags: env.tags?.join(', ') || ''
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingEnv.value = null;
  form.value = { slug: '', name: '', tags: '' };
};

const saveEnvironment = async () => {
  const tags = form.value.tags ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  try {
    if (editingEnv.value) {
      await environmentStore.updateEnvironment(editingEnv.value.id, {
        name: form.value.name,
        tags
      });
    } else {
      await environmentStore.createEnvironment({
        slug: form.value.slug.toLowerCase().trim(),
        name: form.value.name.trim(),
        tags
      });
    }
    closeModal();
  } catch {
    // error handled by store
  }
};

const confirmDelete = (env: Environment) => {
  deletingEnv.value = env;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!deletingEnv.value) return;
  try {
    await environmentStore.deleteEnvironment(deletingEnv.value.id);
    showDeleteModal.value = false;
    deletingEnv.value = null;
  } catch {
    // error handled by store
  }
};
</script>
