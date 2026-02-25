// ═══════════════════════════════════════════════════════════════════
// Auth Service — Authentication API calls
// ═══════════════════════════════════════════════════════════════════

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

// Laravel Sanctum CSRF cookie endpoint
async function getCsrfCookie(): Promise<void> {
  try {
    await api.get('/sanctum/csrf-cookie')
  } catch {
    // CSRF cookie fetch may fail — continue with login anyway
    console.warn('⚠️ CSRF cookie fetch failed, continuing...')
  }
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await getCsrfCookie()
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
  },

  /**
   * Register new vendor
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    await getCsrfCookie()
    const response = await api.post<any>(`${PREFIX}/register`, data)
    const resData = response.data
    // API returns: { success, message, data: { user, token, token_type } }
    const regData = resData?.data || resData
    return {
      user: regData.user,
      token: regData.token,
      token_type: regData.tokenType || regData.token_type || 'Bearer',
      expires_at: regData.expiresAt || regData.expires_at || '',
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
