<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Category Detail — Vendor: view category details                   -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Category, CategoryTemplateAssignment } from '@/types'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  FolderIcon,
  TagIcon,
  CubeIcon,
  UserGroupIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, timeAgo } = useDate()

const categoryId = computed(() => Number(route.params.id))
const category = ref<Category | null>(null)
const templates = ref<CategoryTemplateAssignment[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)

onMounted(() => fetchData())

async function fetchData() {
  isLoading.value = true
  loadError.value = null
  try {
    const cat = await categoryService.getVendorCategoryDetail(categoryId.value)
    category.value = cat

    breadcrumbStore.setPageInfo(cat.name, [
      { label: 'Categories', to: '/vendor/categories' },
      { label: cat.name },
    ])

    // Fetch attribute templates for this category
    try {
      templates.value = await categoryService.getVendorCategoryTemplates(categoryId.value)
    } catch {
      templates.value = []
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to load category'
    loadError.value = msg
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

// Status badge variant
function statusVariant(s: string): 'success' | 'warning' | 'danger' | 'info' {
  return {
    active: 'success' as const,
    pending: 'warning' as const,
    rejected: 'danger' as const,
    inactive: 'info' as const,
  }[s] ?? 'info'
}

// Can edit: only own pending categories
const canEdit = computed(() => category.value?.status === 'pending')
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
          <BaseButton variant="primary" @click="router.push('/vendor/categories')">
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
          <BaseButton variant="ghost" size="sm" @click="router.push('/vendor/categories')">
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
          </div>
        </div>
        <BaseButton
          v-if="canEdit"
          variant="primary"
          size="sm"
          @click="router.push(`/vendor/categories/${category.id}/edit`)"
        >
          <PencilSquareIcon class="mr-1.5 h-4 w-4" />
          Edit
        </BaseButton>
      </div>

      <!-- Main content -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Overview stats -->
          <BaseCard>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </BaseCard>

          <!-- Description -->
          <BaseCard v-if="category.description" title="Description">
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ category.description }}
            </p>
          </BaseCard>

          <!-- Children -->
          <BaseCard v-if="category.children?.length" title="Sub-categories">
            <div class="divide-y divide-gray-100 dark:divide-gray-700 -mt-1">
              <div
                v-for="child in category.children"
                :key="child.id"
                class="flex items-center justify-between py-3 first:pt-0"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                    <TagIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white">{{ child.name }}</p>
                    <p v-if="child.description" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {{ child.description }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0 ml-4">
                  <span class="text-sm text-gray-500">{{ child.product_count || 0 }} products</span>
                  <BaseBadge :variant="statusVariant(child.status)" dot rounded size="sm">
                    {{ child.status }}
                  </BaseBadge>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Attribute Templates -->
          <BaseCard v-if="templates.length" title="Attribute Templates">
            <p class="text-xs text-gray-400 mb-3">
              Products in this category should provide these attributes.
            </p>
            <div class="divide-y divide-gray-100 dark:divide-gray-700">
              <div
                v-for="tmpl in templates"
                :key="tmpl.attribute_template_id"
                class="flex items-center justify-between py-3 first:pt-0"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <DocumentTextIcon class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      Template #{{ tmpl.attribute_template_id }}
                    </p>
                    <p class="text-xs text-gray-500">Order: {{ tmpl.display_order }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="tmpl.is_required_override"
                    class="text-xs text-amber-600 dark:text-amber-400 font-medium"
                  >
                    Required
                  </span>
                  <span
                    v-if="tmpl.inheritance_mode"
                    class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  >
                    {{ tmpl.inheritance_mode }}
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Right column: sidebar -->
        <div class="space-y-6">
          <!-- Image -->
          <BaseCard v-if="category.image || category.image_field">
            <img
              :src="category.image || category.image_field || ''"
              :alt="category.name"
              class="w-full rounded-lg object-cover aspect-video"
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
                <span class="text-sm text-primary-600 dark:text-primary-400">{{ category.parent.name }}</span>
              </div>
              <div v-else-if="category.parent_id" class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Parent</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">ID: {{ category.parent_id }}</span>
              </div>
            </div>
          </BaseCard>

          <!-- SEO -->
          <BaseCard
            v-if="category.seo_title || category.seo_description || category.keywords?.length"
            title="SEO"
          >
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

          <!-- Timeline -->
          <BaseCard title="Timeline">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <CalendarIcon class="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <p class="text-xs text-gray-400">Created</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    {{ formatDate(category.created_at, 'MMM D, YYYY') }}
                  </p>
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
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    {{ formatDate(category.approved_at, 'MMM D, YYYY') }}
                    <span v-if="category.approver" class="text-gray-500">
                      by {{ category.approver.name }}
                    </span>
                  </p>
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
  </div>
</template>
