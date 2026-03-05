<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Revenue by Category — Category-wise revenue breakdown            -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import type { RevenueByCategory, AnalyticsParams } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import FormSelect from '@/components/form/FormSelect.vue'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

onMounted(() => {
  breadcrumbStore.setPageInfo('Revenue by Category', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Analytics' },
    { label: 'Categories' },
  ], 'Revenue distribution across product categories')
})

const isLoading = ref(true)
const period = ref('month')
const categories = ref<RevenueByCategory[]>([])

const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
]

async function loadData() {
  isLoading.value = true
  try {
    const params: AnalyticsParams = { period: period.value as any }
    categories.value = await analyticsService.getRevenueByCategory(params)
  } catch (e) {
    console.error('Failed to load category revenue', e)
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadData())
onMounted(() => loadData())

const chartLabels = computed(() => categories.value.map(c => c.category_name))
const chartData = computed(() => categories.value.map(c => c.total_revenue))
const barDatasets = computed(() => [
  { label: 'Revenue', data: categories.value.map(c => c.total_revenue) },
])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <FormSelect v-model="period" :options="periodOptions" class="w-40" />
    </div>

    <!-- Charts -->
    <div class="grid gap-6 lg:grid-cols-2">
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Revenue Distribution</h3>
        </template>
        <DoughnutChart
          v-if="!isLoading && chartLabels.length"
          :labels="chartLabels"
          :data="chartData"
          :height="320"
        />
        <div v-else-if="isLoading" class="flex h-80 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-80 items-center justify-center text-gray-400">No data</div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Revenue by Category</h3>
        </template>
        <BarChart
          v-if="!isLoading && chartLabels.length"
          :labels="chartLabels"
          :datasets="barDatasets"
          :height="320"
          :horizontal="true"
        />
        <div v-else-if="isLoading" class="flex h-80 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
        <div v-else class="flex h-80 items-center justify-center text-gray-400">No data</div>
      </BaseCard>
    </div>

    <!-- Table -->
    <BaseCard padding="none">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Revenue</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Share</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Orders</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Items</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <template v-if="isLoading">
              <tr v-for="n in 8" :key="n">
                <td v-for="c in 5" :key="c" class="px-6 py-4">
                  <div class="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </td>
              </tr>
            </template>
            <tr
              v-else
              v-for="cat in categories"
              :key="cat.category_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ cat.category_name }}</td>
              <td class="px-6 py-4 text-right text-gray-900 dark:text-white">{{ formatCurrency(cat.total_revenue) }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <div class="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div class="h-full rounded-full bg-primary-500" :style="{ width: cat.percentage + '%' }" />
                  </div>
                  <span class="text-gray-600 dark:text-gray-400">{{ cat.percentage.toFixed(1) }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{{ cat.total_orders.toLocaleString() }}</td>
              <td class="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{{ cat.total_items.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!isLoading && categories.length === 0" class="p-12 text-center text-gray-400">No data</div>
      </div>
    </BaseCard>
  </div>
</template>
