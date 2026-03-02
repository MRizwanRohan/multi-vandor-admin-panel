// ═══════════════════════════════════════════════════════════════════
// useNotification Composable — Notification helpers & utilities
// ═══════════════════════════════════════════════════════════════════

import { computed, type Component, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores'
import { useToast } from './useToast'
import { useAuthStore } from '@/stores'
import type { Notification, NotificationColor } from '@/types'
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  StarIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowUturnLeftIcon,
  ShieldExclamationIcon,
  TagIcon,
  BellIcon,
  MegaphoneIcon,
  ArchiveBoxIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

// ─────────────────────────────────────────────────────────────────
// Icon Mapping
// ─────────────────────────────────────────────────────────────────

const iconMap: Record<string, Component> = {
  'check-circle': markRaw(CheckCircleIcon),
  'clock': markRaw(ClockIcon),
  'truck': markRaw(TruckIcon),
  'package-check': markRaw(ArchiveBoxIcon),
  'x-circle': markRaw(XCircleIcon),
  'star': markRaw(StarIcon),
  'shopping-bag': markRaw(ShoppingBagIcon),
  'shopping-cart': markRaw(ShoppingCartIcon),
  'exclamation-triangle': markRaw(ExclamationTriangleIcon),
  'alert-triangle': markRaw(ExclamationTriangleIcon),
  'building-storefront': markRaw(BuildingStorefrontIcon),
  'banknotes': markRaw(BanknotesIcon),
  'dollar-sign': markRaw(CurrencyDollarIcon),
  'arrow-uturn-left': markRaw(ArrowUturnLeftIcon),
  'shield-exclamation': markRaw(ShieldExclamationIcon),
  'tag': markRaw(TagIcon),
  'bell': markRaw(BellIcon),
  'megaphone': markRaw(MegaphoneIcon),
  'user-plus': markRaw(UserPlusIcon),
  'settings': markRaw(Cog6ToothIcon),
  'info': markRaw(InformationCircleIcon),
}

// ─────────────────────────────────────────────────────────────────
// Color Mapping (Tailwind safe — no dynamic class generation)
// ─────────────────────────────────────────────────────────────────

export interface NotificationColorStyles {
  bg: string
  text: string
  iconBg: string
  border: string
  dot: string
}

const colorMap: Record<string, NotificationColorStyles> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
}

const defaultColors: NotificationColorStyles = colorMap.gray

// ─────────────────────────────────────────────────────────────────
// Time Ago Utility
// ─────────────────────────────────────────────────────────────────

export function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 4) return `${diffWeek}w ago`

  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth}mo ago`

  return `${Math.floor(diffDay / 365)}y ago`
}

// ─────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────

export function useNotification() {
  const store = useNotificationStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const toast = useToast()

  /**
   * Get icon component for notification
   */
  function getIcon(notification: Notification): Component {
    return iconMap[notification.icon] || iconMap['bell']
  }

  /**
   * Get color styles for notification
   */
  function getColors(notification: Notification): NotificationColorStyles {
    return colorMap[notification.color] || defaultColors
  }

  /**
   * Get color styles by color name
   */
  function getColorStyles(color: NotificationColor | string): NotificationColorStyles {
    return colorMap[color] || defaultColors
  }

  /**
   * Navigate to notification action URL
   */
  function handleNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (!notification.read_at) {
      store.markAsRead(notification.id)
    }

    // Navigate to action URL
    if (notification.action_url) {
      // If action_url already starts with /admin or /vendor, use as-is
      // Otherwise prefix with role-based path
      const prefix = authStore.isAdmin ? '/admin' : '/vendor'
      const url = notification.action_url.startsWith('/admin') || notification.action_url.startsWith('/vendor')
        ? notification.action_url
        : notification.action_url.startsWith('/')
          ? `${prefix}${notification.action_url}`
          : notification.action_url
      router.push(url)
    }
  }

  /**
   * Show toast for incoming real-time notification
   */
  function showNotificationToast(notification: Notification): void {
    const typeToToast: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
      order_placed: 'success',
      order_status_changed: 'info',
      product_approved: 'success',
      product_rejected: 'error',
      product_low_stock: 'warning',
      vendor_approved: 'success',
      vendor_rejected: 'error',
      payout_processed: 'success',
      return_requested: 'warning',
      dispute_escalated: 'error',
      system: 'info',
      promotional: 'info',
    }

    const toastType = typeToToast[notification.type] || 'info'
    toast[toastType](`${notification.title}: ${notification.message}`)
  }

  /**
   * Navigate to all notifications page
   */
  function viewAllNotifications(): void {
    const path = authStore.isAdmin ? '/admin/notifications' : '/vendor/notifications'
    router.push(path)
  }

  /**
   * Get dashboard type from auth store
   */
  const dashboardType = computed(() => (authStore.isAdmin ? 'admin' : 'vendor'))

  /**
   * Whether user is vendor (for showing vendor-specific preferences)
   */
  const isVendor = computed(() => authStore.isVendor)

  return {
    // Store access
    store,

    // Utilities
    getIcon,
    getColors,
    getColorStyles,
    handleNotificationClick,
    showNotificationToast,
    viewAllNotifications,
    timeAgo,

    // Computed
    dashboardType,
    isVendor,
  }
}
