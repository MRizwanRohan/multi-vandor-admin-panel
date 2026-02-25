// ═══════════════════════════════════════════════════════════════════
// Review Service — Review API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  Review,
  ReviewDetail,
  ReviewStatus,
  CreateVendorResponseRequest,
  ReviewListParams,
} from '@/types'
import type { PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/reviews`

export interface ReviewFilters extends ReviewListParams {
  search?: string
}

export interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  flagged: number
  average_rating: number
}

export const reviewService = {
  /**
   * Get paginated reviews
   */
  async getAll(params?: ReviewFilters): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>(prefix(), { params })
    return response.data
  },

  /**
   * Get single review
   */
  async getById(id: number): Promise<ReviewDetail> {
    const response = await api.get<{ data: ReviewDetail }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Get review statistics
   */
  async getStats(): Promise<ReviewStats> {
    const response = await api.get<{ data: ReviewStats }>(`${prefix()}/stats`)
    return response.data.data
  },

  /**
   * Approve review
   */
  async approve(id: number): Promise<Review> {
    const response = await api.patch<{ data: Review }>(`${prefix()}/${id}/approve`)
    return response.data.data
  },

  /**
   * Reject review
   */
  async reject(id: number, reason?: string): Promise<Review> {
    const response = await api.patch<{ data: Review }>(`${prefix()}/${id}/reject`, { reason })
    return response.data.data
  },

  /**
   * Flag review for moderation
   */
  async flag(id: number, reason: string): Promise<Review> {
    const response = await api.patch<{ data: Review }>(`${prefix()}/${id}/flag`, { reason })
    return response.data.data
  },

  /**
   * Update review status
   */
  async updateStatus(id: number, status: ReviewStatus): Promise<Review> {
    const response = await api.patch<{ data: Review }>(`${prefix()}/${id}/status`, { status })
    return response.data.data
  },

  /**
   * Delete review (admin only)
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Bulk approve reviews
   */
  async bulkApprove(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-approve`,
      { ids }
    )
    return response.data.data
  },

  /**
   * Bulk reject reviews
   */
  async bulkReject(ids: number[], reason?: string): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-reject`,
      { ids, reason }
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Vendor Responses
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create vendor response to review
   */
  async createResponse(reviewId: number, data: CreateVendorResponseRequest): Promise<ReviewDetail> {
    const response = await api.post<{ data: ReviewDetail }>(
      `${prefix()}/${reviewId}/response`,
      data
    )
    return response.data.data
  },

  /**
   * Update vendor response
   */
  async updateResponse(reviewId: number, data: CreateVendorResponseRequest): Promise<ReviewDetail> {
    const response = await api.put<{ data: ReviewDetail }>(
      `${prefix()}/${reviewId}/response`,
      data
    )
    return response.data.data
  },

  /**
   * Delete vendor response
   */
  async deleteResponse(reviewId: number): Promise<void> {
    await api.delete(`${prefix()}/${reviewId}/response`)
  },

  // ─────────────────────────────────────────────────────────────────
  // Product Reviews (for product detail page)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: number, params?: ReviewFilters): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>(
      `${getRolePrefix()}/products/${productId}/reviews`,
      { params }
    )
    return response.data
  },

  /**
   * Get review summary for a product
   */
  async getProductReviewSummary(productId: number): Promise<{
    average: number
    count: number
    distribution: Record<number, number>
  }> {
    const response = await api.get<{
      data: { average: number; count: number; distribution: Record<number, number> }
    }>(`${getRolePrefix()}/products/${productId}/reviews/summary`)
    return response.data.data
  },
}
