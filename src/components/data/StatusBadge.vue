<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Status Badge — Auto-maps status enums to badge variant & color -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '../ui/BaseBadge.vue'

interface Props {
  status: string
  type?: 'order' | 'product' | 'vendor' | 'payment' | 'general'
  dot?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'general',
  dot: true,
  size: 'md',
})

// Status → variant mapping per type
type VariantType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'

const statusMaps: Record<string, Record<string, VariantType>> = {
  order: {
    pending: 'warning',
    processing: 'info',
    confirmed: 'primary',
    shipped: 'info',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'gray',
    returned: 'gray',
    on_hold: 'warning',
  },
  product: {
    active: 'success',
    draft: 'gray',
    inactive: 'danger',
    pending: 'warning',
    archived: 'gray',
    out_of_stock: 'danger',
    low_stock: 'warning',
  },
  vendor: {
    active: 'success',
    pending: 'warning',
    suspended: 'danger',
    rejected: 'danger',
    inactive: 'gray',
    approved: 'success',
  },
  payment: {
    paid: 'success',
    pending: 'warning',
    failed: 'danger',
    refunded: 'info',
    partially_refunded: 'warning',
    unpaid: 'danger',
  },
  general: {
    active: 'success',
    inactive: 'danger',
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger',
    draft: 'gray',
    published: 'success',
    enabled: 'success',
    disabled: 'danger',
  },
}

const variant = computed<VariantType>(() => {
  const map = statusMaps[props.type] || statusMaps.general
  const normalized = props.status.toLowerCase().replace(/[\s-]/g, '_')
  return map[normalized] || 'gray'
})

// Human-readable label
const label = computed(() =>
  props.status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
)
</script>

<template>
  <BaseBadge :variant="variant" :dot="dot" :size="size" rounded>
    {{ label }}
  </BaseBadge>
</template>
