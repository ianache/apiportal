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
      <div v-if="orgStore.loading && orgStore.organizations.length === 0" class="flex flex-col items-center justify-center py-20">
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
          @click="navigateToDetail(org.id)"
        >
          <template #icon>
            <div class="w-12 h-14 rounded-2xl flex items-center justify-center shadow-inner" 
                 style="background: linear-gradient(135deg, #0058bc 0%, #003a7d 100%);">
              <span class="material-symbols-outlined text-white text-2xl">corporate_fare</span>
            </div>
          </template>

          <template #header-text>
            <h3 class="text-lg font-extrabold leading-tight" style="color: #1a1b1f;">{{ org.name }}</h3>
            <p 
              class="text-[10px] font-bold uppercase tracking-wider mt-1 line-clamp-1" 
              style="color: #a0a7b5;"
              :title="org.description || ''"
            >
              {{ org.description || 'BUSINESS ORGANIZATION' }}
            </p>
          </template>

          <template #header-actions>
            <button @click.stop="openEditModal(org)" class="p-1.5 rounded-full hover:bg-slate-50 transition-colors" style="color: #717786;">
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button class="p-1.5 rounded-full hover:bg-slate-50 transition-colors" style="color: #717786;">
              <span class="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </template>

          <template #body>
            <div class="space-y-4 py-2">
              <div class="flex flex-col">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Products</span>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-black text-slate-900">{{ org.productCount || 0 }}</span>
                  <span class="text-[11px] font-bold text-emerald-500 flex items-center mb-1">
                    <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                  </span>
                </div>
              </div>
              
              <p class="text-sm leading-relaxed line-clamp-2 text-slate-500 min-h-[40px]">
                {{ truncateDescription(org.description) }}
              </p>
            </div>
          </template>

          <template #info>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="org.ownerId ? 'bg-emerald-500' : 'bg-amber-500'"></span>
              <span class="text-[10px] font-extrabold uppercase tracking-widest" :class="org.ownerId ? 'text-emerald-600' : 'text-amber-600'">
                Owner: {{ org.owner?.name || 'Unassigned' }}
              </span>
            </div>
            <div class="flex items-center gap-1 text-[9px] font-bold text-slate-400">
              <span class="material-symbols-outlined text-[12px]">fingerprint</span>
              {{ org.id.split('-')[0] }}...
            </div>
          </template>

          <template #actions>
            <button 
              @click.stop="registerProducts(org.id)"
              class="flex-1 py-3 px-4 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2" 
              style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 12px rgba(0,88,188,0.2);"
            >
              <span class="material-symbols-outlined text-sm">inventory_2</span>
              Products
            </button>
            <button 
              @click.stop="navigateToDetail(org.id)"
              class="flex-1 py-3 px-4 rounded-2xl text-sm font-bold border transition-all active:scale-95 flex items-center justify-center" 
              style="background: #f1f3f7; color: #0058bc; border-color: transparent;"
            >
              Details
            </button>
          </template>
        </CardTemplate>
      </div>

    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
    >
      <div
        class="rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        style="background: #ffffff;"
      >
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color: #1a1b1f;">{{ isEditing ? 'Edit Organization' : 'Create New Organization' }}</h2>
            <p class="text-sm mt-1" style="color: #717786;">{{ isEditing ? 'Update organization details.' : 'Register a new organization in the portal.' }}</p>
          </div>
          <button
            @click="closeModal"
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
              v-model="form.name"
              type="text"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              :class="errors.name ? 'border-red-300 ring-1 ring-red-100' : 'border-[#e3e2e7] focus:ring-2 focus:ring-blue-100'"
              style="background: #f4f3f8; color: #1a1b1f;"
              placeholder="e.g. Acme Corp"
            />
            <p v-if="errors.name" class="text-[10px] text-red-600 mt-1 ml-1 font-bold uppercase tracking-wider">{{ errors.name }}</p>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">Description <span style="color: #991b1b;">*</span></label>
            <textarea
              v-model="form.description"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all h-24 resize-none"
              :class="errors.description ? 'border-red-300 ring-1 ring-red-100' : 'border-[#e3e2e7] focus:ring-2 focus:ring-blue-100'"
              style="background: #f4f3f8; color: #1a1b1f;"
              placeholder="Describe the organization…"
            ></textarea>
            <p v-if="errors.description" class="text-[10px] text-red-600 mt-1 ml-1 font-bold uppercase tracking-wider">{{ errors.description }}</p>
          </div>
          
          <div v-if="isEditing" class="relative">
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">Organization Owner</label>
            
            <!-- Custom Searchable Combobox -->
            <div class="relative">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-slate-400" style="font-size: 18px;">search</span>
              </div>
              <input
                type="text"
                v-model="userSearchQuery"
                @focus="isUserDropdownOpen = true"
                class="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border border-[#e3e2e7] transition-all focus:ring-2 focus:ring-blue-100"
                style="background: #f4f3f8; color: #1a1b1f;"
                placeholder="Search owner by name or email..."
              />
              <div v-if="form.ownerId" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                <span class="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Selected</span>
                <button @click.stop="selectUser(null)" class="material-symbols-outlined text-blue-400 hover:text-blue-600" style="font-size: 14px;">close</button>
              </div>
            </div>

            <!-- Dropdown Results -->
            <div v-if="isUserDropdownOpen" class="absolute z-[110] w-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#e3e2e7] shadow-xl bg-white animate-in slide-in-from-top-2 duration-200">
              <div 
                v-for="user in filteredUsers" 
                :key="user.id"
                @click="selectUser(user)"
                class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex flex-col transition-colors border-b last:border-b-0 border-slate-50"
                :class="form.ownerId === user.id ? 'bg-blue-50/50' : ''"
              >
                <span class="text-sm font-bold" style="color: #1a1b1f;">{{ user.name }}</span>
                <span class="text-[10px] text-slate-500 font-medium">{{ user.email }}</span>
              </div>
              <div v-if="filteredUsers.length === 0" class="px-4 py-6 text-center text-sm text-slate-400 italic">
                No users found matching "{{ userSearchQuery }}"
              </div>
            </div>
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
            @click="handleSubmit"
            :disabled="orgStore.loading || !form.name || !form.description"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            :style="{
              background: '#0058bc',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,88,188,0.30)',
              opacity: orgStore.loading || !form.name || !form.description ? 0.5 : 1,
              cursor: orgStore.loading || !form.name || !form.description ? 'not-allowed' : 'pointer',
            }"
          >
            <span v-if="orgStore.loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
            <span v-else class="material-symbols-outlined text-base">save</span>
            {{ orgStore.loading ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create Organization') }}
          </button>
        </div>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import CardTemplate from '../components/CardTemplate.vue';
import { useOrganizationStore } from '../stores/organizations';
import type { Organization, User } from 'shared-types';

const orgStore = useOrganizationStore();
const router = useRouter();

const searchQuery = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

// Combobox search state
const userSearchQuery = ref('');
const isUserDropdownOpen = ref(false);

const form = reactive({
  name: '',
  description: '',
  ownerId: null as string | null
});

const errors = reactive({
  name: '',
  description: ''
});

const filteredOrganizations = computed(() => {
  if (!searchQuery.value) return orgStore.organizations;
  const query = searchQuery.value.toLowerCase();
  return orgStore.organizations.filter(org => 
    org.name.toLowerCase().includes(query) || 
    (org.description && org.description.toLowerCase().includes(query))
  );
});

// Searchable users logic
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return orgStore.users;
  const query = userSearchQuery.value.toLowerCase();
  return orgStore.users.filter(u => 
    (u.name && u.name.toLowerCase().includes(query)) || 
    u.email.toLowerCase().includes(query)
  );
});

onMounted(async () => {
  await orgStore.fetchOrganizations();
  await orgStore.fetchUsers();
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

const handleOutsideClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    isUserDropdownOpen.value = false;
  }
};

const selectUser = (user: User | null) => {
  if (user) {
    form.ownerId = user.id;
    userSearchQuery.value = user.name || user.email;
  } else {
    form.ownerId = null;
    userSearchQuery.value = '';
  }
  isUserDropdownOpen.value = false;
};

const validate = () => {
  let isValid = true;
  errors.name = '';
  errors.description = '';

  if (!form.name.trim()) {
    errors.name = 'Name is required';
    isValid = false;
  }
  if (!form.description.trim()) {
    errors.description = 'Description is required';
    isValid = false;
  }
  return isValid;
};

const openCreateModal = () => {
  orgStore.error = null;
  isEditing.value = false;
  editingId.value = null;
  form.name = '';
  form.description = '';
  form.ownerId = null;
  userSearchQuery.value = '';
  showModal.value = true;
};

const openEditModal = (org: Organization) => {
  orgStore.error = null;
  isEditing.value = true;
  editingId.value = org.id;
  form.name = org.name;
  form.description = org.description || '';
  form.ownerId = org.ownerId || null;
  
  // Set initial search query to current owner name
  if (org.owner) {
    userSearchQuery.value = org.owner.name || org.owner.email;
  } else {
    userSearchQuery.value = '';
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  isUserDropdownOpen.value = false;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  try {
    if (isEditing.value && editingId.value) {
      await orgStore.updateOrganization(editingId.value, {
        name: form.name,
        description: form.description,
        ownerId: form.ownerId
      });
    } else {
      await orgStore.createOrganization({
        name: form.name,
        description: form.description
      });
    }
    showModal.value = false;
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
  const org = orgStore.organizations.find(o => o.id === id);
  if (org) openEditModal(org);
};

const registerProducts = (id: string) => {
  router.push(`/organizations/${id}/products`);
};
</script>

<style scoped>
/* Custom scrollbar for dropdown */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e3e2e7;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #0058bc;
}
</style>
