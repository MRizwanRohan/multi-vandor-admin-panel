<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Sales Report — Detailed sales report with export (API)     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency, useDate } from '@/composables'
import api from '@/services/api'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import { LineChart, DoughnutChart } from '@/components/charts'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ReceiptPercentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

// Match actual backend response structure
interface DailySale {
  date: string
  revenue: number
  orders: number
  items_sold: number
}

interface CategoryBreakdown {
  category_id: number
  category_name: string
  revenue: number
  orders: number
  items_sold: number
  percentage: number
}

interface TopProduct {
  product_id: number
  product_name: string
  revenue: number
  quantity_sold: number
  orders_count: number
}

interface SalesReportData {
  summary: {
    total_revenue: number
    total_orders: number
    average_order_value: number
    total_commission: number
    net_revenue: number
    items_sold: number
    revenue_change?: number
  }
  daily_sales: DailySale[]
  category_breakdown: CategoryBreakdown[]
  top_products: TopProduct[]
  period: string
  date_range: { start: string; end: string }
}

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const isExporting = ref(false)
const period = ref<'week' | 'month' | 'quarter' | 'year'>('month')

const reportData = ref<SalesReportData | null>(null)

const periodOptions = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

// Stats cards
const stats = computed(() => {
  if (!reportData.value?.summary) return []
  const s = reportData.value.summary
  return [
    { title: 'Total Revenue', value: formatCurrency(s.total_revenue || 0), icon: CurrencyDollarIcon, color: 'primary' as const },
    { title: 'Total Orders', value: String(s.total_orders || 0), icon: ShoppingCartIcon, color: 'success' as const },
    { title: 'Avg Order Value', value: formatCurrency(s.average_order_value || 0), icon: ReceiptPercentIcon, color: 'info' as const },
    { title: 'Net Revenue', value: formatCurrency(s.net_revenue || 0), icon: CurrencyDollarIcon, color: 'warning' as const },
  ]
})

// Chart data - transform daily_sales to chart format
const chartLabels = computed(() => {
  const sales = reportData.value?.daily_sales || []
  return sales.map(d => d.date)
})
const chartDatasets = computed(() => {
  const sales = reportData.value?.daily_sales || []
  if (!sales.length) return []
  return [
    { label: 'Revenue', data: sales.map(d => d.revenue || 0), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true },
  ]
})

// Category chart - use category_breakdown from backend
const categoryLabels = computed(() => {
  const cats = reportData.value?.category_breakdown || []
  return cats.map(c => c.category_name || 'Unknown')
})
const categoryData = computed(() => {
  const cats = reportData.value?.category_breakdown || []
  return cats.map(c => c.revenue || 0)
})

// Daily breakdown table - use daily_sales
const dailyBreakdown = computed(() => {
  const sales = reportData.value?.daily_sales || []
  return sales.map(d => ({
    date: d.date,
    revenue: d.revenue || 0,
    orders: d.orders || 0,
    aov: d.orders > 0 ? (d.revenue / d.orders) : 0,
  }))
})

// Top products
const topProducts = computed(() => reportData.value?.top_products || [])

// Daily breakdown table
const dailyColumns = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'revenue', label: 'Revenue', align: 'right' as const, sortable: true },
  { key: 'orders', label: 'Orders', align: 'right' as const, sortable: true },
  { key: 'aov', label: 'AOV', align: 'right' as const },
]

// Fetch data
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const response = await api.get<{ data: SalesReportData }>('/vendor/reports/sales', {
      params: { period: period.value },
    })
    reportData.value = response.data.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load sales report'
  } finally {
    isLoading.value = false
  }
}

// Export
async function handleExport() {
  isExporting.value = true
  try {
    const response = await api.get('/vendor/reports/sales/export', {
      params: { period: period.value },
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${Date.now()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Export failed'
  } finally {
    isExporting.value = false
  }
}

watch(period, fetchData)

onMounted(() => {
  breadcrumbStore.setPageInfo('Sales Report', [
    { label: 'Reports', to: '/vendor/reports' },
    { label: 'Sales Report' },
  ], 'Detailed sales performance report')
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error Banner -->
    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sales Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Detailed breakdown of your sales performance</p>
      </div>
      <div class="flex items-center gap-3">
        <FormSelect v-model="period" :options="periodOptions" class="w-40" />
        <BaseButton :loading="isExporting" variant="secondary" @click="handleExport">
          <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
          Export
        </BaseButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <AppSpinner size="lg" />
    </div>

    <template v-else-if="reportData">
      <!-- Stats -->
      <div class="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          v-for="stat in stats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
        />
      </div>

      <!-- Revenue Chart -->
      <BaseCard title="Revenue Trend">
        <LineChart
          v-if="chartLabels.length"
          :labels="chartLabels"
          :datasets="chartDatasets"
          :height="320"
          :show-legend="true"
        />
        <p v-else class="py-8 text-center text-gray-500">No chart data available</p>
      </BaseCard>

      <!-- Charts row -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Revenue by Category -->
        <BaseCard title="Revenue by Category">
          <DoughnutChart
            v-if="categoryLabels.length"
            :labels="categoryLabels"
            :data="categoryData"
            :height="280"
          />
          <p v-else class="py-8 text-center text-gray-500">No category data</p>
        </BaseCard>

        <!-- Payment Methods - Not available from backend -->
        <BaseCard title="Top Products">
          <div v-if="topProducts.length" class="space-y-3">
            <div
              v-for="product in topProducts"
              :key="product.product_id"
              class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
            >
              <div>
                <span class="font-medium text-gray-900 dark:text-white">{{ product.product_name }}</span>
                <p class="text-xs text-gray-500">{{ product.quantity_sold }} sold</p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(product.revenue) }}</p>
                <p class="text-xs text-gray-500">{{ product.orders_count }} orders</p>
              </div>
            </div>
          </div>
          <p v-else class="py-8 text-center text-gray-500">No products data</p>
        </BaseCard>
      </div>

      <!-- Daily Breakdown -->
      <BaseCard title="Daily Breakdown">
        <DataTable
          :columns="dailyColumns"
          :data="dailyBreakdown"
          :loading="false"
          :total="dailyBreakdown.length"
          :current-page="1"
          :per-page="31"
        >
          <template #cell-date="{ row }">
            <span class="text-gray-900 dark:text-white">{{ formatDate(row.date) }}</span>
          </template>
          <template #cell-revenue="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue) }}</span>
          </template>
          <template #cell-orders="{ row }">
            <span class="text-gray-600 dark:text-gray-400">{{ row.orders }}</span>
          </template>
          <template #cell-aov="{ row }">
            <span class="text-gray-600 dark:text-gray-400">{{ formatCurrency(row.aov) }}</span>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
