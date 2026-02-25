<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Vendor Detail — View vendor details page -->
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
import PageLoader from '@/components/ui/PageLoader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import type { Vendor } from '@/types'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  StarIcon,
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

// Set page info
onMounted(() => {
  if (!vendorId.value) {
    toast.error('Invalid vendor ID')
    router.push('/admin/vendors')
    return
  }
  fetchVendor()
})

// Fetch vendor
async function fetchVendor() {
  isLoading.value = true
  try {
    vendor.value = await vendorService.getById(vendorId.value)
    breadcrumbStore.setPageInfo(vendor.value.store_name, [
      { label: 'Vendors', to: '/admin/vendors' },
      { label: vendor.value.store_name },
    ])
  } catch (error) {
    toast.error('Failed to fetch vendor')
    // Mock data
    vendor.value = {
      id: vendorId.value,
      user_id: 1,
      store_name: 'Fashion Store',
      slug: 'fashion-store',
      business_name: 'Fashion Store Ltd',
      business_type: 'retail',
      description: 'Premium fashion clothing and accessories for men and women.',
      logo_url: null,
      banner_url: null,
      status: 'approved' as const,
      commission_rate: 10,
      rating_average: 4.7,
      review_count: 150,
      product_count: 156,
      order_count: 523,
      total_sales: 850000,
      owner: {
        id: 1,
        name: 'John Doe',
        email: 'fashion@example.com',
        phone: '+880123456789',
        avatar: null,
      },
      is_verified: true,
      verified_at: '2024-01-01',
      created_at: '2024-01-01',
      updated_at: '2024-01-15',
    }
    breadcrumbStore.setPageInfo(vendor.value.store_name, [
      { label: 'Vendors', to: '/admin/vendors' },
      { label: vendor.value.store_name },
    ])
  } finally {
    isLoading.value = false
  }
}

// Actions
async function verifyVendor() {
  if (!vendor.value) return

  const confirmed = await confirm.show({
    title: 'Verify Vendor',
    message: `Are you sure you want to verify "${vendor.value.store_name}"?`,
    confirmText: 'Verify',
    cancelText: 'Cancel',
    variant: 'info',
  })

  if (confirmed) {
    try {
      await vendorService.verify(vendor.value.id)
      toast.success('Vendor verified successfully')
      fetchVendor()
    } catch (error) {
      toast.error('Failed to verify vendor')
    }
  }
}

async function suspendVendor() {
  if (!vendor.value) return

  const confirmed = await confirm.show({
    title: 'Suspend Vendor',
    message: `Are you sure you want to suspend "${vendor.value.store_name}"? They will not be able to sell products.`,
    confirmText: 'Suspend',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      await vendorService.updateStatus(vendor.value.id, 'suspended')
      toast.success('Vendor suspended')
      fetchVendor()
    } catch (error) {
      toast.error('Failed to suspend vendor')
    }
  }
}

// Status variants
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' {
  const variants: Record<string, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    inactive: 'warning',
    suspended: 'danger',
  }
  return variants[status] || 'warning'
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
            <BuildingStorefrontIcon class="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ vendor.store_name }}
              </h1>
              <BaseBadge :variant="getStatusVariant(vendor.status)" class="capitalize">
                {{ vendor.status }}
              </BaseBadge>
              <BaseBadge :variant="getVerificationVariant(vendor.is_verified ? 'verified' : 'pending')" class="capitalize">
                {{ vendor.is_verified ? 'Verified' : 'Pending' }}
              </BaseBadge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ vendor.owner?.email }} • {{ vendor.owner?.phone }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton
          v-if="!vendor.is_verified"
          variant="primary"
          @click="verifyVendor"
        >
          <CheckCircleIcon class="mr-2 h-4 w-4" />
          Verify
        </BaseButton>
        <BaseButton
          v-if="vendor.status === 'approved'"
          variant="danger"
          @click="suspendVendor"
        >
          <XCircleIcon class="mr-2 h-4 w-4" />
          Suspend
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

      <!-- Contact & Address -->
      <BaseCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Contact & Address
        </h3>
        <div class="space-y-4">
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
          <div v-if="vendor.verified_at">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Verified At</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ date.format(vendor.verified_at, 'MMMM D, YYYY') }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
