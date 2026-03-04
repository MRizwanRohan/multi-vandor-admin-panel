<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Stock Reservations — View and manage stock reservations    -->
<!-- Uses /api/v1/admin/inventory/reservations endpoints              -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { inventoryService } from '@/services'
import { usePagination, useToast, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormInput from '@/components/form/FormInput.vue'
import type {
  StockReservation,
  ReservationSummary,
  ReservationStatus,
  TableColumn,
} from '@/types'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShoppingCartIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatRelative, formatDateTime } = useDate()
const pagination = usePagination()

// ── Data ─────────────────────────────────────────────────────────

const reservations = ref<StockReservation[]>([])
const summary = ref<ReservationSummary | null>(null)
const isLoading = ref(true)
const statusFilter = ref<ReservationStatus | ''>('')
const searchQuery = ref('')
const expiringSoonFilter = ref(false)
const selectedIds = ref<number[]>([])

const columns: TableColumn[] = [
  { key: 'select', label: '', width: '40px' },
  { key: 'createdAt', label: 'Reserved', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'order', label: 'Order' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'quantity', label: 'Qty', align: 'center' },
  { key: 'expiresAt', label: 'Expires', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'converted', label: 'Converted' },
  { value: 'released', label: 'Released' },
  { value: 'expired', label: 'Expired' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchReservations() {
  isLoading.value = true
  try {
    const response = await inventoryService.admin.getReservations({
      page: pagination.currentPage.value,
      perPage: pagination.perPage.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      expiringSoon: expiringSoonFilter.value || undefined,
    })
    reservations.value = response.data
    summary.value = response.summary
    if (response.meta) {
      pagination.setMeta(response.meta)
    }
    selectedIds.value = []
  } catch (error) {
    toast.error('Failed to load reservations')
  } finally {
    isLoading.value = false
  }
}

// ── Actions ──────────────────────────────────────────────────────

const releaseModalOpen = ref(false)
const releaseReason = ref('')
const releasingId = ref<number | null>(null)
const isReleasing = ref(false)

function openReleaseModal(id: number) {
  releasingId.value = id
  releaseReason.value = ''
  releaseModalOpen.value = true
}

function closeReleaseModal() {
  releaseModalOpen.value = false
  releasingId.value = null
  releaseReason.value = ''
}

async function confirmRelease() {
  if (!releasingId.value) return
  isReleasing.value = true
  try {
    await inventoryService.admin.releaseReservation(releasingId.value, releaseReason.value || undefined)
    toast.success('Reservation released, stock restored')
    closeReleaseModal()
    fetchReservations()
  } catch (error) {
    toast.error('Failed to release reservation')
  } finally {
    isReleasing.value = false
  }
}

// ── Bulk Actions ─────────────────────────────────────────────────

const isBulkReleasing = ref(false)

async function bulkRelease() {
  if (selectedIds.value.length === 0) return
  isBulkReleasing.value = true
  try {
    const result = await inventoryService.admin.bulkReleaseReservations(selectedIds.value)
    toast.success(`${result.released} reservations released`)
    fetchReservations()
  } catch (error) {
    toast.error('Failed to bulk release reservations')
  } finally {
    isBulkReleasing.value = false
  }
}

const isReleasingExpired = ref(false)

async function releaseAllExpired() {
  isReleasingExpired.value = true
  try {
    const result = await inventoryService.admin.releaseExpiredReservations()
    if (result.released > 0) {
      toast.success(`${result.released} expired reservations released`)
      fetchReservations()
    } else {
      toast.info('No expired reservations to release')
    }
  } catch (error) {
    toast.error('Failed to release expired reservations')
  } finally {
    isReleasingExpired.value = false
  }
}

// ── Selection ────────────────────────────────────────────────────

const activeReservations = computed(() => reservations.value.filter(r => r.isActive))
const allSelected = computed(() =>
  activeReservations.value.length > 0 && activeReservations.value.every(r => selectedIds.value.includes(r.id))
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = activeReservations.value.map(r => r.id)
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

function getStatusVariant(status: ReservationStatus): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'active': return 'warning'
    case 'converted': return 'success'
    case 'released': return 'info'
    case 'expired': return 'danger'
    default: return 'info'
  }
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const expiry = new Date(expiresAt)
  const now = new Date()
  const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Stock Reservations', [
    { label: 'Inventory', to: '/admin/inventory' },
    { label: 'Reservations' },
  ], 'Manage stock reservations')
  fetchReservations()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div v-if="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div class="flex items-center gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
        <LockClosedIcon class="h-8 w-8 text-warning-500" />
        <div>
          <p class="text-2xl font-bold text-warning-700 dark:text-warning-300">{{ summary.active }}</p>
          <p class="text-sm text-warning-600 dark:text-warning-400">Active</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
        <CheckCircleIcon class="h-8 w-8 text-success-500" />
        <div>
          <p class="text-2xl font-bold text-success-700 dark:text-success-300">{{ summary.converted }}</p>
          <p class="text-sm text-success-600 dark:text-success-400">Converted</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
        <LockOpenIcon class="h-8 w-8 text-primary-500" />
        <div>
          <p class="text-2xl font-bold text-primary-700 dark:text-primary-300">{{ summary.released }}</p>
          <p class="text-sm text-primary-600 dark:text-primary-400">Released</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
        <XCircleIcon class="h-8 w-8 text-danger-500" />
        <div>
          <p class="text-2xl font-bold text-danger-700 dark:text-danger-300">{{ summary.expired }}</p>
          <p class="text-sm text-danger-600 dark:text-danger-400">Expired</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
        <ClockIcon class="h-8 w-8 text-orange-500" />
        <div>
          <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">{{ summary.expiringSoon }}</p>
          <p class="text-sm text-orange-600 dark:text-orange-400">Expiring Soon</p>
        </div>
      </div>
    </div>

    <!-- Total Reserved -->
    <div v-if="summary" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <CubeIcon class="h-5 w-5" />
      <span><strong>{{ summary.totalQuantity }}</strong> units currently reserved across <strong>{{ summary.active }}</strong> active reservations</span>
    </div>

    <!-- Filters & Actions -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products, orders..."
            class="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            @keyup.enter="fetchReservations"
          />
        </div>

        <select
          v-model="statusFilter"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @change="fetchReservations"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            v-model="expiringSoonFilter"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
            @change="fetchReservations"
          />
          Expiring soon
        </label>

        <BaseButton variant="secondary" size="sm" @click="fetchReservations">
          <ArrowPathIcon class="mr-1 h-4 w-4" />
          Refresh
        </BaseButton>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton
          v-if="selectedIds.length > 0"
          variant="warning"
          size="sm"
          :loading="isBulkReleasing"
          @click="bulkRelease"
        >
          <LockOpenIcon class="mr-1 h-4 w-4" />
          Release {{ selectedIds.length }} selected
        </BaseButton>

        <BaseButton
          v-if="summary && summary.expired > 0"
          variant="danger"
          size="sm"
          :loading="isReleasingExpired"
          @click="releaseAllExpired"
        >
          <XCircleIcon class="mr-1 h-4 w-4" />
          Release All Expired
        </BaseButton>
      </div>
    </div>

    <!-- Reservations Table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="reservations"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchReservations()"
        @update:perPage="pagination.perPage.value = $event; fetchReservations()"
      >
        <template #header-select>
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
            :checked="allSelected"
            :indeterminate="selectedIds.length > 0 && !allSelected"
            @change="toggleAll"
          />
        </template>

        <template #cell-select="{ row }">
          <input
            v-if="row.isActive"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
            :checked="selectedIds.includes(row.id)"
            @change="toggleSelect(row.id)"
          />
        </template>

        <template #cell-createdAt="{ row }">
          <div class="flex items-center gap-1.5">
            <ClockIcon class="h-4 w-4 text-gray-400" />
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatRelative(row.createdAt) }}</span>
          </div>
        </template>

        <template #cell-product="{ row }">
          <div class="flex items-center gap-3">
            <img
              v-if="row.product?.imageUrl"
              :src="row.product.imageUrl"
              :alt="row.product?.name"
              class="h-10 w-10 rounded-lg object-cover"
            />
            <div
              v-else
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
            >
              <CubeIcon class="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ row.product?.name ?? '—' }}</p>
              <p v-if="row.variant" class="text-xs text-gray-500 dark:text-gray-400">
                {{ row.variant.name ?? row.variant.sku }}
              </p>
              <p v-if="row.product?.sku" class="text-xs text-gray-400 dark:text-gray-500">
                SKU: {{ row.product.sku }}
              </p>
            </div>
          </div>
        </template>

        <template #cell-order="{ row }">
          <div v-if="row.order" class="flex items-center gap-2">
            <ShoppingCartIcon class="h-4 w-4 text-gray-400" />
            <div>
              <RouterLink
                :to="`/admin/orders/${row.order.id}`"
                class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {{ row.order.orderNumber }}
              </RouterLink>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.order.customerName }}</p>
            </div>
          </div>
          <span v-else class="text-sm text-gray-400">—</span>
        </template>

        <template #cell-vendor="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.vendor?.storeName ?? '—' }}
          </span>
        </template>

        <template #cell-quantity="{ row }">
          <span class="font-bold text-gray-900 dark:text-white">{{ row.quantity }}</span>
        </template>

        <template #cell-expiresAt="{ row }">
          <div v-if="row.expiresAt && row.isActive">
            <span
              class="text-sm"
              :class="isExpiringSoon(row.expiresAt)
                ? 'font-medium text-orange-600 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400'"
            >
              {{ formatRelative(row.expiresAt) }}
            </span>
            <div v-if="isExpiringSoon(row.expiresAt)" class="flex items-center gap-1 text-xs text-orange-500">
              <ExclamationTriangleIcon class="h-3 w-3" />
              Expiring soon
            </div>
          </div>
          <span v-else-if="row.convertedAt" class="text-xs text-success-600 dark:text-success-400">
            Converted {{ formatRelative(row.convertedAt) }}
          </span>
          <span v-else-if="row.releasedAt" class="text-xs text-gray-500 dark:text-gray-400">
            Released {{ formatRelative(row.releasedAt) }}
          </span>
          <span v-else class="text-sm text-gray-400">—</span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)">
            {{ row.statusLabel }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <BaseButton
            v-if="row.isActive"
            variant="secondary"
            size="sm"
            @click="openReleaseModal(row.id)"
          >
            <LockOpenIcon class="mr-1 h-4 w-4" />
            Release
          </BaseButton>
        </template>

        <template #empty>
          <EmptyState
            title="No reservations found"
            description="No stock reservations match your filters."
          >
            <template #icon>
              <LockClosedIcon class="h-12 w-12 text-gray-400" />
            </template>
          </EmptyState>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Release Modal -->
    <BaseModal
      :open="releaseModalOpen"
      title="Release Reservation"
      @close="closeReleaseModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          This will release the reserved stock back to available inventory. The customer's cart or order may be affected.
        </p>

        <FormInput
          v-model="releaseReason"
          label="Reason (optional)"
          placeholder="e.g., Order cancelled, customer request..."
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeReleaseModal">
            Cancel
          </BaseButton>
          <BaseButton
            variant="warning"
            :loading="isReleasing"
            @click="confirmRelease"
          >
            <LockOpenIcon class="mr-1 h-4 w-4" />
            Release Reservation
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
