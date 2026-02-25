<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- My Categories — Vendor: manage own category suggestions           -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Category } from '@/types'
import {
  FolderIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, timeAgo } = useDate()

const categories = ref<Category[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const showDetailModal = ref(false)
const selectedCategory = ref<Category | null>(null)

onMounted(() => {
  breadcrumbStore.setPageInfo('My Categories', [
    { label: 'Categories' },
    { label: 'My Categories' },
  ], 'Your category suggestions and their status')
  fetchMyCategories()
})

async function fetchMyCategories() {
  isLoading.value = true
  loadError.value = null
  try {
    const response = await categoryService.getMyCategories()
    categories.value = response.data
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load your categories'
    toast.error(loadError.value!)
    categories.value = []
  } finally {
    isLoading.value = false
  }
}

// Stats
const stats = computed(() => ({
  total: categories.value.length,
  pending: categories.value.filter(c => c.status === 'pending').length,
  active: categories.value.filter(c => c.status === 'active').length,
  rejected: categories.value.filter(c => c.status === 'rejected').length,
}))

function statusVariant(s: string): 'warning' | 'success' | 'danger' | 'info' {
  return { pending: 'warning' as const, active: 'success' as const, rejected: 'danger' as const }[s] ?? 'info'
}

function statusIcon(s: string) {
  return { pending: ClockIcon, active: CheckCircleIcon, rejected: XCircleIcon }[s] ?? ClockIcon
}

function viewDetail(cat: Category) {
  selectedCategory.value = cat
  showDetailModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ stats.total }} categories</span>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          @click="fetchMyCategories"
        >
          <ArrowPathIcon class="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="secondary" @click="router.push('/vendor/categories')">
          Browse All
        </BaseButton>
        <BaseButton variant="primary" @click="router.push('/vendor/categories/suggest')">
          <PlusIcon class="mr-1.5 h-4 w-4" />
          Suggest Category
        </BaseButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-3">
      <BaseCard class="flex items-center gap-4 !p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/40">
          <ClockIcon class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.pending }}</p>
          <p class="text-xs text-gray-500">Pending Review</p>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-4 !p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
          <CheckCircleIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active }}</p>
          <p class="text-xs text-gray-500">Approved</p>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-4 !p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
          <XCircleIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.rejected }}</p>
          <p class="text-xs text-gray-500">Rejected</p>
        </div>
      </BaseCard>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <!-- Error state -->
    <BaseCard v-else-if="loadError" class="py-16">
      <div class="flex flex-col items-center text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
          <FolderIcon class="h-6 w-6 text-red-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Failed to Load</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ loadError }}</p>
        <BaseButton variant="secondary" class="mt-4" @click="fetchMyCategories">
          Retry
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Empty -->
    <BaseCard v-else-if="categories.length === 0">
      <EmptyState
        title="No categories yet"
        description="You haven't suggested any categories. Browse existing categories or suggest new ones."
        action-text="Suggest Category"
        @action="router.push('/vendor/categories/suggest')"
      />
    </BaseCard>

    <!-- Category cards -->
    <div v-else class="space-y-3">
      <BaseCard
        v-for="cat in categories"
        :key="cat.id"
        class="transition-all hover:shadow-md"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-start gap-4 min-w-0 flex-1">
            <!-- Status icon -->
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              :class="{
                'bg-yellow-100 dark:bg-yellow-900/30': cat.status === 'pending',
                'bg-green-100 dark:bg-green-900/30': cat.status === 'active',
                'bg-red-100 dark:bg-red-900/30': cat.status === 'rejected',
              }"
            >
              <component
                :is="statusIcon(cat.status)"
                class="h-5 w-5"
                :class="{
                  'text-yellow-600 dark:text-yellow-400': cat.status === 'pending',
                  'text-green-600 dark:text-green-400': cat.status === 'active',
                  'text-red-600 dark:text-red-400': cat.status === 'rejected',
                }"
              />
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ cat.name }}</h4>
                <BaseBadge :variant="statusVariant(cat.status)" dot rounded size="sm">
                  {{ cat.status_label || cat.status }}
                </BaseBadge>
              </div>
              <p v-if="cat.description" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {{ cat.description }}
              </p>

              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span :title="formatDate(cat.created_at, 'MMMM D, YYYY h:mm A')">
                  Submitted {{ timeAgo(cat.created_at) }}
                </span>
                <span v-if="cat.approved_at">
                  Approved {{ formatDate(cat.approved_at, 'MMM D, YYYY') }}
                </span>
              </div>

              <!-- Rejection reason -->
              <div v-if="cat.rejection_reason" class="mt-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/20">
                <p class="text-xs font-medium text-red-500">Rejection Reason:</p>
                <p class="text-sm text-red-600 dark:text-red-400">{{ cat.rejection_reason }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View details"
              @click="viewDetail(cat)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <BaseButton
              v-if="cat.status === 'pending'"
              size="sm"
              variant="secondary"
              @click="router.push(`/vendor/categories/${cat.id}/edit`)"
            >
              <PencilSquareIcon class="mr-1 h-3.5 w-3.5" />
              Edit
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Detail Modal -->
    <BaseModal v-model="showDetailModal" title="Category Details" size="md">
      <div v-if="selectedCategory" class="space-y-5">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
            <FolderIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedCategory.name }}</h3>
            <BaseBadge :variant="statusVariant(selectedCategory.status)" dot rounded size="sm">
              {{ selectedCategory.status_label || selectedCategory.status }}
            </BaseBadge>
          </div>
        </div>

        <div v-if="selectedCategory.description">
          <p class="text-xs font-medium uppercase text-gray-400">Description</p>
          <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ selectedCategory.description }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium uppercase text-gray-400">Slug</p>
            <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ selectedCategory.slug }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-gray-400">Created</p>
            <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ formatDate(selectedCategory.created_at, 'MMM D, YYYY') }}</p>
          </div>
        </div>

        <div v-if="selectedCategory.seo_title || selectedCategory.seo_description" class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p class="text-xs font-medium uppercase text-gray-400 mb-2">SEO</p>
          <p v-if="selectedCategory.seo_title" class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedCategory.seo_title }}</p>
          <p v-if="selectedCategory.seo_description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ selectedCategory.seo_description }}</p>
        </div>

        <div v-if="selectedCategory.rejection_reason" class="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          <p class="text-xs font-medium uppercase text-red-500">Rejection Reason</p>
          <p class="mt-0.5 text-sm text-red-600 dark:text-red-400">{{ selectedCategory.rejection_reason }}</p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
