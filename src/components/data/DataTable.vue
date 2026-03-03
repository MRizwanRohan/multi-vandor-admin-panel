<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Data Table — Reusable table component with sorting and pagination -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { PaginationMeta } from '@/types'
import EmptyState from '@/components/ui/EmptyState.vue'

interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface Props {
  columns: Column[]
  data: T[]
  loading?: boolean
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  selectable?: boolean
  selected?: T[]
  rowKey?: string
  pagination?: PaginationMeta | null
  emptyTitle?: string
  emptyDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [] as T[],
  loading: false,
  sortDirection: 'asc',
  selectable: false,
  selected: () => [],
  rowKey: 'id',
  emptyTitle: 'No data found',
  emptyDescription: 'There are no items to display.',
})

const emit = defineEmits<{
  (e: 'sort', key: string): void
  (e: 'select', items: T[]): void
  (e: 'row-click', item: T): void
  (e: 'page-change', page: number): void
}>()

// Get row key value safely
function getRowKey(item: T): unknown {
  return item[props.rowKey]
}

// Check if all rows are selected
const allSelected = computed(() => {
  if (props.data.length === 0) return false
  return props.data.every((item) =>
    props.selected.some((s) => getRowKey(s) === getRowKey(item))
  )
})

// Check if some rows are selected
const someSelected = computed(() => {
  return (
    props.selected.length > 0 &&
    props.selected.length < props.data.length
  )
})

// Toggle all selection
function toggleAll() {
  if (allSelected.value) {
    emit('select', [])
  } else {
    emit('select', [...props.data])
  }
}

// Toggle single row selection
function toggleRow(item: T) {
  const isSelected = props.selected.some(
    (s) => getRowKey(s) === getRowKey(item)
  )
  if (isSelected) {
    emit(
      'select',
      props.selected.filter((s) => getRowKey(s) !== getRowKey(item))
    )
  } else {
    emit('select', [...props.selected, item])
  }
}

// Check if row is selected
function isRowSelected(item: T): boolean {
  return props.selected.some((s) => getRowKey(s) === getRowKey(item))
}

// Handle sort click
function handleSort(column: Column) {
  if (column.sortable) {
    emit('sort', column.key)
  }
}

// Get alignment class
function getAlignClass(align?: string): string {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Header -->
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <!-- Selection checkbox -->
            <th
              v-if="selectable"
              scope="col"
              class="w-12 px-4 py-3"
            >
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                @change="toggleAll"
              />
            </th>

            <!-- Column headers -->
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="[
                'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                getAlignClass(column.align),
                column.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : '',
              ]"
              :style="column.width ? { width: column.width } : {}"
              @click="handleSort(column)"
            >
              <div
                class="flex items-center gap-1"
                :class="{
                  'justify-center': column.align === 'center',
                  'justify-end': column.align === 'right',
                }"
              >
                {{ column.label }}
                <span
                  v-if="column.sortable"
                  class="ml-1"
                >
                  <ChevronUpIcon
                    v-if="sortKey === column.key && sortDirection === 'asc'"
                    class="h-4 w-4"
                  />
                  <ChevronDownIcon
                    v-else-if="sortKey === column.key && sortDirection === 'desc'"
                    class="h-4 w-4"
                  />
                  <span
                    v-else
                    class="h-4 w-4 opacity-0 group-hover:opacity-50"
                  >
                    <ChevronUpIcon class="h-4 w-4" />
                  </span>
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <!-- Loading state -->
          <tr v-if="loading">
            <td
              :colspan="selectable ? columns.length + 1 : columns.length"
              class="px-4 py-12 text-center"
            >
              <div class="flex items-center justify-center">
                <svg
                  class="h-8 w-8 animate-spin text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-else-if="data.length === 0">
            <td
              :colspan="selectable ? columns.length + 1 : columns.length"
              class="px-4 py-12"
            >
              <slot name="empty">
                <EmptyState
                  :title="emptyTitle"
                  :description="emptyDescription"
                />
              </slot>
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-else
            v-for="item in data"
            :key="String(getRowKey(item))"
            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
            :class="{ 'bg-primary-50/50 dark:bg-primary-900/20': isRowSelected(item) }"
            @click="emit('row-click', item)"
          >
            <!-- Selection checkbox -->
            <td
              v-if="selectable"
              class="w-12 px-4 py-4"
              @click.stop
            >
              <input
                type="checkbox"
                :checked="isRowSelected(item)"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                @change="toggleRow(item)"
              />
            </td>

            <!-- Cell content -->
            <td
              v-for="column in columns"
              :key="column.key"
              class="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-gray-100"
              :class="getAlignClass(column.align)"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :row="item"
                :value="item[column.key]"
              >
                {{ item[column.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.last_page > 1"
      class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} results
      </div>

      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          :disabled="pagination.current_page === 1"
          @click="emit('page-change', pagination.current_page - 1)"
        >
          Previous
        </button>

        <span class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ pagination.current_page }} of {{ pagination.last_page }}
        </span>

        <button
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          :disabled="pagination.current_page === pagination.last_page"
          @click="emit('page-change', pagination.current_page + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
