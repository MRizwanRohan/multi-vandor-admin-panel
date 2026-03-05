<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Sales Analytics — Detailed sales analytics (Dynamic API)   -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency, useDate } from '@/composables'
import { analyticsService } from '@/services'
import type { SalesAnalyticsResponse, SalesChartResponse } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormDatePicker from '@/components/form/FormDatePicker.vue'
import { LineChart, BarChart, DoughnutChart } from '@/components/charts'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ReceiptPercentIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const period = ref<'week' | 'month' | 'quarter' | 'year'>('month')
const groupBy = ref<'day' | 'week' | 'month'>('day')

const salesData = ref<SalesAnalyticsResponse | null>(null)
const chartData = ref<SalesChartResponse | null>(null)

const periodOptions = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

const groupByOptions = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

// Computed stats
const stats = computed(() => {
  if (!salesData.value?.overview) return []
  const o = salesData.value.overview
  return [
    {
      title: 'Total Revenue',
      value: formatCurrency(o.total_revenue),
      icon: CurrencyDollarIcon,
      trend: { value: Math.abs(o.revenue_change || 0), type: (o.revenue_change || 0) >= 0 ? 'up' as const : 'down' as const },
      color: 'primary' as const,
    },
    {
      title: 'Total Orders',
      value: String(o.total_orders),
      icon: ShoppingCartIcon,
      trend: { value: Math.abs(o.orders_change || 0), type: (o.orders_change || 0) >= 0 ? 'up' as const : 'down' as const },
      color: 'success' as const,
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(o.average_order_value),
      icon: ReceiptPercentIcon,
      trend: { value: Math.abs(o.aov_change || 0), type: (o.aov_change || 0) >= 0 ? 'up' as const : 'down' as const },
      color: 'info' as const,
    },
    {
      title: 'Conversion Rate',
      value: `${(o.conversion_rate || 0).toFixed(2)}%`,
      icon: ArrowTrendingUpIcon,
      trend: { value: Math.abs(o.conversion_change || 0), type: (o.conversion_change || 0) >= 0 ? 'up' as const : 'down' as const },
      color: 'warning' as const,
    },
  ]
})

// Chart data
const chartLabels = computed(() => chartData.value?.labels || [])
const chartDatasets = computed(() => chartData.value?.datasets || [])

// Payment methods pie chart
const paymentMethodLabels = computed(() => {
  const methods = salesData.value?.payment_methods
  return Array.isArray(methods) ? methods.map(m => m.method) : []
})
const paymentMethodData = computed(() => {
  const methods = salesData.value?.payment_methods
  return Array.isArray(methods) ? methods.map(m => m.total) : []
})

// Fetch data
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const params = { period: period.value, group_by: groupBy.value }
    const [sales, chart] = await Promise.all([
      analyticsService.getSalesAnalytics(params),
      analyticsService.getSalesChart(params),
    ])
    salesData.value = sales
    chartData.value = chart
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load sales analytics'
  } finally {
    isLoading.value = false
  }
}

watch([period, groupBy], fetchData)

onMounted(() => {
  breadcrumbStore.setPageInfo('Sales Analytics', [
    { label: 'Analytics', to: '/vendor/analytics' },
    { label: 'Sales Analytics' },
  ], 'Detailed sales performance analysis')
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error Banner -->
    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center justify-end gap-4">
      <FormSelect v-model="period" name="period" :options="periodOptions" class="w-40" />
      <FormSelect v-model="groupBy" name="groupBy" :options="groupByOptions" class="w-32" />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <template v-else-if="salesData">
      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          v-for="stat in stats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :trend="stat.trend"
          :color="stat.color"
        />
      </div>

      <!-- Sales Chart -->
      <BaseCard title="Sales Trend">
        <LineChart
          v-if="chartLabels.length"
          :labels="chartLabels"
          :datasets="chartDatasets"
          :height="350"
          :show-legend="true"
        />
        <p v-else class="py-8 text-center text-gray-500 dark:text-gray-400">No data available</p>
      </BaseCard>

      <!-- Bottom row -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Payment Methods -->
        <BaseCard title="Revenue by Payment Method">
          <DoughnutChart
            v-if="paymentMethodLabels.length"
            :labels="paymentMethodLabels"
            :data="paymentMethodData"
            :height="280"
          />
          <p v-else class="py-8 text-center text-gray-500 dark:text-gray-400">No payment data</p>
        </BaseCard>

        <!-- Top Categories -->
        <BaseCard title="Revenue by Category">
          <template v-if="salesData.top_categories?.length">
            <div class="space-y-3">
              <div
                v-for="cat in salesData.top_categories"
                :key="cat.id"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div class="h-3 w-3 rounded-full bg-primary-500" />
                  <span class="text-sm text-gray-900 dark:text-white">{{ cat.name }}</span>
                </div>
                <div class="text-right">
                  <p class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(cat.revenue) }}</p>
                  <p class="text-xs text-gray-500">{{ cat.orders }} orders</p>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="py-8 text-center text-gray-500 dark:text-gray-400">No category data</p>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
