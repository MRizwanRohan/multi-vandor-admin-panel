<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Report — Per-vendor performance metrics                    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import {
  BuildingStorefrontIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  StarIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const searchQuery = ref('')
const statusFilter = ref('all')
const sortBy = ref('revenue')
const isLoading = ref(false)

const stats = [
  { title: 'Total Vendors', value: '156', icon: BuildingStorefrontIcon, change: 12, trend: 'up' as const, changeLabel: 'this month', color: 'primary' as const },
  { title: 'Active Vendors', value: '142', icon: ArrowTrendingUpIcon, change: 5, trend: 'up' as const, changeLabel: 'this month', color: 'success' as const },
  { title: 'Vendor Revenue', value: formatCurrency(2560400), icon: CurrencyDollarIcon, change: 8.3, trend: 'up' as const, changeLabel: 'vs last month', color: 'info' as const },
  { title: 'Avg. Rating', value: '4.3', icon: StarIcon, change: 0.2, trend: 'up' as const, changeLabel: 'vs last month', color: 'warning' as const },
]

// Top vendors by revenue chart
const vendorChartLabels = ['TechMart', 'FashionHub', 'HomeLiving', 'KidZone', 'SportGear', 'FoodFresh']
const vendorRevenueData = [580000, 420000, 350000, 280000, 210000, 180000]

// Vendor status distribution
const statusLabels = ['Active', 'Pending', 'Suspended', 'Inactive']
const statusData = [142, 8, 3, 3]

const vendors = ref([
  { id: 1, name: 'TechMart Electronics', email: 'tech@mart.com', status: 'active', products: 245, orders: 1823, revenue: 580000, commission: 58000, rating: 4.7, joined: '2025-01-15' },
  { id: 2, name: 'FashionHub BD', email: 'info@fashionhub.bd', status: 'active', products: 412, orders: 1456, revenue: 420000, commission: 42000, rating: 4.5, joined: '2025-02-01' },
  { id: 3, name: 'HomeLiving Store', email: 'hello@homeliving.com', status: 'active', products: 189, orders: 987, revenue: 350000, commission: 35000, rating: 4.3, joined: '2025-03-10' },
  { id: 4, name: 'KidZone', email: 'support@kidzone.bd', status: 'active', products: 156, orders: 745, revenue: 280000, commission: 28000, rating: 4.6, joined: '2025-04-22' },
  { id: 5, name: 'SportGear Pro', email: 'sales@sportgear.com', status: 'active', products: 98, orders: 523, revenue: 210000, commission: 21000, rating: 4.1, joined: '2025-05-18' },
  { id: 6, name: 'FoodFresh Market', email: 'order@foodfresh.bd', status: 'pending', products: 67, orders: 312, revenue: 180000, commission: 18000, rating: 4.0, joined: '2025-06-01' },
  { id: 7, name: 'BookWorld BD', email: 'info@bookworld.bd', status: 'active', products: 320, orders: 289, revenue: 145000, commission: 14500, rating: 4.4, joined: '2025-07-12' },
  { id: 8, name: 'GadgetStore', email: 'hi@gadgetstore.com', status: 'suspended', products: 45, orders: 156, revenue: 98000, commission: 9800, rating: 3.2, joined: '2025-08-05' },
])

const columns = [
  { key: 'name', label: 'Vendor', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'products', label: 'Products', align: 'right' as const, sortable: true },
  { key: 'orders', label: 'Orders', align: 'right' as const, sortable: true },
  { key: 'revenue', label: 'Revenue', align: 'right' as const, sortable: true },
  { key: 'commission', label: 'Commission', align: 'right' as const },
  { key: 'rating', label: 'Rating', align: 'center' as const, sortable: true },
  { key: 'actions', label: '', align: 'center' as const },
]

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    active: 'success',
    pending: 'warning',
    suspended: 'danger',
    inactive: 'info',
  }
  return map[status] ?? 'info'
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Vendor Report', [
    { label: 'Reports' },
    { label: 'Vendors' },
  ], 'Per-vendor performance metrics and analytics')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Vendor Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Performance metrics for all marketplace vendors</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <ArrowDownTrayIcon class="h-4 w-4" />
        Export Report
      </button>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :change="stat.change"
        :trend="stat.trend"
        :change-label="stat.changeLabel"
        :color="stat.color"
      />
    </div>

    <!-- Charts -->
    <div class="grid gap-6 lg:grid-cols-2">
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Top Vendors by Revenue</h3>
        <BarChart
          :labels="vendorChartLabels"
          :datasets="[{ label: 'Revenue', data: vendorRevenueData }]"
          :height="280"
          :show-legend="false"
        />
      </BaseCard>
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Vendor Status Distribution</h3>
        <DoughnutChart
          :labels="statusLabels"
          :data="statusData"
          :height="280"
        />
      </BaseCard>
    </div>

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
        <FormSelect
          v-model="statusFilter"
          :options="[
            { label: 'All Statuses', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Pending', value: 'pending' },
            { label: 'Suspended', value: 'suspended' },
          ]"
          class="w-36"
        />
        <FormSelect
          v-model="sortBy"
          :options="[
            { label: 'Revenue', value: 'revenue' },
            { label: 'Orders', value: 'orders' },
            { label: 'Rating', value: 'rating' },
            { label: 'Products', value: 'products' },
          ]"
          class="w-32"
        />
      </div>

      <DataTable
        :columns="columns"
        :data="vendors"
        :loading="isLoading"
        :total="vendors.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.email }}</p>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span
            :class="{
              'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400': getStatusVariant(row.status) === 'success',
              'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400': getStatusVariant(row.status) === 'warning',
              'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400': getStatusVariant(row.status) === 'danger',
              'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-400': getStatusVariant(row.status) === 'info',
            }"
            class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          >
            {{ row.status }}
          </span>
        </template>

        <template #cell-revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.revenue) }}</span>
        </template>

        <template #cell-commission="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatCurrency(row.commission) }}</span>
        </template>

        <template #cell-rating="{ row }">
          <div class="flex items-center justify-center gap-1">
            <StarIcon class="h-4 w-4 text-yellow-400" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ row.rating }}</span>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <router-link
            :to="`/admin/vendors/${row.id}`"
            class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <EyeIcon class="h-4 w-4" />
          </router-link>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
