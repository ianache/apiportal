<template>
  <div
    class="group rounded-2xl border p-6 transition-all duration-200"
    style="background: #ffffff; border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
  >
    <!-- Header -->
    <div class="flex justify-between items-start mb-5">
      <div class="flex-1">
        <slot name="header">
          <h3 class="text-base font-bold mb-1.5" style="color: #1a1b1f;">Card Title</h3>
          <p class="text-sm leading-relaxed line-clamp-2" style="color: #414755;">
            Card description placeholder.
          </p>
        </slot>
      </div>
      <div class="flex flex-col items-end gap-1 ml-4">
        <slot name="header-actions"></slot>
      </div>
    </div>

    <!-- Body -->
    <div class="mb-4">
      <slot name="body"></slot>
    </div>

    <!-- Info Section (labels, tags, etc.) -->
    <div class="mb-4">
      <slot name="info"></slot>
    </div>

    <!-- Footer / Actions -->
    <div class="pt-4 border-t flex items-center justify-between" style="border-color: #e3e2e7;">
      <slot name="footer-left"></slot>
      <div class="flex items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Reusable Card Template
</script>
