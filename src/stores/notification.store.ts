// ═══════════════════════════════════════════════════════════════════
// Notification Store — In-app notifications (Dynamic API)
// ═══════════════════════════════════════════════════════════════════

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Notification,
  NotificationPreferences,
  UpdateNotificationPreferencesPayload,
  NotificationMeta,
} from '@/types'
import { notificationService } from '@/services'

// DEV mode check
const DEV_MODE = import.meta.env.DEV

// Polling interval for unread count (30 seconds)
const POLL_INTERVAL = 30_000

// Track if backend endpoints are available (avoids 404 spam in dev)
let endpointAvailable = true

export const useNotificationStore = defineStore('notification', () => {
  // ─────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const page = ref(1)
  const perPage = ref(15)
  const totalUnread = ref(0)
  const meta = ref<NotificationMeta | null>(null)
  const preferences = ref<NotificationPreferences | null>(null)
  const isLoadingPreferences = ref(false)
  const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // ─────────────────────────────────────────────────────────────────
  // Getters
  // ─────────────────────────────────────────────────────────────────
  const unreadCount = computed(() => totalUnread.value)

  const recentNotifications = computed(() => {
    return notifications.value.slice(0, 10)
  })

  const hasNotifications = computed(() => notifications.value.length > 0)

  // ─────────────────────────────────────────────────────────────────
  // Actions — Notification CRUD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Fetch paginated notifications from API
   */
  async function fetchNotifications(reset = false): Promise<void> {
    if (reset) {
      page.value = 1
      hasMore.value = true
      notifications.value = []
    }

    if (!hasMore.value || isLoading.value) return

    // Skip if endpoint known unavailable in dev
    if (DEV_MODE && !endpointAvailable) {
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const response = await notificationService.getAll({
        page: page.value,
        per_page: perPage.value,
      })

      endpointAvailable = true

      if (reset) {
        notifications.value = response.data
      } else {
        notifications.value = [...notifications.value, ...response.data]
      }

      meta.value = response.meta
      totalUnread.value = response.meta.unread_count
      hasMore.value = response.meta.current_page < response.meta.last_page
      page.value++
    } catch (error: any) {
      if (DEV_MODE && error?.response?.status === 404) {
        console.warn('[DEV] Notifications endpoint not implemented yet — polling paused')
        endpointAvailable = false
        hasMore.value = false
        stopPolling()
      } else {
        console.error('Failed to fetch notifications:', error)
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch only unread count (lightweight, for badge polling)
   */
  async function fetchUnreadCount(): Promise<void> {
    if (DEV_MODE && !endpointAvailable) return

    try {
      totalUnread.value = await notificationService.getUnreadCount()
      endpointAvailable = true
    } catch (error: any) {
      if (DEV_MODE && error?.response?.status === 404) {
        endpointAvailable = false
        stopPolling()
      } else {
        console.error('Failed to fetch unread count:', error)
      }
    }
  }

  /**
   * Mark a single notification as read
   */
  async function markAsRead(id: string): Promise<void> {
    try {
      await notificationService.markAsRead(id)
      const notification = notifications.value.find((n) => n.id === id)
      if (notification && !notification.read_at) {
        notification.read_at = new Date().toISOString()
        totalUnread.value = Math.max(0, totalUnread.value - 1)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead(): Promise<void> {
    try {
      const count = await notificationService.markAllAsRead()
      notifications.value.forEach((n) => {
        if (!n.read_at) {
          n.read_at = new Date().toISOString()
        }
      })
      totalUnread.value = 0
      return void count
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  /**
   * Delete a single notification
   */
  async function deleteNotification(id: string): Promise<void> {
    try {
      const notification = notifications.value.find((n) => n.id === id)
      await notificationService.delete(id)
      notifications.value = notifications.value.filter((n) => n.id !== id)
      if (notification && !notification.read_at) {
        totalUnread.value = Math.max(0, totalUnread.value - 1)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  /**
   * Clear all notifications
   */
  async function clearAll(): Promise<number> {
    try {
      const count = await notificationService.clearAll()
      notifications.value = []
      totalUnread.value = 0
      page.value = 1
      hasMore.value = false
      return count
    } catch (error) {
      console.error('Failed to clear all notifications:', error)
      return 0
    }
  }

  /**
   * Add notification from WebSocket/real-time push
   */
  function addNotification(notification: Notification): void {
    notifications.value.unshift(notification)
    if (!notification.read_at) {
      totalUnread.value++
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Actions — Preferences
  // ─────────────────────────────────────────────────────────────────

  /**
   * Fetch notification preferences
   */
  async function fetchPreferences(): Promise<NotificationPreferences | null> {
    isLoadingPreferences.value = true
    try {
      preferences.value = await notificationService.getPreferences()
      return preferences.value
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error)
      return null
    } finally {
      isLoadingPreferences.value = false
    }
  }

  /**
   * Update notification preferences
   */
  async function updatePreferences(
    payload: UpdateNotificationPreferencesPayload,
  ): Promise<boolean> {
    try {
      await notificationService.updatePreferences(payload)
      // Re-fetch to get updated values
      await fetchPreferences()
      return true
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return false
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Polling
  // ─────────────────────────────────────────────────────────────────

  /**
   * Start polling unread count every 30s
   */
  function startPolling(): void {
    stopPolling()
    fetchUnreadCount()
    pollTimer.value = setInterval(fetchUnreadCount, POLL_INTERVAL)
  }

  /**
   * Stop polling
   */
  function stopPolling(): void {
    if (pollTimer.value) {
      clearInterval(pollTimer.value)
      pollTimer.value = null
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────

  function $reset(): void {
    stopPolling()
    notifications.value = []
    isLoading.value = false
    hasMore.value = true
    page.value = 1
    totalUnread.value = 0
    meta.value = null
    preferences.value = null
    isLoadingPreferences.value = false
  }

  return {
    // State
    notifications,
    isLoading,
    hasMore,
    totalUnread,
    meta,
    preferences,
    isLoadingPreferences,

    // Getters
    unreadCount,
    recentNotifications,
    hasNotifications,

    // Actions — CRUD
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification,

    // Actions — Preferences
    fetchPreferences,
    updatePreferences,

    // Polling
    startPolling,
    stopPolling,

    // Reset
    $reset,
  }
})
