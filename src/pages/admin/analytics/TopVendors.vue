<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Top Vendors Analytics — Best performing vendors                  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import { useCurrency } from '@/composables'
import type { AnalyticsTopVendor, AnalyticsParams } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import { StarIcon } from '@heroicons/vue/24/solid'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

onMounted(() => {
  breadcrumbStore.setPageInfo('Top Vendors', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Analytics' },
    { label: 'Top Vendors' },
  ], 'Best performing vendors by revenue')
})

const isLoading = ref(true)
const period = ref('month')
const vendors = ref<AnalyticsTopVendor[]>([])

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
    const params: AnalyticsParams = { period: period.value as any, limit: 20 }
    vendors.value = await analyticsService.getTopVendors(params)
  } catch (e) {
    console.error('Failed to load top vendors', e)
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadData())
onMounted(() => loadData())
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <FormSelect v-model="period" :options="periodOptions" class="w-40" />
    </div>

    <BaseCard padding="none">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">#</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Store</th>
              <th class="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Owner</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Orders</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Revenue</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Products</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Commission</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Rating</th>
              <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Trend</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <template v-if="isLoading">
              <tr v-for="n in 10" :key="n">
                <td v-for="c in 9" :key="c" class="px-6 py-4">
                  <div class="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </td>
              </tr>
            </template>
            <tr
              v-else
              v-for="(v, idx) in vendors"
              :key="v.vendor_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-6 py-4 font-medium text-gray-500">{{ idx + 1 }}</td>
              <td class="px-6 py-4">
                <RouterLink
                  :to="`/admin/vendors/${v.vendor_id}`"
                  class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  {{ v.store_name }}
                </RouterLink>
              </td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ v.owner_name }}</td>
              <td class="px-6 py-4 text-right text-gray-900 dark:text-white">{{ v.total_orders.toLocaleString() }}</td>
              <td class="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(v.total_revenue) }}</td>
              <td class="px-6 py-4 text-right text-gray-900 dark:text-white">{{ v.total_products }}</td>
              <td class="px-6 py-4 text-right text-gray-900 dark:text-white">{{ formatCurrency(v.commission_earned) }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <StarIcon class="h-4 w-4 text-yellow-400" />
                  <span class="text-gray-900 dark:text-white">{{ v.average_rating != null ? Number(v.average_rating).toFixed(1) : '—' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1 text-sm">
                  <component
                    :is="v.trend === 'up' ? ArrowUpIcon : v.trend === 'down' ? ArrowDownIcon : null"
                    v-if="v.trend !== 'neutral'"
                    class="h-4 w-4"
                    :class="v.trend === 'up' ? 'text-success-500' : 'text-danger-500'"
                  />
                  <span :class="v.trend === 'up' ? 'text-success-600' : v.trend === 'down' ? 'text-danger-600' : 'text-gray-500'">
                    {{ v.change_percent > 0 ? '+' : '' }}{{ v.change_percent }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!isLoading && vendors.length === 0" class="p-12 text-center text-gray-400">
          No vendor data available
        </div>
      </div>
    </BaseCard>
  </div>
</template>
