<template>
  <div class="min-h-screen" style="background-color: #faf9fe; font-family: 'Inter', sans-serif;">

    <!-- Top Navigation Bar -->
    <header
      class="fixed top-0 w-full z-50 h-16 flex items-center justify-between px-6"
      style="background: rgba(255,255,255,0.75); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid #e3e2e7;"
    >
      <!-- Left: Brand -->
      <div class="flex items-center gap-8">
        <span class="text-xl font-bold tracking-tighter" style="color: #1a1b1f;">Nexus API</span>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-full transition-all hover:bg-slate-100"
          title="Notifications"
        >
          <span class="material-symbols-outlined" style="color: #414755; font-size: 22px;">notifications</span>
        </button>
        <button
          class="p-2 rounded-full transition-all hover:bg-slate-100"
          title="Settings"
        >
          <span class="material-symbols-outlined" style="color: #414755; font-size: 22px;">settings</span>
        </button>
        <div class="flex items-center gap-2 pl-2 border-l" style="border-color: #e3e2e7;">
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style="background: #0058bc;"
            :title="auth.user?.name || 'User'"
          >
            {{ userInitials }}
          </div>
          <span class="text-sm font-medium hidden md:block" style="color: #414755;">
            {{ auth.user?.name || auth.user?.preferred_username || 'User' }}
          </span>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-16 bottom-0 w-64 flex flex-col py-4 overflow-y-auto"
      style="background: #f4f3f8; border-right: 1px solid #e3e2e7;"
    >
      <!-- Identity block -->
      <div class="px-6 py-3 mb-2">
        <p class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">
          {{ roleLabel }}
        </p>
      </div>

      <!-- Navigation items -->
      <nav class="px-2 space-y-1 flex-1">
        <router-link
          to="/dashboard"
          class="flex items-center gap-3 p-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5"
          :class="isActive('/dashboard')
            ? 'bg-white shadow-sm'
            : 'text-slate-600 hover:bg-white/60'"
          :style="isActive('/dashboard') ? 'color: #0058bc;' : ''"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">explore</span>
          <span>Explorer</span>
        </router-link>

        <router-link
          to="/projects"
          class="flex items-center gap-3 p-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 text-slate-600 hover:bg-white/60"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">inventory_2</span>
          <span>Projects</span>
        </router-link>

        <router-link
          to="/analytics"
          class="flex items-center gap-3 p-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 text-slate-600 hover:bg-white/60"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">analytics</span>
          <span>Analytics</span>
        </router-link>

        <router-link
          to="/integrations"
          class="flex items-center gap-3 p-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 text-slate-600 hover:bg-white/60"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">hub</span>
          <span>Integrations</span>
        </router-link>
      </nav>

      <!-- Bottom: Logout -->
      <div class="px-4 pt-4 mt-auto border-t" style="border-color: #e3e2e7;">
        <button
          @click="auth.keycloak?.logout()"
          class="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/60 transition-all"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">logout</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="ml-64 pt-20 p-8 min-h-screen">
      <slot />
    </main>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const route = useRoute();

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/');

const userInitials = computed(() => {
  const name: string = auth.user?.name || auth.user?.preferred_username || '';
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
});

const roleLabel = computed(() => {
  const roles: string[] = auth.user?.['resource_access']?.['apiportal']?.roles ?? [];
  if (roles.includes('API-Manager')) return 'API Manager';
  if (roles.includes('API-Designer')) return 'API Designer';
  if (roles.includes('API-Developer')) return 'API Developer';
  return 'Guest';
});
</script>
