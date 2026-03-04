<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Coupons — Coupon management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useCurrency, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { couponService } from '@/services'
import type { Coupon, CouponStats, CouponType, CouponFilters } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDate } = useDate()
const { formatCurrency } = useCurrency()

// ── State ──
const loading = ref(false)
const coupons = ref<Coupon[]>([])
const stats = ref<CouponStats | null>(null)
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('My Coupons', [
    { label: 'Coupons' },
  ], 'Manage your discount coupons')
  fetchStats()
  fetchCoupons()
})

// Search
const searchQuery = ref('')

// Table columns
const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'discount', label: 'Discount', sortable: true },
  { key: 'usage', label: 'Usage' },
  { key: 'validity', label: 'Validity' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// ── API Methods ──
async function fetchStats() {
  try {
    stats.value = await couponService.getVendorStats()
  } catch (error: any) {
    console.error('Failed to load stats:', error)
  }
}

async function fetchCoupons() {
  loading.value = true
  try {
    const params: CouponFilters = {
      page: currentPage.value,
      per_page: perPage.value,
    }
    if (searchQuery.value) params.search = searchQuery.value

    const response = await couponService.getVendorCoupons(params)
    // Handle response format
    const resData = response as any
    if (Array.isArray(resData.data)) {
      coupons.value = resData.data
      totalItems.value = resData.meta?.total || resData.data.length
    } else if (Array.isArray(resData)) {
      coupons.value = resData
      totalItems.value = resData.length
    } else {
      coupons.value = []
      totalItems.value = 0
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load coupons')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounce(fetchCoupons, 300)

watch(searchQuery, () => {
  currentPage.value = 1
  debouncedFetch()
})

// Pagination
function handlePageChange(page: number) {
  currentPage.value = page
  fetchCoupons()
}

function handlePerPageChange(size: number) {
  perPage.value = size
  currentPage.value = 1
  fetchCoupons()
}

// ── Actions ──
function createCoupon() {
  router.push({ name: 'vendor-coupon-create' })
}

function editCoupon(coupon: Coupon) {
  router.push({ name: 'vendor-coupon-edit', params: { id: coupon.id } })
}

async function toggleCoupon(coupon: Coupon) {
  try {
    const updated = await couponService.toggleVendorCoupon(coupon.id)
    coupon.is_active = updated.is_active
    toast.success(coupon.is_active ? 'Coupon activated' : 'Coupon deactivated')
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to toggle coupon')
  }
}

async function deleteCoupon(coupon: Coupon) {
  const confirmed = await confirm.danger({
    title: 'Delete Coupon',
    message: `Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`,
    confirmText: 'Delete',
  })
  if (!confirmed) return

  try {
    await couponService.deleteVendorCoupon(coupon.id)
    toast.success('Coupon deleted')
    coupons.value = coupons.value.filter(c => c.id !== coupon.id)
    totalItems.value--
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete coupon')
  }
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  toast.success('Code copied to clipboard')
}

// ── Helpers ──
function getStatusVariant(coupon: Coupon) {
  if (!coupon.is_active) return 'secondary'
  const now = new Date()
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return 'danger'
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return 'info'
  return 'success'
}

function getStatusLabel(coupon: Coupon) {
  if (!coupon.is_active) return 'Inactive'
  const now = new Date()
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return 'Expired'
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return 'Scheduled'
  return 'Active'
}

function formatDiscount(coupon: Coupon) {
  const value = coupon.value ?? coupon.discount_value ?? 0
  if (coupon.type === 'percentage') {
    return `${value}%`
  } else if (coupon.type === 'free_shipping') {
    return 'Free Shipping'
  }
  return formatCurrency(value)
}

function getTypeLabel(type: CouponType) {
  switch (type) {
    case 'percentage': return 'Percentage'
    case 'fixed': return 'Fixed'
    case 'free_shipping': return 'Free Shipping'
    default: return type
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <TicketIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Coupons</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.total_coupons }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
          <CheckCircleIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Coupons</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.active_coupons }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400">
          <CurrencyDollarIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Discounted</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(stats.total_discount_given) }}</p>
        </div>
      </BaseCard>
    </div>

    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <FormInput
              v-model="searchQuery"
              name="search"
              placeholder="Search coupons..."
              class="pl-10"
            />
          </div>
          <BaseButton variant="ghost" size="sm" @click="fetchCoupons">
            <ArrowPathIcon class="h-4 w-4" />
          </BaseButton>
        </div>
        <BaseButton variant="primary" @click="createCoupon">
          <PlusIcon class="mr-2 h-4 w-4" />
          Create Coupon
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Coupons table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="coupons"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #cell-code="{ item }">
          <div class="flex items-center gap-2">
            <TicketIcon class="h-5 w-5 text-primary-500" />
            <div>
              <span class="font-mono font-semibold text-gray-900 dark:text-white">
                {{ item.code }}
              </span>
              <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({{ getTypeLabel(item.type) }})
              </span>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy code"
              @click.stop="copyCode(item.code)"
            >
              <ClipboardDocumentIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #cell-discount="{ item }">
          <div>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatDiscount(item) }}
            </span>
            <span
              v-if="item.max_discount"
              class="block text-xs text-gray-500 dark:text-gray-400"
            >
              Max: {{ formatCurrency(item.max_discount) }}
            </span>
          </div>
        </template>

        <template #cell-usage="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ item.used_count ?? item.usage_count ?? 0 }} / {{ item.usage_limit || '∞' }}
          </span>
        </template>

        <template #cell-validity="{ item }">
          <div class="text-sm">
            <span class="text-gray-600 dark:text-gray-400">
              {{ item.starts_at ? formatDate(item.starts_at) : 'No start' }}
            </span>
            <span class="text-gray-400 dark:text-gray-500"> - </span>
            <span class="text-gray-600 dark:text-gray-400">
              {{ item.expires_at ? formatDate(item.expires_at) : 'No expiry' }}
            </span>
          </div>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item)">
            {{ getStatusLabel(item) }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="item.is_active ? 'text-success-500' : 'text-gray-400'"
              :title="item.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleCoupon(item)"
            >
              <CheckCircleIcon v-if="item.is_active" class="h-4 w-4" />
              <XCircleIcon v-else class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Edit"
              @click="editCoupon(item)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deleteCoupon(item)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <TicketIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No coupons found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new coupon for your products.
            </p>
            <div class="mt-6">
              <BaseButton variant="primary" @click="createCoupon">
                <PlusIcon class="mr-2 h-4 w-4" />
                Create Coupon
              </BaseButton>
            </div>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
