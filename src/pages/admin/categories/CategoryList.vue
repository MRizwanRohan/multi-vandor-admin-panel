<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Category List — Tree-based category management -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useConfirm, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import CategoryTreeRow from './CategoryTreeRow.vue'
import type { Category } from '@/types'
import { PlusIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const confirm = useConfirm()
const toast = useToast()

onMounted(() => {
  breadcrumbStore.setPageInfo('Categories', [
    { label: 'Categories' },
  ], 'Manage product categories')
  fetchCategories()
})

// Data
const categories = ref<Category[]>([])
const isLoading = ref(true)
const expandedIds = ref<Set<number>>(new Set())

// Fetch categories
async function fetchCategories() {
  isLoading.value = true
  try {
    const response = await categoryService.getAll()
    categories.value = response.data
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to load categories'
    toast.error(message)
    categories.value = []
  } finally {
    isLoading.value = false
  }
}

// Total count (flat)
const totalCount = computed(() => {
  function count(cats: Category[]): number {
    return cats.reduce((sum, c) => sum + 1 + count(c.children || []), 0)
  }
  return count(categories.value)
})

// Toggle expand
function toggleExpand(id: number) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedIds.value = next
}

// Expand all / collapse all
function expandAll() {
  const ids = new Set<number>()
  function collect(cats: Category[]) {
    for (const c of cats) {
      if (c.children && c.children.length > 0) {
        ids.add(c.id)
        collect(c.children)
      }
    }
  }
  collect(categories.value)
  expandedIds.value = ids
}

function collapseAll() {
  expandedIds.value = new Set()
}

// Navigate
function openCreate() {
  router.push('/admin/categories/create')
}

function openEdit(category: Category) {
  router.push(`/admin/categories/${category.id}/edit`)
}

// Delete
async function deleteCategory(category: Category) {
  if (!category.can_be_deleted) {
    toast.error('This category has children and cannot be deleted.')
    return
  }

  const confirmed = await confirm.confirm({
    title: 'Delete Category',
    message: `Are you sure you want to delete "${category.name}"?`,
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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ totalCount }} categories
        </span>
        <template v-if="categories.length > 0">
          <button
            type="button"
            class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            @click="expandAll"
          >
            Expand All
          </button>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button
            type="button"
            class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            @click="collapseAll"
          >
            Collapse All
          </button>
        </template>
      </div>
      <BaseButton variant="primary" @click="openCreate">
        <PlusIcon class="mr-2 h-4 w-4" />
        Add Category
      </BaseButton>
    </div>

    <!-- Categories tree -->
    <BaseCard padding="none">
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>

      <div v-else-if="categories.length === 0">
        <EmptyState
          title="No categories yet"
          description="Create your first category to organize products."
          action-text="Add Category"
          @action="openCreate"
        />
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <CategoryTreeRow
          v-for="category in categories"
          :key="category.id"
          :category="category"
          :depth="0"
          :expanded-ids="expandedIds"
          @toggle="toggleExpand"
          @edit="openEdit"
          @delete="deleteCategory"
        />
      </div>
    </BaseCard>
  </div>
</template>
