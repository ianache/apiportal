<template>
  <div class="min-h-screen bg-slate-50">
    <nav class="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
      <div class="flex items-center gap-8">
        <span class="text-xl font-bold tracking-tighter text-slate-900">Nexus API</span>
      </div>
      <div class="flex items-center gap-4">
        <span v-if="auth.user" class="text-sm font-medium text-slate-600">{{ auth.user.name }}</span>
        <div class="h-8 w-8 rounded-full bg-slate-200"></div>
      </div>
    </nav>
    <aside class="h-screen w-64 fixed left-0 top-16 bg-white border-r border-slate-100 flex flex-col py-4">
      <nav class="flex-1 space-y-1">
        <router-link to="/dashboard" class="flex items-center space-x-3 p-3 mx-2 rounded-lg text-slate-600 hover:bg-slate-50">
          <span class="material-symbols-outlined">explore</span>
          <span class="text-sm font-medium">Explorer</span>
        </router-link>
        <router-link to="/projects" class="flex items-center space-x-3 p-3 mx-2 rounded-lg text-slate-600 hover:bg-slate-50">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="text-sm font-medium">Projects</span>
        </router-link>
      </nav>
    </aside>
    <main class="ml-64 pt-20 p-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
const auth = useAuthStore();
</script>
