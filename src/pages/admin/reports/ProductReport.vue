<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Product Report — Product performance, low stock, top rated        -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { analyticsService } from '@/services'
import type { AnalyticsTopProduct, InventoryOverviewResponse, RevenueByCategory, AnalyticsParams } from '@/types'
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
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const searchQuery = ref('')
const period = ref('month')
const activeTab = ref<'performance' | 'low-stock'>('performance')
const isLoading = ref(true)
const error = ref<string | null>(null)

const topProducts = ref<AnalyticsTopProduct[]>([])
const inventory = ref<InventoryOverviewResponse | null>(null)
const categoryRevenue = ref<RevenueByCategory[]>([])

const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
]

async function loadData() {
  isLoading.value = true
  error.value = null
  try {
    const params: AnalyticsParams = { period: period.value as any, limit: 50 }
    const [products, inv, cats] = await Promise.allSettled([
      analyticsService.getTopProducts(params),
      analyticsService.getInventoryOverview(),
      analyticsService.getRevenueByCategory(params),
    ])
    topProducts.value = products.status === 'fulfilled' && Array.isArray(products.value) ? products.value : []
    inventory.value = inv.status === 'fulfilled' ? inv.value : null
    categoryRevenue.value = cats.status === 'fulfilled' && Array.isArray(cats.value) ? cats.value : []
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load product report'
    console.error('Failed to load product report', e)
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadData())
onMounted(() => {
  loadData()
  breadcrumbStore.setPageInfo('Product Report', [
    { label: 'Reports' },
    { label: 'Products' },
  ], 'Product performance, stock levels, and ratings')
})

// Stats
const stats = computed(() => {
  const inv = inventory.value
  return [
    { title: 'Total Products', value: inv ? inv.total_products.toLocaleString() : '—', icon: CubeIcon, color: 'primary' as const },
    { title: 'Low Stock Items', value: inv ? inv.low_stock.toLocaleString() : '—', icon: ExclamationTriangleIcon, color: 'danger' as const },
    { title: 'Out of Stock', value: inv ? inv.out_of_stock.toLocaleString() : '—', icon: ArchiveBoxXMarkIcon, color: 'warning' as const },
    { title: 'Stock Value', value: inv ? formatCurrency(inv.total_stock_value) : '—', icon: StarIcon, color: 'info' as const },
  ]
})

// Category chart
const catLabels = computed(() => categoryRevenue.value.map(c => c.category_name))
const catData = computed(() => categoryRevenue.value.map(c => c.total_items))

// Filtered products
const filteredProducts = computed(() => {
  if (!searchQuery.value) return topProducts.value
  const q = searchQuery.value.toLowerCase()
  return topProducts.value.filter(p =>
    p.product_name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.vendor_store?.toLowerCase().includes(q)
  )
})

const performanceColumns = [
  { key: 'product_name', label: 'Product', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'vendor_store', label: 'Vendor' },
  { key: 'total_sold', label: 'Units Sold', align: 'right' as const, sortable: true },
  { key: 'total_revenue', label: 'Revenue', align: 'right' as const, sortable: true },
  { key: 'average_rating', label: 'Rating', align: 'center' as const, sortable: true },
]

const lowStockColumns = [
  { key: 'product_name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU' },
  { key: 'current_stock', label: 'In Stock', align: 'right' as const, sortable: true },
  { key: 'threshold', label: 'Threshold', align: 'right' as const },
  { key: 'status', label: 'Status', align: 'center' as const },
]

async function handleExport() {
  try {
    const blob = await analyticsService.exportProducts({ period: period.value })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-report-${period.value}.csv`
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
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Product Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Product performance metrics and stock analysis</p>
      </div>
      <div class="flex items-center gap-3">
        <FormSelect v-model="period" :options="periodOptions" class="w-40" />
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
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
        :loading="isLoading"
      />
    </div>

    <!-- Charts -->
    <div class="grid gap-6 lg:grid-cols-2">
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Products by Category</h3>
        <BarChart
          v-if="!isLoading && catLabels.length"
          :labels="catLabels"
          :datasets="[{ label: 'Products', data: catData }]"
          :height="280"
          :show-legend="false"
        />
        <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
      </BaseCard>
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Revenue by Category</h3>
        <DoughnutChart
          v-if="!isLoading && catLabels.length"
          :labels="catLabels"
          :data="categoryRevenue.map(c => c.total_revenue)"
          :height="280"
        />
        <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
      </BaseCard>
    </div>

    <!-- Tabs -->
    <BaseCard>
      <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex gap-4" aria-label="Tabs">
          <button
            v-for="tab in (['performance', 'low-stock'] as const)"
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
      </div>

      <!-- Performance table -->
      <DataTable
        v-if="activeTab === 'performance'"
        :columns="performanceColumns"
        :data="filteredProducts"
        :loading="isLoading"
        :total="filteredProducts.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-product_name="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.product_name }}</span>
        </template>

        <template #cell-total_revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.total_revenue) }}</span>
        </template>

        <template #cell-average_rating="{ row }">
          <div class="flex items-center justify-center gap-1">
            <StarIcon class="h-4 w-4 text-yellow-400" />
            <span class="text-sm font-medium">{{ row.average_rating != null ? Number(row.average_rating).toFixed(1) : '—' }}</span>
          </div>
        </template>
      </DataTable>

      <!-- Low stock table -->
      <DataTable
        v-if="activeTab === 'low-stock'"
        :columns="lowStockColumns"
        :data="inventory?.recent_stock_alerts || []"
        :loading="isLoading"
        :total="inventory?.recent_stock_alerts?.length || 0"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-product_name="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.product_name }}</span>
        </template>

        <template #cell-current_stock="{ row }">
          <span
            :class="row.current_stock === 0 ? 'text-danger-600 dark:text-danger-400 font-bold' : row.current_stock < 10 ? 'text-warning-600 dark:text-warning-400 font-medium' : 'text-gray-700 dark:text-gray-300'"
          >
            {{ row.current_stock === 0 ? 'Out of stock' : row.current_stock }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <span
            :class="row.status === 'out_of_stock' ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' : 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'"
            class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          >
            {{ row.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock' }}
          </span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
