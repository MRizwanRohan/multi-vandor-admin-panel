// ═══════════════════════════════════════════════════════════════════
// usePermission — Role and permission checking utilities
// ═══════════════════════════════════════════════════════════════════

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

export type UserRole = 'admin' | 'super_admin' | 'vendor' | 'customer' | null

/**
 * Composable for checking user roles and permissions
 *
 * @returns Role and permission checking utilities
 *
 * @example
 * const { isAdmin, hasPermission, canAccess } = usePermission()
 *
 * if (isAdmin.value) {
 *   // Admin-only logic
 * }
 *
 * if (hasPermission('products.create')) {
 *   // User can create products
 * }
 */
export function usePermission() {
  const authStore = useAuthStore()

  // Role checks
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isAdmin = computed(() => authStore.isAdmin)
  const isVendor = computed(() => authStore.isVendor)
  const isSuperAdmin = computed(() => authStore.user?.userType === 'super_admin' || authStore.user?.role === 'super_admin')
  const currentRole = computed<UserRole>(() => authStore.userRole as UserRole)
  const permissions = computed(() => authStore.userPermissions)

  /**
   * Check if user has a specific permission
   */
  function hasPermission(permission: string): boolean {
    return authStore.hasPermission(permission)
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  function hasAnyPermission(permissions: string[]): boolean {
    return authStore.hasAnyPermission(permissions)
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  function hasAllPermissions(permissionList: string[]): boolean {
    if (isAdmin.value) return true
    return permissionList.every((p) => authStore.userPermissions.includes(p))
  }

  /**
   * Check if user has a specific role
   */
  function hasRole(role: UserRole): boolean {
    return currentRole.value === role
  }

  /**
   * Check if user has any of the specified roles
   */
  function hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(currentRole.value)
  }

  /**
   * Check if user can access a resource based on role or permission
   */
  function canAccess(options: {
    roles?: UserRole[]
    permissions?: string[]
    requireAll?: boolean
  }): boolean {
    const { roles, permissions: perms, requireAll = false } = options

    // Check roles first
    if (roles && roles.length > 0) {
      if (!hasAnyRole(roles)) {
        return false
      }
    }

    // Check permissions
    if (perms && perms.length > 0) {
      if (requireAll) {
        return hasAllPermissions(perms)
      }
      return hasAnyPermission(perms)
    }

    // If roles passed and no permissions specified, role check is sufficient
    if (roles && roles.length > 0) {
      return true
    }

    // Default: require authentication at minimum
    return isAuthenticated.value
  }

  /**
   * Check if current user owns a resource
   */
  function isOwner(ownerId: number | string | null | undefined): boolean {
    if (!ownerId || !authStore.user?.id) return false
    return String(authStore.user.id) === String(ownerId)
  }

  /**
   * Check if current vendor owns a resource
   */
  function isVendorOwner(vendorId: number | string | null | undefined): boolean {
    if (!vendorId || !authStore.vendorId) return false
    return String(authStore.vendorId) === String(vendorId)
  }

  /**
   * Check access: admin can access all, vendors can only access their own
   */
  function canAccessResource(resourceVendorId?: number | string | null): boolean {
    if (isAdmin.value) return true
    if (!isVendor.value) return false
    if (!resourceVendorId) return true // New resource
    return isVendorOwner(resourceVendorId)
  }

  return {
    // State
    isAuthenticated,
    isAdmin,
    isVendor,
    isSuperAdmin,
    currentRole,
    permissions,

    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Role checks
    hasRole,
    hasAnyRole,

    // Access checks
    canAccess,
    isOwner,
    isVendorOwner,
    canAccessResource,
  }
}

/**
 * Quick helper to check a single permission
 *
 * @example
 * const canCreate = useCanDo('products.create')
 * if (canCreate.value) { ... }
 */
export function useCanDo(permission: string) {
  const { hasPermission } = usePermission()
  return computed(() => hasPermission(permission))
}

/**
 * Quick helper to check a role requirement
 *
 * @example
 * const isAdminOrVendor = useHasRole(['admin', 'vendor'])
 */
export function useHasRole(roles: UserRole | UserRole[]) {
  const { hasAnyRole } = usePermission()
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return computed(() => hasAnyRole(roleArray))
}
