<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Sales Analytics — Revenue, orders, AOV, payment methods          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import type { SalesAnalyticsResponse, SalesChartResponse, AnalyticsParams } from '@/types'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

onMounted(() => {
  breadcrumbStore.setPageInfo('Sales Analytics', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Analytics' },
    { label: 'Sales' },
  ], 'Revenue, orders and payment analytics')
})

const isLoading = ref(true)
const period = ref('month')
const groupBy = ref<'day' | 'week' | 'month'>('day')

const salesData = ref<SalesAnalyticsResponse | null>(null)
const chartData = ref<SalesChartResponse | null>(null)

const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
]

const groupByOptions = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
]

async function loadData() {
  isLoading.value = true
  try {
    const params: AnalyticsParams = { period: period.value as any, group_by: groupBy.value }
    const [sales, chart] = await Promise.all([
      analyticsService.getSalesAnalytics(params),
      analyticsService.getSalesChart(params),
    ])
    salesData.value = sales
    chartData.value = chart
  } catch (e) {
    console.error('Failed to load sales analytics', e)
  } finally {
    isLoading.value = false
  }
}

watch([period, groupBy], () => loadData())
onMounted(() => loadData())

// Stats cards
const stats = computed(() => {
  if (!salesData.value) return []
  const o = salesData.value.overview
  return [
    { title: 'Total Revenue', value: formatCurrency(o.total_revenue), icon: CurrencyDollarIcon, change: o.comparison?.revenue_change, color: 'success' as const },
    { title: 'Total Orders', value: o.total_orders.toLocaleString(), icon: ShoppingCartIcon, change: o.comparison?.orders_change, color: 'primary' as const },
    { title: 'Avg Order Value', value: formatCurrency(o.average_order_value), icon: ArrowTrendingUpIcon, change: o.comparison?.aov_change, color: 'info' as const },
    { title: 'Items Sold', value: o.total_items_sold.toLocaleString(), icon: CubeIcon, color: 'warning' as const },
  ]
})

// Sales chart
const salesChartLabels = computed(() => chartData.value?.labels || [])
const salesChartDatasets = computed(() => {
  if (!chartData.value) return []
  return [
    { label: 'Revenue', data: chartData.value.datasets.revenue, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true },
    { label: 'Orders', data: chartData.value.datasets.orders, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true },
  ]
})

// Payment methods doughnut (backend may return object instead of array)
const paymentLabels = computed(() => {
  const pm = salesData.value?.payment_methods
  return Array.isArray(pm) ? pm.map(p => p.method) : []
})
const paymentData = computed(() => {
  const pm = salesData.value?.payment_methods
  return Array.isArray(pm) ? pm.map(p => p.total) : []
})

// Revenue by status bar
const statusLabels = computed(() => salesData.value ? Object.keys(salesData.value.revenue_by_status).map(s => s.charAt(0).toUpperCase() + s.slice(1)) : [])
const statusData = computed(() => salesData.value ? Object.values(salesData.value.revenue_by_status) : [])
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <FormSelect v-model="period" :options="periodOptions" class="w-40" />
      <FormSelect v-model="groupBy" :options="groupByOptions" class="w-36" />
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="s in stats"
        :key="s.title"
        :title="s.title"
        :value="s.value"
        :icon="s.icon"
        :change="s.change"
        :trend="s.change !== undefined ? (s.change >= 0 ? 'up' : 'down') : undefined"
        :color="s.color"
        :loading="isLoading"
      />
      <template v-if="isLoading && stats.length === 0">
        <StatCard v-for="n in 4" :key="n" title="Loading..." value="—" :loading="true" />
      </template>
    </div>

    <!-- Chart -->
    <BaseCard>
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Sales Trend</h3>
      </template>
      <div v-if="isLoading" class="flex h-72 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <LineChart v-else-if="salesChartLabels.length" :labels="salesChartLabels" :datasets="salesChartDatasets" :height="300" />
      <div v-else class="flex h-72 items-center justify-center text-gray-400">No data</div>
    </BaseCard>

    <!-- Bottom row -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Revenue by status -->
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Revenue by Status</h3>
        </template>
        <BarChart
          v-if="!isLoading && statusLabels.length"
          :labels="statusLabels"
          :datasets="[{ label: 'Revenue', data: statusData }]"
          :height="280"
        />
        <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
      </BaseCard>

      <!-- Payment methods -->
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
        </template>
        <DoughnutChart
          v-if="!isLoading && paymentLabels.length"
          :labels="paymentLabels"
          :data="paymentData"
          :height="280"
        />
        <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
      </BaseCard>
    </div>
  </div>
</template>
