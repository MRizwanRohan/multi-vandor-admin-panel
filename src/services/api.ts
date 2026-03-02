// ═══════════════════════════════════════════════════════════════════
// Axios Instance — Configured HTTP client
// ═══════════════════════════════════════════════════════════════════

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useToast, type ToastInterface } from 'vue-toastification'
import { getItem, removeItem, StorageKeys } from '@/utils/storage'
import { keysToCamel, keysToSnake } from '@/utils/caseTransform'
import router from '@/router'

// Lazily initialized toast to avoid calling useToast() before plugin is ready
let _toast: ToastInterface | null = null
function getToast(): ToastInterface {
  if (!_toast) {
    _toast = useToast()
  }
  return _toast
}

/**
 * Detect current role prefix from the URL path.
 * Admin pages → '/admin', Vendor pages → '/vendor'
 */
export function getRolePrefix(): string {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return '/admin'
  if (path.startsWith('/vendor')) return '/vendor'
  return ''
}

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const token = getItem(StorageKeys.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add locale header
    const locale = getItem('locale') || 'en'
    config.headers['Accept-Language'] = locale

    // Handle FormData vs JSON body
    if (config.data instanceof FormData) {
      // Delete Content-Type so browser auto-sets multipart/form-data with correct boundary
      delete config.headers['Content-Type']
    } else if (config.data) {
      // Convert request body keys to snake_case for API
      config.data = keysToSnake(config.data)
    }

    // Convert query params to snake_case
    if (config.params) {
      config.params = keysToSnake(config.params)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Convert response data keys from snake_case to camelCase
    if (response.data) {
      response.data = keysToCamel(response.data)
    }
    return response
  },
  async (error: AxiosError) => {
    const toast = getToast()
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''

    // Handle different error codes
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as Record<string, unknown>

      switch (status) {
        case 401:
          // Clear auth and redirect to login
          removeItem(StorageKeys.TOKEN)
          removeItem(StorageKeys.USER)
          router.push('/login')
          // Don't show toast for silent auth checks (e.g., initAuth on page reload)
          if (!requestUrl.includes('/auth/me') && !requestUrl.includes('/auth/logout')) {
            toast.error('Session expired. Please login again.')
          }
          break

        case 403:
          toast.error('You do not have permission to perform this action.')
          break

        case 404:
          // Don't show 404 toast for auth-related endpoints
          if (!requestUrl.includes('/auth/')) {
            toast.error('The requested resource was not found.')
          }
          break

        case 422:
          // Validation error - let the caller handle it
          break

        case 429: {
          const retryAfter = error.response?.headers?.['retry-after']
          const seconds = retryAfter ? Number(retryAfter) || 60 : 60
          toast.error(`Too many requests. Please wait ${seconds} seconds before trying again.`)
          break
        }

        case 500:
        case 502:
        case 503:
          toast.error('Server error. Please try again later.')
          break

        default: {
          const message = (data?.message as string) || 'An error occurred'
          toast.error(message)
        }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

export default api
