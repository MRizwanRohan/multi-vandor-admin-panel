<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Product Report — Product performance, low stock, top rated        -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import {
  CubeIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ArchiveBoxXMarkIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const searchQuery = ref('')
const categoryFilter = ref('all')
const stockFilter = ref('all')
const activeTab = ref<'performance' | 'low-stock' | 'top-rated'>('performance')
const isLoading = ref(false)

const stats = [
  { title: 'Total Products', value: '3,428', icon: CubeIcon, change: 156, trend: 'up' as const, changeLabel: 'new this month', color: 'primary' as const },
  { title: 'Low Stock Items', value: '47', icon: ExclamationTriangleIcon, change: 12, trend: 'up' as const, changeLabel: 'vs last week', color: 'danger' as const },
  { title: 'Avg. Rating', value: '4.2', icon: StarIcon, change: 0.1, trend: 'up' as const, changeLabel: 'vs last month', color: 'warning' as const },
  { title: 'Out of Stock', value: '23', icon: ArchiveBoxXMarkIcon, change: -5, trend: 'down' as const, changeLabel: 'vs last week', color: 'info' as const },
]

// Category distribution
const categoryLabels = ['Electronics', 'Fashion', 'Home', 'Baby', 'Sports', 'Food', 'Books']
const categoryProductCount = [680, 820, 540, 390, 320, 410, 268]

// Status distribution
const statusLabels = ['Active', 'Draft', 'Pending', 'Inactive']
const statusData = [2890, 245, 178, 115]

// Performance data
const products = ref([
  { id: 1, name: 'Wireless Bluetooth Earbuds Pro', sku: 'WBE-001', category: 'Electronics', vendor: 'TechMart', price: 2500, stock: 145, sold: 423, revenue: 1057500, rating: 4.8, status: 'active' },
  { id: 2, name: 'Premium Cotton T-Shirt', sku: 'PCT-012', category: 'Fashion', vendor: 'FashionHub', price: 800, stock: 520, sold: 387, revenue: 309600, rating: 4.5, status: 'active' },
  { id: 3, name: 'Stainless Water Bottle 1L', sku: 'SWB-045', category: 'Home', vendor: 'HomeLiving', price: 650, stock: 230, sold: 312, revenue: 202800, rating: 4.6, status: 'active' },
  { id: 4, name: 'Baby Organic Milk Formula', sku: 'BMF-007', category: 'Baby', vendor: 'KidZone', price: 1500, stock: 78, sold: 289, revenue: 433500, rating: 4.7, status: 'active' },
  { id: 5, name: 'Running Shoes Ultra', sku: 'RSU-023', category: 'Sports', vendor: 'SportGear', price: 3500, stock: 45, sold: 198, revenue: 693000, rating: 4.3, status: 'active' },
  { id: 6, name: 'LED Smart Bulb Pack', sku: 'LSB-089', category: 'Electronics', vendor: 'TechMart', price: 1200, stock: 8, sold: 156, revenue: 187200, rating: 4.1, status: 'active' },
  { id: 7, name: 'Organic Green Tea Box', sku: 'OGT-034', category: 'Food', vendor: 'FoodFresh', price: 450, stock: 3, sold: 145, revenue: 65250, rating: 4.4, status: 'active' },
])

const lowStockProducts = ref([
  { id: 6, name: 'LED Smart Bulb Pack', sku: 'LSB-089', category: 'Electronics', vendor: 'TechMart', stock: 8, reorder_level: 25, last_restocked: '2026-01-15' },
  { id: 7, name: 'Organic Green Tea Box', sku: 'OGT-034', category: 'Food', vendor: 'FoodFresh', stock: 3, reorder_level: 20, last_restocked: '2026-02-01' },
  { id: 8, name: 'Yoga Mat Premium', sku: 'YMP-056', category: 'Sports', vendor: 'SportGear', stock: 5, reorder_level: 15, last_restocked: '2026-01-28' },
  { id: 9, name: 'Baby Diaper Pack XL', sku: 'BDP-078', category: 'Baby', vendor: 'KidZone', stock: 12, reorder_level: 30, last_restocked: '2026-02-10' },
  { id: 10, name: 'USB-C Charging Cable', sku: 'UCC-100', category: 'Electronics', vendor: 'GadgetStore', stock: 0, reorder_level: 50, last_restocked: '2026-01-20' },
])

const performanceColumns = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'price', label: 'Price', align: 'right' as const },
  { key: 'sold', label: 'Units Sold', align: 'right' as const, sortable: true },
  { key: 'revenue', label: 'Revenue', align: 'right' as const, sortable: true },
  { key: 'rating', label: 'Rating', align: 'center' as const, sortable: true },
]

const lowStockColumns = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'stock', label: 'In Stock', align: 'right' as const, sortable: true },
  { key: 'reorder_level', label: 'Reorder At', align: 'right' as const },
  { key: 'last_restocked', label: 'Last Restocked' },
]

onMounted(() => {
  breadcrumbStore.setPageInfo('Product Report', [
    { label: 'Reports' },
    { label: 'Products' },
  ], 'Product performance, stock levels, and ratings')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Product Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Product performance metrics and stock analysis</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <ArrowDownTrayIcon class="h-4 w-4" />
        Export
      </button>
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

    <!-- Charts -->
    <div class="grid gap-6 lg:grid-cols-2">
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Products by Category</h3>
        <BarChart
          :labels="categoryLabels"
          :datasets="[{ label: 'Products', data: categoryProductCount }]"
          :height="280"
          :show-legend="false"
        />
      </BaseCard>
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Product Status</h3>
        <DoughnutChart
          :labels="statusLabels"
          :data="statusData"
          :height="280"
        />
      </BaseCard>
    </div>

    <!-- Tabs -->
    <BaseCard>
      <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex gap-4" aria-label="Tabs">
          <button
            v-for="tab in (['performance', 'low-stock', 'top-rated'] as const)"
            :key="tab"
            :class="[
              activeTab === tab
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
              'border-b-2 px-1 pb-3 text-sm font-medium capitalize transition-colors',
            ]"
            @click="activeTab = tab"
          >
            {{ tab.replace('-', ' ') }}
          </button>
        </nav>
      </div>

      <!-- Filters -->
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            placeholder="Search products..."
            class="pl-10"
          />
        </div>
        <FormSelect
          v-model="categoryFilter"
          :options="[
            { label: 'All Categories', value: 'all' },
            { label: 'Electronics', value: 'electronics' },
            { label: 'Fashion', value: 'fashion' },
            { label: 'Home & Living', value: 'home' },
            { label: 'Baby & Kids', value: 'baby' },
            { label: 'Sports', value: 'sports' },
          ]"
          class="w-40"
        />
      </div>

      <!-- Performance table -->
      <DataTable
        v-if="activeTab === 'performance' || activeTab === 'top-rated'"
        :columns="performanceColumns"
        :data="products"
        :loading="isLoading"
        :total="products.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.sku }}</p>
          </div>
        </template>

        <template #cell-price="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatCurrency(row.price) }}</span>
        </template>

        <template #cell-revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue) }}</span>
        </template>

        <template #cell-rating="{ row }">
          <div class="flex items-center justify-center gap-1">
            <StarIcon class="h-4 w-4 text-yellow-400" />
            <span class="text-sm font-medium">{{ row.rating }}</span>
          </div>
        </template>
      </DataTable>

      <!-- Low stock table -->
      <DataTable
        v-if="activeTab === 'low-stock'"
        :columns="lowStockColumns"
        :data="lowStockProducts"
        :loading="isLoading"
        :total="lowStockProducts.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-name="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
        </template>

        <template #cell-stock="{ row }">
          <span
            :class="row.stock === 0 ? 'text-danger-600 dark:text-danger-400 font-bold' : row.stock < 10 ? 'text-warning-600 dark:text-warning-400 font-medium' : 'text-gray-700 dark:text-gray-300'"
          >
            {{ row.stock === 0 ? 'Out of stock' : row.stock }}
          </span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
