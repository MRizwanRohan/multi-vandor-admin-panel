<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Analytics — Analytics dashboard page (Dynamic API)         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables'
import { analyticsService } from '@/services'
import type { VendorDashboardStats, AnalyticsTopProduct, SalesChartResponse, LowStockAlert } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import { LineChart, BarChart } from '@/components/charts'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const dateRange = ref<'week' | 'month' | 'quarter' | 'year'>('month')

const dashboard = ref<VendorDashboardStats | null>(null)
const salesChart = ref<SalesChartResponse | null>(null)
const topProducts = ref<AnalyticsTopProduct[]>([])
const lowStockAlerts = ref<LowStockAlert[]>([])

const dateRangeOptions = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

// Computed stats from API response
const stats = computed(() => {
  if (!dashboard.value) return []
  const d = dashboard.value
  const mapTrend = (ct: string) => ct === 'increase' ? 'up' as const : ct === 'decrease' ? 'down' as const : 'neutral' as const
  return [
    {
      title: 'Total Revenue',
      value: d.revenue?.formatted || '৳0',
      icon: CurrencyDollarIcon,
      change: Math.abs(d.revenue?.change || 0),
      trend: mapTrend(d.revenue?.change_type || 'neutral'),
      color: 'primary' as const,
    },
    {
      title: 'Total Orders',
      value: d.orders?.formatted || '0',
      icon: ShoppingCartIcon,
      change: Math.abs(d.orders?.change || 0),
      trend: mapTrend(d.orders?.change_type || 'neutral'),
      color: 'success' as const,
    },
    {
      title: 'Total Products',
      value: d.products?.formatted || '0',
      icon: CubeIcon,
      change: Math.abs(d.products?.change || 0),
      trend: mapTrend(d.products?.change_type || 'neutral'),
      color: 'info' as const,
    },
    {
      title: 'Average Rating',
      value: d.rating?.formatted || '0',
      icon: StarIcon,
      change: Math.abs(d.rating?.change || 0),
      trend: mapTrend(d.rating?.change_type || 'neutral'),
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
    const [dashboardRes, chartRes, productsRes, alertsRes] = await Promise.all([
      analyticsService.getVendorDashboardStats({ period: dateRange.value }),
      analyticsService.getSalesChart({ period: dateRange.value }),
      analyticsService.getTopProducts({ period: dateRange.value, limit: 5 }),
      analyticsService.getLowStockAlerts(5),
    ])
    dashboard.value = dashboardRes
    salesChart.value = chartRes
    topProducts.value = Array.isArray(productsRes) ? productsRes : []
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
            <p class="mt-1 text-2xl font-bold text-orange-600">{{ dashboard.pending_orders }}</p>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
            <p class="mt-1 text-2xl font-bold text-green-600">{{ formatCurrency(dashboard.available_balance) }}</p>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Pending Balance</p>
            <p class="mt-1 text-2xl font-bold text-yellow-600">{{ formatCurrency(dashboard.pending_balance) }}</p>
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

        <!-- Top products -->
        <BaseCard title="Top Products">
          <div v-if="topProducts.length" class="space-y-4">
            <div
              v-for="(product, index) in topProducts"
              :key="product.id"
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
                <p class="font-medium text-gray-900 dark:text-white">{{ product.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ product.total_sold || 0 }} sold</p>
              </div>
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(product.total_revenue) }}
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
