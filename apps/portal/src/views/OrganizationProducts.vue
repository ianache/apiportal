<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">
      
      <!-- Breadcrumbs / Header -->
      <nav class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4" style="color: #717786;">
        <router-link to="/organizations" class="hover:text-[#0058bc] transition-colors">Organizations</router-link>
        <span class="material-symbols-outlined text-[14px]">chevron_right</span>
        <span style="color: #0058bc;">{{ organization?.name || 'Loading...' }}</span>
      </nav>

      <header class="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
        <div>
          <span class="text-xs font-bold tracking-widest uppercase mb-2 block" style="color: #0058bc;">Products</span>
          <h1 class="text-4xl font-extrabold tracking-tight" style="color: #1a1b1f;">Product Catalog</h1>
          <p class="mt-2 max-w-md text-sm" style="color: #414755;">
            Manage internal products and their software configuration items for this organization.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- New Product Button - RBAC: Manager or Owner -->
          <button
            v-if="canAddProduct"
            @click="openCreateModal"
            class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90"
            style="background: #0058bc; color: #ffffff;"
          >
            <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
            Add Product
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
              placeholder="Search products by name..."
            />
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="productStore.loading && productStore.products.length === 0" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
        <p class="mt-4 font-medium" style="color: #414755;">Loading products...</p>
      </div>

      <!-- Empty Results -->
      <div
        v-else-if="filteredProducts.length === 0"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color: #c7c6d1;"
      >
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background: #f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color: #717786;">inventory_2</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color: #1a1b1f;">No products found</h2>
        <p class="mb-8 max-w-sm text-sm" style="color: #414755;">
          {{ searchQuery ? 'Try adjusting your search query.' : 'Start registering products for this organization.' }}
        </p>
        <button
          v-if="!searchQuery && canAddProduct"
          @click="openCreateModal"
          class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style="background: #0058bc; color: #ffffff;"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
          Add First Product
        </button>
      </div>

      <!-- Grid View -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardTemplate
          v-for="product in filteredProducts"
          :key="product.id"
        >
          <template #icon>
            <div class="w-12 h-14 rounded-2xl flex items-center justify-center shadow-inner" 
                 style="background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);">
              <span class="material-symbols-outlined text-white text-2xl">package_2</span>
            </div>
          </template>

          <template #header-text>
            <h3 class="text-lg font-extrabold leading-tight" style="color: #1a1b1f;">{{ product.name }}</h3>
            <p class="text-[10px] font-bold uppercase tracking-wider mt-1" style="color: #a0a7b5;">SOFTWARE PRODUCT</p>
          </template>

          <template #header-actions>
            <button v-if="canDeleteProduct" @click.stop="confirmDeleteProduct(product)" class="p-1.5 rounded-full hover:bg-red-50 transition-colors mr-1" style="color: #991b1b;">
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
            <button v-if="canAddProduct" @click.stop="openEditModal(product)" class="p-1.5 rounded-full hover:bg-slate-50 transition-colors" style="color: #717786;">
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </template>

          <template #body>
            <div class="space-y-4 py-2">
              <div class="flex flex-col">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Configuration Items</span>
                
                <!-- SWCI Summary by Type -->
                <div v-if="(product as any).swciSummary?.length > 0" class="flex flex-wrap gap-x-4 gap-y-2">
                  <div 
                    v-for="summary in (product as any).swciSummary" 
                    :key="summary.name"
                    class="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
                    :title="summary.name"
                  >
                    <span class="text-sm font-black text-slate-900">{{ summary.count }}</span>
                    <span class="material-symbols-outlined text-indigo-500" style="font-size: 16px;">{{ summary.icon }}</span>
                  </div>
                </div>
                
                <div v-else class="flex items-end gap-2">
                  <span class="text-3xl font-black text-slate-900 text-slate-200">0</span>
                  <span class="text-[11px] font-bold text-slate-200 flex items-center mb-1">
                    <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                  </span>
                </div>
              </div>
              
              <p class="text-sm leading-relaxed line-clamp-2 text-slate-500 min-h-[40px]">
                {{ product.description || 'No description provided.' }}
              </p>
            </div>
          </template>

          <template #info>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">IN DEVELOPMENT</span>
            </div>
            <div class="flex items-center gap-1 text-[9px] font-bold text-slate-400">
              <span class="material-symbols-outlined text-[12px]">calendar_today</span>
              {{ formatDate(product.createdAt) }}
            </div>
          </template>

          <template #actions>
            <button 
              class="flex-1 py-3 px-4 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2" 
              style="background: #4338ca; color: #ffffff; box-shadow: 0 4px 12px rgba(67, 56, 202, 0.2);"
            >
              <span class="material-symbols-outlined text-sm">account_tree</span>
              Manage SWCI
            </button>
            <button 
              @click="router.push(`/products/${product.id}/designer`)"
              class="flex-1 py-3 px-4 rounded-2xl text-sm font-bold border transition-all active:scale-95 flex items-center justify-center" 
              style="background: #f1f3f7; color: #4338ca; border-color: transparent;"
            >
              Diagram
            </button>
          </template>
        </CardTemplate>
      </div>

    </div>

    <!-- Product Modal -->
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
            <h2 class="text-2xl font-bold" style="color: #1a1b1f;">{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h2>
            <p class="text-sm mt-1" style="color: #717786;">Fill in the details for the organization's product.</p>
          </div>
          <button
            @click="closeModal"
            class="p-1.5 rounded-full transition-colors hover:bg-gray-100 ml-4 flex-shrink-0"
            style="color: #717786;"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div v-if="productStore.error" class="mb-5 p-3 rounded-xl text-sm font-medium flex items-center gap-2" style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">
          <span class="material-symbols-outlined text-lg">error</span>
          {{ productStore.error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">Product Name <span style="color: #991b1b;">*</span></label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              :class="errors.name ? 'border-red-300 ring-1 ring-red-100' : 'border-[#e3e2e7] focus:ring-2 focus:ring-blue-100'"
              style="background: #f4f3f8; color: #1a1b1f;"
              placeholder="e.g. Customer Portal"
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
              placeholder="Describe what this product does…"
            ></textarea>
            <p v-if="errors.description" class="text-[10px] text-red-600 mt-1 ml-1 font-bold uppercase tracking-wider">{{ errors.description }}</p>
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
            :disabled="productStore.loading || !form.name || !form.description"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            :style="{
              background: '#4338ca',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.30)',
              opacity: productStore.loading || !form.name || !form.description ? 0.5 : 1,
              cursor: productStore.loading || !form.name || !form.description ? 'not-allowed' : 'pointer',
            }"
          >
            <span v-if="productStore.loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
            <span v-else class="material-symbols-outlined text-base">save</span>
            {{ productStore.loading ? 'Saving…' : (isEditing ? 'Save Changes' : 'Save Product') }}
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
        class="rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        style="background: #ffffff;"
      >
        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background: #fef2f2;">
            <span class="material-symbols-outlined text-2xl" style="color: #dc2626;">warning</span>
          </div>
          <div>
            <h2 class="text-xl font-bold" style="color: #1a1b1f;">Delete Product</h2>
            <p class="text-sm mt-1" style="color: #717786;">
              Are you sure you want to delete <strong>{{ productToDelete?.name }}</strong>? 
              This action cannot be undone and will also delete all associated diagrams.
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="showDeleteModal = false; productToDelete = null"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
            style="color: #414755; border: 1px solid #e3e2e7;"
          >
            <span class="material-symbols-outlined text-base">close</span>
            Cancel
          </button>
          <button
            @click="handleDeleteProduct"
            :disabled="productStore.loading"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            :style="{
              background: '#dc2626',
              color: '#ffffff',
              opacity: productStore.loading ? 0.5 : 1,
              cursor: productStore.loading ? 'not-allowed' : 'pointer',
            }"
          >
            <span v-if="productStore.loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
            <span v-else class="material-symbols-outlined text-base">delete</span>
            {{ productStore.loading ? 'Deleting…' : 'Delete Product' }}
          </button>
        </div>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import CardTemplate from '../components/CardTemplate.vue';
import { useProductStore } from '../stores/products';
import { useOrganizationStore } from '../stores/organizations';
import { useAuthStore } from '../stores/auth';
import type { Product } from 'shared-types';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const orgStore = useOrganizationStore();
const authStore = useAuthStore();

const orgId = route.params.id as string;
const searchQuery = ref('');
const showModal = ref(false);
const showDeleteModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const productToDelete = ref<Product | null>(null);

const form = reactive({
  name: '',
  description: ''
});

const errors = reactive({
  name: '',
  description: ''
});

const organization = computed(() => 
  orgStore.organizations.find(o => o.id === orgId)
);

const canAddProduct = computed(() => {
  if (!organization.value) return false;
  
  // RBAC: API Manager or Owner
  const isManager = authStore.user?.role === 'API_MANAGER';
  const isOwner = organization.value.ownerId === authStore.user?.id || 
                  organization.value.owner?.sub === authStore.user?.sub;
  
  return isManager || isOwner;
});

const canDeleteProduct = computed(() => {
  // RBAC: API Designer or API Manager - use auth store's hasRole method
  return authStore.hasRole('API_DESIGNER') || authStore.hasRole('API_MANAGER');
});

const filteredProducts = computed(() => {
  if (!searchQuery.value) return productStore.products;
  const query = searchQuery.value.toLowerCase();
  return productStore.products.filter(p => 
    p.name.toLowerCase().includes(query) || 
    (p.description && p.description.toLowerCase().includes(query))
  );
});

onMounted(async () => {
  if (orgStore.organizations.length === 0) {
    await orgStore.fetchOrganizations();
  }
  await productStore.fetchProducts(orgId);
});

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
  productStore.error = null;
  isEditing.value = false;
  editingId.value = null;
  form.name = '';
  form.description = '';
  showModal.value = true;
};

const openEditModal = (product: Product) => {
  productStore.error = null;
  isEditing.value = true;
  editingId.value = product.id;
  form.name = product.name;
  form.description = product.description || '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  try {
    if (isEditing.value && editingId.value) {
      await productStore.updateProduct(editingId.value, {
        name: form.name,
        description: form.description
      });
    } else {
      await productStore.createProduct(orgId, {
        name: form.name,
        description: form.description
      });
    }
    showModal.value = false;
  } catch {
    // error handled by store
  }
};

const confirmDeleteProduct = (product: Product) => {
  productToDelete.value = product;
  showDeleteModal.value = true;
};

const handleDeleteProduct = async () => {
  if (!productToDelete.value) return;
  
  try {
    await productStore.deleteProduct(productToDelete.value.id);
    showDeleteModal.value = false;
    productToDelete.value = null;
  } catch {
    // error handled by store
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

</script>
