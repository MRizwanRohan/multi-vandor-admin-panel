<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Platform Summary — Overall marketplace KPIs                     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import type { PlatformSummaryResponse, AnalyticsParams } from '@/types'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  ReceiptRefundIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import type { Component } from 'vue'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

onMounted(() => {
  breadcrumbStore.setPageInfo('Platform Summary', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Analytics' },
    { label: 'Platform Summary' },
  ], 'Key marketplace performance indicators')
})

const isLoading = ref(true)
const error = ref<string | null>(null)
const period = ref('month')
const data = ref<PlatformSummaryResponse | null>(null)

const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
]

async function loadData() {
  isLoading.value = true
  error.value = null
  try {
    const params: AnalyticsParams = { period: period.value as any }
    data.value = await analyticsService.getPlatformSummary(params)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load platform summary'
    console.error('Failed to load platform summary', e)
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadData())
onMounted(() => loadData())

interface MetricCard {
  key: string
  title: string
  icon: Component
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  format: 'currency' | 'number' | 'percent'
}

const metricConfigs: MetricCard[] = [
  { key: 'gmv', title: 'GMV', icon: CurrencyDollarIcon, color: 'success', format: 'currency' },
  { key: 'net_revenue', title: 'Net Revenue', icon: BanknotesIcon, color: 'primary', format: 'currency' },
  { key: 'total_orders', title: 'Total Orders', icon: ShoppingCartIcon, color: 'info', format: 'number' },
  { key: 'average_order_value', title: 'Avg Order Value', icon: ArrowTrendingUpIcon, color: 'warning', format: 'currency' },
  { key: 'active_customers', title: 'Active Customers', icon: UsersIcon, color: 'primary', format: 'number' },
  { key: 'active_vendors', title: 'Active Vendors', icon: BuildingStorefrontIcon, color: 'success', format: 'number' },
  { key: 'conversion_rate', title: 'Conversion Rate', icon: ArrowPathIcon, color: 'info', format: 'percent' },
  { key: 'refund_rate', title: 'Refund Rate', icon: ReceiptRefundIcon, color: 'danger', format: 'percent' },
  { key: 'pending_payouts', title: 'Pending Payouts', icon: ClockIcon, color: 'warning', format: 'currency' },
]

function formatMetricValue(value: number, format: string): string {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'percent') return value.toFixed(2) + '%'
  return value.toLocaleString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
        <p class="text-sm text-danger-700 dark:text-danger-400">{{ error }}</p>
        <button class="ml-auto text-sm font-medium text-danger-600 hover:text-danger-500" @click="loadData">Retry</button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <FormSelect v-model="period" :options="periodOptions" class="w-40" />
    </div>

    <!-- KPI Cards -->
    <div class="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <template v-if="isLoading">
        <StatCard v-for="n in 9" :key="n" title="Loading..." value="—" :loading="true" />
      </template>
      <template v-else-if="data">
        <StatCard
          v-for="mc in metricConfigs"
          :key="mc.key"
          :title="mc.title"
          :value="formatMetricValue((data as any)[mc.key]?.value ?? 0, mc.format)"
          :icon="mc.icon"
          :change="(data as any)[mc.key]?.change_percent"
          change-label="vs prev period"
          :trend="(data as any)[mc.key]?.trend || 'neutral'"
          :color="mc.color"
        />
      </template>
    </div>

    <!-- Info card -->
    <BaseCard>
      <div class="text-center text-gray-500 dark:text-gray-400">
        <p class="text-sm">
          This summary shows the overall health of your marketplace platform.
          All metrics are compared against the previous period.
          Use the period selector above to change the timeframe.
        </p>
      </div>
    </BaseCard>
  </div>
</template>
