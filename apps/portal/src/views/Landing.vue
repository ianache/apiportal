<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
      <h1 class="text-4xl font-bold tracking-tight text-slate-900">Nexus API Manager</h1>
      <p class="text-slate-500 mt-4 max-w-sm">
        Connect your services with our high-performance endpoints. 
        Built for speed, scale, and seamless integration.
      </p>
      <button @click="auth.keycloak?.login()" class="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
        Sign in with Keycloak
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore();
</script>
