<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Export Center — Export products and orders (API)          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useNotification } from '@/composables'
import api from '@/services/api'
import type { ExportStatus } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormDatePicker from '@/components/form/FormDatePicker.vue'
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { showSuccess, showError } = useNotification()

// State
const isExportingProducts = ref(false)
const isExportingOrders = ref(false)
const format = ref<'xlsx' | 'csv'>('xlsx')
const dateFrom = ref('')
const dateTo = ref('')
const exportQueue = ref<ExportStatus[]>([])
const pollInterval = ref<number | null>(null)

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
]

// Export Products
async function exportProducts() {
  isExportingProducts.value = true
  try {
    const response = await api.get('/vendor/products/export', {
      params: {
        format: format.value,
        start_date: dateFrom.value || undefined,
        end_date: dateTo.value || undefined,
        queue: true,
      },
    })
    
    // Check if it's queued or direct download
    if (response.data?.data?.id) {
      exportQueue.value.unshift(response.data.data)
      showSuccess('Export started', 'Your export is being processed')
      startPolling()
    } else {
      // Direct download
      const blob = new Blob([response.data], { type: 'application/octet-stream' })
      downloadBlob(blob, `products-${Date.now()}.${format.value}`)
      showSuccess('Export complete', 'Products exported successfully')
    }
  } catch (e: any) {
    showError('Export failed', e.response?.data?.message || 'Failed to export products')
  } finally {
    isExportingProducts.value = false
  }
}

// Export Orders
async function exportOrders() {
  isExportingOrders.value = true
  try {
    const response = await api.get('/vendor/orders/export', {
      params: {
        format: format.value,
        start_date: dateFrom.value || undefined,
        end_date: dateTo.value || undefined,
        queue: true,
      },
    })
    
    if (response.data?.data?.id) {
      exportQueue.value.unshift(response.data.data)
      showSuccess('Export started', 'Your export is being processed')
      startPolling()
    } else {
      const blob = new Blob([response.data], { type: 'application/octet-stream' })
      downloadBlob(blob, `orders-${Date.now()}.${format.value}`)
      showSuccess('Export complete', 'Orders exported successfully')
    }
  } catch (e: any) {
    showError('Export failed', e.response?.data?.message || 'Failed to export orders')
  } finally {
    isExportingOrders.value = false
  }
}

// Download helper
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

// Download completed export
async function downloadExport(exportId: number) {
  try {
    const response = await api.get(`/vendor/exports/${exportId}/download`, {
      responseType: 'blob',
    })
    const exp = exportQueue.value.find(e => e.id === exportId)
    downloadBlob(response.data, exp?.filename || `export-${exportId}.xlsx`)
    showSuccess('Download started', 'File download initiated')
  } catch (e: any) {
    showError('Download failed', e.response?.data?.message || 'Failed to download')
  }
}

// Poll for export status
async function pollStatuses() {
  const pending = exportQueue.value.filter(e => e.status === 'pending' || e.status === 'processing')
  if (pending.length === 0) {
    stopPolling()
    return
  }

  for (const exp of pending) {
    try {
      const response = await api.get<{ data: ExportStatus }>(`/vendor/exports/${exp.id}/status`)
      const idx = exportQueue.value.findIndex(e => e.id === exp.id)
      if (idx !== -1) {
        exportQueue.value[idx] = response.data.data
      }
    } catch {
      // Ignore polling errors
    }
  }
}

function startPolling() {
  if (!pollInterval.value) {
    pollInterval.value = window.setInterval(pollStatuses, 3000)
  }
}

function stopPolling() {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return CheckCircleIcon
    case 'failed': return XCircleIcon
    default: return ClockIcon
  }
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'processing': return 'info'
    default: return 'warning'
  }
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Export Center', [
    { label: 'Export / Import' },
    { label: 'Export Center' },
  ], 'Export your products and orders')
})

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Export Center</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Export your products and orders data</p>
    </div>

    <!-- Export Options -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Export Products -->
      <BaseCard>
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <ShoppingBagIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">Export Products</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Download all your products with details, prices, and inventory
            </p>
            <BaseButton
              class="mt-4"
              :loading="isExportingProducts"
              @click="exportProducts"
            >
              <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
              Export Products
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Export Orders -->
      <BaseCard>
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100 dark:bg-success-900/30">
            <ShoppingCartIcon class="h-6 w-6 text-success-600 dark:text-success-400" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">Export Orders</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Download your order history with customer and payment details
            </p>
            <BaseButton
              class="mt-4"
              variant="success"
              :loading="isExportingOrders"
              @click="exportOrders"
            >
              <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
              Export Orders
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Export Settings -->
    <BaseCard title="Export Settings">
      <div class="grid gap-4 sm:grid-cols-3">
        <FormSelect
          v-model="format"
          name="format"
          label="File Format"
          :options="formatOptions"
        />
        <FormDatePicker
          v-model="dateFrom"
          name="dateFrom"
          label="From Date"
          placeholder="Start date"
        />
        <FormDatePicker
          v-model="dateTo"
          name="dateTo"
          label="To Date"
          placeholder="End date"
        />
      </div>
    </BaseCard>

    <!-- Export Queue -->
    <BaseCard v-if="exportQueue.length" title="Export Queue">
      <div class="space-y-3">
        <div
          v-for="exp in exportQueue"
          :key="exp.id"
          class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
        >
          <div class="flex items-center gap-3">
            <component
              :is="getStatusIcon(exp.status)"
              class="h-5 w-5"
              :class="{
                'text-green-500': exp.status === 'completed',
                'text-red-500': exp.status === 'failed',
                'text-yellow-500 animate-spin': exp.status === 'processing',
                'text-gray-400': exp.status === 'pending',
              }"
            />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ exp.type }} Export</p>
              <p class="text-sm text-gray-500">{{ exp.filename || 'Processing...' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <BaseBadge :variant="getStatusVariant(exp.status)">
              {{ exp.status }}
            </BaseBadge>
            <div v-if="exp.status === 'processing'" class="w-24">
              <div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  class="h-full bg-primary-500 transition-all"
                  :style="{ width: `${exp.progress}%` }"
                />
              </div>
            </div>
            <BaseButton
              v-if="exp.status === 'completed'"
              size="sm"
              @click="downloadExport(exp.id)"
            >
              <DocumentArrowDownIcon class="h-4 w-4" />
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
