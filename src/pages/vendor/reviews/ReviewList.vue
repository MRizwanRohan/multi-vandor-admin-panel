<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Reviews — Review management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatCard from '@/components/ui/StatCard.vue'
import {
  MagnifyingGlassIcon,
  StarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, timeAgo } = useDate()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Reviews', [
    { label: 'Reviews' },
  ], 'View and respond to product reviews')
})

// Stats
const stats = computed(() => [
  {
    title: 'Average Rating',
    value: '4.5',
    icon: StarIcon,
    color: 'warning' as const,
  },
  {
    title: 'Total Reviews',
    value: '156',
    icon: ChatBubbleLeftIcon,
    color: 'primary' as const,
  },
])

// Search and filters
const searchQuery = ref('')
const ratingFilter = ref('')

const ratingOptions = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
]

// Table columns
const columns = [
  { key: 'product', label: 'Product', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'rating', label: 'Rating', sortable: true },
  { key: 'comment', label: 'Comment' },
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Mock data
const reviews = ref([
  {
    id: '1',
    product: {
      id: 'p1',
      name: 'স্মার্ট ওয়াচ প্রো',
    },
    customer: {
      id: 'c1',
      name: 'আহমেদ হোসেন',
    },
    rating: 5,
    comment: 'অসাধারণ পণ্য! আমি খুবই সন্তুষ্ট।',
    reply: null,
    createdAt: '2024-12-10T10:30:00Z',
  },
  {
    id: '2',
    product: {
      id: 'p2',
      name: 'ওয়্যারলেস হেডফোন',
    },
    customer: {
      id: 'c2',
      name: 'ফাতেমা বেগম',
    },
    rating: 4,
    comment: 'ভালো সাউন্ড কোয়ালিটি।',
    reply: 'ধন্যবাদ আপনার রিভিউয়ের জন্য!',
    createdAt: '2024-12-12T15:45:00Z',
  },
])

// Reply modal
const showReplyModal = ref(false)
const selectedReview = ref<typeof reviews.value[0] | null>(null)
const replyText = ref('')

// Open reply modal
function openReplyModal(review: typeof reviews.value[0]) {
  selectedReview.value = review
  replyText.value = review.reply || ''
  showReplyModal.value = true
}

// Submit reply
function submitReply() {
  if (!selectedReview.value || !replyText.value.trim()) return
  
  selectedReview.value.reply = replyText.value
  showReplyModal.value = false
  toast.success('Reply submitted successfully')
}

// Render stars
function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
      />
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
          class="w-40"
        />
      </div>
    </BaseCard>

    <!-- Reviews table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="reviews"
        :loading="false"
        :total="reviews.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-product="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ row.product.name }}
          </span>
        </template>

        <template #cell-customer="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ row.customer.name }}
          </span>
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
          <div>
            <p class="max-w-xs truncate text-gray-900 dark:text-white">
              {{ row.comment }}
            </p>
            <p
              v-if="row.reply"
              class="mt-1 max-w-xs truncate text-sm text-gray-500 dark:text-gray-400"
            >
              ↳ {{ row.reply }}
            </p>
          </div>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ timeAgo(row.createdAt) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <BaseButton
            variant="ghost"
            size="sm"
            @click="openReplyModal(row)"
          >
            <ChatBubbleLeftIcon class="mr-1 h-4 w-4" />
            {{ row.reply ? 'Edit Reply' : 'Reply' }}
          </BaseButton>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Reply modal -->
    <BaseModal
      :show="showReplyModal"
      title="Reply to Review"
      size="lg"
      @close="showReplyModal = false"
    >
      <div v-if="selectedReview" class="space-y-4">
        <!-- Review details -->
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{{ selectedReview.customer.name }}</span>
            <span>•</span>
            <div class="flex items-center gap-0.5">
              <template v-for="(filled, i) in renderStars(selectedReview.rating)" :key="i">
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
          </div>
          <p class="mt-2 text-gray-900 dark:text-white">
            {{ selectedReview.comment }}
          </p>
        </div>

        <!-- Reply input -->
        <FormTextarea
          v-model="replyText"
          label="Your Reply"
          name="reply"
          placeholder="Write your reply..."
          :rows="4"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showReplyModal = false">
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            :disabled="!replyText.trim()"
            @click="submitReply"
          >
            Submit Reply
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
