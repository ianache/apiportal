import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { API, APIVersion, APIStatus } from 'shared-types';

export const useRegistryStore = defineStore('registry', {
  state: () => ({
    apis: [] as API[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchApis() {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch APIs');
        this.apis = await res.json();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchApiById(id: string) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch API details');
        return await res.json() as API;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createApi(payload: { name: string, description?: string, initialVersion?: string }) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to create API');
        }
        const newApi = await res.json();
        this.apis.unshift(newApi);
        return newApi;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateVersionStatus(apiId: string, version: string, status: APIStatus) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${apiId}/versions/${version}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to update status');
        }
        // Refresh local list
        await this.fetchApis();
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateApi(id: string, payload: { name?: string; description?: string }) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to update API');
        }
        const updated = await res.json();
        // Update local state
        const idx = this.apis.findIndex(a => a.id === id);
        if (idx !== -1) this.apis[idx] = updated;
        return updated;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createVersion(apiId: string, version: string) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${apiId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ version })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to create version');
        }
        const newVersion = await res.json();
        // Refresh to get updated list
        await this.fetchApis();
        return newVersion;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async registerEndpoint(apiId: string, version: string, payload: { environmentId: string; baseUrl: string }) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${apiId}/versions/${version}/endpoints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to register endpoint');
        }
        return await res.json();
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteEndpoint(apiId: string, version: string, endpointId: string) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${apiId}/versions/${version}/endpoints/${endpointId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to delete endpoint');
        }
        return { success: true };
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
