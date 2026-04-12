<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Header -->
      <header class="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
        <div>
          <span class="text-xs font-bold tracking-widest uppercase mb-2 block" style="color: #0058bc;">Organization</span>
          <h1 class="text-4xl font-extrabold tracking-tight" style="color: #1a1b1f;">Organization Manager</h1>
          <p class="mt-2 max-w-md text-sm" style="color: #414755;">
            Manage and explore organizations you belong to.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- New Organization Button -->
          <button
            @click="openCreateModal"
            class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90"
            style="background: #0058bc; color: #ffffff;"
          >
            <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
            New Organization
          </button>
        </div>
      </header>

      <!-- Search -->
      <div class="bg-white rounded-2xl border p-6 mb-8" style="border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
        <div class="flex items-center gap-4">
          <div class="flex-1 relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style="color: #a0a7b5; font-size: 20px;">search</span>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-100"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="Search organizations by name..."
            />
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="orgStore.loading" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
        <p class="mt-4 font-medium" style="color: #414755;">Loading organizations...</p>
      </div>

      <!-- Empty Results -->
      <div
        v-else-if="filteredOrganizations.length === 0"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color: #c7c6d1;"
      >
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background: #f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color: #717786;">corporate_fare</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color: #1a1b1f;">No organizations found</h2>
        <p class="mb-8 max-w-sm text-sm" style="color: #414755;">
          {{ searchQuery ? 'Try adjusting your search query.' : 'Get started by creating your first organization.' }}
        </p>
        <button
          v-if="!searchQuery"
          @click="openCreateModal"
          class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style="background: #0058bc; color: #ffffff;"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
          Create Organization
        </button>
      </div>

      <!-- Grid View -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardTemplate
          v-for="org in filteredOrganizations"
          :key="org.id"
          class="cursor-pointer hover:-translate-y-1"
          @click="navigateToDetail(org.id)"
        >
          <template #header>
            <h3 class="text-base font-bold mb-1.5" style="color: #1a1b1f;">{{ org.name }}</h3>
            <p 
              class="text-sm leading-relaxed line-clamp-2" 
              style="color: #414755;"
              :title="org.description || ''"
            >
              {{ truncateDescription(org.description) }}
            </p>
          </template>

          <template #header-actions>
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: #eff4ff;">
              <span
                class="material-symbols-outlined text-2xl"
                style="color: #0058bc; font-variation-settings: 'FILL' 1;"
              >corporate_fare</span>
            </div>
          </template>

          <template #info>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span class="material-symbols-outlined" style="font-size: 14px;">fingerprint</span>
                ID: {{ org.id }}
              </div>
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full" style="background: #e0f2fe; color: #075985;">
                  {{ org.apiCount }} Associated APIs
                </span>
              </div>
            </div>
          </template>

          <template #actions>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style="background: #f1f5f9; color: #334155;"
              @click.stop="navigateToEdit(org.id)"
            >
              <span class="material-symbols-outlined" style="font-size: 15px;">edit</span>
              Edit
            </button>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style="background: #eff4ff; color: #0058bc;"
              @click.stop="registerProducts(org.id)"
            >
              <span class="material-symbols-outlined" style="font-size: 15px;">inventory_2</span>
              Register Products
            </button>
          </template>
        </CardTemplate>
      </div>

    </div>

    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
    >
      <div
        class="rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        style="background: #ffffff;"
      >
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color: #1a1b1f;">Create New Organization</h2>
            <p class="text-sm mt-1" style="color: #717786;">Register a new organization in the portal.</p>
          </div>
          <button
            @click="showCreateModal = false"
            class="p-1.5 rounded-full transition-colors hover:bg-gray-100 ml-4 flex-shrink-0"
            style="color: #717786;"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div v-if="orgStore.error" class="mb-5 p-3 rounded-xl text-sm font-medium flex items-center gap-2" style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">
          <span class="material-symbols-outlined text-lg">error</span>
          {{ orgStore.error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">Name <span style="color: #991b1b;">*</span></label>
            <input
              v-model="newOrg.name"
              type="text"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">Description</label>
            <textarea
              v-model="newOrg.description"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all h-28 resize-none"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="Describe the organization…"
            ></textarea>
          </div>
        </div>

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
            :disabled="orgStore.loading || !newOrg.name"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            :style="{
              background: '#0058bc',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,88,188,0.30)',
              opacity: orgStore.loading || !newOrg.name ? 0.5 : 1,
              cursor: orgStore.loading || !newOrg.name ? 'not-allowed' : 'pointer',
            }"
          >
            <span v-if="orgStore.loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
            <span v-else class="material-symbols-outlined text-base">corporate_fare</span>
            {{ orgStore.loading ? 'Creating…' : 'Create Organization' }}
          </button>
        </div>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import CardTemplate from '../components/CardTemplate.vue';
import { useOrganizationStore } from '../stores/organizations';

const orgStore = useOrganizationStore();
const router = useRouter();

const searchQuery = ref('');
const showCreateModal = ref(false);
const newOrg = ref({ name: '', description: '' });

const filteredOrganizations = computed(() => {
  if (!searchQuery.value) return orgStore.organizations;
  const query = searchQuery.value.toLowerCase();
  return orgStore.organizations.filter(org => 
    org.name.toLowerCase().includes(query) || 
    (org.description && org.description.toLowerCase().includes(query))
  );
});

onMounted(async () => {
  await orgStore.fetchOrganizations();
});

const openCreateModal = () => {
  orgStore.error = null;
  newOrg.value = { name: '', description: '' };
  showCreateModal.value = true;
};

const handleCreate = async () => {
  if (!newOrg.value.name) return;
  try {
    await orgStore.createOrganization(newOrg.value);
    showCreateModal.value = false;
  } catch {
    // error handled by store
  }
};

const truncateDescription = (desc: string | null) => {
  if (!desc) return 'No description provided.';
  if (desc.length <= 200) return desc;
  return desc.substring(0, 200) + '...';
};

const navigateToDetail = (id: string) => {
  // router.push(`/organizations/${id}`);
  console.log('Navigate to detail', id);
};

const navigateToEdit = (id: string) => {
  // router.push(`/organizations/${id}/edit`);
  console.log('Navigate to edit', id);
};

const registerProducts = (id: string) => {
  // router.push(`/organizations/${id}/products`);
  console.log('Register products for organization', id);
};
</script>
