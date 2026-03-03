<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Stock Alerts — Manage stock alerts across all vendors      -->
<!-- Uses /api/v1/admin/inventory/alerts endpoints                    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { inventoryService } from '@/services'
import { usePagination, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type {
  StockAlert,
  AlertSummary,
  AlertType,
  TableColumn,
} from '@/types'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BellAlertIcon,
  CheckBadgeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const pagination = usePagination()

// ── Data ─────────────────────────────────────────────────────────

const alerts = ref<StockAlert[]>([])
const summary = ref<AlertSummary | null>(null)
const isLoading = ref(true)
const typeFilter = ref<AlertType | ''>('')
const resolvedFilter = ref<boolean | ''>('')
const selectedIds = ref<number[]>([])

const columns: TableColumn[] = [
  { key: 'select', label: '', width: '40px' },
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'alertTypeLabel', label: 'Alert Type', align: 'center' },
  { key: 'currentStock', label: 'Stock', align: 'center' },
  { key: 'thresholdQuantity', label: 'Threshold', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchAlerts() {
  isLoading.value = true
  try {
    const response = await inventoryService.admin.getAlerts({
      page: pagination.currentPage.value,
      perPage: pagination.perPage.value,
      type: typeFilter.value || undefined,
      resolved: resolvedFilter.value !== '' ? resolvedFilter.value : undefined,
    })
    alerts.value = response.data
    summary.value = response.summary
    if (response.meta) {
      pagination.setMeta(response.meta)
    }
    selectedIds.value = []
  } catch (error) {
    toast.error('Failed to load stock alerts')
  } finally {
    isLoading.value = false
  }
}

// ── Actions ──────────────────────────────────────────────────────

async function resolveAlert(id: number) {
  try {
    await inventoryService.admin.resolveAlert(id)
    toast.success('Alert resolved')
    fetchAlerts()
  } catch (error) {
    toast.error('Failed to resolve alert')
  }
}

const isBulkResolving = ref(false)

async function bulkResolve() {
  if (selectedIds.value.length === 0) return
  isBulkResolving.value = true
  try {
    await inventoryService.admin.bulkResolveAlerts(selectedIds.value)
    toast.success(`${selectedIds.value.length} alerts resolved`)
    fetchAlerts()
  } catch (error) {
    toast.error('Failed to bulk resolve alerts')
  } finally {
    isBulkResolving.value = false
  }
}

// ── Selection ────────────────────────────────────────────────────

const unresolvedAlerts = computed(() => alerts.value.filter(a => !a.isResolved))
const allSelected = computed(() =>
  unresolvedAlerts.value.length > 0 && unresolvedAlerts.value.every(a => selectedIds.value.includes(a.id))
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = unresolvedAlerts.value.map(a => a.id)
  }
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(idx, 1)
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Stock Alerts', [
    { label: 'Inventory', to: '/admin/inventory' },
    { label: 'Alerts' },
  ], 'View and manage stock alerts')
  fetchAlerts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div v-if="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex items-center gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
        <BellAlertIcon class="h-8 w-8 text-danger-500" />
        <div>
          <p class="text-2xl font-bold text-danger-700 dark:text-danger-300">{{ summary.unresolved }}</p>
          <p class="text-sm text-danger-600 dark:text-danger-400">Unresolved</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
        <ExclamationTriangleIcon class="h-8 w-8 text-warning-500" />
        <div>
          <p class="text-2xl font-bold text-warning-700 dark:text-warning-300">{{ summary.lowStock }}</p>
          <p class="text-sm text-warning-600 dark:text-warning-400">Low Stock</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <XCircleIcon class="h-8 w-8 text-gray-500 dark:text-gray-400" />
        <div>
          <p class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ summary.outOfStock }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
        <CheckBadgeIcon class="h-8 w-8 text-success-500" />
        <div>
          <p class="text-2xl font-bold text-success-700 dark:text-success-300">{{ summary.resolved }}</p>
          <p class="text-sm text-success-600 dark:text-success-400">Resolved</p>
        </div>
      </div>
    </div>

    <!-- Filters & Bulk Action -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="typeFilter"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @change="fetchAlerts"
        >
          <option value="">All Types</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="restock">Restock Needed</option>
        </select>

        <select
          v-model="resolvedFilter"
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

      <BaseButton
        v-if="selectedIds.length > 0"
        variant="primary"
        size="sm"
        :loading="isBulkResolving"
        @click="bulkResolve"
      >
        <CheckCircleIcon class="mr-1 h-4 w-4" />
        Resolve {{ selectedIds.length }} selected
      </BaseButton>
    </div>

    <!-- Alerts Table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="alerts"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchAlerts()"
        @update:perPage="pagination.perPage.value = $event; fetchAlerts()"
      >
        <template #cell-select="{ row }">
          <input
            v-if="!row.isResolved"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
            :checked="selectedIds.includes(row.id)"
            @change="toggleSelect(row.id)"
          />
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #cell-product="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.product?.name ?? '—' }}</p>
            <p v-if="row.variant" class="text-xs text-gray-500 dark:text-gray-400">
              Variant: {{ row.variant.name ?? row.variant.sku }}
            </p>
            <p v-if="row.product?.sku" class="text-xs text-gray-400 dark:text-gray-500">
              SKU: {{ row.product.sku }}
            </p>
          </div>
        </template>

        <template #cell-vendor="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.vendor?.shopName ?? '—' }}
          </span>
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
            title="No stock alerts"
            description="No alerts match your current filters."
          />
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
