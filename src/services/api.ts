// ═══════════════════════════════════════════════════════════════════
// Axios Instance — Configured HTTP client
// ═══════════════════════════════════════════════════════════════════

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useToast } from 'vue-toastification'
import { getItem, removeItem, StorageKeys } from '@/utils/storage'
import { keysToCamel, keysToSnake } from '@/utils/caseTransform'
import router from '@/router'

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

    // Convert request body keys to snake_case for API
    if (config.data && !(config.data instanceof FormData)) {
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
    const toast = useToast()
    const originalRequest = error.config

    // Handle different error codes
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as Record<string, unknown>

      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          removeItem(StorageKeys.TOKEN)
          removeItem(StorageKeys.USER)
          router.push('/login')
          toast.error('Session expired. Please login again.')
          break

        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action.')
          break

        case 404:
          // Not found
          toast.error('The requested resource was not found.')
          break

        case 422:
          // Validation error - let the caller handle it
          break

        case 429:
          // Too many requests
          toast.error('Too many requests. Please try again later.')
          break

        case 500:
        case 502:
        case 503:
          // Server error
          toast.error('Server error. Please try again later.')
          break

        default:
          // Generic error
          const message = (data?.message as string) || 'An error occurred'
          toast.error(message)
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

export default api
