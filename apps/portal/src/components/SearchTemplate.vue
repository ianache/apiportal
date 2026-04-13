<template>
  <div class="bg-white rounded-2xl border p-6 mb-8" style="border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
    <!-- Search Fields and Button -->
    <div class="flex flex-col md:flex-row gap-6 items-end mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
        <div v-for="field in fields" :key="field.name">
          <label class="block text-xs font-bold uppercase tracking-widest mb-1.5" style="color: #414755;">
            {{ field.label }}
          </label>
          <slot :name="'field-' + field.name" :field="field" :value="localValues[field.name]">
            <template v-if="field.type === 'select'">
              <select
                v-model="localValues[field.name]"
                class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :readonly="field.readonly"
                :required="field.required"
              >
                <option value="">{{ field.placeholder || 'Select...' }}</option>
                <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </template>
            <template v-else>
              <input
                v-model="localValues[field.name]"
                :type="field.type || 'text'"
                class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :readonly="field.readonly"
                :required="field.required"
                @keyup.enter="handleSearch"
              />
            </template>
          </slot>
        </div>
      </div>
      
      <button
        @click="handleSearch"
        class="px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg h-[45px]"
        style="background: #0058bc; color: #ffffff;"
      >
        <span class="material-symbols-outlined" style="font-size: 20px;">search</span>
        Search
      </button>
    </div>

    <!-- Divider -->
    <hr class="border-t mb-4" style="border-color: #f0f0f5;" />

    <!-- Active Filters Display -->
    <div class="flex items-center justify-between min-h-[32px]">
      <div class="flex flex-wrap gap-2 items-center">
        <template v-for="field in fields" :key="'active-' + field.name">
          <div v-if="localValues[field.name]" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all" style="background: #f8f9fc; border-color: #e3e2e7;">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ field.label }}:</span>
            <span class="text-xs font-bold text-slate-700">{{ getDisplayValue(field) }}</span>
            <button @click="clearField(field.name)" class="material-symbols-outlined text-[16px] text-slate-400 hover:text-red-500 transition-colors ml-1">close</button>
          </div>
        </template>
      </div>

      <button
        v-if="hasActiveFilters"
        @click="handleClearAll"
        class="flex items-center gap-1 text-xs font-bold uppercase tracking-widest hover:text-red-600 transition-colors"
        style="color: #a0a7b5;"
      >
        <span class="material-symbols-outlined text-[18px]">close</span>
        Clear All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';

export interface SearchField {
  name: string;
  label: string;
  type?: string;
  value?: any;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  options?: { label: string; value: any }[];
  rules?: any;
  events?: any;
  attributes?: any;
  style?: any;
  class?: any;
  slot?: string;
  scopedSlots?: any;
}

const props = defineProps<{
  fields: SearchField[];
  search: (values: Record<string, any>) => void;
  clear?: () => void;
}>();

const localValues = reactive<Record<string, any>>({});

// Initialize local values
const initLocalValues = () => {
  props.fields.forEach(f => {
    localValues[f.name] = f.value !== undefined ? f.value : '';
  });
};

initLocalValues();

watch(() => props.fields, () => {
  initLocalValues();
}, { deep: true });

const hasActiveFilters = computed(() => {
  return Object.values(localValues).some(v => v !== '' && v !== null && v !== undefined);
});

const getDisplayValue = (field: SearchField) => {
  const val = localValues[field.name];
  if (field.type === 'select' && field.options) {
    const opt = field.options.find(o => o.value === val);
    return opt ? opt.label : val;
  }
  return val;
};

const handleSearch = () => {
  props.search({ ...localValues });
};

const clearField = (name: string) => {
  localValues[name] = '';
  handleSearch();
};

const handleClearAll = () => {
  Object.keys(localValues).forEach(k => {
    localValues[k] = '';
  });
  if (props.clear) {
    props.clear();
  }
  handleSearch();
};
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
}
</style>
