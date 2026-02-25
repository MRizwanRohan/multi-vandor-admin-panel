<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Tabs — Reusable tab navigation component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, type Component } from 'vue'

export interface TabItem {
  key: string
  label: string
  icon?: Component
  badge?: string | number
  disabled?: boolean
}

interface Props {
  tabs: TabItem[]
  modelValue: string
  variant?: 'underline' | 'pills' | 'boxed'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'underline',
  size: 'md',
  fullWidth: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function selectTab(key: string) {
  const tab = props.tabs.find(t => t.key === key)
  if (tab && !tab.disabled) {
    emit('update:modelValue', key)
  }
}

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return sizes[props.size]
})

// Tab classes based on variant
function tabClasses(tab: TabItem) {
  const isActive = tab.key === props.modelValue
  const isDisabled = tab.disabled

  if (isDisabled) {
    return 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-600'
  }

  if (props.variant === 'underline') {
    return isActive
      ? 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
      : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
  }

  if (props.variant === 'pills') {
    return isActive
      ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
  }

  if (props.variant === 'boxed') {
    return isActive
      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
  }

  return ''
}

// Container classes based on variant
const containerClasses = computed(() => {
  if (props.variant === 'underline') {
    return 'flex border-b border-gray-200 dark:border-gray-700'
  }
  if (props.variant === 'pills') {
    return 'flex gap-1'
  }
  if (props.variant === 'boxed') {
    return 'inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800'
  }
  return 'flex'
})
</script>

<template>
  <div :class="containerClasses" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      :aria-selected="tab.key === modelValue"
      :disabled="tab.disabled"
      :class="[
        'inline-flex items-center gap-2 font-medium transition-all duration-200',
        sizeClasses,
        variant === 'pills' ? 'rounded-lg' : '',
        variant === 'boxed' ? 'rounded-md' : '',
        fullWidth ? 'flex-1 justify-center' : '',
        tabClasses(tab),
      ]"
      @click="selectTab(tab.key)"
    >
      <!-- Icon -->
      <component
        v-if="tab.icon"
        :is="tab.icon"
        class="h-4 w-4 shrink-0"
      />

      <!-- Label -->
      <span>{{ tab.label }}</span>

      <!-- Badge -->
      <span
        v-if="tab.badge !== undefined"
        class="ml-1 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400"
      >
        {{ tab.badge }}
      </span>
    </button>
  </div>
</template>
