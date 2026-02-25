// ═══════════════════════════════════════════════════════════════════
// Notification Store — In-app notifications
// ═══════════════════════════════════════════════════════════════════

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification } from '@/types'
import api from '@/services/api'
import { getRolePrefix } from '@/services/api'

// DEV mode check
const DEV_MODE = import.meta.env.DEV

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const page = ref(1)

  // Getters
  const unreadCount = computed(() => {
    return notifications.value.filter((n) => !n.read_at).length
  })

  const recentNotifications = computed(() => {
    return notifications.value.slice(0, 5)
  })

  // Fetch notifications
  async function fetchNotifications(reset = false): Promise<void> {
    if (reset) {
      page.value = 1
      hasMore.value = true
      notifications.value = []
    }

    if (!hasMore.value || isLoading.value) return

    isLoading.value = true
    try {
      const response = await api.get<{
        data: Notification[]
        meta: { current_page: number; last_page: number }
      }>(`${getRolePrefix()}/notifications`, {
        params: { page: page.value, per_page: 20 },
      })

      notifications.value = [...notifications.value, ...response.data.data]
      hasMore.value = response.data.meta.current_page < response.data.meta.last_page
      page.value++
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Mark as read
  async function markAsRead(id: string): Promise<void> {
    try {
      await api.patch(`${getRolePrefix()}/notifications/${id}/read`)
      const notification = notifications.value.find((n) => n.id === id)
      if (notification) {
        notification.read_at = new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read
  async function markAllAsRead(): Promise<void> {
    try {
      await api.post(`${getRolePrefix()}/notifications/read-all`)
      notifications.value.forEach((n) => {
        if (!n.read_at) {
          n.read_at = new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  // Delete notification
  async function deleteNotification(id: number): Promise<void> {
    try {
      await api.delete(`${getRolePrefix()}/notifications/${id}`)
      notifications.value = notifications.value.filter((n) => String(n.id) !== String(id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // Add notification (from WebSocket/SSE)
  function addNotification(notification: Notification): void {
    notifications.value.unshift(notification)
  }

  // Clear all
  function clearAll(): void {
    notifications.value = []
    page.value = 1
    hasMore.value = true
  }

  return {
    // State
    notifications,
    isLoading,
    hasMore,

    // Getters
    unreadCount,
    recentNotifications,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearAll,
  }
})
