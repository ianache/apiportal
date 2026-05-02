import { defineStore } from 'pinia';
import Keycloak from 'keycloak-js';

const TOKEN_REFRESH_INTERVAL_MS = 60_000; // Refresh every 60 seconds

export const useAuthStore = defineStore('auth', {
  state: () => ({ 
    user: null as any, 
    keycloak: null as Keycloak | null, 
    authenticated: false,
    _refreshTimer: null as ReturnType<typeof setInterval> | null
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
          checkLoginIframe: false, // Disabled - causes CSP/3rd party cookie issues
          pkceMethod: 'S256'
        });
        if (this.authenticated) {
          await this.keycloak.updateToken(-1).catch(() => {});
          this.user = this.keycloak.tokenParsed;
          this.startRefreshTimer();
          this.keycloak.onTokenExpired = () => {
            this.refreshTokenSilently();
          };
        }
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err);
      }
    },

    startRefreshTimer() {
      this.stopRefreshTimer();
      this._refreshTimer = setInterval(() => {
        this.refreshTokenSilently();
      }, TOKEN_REFRESH_INTERVAL_MS);
    },

    stopRefreshTimer() {
      if (this._refreshTimer) {
        clearInterval(this._refreshTimer);
        this._refreshTimer = null;
      }
    },

    async refreshTokenSilently() {
      if (!this.keycloak || !this.authenticated) return;
      try {
        const refreshed = await this.keycloak.updateToken(300);
        if (refreshed) {
          this.user = this.keycloak.tokenParsed;
        }
      } catch {
        // Token refresh failed, session might be expired
        // Only logout if we're not already logging out
        console.warn('Token refresh failed, session may be expired');
      }
    },

    async logoutAndRedirectToLogin() {
      this.stopRefreshTimer();
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
    },

    hasRole(role: string): boolean {
      if (!this.keycloak || !this.authenticated) return false;
      // Try exact match first
      if (this.keycloak.hasResourceRole(role) || this.keycloak.hasRealmRole(role)) {
        return true;
      }
      // Normalize: convert API_DESIGNER -> API-Designer for Keycloak matching
      const normalizedRole = role.replace(/_/g, '-').replace(/DESIGNER/g, 'Designer').replace(/MANAGER/g, 'Manager').replace(/DEVELOPER/g, 'Developer');
      return this.keycloak.hasResourceRole(normalizedRole) || this.keycloak.hasRealmRole(normalizedRole);
    }
  }
});
