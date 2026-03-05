<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Export Center — Export orders, products, customers, vendors      -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import type { ExportFilters } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormInput from '@/components/form/FormInput.vue'
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()

onMounted(() => {
  breadcrumbStore.setPageInfo('Export Center', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Export / Import' },
    { label: 'Export' },
  ], 'Export data to Excel or CSV')
})

// ── State ──
const activeTab = ref<'orders' | 'products' | 'customers' | 'vendors'>('orders')
const exporting = ref(false)
const exportResult = ref<{ success: boolean; message: string } | null>(null)

const filters = reactive<ExportFilters>({
  format: 'xlsx',
  status: '',
  payment_status: '',
  start_date: '',
  end_date: '',
  category_id: undefined,
  low_stock: false,
})

const tabs = [
  { key: 'orders' as const, label: 'Orders', icon: ShoppingCartIcon },
  { key: 'products' as const, label: 'Products', icon: ShoppingBagIcon },
  { key: 'customers' as const, label: 'Customers', icon: UsersIcon },
  { key: 'vendors' as const, label: 'Vendors', icon: BuildingStorefrontIcon },
]

const formatOptions = [
  { label: 'Excel (.xlsx)', value: 'xlsx' },
  { label: 'CSV (.csv)', value: 'csv' },
]

const orderStatusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const paymentStatusOptions = [
  { label: 'All Payment Status', value: '' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
]

const productStatusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Inactive', value: 'inactive' },
]

function cleanFilters(): ExportFilters {
  const clean: ExportFilters = { format: filters.format }
  if (filters.status) clean.status = filters.status
  if (filters.payment_status) clean.payment_status = filters.payment_status
  if (filters.start_date) clean.start_date = filters.start_date
  if (filters.end_date) clean.end_date = filters.end_date
  if (filters.category_id) clean.category_id = filters.category_id
  if (filters.low_stock) clean.low_stock = true
  return clean
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function handleExport() {
  exporting.value = true
  exportResult.value = null
  try {
    const f = cleanFilters()
    const ext = filters.format === 'csv' ? 'csv' : 'xlsx'
    let blob: Blob
    let filename: string

    switch (activeTab.value) {
      case 'orders':
        blob = await analyticsService.exportOrders(f)
        filename = `orders-export.${ext}`
        break
      case 'products':
        blob = await analyticsService.exportProducts(f)
        filename = `products-export.${ext}`
        break
      case 'customers':
        blob = await analyticsService.exportCustomers(f)
        filename = `customers-export.${ext}`
        break
      case 'vendors':
        blob = await analyticsService.exportVendors(f)
        filename = `vendors-export.${ext}`
        break
    }

    downloadBlob(blob!, filename!)
    exportResult.value = { success: true, message: `${activeTab.value} exported successfully!` }
  } catch (e: any) {
    exportResult.value = { success: false, message: e?.response?.data?.message || 'Export failed. Please try again.' }
  } finally {
    exporting.value = false
  }
}

function resetFilters() {
  filters.status = ''
  filters.payment_status = ''
  filters.start_date = ''
  filters.end_date = ''
  filters.category_id = undefined
  filters.low_stock = false
  exportResult.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- Tab navigation -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex gap-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === tab.key
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
          @click="activeTab = tab.key; resetFilters()"
        >
          <component :is="tab.icon" class="h-5 w-5" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Result alert -->
    <div
      v-if="exportResult"
      class="rounded-lg border p-4"
      :class="exportResult.success
        ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20'
        : 'border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20'"
    >
      <div class="flex items-center gap-2">
        <component
          :is="exportResult.success ? CheckCircleIcon : ExclamationCircleIcon"
          class="h-5 w-5"
          :class="exportResult.success ? 'text-success-600' : 'text-danger-600'"
        />
        <p
          class="text-sm"
          :class="exportResult.success ? 'text-success-700 dark:text-success-400' : 'text-danger-700 dark:text-danger-400'"
        >
          {{ exportResult.message }}
        </p>
      </div>
    </div>

    <!-- Export form -->
    <BaseCard>
      <template #header>
        <div class="flex items-center gap-2">
          <DocumentArrowDownIcon class="h-5 w-5 text-gray-500" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Export {{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Format -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Format</label>
            <FormSelect v-model="filters.format" :options="formatOptions" />
          </div>

          <!-- Date range (for all) -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
            <FormInput v-model="filters.start_date" type="date" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
            <FormInput v-model="filters.end_date" type="date" />
          </div>
        </div>

        <!-- Order-specific filters -->
        <div v-if="activeTab === 'orders'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Order Status</label>
            <FormSelect v-model="filters.status" :options="orderStatusOptions" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
            <FormSelect v-model="filters.payment_status" :options="paymentStatusOptions" />
          </div>
        </div>

        <!-- Product-specific filters -->
        <div v-if="activeTab === 'products'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Product Status</label>
            <FormSelect v-model="filters.status" :options="productStatusOptions" />
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input v-model="filters.low_stock" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600" />
              Low stock only
            </label>
          </div>
        </div>

        <!-- Customer/Vendor status filter -->
        <div v-if="activeTab === 'customers' || activeTab === 'vendors'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <FormSelect
              v-model="filters.status"
              :options="[
                { label: 'All', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <BaseButton :loading="exporting" @click="handleExport">
            <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
            Export {{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}
          </BaseButton>
          <BaseButton variant="secondary" @click="resetFilters">
            Reset Filters
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
