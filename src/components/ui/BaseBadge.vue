<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Base Badge — Reusable badge/tag component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  removable?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  dot: false,
  removable: false,
  rounded: false,
})

const emit = defineEmits<{
  (e: 'remove'): void
}>()

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }
  return sizes[props.size]
})

// Variant classes
const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300',
    info: 'bg-info-100 text-info-800 dark:bg-info-900/50 dark:text-info-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  }
  return variants[props.variant]
})

// Dot color classes
const dotClasses = computed(() => {
  const dots = {
    primary: 'bg-primary-500',
    secondary: 'bg-gray-500',
    success: 'bg-success-500',
    danger: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: 'bg-info-500',
    gray: 'bg-gray-500',
  }
  return dots[props.variant]
})

const classes = computed(() => [
  'inline-flex items-center font-medium',
  sizeClasses.value,
  variantClasses.value,
  props.rounded ? 'rounded-full' : 'rounded-md',
])
</script>

<template>
  <span :class="classes">
    <!-- Dot indicator -->
    <span
      v-if="dot"
      :class="['mr-1.5 h-1.5 w-1.5 rounded-full', dotClasses]"
    />
    
    <!-- Content -->
    <slot />

    <!-- Remove button -->
    <button
      v-if="removable"
      type="button"
      class="ml-1 -mr-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:bg-gray-500/20 focus:outline-none"
      @click.stop="emit('remove')"
    >
      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </span>
</template>
