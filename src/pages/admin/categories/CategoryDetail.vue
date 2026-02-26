<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Category Detail — Full category info, children, templates  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast, useConfirm, useDate } from '@/composables'
import { getImageUrl } from '@/utils/helpers'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import CategoryTemplateManager from './CategoryTemplateManager.vue'
import type { Category, CategoryTemplateAssignment, CategoryRequest } from '@/types'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  FolderIcon,
  TagIcon,
  CubeIcon,
  UserGroupIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  BoltIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDate, timeAgo } = useDate()

const categorySlug = computed(() => route.params.slug as string)
const category = ref<Category | null>(null)
const templates = ref<CategoryTemplateAssignment[]>([])
const requestHistory = ref<CategoryRequest[]>([])
const isLoading = ref(true)
const isToggling = ref(false)
const loadError = ref<string | null>(null)
const showTemplateManager = ref(false)

// Children filter
const childrenFilter = ref<string>('all')
const filteredChildren = ref<Category[]>([])
const isLoadingChildren = ref(false)

onMounted(() => fetchData())

async function fetchData() {
  isLoading.value = true
  loadError.value = null
  try {
    const cat = await categoryService.get(categorySlug.value)
    category.value = cat

    breadcrumbStore.setPageInfo(cat.name, [
      { label: 'Categories', to: '/admin/categories' },
      { label: cat.name },
    ])

    // Fetch templates
    try {
      templates.value = await categoryService.getCategoryTemplates(categorySlug.value)
    } catch {
      templates.value = []
    }

    // Fetch request history
    try {
      requestHistory.value = await categoryService.getRequestHistory(categorySlug.value)
    } catch {
      requestHistory.value = []
    }

    // Init filtered children
    filteredChildren.value = cat.children || []
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to load category'
    loadError.value = msg
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

// Toggle active
async function handleToggleActive() {
  if (!category.value) return
  isToggling.value = true
  try {
    const updated = await categoryService.toggleActive(category.value.slug)
    category.value = updated
    toast.success(`Category ${updated.is_active ? 'activated' : 'deactivated'}`)
  } catch {
    toast.error('Failed to toggle status')
  } finally {
    isToggling.value = false
  }
}

// Delete
async function handleDelete() {
  if (!category.value || !category.value.can_be_deleted) return

  const confirmed = await confirm.confirm({
    title: 'Delete Category',
    message: `Are you sure you want to delete "${category.value.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      await categoryService.delete(category.value.slug)
      toast.success('Category deleted')
      router.push('/admin/categories')
    } catch {
      toast.error('Failed to delete category')
    }
  }
}

// Status badge
function statusVariant(s: string): 'success' | 'warning' | 'danger' | 'info' {
  return { active: 'success' as const, pending: 'warning' as const, rejected: 'danger' as const, inactive: 'info' as const }[s] ?? 'info'
}

// Filter children using API endpoint
async function filterChildrenByStatus(status: string) {
  childrenFilter.value = status
  if (!category.value) return
  if (status === 'all') {
    filteredChildren.value = category.value.children || []
    return
  }
  isLoadingChildren.value = true
  try {
    const children = await categoryService.getChildren(category.value.slug, status)
    filteredChildren.value = children
  } catch {
    filteredChildren.value = []
  } finally {
    isLoadingChildren.value = false
  }
}

// Refresh templates after sync
async function onTemplatesSaved() {
  if (!category.value) return
  try {
    templates.value = await categoryService.getCategoryTemplates(categorySlug.value)
  } catch {
    // Keep existing
  }
}

// Image error handler
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  console.error('Failed to load image:', target.src)
  // Hide the image card on error
  if (category.value) {
    category.value.image = null
    category.value.image_field = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <!-- Error state -->
    <BaseCard v-else-if="loadError" class="!py-16">
      <div class="flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <XCircleIcon class="h-7 w-7 text-red-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Category Not Found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ loadError }}</p>
        <div class="mt-6 flex items-center gap-3">
          <BaseButton variant="secondary" @click="fetchData()">
            <ArrowPathIcon class="mr-1.5 h-4 w-4" />
            Retry
          </BaseButton>
          <BaseButton variant="primary" @click="router.push('/admin/categories')">
            <ArrowLeftIcon class="mr-1.5 h-4 w-4" />
            Back to Categories
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <template v-else-if="category">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-start gap-4">
          <BaseButton variant="ghost" size="sm" @click="router.push('/admin/categories')">
            <ArrowLeftIcon class="h-5 w-5" />
          </BaseButton>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ category.name }}</h1>
              <BaseBadge :variant="statusVariant(category.status)" dot rounded>
                {{ category.status_label || category.status }}
              </BaseBadge>
            </div>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ category.slug }}</p>
            <!-- Breadcrumb path -->
            <div v-if="category.path?.length" class="mt-1.5 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <template v-for="(segment, idx) in category.path" :key="idx">
                <span v-if="idx > 0" class="text-gray-300 dark:text-gray-600">/</span>
                <span>{{ segment }}</span>
              </template>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <BaseButton
            variant="secondary"
            size="sm"
            :loading="isToggling"
            @click="handleToggleActive"
          >
            <BoltIcon class="mr-1.5 h-4 w-4" />
            {{ category.is_active ? 'Deactivate' : 'Activate' }}
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            @click="router.push(`/admin/categories/${category.slug}/edit`)"
          >
            <PencilSquareIcon class="mr-1.5 h-4 w-4" />
            Edit
          </BaseButton>
          <BaseButton
            v-if="category.can_be_deleted"
            variant="danger"
            size="sm"
            @click="handleDelete"
          >
            <TrashIcon class="mr-1.5 h-4 w-4" />
            Delete
          </BaseButton>
        </div>
      </div>

      <!-- Main content grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left column: info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Overview card -->
          <BaseCard>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CubeIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ category.product_count || 0 }}</p>
                  <p class="text-xs text-gray-500">Products</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <UserGroupIcon class="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ category.vendor_count || 0 }}</p>
                  <p class="text-xs text-gray-500">Vendors</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <FolderIcon class="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ category.children?.length || 0 }}</p>
                  <p class="text-xs text-gray-500">Sub-categories</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DocumentTextIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ templates.length }}</p>
                  <p class="text-xs text-gray-500">Templates</p>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Description -->
          <BaseCard v-if="category.description" title="Description">
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ category.description }}
            </p>
          </BaseCard>

          <!-- Children -->
          <BaseCard v-if="category.children?.length" padding="none">
            <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Sub-categories</h3>
              <!-- Status filter -->
              <div class="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px]">
                <button
                  v-for="f in ['all', 'active', 'pending', 'inactive', 'rejected']"
                  :key="f"
                  type="button"
                  class="px-2 py-1 font-medium capitalize transition-colors first:rounded-l-lg last:rounded-r-lg"
                  :class="childrenFilter === f ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  @click="filterChildrenByStatus(f)"
                >
                  {{ f }}
                </button>
              </div>
            </div>

            <!-- Loading spinner for filter -->
            <div v-if="isLoadingChildren" class="flex items-center justify-center py-6">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
            </div>

            <div v-else-if="filteredChildren.length === 0" class="py-6 text-center">
              <FunnelIcon class="mx-auto h-6 w-6 text-gray-300 dark:text-gray-600" />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">No {{ childrenFilter !== 'all' ? childrenFilter : '' }} sub-categories found</p>
            </div>

            <div v-else class="divide-y divide-gray-100 dark:divide-gray-700 px-6 pb-4">
              <div
                v-for="child in filteredChildren"
                :key="child.id"
                class="flex items-center justify-between py-3 first:pt-3"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                    <TagIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div class="min-w-0">
                    <router-link
                      :to="`/admin/categories/${child.id}`"
                      class="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {{ child.name }}
                    </router-link>
                    <p v-if="child.description" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {{ child.description }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-4 shrink-0 ml-4">
                  <span class="text-sm text-gray-500">{{ child.product_count || 0 }} products</span>
                  <BaseBadge :variant="statusVariant(child.status)" dot rounded size="sm">
                    {{ child.status }}
                  </BaseBadge>
                  <router-link
                    :to="`/admin/categories/${child.id}`"
                    class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    View →
                  </router-link>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard v-else-if="category.can_have_children" title="Sub-categories">
            <EmptyState
              title="No sub-categories"
              description="This category has no sub-categories yet."
              action-text="Create Sub-category"
              @action="router.push('/admin/categories/create')"
            />
          </BaseCard>

          <!-- Templates -->
          <BaseCard padding="none">
            <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Attribute Templates
                <span v-if="templates.length" class="ml-1.5 text-sm font-normal text-gray-400">({{ templates.length }})</span>
              </h3>
              <BaseButton variant="secondary" size="sm" @click="showTemplateManager = true">
                <AdjustmentsHorizontalIcon class="mr-1.5 h-4 w-4" />
                Manage Templates
              </BaseButton>
            </div>

            <div v-if="templates.length === 0" class="py-6 text-center">
              <DocumentTextIcon class="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No templates assigned</p>
              <button
                type="button"
                class="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                @click="showTemplateManager = true"
              >
                + Add attribute templates
              </button>
            </div>

            <div v-else class="divide-y divide-gray-100 dark:divide-gray-700 px-6 pb-4">
              <div
                v-for="tmpl in templates"
                :key="tmpl.attribute_template_id || tmpl.id"
                class="flex items-center justify-between py-3 first:pt-3"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg" :class="tmpl.source === 'inherited' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-primary-100 dark:bg-primary-900/30'">
                    <DocumentTextIcon class="h-4 w-4" :class="tmpl.source === 'inherited' ? 'text-gray-400' : 'text-primary-600 dark:text-primary-400'" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ tmpl.name || `Template #${tmpl.attribute_template_id || tmpl.id}` }}
                      </p>
                      <BaseBadge v-if="tmpl.type" variant="info" size="sm" rounded>{{ tmpl.type }}</BaseBadge>
                      <BaseBadge v-if="tmpl.source === 'inherited'" variant="warning" size="sm" rounded>
                        inherited{{ tmpl.inherited_from ? ` from ${tmpl.inherited_from.name}` : '' }}
                      </BaseBadge>
                    </div>
                    <div class="flex items-center gap-3 mt-0.5">
                      <span class="text-xs text-gray-500">Order: {{ tmpl.display_order }}</span>
                      <span v-if="tmpl.is_variant_defining" class="text-xs text-purple-600 dark:text-purple-400">Variant defining</span>
                      <span v-if="tmpl.is_filterable" class="text-xs text-blue-600 dark:text-blue-400">Filterable</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    v-if="tmpl.is_required_override || tmpl.is_required"
                    class="text-xs text-amber-600 dark:text-amber-400 font-medium"
                  >
                    Required
                  </span>
                  <span v-if="tmpl.inheritance_mode" class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {{ tmpl.inheritance_mode }}
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Request History (audit trail) -->
          <BaseCard v-if="requestHistory.length" title="Request History">
            <div class="relative">
              <!-- Timeline line -->
              <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

              <div class="space-y-6">
                <div
                  v-for="req in requestHistory"
                  :key="req.id"
                  class="relative flex gap-4 pl-2"
                >
                  <!-- Timeline dot -->
                  <div
                    class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    :class="{
                      'bg-blue-100 dark:bg-blue-900/30': req.action === 'submitted',
                      'bg-green-100 dark:bg-green-900/30': req.action === 'approved',
                      'bg-red-100 dark:bg-red-900/30': req.action === 'rejected',
                    }"
                  >
                    <ClockIcon v-if="req.action === 'submitted'" class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <CheckCircleIcon v-else-if="req.action === 'approved'" class="h-4 w-4 text-green-600 dark:text-green-400" />
                    <XCircleIcon v-else class="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0 pb-2">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {{ req.action }}
                      </p>
                      <time class="text-xs text-gray-400 shrink-0">
                        {{ timeAgo(req.created_at) }}
                      </time>
                    </div>

                    <!-- Who performed the action -->
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <template v-if="req.action === 'submitted' && req.vendor">
                        By {{ req.vendor.name }}
                      </template>
                      <template v-else-if="req.acted_by">
                        By {{ req.acted_by.name }}
                      </template>
                      <template v-else>
                        {{ formatDate(req.created_at, 'MMM D, YYYY h:mm A') }}
                      </template>
                    </p>

                    <!-- Rejection reason -->
                    <div
                      v-if="req.action === 'rejected' && req.rejection_reason"
                      class="mt-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-2.5"
                    >
                      <p class="text-xs font-medium text-red-700 dark:text-red-400">Reason:</p>
                      <p class="text-xs text-red-600 dark:text-red-300 mt-0.5">{{ req.rejection_reason }}</p>
                    </div>

                    <!-- Admin notes -->
                    <p
                      v-if="req.admin_notes"
                      class="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic"
                    >
                      Note: {{ req.admin_notes }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Right column: sidebar info -->
        <div class="space-y-6">
          <!-- Image -->
          <BaseCard v-if="category.image || category.image_field">
            <img
              :src="getImageUrl(category.image || category.image_field)"
              :alt="category.name"
              class="w-full rounded-lg object-cover aspect-video"
              @error="handleImageError"
            />
          </BaseCard>

          <!-- Details card -->
          <BaseCard title="Details">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Status</span>
                <BaseBadge :variant="statusVariant(category.status)" dot rounded size="sm">
                  {{ category.status_label || category.status }}
                </BaseBadge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Active</span>
                <span
                  class="inline-flex items-center gap-1 text-sm font-medium"
                  :class="category.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'"
                >
                  <span class="h-2 w-2 rounded-full" :class="category.is_active ? 'bg-green-500' : 'bg-gray-300'" />
                  {{ category.is_active ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Depth</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">Level {{ category.depth }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Display Order</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ category.display_order }}</span>
              </div>
              <div v-if="category.parent" class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Parent</span>
                <router-link
                  :to="`/admin/categories/${category.parent.id}`"
                  class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {{ category.parent.name }}
                </router-link>
              </div>
              <div v-else-if="category.parent_id" class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Parent</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">ID: {{ category.parent_id }}</span>
              </div>
            </div>
          </BaseCard>

          <!-- SEO -->
          <BaseCard v-if="category.seo_title || category.seo_description || category.keywords?.length" title="SEO">
            <div class="space-y-3">
              <div v-if="category.seo_title">
                <p class="text-xs text-gray-400">Title</p>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ category.seo_title }}</p>
              </div>
              <div v-if="category.seo_description">
                <p class="text-xs text-gray-400">Description</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ category.seo_description }}</p>
              </div>
              <div v-if="category.keywords?.length">
                <p class="text-xs text-gray-400 mb-1.5">Keywords</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="kw in category.keywords"
                    :key="kw"
                    class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  >
                    {{ kw }}
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Audit -->
          <BaseCard title="Timeline">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <CalendarIcon class="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <p class="text-xs text-gray-400">Created</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(category.created_at, 'MMM D, YYYY') }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <ArrowPathIcon class="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <p class="text-xs text-gray-400">Updated</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ timeAgo(category.updated_at) }}</p>
                </div>
              </div>
              <div v-if="category.creator" class="flex items-start gap-3">
                <UserIcon class="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <p class="text-xs text-gray-400">Created By</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ category.creator.name }}</p>
                </div>
              </div>
              <div v-if="category.approved_at" class="flex items-start gap-3">
                <CheckCircleIcon class="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                <div>
                  <p class="text-xs text-gray-400">Approved</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(category.approved_at, 'MMM D, YYYY') }}</p>
                </div>
              </div>
              <div v-if="category.rejection_reason" class="flex items-start gap-3">
                <XCircleIcon class="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                <div>
                  <p class="text-xs text-gray-400">Rejected</p>
                  <p class="text-sm text-red-600 dark:text-red-400">{{ category.rejection_reason }}</p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
    <!-- Template Manager Modal -->
    <CategoryTemplateManager
      v-if="category"
      v-model="showTemplateManager"
      :category-id="category.slug"
      :category-name="category.name"
      @saved="onTemplatesSaved"
    />
  </div>
</template>
