// ═══════════════════════════════════════════════════════════════════
// Router Configuration — Main router setup
// ═══════════════════════════════════════════════════════════════════

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { requireGuest, globalBeforeEach, globalAfterEach } from './guards'
import adminRoutes from './admin.routes'
import vendorRoutes from './vendor.routes'

// Auth routes
const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/Login.vue'),
    beforeEnter: requireGuest,
    meta: { title: 'Login', layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/auth/Register.vue'),
    beforeEnter: requireGuest,
    meta: { title: 'Register as Vendor', layout: 'auth' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/pages/auth/ForgotPassword.vue'),
    beforeEnter: requireGuest,
    meta: { title: 'Forgot Password', layout: 'auth' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/pages/auth/ResetPassword.vue'),
    beforeEnter: requireGuest,
    meta: { title: 'Reset Password', layout: 'auth' },
  },
]

// Error routes
const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/pages/errors/403.vue'),
    meta: { title: 'Access Denied', layout: 'blank' },
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/pages/errors/404.vue'),
    meta: { title: 'Page Not Found', layout: 'blank' },
  },
  {
    path: '/500',
    name: 'server-error',
    component: () => import('@/pages/errors/500.vue'),
    meta: { title: 'Server Error', layout: 'blank' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

// Base routes
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
]

// Combine all routes
const routes: RouteRecordRaw[] = [
  ...baseRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...vendorRoutes,
  ...errorRoutes,
]

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

// Register global guards
router.beforeEach(globalBeforeEach)
router.afterEach(globalAfterEach)

export default router
