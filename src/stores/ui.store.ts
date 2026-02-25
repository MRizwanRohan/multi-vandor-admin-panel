// ═══════════════════════════════════════════════════════════════════
// UI Store — Global UI state
// ═══════════════════════════════════════════════════════════════════

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

export const useUIStore = defineStore('ui', () => {
  // Sidebar state
  const sidebarCollapsed = useStorage('mve_sidebar_collapsed', false)
  const sidebarMobileOpen = ref(false)

  // Theme
  const theme = useStorage<'light' | 'dark' | 'system'>('mve_theme', 'system')
  const isDark = computed(() => {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  // Loading states
  const isPageLoading = ref(false)
  const loadingMessage = ref<string | null>(null)

  // Modals
  const activeModals = ref<string[]>([])

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function openMobileSidebar() {
    sidebarMobileOpen.value = true
  }

  function closeMobileSidebar() {
    sidebarMobileOpen.value = false
  }

  function setTheme(newTheme: 'light' | 'dark' | 'system') {
    theme.value = newTheme
    applyTheme()
  }

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function startPageLoading(message?: string) {
    isPageLoading.value = true
    loadingMessage.value = message || null
  }

  function stopPageLoading() {
    isPageLoading.value = false
    loadingMessage.value = null
  }

  function openModal(id: string) {
    if (!activeModals.value.includes(id)) {
      activeModals.value.push(id)
    }
  }

  function closeModal(id: string) {
    activeModals.value = activeModals.value.filter((m) => m !== id)
  }

  function isModalOpen(id: string): boolean {
    return activeModals.value.includes(id)
  }

  // Initialize theme on load
  function initUI() {
    applyTheme()
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme()
      }
    })
  }

  return {
    // State
    sidebarCollapsed,
    sidebarMobileOpen,
    theme,
    isDark,
    isPageLoading,
    loadingMessage,
    activeModals,

    // Actions
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    setTheme,
    applyTheme,
    startPageLoading,
    stopPageLoading,
    openModal,
    closeModal,
    isModalOpen,
    initUI,
  }
})
