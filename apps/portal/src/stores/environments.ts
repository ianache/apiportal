import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { Environment } from 'shared-types';

export const useEnvironmentStore = defineStore('environments', {
  state: () => ({
    environments: [] as Environment[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchEnvironments() {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/environments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch environments');
        this.environments = await res.json();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async createEnvironment(payload: { slug: string; name: string; tags?: string[] }) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/environments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to create environment');
        }
        const newEnv = await res.json();
        this.environments.push(newEnv);
        return newEnv;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateEnvironment(id: string, payload: { name?: string; tags?: string[] }) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/environments/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to update environment');
        }
        const updated = await res.json();
        const idx = this.environments.findIndex(e => e.id === id);
        if (idx !== -1) this.environments[idx] = updated;
        return updated;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteEnvironment(id: string) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/environments/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to delete environment');
        }
        this.environments = this.environments.filter(e => e.id !== id);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
