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

            <!-- Settings Collapsible -->
            <div>
              <button
                @click="settingsOpen = !settingsOpen"
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-slate-500 hover:bg-white/70 hover:text-slate-700"
                :class="{ 'text-slate-700 bg-white/40': settingsOpen || route.path.startsWith('/settings') }"
              >
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined" style="font-size: 19px;">settings</span>
                  Settings
                </div>
                <span
                  class="material-symbols-outlined transition-transform duration-200"
                  style="font-size: 18px;"
                  :class="settingsOpen ? 'rotate-180' : ''"
                >expand_more</span>
              </button>
              <div v-show="settingsOpen" class="mt-1 ml-3 pl-3 border-l-2 border-slate-200/60 space-y-0.5">
                <router-link
                  v-for="sub in settingsNav"
                  :key="sub.path"
                  :to="sub.path"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                  :class="isActive(sub.path)
                    ? 'bg-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'"
                  :style="isActive(sub.path) ? 'color: #0058bc;' : ''"
                >
                  <span class="material-symbols-outlined" style="font-size: 17px;">{{ sub.icon }}</span>
                  {{ sub.label }}
                </router-link>
              </div>
            </div>
          </nav>
        </div>

        <!-- APIs section -->
        <div>
          <p class="px-3 mb-1.5 text-xs font-semibold uppercase tracking-widest" style="color: #a0a7b5;">
            APIs
          </p>
          <nav class="space-y-0.5">
            <router-link
              to="/explorer?favorites=true"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              :class="isActive('/explorer') && route.query.favorites === 'true'
                ? 'bg-white shadow-sm'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'"
              :style="isActive('/explorer') && route.query.favorites === 'true' ? 'color: #0058bc;' : ''"
            >
              <span class="material-symbols-outlined" style="font-size: 19px;">star</span>
              Favorites APIs
            </router-link>

            <router-link
              v-for="api in favoriteApis"
              :key="api.id"
              :to="`/projects/${api.id}`"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 text-slate-500 hover:bg-white/70 hover:text-slate-700"
            >
              <span class="material-symbols-outlined" style="font-size: 16px;">api</span>
              <span class="truncate flex-1">{{ api.name }}</span>
            </router-link>

            <p v-if="favoritesStore.loading && favoriteApis.length === 0" class="px-3 py-2 text-xs" style="color: #a0a7b5;">
              Loading favorites...
            </p>
            <p v-else-if="favoritesStore.favoriteApiIds.length > 0 && favoriteApis.length === 0" class="px-3 py-2 text-xs" style="color: #a0a7b5;">
              No favorites yet
            </p>
          </nav>
        </div>

      </div>

      <!-- Bottom: Create + Sign out -->
      <div class="p-3 border-t" style="border-color: #e3e2e7;">
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
import { computed, ref, watchEffect, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useFavoritesStore } from '../../stores/favorites';
import { useRegistryStore } from '../../stores/registry';

const auth = useAuthStore();
const route = useRoute();
const favoritesStore = useFavoritesStore();
const registryStore = useRegistryStore();

const headerLinks = ['Docs', 'Support', 'Changelog'];

const mainNav = [
  { path: '/explorer',    icon: 'explore',     label: 'Explorer'     },
  { path: '/domains',    icon: 'category',    label: 'Domains'      },
  { path: '/projects',   icon: 'inventory_2', label: 'APIs Catalog' },
  { path: '/integrations', icon: 'hub',        label: 'Integrations' },
];

const settingsNav = [
  { path: '/settings/environments', icon: 'dns',             label: 'Environments' },
  { path: '/settings/node-types',   icon: 'widgets',         label: 'Node Types'   },
  { path: '/settings/preferences',  icon: 'manage_accounts', label: 'Preferences'  },
  { path: '/settings/status',       icon: 'analytics',       label: 'Status'       },
];

const settingsOpen = ref(false);

watchEffect(() => {
  if (route.path.startsWith('/settings')) settingsOpen.value = true;
});

const favoriteApis = computed(() => {
  return registryStore.apis.filter(api => favoritesStore.favoriteApiIds.includes(api.id));
});

onMounted(async () => {
  favoritesStore.initFromStorage();
  if (favoritesStore.favoriteApiIds.length === 0) {
    await favoritesStore.fetchFavorites();
  }
  if (registryStore.apis.length === 0) {
    await registryStore.fetchApis();
  }
});

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
