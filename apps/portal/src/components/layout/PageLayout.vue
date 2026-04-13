<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">
      <!-- Header -->
      <header class="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
        <div>
          <span v-if="subtitle" class="text-xs font-bold tracking-widest uppercase mb-2 block" style="color: #0058bc;">
            {{ subtitle }}
          </span>
          <h1 class="text-4xl font-extrabold tracking-tight" style="color: #1a1b1f;">{{ title }}</h1>
          <p v-if="description" class="mt-2 max-w-md text-sm" style="color: #414755;">
            {{ description }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <slot name="actions"></slot>
        </div>
      </header>

      <!-- Body -->
      <div>
        <slot></slot>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import Shell from './Shell.vue';

defineProps<{
  title: string;
  subtitle?: string;
  description?: string;
}>();
</script>
