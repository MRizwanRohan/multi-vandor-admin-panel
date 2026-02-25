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
import { PlusIcon, FunnelIcon } from '@heroicons/vue/24/outline'

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
const statusFilter = ref<'all' | 'active' | 'inactive' | 'pending'>('all')

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

// Status counts
const statusCounts = computed(() => {
  const counts = { all: 0, active: 0, inactive: 0, pending: 0 }
  function walk(cats: Category[]) {
    for (const c of cats) {
      counts.all++
      if (c.is_active) counts.active++
      else counts.inactive++
      if (c.status === 'pending') counts.pending++
      if (c.children?.length) walk(c.children)
    }
  }
  walk(categories.value)
  return counts
})

// Filtered categories (recursive filter)
const filteredCategories = computed(() => {
  if (statusFilter.value === 'all') return categories.value
  return filterTree(categories.value, statusFilter.value)
})

function filterTree(cats: Category[], filter: string): Category[] {
  const result: Category[] = []
  for (const c of cats) {
    const match = filter === 'active' ? c.is_active : filter === 'inactive' ? !c.is_active : c.status === filter
    const filteredChildren = c.children?.length ? filterTree(c.children, filter) : []
    if (match || filteredChildren.length > 0) {
      result.push({ ...c, children: filteredChildren })
    }
  }
  return result
}

const filteredCount = computed(() => {
  function count(cats: Category[]): number {
    return cats.reduce((sum, c) => sum + 1 + count(c.children || []), 0)
  }
  return count(filteredCategories.value)
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

function openDetail(category: Category) {
  router.push(`/admin/categories/${category.id}`)
}

// Toggle active — use API response for accurate state
async function toggleActive(category: Category) {
  try {
    const updated = await categoryService.toggleActive(category.id)
    // Replace category in-place in the tree with server response
    replaceCategoryInTree(categories.value, category.id, updated)
    toast.success(`Category "${updated.name}" ${updated.is_active ? 'activated' : 'deactivated'}`)
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to toggle category status')
  }
}

// Replace a single category node in the tree with updated data (keeps children intact)
function replaceCategoryInTree(cats: Category[], id: number, updated: Category) {
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].id === id) {
      // Keep existing children if the API response doesn't include them
      cats[i] = { ...updated, children: updated.children?.length ? updated.children : cats[i].children }
      return true
    }
    if (cats[i].children?.length && replaceCategoryInTree(cats[i].children, id, updated)) {
      return true
    }
  }
  return false
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
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ statusFilter === 'all' ? totalCount : `${filteredCount} / ${totalCount}` }} categories
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
      <div class="flex items-center gap-3">
        <!-- Status filter -->
        <div class="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">
          <button
            v-for="f in (['all', 'active', 'inactive'] as const)"
            :key="f"
            type="button"
            class="px-3 py-1.5 font-medium capitalize transition-colors first:rounded-l-lg last:rounded-r-lg"
            :class="statusFilter === f
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="statusFilter = f"
          >
            {{ f }}
            <span
              class="ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
              :class="statusFilter === f
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
            >
              {{ statusCounts[f] }}
            </span>
          </button>
        </div>
        <BaseButton variant="primary" @click="openCreate">
          <PlusIcon class="mr-2 h-4 w-4" />
          Add Category
        </BaseButton>
      </div>
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

      <div v-else-if="filteredCategories.length === 0" class="py-12 text-center">
        <FunnelIcon class="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No {{ statusFilter }} categories found</p>
        <button type="button" class="mt-1 text-xs text-primary-600 hover:text-primary-700" @click="statusFilter = 'all'">Show all</button>
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <CategoryTreeRow
          v-for="category in filteredCategories"
          :key="category.id"
          :category="category"
          :depth="0"
          :expanded-ids="expandedIds"
          @toggle="toggleExpand"
          @edit="openEdit"
          @delete="deleteCategory"
          @toggle-active="toggleActive"
        />
      </div>
    </BaseCard>
  </div>
</template>
