<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Refund List — Refund management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { refundService } from '@/services/payment.service'
import { useCurrency, usePagination, useDate, useToast, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatCard from '@/components/ui/StatCard.vue'
import type { TableColumn } from '@/types'
import type { PaymentRefund, RefundFilters, RefundStatistics, RefundStatus, PaymentGatewayType, RefundReasonCategory } from '@/types/payment'
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const pagination = usePagination()
const toast = useToast()
const confirm = useConfirm()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Refunds', [
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Refunds' },
  ], 'Manage refund requests')
  fetchRefunds()
  fetchStatistics()
})

// Data
const refunds = ref<PaymentRefund[]>([])
const statistics = ref<RefundStatistics | null>(null)
const isLoading = ref(true)
const isExporting = ref(false)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const gatewayFilter = ref('')
const reasonFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const gatewayOptions = [
  { value: '', label: 'All Gateways' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'sslcommerz', label: 'SSLCommerz' },
  { value: 'cod', label: 'Cash on Delivery' },
]

const reasonOptions = [
  { value: '', label: 'All Reasons' },
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'defective_product', label: 'Defective Product' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'not_received', label: 'Not Received' },
  { value: 'duplicate_charge', label: 'Duplicate Charge' },
  { value: 'fraudulent', label: 'Fraudulent' },
  { value: 'other', label: 'Other' },
]

// Process modal
const showProcessModal = ref(false)
const selectedRefund = ref<PaymentRefund | null>(null)
const processAction = ref<'approve' | 'reject'>('approve')
const processNotes = ref('')
const isProcessing = ref(false)

// Table columns
const columns: TableColumn[] = [
  { key: 'refundId', label: 'Refund ID', sortable: true },
  { key: 'order', label: 'Order', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'gateway', label: 'Gateway', align: 'center' },
  { key: 'reason', label: 'Reason' },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
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
      search: searchQuery.value || undefined,
      status: (statusFilter.value as RefundStatus) || undefined,
      gateway: (gatewayFilter.value as PaymentGatewayType) || undefined,
      reason_category: (reasonFilter.value as RefundReasonCategory) || undefined,
    }
    const response = await refundService.getAll(filters)
    refunds.value = response.data
    pagination.total.value = response.meta.total
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to load refunds'
    toast.error(message)
    refunds.value = []
  } finally {
    isLoading.value = false
  }
}

// Fetch statistics
async function fetchStatistics() {
  try {
    statistics.value = await refundService.getStatistics()
  } catch {
    // Stats are optional
  }
}

// Export
async function handleExport() {
  isExporting.value = true
  try {
    const blob = await refundService.export({
      search: searchQuery.value || undefined,
      status: (statusFilter.value as RefundStatus) || undefined,
      gateway: (gatewayFilter.value as PaymentGatewayType) || undefined,
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `refunds-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Refunds exported successfully')
  } catch {
    toast.error('Failed to export refunds')
  } finally {
    isExporting.value = false
  }
}

// Watch for filter changes
watch([searchQuery, statusFilter, gatewayFilter, reasonFilter], () => {
  pagination.currentPage.value = 1
  fetchRefunds()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchRefunds()
})

// Open process modal
function openProcessModal(refund: PaymentRefund, action: 'approve' | 'reject') {
  selectedRefund.value = refund
  processAction.value = action
  processNotes.value = ''
  showProcessModal.value = true
}

// Process refund (approve/reject)
async function submitProcess() {
  if (!selectedRefund.value) return

  isProcessing.value = true
  try {
    await refundService.process(
      selectedRefund.value.id,
      processAction.value,
      processNotes.value || undefined
    )
    toast.success(
      processAction.value === 'approve'
        ? 'Refund approved successfully'
        : 'Refund rejected'
    )
    showProcessModal.value = false
    fetchRefunds()
    fetchStatistics()
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to process refund'
    toast.error(message)
  } finally {
    isProcessing.value = false
  }
}

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

function getGatewayLabel(gateway: string): string {
  const labels: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    sslcommerz: 'SSLCommerz',
    cod: 'COD',
  }
  return labels[gateway] || gateway
}

function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    customer_request: 'Customer Request',
    defective_product: 'Defective Product',
    wrong_item: 'Wrong Item',
    not_received: 'Not Received',
    duplicate_charge: 'Duplicate Charge',
    fraudulent: 'Fraudulent',
    other: 'Other',
  }
  return labels[reason] || reason
}

// Computed stats
const pendingCount = computed(() => statistics.value?.pending_count ?? 0)
const pendingAmount = computed(() => statistics.value?.pending_amount ?? 0)
const completedCount = computed(() => statistics.value?.completed_count ?? 0)
const completedAmount = computed(() => statistics.value?.completed_amount ?? 0)
</script>

<template>
  <div class="space-y-6">
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Refunds"
        :value="(statistics?.total_refunds ?? 0).toLocaleString()"
        icon="arrow-path"
        color="blue"
      />
      <StatCard
        title="Total Refunded"
        :value="currency.format(statistics?.total_amount ?? 0)"
        icon="currency-dollar"
        color="amber"
      />
      <StatCard
        title="Pending"
        :value="`${pendingCount} (${currency.format(pendingAmount)})`"
        icon="clock"
        color="yellow"
      />
      <StatCard
        title="Completed"
        :value="`${completedCount} (${currency.format(completedAmount)})`"
        icon="check-circle"
        color="green"
      />
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search refunds..."
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <FormSelect
          v-model="statusFilter"
          name="statusFilter"
          :options="statusOptions"
          class="w-40"
        />

        <FormSelect
          v-model="gatewayFilter"
          name="gatewayFilter"
          :options="gatewayOptions"
          class="w-40"
        />

        <FormSelect
          v-model="reasonFilter"
          name="reasonFilter"
          :options="reasonOptions"
          class="w-44"
        />
      </div>

      <BaseButton variant="secondary" size="sm" :loading="isExporting" @click="handleExport">
        <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
        Export
      </BaseButton>
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
        <template #cell-refundId="{ item }">
          <span class="font-mono text-sm text-gray-900 dark:text-white">
            {{ item.refund_id }}
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

        <template #cell-customer="{ item }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ item.customer?.name || 'Guest' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ item.customer?.email }}
            </p>
          </div>
        </template>

        <template #cell-gateway="{ item }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ getGatewayLabel(item.gateway) }}
          </span>
        </template>

        <template #cell-reason="{ item }">
          <div>
            <p class="text-sm text-gray-900 dark:text-white">
              {{ getReasonLabel(item.reason_category) }}
            </p>
            <p v-if="item.reason" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {{ item.reason }}
            </p>
          </div>
        </template>

        <template #cell-amount="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ currency.format(item.amount) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)" class="capitalize">
            {{ item.status }}
          </BaseBadge>
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
          <div class="flex items-center gap-1">
            <template v-if="item.status === 'pending'">
              <button
                type="button"
                class="rounded p-1 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/30"
                title="Approve"
                @click="openProcessModal(item, 'approve')"
              >
                <CheckCircleIcon class="h-5 w-5" />
              </button>
              <button
                type="button"
                class="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30"
                title="Reject"
                @click="openProcessModal(item, 'reject')"
              >
                <XCircleIcon class="h-5 w-5" />
              </button>
            </template>
            <router-link
              :to="`/admin/payments/${item.transaction_id}`"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View transaction"
            >
              <EyeIcon class="h-5 w-5" />
            </router-link>
          </div>
        </template>

        <!-- Empty state -->
        <template #empty>
          <EmptyState
            title="No refunds found"
            description="Refund requests will appear here when customers request returns."
            icon="arrow-path"
          />
        </template>
      </DataTable>
    </BaseCard>

    <!-- Process Refund Modal -->
    <BaseModal
      :show="showProcessModal"
      :title="processAction === 'approve' ? 'Approve Refund' : 'Reject Refund'"
      @close="showProcessModal = false"
    >
      <div v-if="selectedRefund" class="space-y-4">
        <!-- Refund summary -->
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <dl class="space-y-2">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500 dark:text-gray-400">Refund ID</dt>
              <dd class="text-sm font-mono text-gray-900 dark:text-white">{{ selectedRefund.refund_id }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500 dark:text-gray-400">Order</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRefund.order_number }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500 dark:text-gray-400">Amount</dt>
              <dd class="text-sm font-bold text-gray-900 dark:text-white">{{ currency.format(selectedRefund.amount) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500 dark:text-gray-400">Reason</dt>
              <dd class="text-sm text-gray-900 dark:text-white">{{ getReasonLabel(selectedRefund.reason_category) }}</dd>
            </div>
            <div v-if="selectedRefund.reason">
              <dt class="text-sm text-gray-500 dark:text-gray-400">Details</dt>
              <dd class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ selectedRefund.reason }}</dd>
            </div>
          </dl>
        </div>

        <!-- Warning for approve -->
        <div
          v-if="processAction === 'approve'"
          class="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20"
        >
          <p class="text-sm text-amber-700 dark:text-amber-300">
            Approving this refund will process {{ currency.format(selectedRefund.amount) }} back to the customer via {{ getGatewayLabel(selectedRefund.gateway) }}.
          </p>
        </div>

        <!-- Warning for reject -->
        <div
          v-if="processAction === 'reject'"
          class="rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
        >
          <p class="text-sm text-red-700 dark:text-red-300">
            This will reject the refund request. The customer will be notified.
          </p>
        </div>

        <FormTextarea
          v-model="processNotes"
          name="notes"
          label="Notes (optional)"
          :placeholder="processAction === 'approve' ? 'Add any notes about this refund approval...' : 'Provide a reason for rejecting this refund...'"
          :rows="3"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showProcessModal = false">
            Cancel
          </BaseButton>
          <BaseButton
            :variant="processAction === 'approve' ? 'primary' : 'danger'"
            :loading="isProcessing"
            @click="submitProcess"
          >
            <component :is="processAction === 'approve' ? CheckCircleIcon : XCircleIcon" class="mr-2 h-4 w-4" />
            {{ processAction === 'approve' ? 'Approve Refund' : 'Reject Refund' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
