import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const STORAGE_KEY = 'favorites-api-ids';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favoriteApiIds: [] as string[],
    loading: false,
    initialized: false
  }),

  actions: {
    initFromStorage() {
      if (this.initialized) return;
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.favoriteApiIds = JSON.parse(saved);
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      this.initialized = true;
    },

    saveToStorage() {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.favoriteApiIds));
    },

    async fetchFavorites() {
      this.loading = true;
      try {
        const auth = useAuthStore();
        const token = await auth.getToken();
        const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${bffBase}/favorites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch favorites');
        const data = await res.json();
        const serverFavorites = data.favorites.map((f: { apiId: string }) => f.apiId);
        if (serverFavorites.length > 0 || this.favoriteApiIds.length === 0) {
          this.favoriteApiIds = serverFavorites;
          this.saveToStorage();
        }
      } catch {
      } finally {
        this.loading = false;
      }
    },

    async toggleFavorite(apiId: string) {
      const auth = useAuthStore();
      const token = await auth.getToken();
      const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const isFavorite = this.favoriteApiIds.includes(apiId);

      if (isFavorite) {
        await fetch(`${bffBase}/favorites/${apiId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.favoriteApiIds = this.favoriteApiIds.filter(id => id !== apiId);
      } else {
        await fetch(`${bffBase}/favorites/${apiId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.favoriteApiIds.push(apiId);
      }
      this.saveToStorage();
    },

    isFavorite(apiId: string) {
      return this.favoriteApiIds.includes(apiId);
    }
  }
});
