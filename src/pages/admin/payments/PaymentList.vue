<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Payment List — Payment transaction management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { paymentService } from '@/services/payment.service'
import { useCurrency, usePagination, useDate, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatCard from '@/components/ui/StatCard.vue'
import type { TableColumn } from '@/types'
import type { PaymentTransaction, PaymentTransactionFilters, PaymentStatistics, TransactionStatus, PaymentGatewayType } from '@/types/payment'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const pagination = usePagination()
const toast = useToast()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Payments', [
    { label: 'Payments' },
  ], 'Manage payment transactions')
  fetchTransactions()
  fetchStatistics()
})

// Data
const transactions = ref<PaymentTransaction[]>([])
const statistics = ref<PaymentStatistics | null>(null)
const isLoading = ref(true)
const isExporting = ref(false)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const gatewayFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially Refunded' },
]

const gatewayOptions = [
  { value: '', label: 'All Gateways' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'sslcommerz', label: 'SSLCommerz' },
  { value: 'cod', label: 'Cash on Delivery' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'transactionId', label: 'Transaction', sortable: true },
  { key: 'order', label: 'Order', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'payment_method', label: 'Gateway', sortable: true, align: 'center' },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'gateway_fee', label: 'Fee', sortable: true, align: 'right' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch transactions
async function fetchTransactions() {
  isLoading.value = true
  try {
    const filters: PaymentTransactionFilters = {
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value || undefined,
      status: (statusFilter.value as TransactionStatus) || undefined,
      payment_method: (gatewayFilter.value as PaymentGatewayType) || undefined,
      from_date: dateFrom.value || undefined,
      to_date: dateTo.value || undefined,
    }
    const response = await paymentService.getTransactions(filters)
    transactions.value = response.transactions || []
    pagination.total.value = response.pagination?.total || 0
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to load transactions'
    toast.error(message)
    transactions.value = []
  } finally {
    isLoading.value = false
  }
}

// Fetch statistics
async function fetchStatistics() {
  try {
    statistics.value = await paymentService.getStatistics({
      from_date: dateFrom.value || undefined,
      to_date: dateTo.value || undefined,
    })
  } catch {
    // Stats are optional, silently fail
  }
}

// Export
async function handleExport() {
  isExporting.value = true
  try {
    const blob = await paymentService.exportTransactions({
      search: searchQuery.value || undefined,
      status: (statusFilter.value as TransactionStatus) || undefined,
      payment_method: (gatewayFilter.value as PaymentGatewayType) || undefined,
      from_date: dateFrom.value || undefined,
      to_date: dateTo.value || undefined,
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Transactions exported successfully')
  } catch {
    toast.error('Failed to export transactions')
  } finally {
    isExporting.value = false
  }
}

// Watch for filter changes
watch([searchQuery, statusFilter, gatewayFilter, dateFrom, dateTo], () => {
  pagination.currentPage.value = 1
  fetchTransactions()
  fetchStatistics()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchTransactions()
})

// Actions
function viewTransaction(transaction: PaymentTransaction) {
  router.push(`/admin/payments/${transaction.id}`)
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary',
    refunded: 'primary',
    partially_refunded: 'primary',
  }
  return variants[status] || 'secondary'
}

// Gateway icon color
function getGatewayColor(gateway: string): string {
  const colors: Record<string, string> = {
    stripe: 'text-indigo-600 dark:text-indigo-400',
    paypal: 'text-blue-600 dark:text-blue-400',
    sslcommerz: 'text-green-600 dark:text-green-400',
    cod: 'text-amber-600 dark:text-amber-400',
  }
  return colors[gateway] || 'text-gray-600'
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

// Computed stats
const totalRevenue = computed(() => statistics.value?.overview?.completed_amount ?? 0)
const totalTransactions = computed(() => statistics.value?.overview?.total_transactions ?? 0)
const successRate = computed(() => statistics.value?.overview?.success_rate ?? 0)
const totalRefunded = computed(() => statistics.value?.overview?.total_refunded ?? 0)
</script>

<template>
  <div class="space-y-6">
    <!-- Statistics Cards -->
    <div class="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        :value="currency.formatCurrency(totalRevenue)"
        :icon="BanknotesIcon"
        color="success"
      />
      <StatCard
        title="Transactions"
        :value="totalTransactions.toLocaleString()"
        :icon="CreditCardIcon"
        color="info"
      />
      <StatCard
        title="Success Rate"
        :value="`${successRate.toFixed(1)}%`"
        :icon="CheckCircleIcon"
        color="primary"
      />
      <StatCard
        title="Total Refunded"
        :value="currency.formatCurrency(totalRefunded)"
        :icon="ArrowPathIcon"
        color="warning"
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
            placeholder="Search by transaction ID, order #..."
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <FormSelect
          v-model="statusFilter"
          name="statusFilter"
          :options="statusOptions"
          class="w-44"
        />

        <FormSelect
          v-model="gatewayFilter"
          name="gatewayFilter"
          :options="gatewayOptions"
          class="w-40"
        />

        <input
          v-model="dateFrom"
          type="date"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="From"
        />
        <input
          v-model="dateTo"
          type="date"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="To"
        />
      </div>

      <BaseButton variant="secondary" size="sm" :loading="isExporting" @click="handleExport">
        <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
        Export
      </BaseButton>
    </div>

    <!-- Transactions table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="transactions"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.total.value"
        @update:currentPage="pagination.currentPage.value = $event"
        @update:perPage="pagination.perPage.value = $event"
      >
        <template #cell-transactionId="{ item }">
          <div>
            <button
              class="font-mono text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              @click="viewTransaction(item)"
            >
              {{ item.transaction_id }}
            </button>
          </div>
        </template>

        <template #cell-order="{ item }">
          <router-link
            v-if="item.order"
            :to="`/admin/orders/${item.order.id}`"
            class="text-sm font-medium text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
          >
            {{ item.order.order_number }}
          </router-link>
          <span v-else class="text-sm text-gray-400">—</span>
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

        <template #cell-payment_method="{ item }">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="getGatewayColor(item.payment_method)"
          >
            <CreditCardIcon class="mr-1 h-3.5 w-3.5" />
            {{ getGatewayLabel(item.payment_method) }}
          </span>
        </template>

        <template #cell-amount="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ currency.format(item.amount) }}
          </span>
        </template>

        <template #cell-gateway_fee="{ item }">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ currency.format(item.gateway_fee) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)" class="capitalize">
            {{ item.status_label || item.status?.replace('_', ' ') }}
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
          <button
            type="button"
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="View transaction"
            @click="viewTransaction(item)"
          >
            <EyeIcon class="h-5 w-5" />
          </button>
        </template>

        <!-- Empty state -->
        <template #empty>
          <EmptyState
            title="No transactions found"
            description="Payment transactions will appear here once orders are placed."
            icon="credit-card"
          />
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
