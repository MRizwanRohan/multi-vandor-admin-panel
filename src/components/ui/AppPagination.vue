<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Pagination — Standalone pagination component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface Props {
  currentPage: number
  totalPages: number
  totalItems?: number
  perPage?: number
  maxVisible?: number
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 15,
  maxVisible: 5,
  showInfo: true,
})

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

// Calculate visible page numbers
const visiblePages = computed(() => {
  const pages: (number | '...')[] = []
  const total = props.totalPages
  const current = props.currentPage
  const max = props.maxVisible

  if (total <= max + 2) {
    // Show all pages
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  // Always show first page
  pages.push(1)

  // Calculate range around current page
  const halfMax = Math.floor(max / 2)
  let start = Math.max(2, current - halfMax)
  let end = Math.min(total - 1, current + halfMax)

  // Adjust if near start
  if (current <= halfMax + 1) {
    end = max
  }
  // Adjust if near end
  if (current >= total - halfMax) {
    start = total - max + 1
  }

  // Add ellipsis before range if needed
  if (start > 2) pages.push('...')

  // Add range
  for (let i = start; i <= end; i++) pages.push(i)

  // Add ellipsis after range if needed
  if (end < total - 1) pages.push('...')

  // Always show last page
  pages.push(total)

  return pages
})

// Items info
const itemsFrom = computed(() =>
  props.totalItems ? (props.currentPage - 1) * props.perPage + 1 : 0
)
const itemsTo = computed(() =>
  props.totalItems
    ? Math.min(props.currentPage * props.perPage, props.totalItems)
    : 0
)

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}

const hasPrev = computed(() => props.currentPage > 1)
const hasNext = computed(() => props.currentPage < props.totalPages)

// Button styles
const baseBtn =
  'inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'

const activeBtn =
  'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500'

const inactiveBtn =
  'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'

const disabledBtn =
  'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
</script>

<template>
  <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
    <!-- Info -->
    <p
      v-if="showInfo && totalItems"
      class="text-sm text-gray-600 dark:text-gray-400"
    >
      Showing
      <span class="font-medium text-gray-900 dark:text-white">{{ itemsFrom }}</span>
      to
      <span class="font-medium text-gray-900 dark:text-white">{{ itemsTo }}</span>
      of
      <span class="font-medium text-gray-900 dark:text-white">{{ totalItems }}</span>
      results
    </p>

    <!-- Page buttons -->
    <nav class="flex items-center gap-1" aria-label="Pagination">
      <!-- Previous -->
      <button
        type="button"
        :class="[baseBtn, 'px-2', hasPrev ? inactiveBtn : disabledBtn]"
        :disabled="!hasPrev"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeftIcon class="h-4 w-4" />
      </button>

      <!-- Page numbers -->
      <template v-for="(page, index) in visiblePages" :key="index">
        <span
          v-if="page === '...'"
          class="inline-flex h-9 min-w-[36px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
        >
          …
        </span>
        <button
          v-else
          type="button"
          :class="[baseBtn, page === currentPage ? activeBtn : inactiveBtn]"
          @click="goToPage(page as number)"
        >
          {{ page }}
        </button>
      </template>

      <!-- Next -->
      <button
        type="button"
        :class="[baseBtn, 'px-2', hasNext ? inactiveBtn : disabledBtn]"
        :disabled="!hasNext"
        @click="goToPage(currentPage + 1)"
      >
        <ChevronRightIcon class="h-4 w-4" />
      </button>
    </nav>
  </div>
</template>
