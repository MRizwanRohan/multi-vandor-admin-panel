<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Vendor List — Vendor management list page (real API) -->
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
import BaseModal from '@/components/ui/BaseModal.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { Vendor, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ArrowPathIcon,
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

// Correct status options matching backend VendorStatus enum
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'banned', label: 'Banned' },
]

const verificationOptions = [
  { value: '', label: 'All Verification' },
  { value: '1', label: 'Verified' },
  { value: '0', label: 'Not Verified' },
]

// Reject/Suspend modal
const showReasonModal = ref(false)
const reasonModalTitle = ref('')
const reasonModalAction = ref<'reject' | 'suspend'>('reject')
const reasonText = ref('')
const reasonTargetVendor = ref<Vendor | null>(null)

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

// Fetch vendors from API (no mock fallback)
async function fetchVendors() {
  isLoading.value = true
  try {
    const response = await vendorService.getAll({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      is_verified: verificationFilter.value ? verificationFilter.value === '1' : undefined,
    })
    vendors.value = response.data
    if (response.meta) {
      pagination.setMeta(response.meta)
    }
  } catch (error) {
    toast.error('Failed to load vendors')
    vendors.value = []
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

// Approve vendor
async function approveVendor(vendor: Vendor) {
  const confirmed = await confirm.show({
    title: 'Approve Vendor',
    message: `Are you sure you want to approve "${vendor.store_name}"? They will be able to start selling products.`,
    confirmText: 'Approve',
    cancelText: 'Cancel',
    variant: 'info',
  })

  if (confirmed) {
    try {
      await (vendorService as any).approve(vendor.id)
      toast.success(`"${vendor.store_name}" has been approved`)
      fetchVendors()
    } catch (error) {
      toast.error('Failed to approve vendor')
    }
  }
}

// Open reject modal
function openRejectModal(vendor: Vendor) {
  reasonTargetVendor.value = vendor
  reasonModalTitle.value = `Reject "${vendor.store_name}"`
  reasonModalAction.value = 'reject'
  reasonText.value = ''
  showReasonModal.value = true
}

// Open suspend modal
function openSuspendModal(vendor: Vendor) {
  reasonTargetVendor.value = vendor
  reasonModalTitle.value = `Suspend "${vendor.store_name}"`
  reasonModalAction.value = 'suspend'
  reasonText.value = ''
  showReasonModal.value = true
}

// Submit reject/suspend with reason
async function submitReasonAction() {
  if (!reasonTargetVendor.value || !reasonText.value.trim()) {
    toast.error('Please provide a reason')
    return
  }

  try {
    if (reasonModalAction.value === 'reject') {
      await (vendorService as any).reject(reasonTargetVendor.value.id, reasonText.value)
      toast.success(`"${reasonTargetVendor.value.store_name}" has been rejected`)
    } else {
      await (vendorService as any).suspend(reasonTargetVendor.value.id, reasonText.value)
      toast.success(`"${reasonTargetVendor.value.store_name}" has been suspended`)
    }
    showReasonModal.value = false
    fetchVendors()
  } catch (error) {
    toast.error(`Failed to ${reasonModalAction.value} vendor`)
  }
}

// Reactivate vendor
async function reactivateVendor(vendor: Vendor) {
  const confirmed = await confirm.show({
    title: 'Reactivate Vendor',
    message: `Are you sure you want to reactivate "${vendor.store_name}"?`,
    confirmText: 'Reactivate',
    cancelText: 'Cancel',
    variant: 'info',
  })

  if (confirmed) {
    try {
      await (vendorService as any).reactivate(vendor.id)
      toast.success(`"${vendor.store_name}" has been reactivated`)
      fetchVendors()
    } catch (error) {
      toast.error('Failed to reactivate vendor')
    }
  }
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'secondary' | 'info' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'info'> = {
    active: 'success',
    approved: 'info',
    pending: 'warning',
    suspended: 'danger',
    rejected: 'danger',
    banned: 'danger',
    inactive: 'secondary',
  }
  return variants[status] || 'secondary'
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
              <img v-if="row.logo_url" :src="row.logo_url" :alt="row.store_name" class="h-10 w-10 rounded-full object-cover" />
              <BuildingStorefrontIcon v-else class="h-5 w-5 text-primary-600 dark:text-primary-400" />
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
          <BaseBadge :variant="row.is_verified ? 'success' : 'warning'" class="capitalize">
            {{ row.is_verified ? 'Verified' : 'Pending' }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <!-- View -->
            <button
              type="button"
              class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View details"
              @click="viewVendor(row)"
            >
              <EyeIcon class="h-5 w-5" />
            </button>

            <!-- Approve (for pending vendors) -->
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
              title="Approve vendor"
              @click="approveVendor(row)"
            >
              <CheckCircleIcon class="h-5 w-5" />
            </button>

            <!-- Reject (for pending vendors) -->
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              title="Reject vendor"
              @click="openRejectModal(row)"
            >
              <XCircleIcon class="h-5 w-5" />
            </button>

            <!-- Suspend (for active/approved vendors) -->
            <button
              v-if="row.status === 'active' || row.status === 'approved'"
              type="button"
              class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              title="Suspend vendor"
              @click="openSuspendModal(row)"
            >
              <NoSymbolIcon class="h-5 w-5" />
            </button>

            <!-- Reactivate (for suspended vendors) -->
            <button
              v-if="row.status === 'suspended'"
              type="button"
              class="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
              title="Reactivate vendor"
              @click="reactivateVendor(row)"
            >
              <ArrowPathIcon class="h-5 w-5" />
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

    <!-- Reject / Suspend Reason Modal -->
    <BaseModal
      :show="showReasonModal"
      :title="reasonModalTitle"
      size="md"
      @close="showReasonModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <template v-if="reasonModalAction === 'reject'">
            Please provide a reason for rejecting this vendor application.
          </template>
          <template v-else>
            Please provide a reason for suspending this vendor. They will not be able to sell products while suspended.
          </template>
        </p>

        <FormTextarea
          v-model="reasonText"
          name="reason"
          label="Reason"
          placeholder="Enter the reason..."
          :rows="4"
          required
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showReasonModal = false">
            Cancel
          </BaseButton>
          <BaseButton
            :variant="reasonModalAction === 'reject' ? 'danger' : 'danger'"
            :disabled="!reasonText.trim()"
            @click="submitReasonAction"
          >
            {{ reasonModalAction === 'reject' ? 'Reject Vendor' : 'Suspend Vendor' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
