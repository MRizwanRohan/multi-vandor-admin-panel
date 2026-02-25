<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Reports — Vendor self-service analytics and reports        -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const dateRange = ref('last_30_days')
const reportType = ref('sales')
const isLoading = ref(false)

const stats = [
  { title: 'Total Revenue', value: formatCurrency(485200), icon: CurrencyDollarIcon, change: 14.2, trend: 'up' as const, changeLabel: 'vs last period', color: 'primary' as const },
  { title: 'Total Orders', value: '342', icon: ShoppingCartIcon, change: 9.5, trend: 'up' as const, changeLabel: 'vs last period', color: 'success' as const },
  { title: 'Product Views', value: '12,845', icon: EyeIcon, change: 22.3, trend: 'up' as const, changeLabel: 'vs last period', color: 'info' as const },
  { title: 'Conversion Rate', value: '2.66%', icon: ArrowTrendingUpIcon, change: 0.3, trend: 'up' as const, changeLabel: 'vs last period', color: 'warning' as const },
]

// Revenue trend
const revenueLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
const revenueDatasets = [
  { label: 'Revenue', data: [98000, 125000, 142000, 120200], fill: true },
  { label: 'Orders', data: [68, 89, 102, 83], fill: false },
]

// Top products
const topProductLabels = ['Earbuds Pro', 'Cotton T-Shirt', 'Water Bottle', 'LED Bulb', 'Phone Case']
const topProductData = [156000, 89000, 67000, 54000, 42000]

// Category revenue
const categoryLabels = ['Electronics', 'Accessories', 'Home', 'Other']
const categoryData = [245000, 120000, 78000, 42200]

// Best sellers table
const bestSellers = ref([
  { id: 1, name: 'Wireless Bluetooth Earbuds Pro', orders: 87, revenue: 217500, views: 2456, conversion: 3.54 },
  { id: 2, name: 'Premium Cotton T-Shirt Pack', orders: 74, revenue: 59200, views: 1890, conversion: 3.92 },
  { id: 3, name: 'Stainless Water Bottle 1L', orders: 62, revenue: 40300, views: 1345, conversion: 4.61 },
  { id: 4, name: 'LED Smart Bulb Pack (4x)', orders: 45, revenue: 54000, views: 980, conversion: 4.59 },
  { id: 5, name: 'Phone Case Ultra Slim', orders: 38, revenue: 22800, views: 1567, conversion: 2.43 },
])

const sellerColumns = [
  { key: 'rank', label: '#', align: 'center' as const },
  { key: 'name', label: 'Product', sortable: true },
  { key: 'orders', label: 'Orders', align: 'right' as const, sortable: true },
  { key: 'revenue', label: 'Revenue', align: 'right' as const, sortable: true },
  { key: 'views', label: 'Views', align: 'right' as const },
  { key: 'conversion', label: 'Conv. Rate', align: 'right' as const },
]

onMounted(() => {
  breadcrumbStore.setPageInfo('Reports', [
    { label: 'Reports' },
  ], 'Your shop performance analytics and reports')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Reports</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Your shop performance analytics and detailed reports</p>
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

    <!-- Revenue Trend -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
      <LineChart
        :labels="revenueLabels"
        :datasets="revenueDatasets"
        :height="300"
        :show-legend="true"
      />
    </BaseCard>

    <!-- Charts row -->
    <div class="grid gap-6 lg:grid-cols-2">
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Top Products by Revenue</h3>
        <BarChart
          :labels="topProductLabels"
          :datasets="[{ label: 'Revenue', data: topProductData }]"
          :height="280"
          :show-legend="false"
        />
      </BaseCard>
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue by Category</h3>
        <DoughnutChart
          :labels="categoryLabels"
          :data="categoryData"
          :height="280"
        />
      </BaseCard>
    </div>

    <!-- Best Sellers -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Best Selling Products</h3>
      <DataTable
        :columns="sellerColumns"
        :data="bestSellers"
        :loading="isLoading"
        :total="bestSellers.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-rank="{ row }">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ bestSellers.indexOf(row) + 1 }}
          </span>
        </template>

        <template #cell-name="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
        </template>

        <template #cell-revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue) }}</span>
        </template>

        <template #cell-views="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ row.views.toLocaleString() }}</span>
        </template>

        <template #cell-conversion="{ row }">
          <span class="text-sm font-medium text-success-600 dark:text-success-400">{{ row.conversion }}%</span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
