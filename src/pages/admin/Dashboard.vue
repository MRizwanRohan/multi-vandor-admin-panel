<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Dashboard — Dynamic dashboard with real API data           -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import type {
  DashboardResponse,
  DashboardPeriod,
  DashboardStatsCard,
  DashboardRecentOrder,
  DashboardTopProduct,
  DashboardPendingActions,
  DashboardOrderStatusDistribution,
} from '@/types'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ClockIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import type { Component } from 'vue'

const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()

onMounted(() => {
  breadcrumbStore.setPageInfo('Dashboard', [{ label: 'Dashboard' }], 'Overview of your marketplace performance')
})

// ── State ──
const isLoading = ref(true)
const error = ref<string | null>(null)
const period = ref<DashboardPeriod>('month')

const statsCards = ref<DashboardStatsCard[]>([])
const recentOrders = ref<DashboardRecentOrder[]>([])
const pendingActions = ref<DashboardPendingActions | null>(null)
const revenueChart = ref<{ labels: string[]; datasets: { revenue: number[]; orders: number[] } } | null>(null)
const topProducts = ref<DashboardTopProduct[]>([])
const orderStatusDist = ref<DashboardOrderStatusDistribution | null>(null)

// ── Icon mapping for stat cards ──
const iconMap: Record<string, Component> = {
  total_revenue: CurrencyDollarIcon,
  total_orders: ShoppingCartIcon,
  total_customers: UsersIcon,
  total_vendors: BuildingStorefrontIcon,
  pending_orders: ClockIcon,
  pending_payouts: BanknotesIcon,
}

const colorMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  total_revenue: 'success',
  total_orders: 'primary',
  total_customers: 'info',
  total_vendors: 'warning',
  pending_orders: 'danger',
  pending_payouts: 'warning',
}

// ── Period options ──
const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
]

// ── Fetch dashboard ──
async function loadDashboard(fresh = false) {
  isLoading.value = true
  error.value = null
  try {
    const data: DashboardResponse = await analyticsService.getDashboard(period.value, fresh)
    statsCards.value = data.stats_cards || []
    recentOrders.value = data.recent_orders || []
    pendingActions.value = data.pending_actions || null
    revenueChart.value = data.revenue_chart || null
    topProducts.value = data.top_products || []
    orderStatusDist.value = data.order_status_distribution || null
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load dashboard'
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadDashboard())
onMounted(() => loadDashboard())

// ── Chart computed data ──
const revenueChartLabels = computed(() => revenueChart.value?.labels || [])
const revenueChartDatasets = computed(() => {
  if (!revenueChart.value) return []
  return [
    {
      label: 'Revenue',
      data: revenueChart.value.datasets.revenue,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
    },
    {
      label: 'Orders',
      data: revenueChart.value.datasets.orders,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
    },
  ]
})

// Order status doughnut
const orderStatusLabels = computed(() => {
  if (!orderStatusDist.value) return []
  return Object.keys(orderStatusDist.value).map(s => s.charAt(0).toUpperCase() + s.slice(1))
})
const orderStatusData = computed(() => {
  if (!orderStatusDist.value) return []
  return Object.values(orderStatusDist.value)
})

// Pending actions list
const pendingActionsList = computed(() => {
  if (!pendingActions.value) return []
  const pa = pendingActions.value
  return [
    { label: 'Pending Orders', count: pa.pending_orders, route: '/admin/orders?status=pending', color: 'text-warning-600' },
    { label: 'Vendor Approvals', count: pa.pending_vendor_approvals, route: '/admin/vendors?status=pending', color: 'text-info-600' },
    { label: 'Product Reviews', count: pa.pending_product_reviews, route: '/admin/products?status=pending', color: 'text-primary-600' },
    { label: 'Pending Payouts', count: pa.pending_payouts, route: '/admin/payouts?status=pending', color: 'text-success-600' },
    { label: 'Low Stock Alerts', count: pa.low_stock_alerts, route: '/admin/inventory/alerts', color: 'text-danger-600' },
    { label: 'Category Approvals', count: pa.pending_category_approvals, route: '/admin/categories/pending', color: 'text-warning-600' },
    { label: 'Contact Messages', count: pa.unread_contact_messages, route: '/admin/cms/contact', color: 'text-info-600' },
  ].filter(a => a.count > 0)
})

// Status badge classes
function getStatusClass(color: string): string {
  const classes: Record<string, string> = {
    green: 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300',
    blue: 'bg-info-100 text-info-800 dark:bg-info-900/50 dark:text-info-300',
    yellow: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300',
    red: 'bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    orange: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300',
    purple: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
  }
  return classes[color] || classes.gray
}
</script>

<template>
  <div class="space-y-6">
    <!-- Period selector & refresh -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
      <div class="flex items-center gap-3">
        <FormSelect
          v-model="period"
          :options="periodOptions"
          class="w-40"
        />
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          :disabled="isLoading"
          @click="loadDashboard(true)"
        >
          <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Error alert -->
    <div v-if="error" class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <div class="flex items-center gap-2">
        <ExclamationTriangleIcon class="h-5 w-5 text-danger-600" />
        <p class="text-sm text-danger-700 dark:text-danger-400">{{ error }}</p>
      </div>
    </div>

    <!-- Stats grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        v-for="card in statsCards"
        :key="card.key"
        :title="card.label"
        :value="card.formatted"
        :icon="iconMap[card.key] || ShoppingBagIcon"
        :change="card.change_percent"
        change-label="vs prev period"
        :trend="card.trend"
        :color="colorMap[card.key] || 'primary'"
        :loading="isLoading"
      />
      <!-- Show skeleton cards while loading and no data -->
      <template v-if="isLoading && statsCards.length === 0">
        <StatCard
          v-for="n in 6"
          :key="'skel-'+n"
          title="Loading..."
          value="—"
          :loading="true"
        />
      </template>
    </div>

    <!-- Charts row -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Revenue chart (2 cols) -->
      <BaseCard class="lg:col-span-2">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Revenue & Orders Trend</h3>
        </template>
        <div v-if="isLoading" class="flex h-72 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <LineChart
          v-else-if="revenueChartLabels.length"
          :labels="revenueChartLabels"
          :datasets="revenueChartDatasets"
          :height="280"
          :show-legend="true"
        />
        <div v-else class="flex h-72 items-center justify-center text-gray-400">
          No chart data available
        </div>
      </BaseCard>

      <!-- Order status distribution -->
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Order Status</h3>
        </template>
        <div v-if="isLoading" class="flex h-72 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <DoughnutChart
          v-else-if="orderStatusLabels.length"
          :labels="orderStatusLabels"
          :data="orderStatusData"
          :height="280"
          :show-legend="true"
        />
        <div v-else class="flex h-72 items-center justify-center text-gray-400">
          No order data
        </div>
      </BaseCard>
    </div>

    <!-- Bottom section: Recent Orders, Top Products, Pending Actions -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Recent Orders -->
      <BaseCard padding="none" class="lg:col-span-1">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
        </div>
        <div v-if="isLoading" class="space-y-3 p-6">
          <div v-for="n in 5" :key="n" class="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div v-else-if="recentOrders.length" class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-gray-900 dark:text-white">{{ order.order_number }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ order.customer_name }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ currency.formatCurrency(order.total_amount) }}
              </p>
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="getStatusClass(order.status.color)"
              >
                {{ order.status.label }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="p-6 text-center text-gray-400">No recent orders</div>
        <div class="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <RouterLink to="/admin/orders" class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            View all orders →
          </RouterLink>
        </div>
      </BaseCard>

      <!-- Top Products -->
      <BaseCard padding="none" class="lg:col-span-1">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
        </div>
        <div v-if="isLoading" class="space-y-3 p-6">
          <div v-for="n in 5" :key="n" class="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div v-else-if="topProducts.length" class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="(product, index) in topProducts"
            :key="index"
            class="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div class="flex items-center">
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {{ index + 1 }}
              </span>
              <div class="ml-3 min-w-0">
                <p class="truncate font-medium text-gray-900 dark:text-white">{{ product.product_name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.total_sold }} sold</p>
              </div>
            </div>
            <p class="whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {{ currency.formatCurrency(product.revenue) }}
            </p>
          </div>
        </div>
        <div v-else class="p-6 text-center text-gray-400">No product data</div>
        <div class="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <RouterLink to="/admin/analytics/top-products" class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            View analytics →
          </RouterLink>
        </div>
      </BaseCard>

      <!-- Pending Actions -->
      <BaseCard padding="none" class="lg:col-span-1">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pending Actions</h3>
        </div>
        <div v-if="isLoading" class="space-y-3 p-6">
          <div v-for="n in 5" :key="n" class="h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div v-else-if="pendingActionsList.length" class="divide-y divide-gray-200 dark:divide-gray-700">
          <RouterLink
            v-for="action in pendingActionsList"
            :key="action.label"
            :to="action.route"
            class="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ action.label }}</span>
            <span
              class="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-bold dark:bg-gray-700"
              :class="action.color"
            >
              {{ action.count }}
            </span>
          </RouterLink>
        </div>
        <div v-else class="p-6 text-center text-gray-400">No pending actions</div>
      </BaseCard>
    </div>
  </div>
</template>
