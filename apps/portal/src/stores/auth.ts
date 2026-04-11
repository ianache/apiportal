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
      const env = (window as any).NEXUS_ENV || import.meta.env;
      this.keycloak = new Keycloak({
        url: env.KEYCLOAK_URL || env.VITE_KEYCLOAK_URL,
        realm: env.KEYCLOAK_REALM || env.VITE_KEYCLOAK_REALM,
        clientId: env.KEYCLOAK_CLIENT_ID || env.VITE_KEYCLOAK_CLIENT_ID
      });
      try {
        this.authenticated = await this.keycloak.init({
          onLoad: 'login-required',
          checkLoginIframe: false,
          pkceMethod: 'S256'
        });
        if (this.authenticated) {
          await this.keycloak.updateToken(-1).catch(() => {});
          this.user = this.keycloak.tokenParsed;
          this.keycloak.onTokenExpired = () => {
            this.logoutAndRedirectToLogin();
          };
        }
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err);
      }
    },

    async logoutAndRedirectToLogin() {
      if (this.keycloak) {
        await this.keycloak.logout({ redirectUri: window.location.origin + '/' });
      }
      this.authenticated = false;
      this.user = null;
    },

    /** Returns a valid (fresh) Bearer token, refreshing if needed. */
    async getToken(): Promise<string> {
      if (!this.keycloak) throw new Error('Keycloak not initialized');
      try {
        await this.keycloak.updateToken(60);
        this.user = this.keycloak.tokenParsed;
      } catch {
        await this.logoutAndRedirectToLogin();
        throw new Error('Session expired. Redirecting to login…');
      }
      return this.keycloak.token!;
    }
  }
});
