<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Report — Per-vendor performance metrics                    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { analyticsService } from '@/services'
import type { AnalyticsTopVendor, AnalyticsParams } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormInput from '@/components/form/FormInput.vue'
import DataTable from '@/components/data/DataTable.vue'
import BarChart from '@/components/charts/BarChart.vue'
import {
  BuildingStorefrontIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  StarIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const searchQuery = ref('')
const period = ref('month')
const isLoading = ref(true)
const error = ref<string | null>(null)
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
  error.value = null
  try {
    const params: AnalyticsParams = { period: period.value as any, limit: 50 }
    vendors.value = await analyticsService.getTopVendors(params)
    if (!Array.isArray(vendors.value)) vendors.value = []
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load vendor report'
    console.error('Failed to load vendor report', e)
  } finally {
    isLoading.value = false
  }
}

watch(period, () => loadData())
onMounted(() => {
  loadData()
  breadcrumbStore.setPageInfo('Vendor Report', [
    { label: 'Reports' },
    { label: 'Vendors' },
  ], 'Per-vendor performance metrics and analytics')
})

// Computed stats
const stats = computed(() => {
  const total = vendors.value.length
  const totalRevenue = vendors.value.reduce((s, v) => s + (v.total_revenue || 0), 0)
  const totalOrders = vendors.value.reduce((s, v) => s + (v.total_orders || 0), 0)
  const avgRating = total ? vendors.value.reduce((s, v) => s + Number(v.average_rating || 0), 0) / total : 0
  return [
    { title: 'Total Vendors', value: total.toLocaleString(), icon: BuildingStorefrontIcon, color: 'primary' as const },
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: CurrencyDollarIcon, color: 'success' as const },
    { title: 'Total Orders', value: totalOrders.toLocaleString(), icon: ArrowTrendingUpIcon, color: 'info' as const },
    { title: 'Avg. Rating', value: avgRating.toFixed(1), icon: StarIcon, color: 'warning' as const },
  ]
})

// Chart data - top 10 vendors by revenue
const chartVendors = computed(() => vendors.value.slice(0, 10))
const vendorChartLabels = computed(() => chartVendors.value.map(v => v.store_name))
const vendorRevenueData = computed(() => chartVendors.value.map(v => v.total_revenue))

// Filtered vendors
const filteredVendors = computed(() => {
  if (!searchQuery.value) return vendors.value
  const q = searchQuery.value.toLowerCase()
  return vendors.value.filter(v =>
    v.store_name.toLowerCase().includes(q) || v.owner_name.toLowerCase().includes(q)
  )
})

const columns = [
  { key: 'store_name', label: 'Vendor', sortable: true },
  { key: 'total_products', label: 'Products', align: 'right' as const, sortable: true },
  { key: 'total_orders', label: 'Orders', align: 'right' as const, sortable: true },
  { key: 'total_revenue', label: 'Revenue', align: 'right' as const, sortable: true },
  { key: 'commission_earned', label: 'Commission', align: 'right' as const },
  { key: 'average_rating', label: 'Rating', align: 'center' as const, sortable: true },
  { key: 'trend', label: 'Trend', align: 'center' as const },
  { key: 'actions', label: '', align: 'center' as const },
]

async function handleExport() {
  try {
    const blob = await analyticsService.exportVendors({ period: period.value })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-report-${period.value}.csv`
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
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Vendor Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Performance metrics for all marketplace vendors</p>
      </div>
      <div class="flex items-center gap-3">
        <FormSelect v-model="period" :options="periodOptions" class="w-40" />
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="handleExport"
        >
          <ArrowDownTrayIcon class="h-4 w-4" />
          Export Report
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

    <!-- Chart -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Top Vendors by Revenue</h3>
      <BarChart
        v-if="!isLoading && vendorChartLabels.length"
        :labels="vendorChartLabels"
        :datasets="[{ label: 'Revenue', data: vendorRevenueData }]"
        :height="280"
        :show-legend="false"
      />
      <div v-else-if="isLoading" class="flex h-64 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <div v-else class="flex h-64 items-center justify-center text-gray-400">No data</div>
    </BaseCard>

    <!-- Vendor Table -->
    <BaseCard>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            placeholder="Search vendors..."
            class="pl-10"
          />
        </div>
      </div>

      <DataTable
        :columns="columns"
        :data="filteredVendors"
        :loading="isLoading"
        :total="filteredVendors.length"
        :current-page="1"
        :per-page="50"
      >
        <template #cell-store_name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.store_name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.owner_name }}</p>
          </div>
        </template>

        <template #cell-total_revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.total_revenue) }}</span>
        </template>

        <template #cell-commission_earned="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatCurrency(row.commission_earned) }}</span>
        </template>

        <template #cell-average_rating="{ row }">
          <div class="flex items-center justify-center gap-1">
            <StarIcon class="h-4 w-4 text-yellow-400" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ row.average_rating != null ? Number(row.average_rating).toFixed(1) : '—' }}</span>
          </div>
        </template>

        <template #cell-trend="{ row }">
          <span
            :class="row.trend === 'up' ? 'text-success-600 dark:text-success-400' : row.trend === 'down' ? 'text-danger-600 dark:text-danger-400' : 'text-gray-500'"
            class="text-xs font-medium"
          >
            {{ row.change_percent > 0 ? '+' : '' }}{{ row.change_percent }}%
          </span>
        </template>

        <template #cell-actions="{ row }">
          <router-link
            :to="`/admin/vendors/${row.vendor_id}`"
            class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <EyeIcon class="h-4 w-4" />
          </router-link>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
