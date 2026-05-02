import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { Subscription } from 'shared-types';

export const useSubscriptionsStore = defineStore('subscriptions', {
  state: () => ({
    subscriptions: [] as Subscription[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchMySubscriptions() {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const env = (window as any).NEXUS_ENV || import.meta.env;
        const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
        
        const res = await fetch(`${bffBase}/subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch subscriptions');
        this.subscriptions = await res.json();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async subscribeToApi(apiId: string) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const env = (window as any).NEXUS_ENV || import.meta.env;
        const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
        
        const res = await fetch(`${bffBase}/subscriptions/${apiId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to subscribe');
        }
        
        const newSub = await res.json();
        this.subscriptions.push(newSub);
        return newSub;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async unsubscribe(subscriptionId: string) {
      this.loading = true;
      this.error = null;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const env = (window as any).NEXUS_ENV || import.meta.env;
        const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
        
        const res = await fetch(`${bffBase}/subscriptions/${subscriptionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to unsubscribe');
        
        this.subscriptions = this.subscriptions.filter(s => s.id !== subscriptionId);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
