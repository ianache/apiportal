import { defineStore } from 'pinia';
import Keycloak from 'keycloak-js';

export const useAuthStore = defineStore('auth', {
  state: () => ({ 
    user: null as any, 
    keycloak: null as Keycloak | null, 
    authenticated: false 
  }),
  actions: {
    async init() {
      this.keycloak = new Keycloak({
        url: import.meta.env.VITE_KEYCLOAK_URL,
        realm: import.meta.env.VITE_KEYCLOAK_REALM,
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID
      });
      try {
        this.authenticated = await this.keycloak.init({
          onLoad: 'check-sso',
          pkceMethod: 'S256'
        });
        if (this.authenticated) {
          // Eagerly refresh on init — check-sso can restore an already-expired
          // access token without refreshing it. Ignore failures here; getToken()
          // will handle them on first use.
          await this.keycloak.updateToken(-1).catch(() => {});
          this.user = this.keycloak.tokenParsed;
          // Auto-refresh whenever Keycloak fires the expiry event
          this.keycloak.onTokenExpired = () => {
            this.keycloak!.updateToken(60).catch(() => this.keycloak!.login());
          };
        }
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err);
      }
    },

    /** Returns a valid (fresh) Bearer token, refreshing if needed. */
    async getToken(): Promise<string> {
      if (!this.keycloak) throw new Error('Keycloak not initialized');
      try {
        await this.keycloak.updateToken(60);
        this.user = this.keycloak.tokenParsed;
      } catch {
        this.keycloak.login();
        throw new Error('Session expired. Redirecting to login…');
      }
      return this.keycloak.token!;
    }
  }
});
