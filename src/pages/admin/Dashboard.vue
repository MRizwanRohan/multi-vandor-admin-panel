<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Dashboard — Main admin dashboard page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'
import { useCurrency } from '@/composables'

const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Dashboard', [
    { label: 'Dashboard' },
  ], 'Overview of your marketplace performance')
})

// Loading state
const isLoading = ref(true)

// Mock stats data
const stats = ref({
  totalRevenue: 1250000,
  totalOrders: 523,
  totalProducts: 1284,
  totalVendors: 48,
  totalCustomers: 3847,
  pendingOrders: 24,
  revenueChange: 12.5,
  ordersChange: 8.3,
})

// Recent orders (mock data)
const recentOrders = ref([
  { id: 'ORD-001', customer: 'John Doe', total: 2500, status: 'pending', date: new Date() },
  { id: 'ORD-002', customer: 'Jane Smith', total: 4200, status: 'processing', date: new Date() },
  { id: 'ORD-003', customer: 'Mike Johnson', total: 1800, status: 'completed', date: new Date() },
  { id: 'ORD-004', customer: 'Sarah Williams', total: 3600, status: 'shipped', date: new Date() },
  { id: 'ORD-005', customer: 'David Brown', total: 5100, status: 'completed', date: new Date() },
])

// Top products (mock data)
const topProducts = ref([
  { id: 1, name: 'Premium T-Shirt', sold: 245, revenue: 122500 },
  { id: 2, name: 'Classic Jeans', sold: 189, revenue: 189000 },
  { id: 3, name: 'Running Shoes', sold: 156, revenue: 312000 },
  { id: 4, name: 'Leather Wallet', sold: 134, revenue: 67000 },
  { id: 5, name: 'Smart Watch', sold: 98, revenue: 490000 },
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
    <!-- Stats grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        :value="currency.formatCurrency(stats.totalRevenue)"
        :icon="CurrencyDollarIcon"
        :change="stats.revenueChange"
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
        title="Total Products"
        :value="stats.totalProducts.toLocaleString()"
        :icon="ShoppingBagIcon"
        color="info"
        :loading="isLoading"
      />

      <StatCard
        title="Active Vendors"
        :value="stats.totalVendors.toLocaleString()"
        :icon="BuildingStorefrontIcon"
        color="warning"
        :loading="isLoading"
      />
    </div>

    <!-- Charts and tables -->
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
                {{ order.customer }}
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
            to="/admin/orders"
            class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all orders →
          </RouterLink>
        </div>
      </BaseCard>

      <!-- Top products -->
      <BaseCard padding="none">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Top Products
          </h3>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="(product, index) in topProducts"
            :key="product.id"
            class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div class="flex items-center">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {{ index + 1 }}
              </span>
              <div class="ml-4">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ product.name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ product.sold }} sold
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ currency.formatCurrency(product.revenue) }}
              </p>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <RouterLink
            to="/admin/products"
            class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all products →
          </RouterLink>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
