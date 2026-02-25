<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Category Tree View — Hierarchical category browser/selector -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CategoryTreeNode } from '@/types'
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

interface Props {
  categories: CategoryTreeNode[]
  selectedId?: number | null
  selectable?: boolean
  expandAll?: boolean
  showCounts?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  selectable: true,
  expandAll: false,
  showCounts: true,
  maxHeight: '400px'
})

const emit = defineEmits<{
  (e: 'select', category: CategoryTreeNode): void
  (e: 'update:selectedId', id: number | null): void
}>()

// Track expanded nodes
const expandedNodes = ref<Set<number>>(new Set())

// Initialize expanded state
watch(
  () => props.expandAll,
  (expand) => {
    if (expand) {
      const getAllIds = (nodes: CategoryTreeNode[]): number[] => {
        return nodes.flatMap(n => [n.id, ...getAllIds(n.children || [])])
      }
      expandedNodes.value = new Set(getAllIds(props.categories))
    } else {
      expandedNodes.value = new Set()
    }
  },
  { immediate: true }
)

// Auto-expand to selected item
watch(
  () => props.selectedId,
  (selectedId) => {
    if (selectedId) {
      const findPath = (nodes: CategoryTreeNode[], path: number[] = []): number[] | null => {
        for (const node of nodes) {
          if (node.id === selectedId) return path
          if (node.children?.length) {
            const result = findPath(node.children, [...path, node.id])
            if (result) return result
          }
        }
        return null
      }
      const path = findPath(props.categories)
      if (path) {
        path.forEach(id => expandedNodes.value.add(id))
      }
    }
  },
  { immediate: true }
)

// Toggle node expansion
const toggleExpand = (id: number, event: Event) => {
  event.stopPropagation()
  if (expandedNodes.value.has(id)) {
    expandedNodes.value.delete(id)
  } else {
    expandedNodes.value.add(id)
  }
}

// Select node
const selectNode = (category: CategoryTreeNode) => {
  if (!props.selectable) return
  emit('select', category)
  emit('update:selectedId', category.id)
}

// Check if node is expanded
const isExpanded = (id: number) => expandedNodes.value.has(id)

// Check if node is selected
const isSelected = (id: number) => props.selectedId === id

// Get status badge variant
const getStatusClass = (status: string) => {
  const classes = {
    active: 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    pending: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300',
    rejected: 'bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300'
  }
  return classes[status as keyof typeof classes] || classes.inactive
}
</script>

<template>
  <div
    class="overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    :style="{ maxHeight }"
  >
    <!-- Tree -->
    <ul class="p-2">
      <template v-for="category in categories" :key="category.id">
        <li>
          <!-- Category Item -->
          <div
            :class="[
              'group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
              selectable ? 'cursor-pointer' : '',
              isSelected(category.id)
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/50 dark:text-primary-100'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
            @click="selectNode(category)"
          >
            <!-- Expand/Collapse Button -->
            <button
              v-if="category.children?.length"
              type="button"
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              @click="toggleExpand(category.id, $event)"
            >
              <ChevronDownIcon
                v-if="isExpanded(category.id)"
                class="h-4 w-4 text-gray-500"
              />
              <ChevronRightIcon v-else class="h-4 w-4 text-gray-500" />
            </button>
            <span v-else class="w-5" />

            <!-- Folder Icon -->
            <FolderOpenIcon
              v-if="isExpanded(category.id) && category.children?.length"
              class="h-5 w-5 shrink-0 text-primary-500"
            />
            <FolderIcon v-else class="h-5 w-5 shrink-0 text-gray-400" />

            <!-- Name -->
            <span
              :class="[
                'flex-1 truncate text-sm',
                isSelected(category.id)
                  ? 'font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              ]"
            >
              {{ category.name }}
            </span>

            <!-- Product Count -->
            <span
              v-if="showCounts && category.product_count !== undefined"
              class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              {{ category.product_count }}
            </span>

            <!-- Status -->
            <span
              v-if="category.status && category.status !== 'active'"
              :class="[
                'rounded-full px-2 py-0.5 text-xs',
                getStatusClass(category.status)
              ]"
            >
              {{ category.status }}
            </span>

            <!-- Selected Check -->
            <CheckIcon
              v-if="isSelected(category.id)"
              class="h-5 w-5 shrink-0 text-primary-500"
            />
          </div>

          <!-- Children (Recursive) -->
          <ul
            v-if="category.children?.length && isExpanded(category.id)"
            class="ml-6 border-l border-gray-200 pl-2 dark:border-gray-700"
          >
            <CategoryTreeView
              :categories="category.children"
              :selected-id="selectedId"
              :selectable="selectable"
              :show-counts="showCounts"
              max-height="none"
              @select="emit('select', $event)"
              @update:selected-id="emit('update:selectedId', $event)"
            />
          </ul>
        </li>
      </template>
    </ul>

    <!-- Empty State -->
    <div
      v-if="categories.length === 0"
      class="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      <FolderIcon class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
      <p class="mt-2">No categories available</p>
    </div>
  </div>
</template>
