<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Spinner — Standalone loading spinner -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray'
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }
  return sizes[props.size]
})

const colorClasses = computed(() => {
  const colors = {
    primary: 'border-primary-600 dark:border-primary-400',
    white: 'border-white',
    gray: 'border-gray-600 dark:border-gray-300',
  }
  return colors[props.color]
})

const trackClasses = computed(() => {
  const tracks = {
    primary: 'border-gray-200 dark:border-gray-700',
    white: 'border-white/30',
    gray: 'border-gray-200 dark:border-gray-700',
  }
  return tracks[props.color]
})

const labelSize = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }
  return sizes[props.size]
})
</script>

<template>
  <div class="inline-flex flex-col items-center gap-2" role="status">
    <div :class="['relative', sizeClasses]">
      <div
        :class="[
          'absolute inset-0 rounded-full border-4',
          trackClasses,
        ]"
      />
      <div
        :class="[
          'absolute inset-0 animate-spin rounded-full border-4 border-t-transparent',
          colorClasses,
        ]"
      />
    </div>
    <span
      v-if="label"
      :class="['text-gray-600 dark:text-gray-400', labelSize]"
    >
      {{ label }}
    </span>
    <span class="sr-only">{{ label || 'Loading...' }}</span>
  </div>
</template>
