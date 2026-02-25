// ═══════════════════════════════════════════════════════════════════
// useTable Composable — Table sorting, filtering, and search
// ═══════════════════════════════════════════════════════════════════

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { SortDirection, SortState, QueryParams } from '@/types'
import { usePagination } from './usePagination'
import { debounce } from '@/utils/helpers'
import { DEBOUNCE_DELAY } from '@/utils/constants'

interface UseTableOptions {
  defaultSort?: string
  defaultOrder?: SortDirection
  syncWithUrl?: boolean
  searchDelay?: number
}

export function useTable<TFilters extends Record<string, unknown> = Record<string, never>>(
  options: UseTableOptions = {}
) {
  const route = useRoute()
  const router = useRouter()

  const {
    defaultSort = '',
    defaultOrder = null,
    syncWithUrl = true,
    searchDelay = DEBOUNCE_DELAY,
  } = options

  // Pagination
  const pagination = usePagination({ syncWithUrl })

  // Search
  const search = ref('')
  const debouncedSearch = ref('')

  // Sorting
  const sortState = ref<SortState>({
    column: defaultSort || null,
    direction: defaultOrder,
  })

  // Filters
  const filters = ref<TFilters>({} as TFilters)

  // Selection
  const selectedRows = ref<unknown[]>([])
  const selectAll = ref(false)

  // Initialize from URL
  if (syncWithUrl) {
    const urlSearch = route.query.search as string
    const urlSort = route.query.sort as string
    const urlOrder = route.query.order as SortDirection

    if (urlSearch) {
      search.value = urlSearch
      debouncedSearch.value = urlSearch
    }
    if (urlSort) {
      sortState.value.column = urlSort
      sortState.value.direction = urlOrder || 'asc'
    }

    // Parse filters from URL
    Object.keys(route.query).forEach((key) => {
      if (!['page', 'per_page', 'search', 'sort', 'order'].includes(key)) {
        (filters.value as Record<string, unknown>)[key] = route.query[key]
      }
    })
  }

  // Debounced search
  const updateDebouncedSearch = debounce((value: string) => {
    debouncedSearch.value = value
    pagination.currentPage.value = 1 // Reset to first page on search
  }, searchDelay)

  watch(search, (value) => {
    updateDebouncedSearch(value)
  })

  // Sync with URL
  watch(
    [debouncedSearch, sortState, filters],
    () => {
      if (!syncWithUrl) return

      const query: Record<string, string> = {}

      // Pagination
      if (pagination.currentPage.value > 1) {
        query.page = String(pagination.currentPage.value)
      }
      if (pagination.perPage.value !== 15) {
        query.per_page = String(pagination.perPage.value)
      }

      // Search
      if (debouncedSearch.value) {
        query.search = debouncedSearch.value
      }

      // Sort
      if (sortState.value.column && sortState.value.direction) {
        query.sort = sortState.value.column
        query.order = sortState.value.direction
      }

      // Filters
      Object.entries(filters.value as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query[key] = String(value)
        }
      })

      router.replace({ query })
    },
    { deep: true }
  )

  // Methods
  function sortBy(column: string) {
    if (sortState.value.column === column) {
      // Toggle direction or clear
      if (sortState.value.direction === 'asc') {
        sortState.value.direction = 'desc'
      } else if (sortState.value.direction === 'desc') {
        sortState.value.column = null
        sortState.value.direction = null
      }
    } else {
      // New column, start with asc
      sortState.value.column = column
      sortState.value.direction = 'asc'
    }
    pagination.currentPage.value = 1
  }

  function getSortDirection(column: string): SortDirection {
    if (sortState.value.column === column) {
      return sortState.value.direction
    }
    return null
  }

  function setFilter<K extends keyof TFilters>(key: K, value: TFilters[K]) {
    (filters.value as Record<string, unknown>)[key as string] = value
    pagination.currentPage.value = 1
  }

  function clearFilter<K extends keyof TFilters>(key: K) {
    delete (filters.value as Record<string, unknown>)[key as string]
    pagination.currentPage.value = 1
  }

  function clearAllFilters() {
    filters.value = {} as TFilters
    search.value = ''
    debouncedSearch.value = ''
    pagination.currentPage.value = 1
  }

  function resetTable() {
    clearAllFilters()
    sortState.value = {
      column: defaultSort || null,
      direction: defaultOrder,
    }
    pagination.reset()
    selectedRows.value = []
    selectAll.value = false
  }

  function toggleRowSelection(row: unknown) {
    const index = selectedRows.value.indexOf(row)
    if (index === -1) {
      selectedRows.value.push(row)
    } else {
      selectedRows.value.splice(index, 1)
    }
  }

  function isRowSelected(row: unknown): boolean {
    return selectedRows.value.includes(row)
  }

  function selectAllRows(rows: unknown[]) {
    if (selectAll.value) {
      selectedRows.value = []
      selectAll.value = false
    } else {
      selectedRows.value = [...rows]
      selectAll.value = true
    }
  }

  function clearSelection() {
    selectedRows.value = []
    selectAll.value = false
  }

  // Query params for API calls
  const queryParams = computed<QueryParams>(() => {
    const params: QueryParams = {
      ...pagination.queryParams.value,
    }

    if (debouncedSearch.value) {
      params.search = debouncedSearch.value
    }

    if (sortState.value.column && sortState.value.direction) {
      params.sort = sortState.value.column
      params.order = sortState.value.direction
    }

    // Add filters
    Object.entries(filters.value as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value as string | number | boolean
      }
    })

    return params
  })

  const hasActiveFilters = computed(() => {
    return (
      debouncedSearch.value !== '' ||
      Object.values(filters.value as Record<string, unknown>).some(
        (v) => v !== undefined && v !== null && v !== ''
      )
    )
  })

  return {
    // Pagination
    pagination,

    // Search
    search,
    debouncedSearch,

    // Sorting
    sortState,
    sortBy,
    getSortDirection,

    // Filters
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,

    // Selection
    selectedRows,
    selectAll,
    toggleRowSelection,
    isRowSelected,
    selectAllRows,
    clearSelection,

    // Query
    queryParams,

    // Reset
    resetTable,
  }
}
