<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Refund History — Display refund history for an order               -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { orderService } from '@/services'
import { useCurrency, useDate, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import type { OrderRefundHistory, OrderRefundHistoryItem, RefundStatus } from '@/types/payment'
import {
  ArrowPathIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  orderId: number
  onRefundClick?: () => void
}

const props = defineProps<Props>()

const { formatCurrency } = useCurrency()
const { formatDate } = useDate()
const toast = useToast()

// State
const isLoading = ref(true)
const refundHistory = ref<OrderRefundHistory | null>(null)
const error = ref<string | null>(null)

// Computed
const hasRefunds = computed(() => refundHistory.value?.refunds && refundHistory.value.refunds.length > 0)

const refundableAmount = computed(() => {
  if (!refundHistory.value) return 0
  return refundHistory.value.total_amount - refundHistory.value.total_refunded
})

const isFullyRefunded = computed(() => {
  if (!refundHistory.value) return false
  return refundHistory.value.total_refunded >= refundHistory.value.total_amount
})

// Fetch refund history
async function fetchRefundHistory() {
  isLoading.value = true
  error.value = null
  try {
    refundHistory.value = await orderService.getRefundHistory(props.orderId)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load refund history'
    // Don't show toast for 404 - means no refunds exist yet
    if (err.response?.status !== 404) {
      toast.error(error.value)
    }
  } finally {
    isLoading.value = false
  }
}

// Status badge variant
function getStatusVariant(status: RefundStatus): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    processing: 'info',
    processed: 'success',
    completed: 'success',
    failed: 'danger',
    rejected: 'danger',
    cancelled: 'secondary',
  }
  return variants[status] || 'secondary'
}

// Expose refresh method
defineExpose({
  refresh: fetchRefundHistory,
})

onMounted(() => {
  fetchRefundHistory()
})
</script>

<template>
  <BaseCard>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Refunds
      </h3>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Refresh"
          @click="fetchRefundHistory"
        >
          <ArrowPathIcon class="h-5 w-5" :class="{ 'animate-spin': isLoading }" />
        </button>
        <BaseButton
          v-if="onRefundClick && !isFullyRefunded"
          variant="primary"
          size="sm"
          @click="onRefundClick"
        >
          <BanknotesIcon class="mr-1 h-4 w-4" />
          Process Refund
        </BaseButton>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <AppSpinner size="md" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-lg bg-danger-50 p-4 dark:bg-danger-900/20">
      <div class="flex items-center gap-3">
        <ExclamationTriangleIcon class="h-5 w-5 text-danger-500" />
        <p class="text-sm text-danger-700 dark:text-danger-300">{{ error }}</p>
      </div>
    </div>

    <!-- Refund summary and list -->
    <div v-else-if="refundHistory" class="space-y-4">
      <!-- Summary -->
      <div class="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Order Total
          </p>
          <p class="mt-1 font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(refundHistory.total_amount) }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Refunded
          </p>
          <p class="mt-1 font-semibold" :class="refundHistory.total_refunded > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-gray-900 dark:text-white'">
            {{ formatCurrency(refundHistory.total_refunded) }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Remaining
          </p>
          <p class="mt-1 font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(refundableAmount) }}
          </p>
        </div>
      </div>

      <!-- Fully refunded badge -->
      <div v-if="isFullyRefunded" class="flex items-center gap-2 rounded-lg bg-danger-50 p-3 dark:bg-danger-900/20">
        <BanknotesIcon class="h-5 w-5 text-danger-500" />
        <p class="text-sm font-medium text-danger-700 dark:text-danger-300">
          This order has been fully refunded
        </p>
      </div>

      <!-- Refund list -->
      <div v-if="hasRefunds" class="space-y-3">
        <div
          v-for="refund in refundHistory.refunds"
          :key="refund.id"
          class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm font-medium text-gray-900 dark:text-white">
                  {{ refund.refund_number }}
                </span>
                <BaseBadge :variant="getStatusVariant(refund.status)" size="sm" class="capitalize">
                  {{ refund.status }}
                </BaseBadge>
              </div>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ refund.reason }}
              </p>
              <p v-if="refund.notes" class="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {{ refund.notes }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-danger-600 dark:text-danger-400">
                -{{ formatCurrency(refund.refund_amount) }}
              </p>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Created {{ formatDate(refund.created_at, 'MMM D, YYYY h:mm A') }}</span>
            <span v-if="refund.processed_by">
              Processed by {{ refund.processed_by.name }}
            </span>
            <span v-if="refund.processed_at">
              on {{ formatDate(refund.processed_at, 'MMM D, YYYY') }}
            </span>
          </div>
        </div>
      </div>

      <!-- No refunds -->
      <div v-else class="py-6 text-center">
        <BanknotesIcon class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No refunds have been processed for this order
        </p>
      </div>
    </div>
  </BaseCard>
</template>
