<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Inventory Analytics — Stock overview and alerts                  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import type { InventoryOverviewResponse } from '@/types'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import {
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

onMounted(() => {
  breadcrumbStore.setPageInfo('Inventory Overview', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Analytics' },
    { label: 'Inventory' },
  ], 'Stock status and alerts overview')
})

const isLoading = ref(true)
const error = ref<string | null>(null)
const data = ref<InventoryOverviewResponse | null>(null)

async function loadData() {
  isLoading.value = true
  error.value = null
  try {
    data.value = await analyticsService.getInventoryOverview()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load inventory overview'
    console.error('Failed to load inventory overview', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadData())

const stats = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { title: 'Total Products', value: d.total_products.toLocaleString(), icon: CubeIcon, color: 'primary' as const },
    { title: 'In Stock', value: d.in_stock.toLocaleString(), icon: CheckCircleIcon, color: 'success' as const },
    { title: 'Low Stock', value: d.low_stock.toLocaleString(), icon: ExclamationTriangleIcon, color: 'warning' as const },
    { title: 'Out of Stock', value: d.out_of_stock.toLocaleString(), icon: XCircleIcon, color: 'danger' as const },
    { title: 'Stock Value', value: formatCurrency(d.total_stock_value), icon: CurrencyDollarIcon, color: 'info' as const },
  ]
})

const stockChartLabels = computed(() => ['In Stock', 'Low Stock', 'Out of Stock'])
const stockChartData = computed(() => data.value ? [data.value.in_stock, data.value.low_stock, data.value.out_of_stock] : [])
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

    <!-- Stats -->
    <div class="grid items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      <StatCard
        v-for="s in stats"
        :key="s.title"
        :title="s.title"
        :value="s.value"
        :icon="s.icon"
        :color="s.color"
        :loading="isLoading"
      />
      <template v-if="isLoading && stats.length === 0">
        <StatCard v-for="n in 5" :key="n" title="Loading..." value="—" :loading="true" />
      </template>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Stock distribution chart -->
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Stock Distribution</h3>
        </template>
        <DoughnutChart
          v-if="!isLoading && stockChartData.length"
          :labels="stockChartLabels"
          :data="stockChartData"
          :colors="['#10b981', '#f59e0b', '#ef4444']"
          :height="280"
        />
        <div v-else-if="isLoading" class="flex h-72 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </BaseCard>

      <!-- Categories with low stock -->
      <BaseCard padding="none" class="lg:col-span-2">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Categories with Low Stock</h3>
        </div>
        <div v-if="isLoading" class="space-y-3 p-6">
          <div v-for="n in 5" :key="n" class="h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Low Stock</th>
                <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Out of Stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="cat in data?.categories_with_low_stock || []"
                :key="cat.category_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="px-6 py-3 font-medium text-gray-900 dark:text-white">{{ cat.category_name }}</td>
                <td class="px-6 py-3 text-right">
                  <span class="inline-flex rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-800 dark:bg-warning-900/50 dark:text-warning-300">
                    {{ cat.low_stock_count }}
                  </span>
                </td>
                <td class="px-6 py-3 text-right">
                  <span class="inline-flex rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-800 dark:bg-danger-900/50 dark:text-danger-300">
                    {{ cat.out_of_stock_count }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!data?.categories_with_low_stock?.length" class="p-8 text-center text-gray-400">
            All categories have healthy stock
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Recent stock alerts -->
    <BaseCard padding="none">
      <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Stock Alerts</h3>
      </div>
      <div v-if="isLoading" class="space-y-3 p-6">
        <div v-for="n in 5" :key="n" class="h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">SKU</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Current Stock</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Threshold</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="alert in data?.recent_stock_alerts || []"
              :key="alert.product_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-6 py-3">
                <RouterLink
                  :to="`/admin/products/${alert.product_id}`"
                  class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  {{ alert.product_name }}
                </RouterLink>
              </td>
              <td class="px-6 py-3 text-gray-600 dark:text-gray-400">{{ alert.sku }}</td>
              <td class="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">{{ alert.current_stock }}</td>
              <td class="px-6 py-3 text-right text-gray-600 dark:text-gray-400">{{ alert.threshold }}</td>
              <td class="px-6 py-3 text-right">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="alert.status === 'out_of_stock'
                    ? 'bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300'
                    : 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300'"
                >
                  {{ alert.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!data?.recent_stock_alerts?.length" class="p-8 text-center text-gray-400">
          No recent stock alerts
        </div>
      </div>
    </BaseCard>
  </div>
</template>
