<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Pending Categories — Review vendor category requests              -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast } from '@/composables/useToast'
import { useDate } from '@/composables/useDate'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { Category } from '@/types'
import {
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, timeAgo } = useDate()

// State
const categories = ref<Category[]>([])
const allCategories = ref<Category[]>([])
const isLoading = ref(true)
const showDetailModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const selectedCategory = ref<Category | null>(null)
const actionLoading = ref<number | null>(null)

// Approve form (modifications)
const approveModifications = ref({
  name: '',
  description: '',
  parent_id: null as number | null,
  seo_title: '',
})
const hasModifications = ref(false)

// Reject form
const rejectionReason = ref('')
const suggestedCategoryId = ref<number | null>(null)
const adminNotes = ref('')

onMounted(() => {
  breadcrumbStore.setPageInfo('Pending Categories', [
    { label: 'Categories', to: '/admin/categories' },
    { label: 'Pending' },
  ], 'Review vendor category requests')
  fetchPending()
  fetchAllCategories()
})

// Fetch pending categories from real API
async function fetchPending() {
  isLoading.value = true
  try {
    const response = await categoryService.getPending()
    categories.value = response.data
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load pending categories')
    categories.value = []
  } finally {
    isLoading.value = false
  }
}

// Fetch all active categories (for suggested_category_id dropdown & parent dropdown)
async function fetchAllCategories() {
  try {
    const response = await categoryService.getAll({ status: 'active' })
    allCategories.value = response.data
  } catch {
    allCategories.value = []
  }
}

// Flatten tree into options for dropdowns
function flattenForDropdown(cats: Category[], prefix = ''): { value: number | string; label: string }[] {
  const result: { value: number | string; label: string }[] = []
  for (const c of cats) {
    result.push({ value: c.id, label: prefix ? `${prefix} → ${c.name}` : c.name })
    if (c.children?.length) {
      result.push(...flattenForDropdown(c.children, prefix ? `${prefix} → ${c.name}` : c.name))
    }
  }
  return result
}

const parentOptions = computed(() => [
  { value: '', label: 'No change' },
  ...flattenForDropdown(allCategories.value),
])

const suggestedCategoryOptions = computed(() => [
  { value: '', label: 'None' },
  ...flattenForDropdown(allCategories.value),
])

// Stats
const stats = computed(() => ({
  total: categories.value.length,
  pending: categories.value.filter(c => c.status === 'pending').length,
  approved: categories.value.filter(c => c.status === 'active').length,
  rejected: categories.value.filter(c => c.status === 'rejected').length,
}))

// Status helpers
function statusVariant(status: string): 'warning' | 'success' | 'danger' | 'info' {
  return { pending: 'warning' as const, active: 'success' as const, rejected: 'danger' as const }[status] ?? 'info'
}

// View detail
function viewDetail(cat: Category) {
  selectedCategory.value = cat
  showDetailModal.value = true
}

// Open approve modal
function openApproveModal(cat: Category) {
  selectedCategory.value = cat
  hasModifications.value = false
  approveModifications.value = {
    name: cat.name,
    description: cat.description || '',
    parent_id: cat.parent_id,
    seo_title: cat.seo_title || '',
  }
  showApproveModal.value = true
}

// Submit approval with optional modifications
async function submitApproval() {
  if (!selectedCategory.value) return

  actionLoading.value = selectedCategory.value.id
  try {
    // Build modifications payload only if user opted in
    const payload = hasModifications.value
      ? {
          modifications: {
            ...(approveModifications.value.name !== selectedCategory.value.name
              ? { name: approveModifications.value.name }
              : {}),
            ...(approveModifications.value.description !== (selectedCategory.value.description || '')
              ? { description: approveModifications.value.description }
              : {}),
            ...(approveModifications.value.parent_id !== selectedCategory.value.parent_id
              ? { parent_id: approveModifications.value.parent_id }
              : {}),
            ...(approveModifications.value.seo_title !== (selectedCategory.value.seo_title || '')
              ? { metadata: { seo_title: approveModifications.value.seo_title } }
              : {}),
          },
        }
      : undefined

    await categoryService.approve(selectedCategory.value.id, payload)
    toast.success(`"${selectedCategory.value.name}" approved`)
    showApproveModal.value = false
    fetchPending()
  } catch {
    toast.error('Failed to approve')
  } finally {
    actionLoading.value = null
  }
}

// Quick approve (no modal, no modifications)
async function quickApprove(cat: Category) {
  actionLoading.value = cat.id
  try {
    await categoryService.approve(cat.id)
    toast.success(`"${cat.name}" approved`)
    fetchPending()
  } catch {
    toast.error('Failed to approve')
  } finally {
    actionLoading.value = null
  }
}

// Open reject modal
function openRejectModal(cat: Category) {
  selectedCategory.value = cat
  rejectionReason.value = ''
  suggestedCategoryId.value = null
  adminNotes.value = ''
  showRejectModal.value = true
}

// Submit rejection with full payload
async function submitRejection() {
  if (!rejectionReason.value.trim()) {
    toast.error('Please provide a rejection reason')
    return
  }
  if (rejectionReason.value.trim().length < 10) {
    toast.error('Rejection reason must be at least 10 characters')
    return
  }
  if (!selectedCategory.value) return

  actionLoading.value = selectedCategory.value.id
  try {
    await categoryService.reject(selectedCategory.value.id, {
      reason: rejectionReason.value.trim(),
      suggested_category_id: suggestedCategoryId.value || undefined,
      admin_notes: adminNotes.value.trim() || undefined,
    })
    toast.success(`"${selectedCategory.value.name}" rejected`)
    showRejectModal.value = false
    fetchPending()
  } catch {
    toast.error('Failed to reject')
  } finally {
    actionLoading.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats row -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="flex items-center gap-4 !p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
          <FolderIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</p>
          <p class="text-xs text-gray-500">Total Requests</p>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-4 !p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/40">
          <ClockIcon class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.pending }}</p>
          <p class="text-xs text-gray-500">Pending</p>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-4 !p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
          <CheckCircleIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.approved }}</p>
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

    <!-- Actions header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Category Requests</h3>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        @click="fetchPending"
      >
        <ArrowPathIcon class="h-4 w-4" />
        Refresh
      </button>
    </div>

    <!-- Loading -->
    <BaseCard v-if="isLoading" padding="none">
      <div class="flex items-center justify-center py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    </BaseCard>

    <!-- Empty state -->
    <BaseCard v-else-if="categories.length === 0">
      <EmptyState
        title="No pending requests"
        description="There are currently no category requests from vendors."
      />
    </BaseCard>

    <!-- Category list -->
    <div v-else class="space-y-3">
      <BaseCard
        v-for="cat in categories"
        :key="cat.id"
        class="transition-all hover:shadow-md"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <!-- Left: info -->
          <div class="flex items-start gap-4 min-w-0 flex-1">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="{
                'bg-yellow-100 dark:bg-yellow-900/30': cat.status === 'pending',
                'bg-green-100 dark:bg-green-900/30': cat.status === 'active',
                'bg-red-100 dark:bg-red-900/30': cat.status === 'rejected',
              }"
            >
              <FolderIcon
                class="h-5 w-5"
                :class="{
                  'text-yellow-600 dark:text-yellow-400': cat.status === 'pending',
                  'text-green-600 dark:text-green-400': cat.status === 'active',
                  'text-red-600 dark:text-red-400': cat.status === 'rejected',
                }"
              />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ cat.name }}</h4>
                <BaseBadge :variant="statusVariant(cat.status)" dot rounded size="sm">
                  {{ cat.status_label || cat.status }}
                </BaseBadge>
              </div>
              <p v-if="cat.description" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {{ cat.description }}
              </p>
              <div class="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span v-if="cat.creator">
                  By <span class="text-gray-600 dark:text-gray-300">{{ cat.creator.name }}</span>
                </span>
                <span :title="formatDate(cat.created_at, 'MMMM D, YYYY h:mm A')">
                  {{ timeAgo(cat.created_at) }}
                </span>
                <span v-if="cat.parent_id" class="text-gray-400">
                  Parent ID: {{ cat.parent_id }}
                </span>
              </div>
              <p v-if="cat.rejection_reason" class="mt-1.5 text-xs text-red-500 dark:text-red-400">
                Rejection: {{ cat.rejection_reason }}
              </p>
            </div>
          </div>

          <!-- Right: actions -->
          <div class="flex items-center gap-2 shrink-0 sm:ml-4">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View details"
              @click="viewDetail(cat)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <template v-if="cat.status === 'pending'">
              <BaseButton
                size="sm"
                variant="secondary"
                :loading="actionLoading === cat.id"
                @click="openApproveModal(cat)"
                title="Approve with modifications"
              >
                <PencilSquareIcon class="mr-1 h-4 w-4" />
                Review
              </BaseButton>
              <BaseButton
                size="sm"
                variant="primary"
                :loading="actionLoading === cat.id"
                @click="quickApprove(cat)"
              >
                <CheckCircleIcon class="mr-1 h-4 w-4" />
                Approve
              </BaseButton>
              <BaseButton
                size="sm"
                variant="danger"
                :loading="actionLoading === cat.id"
                @click="openRejectModal(cat)"
              >
                <XCircleIcon class="mr-1 h-4 w-4" />
                Reject
              </BaseButton>
            </template>
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

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium uppercase text-gray-400">Slug</p>
            <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ selectedCategory.slug }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-gray-400">Depth</p>
            <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ selectedCategory.depth }}</p>
          </div>
          <div v-if="selectedCategory.creator">
            <p class="text-xs font-medium uppercase text-gray-400">Created By</p>
            <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ selectedCategory.creator.name }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-gray-400">Created</p>
            <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ formatDate(selectedCategory.created_at, 'MMMM D, YYYY') }}</p>
          </div>
        </div>

        <div v-if="selectedCategory.description">
          <p class="text-xs font-medium uppercase text-gray-400">Description</p>
          <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ selectedCategory.description }}</p>
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

        <!-- Actions in modal -->
        <div v-if="selectedCategory.status === 'pending'" class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <BaseButton variant="secondary" @click="showDetailModal = false; openApproveModal(selectedCategory!)">
            <PencilSquareIcon class="mr-1 h-4 w-4" />
            Review & Approve
          </BaseButton>
          <BaseButton variant="primary" @click="quickApprove(selectedCategory!); showDetailModal = false">
            <CheckCircleIcon class="mr-1 h-4 w-4" />
            Approve
          </BaseButton>
          <BaseButton variant="danger" @click="showDetailModal = false; openRejectModal(selectedCategory!)">
            <XCircleIcon class="mr-1 h-4 w-4" />
            Reject
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Approve Modal (with optional modifications) -->
    <BaseModal v-model="showApproveModal" title="Approve Category" size="md">
      <div v-if="selectedCategory" class="space-y-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <CheckCircleIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ selectedCategory.name }}</h4>
            <p v-if="selectedCategory.creator" class="text-xs text-gray-500">By {{ selectedCategory.creator.name }}</p>
          </div>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          You can modify the category before approving. Toggle modifications below if changes are needed.
        </p>

        <!-- Toggle modifications -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="hasModifications" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span class="text-sm text-gray-700 dark:text-gray-300">Modify before approving</span>
        </label>

        <!-- Modifications form -->
        <div v-if="hasModifications" class="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <FormInput
            v-model="approveModifications.name"
            label="Category Name"
            placeholder="Category name"
          />
          <FormTextarea
            v-model="approveModifications.description"
            label="Description"
            placeholder="Category description"
            :rows="3"
          />
          <FormSelect
            v-model="approveModifications.parent_id"
            label="Parent Category"
            :options="parentOptions"
          />
          <FormInput
            v-model="approveModifications.seo_title"
            label="SEO Title"
            placeholder="SEO title"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <BaseButton variant="ghost" @click="showApproveModal = false">Cancel</BaseButton>
          <BaseButton variant="primary" :loading="actionLoading !== null" @click="submitApproval">
            <CheckCircleIcon class="mr-1 h-4 w-4" />
            Approve Category
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Reject Modal (with suggested category + admin notes) -->
    <BaseModal v-model="showRejectModal" title="Reject Category" size="md">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Rejecting <span class="font-semibold text-gray-900 dark:text-white">"{{ selectedCategory?.name }}"</span>.
          The vendor will be notified.
        </p>

        <FormTextarea
          v-model="rejectionReason"
          label="Rejection Reason"
          placeholder="Why is this category being rejected? (min 10 characters)"
          :rows="4"
          required
          hint="Required. Minimum 10 characters."
        />

        <FormSelect
          v-model="suggestedCategoryId"
          label="Suggest Alternative Category"
          :options="suggestedCategoryOptions"
          hint="Optional. Suggest an existing category the vendor could use instead."
        />

        <FormTextarea
          v-model="adminNotes"
          label="Admin Notes (Internal)"
          placeholder="Internal notes for other admins (not visible to vendor)"
          :rows="2"
          hint="Optional. Only visible to admins."
        />

        <div class="flex justify-end gap-2">
          <BaseButton variant="ghost" @click="showRejectModal = false">Cancel</BaseButton>
          <BaseButton
            variant="danger"
            :loading="actionLoading !== null"
            :disabled="rejectionReason.trim().length < 10"
            @click="submitRejection"
          >
            <XCircleIcon class="mr-1 h-4 w-4" />
            Reject Category
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
