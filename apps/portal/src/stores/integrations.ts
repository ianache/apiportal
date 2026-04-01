import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ERROR';

export interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  status: IntegrationStatus;
  icon: string;
  linkedApis: number;
  domainId: string | null;
  domain?: { id: string; name: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

const bff = () => import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authHeaders() {
  const token = await useAuthStore().getToken();
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export const useIntegrationsStore = defineStore('integrations', {
  state: () => ({ integrations: [] as Integration[], loading: false, error: null as string | null }),

  actions: {
    async fetch(filters?: { domainId?: string; status?: string }) {
      this.loading = true; this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters?.domainId) params.set('domainId', filters.domainId);
        if (filters?.status)   params.set('status',   filters.status);
        const url = `${bff()}/integrations${params.size ? '?' + params : ''}`;
        const res = await fetch(url, { headers: await authHeaders() });
        if (!res.ok) throw new Error('Failed to load integrations');
        this.integrations = await res.json();
      } catch (e: any) { this.error = e.message; }
      finally { this.loading = false; }
    },

    async create(payload: Omit<Integration, 'id' | 'domain' | 'createdAt' | 'updatedAt'>) {
      const res = await fetch(`${bff()}/integrations`, {
        method: 'POST', headers: await authHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const created: Integration = await res.json();
      this.integrations.unshift(created);
      return created;
    },

    async update(id: string, patch: Partial<Omit<Integration, 'id' | 'domain' | 'createdAt' | 'updatedAt'>>) {
      const res = await fetch(`${bff()}/integrations/${id}`, {
        method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(patch),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const updated: Integration = await res.json();
      const i = this.integrations.findIndex(x => x.id === id);
      if (i !== -1) this.integrations[i] = updated;
      return updated;
    },

    async remove(id: string) {
      const res = await fetch(`${bff()}/integrations/${id}`, {
        method: 'DELETE', headers: await authHeaders(),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to delete');
      this.integrations = this.integrations.filter(x => x.id !== id);
    },
  },
});
