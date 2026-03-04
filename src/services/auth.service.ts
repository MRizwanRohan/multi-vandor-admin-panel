// ═══════════════════════════════════════════════════════════════════
// Auth Service — Authentication API calls
// ═══════════════════════════════════════════════════════════════════

import axios from 'axios'
import api from './api'
import type {
  User,
  LoginCredentials,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirm,
  RegisterData,
} from '@/types'

const PREFIX = '/auth'

/**
 * Laravel Sanctum CSRF cookie endpoint.
 * IMPORTANT: Uses raw axios (not `api` instance) because the CSRF endpoint
 * lives at /sanctum/csrf-cookie — NOT under the /api/v1 baseURL.
 */
async function getCsrfCookie(): Promise<void> {
  try {
    await axios.get('/sanctum/csrf-cookie', {
      withCredentials: true,
    })
  } catch {
    // CSRF cookie fetch may fail in token-based auth — continue anyway
    console.warn('⚠️ CSRF cookie fetch failed, continuing...')
  }
}

/**
 * Parse Retry-After header value (seconds or HTTP-date) from a 429 response.
 */
function getRetryAfterSeconds(error: any): number {
  const retryAfter = error?.response?.headers?.['retry-after']
  if (!retryAfter) return 60 // default 60s if header missing
  const parsed = Number(retryAfter)
  if (!isNaN(parsed)) return parsed
  // HTTP-date format
  const date = new Date(retryAfter)
  if (!isNaN(date.getTime())) {
    return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000))
  }
  return 60
}

/**
 * Check if an error is a rate-limit (429) response.
 */
function isRateLimited(error: any): boolean {
  return error?.response?.status === 429
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await getCsrfCookie()
    try {
      const response = await api.post<any>(`${PREFIX}/login`, credentials)
      const resData = response.data
      // API returns: { success, message, data: { user, token, token_type } }
      const loginData = resData?.data || resData
      return {
        user: loginData.user,
        token: loginData.token,
        token_type: loginData.tokenType || loginData.token_type || 'Bearer',
        expires_at: loginData.expiresAt || loginData.expires_at || '',
      }
    } catch (error: any) {
      if (isRateLimited(error)) {
        const retryAfter = getRetryAfterSeconds(error)
        const err = new Error(`Too many login attempts. Please try again after ${retryAfter} seconds.`) as any
        err.retryAfter = retryAfter
        err.isRateLimited = true
        err.response = error.response
        throw err
      }
      throw error
    }
  },

  /**
   * Register new vendor
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    await getCsrfCookie()
    try {
      // Build FormData if files are present (NID images), otherwise send JSON
      let payload: FormData | RegisterData = data
      const hasFiles = (data as any).nid_front_image instanceof File || (data as any).nid_back_image instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
          if (value === null || value === undefined) return
          if (value instanceof File) {
            formData.append(key, value)
          } else {
            formData.append(key, String(value))
          }
        })
        payload = formData
      }
      
      const response = await api.post<any>(`${PREFIX}/register`, payload, hasFiles ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined)
      const resData = response.data
      // API returns: { success, message, data: { user, token, token_type } }
      const regData = resData?.data || resData
      return {
        user: regData.user,
        token: regData.token,
        token_type: regData.tokenType || regData.token_type || 'Bearer',
        expires_at: regData.expiresAt || regData.expires_at || '',
      }
    } catch (error: any) {
      if (isRateLimited(error)) {
        const retryAfter = getRetryAfterSeconds(error)
        const err = new Error(`Too many attempts. Please try again after ${retryAfter} seconds.`) as any
        err.retryAfter = retryAfter
        err.isRateLimited = true
        err.response = error.response
        throw err
      }
      throw error
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await api.post(`${PREFIX}/logout`)
  },

  async getUser(): Promise<User> {
    const response = await api.get<any>(`${PREFIX}/me`)
    const resData = response.data

    // Handle various backend response formats:
    // 1. { data: { user: { id... } } }
    // 2. { data: { id... } }
    // 3. { user: { id... } }
    // 4. { id... } directly
    return resData?.data?.user || resData?.data || resData?.user || resData
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: PasswordResetRequest): Promise<{ message: string }> {
    const response = await api.post(`${PREFIX}/forgot-password`, data)
    return response.data
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetConfirm): Promise<{ message: string }> {
    const response = await api.post(`${PREFIX}/reset-password`, data)
    return response.data
  },

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<{ token: string }> {
    const response = await api.post(`${PREFIX}/refresh`)
    return response.data.data
  },

  /**
   * Update profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<{ data: User }>(`${PREFIX}/profile`, data)
    return response.data.data
  },

  /**
   * Change password
   */
  async changePassword(data: {
    current_password: string
    password: string
    password_confirmation: string
  }): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`${PREFIX}/password`, data)
    return response.data
  },

  /**
   * Update avatar
   */
  async updateAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post<{ avatar: string }>(`${PREFIX}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
