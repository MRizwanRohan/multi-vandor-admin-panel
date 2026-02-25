<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Analytics — Analytics dashboard page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import { LineChart, BarChart, DoughnutChart } from '@/components/charts'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Analytics', [
    { label: 'Analytics' },
  ], 'Track your shop performance')
})

// Date range
const dateRange = ref('7days')

const dateRangeOptions = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

// Stats
const stats = computed(() => [
  {
    title: 'Total Revenue',
    value: formatCurrency(285000),
    icon: CurrencyDollarIcon,
    trend: { value: 12.5, type: 'up' as const },
    color: 'primary' as const,
  },
  {
    title: 'Total Orders',
    value: '156',
    icon: ShoppingCartIcon,
    trend: { value: 8.2, type: 'up' as const },
    color: 'success' as const,
  },
  {
    title: 'Product Views',
    value: '4,523',
    icon: EyeIcon,
    trend: { value: 15.3, type: 'up' as const },
    color: 'info' as const,
  },
  {
    title: 'Unique Visitors',
    value: '1,245',
    icon: UserGroupIcon,
    trend: { value: 3.1, type: 'down' as const },
    color: 'warning' as const,
  },
])

// Revenue chart data
const revenueChartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const revenueChartDatasets = [
  {
    label: 'Revenue',
    data: [35000, 42000, 38000, 55000, 48000, 62000, 58000],
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    fill: true,
  },
]

// Orders chart data
const ordersChartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ordersChartDatasets = [
  {
    label: 'Orders',
    data: [12, 19, 15, 25, 22, 30, 28],
    backgroundColor: '#10b981',
  },
]

// Category sales data
const categorySalesLabels = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports']
const categorySalesData = [35, 25, 20, 12, 8]

// Top products
const topProducts = ref([
  { id: '1', name: 'স্মার্ট ওয়াচ প্রো', sales: 45, revenue: 202500 },
  { id: '2', name: 'ওয়্যারলেস হেডফোন', sales: 38, revenue: 95000 },
  { id: '3', name: 'ব্লুটুথ স্পিকার', sales: 32, revenue: 64000 },
  { id: '4', name: 'ফোন কেস', sales: 28, revenue: 14000 },
  { id: '5', name: 'USB কেবল', sales: 25, revenue: 6250 },
])

// Traffic sources
const trafficSources = ref([
  { source: 'Direct', visits: 1250, percentage: 35 },
  { source: 'Search', visits: 980, percentage: 27 },
  { source: 'Social', visits: 750, percentage: 21 },
  { source: 'Referral', visits: 450, percentage: 13 },
  { source: 'Other', visits: 150, percentage: 4 },
])
</script>

<template>
  <div class="space-y-6">
    <!-- Header with date range -->
    <div class="flex items-center justify-between">
      <div />
      <FormSelect
        v-model="dateRange"
        name="dateRange"
        :options="dateRangeOptions"
        class="w-40"
      />
    </div>

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

    <!-- Charts -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Revenue chart -->
      <BaseCard title="Revenue Trend">
        <LineChart
          :labels="revenueChartLabels"
          :datasets="revenueChartDatasets"
          :height="300"
        />
      </BaseCard>

      <!-- Orders chart -->
      <BaseCard title="Orders Overview">
        <BarChart
          :labels="ordersChartLabels"
          :datasets="ordersChartDatasets"
          :height="300"
        />
      </BaseCard>
    </div>

    <!-- Bottom section -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Category sales -->
      <BaseCard title="Sales by Category">
        <DoughnutChart
          :labels="categorySalesLabels"
          :data="categorySalesData"
          :height="250"
        />
      </BaseCard>

      <!-- Top products -->
      <BaseCard title="Top Products">
        <div class="space-y-4">
          <div
            v-for="(product, index) in topProducts"
            :key="product.id"
            class="flex items-center gap-3"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
              :class="[
                index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              ]"
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ product.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ product.sales }} sales
              </p>
            </div>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(product.revenue) }}
            </span>
          </div>
        </div>
      </BaseCard>

      <!-- Traffic sources -->
      <BaseCard title="Traffic Sources">
        <div class="space-y-4">
          <div
            v-for="source in trafficSources"
            :key="source.source"
            class="space-y-2"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-900 dark:text-white">{{ source.source }}</span>
              <span class="text-gray-500 dark:text-gray-400">
                {{ source.visits.toLocaleString() }} visits ({{ source.percentage }}%)
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                class="h-full rounded-full bg-primary-500"
                :style="{ width: `${source.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
