<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Sales Report — Revenue over time, top products, category breakdown -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { analyticsService } from '@/services'
import type { SalesAnalyticsResponse, SalesChartResponse, AnalyticsTopProduct, RevenueByCategory, AnalyticsParams } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import DataTable from '@/components/data/DataTable.vue'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const period = ref('month')
const groupBy = ref<'day' | 'week' | 'month'>('day')
const isLoading = ref(true)
const error = ref<string | null>(null)

const salesData = ref<SalesAnalyticsResponse | null>(null)
const chartData = ref<SalesChartResponse | null>(null)
const topProducts = ref<AnalyticsTopProduct[]>([])
const categoryRevenue = ref<RevenueByCategory[]>([])

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
  error.value = null
  try {
    const params: AnalyticsParams = { period: period.value as any, group_by: groupBy.value }
    const [sales, chart, products, categories] = await Promise.allSettled([
      analyticsService.getSalesAnalytics(params),
      analyticsService.getSalesChart(params),
      analyticsService.getTopProducts({ ...params, limit: 10 }),
      analyticsService.getRevenueByCategory(params),
    ])
    salesData.value = sales.status === 'fulfilled' ? sales.value : null
    chartData.value = chart.status === 'fulfilled' ? chart.value : null
    topProducts.value = products.status === 'fulfilled' && Array.isArray(products.value) ? products.value : []
    categoryRevenue.value = categories.status === 'fulfilled' && Array.isArray(categories.value) ? categories.value : []
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load sales report'
    console.error('Failed to load sales report', e)
  } finally {
    isLoading.value = false
  }
}

watch([period, groupBy], () => loadData())
onMounted(() => {
  loadData()
  breadcrumbStore.setPageInfo('Sales Report', [
    { label: 'Reports' },
    { label: 'Sales' },
  ], 'Revenue, orders, and sales analytics')
})

// Stats cards
const stats = computed(() => {
  if (!salesData.value) return []
  const o = salesData.value.overview
  return [
    { title: 'Total Revenue', value: formatCurrency(o.total_revenue), icon: CurrencyDollarIcon, change: o.comparison?.revenue_change, color: 'primary' as const },
    { title: 'Total Orders', value: o.total_orders.toLocaleString(), icon: ShoppingCartIcon, change: o.comparison?.orders_change, color: 'info' as const },
    { title: 'Avg Order Value', value: formatCurrency(o.average_order_value), icon: ArrowTrendingUpIcon, change: o.comparison?.aov_change, color: 'success' as const },
    { title: 'Items Sold', value: o.total_items_sold.toLocaleString(), icon: CubeIcon, color: 'warning' as const },
  ]
})

// Revenue chart
const chartLabels = computed(() => chartData.value?.labels || [])
const chartDatasets = computed(() => {
  if (!chartData.value) return []
  return [
    { label: 'Revenue', data: chartData.value.datasets.revenue, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true },
    { label: 'Orders', data: chartData.value.datasets.orders, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true },
  ]
})

// Category revenue
const catLabels = computed(() => categoryRevenue.value.map(c => c.category_name))
const catRevenueData = computed(() => categoryRevenue.value.map(c => c.revenue))
const catOrdersData = computed(() => categoryRevenue.value.map(c => c.order_count))

// Payment methods
const paymentLabels = computed(() => {
  const pm = salesData.value?.payment_methods
  return Array.isArray(pm) ? pm.map(p => p.method) : []
})
const paymentData = computed(() => {
  const pm = salesData.value?.payment_methods
  return Array.isArray(pm) ? pm.map(p => p.total) : []
})

// Top products table
const productColumns = [
  { key: 'rank', label: '#', align: 'center' as const },
  { key: 'product_name', label: 'Product', sortable: true },
  { key: 'total_sold', label: 'Units Sold', sortable: true, align: 'right' as const },
  { key: 'revenue', label: 'Revenue', sortable: true, align: 'right' as const },
]

async function handleExport() {
  try {
    const blob = await analyticsService.exportOrders({ period: period.value })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${period.value}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (_e) {
    console.error('Export failed', _e)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with filters -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sales Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Comprehensive sales analytics and revenue breakdown</p>
      </div>
      <div class="flex items-center gap-3">
        <FormSelect v-model="period" :options="periodOptions" class="w-40" />
        <FormSelect v-model="groupBy" :options="groupByOptions" class="w-36" />
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="handleExport"
        >
          <ArrowDownTrayIcon class="h-4 w-4" />
          Export
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <div class="flex items-center gap-2">
        <ExclamationCircleIcon class="h-5 w-5 text-danger-500" />
        <p class="text-sm text-danger-700 dark:text-danger-400">{{ error }}</p>
        <button class="ml-auto text-sm font-medium text-danger-600 hover:text-danger-500" @click="loadData">Retry</button>
      </div>
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

    <!-- Revenue Chart -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
      <div v-if="isLoading" class="flex h-72 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <LineChart v-else-if="chartLabels.length" :labels="chartLabels" :datasets="chartDatasets" :height="320" :show-legend="true" />
      <div v-else class="flex h-72 items-center justify-center text-gray-400">No chart data available</div>
    </BaseCard>

    <!-- Charts row -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Orders by Category -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Orders by Category</h3>
        <BarChart
          v-if="!isLoading && catLabels.length"
          :labels="catLabels"
          :datasets="[{ label: 'Orders', data: catOrdersData }]"
          :height="280"
          :show-legend="false"
        />
        <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
      </BaseCard>

      <!-- Payment Methods -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
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

    <!-- Top Products -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Top Selling Products</h3>
      <DataTable
        :columns="productColumns"
        :data="topProducts"
        :loading="isLoading"
        :total="topProducts.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-rank="{ index }">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ index + 1 }}</span>
        </template>

        <template #cell-product_name="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.product_name }}</span>
        </template>

        <template #cell-total_sold="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.total_sold?.toLocaleString() }}</span>
        </template>

        <template #cell-revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue) }}</span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
