<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Dashboard — Main vendor dashboard page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore, useAuthStore } from '@/stores'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  StarIcon,
  WalletIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import { useCurrency } from '@/composables'

const breadcrumbStore = useBreadcrumbStore()
const authStore = useAuthStore()
const currency = useCurrency()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Dashboard', [
    { label: 'Dashboard' },
  ], 'Overview of your shop performance')
})

// Loading state
const isLoading = ref(true)

// Mock stats data
const stats = ref({
  totalSales: 485000,
  totalOrders: 156,
  totalProducts: 48,
  averageRating: 4.7,
  pendingOrders: 8,
  availableBalance: 125000,
  pendingPayout: 35000,
  salesChange: 15.2,
  ordersChange: 12.8,
})

// Recent orders (mock data)
const recentOrders = ref([
  { id: 'ORD-001', customer: 'John Doe', total: 2500, status: 'pending', items: 3 },
  { id: 'ORD-002', customer: 'Jane Smith', total: 4200, status: 'processing', items: 2 },
  { id: 'ORD-003', customer: 'Mike Johnson', total: 1800, status: 'completed', items: 1 },
  { id: 'ORD-004', customer: 'Sarah Williams', total: 3600, status: 'shipped', items: 4 },
  { id: 'ORD-005', customer: 'David Brown', total: 5100, status: 'completed', items: 2 },
])

// Low stock products (mock data)
const lowStockProducts = ref([
  { id: 1, name: 'Premium T-Shirt (Red, M)', stock: 3, threshold: 10 },
  { id: 2, name: 'Classic Jeans (Blue, 32)', stock: 5, threshold: 15 },
  { id: 3, name: 'Running Shoes (Black, 42)', stock: 2, threshold: 10 },
])

// Status badge classes
function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300',
    processing: 'bg-info-100 text-info-800 dark:bg-info-900/50 dark:text-info-300',
    shipped: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
    completed: 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300',
    cancelled: 'bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300',
  }
  return classes[status] || classes.pending
}

// Simulate loading
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome message -->
    <div class="rounded-xl bg-linear-to-r from-primary-600 to-primary-700 p-6 text-white">
      <h2 class="text-xl font-bold">
        Welcome back, {{ authStore.user?.first_name || 'Vendor' }}! 👋
      </h2>
      <p class="mt-1 text-primary-100">
        Here's what's happening with your shop today.
      </p>
    </div>

    <!-- Stats grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Sales"
        :value="currency.formatCurrency(stats.totalSales)"
        :icon="CurrencyDollarIcon"
        :change="stats.salesChange"
        change-label="vs last month"
        trend="up"
        color="success"
        :loading="isLoading"
      />

      <StatCard
        title="Total Orders"
        :value="stats.totalOrders.toLocaleString()"
        :icon="ShoppingCartIcon"
        :change="stats.ordersChange"
        change-label="vs last month"
        trend="up"
        color="primary"
        :loading="isLoading"
      />

      <StatCard
        title="Available Balance"
        :value="currency.formatCurrency(stats.availableBalance)"
        :icon="WalletIcon"
        color="info"
        :loading="isLoading"
      />

      <StatCard
        title="Average Rating"
        :value="stats.averageRating.toFixed(1)"
        :icon="StarIcon"
        color="warning"
        :loading="isLoading"
      />
    </div>

    <!-- Second row stats -->
    <div class="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="Active Products"
        :value="stats.totalProducts.toLocaleString()"
        :icon="ShoppingBagIcon"
        color="primary"
        :loading="isLoading"
      />

      <StatCard
        title="Pending Orders"
        :value="stats.pendingOrders.toLocaleString()"
        :icon="ClockIcon"
        color="warning"
        :loading="isLoading"
      />

      <StatCard
        title="Pending Payout"
        :value="currency.formatCurrency(stats.pendingPayout)"
        :icon="CurrencyDollarIcon"
        color="info"
        :loading="isLoading"
      />
    </div>

    <!-- Tables -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Recent orders -->
      <BaseCard padding="none">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Orders
          </h3>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ order.id }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ order.customer }} • {{ order.items }} items
              </p>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ currency.formatCurrency(order.total) }}
              </p>
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                :class="getStatusClass(order.status)"
              >
                {{ order.status }}
              </span>
            </div>
          </div>
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

      <!-- Low stock alert -->
      <BaseCard padding="none">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Alert
            </h3>
            <span class="inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-800 dark:bg-danger-900/50 dark:text-danger-300">
              {{ lowStockProducts.length }} items
            </span>
          </div>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="product in lowStockProducts"
            :key="product.id"
            class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ product.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Threshold: {{ product.threshold }} units
              </p>
            </div>
            <div class="text-right">
              <span class="text-lg font-bold text-danger-600 dark:text-danger-400">
                {{ product.stock }}
              </span>
              <p class="text-xs text-gray-500 dark:text-gray-400">in stock</p>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <RouterLink
            to="/vendor/inventory"
            class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Manage inventory →
          </RouterLink>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
