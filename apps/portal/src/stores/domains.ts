import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export interface Domain {
  id: string;
  name: string;
  title: string;
  description: string;
  labels: string[];
}

const bff = () => import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authHeaders() {
  const token = await useAuthStore().getToken();
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export const useDomainsStore = defineStore('domains', {
  state: () => ({ domains: [] as Domain[], loading: false, error: null as string | null }),

  getters: {
    byId:   (s) => (id: string)   => s.domains.find(d => d.id === id),
    byName: (s) => (name: string) => s.domains.find(d => d.name === name),
  },

  actions: {
    async fetch() {
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`${bff()}/domains`, { headers: await authHeaders() });
        if (!res.ok) throw new Error('Failed to load domains');
        this.domains = await res.json();
      } catch (e: any) { this.error = e.message; }
      finally { this.loading = false; }
    },

    async add(payload: Omit<Domain, 'id'>) {
      const res = await fetch(`${bff()}/domains`, {
        method: 'POST', headers: await authHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const created: Domain = await res.json();
      this.domains.push(created);
      this.domains.sort((a, b) => a.title.localeCompare(b.title));
      return created;
    },

    async update(id: string, patch: Partial<Omit<Domain, 'id'>>) {
      const res = await fetch(`${bff()}/domains/${id}`, {
        method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(patch),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const updated: Domain = await res.json();
      const i = this.domains.findIndex(d => d.id === id);
      if (i !== -1) this.domains[i] = updated;
      return updated;
    },

    async remove(id: string) {
      const res = await fetch(`${bff()}/domains/${id}`, {
        method: 'DELETE', headers: await authHeaders(),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to delete');
      this.domains = this.domains.filter(d => d.id !== id);
    },

    async fetchDomain(id: string) {
      this.loading = true; this.error = null;
      try {
        const res = await fetch(`${bff()}/domains/${id}`, { headers: await authHeaders() });
        if (!res.ok) throw new Error('Failed to load domain');
        const domain: Domain = await res.json();
        const i = this.domains.findIndex(d => d.id === id);
        if (i !== -1) this.domains[i] = domain;
        else this.domains.push(domain);
        return domain;
      } catch (e: any) { this.error = e.message; throw e; }
      finally { this.loading = false; }
    },
  },
});
