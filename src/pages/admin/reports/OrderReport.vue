<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Order Report — Order analytics, status distribution, fulfillment -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { analyticsService } from '@/services'
import type { SalesAnalyticsResponse, SalesChartResponse, DashboardResponse, AnalyticsParams } from '@/types'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import {
  ShoppingCartIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
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
const dashboardData = ref<DashboardResponse | null>(null)

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
    const [sales, chart, dashboard] = await Promise.allSettled([
      analyticsService.getSalesAnalytics(params),
      analyticsService.getSalesChart(params),
      analyticsService.getDashboard(period.value as any),
    ])
    salesData.value = sales.status === 'fulfilled' ? sales.value : null
    chartData.value = chart.status === 'fulfilled' ? chart.value : null
    dashboardData.value = dashboard.status === 'fulfilled' ? dashboard.value : null
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load order report'
    console.error('Failed to load order report', e)
  } finally {
    isLoading.value = false
  }
}

watch([period, groupBy], () => loadData())
onMounted(() => {
  loadData()
  breadcrumbStore.setPageInfo('Order Report', [
    { label: 'Reports' },
    { label: 'Orders' },
  ], 'Order analytics, status distribution and fulfillment')
})

// Stats
const stats = computed(() => {
  if (!salesData.value) return []
  const o = salesData.value.overview
  return [
    { title: 'Total Orders', value: o.total_orders.toLocaleString(), icon: ShoppingCartIcon, change: o.comparison?.orders_change, color: 'primary' as const },
    { title: 'Avg Order Value', value: formatCurrency(o.average_order_value), icon: CheckCircleIcon, change: o.comparison?.aov_change, color: 'success' as const },
    { title: 'Items Sold', value: o.total_items_sold.toLocaleString(), icon: TruckIcon, color: 'info' as const },
    { title: 'Revenue', value: formatCurrency(o.total_revenue), icon: ClockIcon, change: o.comparison?.revenue_change, color: 'warning' as const },
  ]
})

// Orders chart
const chartLabels = computed(() => chartData.value?.labels || [])
const chartDatasets = computed(() => {
  if (!chartData.value) return []
  return [
    { label: 'Orders', data: chartData.value.datasets.orders, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true },
  ]
})

// Order status distribution
const statusDist = computed(() => dashboardData.value?.order_status_distribution)
const statusLabels = computed(() => {
  if (!statusDist.value) return []
  return Object.keys(statusDist.value).map(s => s.charAt(0).toUpperCase() + s.slice(1))
})
const statusData = computed(() => {
  if (!statusDist.value) return []
  return Object.values(statusDist.value)
})

// Orders by status bar chart
const ordersByStatus = computed(() => {
  if (!salesData.value?.orders_by_status) return { labels: [] as string[], data: [] as number[] }
  const entries = Object.entries(salesData.value.orders_by_status)
  return {
    labels: entries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
    data: entries.map(([, v]) => v),
  }
})

// Revenue by status bar
const revenueByStatus = computed(() => {
  if (!salesData.value?.revenue_by_status) return { labels: [] as string[], data: [] as number[] }
  const entries = Object.entries(salesData.value.revenue_by_status)
  return {
    labels: entries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
    data: entries.map(([, v]) => v),
  }
})

// Recent orders from dashboard
const recentOrders = computed(() => dashboardData.value?.recent_orders || [])
const orderColumns = [
  { key: 'order_number', label: 'Order #', sortable: true },
  { key: 'customer_name', label: 'Customer' },
  { key: 'vendor_store', label: 'Vendor' },
  { key: 'total_amount', label: 'Amount', align: 'right' as const, sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'payment_status', label: 'Payment' },
  { key: 'created_at', label: 'Date', sortable: true },
]

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    confirmed: 'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-400',
    processing: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delivered: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    completed: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    cancelled: 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
    refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

async function handleExport() {
  try {
    const blob = await analyticsService.exportOrders({ period: period.value })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-report-${period.value}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (_e) {
    console.error('Export failed', _e)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Order Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Order analytics, status distribution and fulfillment metrics</p>
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
    <div class="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

    <!-- Orders Trend Chart -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Orders Trend</h3>
      <div v-if="isLoading" class="flex h-72 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <LineChart v-else-if="chartLabels.length" :labels="chartLabels" :datasets="chartDatasets" :height="320" />
      <div v-else class="flex h-72 items-center justify-center text-gray-400">No chart data available</div>
    </BaseCard>

    <!-- Charts row -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Order Status Distribution -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Status Distribution</h3>
        <DoughnutChart
          v-if="!isLoading && statusLabels.length"
          :labels="statusLabels"
          :data="statusData"
          :height="280"
        />
        <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
      </BaseCard>

      <!-- Revenue by Status -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue by Status</h3>
        <BarChart
          v-if="!isLoading && revenueByStatus.labels.length"
          :labels="revenueByStatus.labels"
          :datasets="[{ label: 'Revenue', data: revenueByStatus.data }]"
          :height="280"
          :show-legend="false"
        />
        <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
      </BaseCard>
    </div>

    <!-- Orders by Status bar chart -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Orders by Status</h3>
      <BarChart
        v-if="!isLoading && ordersByStatus.labels.length"
        :labels="ordersByStatus.labels"
        :datasets="[{ label: 'Orders', data: ordersByStatus.data }]"
        :height="260"
        :show-legend="false"
      />
      <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
    </BaseCard>

    <!-- Recent Orders Table -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
      <DataTable
        :columns="orderColumns"
        :data="recentOrders"
        :loading="isLoading"
        :total="recentOrders.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-order_number="{ row }">
          <router-link
            :to="`/admin/orders/${row.id}`"
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            {{ row.order_number }}
          </router-link>
        </template>

        <template #cell-customer_name="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.customer_name }}</span>
        </template>

        <template #cell-vendor_store="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ row.vendor_store }}</span>
        </template>

        <template #cell-total_amount="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.total_amount) }}</span>
        </template>

        <template #cell-status="{ row }">
          <span
            :class="getStatusColor(row.status?.value || row.status)"
            class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          >
            {{ row.status?.label || row.status }}
          </span>
        </template>

        <template #cell-payment_status="{ row }">
          <span
            :class="row.payment_status === 'paid' ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400'"
            class="text-xs font-medium capitalize"
          >
            {{ row.payment_status }}
          </span>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ new Date(row.created_at).toLocaleDateString() }}</span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
