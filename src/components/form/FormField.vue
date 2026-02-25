<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Field — Wrapper component for label + input + error -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  horizontal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  horizontal: false,
})

const containerClasses = computed(() => {
  if (props.horizontal) {
    return 'sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start'
  }
  return 'space-y-1'
})
</script>

<template>
  <div :class="containerClasses">
    <!-- Label -->
    <label
      v-if="label"
      :class="[
        'block text-sm font-medium text-gray-700 dark:text-gray-300',
        horizontal ? 'sm:pt-2' : ''
      ]"
    >
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Input Slot -->
    <div :class="horizontal ? 'sm:col-span-2' : ''">
      <slot />

      <!-- Hint -->
      <p v-if="hint && !error" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ hint }}
      </p>

      <!-- Error -->
      <div v-if="error" class="mt-1 flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
        <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>
