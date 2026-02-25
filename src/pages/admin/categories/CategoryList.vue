<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Category List — Category management list page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useConfirm, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Category } from '@/types'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const confirm = useConfirm()
const toast = useToast()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Categories', [
    { label: 'Categories' },
  ], 'Manage product categories')
  fetchCategories()
})

// Data
const categories = ref<Category[]>([])
const isLoading = ref(true)

// Fetch categories
async function fetchCategories() {
  isLoading.value = true
  try {
    const response = await categoryService.getAll()
    categories.value = response.data
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to load categories'
    toast.error(message)
    console.error('Category API Error:', err)
    categories.value = []
  } finally {
    isLoading.value = false
  }
}

// Navigate to create page
function openCreateModal() {
  router.push('/admin/categories/create')
}

// Navigate to edit page
function openEditModal(category: Category) {
  router.push(`/admin/categories/${category.id}/edit`)
}

// Delete category
async function deleteCategory(category: Category) {
  const confirmed = await confirm.confirm({
    title: 'Delete Category',
    message: `Are you sure you want to delete "${category.name}"? Products in this category will be unassigned.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      await categoryService.delete(category.id)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' {
  return status === 'active' ? 'success' : 'warning'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div></div>
      <BaseButton variant="primary" @click="openCreateModal">
        <PlusIcon class="mr-2 h-4 w-4" />
        Add Category
      </BaseButton>
    </div>

    <!-- Categories list -->
    <BaseCard padding="none">
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>

      <div v-else-if="categories.length === 0">
        <EmptyState
          title="No categories yet"
          description="Create your first category to organize products."
          action-text="Add Category"
          @action="openCreateModal"
        />
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="category in categories"
          :key="category.id"
          class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50">
              <FolderIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ category.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ category.description || 'No description' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ category.product_count || 0 }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Products</p>
            </div>

            <BaseBadge :variant="getStatusVariant(category.status)" class="capitalize">
              {{ category.status }}
            </BaseBadge>

            <div class="flex items-center gap-1">
              <button
                type="button"
                class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                @click="openEditModal(category)"
              >
                <PencilIcon class="h-5 w-5" />
              </button>
              <button
                type="button"
                class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-danger-600 dark:hover:bg-gray-700 dark:hover:text-danger-400"
                @click="deleteCategory(category)"
              >
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
