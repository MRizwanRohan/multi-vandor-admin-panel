// ═══════════════════════════════════════════════════════════════════
// Router Guards — Authentication & authorization checks
// ═══════════════════════════════════════════════════════════════════

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'

/**
 * Require authentication
 */
export function requireAuth(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }

  next()
}

/**
 * Require guest (not authenticated)
 */
export function requireGuest(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    // Redirect to appropriate dashboard
    if (authStore.isAdmin) {
      next('/admin/dashboard')
    } else if (authStore.isVendor) {
      next('/vendor/dashboard')
    } else {
      // Unknown role — clear stale auth to prevent infinite redirect loop
      // (next('/') would redirect to /login which triggers requireGuest again)
      authStore.logout()
      next()
    }
    return
  }

  next()
}

/**
 * Require admin role
 */
export function requireAdmin(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (!authStore.isAdmin) {
    next('/403')
    return
  }

  next()
}

/**
 * Require vendor role
 */
export function requireVendor(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (!authStore.isVendor) {
    next('/403')
    return
  }

  // Check if vendor account is active
  if (authStore.vendorStatus === 'suspended') {
    next('/vendor/suspended')
    return
  }

  if (authStore.vendorStatus === 'pending') {
    next('/vendor/pending')
    return
  }

  next()
}

/**
 * Require specific permission
 */
export function requirePermission(permission: string) {
  return (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): void => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }

    if (!authStore.hasPermission(permission)) {
      next('/403')
      return
    }

    next()
  }
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(permissions: string[]) {
  return (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): void => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }

    if (!authStore.hasAnyPermission(permissions)) {
      next('/403')
      return
    }

    next()
  }
}

/**
 * Global before each guard
 */
export function globalBeforeEach(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const uiStore = useUIStore()
  
  // Start page loading
  uiStore.startPageLoading()
  
  // Close mobile sidebar on navigation
  uiStore.closeMobileSidebar()

  next()
}

/**
 * Global after each hook
 */
export function globalAfterEach(to: RouteLocationNormalized): void {
  const uiStore = useUIStore()
  
  // Stop page loading
  uiStore.stopPageLoading()

  // Update document title
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} | MVE Dashboard` : 'MVE Dashboard'
}
