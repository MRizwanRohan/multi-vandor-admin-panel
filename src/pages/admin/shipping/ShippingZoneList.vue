<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Shipping Zones — Zone management with real API              -->
<!-- Uses shippingService.getZones(), createZone(), updateZone(), etc  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { shippingService } from '@/services'
import { useToast, usePagination, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import type { ShippingZone, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const pagination = usePagination()
const confirm = useConfirm()

// ── Filters ──────────────────────────────────────────────────────

const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

// ── Data ─────────────────────────────────────────────────────────

const zones = ref<ShippingZone[]>([])
const isLoading = ref(true)

// ── Table ────────────────────────────────────────────────────────

const columns: TableColumn[] = [
  { key: 'name', label: 'Zone Name', sortable: true },
  { key: 'countries', label: 'Countries' },
  { key: 'methods_count', label: 'Methods', align: 'center' },
  { key: 'is_active', label: 'Status', align: 'center' },
  { key: 'created_at', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchZones() {
  isLoading.value = true
  try {
    const response = await shippingService.getZones({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value || undefined,
      is_active: statusFilter.value === 'active' ? true : statusFilter.value === 'inactive' ? false : undefined,
    })
    // Handle nested response
    const resData = response.data as any
    if (Array.isArray(resData)) {
      zones.value = resData
    } else if (resData?.shipping_zones || resData?.zones) {
      zones.value = resData.shipping_zones || resData.zones
    } else if (Array.isArray(response)) {
      zones.value = response
    } else {
      zones.value = []
    }
    if (response.meta) {
      pagination.setMeta(response.meta)
    } else if (resData?.pagination) {
      pagination.setMeta(resData.pagination)
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load shipping zones')
  } finally {
    isLoading.value = false
  }
}

async function refresh() {
  await fetchZones()
}

// ── Actions ──────────────────────────────────────────────────────

function goToCreate() {
  router.push('/admin/shipping/zones/new')
}

function goToEdit(zone: ShippingZone) {
  router.push(`/admin/shipping/zones/${zone.id}`)
}

async function deleteZone(zone: ShippingZone) {
  const confirmed = await confirm.require({
    title: 'Delete Shipping Zone',
    message: `Are you sure you want to delete "${zone.name}"? This will also remove all shipping methods in this zone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  if (!confirmed) return

  try {
    await shippingService.deleteZone(zone.id)
    toast.success('Shipping zone deleted')
    await refresh()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to delete zone')
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function formatCountries(countries: string[]): string {
  if (!countries || countries.length === 0) return 'No countries'
  if (countries.length <= 3) return countries.join(', ')
  return `${countries.slice(0, 3).join(', ')} +${countries.length - 3} more`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString()
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Shipping Zones', [
    { label: 'Shipping', to: '/admin/shipping' },
    { label: 'Zones' },
  ], 'Manage shipping zones')
  fetchZones()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
          <GlobeAltIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Shipping Zones</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ zones.length }} zone{{ zones.length !== 1 ? 's' : '' }} configured
          </p>
        </div>
      </div>
      <BaseButton @click="goToCreate">
        <PlusIcon class="mr-2 h-4 w-4" />
        Add Zone
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
            placeholder="Search zones..."
            class="pl-10"
            @keyup.enter="fetchZones"
          />
        </div>
        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-40"
          @change="fetchZones"
        />
        <BaseButton variant="secondary" size="sm" @click="refresh">
          <ArrowPathIcon class="h-4 w-4" />
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Zones table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="zones"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchZones()"
        @update:perPage="pagination.perPage.value = $event; fetchZones()"
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

        <template #cell-countries="{ row }">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            {{ formatCountries(row.countries) }}
          </div>
        </template>

        <template #cell-methods_count="{ row }">
          <span class="text-gray-700 dark:text-gray-300">
            {{ row.methods_count || row.shipping_methods?.length || 0 }}
          </span>
        </template>

        <template #cell-is_active="{ row }">
          <BaseBadge :variant="row.is_active ? 'success' : 'secondary'">
            {{ row.is_active ? 'Active' : 'Inactive' }}
          </BaseBadge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Edit Zone"
              @click="goToEdit(row)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-danger-500 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-900/20"
              title="Delete Zone"
              @click="deleteZone(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <!-- Empty state -->
        <template #empty>
          <div class="py-12 text-center">
            <GlobeAltIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No shipping zones</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new shipping zone.
            </p>
            <div class="mt-6">
              <BaseButton @click="goToCreate">
                <PlusIcon class="mr-2 h-4 w-4" />
                Add Zone
              </BaseButton>
            </div>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
