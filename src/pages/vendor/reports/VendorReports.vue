<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Reports — Vendor self-service analytics and reports (API) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { analyticsService } from '@/services'
import type { VendorDashboardStats, AnalyticsTopProduct, SalesChartResponse } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const isExporting = ref(false)
const dateRange = ref<'week' | 'month' | 'quarter' | 'year'>('month')

const dashboard = ref<VendorDashboardStats | null>(null)
const chartData = ref<SalesChartResponse | null>(null)
const topProducts = ref<AnalyticsTopProduct[]>([])

const dateRangeOptions = [
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Last 90 Days', value: 'quarter' },
  { label: 'This Year', value: 'year' },
]

// Computed stats
const stats = computed(() => {
  if (!dashboard.value) return []
  const d = dashboard.value
  return [
    { title: 'Total Revenue', value: d.revenue.formatted, icon: CurrencyDollarIcon, change: Math.abs(d.revenue.change), trend: d.revenue.change_type === 'increase' ? 'up' as const : 'down' as const, changeLabel: 'vs last period', color: 'primary' as const },
    { title: 'Total Orders', value: d.orders.formatted, icon: ShoppingCartIcon, change: Math.abs(d.orders.change), trend: d.orders.change_type === 'increase' ? 'up' as const : 'down' as const, changeLabel: 'vs last period', color: 'success' as const },
    { title: 'Total Products', value: d.products.formatted, icon: EyeIcon, change: Math.abs(d.products.change), trend: d.products.change_type === 'increase' ? 'up' as const : 'down' as const, changeLabel: 'vs last period', color: 'info' as const },
    { title: 'Average Rating', value: d.rating.formatted, icon: ArrowTrendingUpIcon, change: Math.abs(d.rating.change), trend: d.rating.change_type === 'increase' ? 'up' as const : 'down' as const, changeLabel: 'vs last period', color: 'warning' as const },
  ]
})

// Chart data
const revenueLabels = computed(() => chartData.value?.labels || [])
const revenueDatasets = computed(() => chartData.value?.datasets || [])

// Top products for bar chart
const topProductLabels = computed(() => topProducts.value.slice(0, 5).map(p => p.name.substring(0, 15)))
const topProductData = computed(() => topProducts.value.slice(0, 5).map(p => p.total_revenue))

// Best sellers table
const sellerColumns = [
  { key: 'rank', label: '#', align: 'center' as const },
  { key: 'name', label: 'Product', sortable: true },
  { key: 'total_sold', label: 'Units Sold', align: 'right' as const, sortable: true },
  { key: 'total_revenue', label: 'Revenue', align: 'right' as const, sortable: true },
  { key: 'average_rating', label: 'Rating', align: 'right' as const },
]

// Fetch data
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const params = { period: dateRange.value }
    const [dashboardRes, chartRes, productsRes] = await Promise.all([
      analyticsService.getVendorDashboardStats(params),
      analyticsService.getSalesChart(params),
      analyticsService.getTopProducts({ ...params, limit: 10 }),
    ])
    dashboard.value = dashboardRes
    chartData.value = chartRes
    topProducts.value = Array.isArray(productsRes) ? productsRes : []
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load reports'
  } finally {
    isLoading.value = false
  }
}

// Export reports
async function handleExport() {
  isExporting.value = true
  try {
    const blob = await analyticsService.exportOrders({ start_date: undefined, end_date: undefined })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-report-${Date.now()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Export failed'
  } finally {
    isExporting.value = false
  }
}

watch(dateRange, fetchData)

onMounted(() => {
  breadcrumbStore.setPageInfo('Reports', [{ label: 'Reports' }], 'Your shop performance analytics and reports')
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error Banner -->
    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Reports</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Your shop performance analytics and detailed reports</p>
      </div>
      <div class="flex items-center gap-3">
        <FormSelect v-model="dateRange" :options="dateRangeOptions" class="w-40" />
        <button
          type="button"
          :disabled="isExporting"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="handleExport"
        >
          <ArrowDownTrayIcon class="h-4 w-4" />
          {{ isExporting ? 'Exporting...' : 'Export' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <template v-else-if="dashboard">
      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          v-for="stat in stats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :change="stat.change"
          :trend="stat.trend"
          :change-label="stat.changeLabel"
          :color="stat.color"
        />
      </div>

      <!-- Revenue Trend -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
        <LineChart
          v-if="revenueLabels.length"
          :labels="revenueLabels"
          :datasets="revenueDatasets"
          :height="300"
          :show-legend="true"
        />
        <p v-else class="py-8 text-center text-gray-500 dark:text-gray-400">No data available</p>
      </BaseCard>

      <!-- Top Products Chart -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Top Products by Revenue</h3>
        <BarChart
          v-if="topProductLabels.length"
          :labels="topProductLabels"
          :datasets="[{ label: 'Revenue', data: topProductData }]"
          :height="280"
          :show-legend="false"
        />
        <p v-else class="py-8 text-center text-gray-500 dark:text-gray-400">No products data</p>
      </BaseCard>

      <!-- Best Sellers -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Best Selling Products</h3>
        <DataTable
          :columns="sellerColumns"
          :data="topProducts"
          :loading="isLoading"
          :total="topProducts.length"
          :current-page="1"
          :per-page="20"
        >
          <template #cell-rank="{ row }">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ topProducts.indexOf(row) + 1 }}
            </span>
          </template>

          <template #cell-name="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
          </template>

          <template #cell-total_sold="{ row }">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ row.total_sold || 0 }}</span>
          </template>

          <template #cell-total_revenue="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.total_revenue) }}</span>
          </template>

          <template #cell-average_rating="{ row }">
            <span class="text-sm font-medium text-warning-600 dark:text-warning-400">
              {{ Number(row.average_rating || 0).toFixed(1) }} ⭐
            </span>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
