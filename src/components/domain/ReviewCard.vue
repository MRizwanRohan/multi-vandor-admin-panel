<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Review Card — Product review display card -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Review, ReviewDetail } from '@/types'
import { useDate } from '@/composables'
import { BaseBadge, BaseButton } from '@/components/ui'
import {
  StarIcon,
  CheckBadgeIcon,
  HandThumbUpIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  PhotoIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

interface Props {
  review: Review | ReviewDetail
  showProduct?: boolean
  showActions?: boolean
  showModeration?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showProduct: true,
  showActions: true,
  showModeration: false
})

const emit = defineEmits<{
  (e: 'approve'): void
  (e: 'reject'): void
  (e: 'flag'): void
  (e: 'respond'): void
  (e: 'viewProduct'): void
  (e: 'viewImage', index: number): void
}>()

const { formatDate, formatRelative } = useDate()

// Status config
const statusConfig: Record<string, { variant: string; label: string }> = {
  pending: { variant: 'warning', label: 'অপেক্ষমান' },
  approved: { variant: 'success', label: 'অনুমোদিত' },
  rejected: { variant: 'danger', label: 'প্রত্যাখ্যাত' },
  flagged: { variant: 'warning', label: 'ফ্ল্যাগড' }
}

// Rating stars
const ratingStars = computed(() => {
  const full = props.review.rating
  const empty = 5 - full
  return { full, empty }
})

// Has vendor response
const hasResponse = computed(() => {
  return 'vendor_response' in props.review && props.review.vendor_response !== null
})

// Expanded state for long content
const isExpanded = ref(false)
const shouldTruncate = computed(() => props.review.content.length > 300)
const displayContent = computed(() => {
  if (!shouldTruncate.value || isExpanded.value) {
    return props.review.content
  }
  return props.review.content.substring(0, 300) + '...'
})
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <!-- Product Info (Optional) -->
    <div
      v-if="showProduct"
      class="flex items-center gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700"
    >
      <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
        <img
          v-if="review.product_image"
          :src="review.product_image"
          :alt="review.product_name"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full items-center justify-center">
          <PhotoIcon class="h-6 w-6 text-gray-400" />
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="truncate font-medium text-gray-900 dark:text-white">
          {{ review.product_name }}
        </h4>
        <button
          type="button"
          class="text-sm text-primary-600 hover:underline dark:text-primary-400"
          @click="emit('viewProduct')"
        >
          পণ্য দেখুন
        </button>
      </div>
      <BaseBadge
        :variant="statusConfig[review.status]?.variant as any || 'gray'"
        size="sm"
      >
        {{ statusConfig[review.status]?.label || review.status }}
      </BaseBadge>
    </div>

    <!-- Review Content -->
    <div class="px-6 py-4">
      <!-- Header: Customer & Rating -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <!-- Avatar -->
          <div class="h-10 w-10 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/50">
            <img
              v-if="review.customer_avatar"
              :src="review.customer_avatar"
              :alt="review.customer_name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full items-center justify-center">
              <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
                {{ review.customer_name.charAt(0).toUpperCase() }}
              </span>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ review.customer_name }}
              </span>
              <CheckBadgeIcon
                v-if="review.is_verified_purchase"
                class="h-5 w-5 text-success-500"
                title="ভেরিফাইড ক্রয়"
              />
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{{ formatRelative(review.created_at) }}</span>
              <span>•</span>
              <span>{{ formatDate(review.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Rating -->
        <div class="flex items-center">
          <StarIconSolid
            v-for="n in ratingStars.full"
            :key="`full-${n}`"
            class="h-5 w-5 text-warning-400"
          />
          <StarIcon
            v-for="n in ratingStars.empty"
            :key="`empty-${n}`"
            class="h-5 w-5 text-gray-300"
          />
        </div>
      </div>

      <!-- Title -->
      <h4
        v-if="review.title"
        class="mt-4 font-semibold text-gray-900 dark:text-white"
      >
        {{ review.title }}
      </h4>

      <!-- Content -->
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        {{ displayContent }}
      </p>
      <button
        v-if="shouldTruncate"
        type="button"
        class="mt-1 text-sm text-primary-600 hover:underline dark:text-primary-400"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? 'কম দেখুন' : 'আরো দেখুন' }}
      </button>

      <!-- Images -->
      <div
        v-if="review.images?.length"
        class="mt-4 flex flex-wrap gap-2"
      >
        <button
          v-for="(image, index) in review.images"
          :key="image.id"
          type="button"
          class="h-20 w-20 overflow-hidden rounded-lg border border-gray-200 hover:border-primary-500 dark:border-gray-600"
          @click="emit('viewImage', index)"
        >
          <img
            :src="image.url"
            :alt="image.alt_text || 'Review image'"
            class="h-full w-full object-cover"
          />
        </button>
      </div>

      <!-- Helpful Count -->
      <div class="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span class="flex items-center gap-1">
          <HandThumbUpIcon class="h-4 w-4" />
          {{ review.helpful_count }} জন সহায়ক মনে করেছেন
        </span>
      </div>
    </div>

    <!-- Vendor Response -->
    <div
      v-if="hasResponse"
      class="mx-6 mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
        <ChatBubbleLeftIcon class="h-4 w-4 text-primary-500" />
        ভেন্ডর প্রতিক্রিয়া
      </div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {{ (review as ReviewDetail).vendor_response?.content }}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ formatRelative((review as ReviewDetail).vendor_response!.responded_at) }}
      </p>
    </div>

    <!-- Actions -->
    <div
      v-if="showActions || showModeration"
      class="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700"
    >
      <!-- Moderation Actions -->
      <div v-if="showModeration" class="flex gap-2">
        <BaseButton
          v-if="review.status === 'pending'"
          variant="primary"
          size="sm"
          @click="emit('approve')"
        >
          <CheckIcon class="mr-1 h-4 w-4" />
          অনুমোদন
        </BaseButton>
        <BaseButton
          v-if="review.status === 'pending'"
          variant="danger"
          size="sm"
          @click="emit('reject')"
        >
          <XMarkIcon class="mr-1 h-4 w-4" />
          প্রত্যাখ্যান
        </BaseButton>
        <BaseButton
          v-if="review.status !== 'flagged'"
          variant="outline"
          size="sm"
          @click="emit('flag')"
        >
          <FlagIcon class="mr-1 h-4 w-4" />
          ফ্ল্যাগ
        </BaseButton>
      </div>
      <div v-else />

      <!-- Response Action -->
      <BaseButton
        v-if="showActions && !hasResponse"
        variant="outline"
        size="sm"
        @click="emit('respond')"
      >
        <ChatBubbleLeftIcon class="mr-1 h-4 w-4" />
        উত্তর দিন
      </BaseButton>
    </div>
  </div>
</template>
