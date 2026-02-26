<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════
// PriceDisplay Component — Sale/regular price formatting
// ═══════════════════════════════════════════════════════════════════

import { computed } from 'vue'
import { useCurrency } from '@/composables'

interface Props {
  price: number
  salePrice?: number | null
  comparePrice?: number | null
  currency?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  layout?: 'inline' | 'stacked'
  showDiscount?: boolean
  showCurrency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  salePrice: null,
  comparePrice: null,
  currency: 'BDT',
  size: 'md',
  layout: 'inline',
  showDiscount: true,
  showCurrency: true,
})

const { formatCurrency } = useCurrency()

// Computed
const hasDiscount = computed(() => 
  props.salePrice !== null && props.salePrice < props.price
)

const effectivePrice = computed(() =>
  hasDiscount.value ? props.salePrice! : props.price
)

const discountPercent = computed(() => {
  if (!hasDiscount.value) return 0
  return Math.round(((props.price - props.salePrice!) / props.price) * 100)
})

const formattedPrice = computed(() =>
  formatCurrency(effectivePrice.value, { showSymbol: props.showCurrency })
)

const formattedOriginalPrice = computed(() =>
  formatCurrency(props.price, { showSymbol: props.showCurrency })
)

const formattedComparePrice = computed(() =>
  props.comparePrice ? formatCurrency(props.comparePrice, { showSymbol: props.showCurrency }) : null
)

// Size classes
const sizeClasses = {
  sm: {
    price: 'text-sm font-medium',
    original: 'text-xs',
    discount: 'text-xs px-1 py-0.5',
  },
  md: {
    price: 'text-base font-semibold',
    original: 'text-sm',
    discount: 'text-xs px-1.5 py-0.5',
  },
  lg: {
    price: 'text-lg font-bold',
    original: 'text-base',
    discount: 'text-sm px-2 py-1',
  },
  xl: {
    price: 'text-2xl font-bold',
    original: 'text-lg',
    discount: 'text-sm px-2 py-1',
  },
}

const classes = computed(() => sizeClasses[props.size])
</script>

<template>
  <div
    class="price-display"
    :class="[
      layout === 'stacked' ? 'flex flex-col gap-1' : 'flex flex-wrap items-center gap-2'
    ]"
  >
    <!-- Current/Sale Price -->
    <span
      :class="[
        classes.price,
        hasDiscount ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
      ]"
    >
      {{ formattedPrice }}
    </span>

    <!-- Original Price (when on sale) -->
    <span
      v-if="hasDiscount"
      :class="[classes.original, 'text-gray-500 line-through dark:text-gray-400']"
    >
      {{ formattedOriginalPrice }}
    </span>

    <!-- Compare Price -->
    <span
      v-else-if="formattedComparePrice"
      :class="[classes.original, 'text-gray-400 line-through dark:text-gray-500']"
    >
      {{ formattedComparePrice }}
    </span>

    <!-- Discount Badge -->
    <span
      v-if="hasDiscount && showDiscount"
      :class="[
        classes.discount,
        'rounded bg-red-100 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'
      ]"
    >
      -{{ discountPercent }}%
    </span>

    <!-- Slot for additional info -->
    <slot />
  </div>
</template>
