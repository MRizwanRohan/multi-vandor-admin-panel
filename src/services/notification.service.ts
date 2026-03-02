// ═══════════════════════════════════════════════════════════════════
// Notification Service — Notification API calls (Dynamic)
// Matches backend API: /api/v1/notifications/*
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type {
  Notification,
  NotificationFilters,
  NotificationMeta,
  NotificationPreferences,
  UpdateNotificationPreferencesPayload,
  BroadcastNotificationPayload,
  SendNotificationPayload,
  EmailLog,
  EmailLogFilters,
} from '@/types'
import type { PaginatedResponse } from '@/types'

// ─────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────

export interface NotificationListResponse {
  success: boolean
  data: Notification[]
  meta: NotificationMeta
}

export interface UnreadCountResponse {
  success: boolean
  data: { unread_count: number }
}

export interface MarkAllReadResponse {
  success: boolean
  message: string
  data: { marked_count: number }
}

export interface ClearAllResponse {
  success: boolean
  message: string
  data: { deleted_count: number }
}

export interface PreferencesResponse {
  success: boolean
  data: NotificationPreferences
}

// Re-export types used externally
export type { NotificationFilters }

// ─────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────

// Notifications API is role-agnostic (not under /admin or /vendor)
const NOTIFICATIONS_PATH = '/notifications'

// Admin-only broadcast endpoints
const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications'

export const notificationService = {
  // ───────────────────────────────────────────────────────────────
  // Core Notification CRUD
  // ───────────────────────────────────────────────────────────────

  /**
   * GET /notifications — Paginated notification list
   */
  async getAll(params?: NotificationFilters): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>(NOTIFICATIONS_PATH, { params })
    return response.data
  },

  /**
   * GET /notifications/unread-count — Lightweight badge count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCountResponse>(`${NOTIFICATIONS_PATH}/unread-count`)
    return response.data.data.unread_count
  },

  /**
   * PUT /notifications/{id}/read — Mark single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await api.put(`${NOTIFICATIONS_PATH}/${id}/read`)
  },

  /**
   * PUT /notifications/mark-all-read — Mark all as read
   */
  async markAllAsRead(): Promise<number> {
    const response = await api.put<MarkAllReadResponse>(`${NOTIFICATIONS_PATH}/mark-all-read`)
    return response.data.data.marked_count
  },

  /**
   * DELETE /notifications/{id} — Delete single notification
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${NOTIFICATIONS_PATH}/${id}`)
  },

  /**
   * DELETE /notifications/clear-all — Clear all notifications
   */
  async clearAll(): Promise<number> {
    const response = await api.delete<ClearAllResponse>(`${NOTIFICATIONS_PATH}/clear-all`)
    return response.data.data.deleted_count
  },

  // ───────────────────────────────────────────────────────────────
  // Notification Preferences
  // ───────────────────────────────────────────────────────────────

  /**
   * GET /notifications/preferences — Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<PreferencesResponse>(`${NOTIFICATIONS_PATH}/preferences`)
    return response.data.data
  },

  /**
   * PUT /notifications/preferences — Update notification preferences
   */
  async updatePreferences(payload: UpdateNotificationPreferencesPayload): Promise<void> {
    await api.put(`${NOTIFICATIONS_PATH}/preferences`, payload)
  },

  // ───────────────────────────────────────────────────────────────
  // Admin-only Operations
  // ───────────────────────────────────────────────────────────────

  /**
   * POST /admin/notifications/broadcast — Broadcast to users by role
   */
  async broadcast(
    payload: BroadcastNotificationPayload,
  ): Promise<{ recipients_count: number; job_id: string }> {
    const response = await api.post<{
      success: boolean
      data: { recipients_count: number; job_id: string }
    }>('/admin/notifications/broadcast', payload)
    return response.data.data
  },

  /**
   * POST /admin/notifications/send — Send to specific users
   */
  async sendToUsers(payload: SendNotificationPayload): Promise<{ sent_count: number }> {
    const response = await api.post<{
      success: boolean
      data: { sent_count: number }
    }>('/admin/notifications/send', payload)
    return response.data.data
  },

  /**
   * GET /admin/email-logs — View email delivery logs
   */
  async getEmailLogs(params?: EmailLogFilters): Promise<PaginatedResponse<EmailLog>> {
    const response = await api.get<PaginatedResponse<EmailLog>>('/admin/email-logs', { params })
    return response.data
  },
}
