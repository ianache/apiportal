import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export interface DataTransformation {
  id: string;
  name: string;
  description?: string;
  source?: string;
  target?: string;
  code?: string;
  language: string;
  definition?: any;
  organizationId?: string;
  domainId?: string;
}

export const useTransformationsStore = defineStore('transformations', {
  state: () => ({
    transformations: [] as DataTransformation[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchTransformations() {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const env = (window as any).NEXUS_ENV || import.meta.env;
        const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/transformations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch transformations');
        this.transformations = await res.json();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async createTransformation(payload: Partial<DataTransformation>) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const env = (window as any).NEXUS_ENV || import.meta.env;
        const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/transformations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to create transformation');
        }
        const newTransformation = await res.json();
        this.transformations.unshift(newTransformation);
        return newTransformation;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateTransformation(id: string, payload: Partial<DataTransformation>) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const env = (window as any).NEXUS_ENV || import.meta.env;
        const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/transformations/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to update transformation');
        }
        const updated = await res.json();
        const idx = this.transformations.findIndex(t => t.id === id);
        if (idx !== -1) this.transformations[idx] = updated;
        return updated;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteTransformation(id: string) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const env = (window as any).NEXUS_ENV || import.meta.env;
        const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/transformations/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to delete transformation');
        }
        this.transformations = this.transformations.filter(t => t.id !== id);
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
