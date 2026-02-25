// ═══════════════════════════════════════════════════════════════════
// Notification Service — Notification API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type { Notification, NotificationType, NotificationPreferences } from '@/types'
import type { PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/notifications`

export interface NotificationFilters {
  page?: number
  per_page?: number
  type?: NotificationType
  is_read?: boolean
}

export interface NotificationStats {
  total: number
  unread: number
  by_type: Record<NotificationType, number>
}

export const notificationService = {
  /**
   * Get paginated notifications
   */
  async getAll(params?: NotificationFilters): Promise<PaginatedResponse<Notification>> {
    const response = await api.get<PaginatedResponse<Notification>>(prefix(), { params })
    return response.data
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ data: { count: number } }>(`${prefix()}/unread-count`)
    return response.data.data.count
  },

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    const response = await api.get<{ data: NotificationStats }>(`${prefix()}/stats`)
    return response.data.data
  },

  /**
   * Get recent notifications (for header dropdown)
   */
  async getRecent(limit: number = 5): Promise<Notification[]> {
    const response = await api.get<{ data: Notification[] }>(`${prefix()}/recent`, {
      params: { limit },
    })
    return response.data.data
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await api.patch<{ data: Notification }>(`${prefix()}/${id}/read`)
    return response.data.data
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await api.post<{ data: { count: number } }>(`${prefix()}/mark-all-read`)
    return response.data.data
  },

  /**
   * Delete notification
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Delete all notifications
   */
  async deleteAll(): Promise<{ count: number }> {
    const response = await api.delete<{ data: { count: number } }>(`${prefix()}/all`)
    return response.data.data
  },

  /**
   * Bulk delete notifications
   */
  async bulkDelete(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-delete`,
      { ids }
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Notification Preferences
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<{ data: NotificationPreferences }>(`${prefix()}/preferences`)
    return response.data.data
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.put<{ data: NotificationPreferences }>(
      `${prefix()}/preferences`,
      preferences
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Push Notifications
  // ─────────────────────────────────────────────────────────────────

  /**
   * Register device for push notifications
   */
  async registerDevice(token: string, platform: 'web' | 'ios' | 'android'): Promise<void> {
    await api.post(`${prefix()}/devices`, { token, platform })
  },

  /**
   * Unregister device
   */
  async unregisterDevice(token: string): Promise<void> {
    await api.delete(`${prefix()}/devices`, { data: { token } })
  },

  /**
   * Test push notification (admin only)
   */
  async testPushNotification(userId?: number): Promise<void> {
    await api.post(`${prefix()}/test-push`, { user_id: userId })
  },
}
