// ═══════════════════════════════════════════════════════════════════
// Breadcrumb Store — Navigation breadcrumbs
// ═══════════════════════════════════════════════════════════════════

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

export const useBreadcrumbStore = defineStore('breadcrumb', () => {
  // State
  const items = ref<BreadcrumbItem[]>([])
  const pageTitle = ref<string>('')
  const pageDescription = ref<string>('')

  // Getters
  const hasItems = computed(() => items.value.length > 0)

  // Actions
  function setItems(newItems: BreadcrumbItem[]): void {
    items.value = newItems
  }

  function setPageTitle(title: string, description?: string): void {
    pageTitle.value = title
    pageDescription.value = description || ''
  }

  function setPageInfo(
    title: string,
    breadcrumbs: BreadcrumbItem[],
    description?: string
  ): void {
    pageTitle.value = title
    pageDescription.value = description || ''
    items.value = breadcrumbs
  }

  function clear(): void {
    items.value = []
    pageTitle.value = ''
    pageDescription.value = ''
  }

  return {
    // State
    items,
    pageTitle,
    pageDescription,

    // Getters
    hasItems,

    // Actions
    setItems,
    setPageTitle,
    setPageInfo,
    clear,
  }
})
