<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Order Summary — Order totals and breakdown card -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDetail, Order } from '@/types'
import { useCurrency } from '@/composables'
import { BaseBadge } from '@/components/ui'
import {
  ShoppingBagIcon,
  TruckIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingStorefrontIcon
} from '@heroicons/vue/24/outline'

interface Props {
  order: Order | OrderDetail
  showVendorEarnings?: boolean
  showPaymentInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showVendorEarnings: false,
  showPaymentInfo: true
})

const { formatPrice } = useCurrency()

// Check if we have full details
const hasDetails = computed(() => 'commission_amount' in props.order)

// Payment status config
const paymentStatusConfig: Record<string, { variant: string; label: string }> = {
  pending: { variant: 'warning', label: 'অপেক্ষমান' },
  paid: { variant: 'success', label: 'পরিশোধিত' },
  failed: { variant: 'danger', label: 'ব্যর্থ' },
  refunded: { variant: 'info', label: 'রিফান্ডেড' },
  partially_refunded: { variant: 'warning', label: 'আংশিক রিফান্ড' },
  cancelled: { variant: 'gray', label: 'বাতিল' }
}

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  cod: 'ক্যাশ অন ডেলিভারি',
  bkash: 'বিকাশ',
  nagad: 'নগদ',
  rocket: 'রকেট',
  card: 'কার্ড',
  bank_transfer: 'ব্যাংক ট্রান্সফার'
}

// Order items count
const itemCount = computed(() => {
  if ('items' in props.order) {
    return props.order.items.reduce((sum, item) => sum + item.quantity, 0)
  }
  return props.order.item_count
})
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <!-- Header -->
    <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
      <h3 class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <ReceiptPercentIcon class="h-5 w-5 text-gray-400" />
        অর্ডার সারাংশ
      </h3>
    </div>

    <!-- Content -->
    <div class="px-6 py-4">
      <!-- Order Info -->
      <div class="mb-4 flex items-center justify-between">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          অর্ডার #{{ order.order_number }}
        </span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ itemCount }} আইটেম
        </span>
      </div>

      <!-- Line Items -->
      <div class="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700">
        <!-- Subtotal -->
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <ShoppingBagIcon class="h-4 w-4" />
            সাবটোটাল
          </span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ formatPrice(order.subtotal) }}
          </span>
        </div>

        <!-- Tax -->
        <div v-if="order.tax_amount > 0" class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            ট্যাক্স/ভ্যাট
          </span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            +{{ formatPrice(order.tax_amount) }}
          </span>
        </div>

        <!-- Shipping -->
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <TruckIcon class="h-4 w-4" />
            শিপিং
          </span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ order.shipping_amount > 0 ? formatPrice(order.shipping_amount) : 'ফ্রি' }}
          </span>
        </div>

        <!-- Discount -->
        <div v-if="order.discount_amount > 0" class="flex items-center justify-between">
          <span class="text-sm text-success-600 dark:text-success-400">
            ডিসকাউন্ট
          </span>
          <span class="text-sm font-medium text-success-600 dark:text-success-400">
            -{{ formatPrice(order.discount_amount) }}
          </span>
        </div>
      </div>

      <!-- Total -->
      <div class="flex items-center justify-between py-4">
        <span class="text-base font-semibold text-gray-900 dark:text-white">
          মোট
        </span>
        <span class="text-xl font-bold text-primary-600 dark:text-primary-400">
          {{ formatPrice(order.total_amount) }}
        </span>
      </div>

      <!-- Vendor Earnings (Admin View) -->
      <div
        v-if="showVendorEarnings && hasDetails"
        class="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <ReceiptPercentIcon class="h-4 w-4" />
            কমিশন
          </span>
          <span class="text-sm font-medium text-danger-600">
            -{{ formatPrice((order as OrderDetail).commission_amount) }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <BuildingStorefrontIcon class="h-4 w-4" />
            ভেন্ডর আয়
          </span>
          <span class="text-lg font-bold text-success-600 dark:text-success-400">
            {{ formatPrice((order as OrderDetail).vendor_earning) }}
          </span>
        </div>
      </div>

      <!-- Payment Info -->
      <div
        v-if="showPaymentInfo"
        class="mt-4 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            পেমেন্ট স্ট্যাটাস
          </span>
          <BaseBadge
            :variant="paymentStatusConfig[order.payment_status]?.variant as any || 'gray'"
            size="sm"
          >
            {{ paymentStatusConfig[order.payment_status]?.label || order.payment_status }}
          </BaseBadge>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            পেমেন্ট মেথড
          </span>
          <span class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <CreditCardIcon class="h-4 w-4 text-gray-400" />
            {{ paymentMethodLabels[order.payment_method] || order.payment_method }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
