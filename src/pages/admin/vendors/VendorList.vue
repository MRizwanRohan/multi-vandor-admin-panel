<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Vendor List — Vendor management list page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { vendorService } from '@/services'
import { useCurrency, usePagination, useConfirm, useToast, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Vendor, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const confirm = useConfirm()
const toast = useToast()
const pagination = usePagination()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Vendors', [
    { label: 'Vendors' },
  ], 'Manage marketplace vendors')
  fetchVendors()
})

// Data
const vendors = ref<Vendor[]>([])
const isLoading = ref(true)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const verificationFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

const verificationOptions = [
  { value: '', label: 'All Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Vendor', sortable: true },
  { key: 'products', label: 'Products', sortable: true, align: 'center' },
  { key: 'revenue', label: 'Total Revenue', sortable: true, align: 'right' },
  { key: 'commission', label: 'Commission', sortable: true, align: 'center' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
  { key: 'verification', label: 'Verification', sortable: true, align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch vendors
async function fetchVendors() {
  isLoading.value = true
  try {
    const response = await vendorService.getAll({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value,
      status: statusFilter.value || undefined,
    })
    vendors.value = response.data
    pagination.totalItems.value = response.meta.total
  } catch (error) {
    // Mock data
    vendors.value = [
      {
        id: 1,
        user_id: 1,
        store_name: 'Fashion Store',
        slug: 'fashion-store',
        business_name: 'Fashion Store Ltd',
        business_type: 'retail',
        description: 'Fashion and accessories store',
        logo_url: null,
        banner_url: null,
        status: 'approved' as const,
        commission_rate: 10,
        rating_average: 4.5,
        review_count: 120,
        product_count: 156,
        order_count: 450,
        total_sales: 850000,
        owner: { id: 1, name: 'John Doe', email: 'fashion@example.com', phone: '+880123456789', avatar: null },
        is_verified: true,
        verified_at: '2024-01-01',
        created_at: '2024-01-01',
        updated_at: '2024-01-15',
      },
      {
        id: 2,
        user_id: 2,
        store_name: 'Tech Hub',
        slug: 'tech-hub',
        business_name: 'Tech Hub Ltd',
        business_type: 'electronics',
        description: 'Electronics and gadgets',
        logo_url: null,
        banner_url: null,
        status: 'pending' as const,
        commission_rate: 12,
        rating_average: 4.2,
        review_count: 85,
        product_count: 89,
        order_count: 320,
        total_sales: 1250000,
        owner: { id: 2, name: 'Jane Smith', email: 'tech@example.com', phone: '+880123456788', avatar: null },
        is_verified: false,
        verified_at: null,
        created_at: '2024-01-05',
        updated_at: '2024-01-15',
      },
      {
        id: 3,
        user_id: 3,
        store_name: 'Sports Zone',
        slug: 'sports-zone',
        business_name: 'Sports Zone Inc',
        business_type: 'sports',
        description: 'Sports equipment and gear',
        logo_url: null,
        banner_url: null,
        status: 'suspended' as const,
        commission_rate: 8,
        rating_average: 4.0,
        review_count: 45,
        product_count: 45,
        order_count: 150,
        total_sales: 320000,
        owner: { id: 3, name: 'Bob Wilson', email: 'sports@example.com', phone: '+880123456787', avatar: null },
        is_verified: true,
        verified_at: '2024-01-10',
        created_at: '2024-01-10',
        updated_at: '2024-01-15',
      },
    ] as Vendor[]
    pagination.totalItems.value = 3
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch([searchQuery, statusFilter, verificationFilter], () => {
  pagination.currentPage.value = 1
  fetchVendors()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchVendors()
})

// Actions
function viewVendor(vendor: Vendor) {
  router.push(`/admin/vendors/${vendor.id}`)
}

async function verifyVendor(vendor: Vendor) {
  const confirmed = await confirm.show({
    title: 'Verify Vendor',
    message: `Are you sure you want to verify "${vendor.store_name}"?`,
    confirmText: 'Verify',
    cancelText: 'Cancel',
    variant: 'info',
  })

  if (confirmed) {
    try {
      await vendorService.verify(vendor.id)
      toast.success('Vendor verified successfully')
      fetchVendors()
    } catch (error) {
      toast.error('Failed to verify vendor')
    }
  }
}

async function rejectVendor(vendor: Vendor) {
  const confirmed = await confirm.show({
    title: 'Reject Vendor',
    message: `Are you sure you want to reject "${vendor.store_name}"?`,
    confirmText: 'Reject',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      await vendorService.updateStatus(vendor.id, 'rejected')
      toast.success('Vendor rejected')
      fetchVendors()
    } catch (error) {
      toast.error('Failed to reject vendor')
    }
  }
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    active: 'success',
    inactive: 'warning',
    suspended: 'danger',
  }
  return variants[status] || 'secondary'
}

function getVerificationVariant(status: string): 'success' | 'warning' | 'danger' {
  const variants: Record<string, 'success' | 'warning' | 'danger'> = {
    verified: 'success',
    pending: 'warning',
    rejected: 'danger',
  }
  return variants[status] || 'warning'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search vendors..."
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-40"
        />

        <FormSelect
          v-model="verificationFilter"
          name="verification"
          :options="verificationOptions"
          class="w-44"
        />
      </div>
    </div>

    <!-- Vendors table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="vendors"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event"
        @update:perPage="pagination.perPage.value = $event"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
              <BuildingStorefrontIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ row.store_name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ row.owner?.email }}</p>
            </div>
          </div>
        </template>

        <template #cell-products="{ row }">
          <span class="text-gray-900 dark:text-white">
            {{ row.product_count || 0 }}
          </span>
        </template>

        <template #cell-revenue="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ currency.formatCurrency(row.total_sales || 0) }}
          </span>
        </template>

        <template #cell-commission="{ row }">
          <span class="text-gray-900 dark:text-white">
            {{ row.commission_rate }}%
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)" class="capitalize">
            {{ row.status }}
          </BaseBadge>
        </template>

        <template #cell-verification="{ row }">
          <BaseBadge :variant="getVerificationVariant(row.is_verified ? 'verified' : 'pending')" class="capitalize">
            {{ row.is_verified ? 'verified' : 'pending' }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              @click="viewVendor(row)"
            >
              <EyeIcon class="h-5 w-5" />
            </button>
            <button
              v-if="!row.is_verified"
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-success-600 dark:hover:bg-gray-700 dark:hover:text-success-400"
              @click="verifyVendor(row)"
            >
              <CheckCircleIcon class="h-5 w-5" />
            </button>
            <button
              v-if="!row.is_verified"
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-danger-600 dark:hover:bg-gray-700 dark:hover:text-danger-400"
              @click="rejectVendor(row)"
            >
              <XCircleIcon class="h-5 w-5" />
            </button>
          </div>
        </template>

        <template #empty>
          <EmptyState
            title="No vendors found"
            description="Vendors who register will appear here."
          />
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
