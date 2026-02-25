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
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'

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
const statusFilter = ref<'all' | 'active' | 'inactive' | 'pending' | 'rejected'>('all')
const searchQuery = ref('')
const showSearch = ref(false)

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
  const counts = { all: 0, active: 0, inactive: 0, pending: 0, rejected: 0 }
  function walk(cats: Category[]) {
    for (const c of cats) {
      counts.all++
      if (c.status === 'pending') counts.pending++
      else if (c.status === 'rejected') counts.rejected++
      else if (c.is_active) counts.active++
      else counts.inactive++
      if (c.children?.length) walk(c.children)
    }
  }
  walk(categories.value)
  return counts
})

// Filtered categories (recursive filter by status + search)
const filteredCategories = computed(() => {
  let tree = categories.value
  if (statusFilter.value !== 'all') {
    tree = filterTreeByStatus(tree, statusFilter.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    tree = filterTreeBySearch(tree, q)
  }
  return tree
})

function filterTreeByStatus(cats: Category[], filter: string): Category[] {
  const result: Category[] = []
  for (const c of cats) {
    const match = filter === 'active'
      ? (c.is_active && c.status !== 'pending' && c.status !== 'rejected')
      : filter === 'inactive'
        ? (!c.is_active && c.status !== 'pending' && c.status !== 'rejected')
        : c.status === filter
    const filteredChildren = c.children?.length ? filterTreeByStatus(c.children, filter) : []
    if (match || filteredChildren.length > 0) {
      result.push({ ...c, children: filteredChildren })
    }
  }
  return result
}

function filterTreeBySearch(cats: Category[], query: string): Category[] {
  const result: Category[] = []
  for (const c of cats) {
    const nameMatch = c.name.toLowerCase().includes(query)
    const slugMatch = c.slug?.toLowerCase().includes(query)
    const descMatch = c.description?.toLowerCase().includes(query)
    const filteredChildren = c.children?.length ? filterTreeBySearch(c.children, query) : []
    if (nameMatch || slugMatch || descMatch || filteredChildren.length > 0) {
      result.push({ ...c, children: filteredChildren })
    }
  }
  return result
}

// Auto-expand tree when searching
function onSearchInput() {
  if (searchQuery.value.trim()) {
    expandAll()
  }
}

function clearSearch() {
  searchQuery.value = ''
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
  router.push(`/admin/categories/${category.slug}/edit`)
}

function openDetail(category: Category) {
  router.push(`/admin/categories/${category.slug}`)
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
    <div class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ (statusFilter === 'all' && !searchQuery) ? totalCount : `${filteredCount} / ${totalCount}` }} categories
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
          <!-- Search toggle -->
          <button
            type="button"
            class="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            :class="showSearch ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400' : ''"
            title="Search categories"
            @click="showSearch = !showSearch; if (!showSearch) clearSearch()"
          >
            <MagnifyingGlassIcon class="h-4 w-4" />
          </button>
          <BaseButton variant="primary" @click="openCreate">
            <PlusIcon class="mr-2 h-4 w-4" />
          Add Category
        </BaseButton>
      </div>
    </div>

      <!-- Search bar (collapsible) -->
      <div v-if="showSearch" class="flex items-center gap-2">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, slug, or description..."
            class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            @input="onSearchInput"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="clearSearch"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Status filter tabs -->
      <div class="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs w-fit">
        <button
          v-for="f in (['all', 'active', 'inactive', 'pending', 'rejected'] as const)"
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
            v-if="statusCounts[f] > 0 || f === 'all'"
            class="ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
            :class="statusFilter === f
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300'
              : f === 'pending' && statusCounts.pending > 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
          >
            {{ statusCounts[f] }}
          </span>
        </button>
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
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ searchQuery ? `No categories matching "${searchQuery}"` : `No ${statusFilter} categories found` }}
        </p>
        <div class="mt-2 flex items-center justify-center gap-2">
          <button v-if="searchQuery" type="button" class="text-xs text-primary-600 hover:text-primary-700" @click="clearSearch">Clear search</button>
          <span v-if="searchQuery && statusFilter !== 'all'" class="text-gray-300 dark:text-gray-600">|</span>
          <button v-if="statusFilter !== 'all'" type="button" class="text-xs text-primary-600 hover:text-primary-700" @click="statusFilter = 'all'">Show all</button>
        </div>
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
