<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Dashboard — Main vendor dashboard page                   -->
<!-- Uses /api/v1/vendor/dashboard endpoint                          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore, useAuthStore } from '@/stores'
import { useToast, useCurrency, useDate } from '@/composables'
import api from '@/services/api'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  StarIcon,
  WalletIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const authStore = useAuthStore()
const currency = useCurrency()
const toast = useToast()
const { formatRelative } = useDate()

// ── Period Filter ────────────────────────────────────────────────

const selectedPeriod = ref('month')
const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
]

// ── Dashboard Data ───────────────────────────────────────────────

interface DashboardOverview {
  total_revenue: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
  total_orders: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
  total_earnings: { value: number; previous: number; change_percentage: number; trend: 'up' | 'down' }
  pending_payouts: number
  available_balance: number
}

interface DashboardOrders {
  total: number
  by_status: Record<string, number>
  pending_action: number
  average_order_value: number
}

interface DashboardProducts {
  total: number
  active: number
  inactive: number
  out_of_stock: number
  low_stock: number
  featured: number
}

interface TopProduct {
  product_id: number
  name: string
  slug: string
  sku: string
  total_sold: number
  total_revenue: number
}

interface RecentOrder {
  id: number
  order_number: string
  product_name: string
  quantity: number
  total: number
  status: string
  customer_name: string
  created_at: string
}

interface DashboardData {
  overview: DashboardOverview
  orders: DashboardOrders
  products: DashboardProducts
  earnings: {
    total_earned: number
    pending: { count: number; amount: number }
    confirmed: { count: number; amount: number }
    paid: { count: number; amount: number }
    refunded: { count: number; amount: number }
  }
  recent_orders: RecentOrder[]
  top_products: TopProduct[]
  period: string
  date_range: { start: string; end: string }
}

const dashboardData = ref<DashboardData | null>(null)
const isLoading = ref(true)

async function fetchDashboard() {
  isLoading.value = true
  try {
    const response = await api.get('/vendor/dashboard', {
      params: { period: selectedPeriod.value },
    })
    dashboardData.value = response.data.data
  } catch {
    toast.error('Failed to load dashboard data')
  } finally {
    isLoading.value = false
  }
}

function onPeriodChange() {
  fetchDashboard()
}

// ── Helpers ──────────────────────────────────────────────────────

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    pending: 'warning',
    confirmed: 'info',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'danger',
  }
  return map[status] || 'info'
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Dashboard', [
    { label: 'Dashboard' },
  ], 'Overview of your shop performance')
  fetchDashboard()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome + Period filter -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-linear-to-r from-primary-600 to-primary-700 p-6 text-white">
      <div>
        <h2 class="text-xl font-bold">
          Welcome back, {{ authStore.user?.first_name || 'Vendor' }}! 👋
        </h2>
        <p class="mt-1 text-primary-100">
          Here's what's happening with your shop.
        </p>
      </div>
      <div>
        <select
          v-model="selectedPeriod"
          class="rounded-lg border-0 bg-white/20 px-3 py-2 text-sm text-white backdrop-blur focus:ring-2 focus:ring-white/30"
          @change="onPeriodChange"
        >
          <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value" class="text-gray-900">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Primary Stats grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        :value="dashboardData ? currency.formatCurrency(dashboardData.overview.total_revenue.value) : '—'"
        :icon="CurrencyDollarIcon"
        :change="dashboardData?.overview.total_revenue.change_percentage"
        change-label="vs previous period"
        :trend="dashboardData?.overview.total_revenue.trend ?? 'up'"
        color="success"
        :loading="isLoading"
      />

      <StatCard
        title="Total Orders"
        :value="dashboardData?.overview.total_orders.value.toLocaleString() ?? '—'"
        :icon="ShoppingCartIcon"
        :change="dashboardData?.overview.total_orders.change_percentage"
        change-label="vs previous period"
        :trend="dashboardData?.overview.total_orders.trend ?? 'up'"
        color="primary"
        :loading="isLoading"
      />

      <StatCard
        title="Available Balance"
        :value="dashboardData ? currency.formatCurrency(dashboardData.overview.available_balance) : '—'"
        :icon="WalletIcon"
        color="info"
        :loading="isLoading"
      />

      <StatCard
        title="Earnings"
        :value="dashboardData ? currency.formatCurrency(dashboardData.overview.total_earnings.value) : '—'"
        :icon="ArrowTrendingUpIcon"
        :change="dashboardData?.overview.total_earnings.change_percentage"
        change-label="vs previous period"
        :trend="dashboardData?.overview.total_earnings.trend ?? 'up'"
        color="warning"
        :loading="isLoading"
      />
    </div>

    <!-- Secondary Stats -->
    <div class="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="Active Products"
        :value="dashboardData?.products.active.toLocaleString() ?? '—'"
        :icon="ShoppingBagIcon"
        color="primary"
        :loading="isLoading"
      />

      <StatCard
        title="Pending Orders"
        :value="dashboardData?.orders.pending_action.toLocaleString() ?? '—'"
        :icon="ClockIcon"
        color="warning"
        :loading="isLoading"
      />

      <StatCard
        title="Pending Payouts"
        :value="dashboardData ? currency.formatCurrency(dashboardData.overview.pending_payouts) : '—'"
        :icon="CurrencyDollarIcon"
        color="info"
        :loading="isLoading"
      />
    </div>

    <!-- Tables -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Recent Orders -->
      <BaseCard padding="none">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Orders
          </h3>
        </div>

        <template v-if="dashboardData?.recent_orders.length">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="order in dashboardData.recent_orders"
              :key="order.id"
              class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div class="min-w-0 flex-1">
                <RouterLink
                  :to="`/vendor/orders/${order.id}`"
                  class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {{ order.order_number }}
                </RouterLink>
                <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                  {{ order.customer_name }} · {{ order.product_name }}
                </p>
              </div>
              <div class="ml-4 text-right">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ currency.formatCurrency(order.total) }}
                </p>
                <BaseBadge :variant="getStatusVariant(order.status)" size="sm">
                  {{ order.status }}
                </BaseBadge>
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="!isLoading" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No recent orders
        </div>
        <div v-if="isLoading" class="space-y-4 px-6 py-4">
          <div v-for="i in 5" :key="i" class="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div class="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <RouterLink
            to="/vendor/orders"
            class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all orders →
          </RouterLink>
        </div>
      </BaseCard>

      <!-- Top Products -->
      <BaseCard padding="none">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Top Products
            </h3>
            <span
              v-if="dashboardData?.products.low_stock"
              class="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-800 dark:bg-danger-900/50 dark:text-danger-300"
            >
              <ExclamationTriangleIcon class="h-3 w-3" />
              {{ dashboardData.products.low_stock }} low stock
            </span>
          </div>
        </div>

        <template v-if="dashboardData?.top_products.length">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="product in dashboardData.top_products"
              :key="product.product_id"
              class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div class="min-w-0 flex-1">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ product.name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ product.total_sold }} sold
                </p>
              </div>
              <div class="ml-4 text-right">
                <p class="font-medium text-success-600 dark:text-success-400">
                  {{ currency.formatCurrency(product.total_revenue) }}
                </p>
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="!isLoading" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No product sales data yet
        </div>
        <div v-if="isLoading" class="space-y-4 px-6 py-4">
          <div v-for="i in 5" :key="i" class="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div class="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <RouterLink
            to="/vendor/products"
            class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all products →
          </RouterLink>
        </div>
      </BaseCard>
    </div>

    <!-- Earnings Breakdown -->
    <BaseCard v-if="dashboardData?.earnings">
      <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Earnings Breakdown
      </h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
          <p class="text-sm text-warning-600 dark:text-warning-400">Pending</p>
          <p class="mt-1 text-xl font-bold text-warning-700 dark:text-warning-300">
            {{ currency.formatCurrency(dashboardData.earnings.pending.amount) }}
          </p>
          <p class="text-xs text-warning-500">{{ dashboardData.earnings.pending.count }} commissions</p>
        </div>

        <div class="rounded-lg border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
          <p class="text-sm text-info-600 dark:text-info-400">Confirmed</p>
          <p class="mt-1 text-xl font-bold text-info-700 dark:text-info-300">
            {{ currency.formatCurrency(dashboardData.earnings.confirmed.amount) }}
          </p>
          <p class="text-xs text-info-500">{{ dashboardData.earnings.confirmed.count }} commissions</p>
        </div>

        <div class="rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
          <p class="text-sm text-success-600 dark:text-success-400">Paid</p>
          <p class="mt-1 text-xl font-bold text-success-700 dark:text-success-300">
            {{ currency.formatCurrency(dashboardData.earnings.paid.amount) }}
          </p>
          <p class="text-xs text-success-500">{{ dashboardData.earnings.paid.count }} commissions</p>
        </div>

        <div class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
          <p class="text-sm text-danger-600 dark:text-danger-400">Refunded</p>
          <p class="mt-1 text-xl font-bold text-danger-700 dark:text-danger-300">
            {{ currency.formatCurrency(dashboardData.earnings.refunded.amount) }}
          </p>
          <p class="text-xs text-danger-500">{{ dashboardData.earnings.refunded.count }} commissions</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
