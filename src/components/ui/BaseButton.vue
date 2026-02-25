<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Base Button — Reusable button component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterLink } from 'vue-router'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  to?: string
  href?: string
  disabled?: boolean
  loading?: boolean
  block?: boolean
  icon?: Component
  iconRight?: Component
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
})

// Base classes
const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2',
    xl: 'px-6 py-3.5 text-base gap-2.5',
  }
  return sizes[props.size]
})

// Variant classes
const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 active:bg-danger-800',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 active:bg-success-800',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 active:bg-warning-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-primary-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
  }
  return variants[props.variant]
})

// Icon size
const iconSize = computed(() => {
  const sizes = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-5 w-5',
  }
  return sizes[props.size]
})

// Combined classes
const classes = computed(() => [
  baseClasses,
  sizeClasses.value,
  variantClasses.value,
  props.block ? 'w-full' : '',
])

// Determine component type
const componentIs = computed(() => {
  if (props.to) return RouterLink
  if (props.href) return 'a'
  return 'button'
})

// Attributes for component
const componentAttrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
  return { type: props.type, disabled: props.disabled || props.loading }
})
</script>

<template>
  <component
    :is="componentIs"
    :class="classes"
    v-bind="componentAttrs"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin"
      :class="iconSize"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>

    <!-- Left icon -->
    <component
      v-else-if="icon"
      :is="icon"
      :class="iconSize"
    />

    <!-- Slot content -->
    <slot />

    <!-- Right icon -->
    <component
      v-if="iconRight && !loading"
      :is="iconRight"
      :class="iconSize"
    />
  </component>
</template>
