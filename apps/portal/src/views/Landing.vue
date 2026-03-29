<template>
  <div
    class="min-h-screen flex items-center justify-center p-6"
    style="background: linear-gradient(135deg, #faf9fe 0%, #eeedf3 100%); font-family: 'Inter', sans-serif;"
  >
    <div
      class="w-full max-w-md text-center p-10 rounded-3xl"
      style="background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid #e3e2e7; box-shadow: 0 8px 40px rgba(0,88,188,0.08);"
    >
      <!-- Brand icon -->
      <div
        class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style="background: #0058bc;"
      >
        <span class="material-symbols-outlined text-white" style="font-size: 32px;">hub</span>
      </div>

      <!-- Heading -->
      <h1 class="text-3xl font-bold tracking-tight mb-2" style="color: #1a1b1f;">
        Nexus API Manager
      </h1>
      <p class="text-sm leading-relaxed mb-8" style="color: #717786;">
        The control plane for your API ecosystem.<br />
        Manage, design, and discover APIs with confidence.
      </p>

      <!-- Login CTA -->
      <button
        @click="handleLogin"
        class="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 active:scale-95"
        style="background: #0058bc;"
        :disabled="loading"
      >
        <span v-if="loading" class="material-symbols-outlined animate-spin" style="font-size: 20px;">progress_activity</span>
        <span v-else class="material-symbols-outlined" style="font-size: 20px;">login</span>
        <span>{{ loading ? 'Redirecting...' : 'Sign in to Nexus' }}</span>
      </button>

      <!-- Footer note -->
      <p class="mt-6 text-xs" style="color: #717786;">
        Secured with Keycloak OAuth 2.1 / PKCE
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    await auth.keycloak?.login({ redirectUri: window.location.origin + '/dashboard' });
  } catch {
    loading.value = false;
  }
}
</script>
