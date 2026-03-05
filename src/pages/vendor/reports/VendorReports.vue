<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Reports — Vendor self-service analytics and reports (API) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { analyticsService } from '@/services'
import type { SalesChartResponse } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

// Match actual backend response
interface DashboardResponse {
  overview: {
    total_revenue: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
    total_orders: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
    total_earnings: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
    pending_payouts: number
    available_balance: number
  }
  orders: { total: number; pending_action: number }
  products: { total: number; total_active: number }
  top_products: { product_id: number; product_name: string; revenue: number; quantity_sold: number }[]
}

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const isExporting = ref(false)
const dateRange = ref<'week' | 'month' | 'quarter' | 'year'>('month')

const dashboard = ref<DashboardResponse | null>(null)
const chartData = ref<SalesChartResponse | null>(null)

const dateRangeOptions = [
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Last 90 Days', value: 'quarter' },
  { label: 'This Year', value: 'year' },
]

// Computed stats - map from actual backend structure
const stats = computed(() => {
  if (!dashboard.value?.overview) return []
  const ov = dashboard.value.overview
  const prod = dashboard.value.products
  return [
    { title: 'Total Revenue', value: formatCurrency(ov.total_revenue?.value || 0), icon: CurrencyDollarIcon, change: Math.abs(ov.total_revenue?.change_percentage || 0), trend: ov.total_revenue?.trend === 'up' ? 'up' as const : 'down' as const, changeLabel: 'vs last period', color: 'primary' as const },
    { title: 'Total Orders', value: String(ov.total_orders?.value || 0), icon: ShoppingCartIcon, change: Math.abs(ov.total_orders?.change_percentage || 0), trend: ov.total_orders?.trend === 'up' ? 'up' as const : 'down' as const, changeLabel: 'vs last period', color: 'success' as const },
    { title: 'Total Products', value: String(prod?.total || prod?.total_active || 0), icon: CubeIcon, change: 0, trend: 'neutral' as const, changeLabel: '', color: 'info' as const },
    { title: 'Total Earnings', value: formatCurrency(ov.total_earnings?.value || 0), icon: BanknotesIcon, change: Math.abs(ov.total_earnings?.change_percentage || 0), trend: ov.total_earnings?.trend === 'up' ? 'up' as const : 'down' as const, changeLabel: 'vs last period', color: 'warning' as const },
  ]
})

// Chart data - transform API response to chart format
const revenueLabels = computed(() => chartData.value?.labels || [])
const revenueDatasets = computed(() => {
  if (!chartData.value?.datasets) return []
  const ds = chartData.value.datasets
  return [
    { label: 'Revenue', data: ds.revenue || [], borderColor: '#6366f1', fill: true },
    { label: 'Orders', data: ds.orders || [], borderColor: '#10b981', fill: false },
  ]
})

// Top products from dashboard response
const topProducts = computed(() => dashboard.value?.top_products || [])
const topProductLabels = computed(() => topProducts.value.slice(0, 5).map(p => (p.product_name || '').substring(0, 15)))
const topProductData = computed(() => topProducts.value.slice(0, 5).map(p => p.revenue || 0))

// Best sellers table
const sellerColumns = [
  { key: 'rank', label: '#', align: 'center' as const },
  { key: 'product_name', label: 'Product', sortable: true },
  { key: 'quantity_sold', label: 'Units Sold', align: 'right' as const, sortable: true },
  { key: 'revenue', label: 'Revenue', align: 'right' as const, sortable: true },
]

// Fetch data
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const params = { period: dateRange.value }
    const [dashboardRes, chartRes] = await Promise.all([
      analyticsService.getVendorDashboardStats(params),
      analyticsService.getSalesChart(params),
    ])
    dashboard.value = dashboardRes as any
    chartData.value = chartRes
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
      <AppSpinner size="lg" />
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

          <template #cell-product_name="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ row.product_name }}</span>
          </template>

          <template #cell-quantity_sold="{ row }">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ row.quantity_sold || 0 }}</span>
          </template>

          <template #cell-revenue="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue || 0) }}</span>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
