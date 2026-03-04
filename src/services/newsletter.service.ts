// ═══════════════════════════════════════════════════════════════════
// Newsletter Service — Email subscription management API
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type {
  NewsletterSubscriber,
  NewsletterStats,
  SubscriberFilters,
  CreateSubscriberRequest,
  UpdateSubscriberRequest,
  BulkSubscriberRequest,
  ImportSubscribersResponse,
  SubscribeRequest,
  SubscribeResponse,
  UnsubscribeRequest,
} from '@/types'
import type { PaginatedResponse } from '@/types'

export type { SubscriberFilters, NewsletterStats }

export const newsletterService = {
  // ═══════════════════════════════════════════════════════════════════
  // Admin: Newsletter Management — /admin/newsletter
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get paginated subscribers
   */
  async getAll(params?: SubscriberFilters): Promise<PaginatedResponse<NewsletterSubscriber>> {
    const response = await api.get<PaginatedResponse<NewsletterSubscriber>>(
      '/admin/newsletter/subscribers',
      { params }
    )
    return response.data
  },

  /**
   * Get newsletter statistics
   */
  async getStats(): Promise<NewsletterStats> {
    const response = await api.get<{ data: NewsletterStats }>('/admin/newsletter/stats')
    return response.data.data
  },

  /**
   * Export subscribers to CSV
   */
  async export(params?: { status?: string; source?: string }): Promise<Blob> {
    const response = await api.get('/admin/newsletter/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Import subscribers from CSV
   */
  async import(file: File): Promise<ImportSubscribersResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<{ data: ImportSubscribersResponse }>(
      '/admin/newsletter/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  /**
   * Bulk delete subscribers
   */
  async bulkDelete(subscriberIds: number[]): Promise<{ count: number }> {
    const response = await api.delete<{ data: { count: number } }>(
      '/admin/newsletter/subscribers/bulk',
      { data: { subscriber_ids: subscriberIds } }
    )
    return response.data.data
  },

  /**
   * Bulk unsubscribe
   */
  async bulkUnsubscribe(subscriberIds: number[]): Promise<{ count: number }> {
    const response = await api.put<{ data: { count: number } }>(
      '/admin/newsletter/subscribers/bulk-unsubscribe',
      { subscriber_ids: subscriberIds }
    )
    return response.data.data
  },

  /**
   * Get single subscriber
   */
  async getById(id: number): Promise<NewsletterSubscriber> {
    const response = await api.get<{ data: NewsletterSubscriber }>(
      `/admin/newsletter/subscribers/${id}`
    )
    return response.data.data
  },

  /**
   * Add subscriber manually
   */
  async create(data: CreateSubscriberRequest): Promise<NewsletterSubscriber> {
    const response = await api.post<{ data: NewsletterSubscriber }>(
      '/admin/newsletter/subscribers',
      data
    )
    return response.data.data
  },

  /**
   * Update subscriber
   */
  async update(id: number, data: UpdateSubscriberRequest): Promise<NewsletterSubscriber> {
    const response = await api.put<{ data: NewsletterSubscriber }>(
      `/admin/newsletter/subscribers/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete subscriber
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/newsletter/subscribers/${id}`)
  },

  /**
   * Unsubscribe by admin
   */
  async adminUnsubscribe(id: number): Promise<NewsletterSubscriber> {
    const response = await api.put<{ data: NewsletterSubscriber }>(
      `/admin/newsletter/subscribers/${id}/unsubscribe`
    )
    return response.data.data
  },

  /**
   * Resubscribe user
   */
  async resubscribe(id: number): Promise<NewsletterSubscriber> {
    const response = await api.put<{ data: NewsletterSubscriber }>(
      `/admin/newsletter/subscribers/${id}/resubscribe`
    )
    return response.data.data
  },

  /**
   * Resend verification email
   */
  async resendVerification(id: number): Promise<void> {
    await api.post(`/admin/newsletter/subscribers/${id}/resend-verification`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // Public: Newsletter Subscription — /newsletter
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Subscribe to newsletter (public)
   */
  async subscribe(data: SubscribeRequest): Promise<SubscribeResponse> {
    const response = await api.post<{ data: SubscribeResponse }>('/newsletter/subscribe', data)
    return response.data.data
  },

  /**
   * Verify email subscription
   */
  async verify(token: string): Promise<{ verified: boolean }> {
    const response = await api.get<{ data: { verified: boolean } }>(
      `/newsletter/verify/${token}`
    )
    return response.data.data
  },

  /**
   * Unsubscribe from newsletter
   */
  async unsubscribe(data: UnsubscribeRequest): Promise<{ unsubscribed: boolean }> {
    const response = await api.post<{ data: { unsubscribed: boolean } }>(
      '/newsletter/unsubscribe',
      data
    )
    return response.data.data
  },

  /**
   * Unsubscribe via token (one-click)
   */
  async unsubscribeByToken(token: string): Promise<{ unsubscribed: boolean }> {
    const response = await api.get<{ data: { unsubscribed: boolean } }>(
      `/newsletter/unsubscribe/${token}`
    )
    return response.data.data
  },

  /**
   * Check subscription status
   */
  async checkStatus(email: string): Promise<{ subscribed: boolean; verified: boolean }> {
    const response = await api.get<{ data: { subscribed: boolean; verified: boolean } }>(
      '/newsletter/status',
      { params: { email } }
    )
    return response.data.data
  },
}
