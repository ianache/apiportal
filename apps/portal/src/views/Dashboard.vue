<template>
  <Shell>
    <div class="max-w-6xl mx-auto">
      <header class="mb-12">
        <h1 class="text-4xl font-bold tracking-tight text-slate-900">API Explorer</h1>
        <p class="text-slate-500 mt-2">Discover and subscribe to available APIs.</p>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-slate-100 mb-4"></div>
          <h3 class="font-bold">Core API {{ i }}</h3>
          <p class="text-xs text-slate-500 mt-2">High-performance service for core operations.</p>
        </div>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import Shell from '../components/layout/Shell.vue';
</script>
