<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Shipments — List and manage shipments                      -->
<!-- Uses shippingService.getShipments(), updateShipmentStatus()       -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { shippingService } from '@/services'
import { useToast, usePagination, useCurrency, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import type { Shipment, ShipmentStatus, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  TruckIcon,
  EyeIcon,
  ArrowPathIcon,
  MapPinIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const pagination = usePagination()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// ── Filters ──────────────────────────────────────────────────────

const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
]

// ── Data ─────────────────────────────────────────────────────────

const shipments = ref<Shipment[]>([])
const isLoading = ref(true)

// ── Table ────────────────────────────────────────────────────────

const columns: TableColumn[] = [
  { key: 'tracking_number', label: 'Tracking #', sortable: true },
  { key: 'order', label: 'Order' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'shipped_at', label: 'Shipped', sortable: true },
  { key: 'estimated_delivery', label: 'Est. Delivery' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchShipments() {
  isLoading.value = true
  try {
    const response = await shippingService.getShipments({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value || undefined,
      status: (statusFilter.value as ShipmentStatus) || undefined,
    })
    // Handle nested response
    const resData = response.data as any
    if (Array.isArray(resData)) {
      shipments.value = resData
    } else if (resData?.shipments) {
      shipments.value = resData.shipments
    } else if (Array.isArray(response)) {
      shipments.value = response
    } else {
      shipments.value = []
    }
    if (response.meta) {
      pagination.setMeta(response.meta)
    } else if (resData?.pagination) {
      pagination.setMeta(resData.pagination)
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load shipments')
  } finally {
    isLoading.value = false
  }
}

async function refresh() {
  await fetchShipments()
}

// ── Actions ──────────────────────────────────────────────────────

function goToDetail(shipment: Shipment) {
  router.push(`/vendor/shipments/${shipment.id}`)
}

async function updateStatus(shipment: Shipment, newStatus: ShipmentStatus) {
  try {
    await shippingService.updateShipmentStatus(shipment.id, newStatus)
    toast.success(`Status updated to ${formatStatus(newStatus)}`)
    await refresh()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to update status')
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    returned: 'Returned',
  }
  return labels[status] || status
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
    pending: 'warning',
    picked_up: 'info',
    in_transit: 'info',
    out_for_delivery: 'info',
    delivered: 'success',
    returned: 'danger',
  }
  return map[status] || 'secondary'
}

function getNextStatus(current: string): ShipmentStatus | null {
  const flow: Record<string, ShipmentStatus> = {
    pending: 'picked_up',
    picked_up: 'in_transit',
    in_transit: 'out_for_delivery',
    out_for_delivery: 'delivered',
  }
  return flow[current] || null
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Shipments', [
    { label: 'Orders', to: '/vendor/orders' },
    { label: 'Shipments' },
  ], 'Track and manage your shipments')
  fetchShipments()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
          <TruckIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Shipments</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ shipments.length }} shipment{{ shipments.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            name="search"
            placeholder="Search by tracking # or order..."
            class="pl-10"
            @keyup.enter="fetchShipments"
          />
        </div>
        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-44"
          @change="fetchShipments"
        />
        <BaseButton variant="secondary" size="sm" @click="refresh">
          <ArrowPathIcon class="h-4 w-4" />
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Shipments table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="shipments"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchShipments()"
        @update:perPage="pagination.perPage.value = $event; fetchShipments()"
      >
        <template #cell-tracking_number="{ row }">
          <RouterLink
            :to="`/vendor/shipments/${row.id}`"
            class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ row.tracking_number || `SHP-${row.id}` }}
          </RouterLink>
        </template>

        <template #cell-order="{ row }">
          <div>
            <RouterLink
              v-if="row.order_id"
              :to="`/vendor/orders/${row.order_id}`"
              class="font-medium text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
            >
              #{{ row.order?.order_number || row.order_id }}
            </RouterLink>
            <div v-if="row.items?.length" class="text-xs text-gray-500 dark:text-gray-400">
              {{ row.items.length }} item{{ row.items.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </template>

        <template #cell-carrier="{ row }">
          <span class="text-gray-700 dark:text-gray-300">
            {{ row.carrier || '-' }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <div class="flex flex-col items-center gap-1">
            <BaseBadge :variant="getStatusVariant(row.status)">
              {{ formatStatus(row.status) }}
            </BaseBadge>
            <button
              v-if="getNextStatus(row.status)"
              type="button"
              class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              @click="updateStatus(row, getNextStatus(row.status)!)"
            >
              Mark as {{ formatStatus(getNextStatus(row.status)!) }}
            </button>
          </div>
        </template>

        <template #cell-shipped_at="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ row.shipped_at ? formatDate(row.shipped_at) : 'Not shipped' }}
          </span>
        </template>

        <template #cell-estimated_delivery="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ row.estimated_delivery ? formatDate(row.estimated_delivery) : '-' }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <RouterLink
              :to="`/vendor/shipments/${row.id}`"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
              title="View Details"
            >
              <EyeIcon class="h-4 w-4" />
            </RouterLink>
          </div>
        </template>

        <!-- Empty state -->
        <template #empty>
          <div class="py-12 text-center">
            <TruckIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No shipments</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Shipments will appear here once you ship orders.
            </p>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
