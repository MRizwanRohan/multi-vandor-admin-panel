<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Earnings — Earnings overview with real API data          -->
<!-- Uses /api/v1/vendor/dashboard + /api/v1/vendor/payouts/balance  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency, useDate, useToast, usePagination } from '@/composables'
import api from '@/services/api'
import { payoutService } from '@/services'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Commission, TableColumn } from '@/types'
import {
  CurrencyDollarIcon,
  WalletIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const { formatDateTime } = useDate()
const toast = useToast()
const pagination = usePagination()

// ── Period Filter ────────────────────────────────────────────────

const selectedPeriod = ref('month')
const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
]

// ── Stats Data ───────────────────────────────────────────────────

interface BalanceData {
  available_balance: number
  currency: string
  commission_summary: {
    total_earned: number
    total_paid: number
    pending: number
    available_for_payout: number
  }
}

interface DashboardEarnings {
  total_earned: number
  pending: { count: number; amount: number }
  confirmed: { count: number; amount: number }
  paid: { count: number; amount: number }
  refunded: { count: number; amount: number }
}

const balance = ref<BalanceData | null>(null)
const earnings = ref<DashboardEarnings | null>(null)
const commissionRate = ref<number | null>(null)
const isLoading = ref(true)

// ── Commissions List ─────────────────────────────────────────────

const commissions = ref<Commission[]>([])
const commissionsLoading = ref(false)
const commissionFilter = ref<string>('')

const columns: TableColumn[] = [
  { key: 'created_at', label: 'Date', sortable: true },
  { key: 'order', label: 'Order' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'rate', label: 'Rate', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchEarnings() {
  isLoading.value = true
  try {
    const [balanceRes, dashboardRes] = await Promise.all([
      payoutService.getAvailableBalance(),
      api.get('/vendor/dashboard', { params: { period: selectedPeriod.value } }),
    ])
    balance.value = {
      available_balance: balanceRes.available,
      currency: 'BDT',
      commission_summary: {
        total_earned: 0,
        total_paid: 0,
        pending: balanceRes.pending,
        available_for_payout: balanceRes.available,
      },
    }
    const data = dashboardRes.data.data
    earnings.value = data.earnings
    // Commission rate from vendor settings is in overview
    if (data.overview?.commission_rate !== undefined) {
      commissionRate.value = data.overview.commission_rate
    }
  } catch {
    toast.error('Failed to load earnings data')
  } finally {
    isLoading.value = false
  }
}

async function fetchCommissions() {
  commissionsLoading.value = true
  try {
    const response = await payoutService.getCommissions({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      status: commissionFilter.value || undefined,
    })
    commissions.value = response.data
    if (response.meta) {
      pagination.setMeta(response.meta)
    }
  } catch {
    toast.error('Failed to load commissions')
  } finally {
    commissionsLoading.value = false
  }
}

function onPeriodChange() {
  fetchEarnings()
}

// ── Helpers ──────────────────────────────────────────────────────

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'warning',
    confirmed: 'info',
    paid: 'success',
    refunded: 'danger',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Earnings', [
    { label: 'Earnings' },
  ], 'View your earnings and commission history')
  fetchEarnings()
  fetchCommissions()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Period filter -->
    <div class="flex items-center justify-between">
      <div></div>
      <select
        v-model="selectedPeriod"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        @change="onPeriodChange"
      >
        <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Earned"
        :value="earnings ? currency.formatCurrency(earnings.total_earned) : '—'"
        :icon="CurrencyDollarIcon"
        color="success"
        :loading="isLoading"
      />

      <StatCard
        title="Available for Payout"
        :value="balance ? currency.formatCurrency(balance.commission_summary.available_for_payout) : '—'"
        :icon="WalletIcon"
        color="primary"
        :loading="isLoading"
      />

      <StatCard
        title="Pending"
        :value="earnings ? currency.formatCurrency(earnings.pending.amount) : '—'"
        :icon="ClockIcon"
        color="warning"
        :loading="isLoading"
      />

      <StatCard
        title="Total Paid"
        :value="earnings ? currency.formatCurrency(earnings.paid.amount) : '—'"
        :icon="CheckCircleIcon"
        color="info"
        :loading="isLoading"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Commissions list -->
      <BaseCard padding="none" class="lg:col-span-2">
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Commission History
          </h3>
          <div class="flex items-center gap-2">
            <select
              v-model="commissionFilter"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              @change="fetchCommissions"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
            <BaseButton variant="secondary" size="sm" @click="fetchCommissions">
              <ArrowPathIcon class="h-4 w-4" />
            </BaseButton>
          </div>
        </div>

        <DataTable
          :columns="columns"
          :data="commissions"
          :loading="commissionsLoading"
          row-key="id"
          :current-page="pagination.currentPage.value"
          :per-page="pagination.perPage.value"
          :total="pagination.totalItems.value"
          @update:currentPage="pagination.currentPage.value = $event; fetchCommissions()"
          @update:perPage="pagination.perPage.value = $event; fetchCommissions()"
        >
          <template #cell-created_at="{ row }">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDateTime(row.created_at) }}
            </span>
          </template>

          <template #cell-order="{ row }">
            <RouterLink
              v-if="row.order_id"
              :to="`/vendor/orders/${row.order_id}`"
              class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              #{{ row.order_number || row.order_id }}
            </RouterLink>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #cell-amount="{ row }">
            <span class="font-bold text-success-600 dark:text-success-400">
              {{ currency.formatCurrency(row.amount) }}
            </span>
          </template>

          <template #cell-rate="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ row.rate }}%
            </span>
          </template>

          <template #cell-status="{ row }">
            <BaseBadge :variant="getStatusVariant(row.status)">
              {{ row.status }}
            </BaseBadge>
          </template>

          <template #empty>
            <EmptyState
              title="No commissions"
              description="Commission records will appear here after your sales."
            />
          </template>
        </DataTable>
      </BaseCard>

      <!-- Quick actions -->
      <div class="space-y-6">
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Request Payout
          </h3>
          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Your available balance will be transferred to your bank account.
          </p>
          <div class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <p class="text-sm text-gray-500 dark:text-gray-400">Available for payout</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ balance ? currency.formatCurrency(balance.commission_summary.available_for_payout) : '—' }}
            </p>
          </div>
          <BaseButton variant="primary" block to="/vendor/payouts/request">
            Request Payout
          </BaseButton>
        </BaseCard>

        <!-- Earnings breakdown -->
        <BaseCard v-if="earnings">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Breakdown
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Pending</span>
              <span class="font-medium text-warning-600 dark:text-warning-400">
                {{ currency.formatCurrency(earnings.pending.amount) }}
                <span class="text-xs text-gray-400">({{ earnings.pending.count }})</span>
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Confirmed</span>
              <span class="font-medium text-info-600 dark:text-info-400">
                {{ currency.formatCurrency(earnings.confirmed.amount) }}
                <span class="text-xs text-gray-400">({{ earnings.confirmed.count }})</span>
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Paid</span>
              <span class="font-medium text-success-600 dark:text-success-400">
                {{ currency.formatCurrency(earnings.paid.amount) }}
                <span class="text-xs text-gray-400">({{ earnings.paid.count }})</span>
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Refunded</span>
              <span class="font-medium text-danger-600 dark:text-danger-400">
                {{ currency.formatCurrency(earnings.refunded.amount) }}
                <span class="text-xs text-gray-400">({{ earnings.refunded.count }})</span>
              </span>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
