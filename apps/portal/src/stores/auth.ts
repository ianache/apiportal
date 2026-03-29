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
          this.user = this.keycloak.tokenParsed;
        }
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err);
      }
    }
  }
});
