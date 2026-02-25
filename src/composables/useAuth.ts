// ═══════════════════════════════════════════════════════════════════
// useAuth Composable — Authentication and authorization utilities
// ═══════════════════════════════════════════════════════════════════

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  // Computed properties
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)
  const userRole = computed(() => authStore.user?.user_type)

  // Role checks
  const isAdmin = computed(() =>
    ['admin', 'super_admin'].includes(authStore.user?.user_type || '')
  )
  const isSuperAdmin = computed(() => authStore.user?.user_type === 'super_admin')
  const isVendor = computed(() => authStore.user?.user_type === 'vendor')
  const isCustomer = computed(() => authStore.user?.user_type === 'customer')

  // Vendor status check
  const isVendorApproved = computed(() =>
    authStore.user?.vendor?.status === 'approved'
  )

  /**
   * Check if user has a specific role
   */
  function hasRole(role: UserRole | UserRole[]): boolean {
    const userType = authStore.user?.user_type
    if (!userType) return false

    if (Array.isArray(role)) {
      return role.includes(userType)
    }
    return userType === role
  }

  /**
   * Check if user has a specific permission
   */
  function hasPermission(permission: string): boolean {
    // Super admin has all permissions
    if (authStore.user?.user_type === 'super_admin') return true

    return authStore.userPermissions.includes(permission)
  }

  /**
   * Check if user has any of the specified permissions
   */
  function hasAnyPermission(permissions: string[]): boolean {
    if (authStore.user?.user_type === 'super_admin') return true

    return permissions.some((p) => authStore.userPermissions.includes(p))
  }

  /**
   * Check if user has all of the specified permissions
   */
  function hasAllPermissions(permissions: string[]): boolean {
    if (authStore.user?.user_type === 'super_admin') return true

    return permissions.every((p) => authStore.userPermissions.includes(p))
  }

  /**
   * Login and redirect
   */
  async function login(credentials: { email: string; password: string }) {
    await authStore.login(credentials)

    // Redirect based on role
    if (authStore.user) {
      const redirectPath = getRedirectPath(authStore.user.user_type)
      await router.push(redirectPath)
    }
  }

  /**
   * Logout and redirect to login
   */
  async function logout() {
    await authStore.logout()
    await router.push('/login')
  }

  /**
   * Get redirect path based on user role
   */
  function getRedirectPath(role: UserRole): string {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return '/admin'
      case 'vendor':
        return '/vendor'
      default:
        return '/'
    }
  }

  /**
   * Get dashboard path based on current user role
   */
  const dashboardPath = computed(() => {
    if (isAdmin.value) return '/admin'
    if (isVendor.value) return '/vendor'
    return '/'
  })

  return {
    // State
    isAuthenticated,
    user,
    token,
    userRole,

    // Role checks
    isAdmin,
    isSuperAdmin,
    isVendor,
    isCustomer,
    isVendorApproved,

    // Methods
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    getRedirectPath,
    dashboardPath,
  }
}
