import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import type { Organization, User } from 'shared-types';

export const useOrganizationStore = defineStore('organizations', () => {
  const organizations = ref<Organization[]>([]);
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchOrganizations = async () => {
    loading.value = true;
    error.value = null;
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/organizations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch organizations');
      organizations.value = await response.json();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createOrganization = async (data: { name: string; description?: string }) => {
    loading.value = true;
    error.value = null;
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create organization');
      }
      const newOrg = await response.json();
      organizations.value.push({ ...newOrg, apiCount: 0 });
      return newOrg;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateOrganization = async (id: string, data: { name?: string; description?: string; ownerId?: string | null }) => {
    loading.value = true;
    error.value = null;
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/organizations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update organization');
      }
      const updatedOrg = await response.json();
      const idx = organizations.value.findIndex(o => o.id === id);
      if (idx !== -1) {
        organizations.value[idx] = { ...organizations.value[idx], ...updatedOrg };
      }
      return updatedOrg;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchUsers = async () => {
    try {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const env = (window as any).NEXUS_ENV || import.meta.env;
      const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${bffBase}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        users.value = await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  return {
    organizations,
    users,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    fetchUsers
  };
});
