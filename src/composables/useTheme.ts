// ═══════════════════════════════════════════════════════════════════
// useTheme Composable — Dark/Light mode management
// ═══════════════════════════════════════════════════════════════════

import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useStorage } from '@vueuse/core'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  // Store theme preference
  const storedTheme = useStorage<Theme>('mve_theme', 'system')

  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

  // Computed current theme (resolved from system if needed)
  const resolvedTheme = computed(() => {
    if (storedTheme.value === 'system') {
      return prefersDark.matches ? 'dark' : 'light'
    }
    return storedTheme.value
  })

  const isDark = computed(() => resolvedTheme.value === 'dark')

  // Apply theme to document
  function applyTheme(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Watch for changes
  watch(
    resolvedTheme,
    (theme) => {
      applyTheme(theme)
    },
    { immediate: true }
  )

  // Listen for system theme changes
  let mediaListener: ((e: MediaQueryListEvent) => void) | null = null

  onMounted(() => {
    mediaListener = (e: MediaQueryListEvent) => {
      if (storedTheme.value === 'system') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }
    prefersDark.addEventListener('change', mediaListener)
  })

  onBeforeUnmount(() => {
    if (mediaListener) {
      prefersDark.removeEventListener('change', mediaListener)
      mediaListener = null
    }
  })

  // Set theme
  function setTheme(theme: Theme) {
    storedTheme.value = theme
  }

  // Toggle between light and dark
  function toggleTheme() {
    if (resolvedTheme.value === 'dark') {
      storedTheme.value = 'light'
    } else {
      storedTheme.value = 'dark'
    }
  }

  // Cycle through themes: light → dark → system
  function cycleTheme() {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(storedTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    storedTheme.value = themes[nextIndex]
  }

  return {
    theme: storedTheme,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
    cycleTheme,
  }
}
