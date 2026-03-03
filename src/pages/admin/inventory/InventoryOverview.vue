<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Inventory Overview — Stats + stock overview table          -->
<!-- Uses /api/v1/admin/inventory endpoints                           -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { inventoryService } from '@/services'
import { usePagination, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type {
  InventoryStats,
  StockOverviewItem,
  StockStatus,
} from '@/types'
import {
  CubeIcon,
  ExclamationTriangleIcon,
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

// ── Grouped Stock Items (Professional Grouped Rows) ──────────────

interface GroupedProduct {
  productId: number
  name: string
  imageUrl?: string
  vendor?: { id: number; name: string }
  isSimple: boolean
  item?: StockOverviewItem
  variants: StockOverviewItem[]
  totalStock: number
  hasLowStock: boolean
  hasOutOfStock: boolean
}

const groupedStockItems = computed<GroupedProduct[]>(() => {
  const groups = new Map<number, GroupedProduct>()
  
  for (const item of stockItems.value) {
    const pid = item.productId
    
    if (!groups.has(pid)) {
      groups.set(pid, {
        productId: pid,
        name: item.name,
        imageUrl: item.imageUrl,
        vendor: item.vendor,
        isSimple: !item.variantId,
        item: !item.variantId ? item : undefined,
        variants: [],
        totalStock: 0,
        hasLowStock: false,
        hasOutOfStock: false,
      })
    }
    
    const group = groups.get(pid)!
    
    if (item.variantId) {
      group.variants.push(item)
      group.isSimple = false
    } else {
      group.item = item
      group.isSimple = true
    }
    
    group.totalStock += item.stockQuantity
    if (item.isLowStock) group.hasLowStock = true
    if (item.isOutOfStock) group.hasOutOfStock = true
  }
  
  return Array.from(groups.values())
})

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

      <!-- Loading state -->
      <div v-if="stockLoading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="groupedStockItems.length === 0" class="py-8">
        <EmptyState
          title="No products found"
          description="No products match the current filters."
        />
      </div>

      <!-- Grouped Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Product / Variant</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">SKU</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Stock</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reserved</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Available</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Threshold</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <template v-for="group in groupedStockItems" :key="group.productId">
              <!-- Simple Product Row -->
              <tr v-if="group.isSimple && group.item" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div v-if="group.imageUrl" class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      <img :src="group.imageUrl" :alt="group.name" class="h-full w-full object-cover" />
                    </div>
                    <div v-else class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                      <CubeIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <span class="font-medium text-gray-900 dark:text-white">{{ group.name }}</span>
                      <p v-if="group.vendor" class="text-xs text-gray-500 dark:text-gray-400">{{ group.vendor.name }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ group.item.sku }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="font-bold" :class="[
                    group.item.isOutOfStock ? 'text-danger-600 dark:text-danger-400' :
                    group.item.isLowStock ? 'text-warning-600 dark:text-warning-400' :
                    'text-gray-900 dark:text-white'
                  ]">{{ group.item.stockQuantity }}</span>
                </td>
                <td class="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{{ group.item.reservedQuantity }}</td>
                <td class="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">{{ group.item.availableQuantity }}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{{ group.item.lowStockThreshold }}</td>
                <td class="px-4 py-3 text-center">
                  <BaseBadge :variant="getStatusBadge(group.item.status).variant">
                    {{ getStatusBadge(group.item.status).label }}
                  </BaseBadge>
                </td>
                <td class="px-4 py-3 text-right">
                  <BaseButton variant="secondary" size="sm" @click="openAdjustModal(group.item)">
                    <PencilIcon class="mr-1 h-4 w-4" />
                    Adjust
                  </BaseButton>
                </td>
              </tr>

              <!-- Variable Product: Header Row -->
              <tr v-if="!group.isSimple" class="bg-gray-50/50 dark:bg-gray-800/20">
                <td class="px-4 py-3" colspan="8">
                  <div class="flex items-center gap-3">
                    <div v-if="group.imageUrl" class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      <img :src="group.imageUrl" :alt="group.name" class="h-full w-full object-cover" />
                    </div>
                    <div v-else class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                      <CubeIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ group.name }}</span>
                      <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">({{ group.variants.length }} variants)</span>
                      <p v-if="group.vendor" class="text-xs text-gray-500 dark:text-gray-400">{{ group.vendor.name }}</p>
                    </div>
                    <div class="ml-auto flex items-center gap-2">
                      <span class="text-sm text-gray-500 dark:text-gray-400">Total: <strong class="text-gray-700 dark:text-gray-300">{{ group.totalStock }}</strong></span>
                      <ExclamationTriangleIcon v-if="group.hasOutOfStock" class="h-4 w-4 text-danger-500" title="Has out of stock variants" />
                      <ExclamationTriangleIcon v-else-if="group.hasLowStock" class="h-4 w-4 text-warning-500" title="Has low stock variants" />
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Variable Product: Variant Rows (indented) -->
              <tr
                v-for="(variant, idx) in group.variants"
                :key="`${group.productId}-${variant.variantId}`"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <td class="py-2.5 pl-8 pr-4">
                  <div class="flex items-center gap-2">
                    <!-- Tree connector -->
                    <span class="text-gray-300 dark:text-gray-600">
                      {{ idx === group.variants.length - 1 ? '└─' : '├─' }}
                    </span>
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ variant.variantName }}</span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{{ variant.sku }}</td>
                <td class="px-4 py-2.5 text-center">
                  <span class="font-bold" :class="[
                    variant.isOutOfStock ? 'text-danger-600 dark:text-danger-400' :
                    variant.isLowStock ? 'text-warning-600 dark:text-warning-400' :
                    'text-gray-900 dark:text-white'
                  ]">{{ variant.stockQuantity }}</span>
                </td>
                <td class="px-4 py-2.5 text-center text-sm text-gray-500 dark:text-gray-400">{{ variant.reservedQuantity }}</td>
                <td class="px-4 py-2.5 text-center font-medium text-gray-900 dark:text-white">{{ variant.availableQuantity }}</td>
                <td class="px-4 py-2.5 text-center text-sm text-gray-500 dark:text-gray-400">{{ variant.lowStockThreshold }}</td>
                <td class="px-4 py-2.5 text-center">
                  <BaseBadge :variant="getStatusBadge(variant.status).variant">
                    {{ getStatusBadge(variant.status).label }}
                  </BaseBadge>
                </td>
                <td class="px-4 py-2.5 text-right">
                  <BaseButton variant="secondary" size="sm" @click="openAdjustModal(variant)">
                    <PencilIcon class="mr-1 h-4 w-4" />
                    Adjust
                  </BaseButton>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalItems.value > pagination.perPage.value" class="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Showing {{ (pagination.currentPage.value - 1) * pagination.perPage.value + 1 }} 
          to {{ Math.min(pagination.currentPage.value * pagination.perPage.value, pagination.totalItems.value) }} 
          of {{ pagination.totalItems.value }} items
        </div>
        <div class="flex items-center gap-2">
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="pagination.currentPage.value <= 1"
            @click="pagination.currentPage.value--; fetchStock()"
          >
            Previous
          </BaseButton>
          <span class="px-3 text-sm text-gray-700 dark:text-gray-300">Page {{ pagination.currentPage.value }}</span>
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="pagination.currentPage.value >= pagination.totalPages.value"
            @click="pagination.currentPage.value++; fetchStock()"
          >
            Next
          </BaseButton>
        </div>
      </div>
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
