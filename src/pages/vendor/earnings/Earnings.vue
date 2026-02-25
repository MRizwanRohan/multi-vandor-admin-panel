<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Earnings — Earnings overview and history page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  CurrencyDollarIcon,
  WalletIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Earnings', [
    { label: 'Earnings' },
  ], 'View your earnings and payout history')
})

// Loading state
const isLoading = ref(false)

// Period filter
const selectedPeriod = ref('this_month')
const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
]

// Stats (mock data)
const stats = ref({
  totalEarnings: 485000,
  availableBalance: 125000,
  pendingBalance: 35000,
  totalWithdrawn: 325000,
  earningsChange: 18.5,
})

// Recent transactions (mock data)
const transactions = ref([
  { id: '1', type: 'earning', description: 'Order #ORD-2024-001', amount: 2700, date: new Date() },
  { id: '2', type: 'earning', description: 'Order #ORD-2024-002', amount: 3150, date: new Date(Date.now() - 86400000) },
  { id: '3', type: 'payout', description: 'Payout to Bank Account', amount: -50000, date: new Date(Date.now() - 172800000) },
  { id: '4', type: 'earning', description: 'Order #ORD-2024-003', amount: 4500, date: new Date(Date.now() - 259200000) },
  { id: '5', type: 'commission', description: 'Platform commission', amount: -300, date: new Date(Date.now() - 345600000) },
])

// Get transaction type badge
function getTransactionVariant(type: string): 'success' | 'danger' | 'warning' {
  const variants: Record<string, 'success' | 'danger' | 'warning'> = {
    earning: 'success',
    payout: 'warning',
    commission: 'danger',
  }
  return variants[type] || 'success'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Period filter -->
    <div class="flex items-center justify-between">
      <div></div>
      <FormSelect
        v-model="selectedPeriod"
        name="period"
        :options="periodOptions"
        class="w-40"
      />
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Earnings"
        :value="currency.formatCurrency(stats.totalEarnings)"
        :icon="CurrencyDollarIcon"
        :change="stats.earningsChange"
        change-label="vs last month"
        trend="up"
        color="success"
        :loading="isLoading"
      />

      <StatCard
        title="Available Balance"
        :value="currency.formatCurrency(stats.availableBalance)"
        :icon="WalletIcon"
        color="primary"
        :loading="isLoading"
      />

      <StatCard
        title="Pending Balance"
        :value="currency.formatCurrency(stats.pendingBalance)"
        :icon="ClockIcon"
        color="warning"
        :loading="isLoading"
      />

      <StatCard
        title="Total Withdrawn"
        :value="currency.formatCurrency(stats.totalWithdrawn)"
        :icon="ArrowTrendingUpIcon"
        color="info"
        :loading="isLoading"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Recent transactions -->
      <BaseCard padding="none" class="lg:col-span-2">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Transactions
          </h3>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="transaction in transactions"
            :key="transaction.id"
            class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full"
                :class="[
                  transaction.amount > 0 
                    ? 'bg-success-100 dark:bg-success-900/50' 
                    : 'bg-danger-100 dark:bg-danger-900/50'
                ]"
              >
                <CurrencyDollarIcon
                  class="h-5 w-5"
                  :class="[
                    transaction.amount > 0 
                      ? 'text-success-600 dark:text-success-400' 
                      : 'text-danger-600 dark:text-danger-400'
                  ]"
                />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ transaction.description }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ date.format(transaction.date, 'MMM D, YYYY') }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p
                class="font-bold"
                :class="[
                  transaction.amount > 0 
                    ? 'text-success-600 dark:text-success-400' 
                    : 'text-danger-600 dark:text-danger-400'
                ]"
              >
                {{ transaction.amount > 0 ? '+' : '' }}{{ currency.formatCurrency(Math.abs(transaction.amount)) }}
              </p>
              <BaseBadge :variant="getTransactionVariant(transaction.type)" size="sm" class="capitalize">
                {{ transaction.type }}
              </BaseBadge>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <RouterLink
            to="/vendor/earnings/history"
            class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all transactions →
          </RouterLink>
        </div>
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
              {{ currency.formatCurrency(stats.availableBalance) }}
            </p>
          </div>
          <BaseButton variant="primary" block to="/vendor/payouts/request">
            Request Payout
          </BaseButton>
        </BaseCard>

        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Commission Rate
          </h3>
          <div class="flex items-center justify-between">
            <span class="text-gray-500 dark:text-gray-400">Platform fee</span>
            <span class="text-2xl font-bold text-gray-900 dark:text-white">10%</span>
          </div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This is the commission rate applied to your sales.
          </p>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
