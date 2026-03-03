<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Inventory Overview — Stats + stock overview table          -->
<!-- Uses /api/v1/admin/inventory endpoints                           -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { inventoryService } from '@/services'
import { usePagination, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type {
  InventoryStats,
  StockOverviewItem,
  StockStatus,
  TableColumn,
} from '@/types'
import {
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BellAlertIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// ── Stats ────────────────────────────────────────────────────────

const stats = ref<InventoryStats | null>(null)
const statsLoading = ref(true)

async function fetchStats() {
  statsLoading.value = true
  try {
    stats.value = await inventoryService.admin.getStats()
  } catch (error) {
    toast.error('Failed to load inventory stats')
  } finally {
    statsLoading.value = false
  }
}

// ── Stock Table ──────────────────────────────────────────────────

const pagination = usePagination()
const stockItems = ref<StockOverviewItem[]>([])
const stockLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref<StockStatus | ''>('')

const columns: TableColumn[] = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'stockQuantity', label: 'Stock', sortable: true, align: 'center' },
  { key: 'reservedQuantity', label: 'Reserved', align: 'center' },
  { key: 'availableQuantity', label: 'Available', align: 'center' },
  { key: 'lowStockThreshold', label: 'Threshold', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

async function fetchStock() {
  stockLoading.value = true
  try {
    const response = await inventoryService.admin.getAllStock({
      page: pagination.currentPage.value,
      perPage: pagination.perPage.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
    })
    stockItems.value = response.data
    if (response.meta) {
      pagination.setMeta(response.meta)
    }
  } catch (error) {
    toast.error('Failed to load stock overview')
  } finally {
    stockLoading.value = false
  }
}

// ── Stock Adjust Modal ───────────────────────────────────────────

const isModalOpen = ref(false)
const selectedItem = ref<StockOverviewItem | null>(null)
const adjustQty = ref(0)
const adjustType = ref<'set' | 'add' | 'subtract'>('set')
const adjustReason = ref('')
const isSaving = ref(false)

const adjustTypeOptions = [
  { value: 'set', label: 'Set to exact quantity' },
  { value: 'add', label: 'Add to current stock' },
  { value: 'subtract', label: 'Subtract from current stock' },
]

function openAdjustModal(item: StockOverviewItem) {
  selectedItem.value = item
  adjustQty.value = item.stockQuantity
  adjustType.value = 'set'
  adjustReason.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  selectedItem.value = null
}

async function submitAdjust() {
  if (!selectedItem.value) return
  if (!adjustReason.value.trim()) {
    toast.error('Please provide a reason for the adjustment')
    return
  }
  if (adjustType.value === 'set' && adjustQty.value === selectedItem.value.stockQuantity) {
    toast.error('New quantity is the same as current stock')
    return
  }
  if (adjustType.value !== 'set' && adjustQty.value <= 0) {
    toast.error('Please enter a quantity greater than 0')
    return
  }
  isSaving.value = true
  try {
    await inventoryService.admin.adjustStock({
      productId: selectedItem.value.productId,
      variantId: selectedItem.value.variantId ?? undefined,
      quantity: adjustQty.value,
      type: adjustType.value,
      currentStock: selectedItem.value.stockQuantity,
      reason: adjustReason.value.trim(),
    })
    toast.success('Stock adjusted successfully')
    closeModal()
    fetchStock()
    fetchStats()
  } catch (error) {
    toast.error('Failed to adjust stock')
  } finally {
    isSaving.value = false
  }
}

// ── Scan for alerts ──────────────────────────────────────────────

const isScanning = ref(false)

async function scanAlerts() {
  isScanning.value = true
  try {
    const result = await inventoryService.admin.scanForAlerts()
    toast.success(`Scan complete: ${result.created} new alerts, ${result.resolved} resolved`)
    fetchStats()
  } catch (error) {
    toast.error('Failed to scan for alerts')
  } finally {
    isScanning.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function getStatusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'danger' } {
  switch (status) {
    case 'out_of_stock': return { label: 'Out of Stock', variant: 'danger' }
    case 'low_stock': return { label: 'Low Stock', variant: 'warning' }
    default: return { label: 'In Stock', variant: 'success' }
  }
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Inventory', [
    { label: 'Inventory' },
  ], 'Monitor and manage product stock across all vendors')
  fetchStats()
  fetchStock()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Grid -->
    <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Products -->
      <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-primary-50 to-white p-5 dark:border-gray-700 dark:from-primary-900/20 dark:to-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
            <p class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{{ stats.products.total }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
            <CubeIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <div class="mt-3 flex gap-3 text-xs">
          <span class="text-success-600 dark:text-success-400">{{ stats.products.inStock }} in stock</span>
          <span class="text-warning-600 dark:text-warning-400">{{ stats.products.lowStock }} low</span>
          <span class="text-danger-600 dark:text-danger-400">{{ stats.products.outOfStock }} out</span>
        </div>
      </div>

      <!-- Unresolved Alerts -->
      <div class="rounded-xl border border-danger-200 bg-gradient-to-br from-danger-50 to-white p-5 dark:border-danger-800 dark:from-danger-900/20 dark:to-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-danger-600 dark:text-danger-400">Unresolved Alerts</p>
            <p class="mt-1 text-3xl font-bold text-danger-700 dark:text-danger-300">{{ stats.alerts.totalUnresolved }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/40">
            <BellAlertIcon class="h-6 w-6 text-danger-600 dark:text-danger-400" />
          </div>
        </div>
        <div class="mt-3 flex gap-3 text-xs">
          <span class="text-warning-600 dark:text-warning-400">{{ stats.alerts.lowStock }} low stock</span>
          <span class="text-danger-600 dark:text-danger-400">{{ stats.alerts.outOfStock }} out of stock</span>
        </div>
      </div>

      <!-- Active Reservations -->
      <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-gray-700 dark:from-blue-900/20 dark:to-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Active Reservations</p>
            <p class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{{ stats.reservations.activeCount }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <ClockIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {{ stats.reservations.totalQuantity }} units reserved
        </p>
      </div>

      <!-- Vendors with Issues -->
      <div class="rounded-xl border border-warning-200 bg-gradient-to-br from-warning-50 to-white p-5 dark:border-warning-800 dark:from-warning-900/20 dark:to-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-warning-600 dark:text-warning-400">Vendors with Issues</p>
            <p class="mt-1 text-3xl font-bold text-warning-700 dark:text-warning-300">
              {{ stats.vendors.withLowStock + stats.vendors.withOutOfStock }}
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/40">
            <BuildingStorefrontIcon class="h-6 w-6 text-warning-600 dark:text-warning-400" />
          </div>
        </div>
        <div class="mt-3 flex gap-3 text-xs">
          <span class="text-warning-600 dark:text-warning-400">{{ stats.vendors.withLowStock }} low stock</span>
          <span class="text-danger-600 dark:text-danger-400">{{ stats.vendors.withOutOfStock }} out of stock</span>
        </div>
      </div>
    </div>

    <!-- Loading skeleton for stats -->
    <div v-else-if="statsLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
    </div>

    <!-- Activity & Actions Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span v-if="stats" class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <ClockIcon class="h-3.5 w-3.5" />
          {{ stats.activity.movements24h }} movements in 24h
        </span>
      </div>
      <BaseButton variant="secondary" size="sm" :loading="isScanning" @click="scanAlerts">
        <ArrowPathIcon class="mr-1 h-4 w-4" />
        Scan for Alerts
      </BaseButton>
    </div>

    <!-- All Products Stock Table -->
    <BaseCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <CubeIcon class="h-5 w-5 text-primary-500" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">All Products Stock</h3>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative min-w-[200px]">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search products..."
                class="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                @input="fetchStock"
              />
            </div>
            <select
              v-model="statusFilter"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              @change="fetchStock"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <BaseButton variant="secondary" size="sm" @click="fetchStock">
              <ArrowPathIcon class="mr-1 h-4 w-4" />
              Refresh
            </BaseButton>
          </div>
        </div>
      </template>

      <DataTable
        :columns="columns"
        :data="stockItems"
        :loading="stockLoading"
        row-key="productId"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchStock()"
        @update:perPage="pagination.perPage.value = $event; fetchStock()"
      >
        <template #cell-name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
            <p v-if="row.variantName" class="text-xs text-gray-500 dark:text-gray-400">
              Variant: {{ row.variantName }}
            </p>
          </div>
        </template>

        <template #cell-stockQuantity="{ row }">
          <span
            class="font-bold"
            :class="[
              row.isOutOfStock ? 'text-danger-600 dark:text-danger-400' :
              row.isLowStock ? 'text-warning-600 dark:text-warning-400' :
              'text-gray-900 dark:text-white'
            ]"
          >
            {{ row.stockQuantity }}
          </span>
        </template>

        <template #cell-reservedQuantity="{ row }">
          <span class="text-gray-500 dark:text-gray-400">{{ row.reservedQuantity }}</span>
        </template>

        <template #cell-availableQuantity="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.availableQuantity }}</span>
        </template>

        <template #cell-lowStockThreshold="{ row }">
          <span class="text-gray-500 dark:text-gray-400">{{ row.lowStockThreshold }}</span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusBadge(row.status).variant">
            {{ getStatusBadge(row.status).label }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <BaseButton variant="secondary" size="sm" @click="openAdjustModal(row)">
            <PencilIcon class="mr-1 h-4 w-4" />
            Adjust
          </BaseButton>
        </template>

        <template #empty>
          <EmptyState
            title="No products found"
            description="No products match the current filters."
          />
        </template>
      </DataTable>
    </BaseCard>

    <!-- Stock Adjust Modal -->
    <BaseModal
      :show="isModalOpen"
      title="Adjust Stock"
      @close="closeModal"
    >
      <div v-if="selectedItem" class="space-y-4">
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <p class="font-medium text-gray-900 dark:text-white">{{ selectedItem.name }}</p>
          <p v-if="selectedItem.variantName" class="text-sm text-gray-500 dark:text-gray-400">
            Variant: {{ selectedItem.variantName }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">SKU: {{ selectedItem.sku ?? '—' }}</p>
          <p class="mt-1 text-sm">
            Current Stock:
            <span class="font-bold" :class="selectedItem.isOutOfStock ? 'text-danger-600' : 'text-warning-600'">
              {{ selectedItem.stockQuantity }}
            </span>
          </p>
        </div>

        <FormSelect
          v-model="adjustType"
          label="Adjustment Type"
          name="adjustType"
          :options="adjustTypeOptions"
        />

        <FormInput
          v-model.number="adjustQty"
          :label="adjustType === 'set' ? 'New Quantity' : 'Quantity'"
          name="adjustQty"
          type="number"
          :min="0"
          required
        />

        <FormInput
          v-model="adjustReason"
          label="Reason"
          name="reason"
          placeholder="e.g. Restock from supplier"
          required
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeModal">Cancel</BaseButton>
          <BaseButton variant="primary" :loading="isSaving" @click="submitAdjust">
            Adjust Stock
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
