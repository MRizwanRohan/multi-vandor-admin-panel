<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Notification Toggle — Single preference toggle row -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label: string
  description?: string
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <label
    class="flex items-center justify-between gap-4 rounded-lg py-3 transition-opacity"
    :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
  >
    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium text-gray-900 dark:text-white">
        {{ label }}
      </p>
      <p v-if="description" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>
    </div>

    <!-- Toggle Switch -->
    <div class="relative shrink-0">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="sr-only"
        @change="toggle"
      />
      <div
        class="h-6 w-11 rounded-full transition-colors"
        :class="modelValue ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
        @click.prevent="!disabled && emit('update:modelValue', !modelValue)"
      >
        <div
          class="h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
          :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
          style="margin-top: 2px"
        />
      </div>
    </div>
  </label>
</template>
