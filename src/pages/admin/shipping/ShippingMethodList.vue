<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Shipping Methods — Method management with real API           -->
<!-- Uses shippingService.getMethods(), createMethod(), etc             -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { shippingService } from '@/services'
import { useToast, usePagination, useConfirm, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import type { ShippingMethod, ShippingZone, TableColumn, ShippingMethodType } from '@/types'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  TruckIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const pagination = usePagination()
const confirm = useConfirm()
const { formatCurrency } = useCurrency()

// ── Filters ──────────────────────────────────────────────────────

const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const zoneFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'flat', label: 'Flat Rate' },
  { value: 'per_item', label: 'Per Item' },
  { value: 'weight_based', label: 'Weight Based' },
  { value: 'price_based', label: 'Price Based' },
  { value: 'free', label: 'Free Shipping' },
]

// ── Data ─────────────────────────────────────────────────────────

const methods = ref<ShippingMethod[]>([])
const zones = ref<ShippingZone[]>([])
const isLoading = ref(true)

const zoneOptions = computed(() => [
  { value: '', label: 'All Zones' },
  ...zones.value.map(z => ({ value: z.id.toString(), label: z.name })),
])

// ── Table ────────────────────────────────────────────────────────

const columns: TableColumn[] = [
  { key: 'name', label: 'Method Name', sortable: true },
  { key: 'zone', label: 'Zone' },
  { key: 'type', label: 'Type' },
  { key: 'rate', label: 'Rate', align: 'right' },
  { key: 'delivery_days', label: 'Delivery' },
  { key: 'is_active', label: 'Status', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchMethods() {
  isLoading.value = true
  try {
    const response = await shippingService.getMethods({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value || undefined,
      is_active: statusFilter.value === 'active' ? true : statusFilter.value === 'inactive' ? false : undefined,
      type: (typeFilter.value as ShippingMethodType) || undefined,
      zone_id: zoneFilter.value ? parseInt(zoneFilter.value, 10) : undefined,
    })
    // Handle nested response
    const resData = response.data as any
    if (Array.isArray(resData)) {
      methods.value = resData
    } else if (resData?.shipping_methods || resData?.methods) {
      methods.value = resData.shipping_methods || resData.methods
    } else if (Array.isArray(response)) {
      methods.value = response
    } else {
      methods.value = []
    }
    if (response.meta) {
      pagination.setMeta(response.meta)
    } else if (resData?.pagination) {
      pagination.setMeta(resData.pagination)
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load shipping methods')
  } finally {
    isLoading.value = false
  }
}

async function fetchZones() {
  try {
    const response = await shippingService.getZones({ per_page: 100 })
    const resData = response.data as any
    if (Array.isArray(resData)) {
      zones.value = resData
    } else if (resData?.shipping_zones || resData?.zones) {
      zones.value = resData.shipping_zones || resData.zones
    } else {
      zones.value = []
    }
  } catch {
    zones.value = []
  }
}

async function refresh() {
  await fetchMethods()
}

// ── Actions ──────────────────────────────────────────────────────

function goToCreate() {
  router.push('/admin/shipping/methods/new')
}

function goToEdit(method: ShippingMethod) {
  router.push(`/admin/shipping/methods/${method.id}`)
}

async function deleteMethod(method: ShippingMethod) {
  const confirmed = await confirm.require({
    title: 'Delete Shipping Method',
    message: `Are you sure you want to delete "${method.name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  if (!confirmed) return

  try {
    await shippingService.deleteMethod(method.id)
    toast.success('Shipping method deleted')
    await refresh()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to delete method')
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    flat: 'Flat Rate',
    per_item: 'Per Item',
    weight_based: 'Weight Based',
    price_based: 'Price Based',
    free: 'Free Shipping',
  }
  return labels[type] || type
}

function getTypeVariant(type: string): 'info' | 'success' | 'warning' | 'secondary' {
  const variants: Record<string, 'info' | 'success' | 'warning' | 'secondary'> = {
    flat: 'info',
    per_item: 'info',
    weight_based: 'warning',
    price_based: 'warning',
    free: 'success',
  }
  return variants[type] || 'secondary'
}

function formatRate(method: ShippingMethod): string {
  if (method.type === 'free') return 'Free'
  if (method.base_rate !== null && method.base_rate !== undefined) {
    return formatCurrency(method.base_rate)
  }
  return '-'
}

function formatDeliveryDays(method: ShippingMethod): string {
  const min = method.min_delivery_days
  const max = method.max_delivery_days
  if (min && max) {
    return min === max ? `${min} days` : `${min}-${max} days`
  }
  if (min) return `${min}+ days`
  if (max) return `Up to ${max} days`
  return '-'
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Shipping Methods', [
    { label: 'Shipping', to: '/admin/shipping' },
    { label: 'Methods' },
  ], 'Manage shipping methods')
  fetchZones()
  fetchMethods()
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
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Shipping Methods</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ methods.length }} method{{ methods.length !== 1 ? 's' : '' }} configured
          </p>
        </div>
      </div>
      <BaseButton @click="goToCreate">
        <PlusIcon class="mr-2 h-4 w-4" />
        Add Method
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            name="search"
            placeholder="Search methods..."
            class="pl-10"
            @keyup.enter="fetchMethods"
          />
        </div>
        <FormSelect
          v-model="zoneFilter"
          name="zone"
          :options="zoneOptions"
          class="w-36"
          @change="fetchMethods"
        />
        <FormSelect
          v-model="typeFilter"
          name="type"
          :options="typeOptions"
          class="w-36"
          @change="fetchMethods"
        />
        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-32"
          @change="fetchMethods"
        />
        <BaseButton variant="secondary" size="sm" @click="refresh">
          <ArrowPathIcon class="h-4 w-4" />
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Methods table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="methods"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchMethods()"
        @update:perPage="pagination.perPage.value = $event; fetchMethods()"
      >
        <template #cell-name="{ row }">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ row.name }}
            </div>
            <div v-if="row.description" class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {{ row.description }}
            </div>
          </div>
        </template>

        <template #cell-zone="{ row }">
          <span class="text-gray-700 dark:text-gray-300">
            {{ row.zone?.name || row.zone_name || '-' }}
          </span>
        </template>

        <template #cell-type="{ row }">
          <BaseBadge :variant="getTypeVariant(row.type)">
            {{ getTypeLabel(row.type) }}
          </BaseBadge>
        </template>

        <template #cell-rate="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ formatRate(row) }}
          </span>
        </template>

        <template #cell-delivery_days="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ formatDeliveryDays(row) }}
          </span>
        </template>

        <template #cell-is_active="{ row }">
          <BaseBadge :variant="row.is_active ? 'success' : 'secondary'">
            {{ row.is_active ? 'Active' : 'Inactive' }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Edit Method"
              @click="goToEdit(row)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-danger-500 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-900/20"
              title="Delete Method"
              @click="deleteMethod(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <!-- Empty state -->
        <template #empty>
          <div class="py-12 text-center">
            <TruckIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No shipping methods</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new shipping method.
            </p>
            <div class="mt-6">
              <BaseButton @click="goToCreate">
                <PlusIcon class="mr-2 h-4 w-4" />
                Add Method
              </BaseButton>
            </div>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
