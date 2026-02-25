<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Sales Report — Revenue over time, top products, category breakdown -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { useDate } from '@/composables/useDate'
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
  ReceiptPercentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// Filters
const dateRange = ref('last_30_days')
const isLoading = ref(false)

// Stats
const stats = computed(() => [
  {
    title: 'Total Revenue',
    value: formatCurrency(2845600),
    icon: CurrencyDollarIcon,
    change: 12.5,
    trend: 'up' as const,
    changeLabel: 'vs last period',
    color: 'primary' as const,
  },
  {
    title: 'Total Orders',
    value: '1,247',
    icon: ShoppingCartIcon,
    change: 8.3,
    trend: 'up' as const,
    changeLabel: 'vs last period',
    color: 'info' as const,
  },
  {
    title: 'Average Order Value',
    value: formatCurrency(2281),
    icon: ArrowTrendingUpIcon,
    change: 3.7,
    trend: 'up' as const,
    changeLabel: 'vs last period',
    color: 'success' as const,
  },
  {
    title: 'Commission Earned',
    value: formatCurrency(284560),
    icon: ReceiptPercentIcon,
    change: -2.1,
    trend: 'down' as const,
    changeLabel: 'vs last period',
    color: 'warning' as const,
  },
])

// Revenue chart data
const revenueLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const revenueDatasets = [
  { label: 'Revenue', data: [180000, 210000, 195000, 240000, 260000, 285000, 310000, 295000, 330000, 350000, 320000, 370000], fill: true },
  { label: 'Commission', data: [18000, 21000, 19500, 24000, 26000, 28500, 31000, 29500, 33000, 35000, 32000, 37000], fill: true },
]

// Orders by category chart
const categoryLabels = ['Electronics', 'Fashion', 'Home & Living', 'Baby & Kids', 'Sports', 'Food', 'Other']
const categoryData = [320, 280, 190, 150, 120, 105, 82]

// Top products
const topProducts = ref([
  { id: 1, name: 'Wireless Bluetooth Earbuds', category: 'Electronics', orders: 156, revenue: 312000, growth: 15 },
  { id: 2, name: 'Premium Cotton T-Shirt', category: 'Fashion', orders: 142, revenue: 142000, growth: 8 },
  { id: 3, name: 'Stainless Steel Water Bottle', category: 'Home & Living', orders: 128, revenue: 76800, growth: 22 },
  { id: 4, name: 'Baby Organic Milk Powder', category: 'Baby & Kids', orders: 115, revenue: 172500, growth: -3 },
  { id: 5, name: 'Yoga Mat Premium', category: 'Sports', orders: 98, revenue: 147000, growth: 12 },
  { id: 6, name: 'LED Desk Lamp', category: 'Electronics', orders: 92, revenue: 92000, growth: 5 },
  { id: 7, name: 'Leather Wallet', category: 'Fashion', orders: 87, revenue: 130500, growth: 18 },
  { id: 8, name: 'Air Purifier HEPA', category: 'Home & Living', orders: 78, revenue: 234000, growth: 30 },
])

const productColumns = [
  { key: 'rank', label: '#', align: 'center' as const },
  { key: 'name', label: 'Product', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'orders', label: 'Orders', sortable: true, align: 'right' as const },
  { key: 'revenue', label: 'Revenue', sortable: true, align: 'right' as const },
  { key: 'growth', label: 'Growth', align: 'right' as const },
]

// Daily revenue breakdown
const dailyRevenue = ref([
  { date: '2026-02-24', orders: 45, revenue: 102500, avg_order: 2278 },
  { date: '2026-02-23', orders: 52, revenue: 118600, avg_order: 2281 },
  { date: '2026-02-22', orders: 38, revenue: 86700, avg_order: 2282 },
  { date: '2026-02-21', orders: 61, revenue: 139200, avg_order: 2282 },
  { date: '2026-02-20', orders: 43, revenue: 98100, avg_order: 2281 },
])

const dailyColumns = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'orders', label: 'Orders', align: 'right' as const },
  { key: 'revenue', label: 'Revenue', align: 'right' as const },
  { key: 'avg_order', label: 'Avg Order', align: 'right' as const },
]

onMounted(() => {
  breadcrumbStore.setPageInfo('Sales Report', [
    { label: 'Reports' },
    { label: 'Sales' },
  ], 'Revenue, orders, and sales analytics')
})
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
        <FormSelect
          v-model="dateRange"
          :options="[
            { label: 'Last 7 Days', value: 'last_7_days' },
            { label: 'Last 30 Days', value: 'last_30_days' },
            { label: 'Last 90 Days', value: 'last_90_days' },
            { label: 'This Year', value: 'this_year' },
          ]"
          class="w-40"
        />
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowDownTrayIcon class="h-4 w-4" />
          Export
        </button>
      </div>
    </div>

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

    <!-- Revenue Chart -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
      <LineChart
        :labels="revenueLabels"
        :datasets="revenueDatasets"
        :height="320"
        :show-legend="true"
      />
    </BaseCard>

    <!-- Charts row -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Orders by Category -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Orders by Category</h3>
        <BarChart
          :labels="categoryLabels"
          :datasets="[{ label: 'Orders', data: categoryData }]"
          :height="280"
          :show-legend="false"
        />
      </BaseCard>

      <!-- Category Revenue Split -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue by Category</h3>
        <DoughnutChart
          :labels="categoryLabels"
          :data="[650000, 520000, 380000, 290000, 240000, 180000, 160000]"
          :height="280"
        />
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
        <template #cell-rank="{ row }">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ topProducts.indexOf(row) + 1 }}
          </span>
        </template>

        <template #cell-name="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
        </template>

        <template #cell-category="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ row.category }}</span>
        </template>

        <template #cell-orders="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.orders }}</span>
        </template>

        <template #cell-revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue) }}</span>
        </template>

        <template #cell-growth="{ row }">
          <span
            :class="row.growth >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            class="text-sm font-medium"
          >
            {{ row.growth > 0 ? '+' : '' }}{{ row.growth }}%
          </span>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Daily Breakdown -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Daily Breakdown</h3>
      <DataTable
        :columns="dailyColumns"
        :data="dailyRevenue"
        :loading="isLoading"
        :total="dailyRevenue.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-date="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.date, 'ddd, MMM D') }}</span>
        </template>
        <template #cell-revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue) }}</span>
        </template>
        <template #cell-avg_order="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatCurrency(row.avg_order) }}</span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
