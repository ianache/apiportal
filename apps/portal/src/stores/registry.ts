import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { API, APIVersion, APIStatus } from 'shared-types';

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
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis`, {
          headers: {
            'Authorization': `Bearer ${auth.keycloak?.token}`
          }
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
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${id}`, {
          headers: {
            'Authorization': `Bearer ${auth.keycloak?.token}`
          }
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
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.keycloak?.token}`
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
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/apis/${apiId}/versions/${version}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.keycloak?.token}`
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
    }
  }
});
