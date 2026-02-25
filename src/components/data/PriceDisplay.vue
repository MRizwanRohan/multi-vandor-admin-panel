<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Price Display — Formatted price with sale price crossout -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '@/composables/useCurrency'

interface Props {
  price: number
  salePrice?: number | null
  currency?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showDiscount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showDiscount: true,
})

const { formatCurrency } = useCurrency()

const formattedPrice = computed(() =>
  formatCurrency(props.price, props.currency)
)

const formattedSalePrice = computed(() =>
  props.salePrice != null ? formatCurrency(props.salePrice, props.currency) : null
)

const hasDiscount = computed(() =>
  props.salePrice != null && props.salePrice < props.price
)

const discountPercent = computed(() => {
  if (!hasDiscount.value || !props.salePrice) return 0
  return Math.round(((props.price - props.salePrice) / props.price) * 100)
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: { main: 'text-sm', strike: 'text-xs', badge: 'text-[10px] px-1 py-0.5' },
    md: { main: 'text-base', strike: 'text-sm', badge: 'text-xs px-1.5 py-0.5' },
    lg: { main: 'text-lg', strike: 'text-sm', badge: 'text-xs px-1.5 py-0.5' },
    xl: { main: 'text-2xl', strike: 'text-base', badge: 'text-sm px-2 py-0.5' },
  }
  return sizes[props.size]
})
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <!-- Sale price (current) -->
    <span
      v-if="hasDiscount"
      :class="[sizeClasses.main, 'font-bold text-danger-600 dark:text-danger-400']"
    >
      {{ formattedSalePrice }}
    </span>

    <!-- Original price (crossed out if on sale) -->
    <span
      :class="[
        hasDiscount ? sizeClasses.strike : sizeClasses.main,
        hasDiscount
          ? 'text-gray-400 line-through dark:text-gray-500'
          : 'font-bold text-gray-900 dark:text-white',
      ]"
    >
      {{ formattedPrice }}
    </span>

    <!-- Discount badge -->
    <span
      v-if="hasDiscount && showDiscount"
      :class="[
        sizeClasses.badge,
        'inline-flex items-center rounded-full bg-danger-100 font-medium text-danger-700 dark:bg-danger-900/50 dark:text-danger-400',
      ]"
    >
      -{{ discountPercent }}%
    </span>
  </div>
</template>
