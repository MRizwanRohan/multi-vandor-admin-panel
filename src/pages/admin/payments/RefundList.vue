<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Refund List — Refund history page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { refundService } from '@/services/payment.service'
import { useCurrency, usePagination, useDate, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import type { TableColumn } from '@/types'
import type { PaymentRefund, RefundFilters, RefundStatus } from '@/types/payment'
import {
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const pagination = usePagination()
const toast = useToast()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Refunds', [
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Refunds' },
  ], 'Refund history')
  fetchRefunds()
})

// Data
const refunds = ref<PaymentRefund[]>([])
const isLoading = ref(true)

// Filters
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'refund_number', label: 'Refund #', sortable: true },
  { key: 'order', label: 'Order', sortable: true },
  { key: 'refund_amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'refund_reason', label: 'Reason' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
  { key: 'processed', label: 'Processed' },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch refunds
async function fetchRefunds() {
  isLoading.value = true
  try {
    const filters: RefundFilters = {
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      status: (statusFilter.value as RefundStatus) || undefined,
    }
    const response = await refundService.getAll(filters)
    refunds.value = response.refunds
    pagination.total.value = response.pagination?.total ?? 0
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to load refunds'
    toast.error(message)
    refunds.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch(statusFilter, () => {
  pagination.currentPage.value = 1
  fetchRefunds()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchRefunds()
})

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary',
  }
  return variants[status] || 'secondary'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <FormSelect
          v-model="statusFilter"
          name="statusFilter"
          :options="statusOptions"
          class="w-40"
        />
      </div>
    </div>

    <!-- Refunds table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="refunds"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.total.value"
        @update:currentPage="pagination.currentPage.value = $event"
        @update:perPage="pagination.perPage.value = $event"
      >
        <template #cell-refund_number="{ item }">
          <span class="font-mono text-sm text-gray-900 dark:text-white">
            {{ item.refund_number }}
          </span>
        </template>

        <template #cell-order="{ item }">
          <router-link
            :to="`/admin/orders/${item.order_id}`"
            class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ item.order_number }}
          </router-link>
        </template>

        <template #cell-refund_amount="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ currency.format(item.refund_amount) }}
          </span>
        </template>

        <template #cell-refund_reason="{ item }">
          <p class="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
            {{ item.refund_reason }}
          </p>
          <p v-if="item.notes" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
            {{ item.notes }}
          </p>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)" class="capitalize">
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-processed="{ item }">
          <template v-if="item.processed_by">
            <p class="text-sm text-gray-900 dark:text-white">{{ item.processed_by }}</p>
            <p v-if="item.processed_at" class="text-xs text-gray-500 dark:text-gray-400">
              {{ date.format(item.processed_at, 'MMM D, YYYY') }}
            </p>
          </template>
          <span v-else class="text-sm text-gray-400">—</span>
        </template>

        <template #cell-date="{ item }">
          <div>
            <p class="text-sm text-gray-900 dark:text-white">
              {{ date.format(item.created_at, 'MMM D, YYYY') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ date.format(item.created_at, 'h:mm A') }}
            </p>
          </div>
        </template>

        <template #cell-actions="{ item }">
          <router-link
            v-if="item.order_id"
            :to="`/admin/orders/${item.order_id}`"
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="View order"
          >
            <EyeIcon class="h-5 w-5" />
          </router-link>
        </template>

        <!-- Empty state -->
        <template #empty>
          <EmptyState
            title="No refunds found"
            description="Refund records will appear here when refunds are processed."
            icon="arrow-path"
          />
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
