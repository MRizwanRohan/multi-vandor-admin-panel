<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Reviews — Review management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useDebounce } from '@/composables'
import { reviewService } from '@/services'
import type { Review, VendorReviewStats, ReviewFilters } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  MagnifyingGlassIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, timeAgo } = useDate()
const { debounce } = useDebounce()

// ── State ──
const loading = ref(false)
const reviews = ref<Review[]>([])
const stats = ref<VendorReviewStats | null>(null)
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const sortBy = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Reviews', [
    { label: 'Reviews' },
  ], 'View and respond to product reviews')
  fetchStats()
  fetchReviews()
})

// Search and filters
const searchQuery = ref('')
const ratingFilter = ref<number | ''>('')
const responseFilter = ref<'' | 'responded' | 'not_responded'>('')

const ratingOptions = [
  { value: '', label: 'All Ratings' },
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4 Stars' },
  { value: 3, label: '3 Stars' },
  { value: 2, label: '2 Stars' },
  { value: 1, label: '1 Star' },
]

const responseOptions = [
  { value: '', label: 'All' },
  { value: 'responded', label: 'Responded' },
  { value: 'not_responded', label: 'Not Responded' },
]

// Table columns
const columns = [
  { key: 'product', label: 'Product', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'rating', label: 'Rating', sortable: true },
  { key: 'comment', label: 'Comment' },
  { key: 'created_at', label: 'Date', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// ── API Methods ──
async function fetchStats() {
  try {
    stats.value = await reviewService.getVendorStats()
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
    if (ratingFilter.value) params.rating = ratingFilter.value
    if (responseFilter.value) params.has_response = responseFilter.value === 'responded'

    const response = await reviewService.getVendorReviews(params)
    reviews.value = response.data
    totalItems.value = response.meta?.total || response.data.length
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load reviews')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = debounce(fetchReviews, 300)

// Watch filters
watch([ratingFilter, responseFilter], () => {
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

// ── View Modal ──
const showViewModal = ref(false)
const selectedReview = ref<Review | null>(null)

function viewReview(review: Review) {
  selectedReview.value = review
  showViewModal.value = true
}

// ── Reply Modal ──
const showReplyModal = ref(false)
const replyReview = ref<Review | null>(null)
const replyText = ref('')
const replySubmitting = ref(false)

function openReplyModal(review: Review) {
  replyReview.value = review
  replyText.value = review.vendor_response?.response || review.responses?.[0]?.response || ''
  showReplyModal.value = true
}

async function submitReply() {
  if (!replyReview.value || !replyText.value.trim()) return

  replySubmitting.value = true
  try {
    const existingResponse = replyReview.value.vendor_response || replyReview.value.responses?.[0]
    
    if (existingResponse) {
      // Update existing response
      await reviewService.updateResponse(existingResponse.id, { response: replyText.value })
      toast.success('Response updated')
    } else {
      // Create new response
      const response = await reviewService.respond(replyReview.value.id, { response: replyText.value })
      replyReview.value.vendor_response = response
    }
    
    showReplyModal.value = false
    fetchReviews()
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to submit response')
  } finally {
    replySubmitting.value = false
  }
}

async function deleteResponse(review: Review) {
  const existingResponse = review.vendor_response || review.responses?.[0]
  if (!existingResponse) return

  try {
    await reviewService.deleteResponse(existingResponse.id)
    toast.success('Response deleted')
    review.vendor_response = null
    if (review.responses) review.responses = []
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete response')
  }
}

// ── Helpers ──
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

function hasResponse(review: Review): boolean {
  return !!(review.vendor_response || review.responses?.length)
}

function getResponseText(review: Review): string | null {
  return review.vendor_response?.response || review.responses?.[0]?.response || null
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div v-if="stats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <StarIconSolid class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ stats.average_rating?.toFixed(1) || '0.0' }}
            </p>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <ChatBubbleLeftIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ stats.total || stats.total_reviews || 0 }}
            </p>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <ChatBubbleLeftIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Responded</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ stats.responded || 0 }}
            </p>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <ExclamationCircleIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Needs Response</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ stats.needs_response || 0 }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Filters -->
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
          v-model="ratingFilter"
          name="rating"
          :options="ratingOptions"
          class="w-36"
        />
        <FormSelect
          v-model="responseFilter"
          name="response"
          :options="responseOptions"
          class="w-40"
        />
        <BaseButton variant="secondary" size="sm" @click="fetchReviews">
          <ArrowPathIcon class="h-4 w-4" />
        </BaseButton>
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
            <span class="font-medium text-gray-900 dark:text-white">
              {{ getProductName(row) }}
            </span>
          </div>
        </template>

        <template #cell-customer="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-gray-900 dark:text-white">{{ getCustomerName(row) }}</span>
            <BaseBadge v-if="row.is_verified_purchase" variant="success" size="xs">
              Verified
            </BaseBadge>
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
            <div v-if="hasResponse(row)" class="mt-1">
              <p class="truncate text-sm text-primary-600 dark:text-primary-400">
                ↳ {{ getResponseText(row) }}
              </p>
            </div>
          </div>
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
            <BaseButton
              variant="ghost"
              size="sm"
              @click="openReplyModal(row)"
            >
              <ChatBubbleLeftIcon class="mr-1 h-4 w-4" />
              {{ hasResponse(row) ? 'Edit' : 'Reply' }}
            </BaseButton>
            <button
              v-if="hasResponse(row)"
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete Response"
              @click="deleteResponse(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </BaseCard>

    <!-- View Modal -->
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

        <!-- Your Response -->
        <div v-if="hasResponse(selectedReview)">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Your Response</label>
          <div class="mt-2 rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ getResponseText(selectedReview) }}
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Helpful votes</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedReview.helpful_count || 0 }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Date</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedReview.created_at, 'short') }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showViewModal = false">
            Close
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="openReplyModal(selectedReview!); showViewModal = false"
          >
            <ChatBubbleLeftIcon class="mr-2 h-4 w-4" />
            {{ hasResponse(selectedReview!) ? 'Edit Response' : 'Reply' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Reply modal -->
    <BaseModal
      :show="showReplyModal"
      title="Reply to Review"
      size="lg"
      @close="showReplyModal = false"
    >
      <div v-if="replyReview" class="space-y-4">
        <!-- Review details -->
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{{ getCustomerName(replyReview) }}</span>
            <span>•</span>
            <div class="flex items-center gap-0.5">
              <template v-for="(filled, i) in renderStars(replyReview.rating)" :key="i">
                <StarIconSolid
                  v-if="filled"
                  class="h-3 w-3 text-yellow-400"
                />
                <StarIcon
                  v-else
                  class="h-3 w-3 text-gray-300 dark:text-gray-600"
                />
              </template>
            </div>
            <span>•</span>
            <span>{{ timeAgo(replyReview.created_at) }}</span>
          </div>
          <p v-if="replyReview.title" class="mt-2 font-medium text-gray-900 dark:text-white">
            {{ replyReview.title }}
          </p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">
            {{ getReviewComment(replyReview) }}
          </p>
        </div>

        <!-- Reply input -->
        <FormTextarea
          v-model="replyText"
          label="Your Response"
          name="reply"
          placeholder="Write a professional response to this review..."
          :rows="4"
        />

        <p class="text-xs text-gray-500 dark:text-gray-400">
          Tip: Respond professionally and address any concerns raised by the customer.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showReplyModal = false">
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            :disabled="!replyText.trim()"
            :loading="replySubmitting"
            @click="submitReply"
          >
            {{ hasResponse(replyReview!) ? 'Update Response' : 'Submit Response' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
