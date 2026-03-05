<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Analytics — Analytics dashboard page (Dynamic API)         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables'
import { analyticsService } from '@/services'
import type { SalesChartResponse, LowStockAlert } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import { LineChart, BarChart } from '@/components/charts'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

// Backend response interface (matches VendorDashboardService output)
interface DashboardResponse {
  overview: {
    total_revenue: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
    total_orders: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
    total_earnings: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
    pending_payouts: number
    available_balance: number
  }
  orders: { total: number; by_status: Record<string, number>; pending_action: number; average_order_value: number }
  revenue: { daily: { date: string; revenue: number }[]; total: number }
  products: { total: number; total_active: number; total_inactive: number; total_out_of_stock: number }
  earnings: { total: number; pending: number; paid: number }
  recent_orders: any[]
  top_products: { product_id: number; product_name: string; revenue: number; quantity_sold: number }[]
  period: string
  date_range: { start: string; end: string }
}

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const dateRange = ref<'week' | 'month' | 'quarter' | 'year'>('month')

const dashboard = ref<DashboardResponse | null>(null)
const salesChart = ref<SalesChartResponse | null>(null)
const lowStockAlerts = ref<LowStockAlert[]>([])

const dateRangeOptions = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

// Computed stats from API response - properly map backend structure
const stats = computed(() => {
  if (!dashboard.value?.overview) return []
  const ov = dashboard.value.overview
  const ord = dashboard.value.orders
  const prod = dashboard.value.products
  return [
    {
      title: 'Total Revenue',
      value: formatCurrency(ov.total_revenue?.value || 0),
      icon: CurrencyDollarIcon,
      change: Math.abs(ov.total_revenue?.change_percentage || 0),
      trend: ov.total_revenue?.trend === 'up' ? 'up' as const : 'down' as const,
      color: 'primary' as const,
    },
    {
      title: 'Total Orders',
      value: String(ov.total_orders?.value || ord?.total || 0),
      icon: ShoppingCartIcon,
      change: Math.abs(ov.total_orders?.change_percentage || 0),
      trend: ov.total_orders?.trend === 'up' ? 'up' as const : 'down' as const,
      color: 'success' as const,
    },
    {
      title: 'Total Products',
      value: String(prod?.total || prod?.total_active || 0),
      icon: CubeIcon,
      change: 0,
      trend: 'neutral' as const,
      color: 'info' as const,
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(ov.total_earnings?.value || 0),
      icon: BanknotesIcon,
      change: Math.abs(ov.total_earnings?.change_percentage || 0),
      trend: ov.total_earnings?.trend === 'up' ? 'up' as const : 'down' as const,
      color: 'warning' as const,
    },
  ]
})

// Chart data - transform API response to chart format
const revenueChartLabels = computed(() => salesChart.value?.labels || [])
const revenueChartDatasets = computed(() => {
  if (!salesChart.value?.datasets) return []
  const ds = salesChart.value.datasets
  return [
    { label: 'Revenue', data: ds.revenue || [], borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true },
    { label: 'Orders', data: ds.orders || [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: false },
  ]
})

// Fetch data
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const [dashboardRes, chartRes, alertsRes] = await Promise.all([
      analyticsService.getVendorDashboardStats({ period: dateRange.value }),
      analyticsService.getSalesChart({ period: dateRange.value }),
      analyticsService.getLowStockAlerts(5),
    ])
    // Cast to any first since backend structure differs from frontend type
    dashboard.value = dashboardRes as any
    salesChart.value = chartRes
    lowStockAlerts.value = Array.isArray(alertsRes) ? alertsRes : []
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load analytics'
  } finally {
    isLoading.value = false
  }
}

watch(dateRange, fetchData)

onMounted(() => {
  breadcrumbStore.setPageInfo('Analytics', [{ label: 'Analytics' }], 'Track your shop performance')
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error Banner -->
    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Header with date range -->
    <div class="flex items-center justify-between">
      <div />
      <FormSelect
        v-model="dateRange"
        name="dateRange"
        :options="dateRangeOptions"
        class="w-40"
      />
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
          :color="stat.color"
        />
      </div>

      <!-- Quick Info Cards -->
      <div class="grid gap-4 sm:grid-cols-3">
        <BaseCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Pending Orders</p>
            <p class="mt-1 text-2xl font-bold text-orange-600">{{ dashboard.orders?.pending_action || 0 }}</p>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
            <p class="mt-1 text-2xl font-bold text-green-600">{{ formatCurrency(dashboard.overview?.available_balance || 0) }}</p>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Pending Payouts</p>
            <p class="mt-1 text-2xl font-bold text-yellow-600">{{ formatCurrency(dashboard.overview?.pending_payouts || 0) }}</p>
          </div>
        </BaseCard>
      </div>

      <!-- Charts -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Revenue chart -->
        <BaseCard title="Sales Trend">
          <LineChart
            :labels="revenueChartLabels"
            :datasets="revenueChartDatasets"
            :height="300"
          />
        </BaseCard>

        <!-- Top products - use dashboard.top_products from backend -->
        <BaseCard title="Top Products">
          <div v-if="dashboard.top_products?.length" class="space-y-4">
            <div
              v-for="(product, index) in dashboard.top_products"
              :key="product.product_id"
              class="flex items-center gap-3"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                :class="[
                  index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                  index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                ]"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ product.product_name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ product.quantity_sold || 0 }} sold</p>
              </div>
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(product.revenue || 0) }}
              </span>
            </div>
          </div>
          <p v-else class="py-8 text-center text-gray-500 dark:text-gray-400">No products yet</p>
        </BaseCard>
      </div>

      <!-- Low Stock Alerts -->
      <BaseCard v-if="lowStockAlerts.length">
        <template #header>
          <div class="flex items-center gap-2">
            <ExclamationTriangleIcon class="h-5 w-5 text-orange-500" />
            <span class="font-semibold text-gray-900 dark:text-white">Low Stock Alerts</span>
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="alert in lowStockAlerts"
            :key="alert.id"
            class="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 p-3 dark:border-orange-900/50 dark:bg-orange-900/20"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ alert.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">SKU: {{ alert.sku }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-orange-600">{{ alert.stock_quantity }}</p>
              <p class="text-xs text-gray-500">Threshold: {{ alert.low_stock_threshold }}</p>
            </div>
          </div>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
