<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Reviews — Review management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  MagnifyingGlassIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, timeAgo } = useDate()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Reviews', [
    { label: 'Reviews' },
  ], 'Manage product reviews')
})

// Search and filters
const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

// Table columns
const columns = [
  { key: 'product', label: 'Product', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'rating', label: 'Rating', sortable: true },
  { key: 'comment', label: 'Comment' },
  { key: 'status', label: 'Status' },
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
      image: null,
    },
    customer: {
      id: 'c1',
      name: 'আহমেদ হোসেন',
    },
    rating: 5,
    comment: 'অসাধারণ পণ্য! আমি খুবই সন্তুষ্ট। দ্রুত ডেলিভারি এবং পণ্যের মান খুব ভালো।',
    status: 'approved',
    createdAt: '2024-12-10T10:30:00Z',
  },
  {
    id: '2',
    product: {
      id: 'p2',
      name: 'ওয়্যারলেস হেডফোন',
      image: null,
    },
    customer: {
      id: 'c2',
      name: 'ফাতেমা বেগম',
    },
    rating: 4,
    comment: 'ভালো সাউন্ড কোয়ালিটি। ব্যাটারি লাইফ আরেকটু ভালো হলে ভালো হতো।',
    status: 'pending',
    createdAt: '2024-12-12T15:45:00Z',
  },
  {
    id: '3',
    product: {
      id: 'p3',
      name: 'লেদার ওয়ালেট',
      image: null,
    },
    customer: {
      id: 'c3',
      name: 'করিম উদ্দিন',
    },
    rating: 2,
    comment: 'মানের সাথে দামের মিল নেই।',
    status: 'rejected',
    createdAt: '2024-12-08T09:15:00Z',
  },
])

// View modal
const showViewModal = ref(false)
const selectedReview = ref<typeof reviews.value[0] | null>(null)

// View review
function viewReview(review: typeof reviews.value[0]) {
  selectedReview.value = review
  showViewModal.value = true
}

// Approve review
function approveReview(review: typeof reviews.value[0]) {
  review.status = 'approved'
  toast.success('Review approved')
}

// Reject review
function rejectReview(review: typeof reviews.value[0]) {
  review.status = 'rejected'
  toast.success('Review rejected')
}

// Delete review
function deleteReview(review: typeof reviews.value[0]) {
  reviews.value = reviews.value.filter(r => r.id !== review.id)
  toast.success('Review deleted')
}

// Get status variant
function getStatusVariant(status: string) {
  switch (status) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    default: return 'secondary'
  }
}

// Render stars
function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}
</script>

<template>
  <div class="space-y-6">
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
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
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
          <div class="flex items-center gap-3">
            <div
              v-if="row.product.image"
              class="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
            >
              <img :src="row.product.image" :alt="row.product.name" class="h-full w-full object-cover" />
            </div>
            <div
              v-else
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700"
            >
              <StarIcon class="h-5 w-5" />
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ row.product.name }}
            </span>
          </div>
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
            <span class="ml-1 text-sm text-gray-600 dark:text-gray-400">
              ({{ row.rating }})
            </span>
          </div>
        </template>

        <template #cell-comment="{ row }">
          <p class="max-w-xs truncate text-gray-600 dark:text-gray-400">
            {{ row.comment }}
          </p>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)">
            {{ row.status }}
          </BaseBadge>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ timeAgo(row.createdAt) }}
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
          <p class="text-gray-900 dark:text-white">{{ selectedReview.product.name }}</p>
        </div>

        <!-- Customer -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</label>
          <p class="text-gray-900 dark:text-white">{{ selectedReview.customer.name }}</p>
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
          </div>
        </div>

        <!-- Comment -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Comment</label>
          <p class="mt-1 text-gray-900 dark:text-white">{{ selectedReview.comment }}</p>
        </div>

        <!-- Date -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
          <p class="text-gray-900 dark:text-white">{{ formatDate(selectedReview.createdAt, 'full') }}</p>
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
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showViewModal = false">
            Close
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
