<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Reviews — Review management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useDebounce, useConfirm } from '@/composables'
import { reviewService } from '@/services'
import type { Review, ReviewStats, ReviewStatus, ReviewFilters } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormCheckbox from '@/components/form/FormCheckbox.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  MagnifyingGlassIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDate, timeAgo } = useDate()
const { debounce } = useDebounce()

// ── State ──
const loading = ref(false)
const reviews = ref<Review[]>([])
const stats = ref<ReviewStats | null>(null)
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const selectedIds = ref<number[]>([])
const bulkProcessing = ref(false)

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Reviews', [
    { label: 'Reviews' },
  ], 'Manage product reviews')
  fetchStats()
  fetchReviews()
})

// Search and filters
const searchQuery = ref('')
const statusFilter = ref<ReviewStatus | ''>('')
const ratingFilter = ref<number | ''>('')
const sortBy = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const ratingOptions = [
  { value: '', label: 'All Ratings' },
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4 Stars' },
  { value: 3, label: '3 Stars' },
  { value: 2, label: '2 Stars' },
  { value: 1, label: '1 Star' },
]

// Table columns
const columns = [
  { key: 'select', label: '', width: '40px' },
  { key: 'product', label: 'Product', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'rating', label: 'Rating', sortable: true },
  { key: 'comment', label: 'Comment' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// ── Computed ──
const allSelected = computed(() => {
  return reviews.value.length > 0 && selectedIds.value.length === reviews.value.length
})

const pendingSelectedCount = computed(() => {
  return reviews.value.filter(r => selectedIds.value.includes(r.id) && r.status === 'pending').length
})

// ── API Methods ──
async function fetchStats() {
  try {
    stats.value = await reviewService.getStats()
  } catch (error: any) {
    console.error('Failed to load stats:', error)
  }
}

async function fetchReviews() {
  loading.value = true
  try {
    const params: ReviewFilters = {
      page: currentPage.value,
      per_page: perPage.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value) params.status = statusFilter.value
    if (ratingFilter.value) params.rating = ratingFilter.value

    const response = await reviewService.getAll(params)
    reviews.value = response.data
    totalItems.value = response.meta?.total || response.data.length
    selectedIds.value = [] // Clear selection on page change
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load reviews')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = debounce(fetchReviews, 300)

// Watch filters
watch([statusFilter, ratingFilter], () => {
  currentPage.value = 1
  fetchReviews()
})

watch(searchQuery, () => {
  currentPage.value = 1
  debouncedFetch()
})

// Pagination
function handlePageChange(page: number) {
  currentPage.value = page
  fetchReviews()
}

function handlePerPageChange(size: number) {
  perPage.value = size
  currentPage.value = 1
  fetchReviews()
}

// Sort
function handleSort(key: string, order: 'asc' | 'desc') {
  sortBy.value = key
  sortOrder.value = order
  fetchReviews()
}

// ── Selection ──
function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = reviews.value.map(r => r.id)
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

// ── View Modal ──
const showViewModal = ref(false)
const selectedReview = ref<Review | null>(null)

function viewReview(review: Review) {
  selectedReview.value = review
  showViewModal.value = true
}

// ── Approve / Reject / Delete ──
async function approveReview(review: Review) {
  try {
    await reviewService.approve(review.id)
    toast.success('Review approved')
    review.status = 'approved'
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to approve review')
  }
}

async function rejectReview(review: Review) {
  const reason = await confirm.prompt({
    title: 'Reject Review',
    message: 'Optionally provide a reason for rejection:',
    confirmText: 'Reject',
    cancelText: 'Cancel',
  })
  if (reason === false) return

  try {
    await reviewService.reject(review.id, typeof reason === 'string' ? reason : undefined)
    toast.success('Review rejected')
    review.status = 'rejected'
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to reject review')
  }
}

async function deleteReview(review: Review) {
  const confirmed = await confirm.danger({
    title: 'Delete Review',
    message: 'Are you sure you want to delete this review? This action cannot be undone.',
    confirmText: 'Delete',
  })
  if (!confirmed) return

  try {
    await reviewService.delete(review.id)
    toast.success('Review deleted')
    reviews.value = reviews.value.filter(r => r.id !== review.id)
    totalItems.value--
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete review')
  }
}

// ── Bulk Actions ──
async function bulkApprove() {
  const pendingIds = reviews.value
    .filter(r => selectedIds.value.includes(r.id) && r.status === 'pending')
    .map(r => r.id)

  if (pendingIds.length === 0) {
    toast.warning('No pending reviews selected')
    return
  }

  const confirmed = await confirm.warning({
    title: 'Bulk Approve',
    message: `Approve ${pendingIds.length} review(s)?`,
    confirmText: 'Approve All',
  })
  if (!confirmed) return

  bulkProcessing.value = true
  try {
    const result = await reviewService.bulkApprove(pendingIds)
    toast.success(`${result.approved_count} review(s) approved`)
    selectedIds.value = []
    fetchReviews()
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Bulk approve failed')
  } finally {
    bulkProcessing.value = false
  }
}

async function bulkReject() {
  const pendingIds = reviews.value
    .filter(r => selectedIds.value.includes(r.id) && r.status === 'pending')
    .map(r => r.id)

  if (pendingIds.length === 0) {
    toast.warning('No pending reviews selected')
    return
  }

  const reason = await confirm.prompt({
    title: 'Bulk Reject',
    message: `Reject ${pendingIds.length} review(s)? Optionally provide a reason:`,
    confirmText: 'Reject All',
    cancelText: 'Cancel',
  })
  if (reason === false) return

  bulkProcessing.value = true
  try {
    const result = await reviewService.bulkReject(pendingIds, typeof reason === 'string' ? reason : undefined)
    toast.success(`${result.rejected_count} review(s) rejected`)
    selectedIds.value = []
    fetchReviews()
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Bulk reject failed')
  } finally {
    bulkProcessing.value = false
  }
}

// ── Helpers ──
function getStatusVariant(status: string) {
  switch (status) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    default: return 'secondary'
  }
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}

function getProductName(review: Review): string {
  return review.product?.name || review.product_name || 'Unknown Product'
}

function getCustomerName(review: Review): string {
  return review.user?.name || review.customer_name || 'Unknown Customer'
}

function getReviewComment(review: Review): string {
  return review.comment || review.content || ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div v-if="stats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <StarIconSolid class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stats.total }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ClockIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stats.pending }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CheckBadgeIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Approved</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stats.approved }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <ExclamationTriangleIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stats.rejected }}</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Filters & Bulk Actions -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            name="search"
            placeholder="Search reviews..."
            class="pl-10"
          />
        </div>
        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-40"
        />
        <FormSelect
          v-model="ratingFilter"
          name="rating"
          :options="ratingOptions"
          class="w-36"
        />
        <BaseButton variant="secondary" size="sm" @click="fetchReviews">
          <ArrowPathIcon class="h-4 w-4" />
        </BaseButton>
      </div>

      <!-- Bulk Actions Bar -->
      <div
        v-if="selectedIds.length > 0"
        class="mt-4 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800"
      >
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ selectedIds.length }} selected
          <span v-if="pendingSelectedCount > 0" class="text-gray-400">
            ({{ pendingSelectedCount }} pending)
          </span>
        </span>
        <div class="ml-auto flex gap-2">
          <BaseButton
            size="sm"
            variant="success"
            :loading="bulkProcessing"
            :disabled="pendingSelectedCount === 0"
            @click="bulkApprove"
          >
            <CheckIcon class="mr-1 h-4 w-4" />
            Approve
          </BaseButton>
          <BaseButton
            size="sm"
            variant="danger"
            :loading="bulkProcessing"
            :disabled="pendingSelectedCount === 0"
            @click="bulkReject"
          >
            <XMarkIcon class="mr-1 h-4 w-4" />
            Reject
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Reviews table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="reviews"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
        @sort="handleSort"
      >
        <template #cell-select="{ row }">
          <FormCheckbox
            :model-value="selectedIds.includes(row.id)"
            :name="`select-${row.id}`"
            @update:model-value="toggleSelect(row.id)"
          />
        </template>

        <template #header-select>
          <FormCheckbox
            :model-value="allSelected"
            name="select-all"
            @update:model-value="toggleSelectAll"
          />
        </template>

        <template #cell-product="{ row }">
          <div class="flex items-center gap-3">
            <div
              v-if="row.product?.image || row.product_image"
              class="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
            >
              <img
                :src="row.product?.image || row.product_image"
                :alt="getProductName(row)"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700"
            >
              <StarIcon class="h-5 w-5" />
            </div>
            <div>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ getProductName(row) }}
              </span>
              <p v-if="row.product?.vendor" class="text-xs text-gray-500">
                {{ row.product.vendor.shop_name }}
              </p>
            </div>
          </div>
        </template>

        <template #cell-customer="{ row }">
          <div class="flex items-center gap-2">
            <div
              v-if="row.user?.avatar || row.customer_avatar"
              class="h-8 w-8 shrink-0 overflow-hidden rounded-full"
            >
              <img
                :src="row.user?.avatar || row.customer_avatar"
                :alt="getCustomerName(row)"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500 dark:bg-gray-700"
            >
              {{ getCustomerName(row).charAt(0) }}
            </div>
            <div>
              <span class="text-gray-900 dark:text-white">{{ getCustomerName(row) }}</span>
              <BaseBadge v-if="row.is_verified_purchase" variant="success" size="xs" class="ml-1">
                Verified
              </BaseBadge>
            </div>
          </div>
        </template>

        <template #cell-rating="{ row }">
          <div class="flex items-center gap-0.5">
            <template v-for="(filled, i) in renderStars(row.rating)" :key="i">
              <StarIconSolid
                v-if="filled"
                class="h-4 w-4 text-yellow-400"
              />
              <StarIcon
                v-else
                class="h-4 w-4 text-gray-300 dark:text-gray-600"
              />
            </template>
            <span class="ml-1 text-sm text-gray-600 dark:text-gray-400">
              ({{ row.rating }})
            </span>
          </div>
        </template>

        <template #cell-comment="{ row }">
          <div class="max-w-xs">
            <p v-if="row.title" class="font-medium text-gray-900 dark:text-white truncate">
              {{ row.title }}
            </p>
            <p class="truncate text-gray-600 dark:text-gray-400">
              {{ getReviewComment(row) || 'No comment' }}
            </p>
            <div v-if="row.images?.length" class="mt-1 flex gap-1">
              <span class="text-xs text-primary-600 dark:text-primary-400">
                {{ row.images.length }} image(s)
              </span>
            </div>
          </div>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)">
            {{ row.status }}
          </BaseBadge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ timeAgo(row.created_at) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View"
              @click="viewReview(row)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded-lg p-2 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
              title="Approve"
              @click="approveReview(row)"
            >
              <CheckIcon class="h-4 w-4" />
            </button>
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Reject"
              @click="rejectReview(row)"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deleteReview(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </BaseCard>

    <!-- View modal -->
    <BaseModal
      :show="showViewModal"
      title="Review Details"
      size="lg"
      @close="showViewModal = false"
    >
      <div v-if="selectedReview" class="space-y-4">
        <!-- Product -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Product</label>
          <p class="text-gray-900 dark:text-white">{{ getProductName(selectedReview) }}</p>
        </div>

        <!-- Customer -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</label>
          <div class="flex items-center gap-2">
            <p class="text-gray-900 dark:text-white">{{ getCustomerName(selectedReview) }}</p>
            <BaseBadge v-if="selectedReview.is_verified_purchase" variant="success" size="xs">
              Verified Purchase
            </BaseBadge>
          </div>
        </div>

        <!-- Rating -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</label>
          <div class="mt-1 flex items-center gap-0.5">
            <template v-for="(filled, i) in renderStars(selectedReview.rating)" :key="i">
              <StarIconSolid
                v-if="filled"
                class="h-5 w-5 text-yellow-400"
              />
              <StarIcon
                v-else
                class="h-5 w-5 text-gray-300 dark:text-gray-600"
              />
            </template>
            <span class="ml-2 font-medium">{{ selectedReview.rating }}/5</span>
          </div>
        </div>

        <!-- Title -->
        <div v-if="selectedReview.title">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
          <p class="text-gray-900 dark:text-white">{{ selectedReview.title }}</p>
        </div>

        <!-- Comment -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Comment</label>
          <p class="mt-1 text-gray-900 dark:text-white">
            {{ getReviewComment(selectedReview) || 'No comment' }}
          </p>
        </div>

        <!-- Images -->
        <div v-if="selectedReview.images?.length">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Images</label>
          <div class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="img in selectedReview.images"
              :key="img.id"
              class="h-20 w-20 overflow-hidden rounded-lg"
            >
              <img
                :src="img.url || img.image_url"
                :alt="img.alt_text || 'Review image'"
                class="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <!-- Vendor Response -->
        <div v-if="selectedReview.vendor_response || selectedReview.responses?.length">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor Response</label>
          <div class="mt-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ selectedReview.vendor_response?.response || selectedReview.responses?.[0]?.response }}
            </p>
            <p class="mt-1 text-xs text-gray-400">
              by {{ selectedReview.vendor_response?.responder?.name || selectedReview.responses?.[0]?.responder?.name }}
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Helpful votes</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedReview.helpful_count || 0 }}</p>
          </div>
          <div v-if="selectedReview.reported_count !== undefined">
            <span class="text-sm text-gray-500 dark:text-gray-400">Reports</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedReview.reported_count }}</p>
          </div>
        </div>

        <!-- Date -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
          <p class="text-gray-900 dark:text-white">{{ formatDate(selectedReview.created_at, 'full') }}</p>
        </div>

        <!-- Status -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
          <div class="mt-1">
            <BaseBadge :variant="getStatusVariant(selectedReview.status)">
              {{ selectedReview.status }}
            </BaseBadge>
          </div>
        </div>

        <!-- Admin Notes -->
        <div v-if="selectedReview.admin_notes">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Notes</label>
          <p class="mt-1 text-gray-600 dark:text-gray-400">{{ selectedReview.admin_notes }}</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showViewModal = false">
            Close
          </BaseButton>
          <BaseButton
            v-if="selectedReview?.status === 'pending'"
            variant="danger"
            @click="rejectReview(selectedReview!); showViewModal = false"
          >
            <XMarkIcon class="mr-2 h-4 w-4" />
            Reject
          </BaseButton>
          <BaseButton
            v-if="selectedReview?.status === 'pending'"
            variant="primary"
            @click="approveReview(selectedReview!); showViewModal = false"
          >
            <CheckIcon class="mr-2 h-4 w-4" />
            Approve
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
