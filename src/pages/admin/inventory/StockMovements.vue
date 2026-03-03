<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Stock Movements — Inventory log / movement history         -->
<!-- Uses /api/v1/admin/inventory/movements endpoint                  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { inventoryService } from '@/services'
import { usePagination, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type {
  InventoryLog,
  MovementType,
  TableColumn,
} from '@/types'
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const pagination = usePagination()

// ── Data ─────────────────────────────────────────────────────────

const movements = ref<InventoryLog[]>([])
const isLoading = ref(true)
const typeFilter = ref<MovementType | ''>('')
const dateFrom = ref('')
const dateTo = ref('')

const columns: TableColumn[] = [
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'typeLabel', label: 'Type', align: 'center' },
  { key: 'change', label: 'Change', align: 'center' },
  { key: 'stock', label: 'Before / After', align: 'center' },
  { key: 'createdBy', label: 'By' },
]

const typeOptions = [
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

// ── Fetch ────────────────────────────────────────────────────────

async function fetchMovements() {
  isLoading.value = true
  try {
    const response = await inventoryService.admin.getMovements({
      page: pagination.currentPage.value,
      perPage: pagination.perPage.value,
      type: typeFilter.value || undefined,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
    })
    movements.value = response.data
    if (response.meta) {
      pagination.setMeta(response.meta)
    }
  } catch (error) {
    toast.error('Failed to load stock movements')
  } finally {
    isLoading.value = false
  }
}

function clearFilters() {
  typeFilter.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  fetchMovements()
}

// ── Helpers ──────────────────────────────────────────────────────

function getTypeBadgeVariant(type: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (type) {
    case 'sale': return 'info'
    case 'purchase': return 'success'
    case 'adjustment': return 'warning'
    case 'return': return 'success'
    case 'reservation': return 'warning'
    case 'release': return 'info'
    case 'initial': return 'info'
    default: return 'info'
  }
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
  breadcrumbStore.setPageInfo('Stock Movements', [
    { label: 'Inventory', to: '/admin/inventory' },
    { label: 'Movements' },
  ], 'View inventory movement history')
  fetchMovements()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
          <select
            v-model="typeFilter"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            @change="fetchMovements"
          >
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
          <input
            v-model="dateFrom"
            type="date"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            @change="fetchMovements"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
          <input
            v-model="dateTo"
            type="date"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            @change="fetchMovements"
          />
        </div>

        <div class="flex gap-2">
          <BaseButton variant="secondary" size="sm" @click="fetchMovements">
            <ArrowPathIcon class="mr-1 h-4 w-4" />
            Refresh
          </BaseButton>
          <BaseButton
            v-if="typeFilter || dateFrom || dateTo"
            variant="secondary"
            size="sm"
            @click="clearFilters"
          >
            <FunnelIcon class="mr-1 h-4 w-4" />
            Clear
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Movements Table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="movements"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchMovements()"
        @update:perPage="pagination.perPage.value = $event; fetchMovements()"
      >
        <template #cell-createdAt="{ row }">
          <div class="flex items-center gap-1.5">
            <ClockIcon class="h-4 w-4 text-gray-400" />
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
          </div>
        </template>

        <template #cell-product="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.product?.name ?? '—' }}</p>
            <p v-if="row.variant" class="text-xs text-gray-500 dark:text-gray-400">
              SKU: {{ row.variant.sku }}
            </p>
            <p v-else-if="row.product?.sku" class="text-xs text-gray-400 dark:text-gray-500">
              SKU: {{ row.product.sku }}
            </p>
          </div>
        </template>

        <template #cell-typeLabel="{ row }">
          <BaseBadge :variant="getTypeBadgeVariant(row.type)">
            {{ row.typeLabel }}
          </BaseBadge>
        </template>

        <template #cell-change="{ row }">
          <span
            class="inline-flex items-center gap-1 font-bold"
            :class="row.changeDirection === 'increase'
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

        <template #cell-createdBy="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.createdBy?.name ?? 'System' }}
          </span>
        </template>

        <template #empty>
          <EmptyState
            title="No stock movements"
            description="No inventory movements match your filters."
          />
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
