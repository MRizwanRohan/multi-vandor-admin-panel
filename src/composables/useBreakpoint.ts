// ═══════════════════════════════════════════════════════════════════
// useBreakpoint — Responsive breakpoint detection
// ═══════════════════════════════════════════════════════════════════

import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Tailwind CSS default breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

/**
 * Composable for responsive breakpoint detection
 *
 * @returns Breakpoint utilities and current state
 *
 * @example
 * const { current, isMobile, isDesktop, isGreaterOrEqual } = useBreakpoint()
 *
 * // Reactive breakpoint checks
 * if (isMobile.value) {
 *   // Mobile layout logic
 * }
 *
 * // Check specific breakpoint
 * if (isGreaterOrEqual('lg')) {
 *   // Large screen logic
 * }
 */
export function useBreakpoint() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

  // Current breakpoint
  const current = computed<BreakpointKey | 'xs'>(() => {
    const w = width.value
    if (w >= BREAKPOINTS['2xl']) return '2xl'
    if (w >= BREAKPOINTS.xl) return 'xl'
    if (w >= BREAKPOINTS.lg) return 'lg'
    if (w >= BREAKPOINTS.md) return 'md'
    if (w >= BREAKPOINTS.sm) return 'sm'
    return 'xs'
  })

  // Common breakpoint checks
  const isMobile = computed(() => width.value < BREAKPOINTS.md)
  const isTablet = computed(() => width.value >= BREAKPOINTS.md && width.value < BREAKPOINTS.lg)
  const isDesktop = computed(() => width.value >= BREAKPOINTS.lg)
  const isLargeDesktop = computed(() => width.value >= BREAKPOINTS.xl)

  // Specific breakpoint checks
  const isXs = computed(() => width.value < BREAKPOINTS.sm)
  const isSm = computed(() => width.value >= BREAKPOINTS.sm && width.value < BREAKPOINTS.md)
  const isMd = computed(() => width.value >= BREAKPOINTS.md && width.value < BREAKPOINTS.lg)
  const isLg = computed(() => width.value >= BREAKPOINTS.lg && width.value < BREAKPOINTS.xl)
  const isXl = computed(() => width.value >= BREAKPOINTS.xl && width.value < BREAKPOINTS['2xl'])
  const is2xl = computed(() => width.value >= BREAKPOINTS['2xl'])

  /**
   * Check if current width is greater than or equal to breakpoint
   */
  function isGreaterOrEqual(breakpoint: BreakpointKey): boolean {
    return width.value >= BREAKPOINTS[breakpoint]
  }

  /**
   * Check if current width is less than breakpoint
   */
  function isLessThan(breakpoint: BreakpointKey): boolean {
    return width.value < BREAKPOINTS[breakpoint]
  }

  /**
   * Check if current width is between two breakpoints (inclusive start, exclusive end)
   */
  function isBetween(start: BreakpointKey, end: BreakpointKey): boolean {
    return width.value >= BREAKPOINTS[start] && width.value < BREAKPOINTS[end]
  }

  // Orientation
  const isPortrait = computed(() => height.value > width.value)
  const isLandscape = computed(() => width.value >= height.value)

  // Touch detection
  const isTouch = computed(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Update handler
  function handleResize() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  // Lifecycle
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize, { passive: true })
      handleResize()
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
  })

  return {
    // Dimensions
    width,
    height,

    // Current breakpoint
    current,

    // Common checks
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,

    // Specific breakpoint checks
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,

    // Utility functions
    isGreaterOrEqual,
    isLessThan,
    isBetween,

    // Orientation
    isPortrait,
    isLandscape,

    // Touch
    isTouch,

    // Constants
    breakpoints: BREAKPOINTS,
  }
}

/**
 * Quick helper to get a single breakpoint check
 *
 * @example
 * const isDesktop = useIsDesktop()
 * if (isDesktop.value) { ... }
 */
export function useIsDesktop() {
  const { isDesktop } = useBreakpoint()
  return isDesktop
}

export function useIsMobile() {
  const { isMobile } = useBreakpoint()
  return isMobile
}
