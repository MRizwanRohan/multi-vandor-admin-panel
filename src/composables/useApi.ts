// ═══════════════════════════════════════════════════════════════════
// useApi Composable — API call wrapper with loading/error states
// ═══════════════════════════════════════════════════════════════════

import { ref, type Ref } from 'vue'
import type { ApiResponse, ValidationError } from '@/types'

interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: unknown) => void
  onError?: (error: unknown) => void
}

interface UseApiReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  validationErrors: Ref<Record<string, string[]>>
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

export function useApi<T>(
  apiFn: (...args: unknown[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const validationErrors = ref<Record<string, string[]>>({})

  async function execute(...args: unknown[]): Promise<T | null> {
    loading.value = true
    error.value = null
    validationErrors.value = {}

    try {
      const response = await apiFn(...args)

      if (response.success) {
        data.value = response.data
        options.onSuccess?.(response.data)
        return response.data
      } else {
        error.value = response.message || 'An error occurred'
        return null
      }
    } catch (err: unknown) {
      // Handle validation errors (422)
      if (isValidationError(err)) {
        validationErrors.value = err.errors
        error.value = err.message || 'Validation failed'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unexpected error occurred'
      }

      options.onError?.(err)
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = null
    loading.value = false
    error.value = null
    validationErrors.value = {}
  }

  // Execute immediately if option is set
  if (options.immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    validationErrors,
    execute,
    reset,
  }
}

/**
 * Type guard for validation errors
 */
function isValidationError(err: unknown): err is ValidationError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    typeof (err as ValidationError).errors === 'object'
  )
}

/**
 * Simplified API call for mutations (create, update, delete)
 */
export function useMutation<T, P = unknown>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>
) {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const validationErrors = ref<Record<string, string[]>>({})
  const isSuccess = ref(false)

  async function mutate(params: P): Promise<T | null> {
    loading.value = true
    error.value = null
    validationErrors.value = {}
    isSuccess.value = false

    try {
      const response = await mutationFn(params)

      if (response.success) {
        data.value = response.data
        isSuccess.value = true
        return response.data
      } else {
        error.value = response.message || 'An error occurred'
        return null
      }
    } catch (err: unknown) {
      if (isValidationError(err)) {
        validationErrors.value = err.errors
        error.value = err.message || 'Validation failed'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unexpected error occurred'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = null
    loading.value = false
    error.value = null
    validationErrors.value = {}
    isSuccess.value = false
  }

  return {
    data,
    loading,
    error,
    validationErrors,
    isSuccess,
    mutate,
    reset,
  }
}
