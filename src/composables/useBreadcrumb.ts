// ═══════════════════════════════════════════════════════════════════
// useBreadcrumb — Breadcrumb management composable
// ═══════════════════════════════════════════════════════════════════

import { computed, onMounted, onUnmounted } from 'vue'
import { useBreadcrumbStore, type BreadcrumbItem } from '@/stores/breadcrumb.store'

export interface UseBreadcrumbOptions {
  title: string
  items: BreadcrumbItem[]
  description?: string
  clearOnUnmount?: boolean
}

/**
 * Composable for managing page breadcrumbs
 *
 * @param options - Optional configuration for initial breadcrumb setup
 * @returns Breadcrumb state and methods
 *
 * @example
 * // Basic usage in a page component
 * const { setPageInfo } = useBreadcrumb()
 * onMounted(() => {
 *   setPageInfo('Product List', [{ label: 'Products' }], 'Manage your products')
 * })
 *
 * @example
 * // Auto-setup with options
 * useBreadcrumb({
 *   title: 'Product List',
 *   items: [{ label: 'Products' }],
 *   description: 'Manage your products',
 *   clearOnUnmount: true,
 * })
 */
export function useBreadcrumb(options?: UseBreadcrumbOptions) {
  const store = useBreadcrumbStore()

  // Computed state
  const items = computed(() => store.items)
  const pageTitle = computed(() => store.pageTitle)
  const pageDescription = computed(() => store.pageDescription)
  const hasItems = computed(() => store.hasItems)

  /**
   * Set breadcrumb items
   */
  function setItems(newItems: BreadcrumbItem[]) {
    store.setItems(newItems)
  }

  /**
   * Set page title and optional description
   */
  function setPageTitle(title: string, description?: string) {
    store.setPageTitle(title, description)
  }

  /**
   * Set page info (title, breadcrumbs, description) in one call
   */
  function setPageInfo(title: string, breadcrumbs: BreadcrumbItem[], description?: string) {
    store.setPageInfo(title, breadcrumbs, description)
  }

  /**
   * Add a breadcrumb item to the end
   */
  function addItem(item: BreadcrumbItem) {
    store.setItems([...store.items, item])
  }

  /**
   * Remove the last breadcrumb item
   */
  function popItem() {
    if (store.items.length > 0) {
      store.setItems(store.items.slice(0, -1))
    }
  }

  /**
   * Clear all breadcrumbs
   */
  function clear() {
    store.clear()
  }

  // Auto-setup if options provided
  if (options) {
    onMounted(() => {
      setPageInfo(options.title, options.items, options.description)
    })

    if (options.clearOnUnmount !== false) {
      onUnmounted(() => {
        clear()
      })
    }
  }

  return {
    // State (readonly)
    items,
    pageTitle,
    pageDescription,
    hasItems,

    // Actions
    setItems,
    setPageTitle,
    setPageInfo,
    addItem,
    popItem,
    clear,
  }
}

/**
 * Quick helper to set breadcrumbs in onMounted
 *
 * @example
 * usePageBreadcrumb('Products', [{ label: 'Products' }], 'Manage products')
 */
export function usePageBreadcrumb(
  title: string,
  items: BreadcrumbItem[],
  description?: string
) {
  return useBreadcrumb({
    title,
    items,
    description,
    clearOnUnmount: true,
  })
}
