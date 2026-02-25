// ═══════════════════════════════════════════════════════════════════
// useDebounce — Debounced ref and function utilities
// ═══════════════════════════════════════════════════════════════════

import { ref, watch, type Ref, type UnwrapRef } from 'vue'

/**
 * Creates a debounced ref that updates after a specified delay
 *
 * @param initialValue - Initial value of the ref
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Object with value (immediate) and debouncedValue (delayed)
 *
 * @example
 * const { value: searchQuery, debouncedValue } = useDebouncedRef('', 500)
 * // searchQuery updates immediately, debouncedValue updates after 500ms
 */
export function useDebouncedRef<T>(initialValue: T, delay = 300) {
  const value = ref<T>(initialValue) as Ref<T>
  const debouncedValue = ref<T>(initialValue) as Ref<T>

  let timeout: ReturnType<typeof setTimeout> | null = null

  watch(value, (newValue) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      debouncedValue.value = newValue as UnwrapRef<T>
    }, delay)
  })

  function cancel() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  function flush() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
      debouncedValue.value = value.value as UnwrapRef<T>
    }
  }

  return {
    value,
    debouncedValue,
    cancel,
    flush,
  }
}

/**
 * Creates a debounced function that delays invoking until after delay ms
 *
 * @param fn - Function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced function with cancel and flush methods
 *
 * @example
 * const debouncedSearch = useDebounce((query: string) => {
 *   fetchResults(query)
 * }, 500)
 * debouncedSearch('hello') // Will execute after 500ms of inactivity
 */
export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay = 300
) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const debouncedFn = (...args: Parameters<T>) => {
    lastArgs = args
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      fn(...args)
      lastArgs = null
    }, delay)
  }

  debouncedFn.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
      lastArgs = null
    }
  }

  debouncedFn.flush = () => {
    if (timeout && lastArgs) {
      clearTimeout(timeout)
      timeout = null
      fn(...lastArgs)
      lastArgs = null
    }
  }

  debouncedFn.pending = () => timeout !== null

  return debouncedFn
}

/**
 * Alias for useDebouncedRef for backward compatibility
 */
export const useDebouncedValue = useDebouncedRef
