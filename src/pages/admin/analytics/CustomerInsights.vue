<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Customer Insights — Customer analytics & acquisition             -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import { useDate } from '@/composables/useDate'
import type { CustomerInsightsResponse, AnalyticsParams } from '@/types'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  UsersIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

onMounted(() => {
  breadcrumbStore.setPageInfo('Customer Insights', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Analytics' },
    { label: 'Customers' },
  ], 'Customer acquisition and retention analytics')
})

const isLoading = ref(true)
const error = ref<string | null>(null)
const period = ref('month')
const data = ref<CustomerInsightsResponse | null>(null)

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
    const params: AnalyticsParams = { period: period.value as any }
    data.value = await analyticsService.getCustomerInsights(params)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load customer insights'
    console.error('Failed to load customer insights', e)
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadData())
onMounted(() => loadData())

const stats = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { title: 'Total Customers', value: d.total_customers.toLocaleString(), icon: UsersIcon, change: d.comparison?.total_change, color: 'primary' as const },
    { title: 'New Customers', value: d.new_customers.toLocaleString(), icon: UserPlusIcon, change: d.comparison?.new_change, color: 'success' as const },
    { title: 'Returning', value: d.returning_customers.toLocaleString(), icon: ArrowPathIcon, color: 'info' as const },
    { title: 'New/Return Ratio', value: (d.new_vs_returning_ratio * 100).toFixed(1) + '%', icon: ChartBarIcon, color: 'warning' as const },
  ]
})

const acquisitionLabels = computed(() => data.value?.customer_acquisition?.labels || [])
const acquisitionDatasets = computed(() => {
  if (!data.value?.customer_acquisition) return []
  return [{ label: 'New Customers', data: data.value.customer_acquisition.data }]
})

const newVsReturning = computed(() => {
  if (!data.value) return { labels: [], data: [] }
  return {
    labels: ['New Customers', 'Returning Customers'],
    data: [data.value.new_customers, data.value.returning_customers],
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
        <p class="text-sm text-danger-700 dark:text-danger-400">{{ error }}</p>
        <button class="ml-auto text-sm font-medium text-danger-600 hover:text-danger-500" @click="loadData">Retry</button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <FormSelect v-model="period" :options="periodOptions" class="w-40" />
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="s in stats"
        :key="s.title"
        :title="s.title"
        :value="s.value"
        :icon="s.icon"
        :change="s.change"
        :trend="s.change !== undefined ? (s.change >= 0 ? 'up' : 'down') : undefined"
        :color="s.color"
        :loading="isLoading"
      />
      <template v-if="isLoading && stats.length === 0">
        <StatCard v-for="n in 4" :key="n" title="Loading..." value="—" :loading="true" />
      </template>
    </div>

    <!-- Charts -->
    <div class="grid gap-6 lg:grid-cols-2">
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Customer Acquisition</h3>
        </template>
        <BarChart
          v-if="!isLoading && acquisitionLabels.length"
          :labels="acquisitionLabels"
          :datasets="acquisitionDatasets"
          :height="300"
        />
        <div v-else-if="isLoading" class="flex h-72 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-72 items-center justify-center text-gray-400">No data</div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">New vs Returning</h3>
        </template>
        <DoughnutChart
          v-if="!isLoading && newVsReturning.data.length"
          :labels="newVsReturning.labels"
          :data="newVsReturning.data"
          :height="300"
          :colors="['#10b981', '#6366f1']"
        />
        <div v-else-if="isLoading" class="flex h-72 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-72 items-center justify-center text-gray-400">No data</div>
      </BaseCard>
    </div>

    <!-- Top Customers Table -->
    <BaseCard padding="none">
      <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Top Customers</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">#</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Orders</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total Spent</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Last Order</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <template v-if="isLoading">
              <tr v-for="n in 5" :key="n">
                <td v-for="c in 6" :key="c" class="px-6 py-4">
                  <div class="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </td>
              </tr>
            </template>
            <tr
              v-else
              v-for="(cust, idx) in data?.top_customers || []"
              :key="cust.customer_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-6 py-4 font-medium text-gray-500">{{ idx + 1 }}</td>
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ cust.name }}</td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ cust.email }}</td>
              <td class="px-6 py-4 text-right text-gray-900 dark:text-white">{{ cust.total_orders }}</td>
              <td class="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(cust.total_spent) }}</td>
              <td class="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{{ formatDate(cust.last_order_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!isLoading && (!data?.top_customers || data.top_customers.length === 0)" class="p-12 text-center text-gray-400">
          No customer data available
        </div>
      </div>
    </BaseCard>
  </div>
</template>
