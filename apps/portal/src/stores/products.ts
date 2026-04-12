import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import type { Product, SoftwareConfigurationItem } from 'shared-types';

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([]);
  const swcis = ref<SoftwareConfigurationItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProducts = async (orgId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/organizations/${orgId}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      products.value = await response.json();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const getProduct = async (id: string) => {
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/products/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch product');
      return await response.json();
    } catch (err: any) {
      throw err;
    }
  };

  const createProduct = async (orgId: string, data: { name: string; description: string }) => {
    loading.value = true;
    error.value = null;
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/organizations/${orgId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create product');
      }
      const newProduct = await response.json();
      products.value.push(newProduct);
      return newProduct;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProduct = async (id: string, data: { name?: string; description?: string; diagram?: any }) => {
    loading.value = true;
    error.value = null;
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update product');
      }
      const updatedProduct = await response.json();
      const idx = products.value.findIndex(p => p.id === id);
      if (idx !== -1) {
        products.value[idx] = { ...products.value[idx], ...updatedProduct };
      }
      return updatedProduct;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // SWCI Actions
  const fetchSWCIs = async (orgId: string) => {
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/organizations/${orgId}/swcis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        swcis.value = await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch SWCIs', err);
    }
  };

  const createSWCI = async (orgId: string, data: { name: string; description?: string; type: string }) => {
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/organizations/${orgId}/swcis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create SWCI');
      const newSwci = await response.json();
      swcis.value.push(newSwci);
      return newSwci;
    } catch (err) {
      throw err;
    }
  };

  const updateSWCI = async (id: string, data: { name?: string; description?: string; type?: string }) => {
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/swcis/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update SWCI');
      const updatedSwci = await response.json();
      const idx = swcis.value.findIndex(s => s.id === id);
      if (idx !== -1) {
        swcis.value[idx] = updatedSwci;
      }
      return updatedSwci;
    } catch (err) {
      throw err;
    }
  };

  return {
    products,
    swcis,
    loading,
    error,
    fetchProducts,
    getProduct,
    createProduct,
    updateProduct,
    fetchSWCIs,
    createSWCI,
    updateSWCI
  };
});
