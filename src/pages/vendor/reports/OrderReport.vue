<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Order Report — Detailed order analytics with export (API) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency, useDate } from '@/composables'
import api from '@/services/api'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import { BarChart, DoughnutChart } from '@/components/charts'
import {
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

interface OrderReportData {
  summary: {
    total_orders: number
    pending_orders: number
    completed_orders: number
    cancelled_orders: number
    fulfillment_rate: number
    avg_processing_time: number
  }
  by_status: { status: string; count: number; percentage: number }[]
  by_date: { date: string; orders: number; revenue: number }[]
  recent_orders: {
    id: number
    order_number: string
    customer_name: string
    total: number
    status: string
    created_at: string
  }[]
}

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const isExporting = ref(false)
const period = ref<'week' | 'month' | 'quarter' | 'year'>('month')

const reportData = ref<OrderReportData | null>(null)

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
    { title: 'Total Orders', value: String(s.total_orders), icon: ShoppingCartIcon, color: 'primary' as const },
    { title: 'Pending', value: String(s.pending_orders), icon: ClockIcon, color: 'warning' as const },
    { title: 'Completed', value: String(s.completed_orders), icon: CheckCircleIcon, color: 'success' as const },
    { title: 'Cancelled', value: String(s.cancelled_orders), icon: XCircleIcon, color: 'danger' as const },
  ]
})

// Chart data
const dateLabels = computed(() => reportData.value?.by_date?.map(d => d.date) || [])
const ordersDataset = computed(() => reportData.value?.by_date?.map(d => d.orders) || [])

const statusLabels = computed(() => reportData.value?.by_status?.map(s => s.status) || [])
const statusData = computed(() => reportData.value?.by_status?.map(s => s.count) || [])

// Orders table
const orderColumns = [
  { key: 'order_number', label: 'Order #', sortable: true },
  { key: 'customer_name', label: 'Customer' },
  { key: 'total', label: 'Total', align: 'right' as const, sortable: true },
  { key: 'status', label: 'Status', align: 'center' as const },
  { key: 'created_at', label: 'Date', sortable: true },
]

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    completed: 'success', delivered: 'success',
    pending: 'warning', processing: 'info',
    cancelled: 'danger', refunded: 'danger',
  }
  return map[status.toLowerCase()] || 'default'
}

// Fetch data
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const response = await api.get<{ data: OrderReportData }>('/vendor/reports/orders', {
      params: { period: period.value },
    })
    reportData.value = response.data.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load order report'
  } finally {
    isLoading.value = false
  }
}

// Export
async function handleExport() {
  isExporting.value = true
  try {
    const response = await api.get('/vendor/reports/orders/export', {
      params: { period: period.value },
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-report-${Date.now()}.xlsx`
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
  breadcrumbStore.setPageInfo('Order Report', [
    { label: 'Reports', to: '/vendor/reports' },
    { label: 'Order Report' },
  ], 'Detailed order analytics and breakdown')
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
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Order Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Comprehensive order analytics and status breakdown</p>
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

      <!-- Performance Cards -->
      <div class="grid items-stretch gap-4 sm:grid-cols-2">
        <BaseCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Fulfillment Rate</p>
            <p class="mt-2 text-3xl font-bold text-green-600">
              {{ (reportData.summary.fulfillment_rate || 0).toFixed(1) }}%
            </p>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Avg Processing Time</p>
            <p class="mt-2 text-3xl font-bold text-blue-600">
              {{ reportData.summary.avg_processing_time || 0 }} hrs
            </p>
          </div>
        </BaseCard>
      </div>

      <!-- Charts -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Orders Over Time -->
        <BaseCard title="Orders Over Time">
          <BarChart
            v-if="dateLabels.length"
            :labels="dateLabels"
            :datasets="[{ label: 'Orders', data: ordersDataset }]"
            :height="280"
          />
          <p v-else class="py-8 text-center text-gray-500">No data available</p>
        </BaseCard>

        <!-- Orders by Status -->
        <BaseCard title="Orders by Status">
          <DoughnutChart
            v-if="statusLabels.length"
            :labels="statusLabels"
            :data="statusData"
            :height="280"
          />
          <p v-else class="py-8 text-center text-gray-500">No status data</p>
        </BaseCard>
      </div>

      <!-- Recent Orders -->
      <BaseCard title="Recent Orders">
        <DataTable
          :columns="orderColumns"
          :data="reportData.recent_orders || []"
          :loading="false"
          :total="reportData.recent_orders?.length || 0"
          :current-page="1"
          :per-page="10"
        >
          <template #cell-order_number="{ row }">
            <RouterLink
              :to="`/vendor/orders/${row.id}`"
              class="font-medium text-primary-600 hover:underline"
            >
              {{ row.order_number }}
            </RouterLink>
          </template>
          <template #cell-customer_name="{ row }">
            <span class="text-gray-900 dark:text-white">{{ row.customer_name }}</span>
          </template>
          <template #cell-total="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.total) }}</span>
          </template>
          <template #cell-status="{ row }">
            <BaseBadge :variant="getStatusVariant(row.status)">{{ row.status }}</BaseBadge>
          </template>
          <template #cell-created_at="{ row }">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.created_at) }}</span>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
