// ═══════════════════════════════════════════════════════════════════
// Auth Store — User authentication state
// ═══════════════════════════════════════════════════════════════════

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { authService } from '@/services/auth.service'
import { getItem, setItem, removeItem, StorageKeys } from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  // State - Read from localStorage (set after real login)
  const user = ref<User | null>(getItem<User>(StorageKeys.USER))
  const token = ref<string | null>(getItem<string>(StorageKeys.TOKEN))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => {
    const ut = user.value?.userType || user.value?.user_type || user.value?.role
    return ut === 'admin' || ut === 'super_admin'
  })
  const isVendor = computed(() => {
    const ut = user.value?.userType || user.value?.user_type || user.value?.role
    return ut === 'vendor'
  })
  const userRole = computed(() => user.value?.userType ?? user.value?.user_type ?? user.value?.role ?? null)
  const userPermissions = computed(() => user.value?.permissions ?? [])
  const vendorId = computed(() => user.value?.vendor?.id ?? null)
  const vendorStatus = computed(() => user.value?.vendor?.status ?? null)

  // Check permission
  function hasPermission(permission: string): boolean {
    if (isAdmin.value) return true
    return userPermissions.value.includes(permission)
  }

  // Check any permission
  function hasAnyPermission(permissions: string[]): boolean {
    if (isAdmin.value) return true
    return permissions.some((p) => userPermissions.value.includes(p))
  }

  // Login
  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      token.value = response.token
      user.value = response.user

      setItem(StorageKeys.TOKEN, response.token)
      setItem(StorageKeys.USER, response.user)

      // Redirect based on role
      if (isAdmin.value) {
        router.push('/admin/dashboard')
      } else if (isVendor.value) {
        router.push('/vendor/dashboard')
      }
    } catch (e: any) {
      if (e?.isRateLimited) {
        error.value = e.message
      } else {
        const err = e as { response?: { data?: { message?: string } } }
        error.value = err.response?.data?.message || 'Login failed'
      }
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Register (vendor)
  async function register(data: RegisterData): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.register(data)
      token.value = response.token
      user.value = response.user

      setItem(StorageKeys.TOKEN, response.token)
      setItem(StorageKeys.USER, response.user)

      router.push('/vendor/dashboard')
    } catch (e: any) {
      if (e?.isRateLimited) {
        error.value = e.message
      } else {
        const err = e as { response?: { data?: { message?: string } } }
        error.value = err.response?.data?.message || 'Registration failed'
      }
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  async function logout(): Promise<void> {
    try {
      await authService.logout()
    } catch {
      // Ignore logout errors
    } finally {
      user.value = null
      token.value = null
      removeItem(StorageKeys.TOKEN)
      removeItem(StorageKeys.USER)
      router.push('/login')
    }
  }

  // Fetch current user
  async function fetchUser(): Promise<void> {
    if (!token.value) return

    isLoading.value = true
    try {
      user.value = await authService.getUser()
      setItem(StorageKeys.USER, user.value)
    } catch {
      // Token expired or invalid - logout
      logout()
    } finally {
      isLoading.value = false
    }
  }

  // Update profile
  async function updateProfile(data: Partial<User>): Promise<void> {
    isLoading.value = true
    try {
      user.value = await authService.updateProfile(data)
      setItem(StorageKeys.USER, user.value)
    } finally {
      isLoading.value = false
    }
  }

  // Update avatar
  async function updateAvatar(file: File): Promise<void> {
    const { avatar } = await authService.updateAvatar(file)
    if (user.value) {
      user.value.avatar = avatar
      setItem(StorageKeys.USER, user.value)
    }
  }

  // Check auth on init
  async function initAuth(): Promise<void> {
    if (token.value) {
      await fetchUser()
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    isAdmin,
    isVendor,
    userRole,
    userPermissions,
    vendorId,
    vendorStatus,

    // Actions
    hasPermission,
    hasAnyPermission,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    updateAvatar,
    initAuth,
  }
})
