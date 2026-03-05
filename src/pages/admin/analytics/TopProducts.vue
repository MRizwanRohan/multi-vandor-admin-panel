<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Top Products Analytics — Best selling products table             -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import type { AnalyticsTopProduct, AnalyticsParams } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import { StarIcon } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

onMounted(() => {
  breadcrumbStore.setPageInfo('Top Products', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Analytics' },
    { label: 'Top Products' },
  ], 'Best-selling products by revenue and quantity')
})

const isLoading = ref(true)
const error = ref<string | null>(null)
const period = ref('month')
const limit = ref(20)
const products = ref<AnalyticsTopProduct[]>([])

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
    const params: AnalyticsParams = { period: period.value as any, limit: limit.value }
    const result = await analyticsService.getTopProducts(params)
    products.value = Array.isArray(result) ? result : []
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load top products'
    console.error('Failed to load top products', e)
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadData())
onMounted(() => loadData())
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

    <BaseCard padding="none">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">#</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Vendor</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Sold</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Revenue</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Rating</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <!-- Loading skeleton -->
            <template v-if="isLoading">
              <tr v-for="n in 10" :key="n">
                <td v-for="c in 7" :key="c" class="px-6 py-4">
                  <div class="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </td>
              </tr>
            </template>
            <!-- Data rows -->
            <tr
              v-else
              v-for="(p, idx) in products"
              :key="p.product_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-6 py-4 font-medium text-gray-500">{{ idx + 1 }}</td>
              <td class="px-6 py-4">
                <RouterLink
                  :to="`/admin/products/${p.product_id}`"
                  class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  {{ p.product_name }}
                </RouterLink>
              </td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ p.category }}</td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ p.vendor_store }}</td>
              <td class="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{{ p.total_sold.toLocaleString() }}</td>
              <td class="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(p.total_revenue) }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <StarIcon class="h-4 w-4 text-yellow-400" />
                  <span class="text-gray-900 dark:text-white">{{ p.average_rating?.toFixed(1) || '—' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!isLoading && products.length === 0" class="p-12 text-center text-gray-400">
          No product data available
        </div>
      </div>
    </BaseCard>
  </div>
</template>
