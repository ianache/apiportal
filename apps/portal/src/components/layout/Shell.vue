<template>
  <div class="min-h-screen" style="background-color: #faf9fe; font-family: 'Inter', sans-serif;">

    <!-- ── Top Navigation Bar ─────────────────────────────────────────── -->
    <header
      class="fixed top-0 w-full z-50 h-14 flex items-center justify-between px-5"
      style="background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid #e3e2e7;"
    >
      <!-- Left: Brand + nav links -->
      <div class="flex items-center gap-5">
        <span class="text-base font-bold tracking-tight" style="color: #1a1b1f;">Nexus API</span>
        <nav class="hidden md:flex items-center">
          <a
            v-for="link in headerLinks"
            :key="link"
            href="#"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100"
            style="color: #414755;"
          >{{ link }}</a>
        </nav>
      </div>

      <!-- Right: Search + icons + avatar -->
      <div class="flex items-center gap-1">
        <div class="relative hidden md:flex items-center mr-2">
          <span
            class="material-symbols-outlined absolute left-2.5 pointer-events-none"
            style="color: #a0a7b5; font-size: 17px;"
          >search</span>
          <input
            type="text"
            placeholder="Search topics..."
            class="pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none border w-44 transition-[width] focus:w-52"
            style="border-color: #e3e2e7; background: #f4f3f8; color: #1a1b1f;"
          />
        </div>
        <button class="p-1.5 rounded-full transition-colors hover:bg-slate-100" title="Notifications">
          <span class="material-symbols-outlined" style="color: #414755; font-size: 20px;">notifications</span>
        </button>
        <button class="p-1.5 rounded-full transition-colors hover:bg-slate-100" title="Settings">
          <span class="material-symbols-outlined" style="color: #414755; font-size: 20px;">settings</span>
        </button>
        <div class="flex items-center gap-2 ml-2 pl-2 border-l" style="border-color: #e3e2e7;">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold leading-none" style="color: #1a1b1f;">{{ auth.user?.name || 'User' }}</p>
            <p class="text-[10px] font-medium leading-tight mt-0.5" style="color: #0058bc;">{{ roleLabel }}</p>
          </div>
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer select-none shadow-sm transition-transform active:scale-95"
            style="background: #0058bc;"
            :title="auth.user?.name || 'User'"
          >{{ userInitials }}</div>
        </div>
      </div>
    </header>

    <!-- ── Sidebar ────────────────────────────────────────────────────── -->
    <aside
      class="fixed left-0 top-14 bottom-0 w-56 flex flex-col overflow-y-auto"
      style="background: #faf9fe; border-right: 1px solid #e3e2e7;"
    >
      <div class="flex-1 px-2 py-4 space-y-5">

        <!-- Developer Hub section -->
        <div>
          <p class="px-3 mb-1.5 text-xs font-semibold uppercase tracking-widest" style="color: #a0a7b5;">
            Developer Hub
          </p>
          <nav class="space-y-0.5">
            <router-link
              v-for="item in mainNav"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              :class="isActive(item.path)
                ? 'bg-white shadow-sm'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'"
              :style="isActive(item.path) ? 'color: #0058bc;' : ''"
            >
              <span class="material-symbols-outlined" style="font-size: 19px;">{{ item.icon }}</span>
              {{ item.label }}
            </router-link>
          </nav>
        </div>

        <!-- APIs section -->
        <div>
          <p class="px-3 mb-1.5 text-xs font-semibold uppercase tracking-widest" style="color: #a0a7b5;">
            APIs
          </p>
          <nav class="space-y-0.5">
            <a
              v-for="api in apiNav"
              :key="api.label"
              href="#"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/70"
              style="color: #414755;"
            >
              <span
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ background: api.color }"
              ></span>
              {{ api.label }}
            </a>
          </nav>
        </div>

      </div>

      <!-- Bottom: Create + Sign out -->
      <div class="p-3 border-t" style="border-color: #e3e2e7;">
        <button
          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 mb-1"
          style="background: #0058bc;"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
          Create New API
        </button>
        <button
          @click="auth.keycloak?.logout()"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/70"
          style="color: #717786;"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">logout</span>
          Sign out
        </button>
      </div>
    </aside>

    <!-- ── Main Content ───────────────────────────────────────────────── -->
    <main class="ml-56 pt-14 min-h-screen">
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

const headerLinks = ['Docs', 'Support', 'Changelog'];

const mainNav = [
  { path: '/dashboard',    icon: 'explore',     label: 'Explorer'     },
  { path: '/projects',     icon: 'inventory_2', label: 'Projects'     },
  { path: '/analytics',    icon: 'analytics',   label: 'Analytics'    },
  { path: '/integrations', icon: 'hub',         label: 'Integrations' },
  { path: '/settings',     icon: 'settings',    label: 'Settings'     },
];

const apiNav = [
  { label: 'Nexus Core APIs', color: '#0058bc' },
  { label: 'Events',          color: '#006e28' },
  { label: 'Webhooks',        color: '#9e3d00' },
];

const isActive = (path: string) =>
  route.path === path || route.path.startsWith(path + '/');

const userRoles = computed<string[]>(() => {
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'apiportal';
  return (auth.user as any)?.resource_access?.[clientId]?.roles ?? [];
});

const roleLabel = computed(() => {
  if (userRoles.value.includes('API-Manager') || userRoles.value.includes('API-Admin')) return 'API Manager';
  if (userRoles.value.includes('API-Designer')) return 'API Designer';
  if (userRoles.value.includes('API-Developer')) return 'API Developer';
  return 'Guest';
});

const userInitials = computed(() => {
  const name: string = auth.user?.name || auth.user?.preferred_username || '';
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
});
</script>
