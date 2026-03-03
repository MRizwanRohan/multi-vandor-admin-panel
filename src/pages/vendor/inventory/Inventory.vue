<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Inventory — Dynamic stock overview, movements & alerts    -->
<!-- Uses /api/v1/vendor/inventory endpoints                          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
  StockOverviewItem,
  InventoryLog,
  StockAlert,
  StockSummary,
  AlertSummary,
  StockStatus,
  MovementType,
  AlertType,
  TableColumn,
} from '@/types'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CubeIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BellAlertIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// ── Tabs ─────────────────────────────────────────────────────────

type Tab = 'stock' | 'movements' | 'alerts'
const activeTab = ref<Tab>('stock')
const tabs = [
  { key: 'stock' as Tab, label: 'Stock Overview', icon: CubeIcon },
  { key: 'movements' as Tab, label: 'Movements', icon: ClockIcon },
  { key: 'alerts' as Tab, label: 'Alerts', icon: BellAlertIcon },
]

// ── Stock Overview ───────────────────────────────────────────────

const stockPagination = usePagination()
const stockItems = ref<StockOverviewItem[]>([])
const stockSummary = ref<StockSummary | null>(null)
const stockLoading = ref(true)
const stockSearch = ref('')
const stockFilter = ref<StockStatus | ''>('')

const stockColumns: TableColumn[] = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'stockQuantity', label: 'Stock', sortable: true, align: 'center' },
  { key: 'reservedQuantity', label: 'Reserved', align: 'center' },
  { key: 'availableQuantity', label: 'Available', align: 'center' },
  { key: 'threshold', label: 'Threshold', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

async function fetchStock() {
  stockLoading.value = true
  try {
    const response = await inventoryService.vendor.getInventory({
      page: stockPagination.currentPage.value,
      perPage: stockPagination.perPage.value,
      search: stockSearch.value || undefined,
      status: stockFilter.value || undefined,
    })
    stockItems.value = response.data
    stockSummary.value = response.summary
    if (response.meta) {
      stockPagination.setMeta(response.meta)
    }
  } catch (error) {
    toast.error('Failed to load inventory')
  } finally {
    stockLoading.value = false
  }
}

// ── Stock Update Modal ───────────────────────────────────────────

const isModalOpen = ref(false)
const selectedItem = ref<StockOverviewItem | null>(null)
const newStock = ref(0)
const updateType = ref<'set' | 'add' | 'subtract'>('set')
const updateReason = ref('')
const isSaving = ref(false)

const stockTypeOptions = [
  { value: 'set', label: 'Set to exact quantity' },
  { value: 'add', label: 'Add to current stock' },
  { value: 'subtract', label: 'Subtract from current stock' },
]

const previewStock = computed(() => {
  if (!selectedItem.value) return 0
  switch (updateType.value) {
    case 'set': return newStock.value
    case 'add': return selectedItem.value.stockQuantity + newStock.value
    case 'subtract': return Math.max(0, selectedItem.value.stockQuantity - newStock.value)
    default: return newStock.value
  }
})

function openStockModal(item: StockOverviewItem) {
  selectedItem.value = item
  newStock.value = item.stockQuantity
  updateType.value = 'set'
  updateReason.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  selectedItem.value = null
}

async function updateStock() {
  if (!selectedItem.value) return
  // Compute final stock quantity based on type
  const finalStock = previewStock.value
  if (finalStock === selectedItem.value.stockQuantity && updateType.value === 'set') {
    toast.error('New quantity is the same as current stock')
    return
  }
  if (updateType.value !== 'set' && newStock.value <= 0) {
    toast.error('Please enter a quantity greater than 0')
    return
  }
  if (!updateReason.value.trim()) {
    toast.error('Please provide a reason for the stock change')
    return
  }
  isSaving.value = true
  try {
    await inventoryService.vendor.updateStock(selectedItem.value.productId, {
      stockQuantity: finalStock,
      variantId: selectedItem.value.variantId ?? undefined,
      reason: updateReason.value.trim(),
    })
    toast.success('Stock updated successfully')
    closeModal()
    fetchStock()
  } catch (error) {
    toast.error('Failed to update stock')
  } finally {
    isSaving.value = false
  }
}

// ── Movements ────────────────────────────────────────────────────

const movePagination = usePagination()
const movements = ref<InventoryLog[]>([])
const moveLoading = ref(false)
const moveTypeFilter = ref<MovementType | ''>('')

const moveColumns: TableColumn[] = [
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'typeLabel', label: 'Type' },
  { key: 'change', label: 'Change', align: 'center' },
  { key: 'stock', label: 'Before / After', align: 'center' },
]

const moveTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase / Restock' },
  { value: 'adjustment', label: 'Manual Adjustment' },
  { value: 'return', label: 'Return' },
  { value: 'reservation', label: 'Reserved' },
  { value: 'release', label: 'Released' },
  { value: 'initial', label: 'Initial Stock' },
  { value: 'transfer', label: 'Transfer' },
]

async function fetchMovements() {
  moveLoading.value = true
  try {
    const response = await inventoryService.vendor.getMovements({
      page: movePagination.currentPage.value,
      perPage: movePagination.perPage.value,
      type: moveTypeFilter.value || undefined,
    })
    movements.value = response.data
    if (response.meta) {
      movePagination.setMeta(response.meta)
    }
  } catch (error) {
    toast.error('Failed to load movements')
  } finally {
    moveLoading.value = false
  }
}

// ── Alerts ───────────────────────────────────────────────────────

const alertPagination = usePagination()
const alerts = ref<StockAlert[]>([])
const alertSummary = ref<AlertSummary | null>(null)
const alertLoading = ref(false)
const alertTypeFilter = ref<AlertType | ''>('')
const alertResolvedFilter = ref<boolean | ''>('')

const alertColumns: TableColumn[] = [
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'alertTypeLabel', label: 'Alert Type' },
  { key: 'currentStock', label: 'Current Stock', align: 'center' },
  { key: 'thresholdQuantity', label: 'Threshold', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

async function fetchAlerts() {
  alertLoading.value = true
  try {
    const response = await inventoryService.vendor.getAlerts({
      page: alertPagination.currentPage.value,
      perPage: alertPagination.perPage.value,
      type: alertTypeFilter.value || undefined,
      resolved: alertResolvedFilter.value !== '' ? alertResolvedFilter.value : undefined,
    })
    alerts.value = response.data
    alertSummary.value = response.summary
    if (response.meta) {
      alertPagination.setMeta(response.meta)
    }
  } catch (error) {
    toast.error('Failed to load alerts')
  } finally {
    alertLoading.value = false
  }
}

async function resolveAlert(id: number) {
  try {
    await inventoryService.vendor.resolveAlert(id)
    toast.success('Alert resolved')
    fetchAlerts()
  } catch (error) {
    toast.error('Failed to resolve alert')
  }
}

// ── Tab switching ────────────────────────────────────────────────

watch(activeTab, (tab) => {
  if (tab === 'stock' && stockItems.value.length === 0) fetchStock()
  if (tab === 'movements' && movements.value.length === 0) fetchMovements()
  if (tab === 'alerts' && alerts.value.length === 0) fetchAlerts()
})

// ── Helpers ──────────────────────────────────────────────────────

function getStatusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'danger' } {
  switch (status) {
    case 'out_of_stock': return { label: 'Out of Stock', variant: 'danger' }
    case 'low_stock': return { label: 'Low Stock', variant: 'warning' }
    default: return { label: 'In Stock', variant: 'success' }
  }
}

function getMovementBadge(direction: string): { variant: 'success' | 'danger' } {
  return direction === 'increase' ? { variant: 'success' } : { variant: 'danger' }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Inventory', [
    { label: 'Inventory' },
  ], 'Manage your product stock levels')
  fetchStock()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Summary cards -->
    <div v-if="stockSummary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <CubeIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stockSummary.totalProducts }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
          <CheckCircleIcon class="h-5 w-5 text-success-600 dark:text-success-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stockSummary.inStock }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/50">
          <ExclamationTriangleIcon class="h-5 w-5 text-warning-600 dark:text-warning-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-warning-800 dark:text-warning-200">{{ stockSummary.lowStock }}</p>
          <p class="text-sm text-warning-600 dark:text-warning-400">Low Stock</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/50">
          <XCircleIcon class="h-5 w-5 text-danger-600 dark:text-danger-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-danger-800 dark:text-danger-200">{{ stockSummary.outOfStock }}</p>
          <p class="text-sm text-danger-600 dark:text-danger-400">Out of Stock</p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex space-x-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
          ]"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
          <span
            v-if="tab.key === 'alerts' && alertSummary && alertSummary.unresolved > 0"
            class="ml-1 rounded-full bg-danger-100 px-2 py-0.5 text-xs font-semibold text-danger-700 dark:bg-danger-900/50 dark:text-danger-400"
          >
            {{ alertSummary.unresolved }}
          </span>
        </button>
      </nav>
    </div>

    <!-- ═══ Stock Overview Tab ═══ -->
    <div v-if="activeTab === 'stock'" class="space-y-4">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative min-w-[240px] flex-1 max-w-md">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            v-model="stockSearch"
            type="text"
            placeholder="Search products..."
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            @input="fetchStock"
          />
        </div>

        <select
          v-model="stockFilter"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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

      <!-- Table -->
      <BaseCard padding="none">
        <DataTable
          :columns="stockColumns"
          :data="stockItems"
          :loading="stockLoading"
          row-key="productId"
          :current-page="stockPagination.currentPage.value"
          :per-page="stockPagination.perPage.value"
          :total="stockPagination.totalItems.value"
          @update:currentPage="stockPagination.currentPage.value = $event; fetchStock()"
          @update:perPage="stockPagination.perPage.value = $event; fetchStock()"
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

          <template #cell-threshold="{ row }">
            <span class="text-gray-500 dark:text-gray-400">{{ row.lowStockThreshold }}</span>
          </template>

          <template #cell-status="{ row }">
            <BaseBadge :variant="getStatusBadge(row.status).variant">
              {{ getStatusBadge(row.status).label }}
            </BaseBadge>
          </template>

          <template #cell-actions="{ row }">
            <BaseButton variant="secondary" size="sm" @click="openStockModal(row)">
              <PencilIcon class="mr-1 h-4 w-4" />
              Update
            </BaseButton>
          </template>

          <template #empty>
            <EmptyState
              title="No products found"
              description="Add products to manage their inventory."
              action-text="Add Product"
              action-to="/vendor/products/new"
            />
          </template>
        </DataTable>
      </BaseCard>
    </div>

    <!-- ═══ Movements Tab ═══ -->
    <div v-if="activeTab === 'movements'" class="space-y-4">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-4">
        <select
          v-model="moveTypeFilter"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @change="fetchMovements"
        >
          <option v-for="opt in moveTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <BaseButton variant="secondary" size="sm" @click="fetchMovements">
          <ArrowPathIcon class="mr-1 h-4 w-4" />
          Refresh
        </BaseButton>
      </div>

      <!-- Table -->
      <BaseCard padding="none">
        <DataTable
          :columns="moveColumns"
          :data="movements"
          :loading="moveLoading"
          row-key="id"
          :current-page="movePagination.currentPage.value"
          :per-page="movePagination.perPage.value"
          :total="movePagination.totalItems.value"
          @update:currentPage="movePagination.currentPage.value = $event; fetchMovements()"
          @update:perPage="movePagination.perPage.value = $event; fetchMovements()"
        >
          <template #cell-createdAt="{ row }">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
          </template>

          <template #cell-product="{ row }">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ row.product?.name ?? '—' }}</p>
              <p v-if="row.variant" class="text-xs text-gray-500 dark:text-gray-400">
                SKU: {{ row.variant.sku }}
              </p>
            </div>
          </template>

          <template #cell-typeLabel="{ row }">
            <BaseBadge variant="info">{{ row.typeLabel }}</BaseBadge>
          </template>

          <template #cell-change="{ row }">
            <span
              class="inline-flex items-center gap-1 font-bold"
              :class="getMovementBadge(row.changeDirection).variant === 'success'
                ? 'text-success-600 dark:text-success-400'
                : 'text-danger-600 dark:text-danger-400'"
            >
              <component
                :is="row.changeDirection === 'increase' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon"
                class="h-4 w-4"
              />
              {{ row.changeDirection === 'increase' ? '+' : '' }}{{ row.quantityChange }}
            </span>
          </template>

          <template #cell-stock="{ row }">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ row.quantityBefore }} &rarr; {{ row.quantityAfter }}
            </span>
          </template>

          <template #empty>
            <EmptyState
              title="No stock movements"
              description="Stock changes will appear here when products are sold, restocked, or adjusted."
            />
          </template>
        </DataTable>
      </BaseCard>
    </div>

    <!-- ═══ Alerts Tab ═══ -->
    <div v-if="activeTab === 'alerts'" class="space-y-4">
      <!-- Alert summary -->
      <div v-if="alertSummary" class="flex flex-wrap gap-3">
        <div class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-2 dark:border-danger-800 dark:bg-danger-900/20">
          <span class="text-lg font-bold text-danger-700 dark:text-danger-400">{{ alertSummary.unresolved }}</span>
          <span class="ml-1 text-sm text-danger-600 dark:text-danger-400">Unresolved</span>
        </div>
        <div class="rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 dark:border-warning-800 dark:bg-warning-900/20">
          <span class="text-lg font-bold text-warning-700 dark:text-warning-400">{{ alertSummary.lowStock }}</span>
          <span class="ml-1 text-sm text-warning-600 dark:text-warning-400">Low Stock</span>
        </div>
        <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <span class="text-lg font-bold text-gray-700 dark:text-gray-300">{{ alertSummary.outOfStock }}</span>
          <span class="ml-1 text-sm text-gray-500 dark:text-gray-400">Out of Stock</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-4">
        <select
          v-model="alertTypeFilter"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @change="fetchAlerts"
        >
          <option value="">All Types</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="restock">Restock Needed</option>
        </select>

        <select
          v-model="alertResolvedFilter"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @change="fetchAlerts"
        >
          <option value="">All Status</option>
          <option :value="false">Unresolved</option>
          <option :value="true">Resolved</option>
        </select>

        <BaseButton variant="secondary" size="sm" @click="fetchAlerts">
          <ArrowPathIcon class="mr-1 h-4 w-4" />
          Refresh
        </BaseButton>
      </div>

      <!-- Table -->
      <BaseCard padding="none">
        <DataTable
          :columns="alertColumns"
          :data="alerts"
          :loading="alertLoading"
          row-key="id"
          :current-page="alertPagination.currentPage.value"
          :per-page="alertPagination.perPage.value"
          :total="alertPagination.totalItems.value"
          @update:currentPage="alertPagination.currentPage.value = $event; fetchAlerts()"
          @update:perPage="alertPagination.perPage.value = $event; fetchAlerts()"
        >
          <template #cell-createdAt="{ row }">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
          </template>

          <template #cell-product="{ row }">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ row.product?.name ?? '—' }}</p>
              <p v-if="row.variant" class="text-xs text-gray-500 dark:text-gray-400">
                Variant: {{ row.variant.name ?? row.variant.sku }}
              </p>
            </div>
          </template>

          <template #cell-alertTypeLabel="{ row }">
            <BaseBadge :variant="row.alertType === 'out_of_stock' ? 'danger' : 'warning'">
              {{ row.alertTypeLabel }}
            </BaseBadge>
          </template>

          <template #cell-currentStock="{ row }">
            <span
              class="font-bold"
              :class="row.currentStock === 0 ? 'text-danger-600 dark:text-danger-400' : 'text-warning-600 dark:text-warning-400'"
            >
              {{ row.currentStock }}
            </span>
          </template>

          <template #cell-thresholdQuantity="{ row }">
            <span class="text-gray-500 dark:text-gray-400">{{ row.thresholdQuantity }}</span>
          </template>

          <template #cell-status="{ row }">
            <BaseBadge :variant="row.isResolved ? 'success' : 'danger'">
              {{ row.isResolved ? 'Resolved' : 'Active' }}
            </BaseBadge>
          </template>

          <template #cell-actions="{ row }">
            <BaseButton
              v-if="!row.isResolved"
              variant="secondary"
              size="sm"
              @click="resolveAlert(row.id)"
            >
              <CheckCircleIcon class="mr-1 h-4 w-4" />
              Resolve
            </BaseButton>
          </template>

          <template #empty>
            <EmptyState
              title="No alerts"
              description="No stock alerts for your products."
            />
          </template>
        </DataTable>
      </BaseCard>
    </div>

    <!-- ═══ Stock Update Modal ═══ -->
    <BaseModal
      :open="isModalOpen"
      title="Update Stock"
      @close="closeModal"
    >
      <div v-if="selectedItem" class="space-y-4">
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <p class="font-medium text-gray-900 dark:text-white">{{ selectedItem.name }}</p>
          <p v-if="selectedItem.variantName" class="text-sm text-gray-500 dark:text-gray-400">
            Variant: {{ selectedItem.variantName }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            SKU: {{ selectedItem.sku ?? '—' }}
          </p>
        </div>

        <FormSelect
          v-model="updateType"
          label="Update Type"
          name="updateType"
          :options="stockTypeOptions"
        />

        <FormInput
          v-model.number="newStock"
          :label="updateType === 'set' ? 'New Quantity' : 'Quantity'"
          name="stock"
          type="number"
          :min="0"
          required
        />

        <FormInput
          v-model="updateReason"
          label="Reason"
          name="reason"
          placeholder="e.g., Restocking, Correction, Damaged goods"
          required
        />

        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Current:</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ selectedItem.stockQuantity }}</span>
          <span>&rarr;</span>
          <span class="font-medium text-primary-600 dark:text-primary-400">{{ previewStock }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeModal">Cancel</BaseButton>
          <BaseButton variant="primary" :loading="isSaving" @click="updateStock">
            Update Stock
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
