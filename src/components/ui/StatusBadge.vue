<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════
// StatusBadge Component — Displays product/order status with colors
// ═══════════════════════════════════════════════════════════════════

import { computed } from 'vue'

type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived'
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'
type BadgeStatus = ProductStatus | OrderStatus | PayoutStatus | string

interface Props {
  status: BadgeStatus
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'soft'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'soft',
  showIcon: false,
})

// Status configuration map
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  // Product statuses
  draft: { label: 'Draft', color: 'gray', icon: 'pencil' },
  pending: { label: 'Pending', color: 'yellow', icon: 'clock' },
  approved: { label: 'Approved', color: 'green', icon: 'check' },
  rejected: { label: 'Rejected', color: 'red', icon: 'x' },
  archived: { label: 'Archived', color: 'gray', icon: 'archive' },

  // Order statuses
  processing: { label: 'Processing', color: 'blue', icon: 'cog' },
  shipped: { label: 'Shipped', color: 'purple', icon: 'truck' },
  delivered: { label: 'Delivered', color: 'green', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: 'red', icon: 'ban' },
  refunded: { label: 'Refunded', color: 'orange', icon: 'receipt-refund' },

  // Payout statuses
  completed: { label: 'Completed', color: 'green', icon: 'check' },
  failed: { label: 'Failed', color: 'red', icon: 'x' },

  // Generic
  active: { label: 'Active', color: 'green', icon: 'check' },
  inactive: { label: 'Inactive', color: 'gray', icon: 'x' },
  enabled: { label: 'Enabled', color: 'green', icon: 'check' },
  disabled: { label: 'Disabled', color: 'gray', icon: 'x' },
}

// Color classes based on variant
const colorClasses: Record<string, Record<string, string>> = {
  solid: {
    gray: 'bg-gray-600 text-white',
    yellow: 'bg-yellow-500 text-white',
    green: 'bg-green-600 text-white',
    red: 'bg-red-600 text-white',
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
    orange: 'bg-orange-500 text-white',
  },
  outline: {
    gray: 'border border-gray-400 text-gray-600 dark:border-gray-600 dark:text-gray-400',
    yellow: 'border border-yellow-500 text-yellow-600 dark:text-yellow-400',
    green: 'border border-green-500 text-green-600 dark:text-green-400',
    red: 'border border-red-500 text-red-600 dark:text-red-400',
    blue: 'border border-blue-500 text-blue-600 dark:text-blue-400',
    purple: 'border border-purple-500 text-purple-600 dark:text-purple-400',
    orange: 'border border-orange-500 text-orange-600 dark:text-orange-400',
  },
  soft: {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

const config = computed(() => {
  const key = props.status.toLowerCase()
  return (
    statusConfig[key] || {
      label: props.status,
      color: 'gray',
      icon: '',
    }
  )
})

const classes = computed(() => {
  const colorClass =
    colorClasses[props.variant][config.value.color] ||
    colorClasses[props.variant].gray
  return [
    'inline-flex items-center gap-1 rounded-full font-medium',
    sizeClasses[props.size],
    colorClass,
  ]
})
</script>

<template>
  <span :class="classes">
    <slot name="icon" v-if="showIcon && config.icon">
      <span class="h-3 w-3" />
    </slot>
    <span>{{ config.label }}</span>
  </span>
</template>
