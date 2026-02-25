// ═══════════════════════════════════════════════════════════════════
// usePagination Composable — Pagination state management
// ═══════════════════════════════════════════════════════════════════

import { computed, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PaginationMeta } from '@/types'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/utils/constants'

interface UsePaginationOptions {
  defaultPageSize?: number
  syncWithUrl?: boolean
}

export function usePagination(options: UsePaginationOptions = {}) {
  const route = useRoute()
  const router = useRouter()

  const { defaultPageSize = DEFAULT_PAGE_SIZE, syncWithUrl = true } = options

  // State
  const currentPage = ref(1)
  const perPage = ref(defaultPageSize)
  const total = ref(0)
  const from = ref<number | null>(null)
  const to = ref<number | null>(null)

  // Computed
  const lastPage = computed(() => Math.ceil(total.value / perPage.value) || 1)
  const hasNextPage = computed(() => currentPage.value < lastPage.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  const pages = computed(() => {
    const range: (number | string)[] = []
    const maxVisible = 5

    if (lastPage.value <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= lastPage.value; i++) {
        range.push(i)
      }
    } else {
      // Show first, last, and middle pages with ellipsis
      const current = currentPage.value
      const half = Math.floor(maxVisible / 2)

      if (current <= half + 1) {
        for (let i = 1; i <= maxVisible; i++) {
          range.push(i)
        }
        range.push('...')
        range.push(lastPage.value)
      } else if (current >= lastPage.value - half) {
        range.push(1)
        range.push('...')
        for (let i = lastPage.value - maxVisible + 1; i <= lastPage.value; i++) {
          range.push(i)
        }
      } else {
        range.push(1)
        range.push('...')
        for (let i = current - half + 1; i <= current + half - 1; i++) {
          range.push(i)
        }
        range.push('...')
        range.push(lastPage.value)
      }
    }

    return range
  })

  // Sync with URL query params
  if (syncWithUrl) {
    // Initialize from URL
    const urlPage = parseInt(route.query.page as string)
    const urlPerPage = parseInt(route.query.per_page as string)

    if (!isNaN(urlPage) && urlPage > 0) {
      currentPage.value = urlPage
    }
    if (!isNaN(urlPerPage) && PAGE_SIZE_OPTIONS.includes(urlPerPage)) {
      perPage.value = urlPerPage
    }

    // Watch for changes and update URL
    watch([currentPage, perPage], ([page, size]) => {
      const query = { ...route.query }

      if (page === 1) {
        delete query.page
      } else {
        query.page = String(page)
      }

      if (size === defaultPageSize) {
        delete query.per_page
      } else {
        query.per_page = String(size)
      }

      router.replace({ query })
    })
  }

  // Methods
  function goToPage(page: number) {
    if (page >= 1 && page <= lastPage.value) {
      currentPage.value = page
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }

  function firstPage() {
    currentPage.value = 1
  }

  function lastPageFn() {
    currentPage.value = lastPage.value
  }

  function setPerPage(size: number) {
    if (PAGE_SIZE_OPTIONS.includes(size)) {
      perPage.value = size
      currentPage.value = 1 // Reset to first page
    }
  }

  function setMeta(meta: PaginationMeta) {
    currentPage.value = meta.current_page
    perPage.value = meta.per_page
    total.value = meta.total
    from.value = meta.from
    to.value = meta.to
  }

  function reset() {
    currentPage.value = 1
    perPage.value = defaultPageSize
    total.value = 0
    from.value = null
    to.value = null
  }

  // Query params for API calls
  const queryParams = computed(() => ({
    page: currentPage.value,
    per_page: perPage.value,
  }))

  // Display text
  const displayText = computed(() => {
    if (total.value === 0) return 'No results'
    if (from.value && to.value) {
      return `Showing ${from.value}-${to.value} of ${total.value}`
    }
    return `Page ${currentPage.value} of ${lastPage.value}`
  })

  return {
    // State
    currentPage,
    perPage,
    total,
    totalItems: total, // alias for backward compatibility
    from,
    to,

    // Computed
    lastPage,
    hasNextPage,
    hasPrevPage,
    pages,
    queryParams,
    displayText,

    // Methods
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    goToLastPage: lastPageFn,
    setPerPage,
    setMeta,
    reset,

    // Constants
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  }
}

/**
 * Create reactive pagination meta ref
 */
export function usePaginationMeta(): Ref<PaginationMeta> {
  return ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: DEFAULT_PAGE_SIZE,
    total: 0,
    from: null,
    to: null,
  })
}
