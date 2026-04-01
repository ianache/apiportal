import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export interface NodePropDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

export interface NodeTypeCatalogEntry {
  id: string;
  name: string;
  description: string | null;
  properties: NodePropDef[];
  createdAt: string;
  updatedAt: string;
}

const bff = () => import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authHeaders() {
  const token = await useAuthStore().getToken();
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export const useNodeTypeCatalogStore = defineStore('nodeTypeCatalog', {
  state: () => ({
    entries: [] as NodeTypeCatalogEntry[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    byId: (s) => (id: string) => s.entries.find(e => e.id === id),
  },

  actions: {
    async fetch() {
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`${bff()}/node-types`, { headers: await authHeaders() });
        if (!res.ok) throw new Error('Failed to load node types');
        this.entries = await res.json();
      } catch (e: any) { this.error = e.message; }
      finally { this.loading = false; }
    },

    async add(payload: { name: string; description?: string; properties: NodePropDef[] }) {
      const res = await fetch(`${bff()}/node-types`, {
        method: 'POST', headers: await authHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const created: NodeTypeCatalogEntry = await res.json();
      this.entries.push(created);
      this.entries.sort((a, b) => a.name.localeCompare(b.name));
      return created;
    },

    async update(id: string, patch: { description?: string; properties?: NodePropDef[] }) {
      const res = await fetch(`${bff()}/node-types/${id}`, {
        method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(patch),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const updated: NodeTypeCatalogEntry = await res.json();
      const i = this.entries.findIndex(e => e.id === id);
      if (i !== -1) this.entries[i] = updated;
      return updated;
    },

    async remove(id: string) {
      const res = await fetch(`${bff()}/node-types/${id}`, {
        method: 'DELETE', headers: await authHeaders(),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to delete');
      this.entries = this.entries.filter(e => e.id !== id);
    },
  },
});
