<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════
// StockBadge Component — Low stock warning indicators
// ═══════════════════════════════════════════════════════════════════

import { computed } from 'vue'

interface Props {
  quantity: number
  lowStockThreshold?: number
  showQuantity?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  lowStockThreshold: 10,
  showQuantity: true,
  size: 'md',
})

// Stock status
type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock'

const status = computed<StockStatus>(() => {
  if (props.quantity <= 0) return 'out-of-stock'
  if (props.quantity <= props.lowStockThreshold) return 'low-stock'
  return 'in-stock'
})

const config = computed(() => {
  const configs: Record<StockStatus, { label: string; color: string; icon: string }> = {
    'out-of-stock': {
      label: 'Out of Stock',
      color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
      icon: 'x-circle',
    },
    'low-stock': {
      label: 'Low Stock',
      color: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
      icon: 'exclamation',
    },
    'in-stock': {
      label: 'In Stock',
      color: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      icon: 'check',
    },
  }
  return configs[status.value]
})

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2 py-1 text-xs gap-1.5',
  lg: 'px-2.5 py-1.5 text-sm gap-2',
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-medium"
    :class="[sizeClasses[size], config.color]"
  >
    <!-- Icon -->
    <svg
      v-if="config.icon === 'x-circle'"
      :class="iconSizes[size]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <svg
      v-else-if="config.icon === 'exclamation'"
      :class="iconSizes[size]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <svg
      v-else
      :class="iconSizes[size]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>

    <!-- Label -->
    <span>
      {{ showQuantity && quantity > 0 ? `${quantity} ${config.label}` : config.label }}
    </span>
  </span>
</template>
