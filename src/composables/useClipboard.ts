// ═══════════════════════════════════════════════════════════════════
// useClipboard — Copy to clipboard utilities
// ═══════════════════════════════════════════════════════════════════

import { ref, computed } from 'vue'
import { useToast } from './useToast'

export interface UseClipboardOptions {
  /** Duration in ms to show "copied" state (default: 2000) */
  copiedDuration?: number
  /** Show toast notification on copy (default: true) */
  showToast?: boolean
  /** Custom success message */
  successMessage?: string
  /** Custom error message */
  errorMessage?: string
}

/**
 * Composable for copying text to clipboard
 *
 * @param options - Configuration options
 * @returns Clipboard utilities
 *
 * @example
 * const { copy, copied, isSupported } = useClipboard()
 *
 * async function copyLink() {
 *   await copy('https://example.com')
 *   // copied.value will be true for 2 seconds
 * }
 *
 * @example
 * // With custom options
 * const { copy } = useClipboard({
 *   successMessage: 'Link copied!',
 *   copiedDuration: 3000,
 * })
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const {
    copiedDuration = 2000,
    showToast = true,
    successMessage = 'Copied to clipboard',
    errorMessage = 'Failed to copy',
  } = options

  const toast = useToast()

  const copied = ref(false)
  const text = ref<string>('')
  let timeout: ReturnType<typeof setTimeout> | null = null

  const isSupported = computed(() => {
    return navigator && 'clipboard' in navigator
  })

  /**
   * Copy text to clipboard
   */
  async function copy(value: string): Promise<boolean> {
    if (!isSupported.value) {
      // Fallback for older browsers
      return copyLegacy(value)
    }

    try {
      await navigator.clipboard.writeText(value)
      text.value = value
      copied.value = true

      if (showToast) {
        toast.success(successMessage)
      }

      // Reset copied state after duration
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        copied.value = false
      }, copiedDuration)

      return true
    } catch (error) {
      console.error('Clipboard copy failed:', error)
      if (showToast) {
        toast.error(errorMessage)
      }
      return false
    }
  }

  /**
   * Legacy fallback for browsers without Clipboard API
   */
  function copyLegacy(value: string): boolean {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        text.value = value
        copied.value = true

        if (showToast) {
          toast.success(successMessage)
        }

        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          copied.value = false
        }, copiedDuration)
      }

      return successful
    } catch (error) {
      console.error('Legacy clipboard copy failed:', error)
      document.body.removeChild(textarea)

      if (showToast) {
        toast.error(errorMessage)
      }
      return false
    }
  }

  /**
   * Read text from clipboard (requires user permission)
   */
  async function read(): Promise<string | null> {
    if (!isSupported.value) {
      console.warn('Clipboard read not supported')
      return null
    }

    try {
      const clipboardText = await navigator.clipboard.readText()
      text.value = clipboardText
      return clipboardText
    } catch (error) {
      console.error('Clipboard read failed:', error)
      return null
    }
  }

  return {
    /** Whether clipboard API is supported */
    isSupported,
    /** Currently copied text */
    text,
    /** Whether text was recently copied (resets after copiedDuration) */
    copied,
    /** Copy text to clipboard */
    copy,
    /** Read text from clipboard */
    read,
  }
}

/**
 * Quick helper to copy a value with toast notification
 *
 * @example
 * const copyCode = useCopyText()
 * copyCode('ABC123') // Copies and shows toast
 */
export function useCopyText(options?: UseClipboardOptions) {
  const { copy } = useClipboard(options)
  return copy
}
