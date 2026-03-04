<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Vendor Detail — View vendor details + Approve/Reject/Suspend -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { vendorService } from '@/services'
import { useCurrency, useDate, useConfirm, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { Vendor } from '@/types'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  StarIcon,
  IdentificationIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const confirm = useConfirm()
const toast = useToast()

// Data
const vendor = ref<Vendor | null>(null)
const isLoading = ref(true)
const vendorId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? null : id
})

// Reason modal state
const showReasonModal = ref(false)
const reasonModalTitle = ref('')
const reasonModalAction = ref<'reject' | 'suspend'>('reject')
const reasonText = ref('')

// Set page info
onMounted(() => {
  if (!vendorId.value) {
    toast.error('Invalid vendor ID')
    router.push('/admin/vendors')
    return
  }
  fetchVendor()
})

// Fetch vendor (no mock fallback)
async function fetchVendor() {
  isLoading.value = true
  try {
    vendor.value = await vendorService.getById(vendorId.value!)
    breadcrumbStore.setPageInfo(vendor.value.store_name, [
      { label: 'Vendors', to: '/admin/vendors' },
      { label: vendor.value.store_name },
    ])
  } catch (error) {
    toast.error('Failed to fetch vendor details')
    router.push('/admin/vendors')
  } finally {
    isLoading.value = false
  }
}

// ─── Actions ─────────────────────────────────────────────────────

// Approve vendor (pending → approved)
async function approveVendor() {
  if (!vendor.value) return

  const confirmed = await confirm.show({
    title: 'Approve Vendor',
    message: `Are you sure you want to approve "${vendor.value.store_name}"? They will be able to start selling products.`,
    confirmText: 'Approve',
    cancelText: 'Cancel',
    variant: 'info',
  })

  if (confirmed) {
    try {
      await (vendorService as any).approve(vendor.value.id)
      toast.success(`"${vendor.value.store_name}" has been approved`)
      fetchVendor()
    } catch (error) {
      toast.error('Failed to approve vendor')
    }
  }
}

// Open reject modal
function openRejectModal() {
  if (!vendor.value) return
  reasonModalTitle.value = `Reject "${vendor.value.store_name}"`
  reasonModalAction.value = 'reject'
  reasonText.value = ''
  showReasonModal.value = true
}

// Open suspend modal
function openSuspendModal() {
  if (!vendor.value) return
  reasonModalTitle.value = `Suspend "${vendor.value.store_name}"`
  reasonModalAction.value = 'suspend'
  reasonText.value = ''
  showReasonModal.value = true
}

// Submit reject/suspend with reason
async function submitReasonAction() {
  if (!vendor.value || !reasonText.value.trim()) {
    toast.error('Please provide a reason')
    return
  }

  try {
    if (reasonModalAction.value === 'reject') {
      await (vendorService as any).reject(vendor.value.id, reasonText.value)
      toast.success(`"${vendor.value.store_name}" has been rejected`)
    } else {
      await (vendorService as any).suspend(vendor.value.id, reasonText.value)
      toast.success(`"${vendor.value.store_name}" has been suspended`)
    }
    showReasonModal.value = false
    fetchVendor()
  } catch (error) {
    toast.error(`Failed to ${reasonModalAction.value} vendor`)
  }
}

// Reactivate suspended vendor
async function reactivateVendor() {
  if (!vendor.value) return

  const confirmed = await confirm.show({
    title: 'Reactivate Vendor',
    message: `Are you sure you want to reactivate "${vendor.value.store_name}"? They will be able to sell products again.`,
    confirmText: 'Reactivate',
    cancelText: 'Cancel',
    variant: 'info',
  })

  if (confirmed) {
    try {
      await (vendorService as any).reactivate(vendor.value.id)
      toast.success(`"${vendor.value.store_name}" has been reactivated`)
      fetchVendor()
    } catch (error) {
      toast.error('Failed to reactivate vendor')
    }
  }
}

// Verify NID
async function verifyNid() {
  if (!vendor.value) return

  const confirmed = await confirm.show({
    title: 'Verify NID',
    message: `Are you sure you want to verify the NID documents for "${vendor.value.store_name}"?`,
    confirmText: 'Verify',
    cancelText: 'Cancel',
    variant: 'info',
  })

  if (confirmed) {
    try {
      await vendorService.verify(vendor.value.id)
      toast.success('NID verified successfully')
      fetchVendor()
    } catch (error) {
      toast.error('Failed to verify NID')
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
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

// Check if vendor has NID detail fields
const vendorDetail = computed(() => vendor.value as any)
</script>

<template>
  <PageLoader v-if="isLoading" />

  <div v-else-if="vendor" class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" to="/admin/vendors">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
            <img v-if="vendor.logo_url" :src="vendor.logo_url" :alt="vendor.store_name" class="h-14 w-14 rounded-full object-cover" />
            <BuildingStorefrontIcon v-else class="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ vendor.store_name }}
              </h1>
              <BaseBadge :variant="getStatusVariant(vendor.status)" class="capitalize">
                {{ vendor.status }}
              </BaseBadge>
              <BaseBadge :variant="vendor.is_verified ? 'success' : 'warning'" class="capitalize">
                {{ vendor.is_verified ? 'Verified' : 'Unverified' }}
              </BaseBadge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ vendor.owner?.email }} • {{ vendor.owner?.phone }}
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Approve (pending only) -->
        <BaseButton
          v-if="vendor.status === 'pending'"
          variant="primary"
          @click="approveVendor"
        >
          <CheckCircleIcon class="mr-2 h-4 w-4" />
          Approve
        </BaseButton>

        <!-- Reject (pending only) -->
        <BaseButton
          v-if="vendor.status === 'pending'"
          variant="danger"
          @click="openRejectModal"
        >
          <XCircleIcon class="mr-2 h-4 w-4" />
          Reject
        </BaseButton>

        <!-- Suspend (active or approved) -->
        <BaseButton
          v-if="vendor.status === 'active' || vendor.status === 'approved'"
          variant="danger"
          @click="openSuspendModal"
        >
          <NoSymbolIcon class="mr-2 h-4 w-4" />
          Suspend
        </BaseButton>

        <!-- Reactivate (suspended) -->
        <BaseButton
          v-if="vendor.status === 'suspended'"
          variant="primary"
          @click="reactivateVendor"
        >
          <ArrowPathIcon class="mr-2 h-4 w-4" />
          Reactivate
        </BaseButton>

        <!-- Verify NID (if not verified) -->
        <BaseButton
          v-if="!vendor.is_verified"
          variant="secondary"
          @click="verifyNid"
        >
          <ShieldCheckIcon class="mr-2 h-4 w-4" />
          Verify NID
        </BaseButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Products"
        :value="vendor.product_count?.toLocaleString() || '0'"
        :icon="ShoppingBagIcon"
        color="primary"
      />
      <StatCard
        title="Total Orders"
        :value="vendor.order_count?.toLocaleString() || '0'"
        :icon="ShoppingCartIcon"
        color="info"
      />
      <StatCard
        title="Total Revenue"
        :value="currency.formatCurrency(vendor.total_sales || 0)"
        :icon="CurrencyDollarIcon"
        color="success"
      />
      <StatCard
        title="Average Rating"
        :value="(vendor.rating_average || 0).toFixed(1)"
        :icon="StarIcon"
        color="warning"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Shop Information -->
      <BaseCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Shop Information
        </h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Shop Name</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ vendor.store_name }}
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Business Type</h4>
            <p class="mt-1 text-gray-900 dark:text-white capitalize">
              {{ vendor.business_type || 'Not specified' }}
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ vendor.description || 'No description provided' }}
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Commission Rate</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ vendor.commission_rate }}%
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Contact & Owner -->
      <BaseCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Contact & Owner
        </h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Owner</h4>
            <p class="mt-1 text-gray-900 dark:text-white">{{ vendor.owner?.name }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h4>
            <p class="mt-1 text-gray-900 dark:text-white">{{ vendor.owner?.email }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h4>
            <p class="mt-1 text-gray-900 dark:text-white">{{ vendor.owner?.phone || 'N/A' }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Business Name</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ vendor.business_name || 'N/A' }}
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- NID Verification -->
      <BaseCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          <div class="flex items-center gap-2">
            <IdentificationIcon class="h-5 w-5" />
            NID Verification
          </div>
        </h3>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
            <BaseBadge :variant="vendor.is_verified ? 'success' : 'warning'">
              {{ vendor.is_verified ? 'Verified' : 'Pending Verification' }}
            </BaseBadge>
          </div>
          <div v-if="vendorDetail?.nid_number">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">NID Number</h4>
            <p class="mt-1 font-mono text-gray-900 dark:text-white">{{ vendorDetail.nid_number }}</p>
          </div>
          <div v-if="vendorDetail?.nid_front_image || vendorDetail?.nid_back_image" class="grid grid-cols-2 gap-4">
            <div v-if="vendorDetail?.nid_front_image">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Front</h4>
              <img :src="vendorDetail.nid_front_image" alt="NID Front" class="rounded-lg border border-gray-200 dark:border-gray-700 w-full" />
            </div>
            <div v-if="vendorDetail?.nid_back_image">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Back</h4>
              <img :src="vendorDetail.nid_back_image" alt="NID Back" class="rounded-lg border border-gray-200 dark:border-gray-700 w-full" />
            </div>
          </div>
          <div v-if="!vendorDetail?.nid_number && !vendorDetail?.nid_front_image" class="text-sm text-gray-500 dark:text-gray-400">
            No NID documents submitted yet.
          </div>
          <div v-if="vendor.verified_at">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Verified At</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ date.format(vendor.verified_at, 'MMMM D, YYYY') }}
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Timestamps -->
      <BaseCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Activity
        </h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ date.format(vendor.created_at, 'MMMM D, YYYY') }}
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ date.format(vendor.updated_at, 'MMMM D, YYYY') }}
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Reviews</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ vendor.review_count || 0 }} reviews ({{ (vendor.rating_average || 0).toFixed(1) }} avg)
            </p>
          </div>
        </div>
      </BaseCard>
    </div>

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
            Please provide a reason for rejecting this vendor application. The vendor will be notified.
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
            variant="danger"
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
