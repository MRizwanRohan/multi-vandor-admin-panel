<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Reviews Needs Response — Reviews requiring vendor attention -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useDebounce } from '@/composables'
import { reviewService } from '@/services'
import type { Review } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  StarIcon,
  ChatBubbleLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, timeAgo } = useDate()

// ── State ──
const loading = ref(false)
const reviews = ref<Review[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(10)

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Needs Response', [
    { label: 'Reviews', to: '/vendor/reviews' },
    { label: 'Needs Response' },
  ], 'Reviews requiring your attention')
  fetchReviews()
})

// ── API Methods ──
async function fetchReviews() {
  loading.value = true
  try {
    const response = await reviewService.getNeedsResponse({
      page: currentPage.value,
      per_page: perPage.value,
    })
    // Handle both response formats: { data: [] } or direct array
    const resData = response as any
    if (Array.isArray(resData.data)) {
      reviews.value = resData.data
      totalItems.value = resData.meta?.total || resData.data.length
    } else if (Array.isArray(resData)) {
      reviews.value = resData
      totalItems.value = resData.length
    } else {
      reviews.value = []
      totalItems.value = 0
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load reviews')
  } finally {
    loading.value = false
  }
}

// Pagination
function loadMore() {
  if (reviews.value.length < totalItems.value) {
    currentPage.value++
    loadMoreReviews()
  }
}

async function loadMoreReviews() {
  loading.value = true
  try {
    const response = await reviewService.getNeedsResponse({
      page: currentPage.value,
      per_page: perPage.value,
    })
    // Handle both response formats
    const resData = response as any
    const newData = Array.isArray(resData.data) ? resData.data : (Array.isArray(resData) ? resData : [])
    reviews.value.push(...newData)
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load more reviews')
  } finally {
    loading.value = false
  }
}

// ── Reply Modal ──
const showReplyModal = ref(false)
const replyReview = ref<Review | null>(null)
const replyText = ref('')
const replySubmitting = ref(false)

function openReplyModal(review: Review) {
  replyReview.value = review
  replyText.value = ''
  showReplyModal.value = true
}

async function submitReply() {
  if (!replyReview.value || !replyText.value.trim()) return

  replySubmitting.value = true
  try {
    const response = await reviewService.respond(replyReview.value.id, { response: replyText.value })
    toast.success('Response submitted successfully')
    
    // Remove from list since it's been responded to
    reviews.value = reviews.value.filter(r => r.id !== replyReview.value!.id)
    totalItems.value--
    
    showReplyModal.value = false
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to submit response')
  } finally {
    replySubmitting.value = false
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

function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-green-500'
  if (rating >= 3) return 'text-yellow-500'
  return 'text-red-500'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <BaseCard class="!p-4">
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <ExclamationCircleIcon class="h-6 w-6" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Reviews Needing Response
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ totalItems }} review{{ totalItems !== 1 ? 's' : '' }} require your attention
          </p>
        </div>
      </div>
    </BaseCard>

    <!-- Empty State -->
    <BaseEmptyState
      v-if="!loading && reviews.length === 0"
      icon="inbox"
      title="All caught up!"
      description="You've responded to all reviews. Great job maintaining customer engagement!"
    >
      <BaseButton variant="primary" to="/vendor/reviews">
        View All Reviews
      </BaseButton>
    </BaseEmptyState>

    <!-- Review Cards -->
    <div v-else class="space-y-4">
      <TransitionGroup name="list">
        <BaseCard
          v-for="review in reviews"
          :key="review.id"
          class="transition-all duration-300"
        >
          <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div
                  v-if="review.product?.image || review.product_image"
                  class="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                >
                  <img
                    :src="review.product?.image || review.product_image"
                    :alt="getProductName(review)"
                    class="h-full w-full object-cover"
                  />
                </div>
                <div
                  v-else
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700"
                >
                  <StarIcon class="h-6 w-6" />
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ getProductName(review) }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    by {{ getCustomerName(review) }}
                    <BaseBadge v-if="review.is_verified_purchase" variant="success" size="xs" class="ml-1">
                      Verified
                    </BaseBadge>
                  </p>
                </div>
              </div>

              <!-- Rating & Date -->
              <div class="text-right">
                <div class="flex items-center gap-0.5">
                  <template v-for="(filled, i) in renderStars(review.rating)" :key="i">
                    <StarIconSolid
                      v-if="filled"
                      class="h-4 w-4"
                      :class="getRatingColor(review.rating)"
                    />
                    <StarIcon
                      v-else
                      class="h-4 w-4 text-gray-300 dark:text-gray-600"
                    />
                  </template>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ timeAgo(review.created_at) }}
                </p>
              </div>
            </div>

            <!-- Review Content -->
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p v-if="review.title" class="mb-2 font-medium text-gray-900 dark:text-white">
                {{ review.title }}
              </p>
              <p class="text-gray-700 dark:text-gray-300">
                {{ getReviewComment(review) || 'No comment provided' }}
              </p>
            </div>

            <!-- Images -->
            <div v-if="review.images?.length" class="flex flex-wrap gap-2">
              <div
                v-for="img in review.images"
                :key="img.id"
                class="h-16 w-16 overflow-hidden rounded-lg"
              >
                <img
                  :src="img.url || img.image_url"
                  :alt="img.alt_text || 'Review image'"
                  class="h-full w-full object-cover"
                />
              </div>
            </div>

            <!-- Action -->
            <div class="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{{ review.helpful_count || 0 }} helpful votes</span>
              </div>
              <BaseButton variant="primary" size="sm" @click="openReplyModal(review)">
                <ChatBubbleLeftIcon class="mr-1.5 h-4 w-4" />
                Respond
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </TransitionGroup>

      <!-- Load More -->
      <div v-if="reviews.length < totalItems" class="text-center">
        <BaseButton
          variant="secondary"
          :loading="loading"
          @click="loadMore"
        >
          Load More
        </BaseButton>
      </div>
    </div>

    <!-- Reply Modal -->
    <BaseModal
      :show="showReplyModal"
      title="Respond to Review"
      size="lg"
      @close="showReplyModal = false"
    >
      <div v-if="replyReview" class="space-y-4">
        <!-- Review Summary -->
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span class="font-medium">{{ getCustomerName(replyReview) }}</span>
              <span>•</span>
              <div class="flex items-center gap-0.5">
                <template v-for="(filled, i) in renderStars(replyReview.rating)" :key="i">
                  <StarIconSolid
                    v-if="filled"
                    class="h-3 w-3"
                    :class="getRatingColor(replyReview.rating)"
                  />
                  <StarIcon
                    v-else
                    class="h-3 w-3 text-gray-300 dark:text-gray-600"
                  />
                </template>
              </div>
            </div>
            <span class="text-xs text-gray-400">{{ timeAgo(replyReview.created_at) }}</span>
          </div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <strong>Product:</strong> {{ getProductName(replyReview) }}
          </p>
          <p v-if="replyReview.title" class="mt-3 font-medium text-gray-900 dark:text-white">
            {{ replyReview.title }}
          </p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">
            {{ getReviewComment(replyReview) }}
          </p>
        </div>

        <!-- Response Input -->
        <FormTextarea
          v-model="replyText"
          label="Your Response"
          name="response"
          placeholder="Write a thoughtful response to address the customer's feedback..."
          :rows="5"
          required
        />

        <!-- Tips -->
        <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <h4 class="text-sm font-medium text-blue-800 dark:text-blue-300">Response Tips:</h4>
          <ul class="mt-1 list-inside list-disc text-xs text-blue-700 dark:text-blue-400">
            <li>Thank the customer for their feedback</li>
            <li>Address specific concerns they raised</li>
            <li>Offer solutions or next steps if applicable</li>
            <li>Keep it professional and courteous</li>
          </ul>
        </div>
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
            <CheckCircleIcon class="mr-1.5 h-4 w-4" />
            Submit Response
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
