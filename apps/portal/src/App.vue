<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h1 class="text-3xl font-bold text-blue-600 mb-4">Hello Nexus</h1>
      <p class="text-gray-600 mb-6">
        Welcome to the Nexus API Manager Portal.
      </p>
      <div class="space-y-4">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Main App Entry
</script>

<style>
@import "tailwindcss";
</style>
