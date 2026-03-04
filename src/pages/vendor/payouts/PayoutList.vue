<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Payouts — Payout history and requests page (real API) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { payoutService } from '@/services'
import { useToast, useCurrency, useDate, usePagination } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import StatCard from '@/components/ui/StatCard.vue'
import type { Payout, TableColumn } from '@/types'
import {
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  WalletIcon,
  PlusIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()
const pagination = usePagination()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Payouts', [
    { label: 'Payouts' },
  ], 'View and request payouts')
  fetchBalance()
  fetchPayouts()
})

// Data
const payouts = ref<Payout[]>([])
const isLoading = ref(true)
const statusFilter = ref('')
const balance = ref({ available: 0, pending: 0, minimum: 100 })

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed' },
]

// Stats from real data
const stats = computed(() => [
  {
    title: 'Available Balance',
    value: formatCurrency(balance.value.available),
    icon: WalletIcon,
    color: 'primary' as const,
  },
  {
    title: 'Pending Payout',
    value: formatCurrency(balance.value.pending),
    icon: ClockIcon,
    color: 'warning' as const,
  },
  {
    title: 'Min. Payout',
    value: formatCurrency(balance.value.minimum),
    icon: ExclamationCircleIcon,
    color: 'info' as const,
  },
  {
    title: 'Total Payouts',
    value: String(pagination.totalItems.value),
    icon: CheckCircleIcon,
    color: 'success' as const,
  },
])

// Table columns
const columns: TableColumn[] = [
  { key: 'id', label: 'Payout ID', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'method', label: 'Method' },
  { key: 'requested_at', label: 'Requested', sortable: true },
  { key: 'processed_at', label: 'Processed', sortable: true },
  { key: 'status', label: 'Status' },
]

// Fetch available balance
async function fetchBalance() {
  try {
    balance.value = await payoutService.getAvailableBalance()
  } catch (error) {
    console.error('Failed to fetch balance:', error)
  }
}

// Fetch payouts from API
async function fetchPayouts() {
  isLoading.value = true
  try {
    const response = await payoutService.getAll({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      status: (statusFilter.value || undefined) as any,
    })
    payouts.value = response.data
    if (response.meta) {
      pagination.setMeta(response.meta)
    }
  } catch (error) {
    toast.error('Failed to load payouts')
    payouts.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for filter/pagination changes
watch(statusFilter, () => {
  pagination.currentPage.value = 1
  fetchPayouts()
})
watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchPayouts()
})

// Navigate to request payout page
function goToRequestPayout() {
  router.push('/vendor/payouts/request')
}

// Cancel a pending payout
async function cancelPayout(payout: Payout) {
  if (payout.status !== 'pending') return
  try {
    await payoutService.cancel(payout.id)
    toast.success('Payout request cancelled')
    fetchPayouts()
    fetchBalance()
  } catch (error) {
    toast.error('Failed to cancel payout')
  }
}

// Get status variant
function getStatusVariant(status: string) {
  switch (status) {
    case 'completed': return 'success'
    case 'pending': return 'warning'
    case 'processing': return 'info'
    case 'rejected': return 'danger'
    case 'failed': return 'danger'
    default: return 'secondary'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
      />
    </div>

    <!-- Header actions -->
    <div class="flex items-center justify-between">
      <FormSelect
        v-model="statusFilter"
        name="status"
        :options="statusOptions"
        class="w-44"
      />
      <BaseButton variant="primary" @click="goToRequestPayout">
        <PlusIcon class="mr-2 h-4 w-4" />
        Request Payout
      </BaseButton>
    </div>

    <!-- Payouts table -->
    <BaseCard title="Payout History" padding="none">
      <DataTable
        :columns="columns"
        :data="payouts"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event"
        @update:perPage="pagination.perPage.value = $event"
      >
        <template #cell-id="{ row }">
          <span class="font-mono font-medium text-gray-900 dark:text-white">
            #{{ row.id }}
          </span>
        </template>

        <template #cell-amount="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(row.amount) }}
          </span>
        </template>

        <template #cell-method="{ row }">
          <div>
            <div class="text-gray-900 dark:text-white capitalize">{{ row.method || row.payout_method || '-' }}</div>
            <div v-if="row.bank_account" class="text-sm text-gray-500 dark:text-gray-400">
              {{ row.bank_account.account_number?.slice(-4)?.padStart(8, '•') }}
            </div>
          </div>
        </template>

        <template #cell-requested_at="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(row.requested_at || row.created_at) }}
          </span>
        </template>

        <template #cell-processed_at="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ row.processed_at ? formatDate(row.processed_at) : '-' }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <div class="flex items-center gap-2">
            <BaseBadge :variant="getStatusVariant(row.status)" class="capitalize">
              {{ row.status }}
            </BaseBadge>
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
              @click="cancelPayout(row)"
            >
              Cancel
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <BanknotesIcon class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No payouts yet</h3>
            <p class="mt-2 text-gray-500 dark:text-gray-400">
              Request your first payout when you have available balance.
            </p>
            <BaseButton variant="primary" class="mt-4" @click="goToRequestPayout">
              <PlusIcon class="mr-2 h-4 w-4" />
              Request Payout
            </BaseButton>
          </div>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Info card -->
    <BaseCard>
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <BanknotesIcon class="h-5 w-5" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Payout Information
          </h3>
          <ul class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>• Minimum payout amount: {{ formatCurrency(balance.minimum) }}</li>
            <li>• Payouts are processed within 2-3 business days</li>
            <li>• Bank transfers may take an additional 1-2 days</li>
            <li>• You can cancel pending payouts before they are processed</li>
          </ul>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
