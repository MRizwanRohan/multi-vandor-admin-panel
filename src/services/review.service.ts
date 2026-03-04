// ═══════════════════════════════════════════════════════════════════
// Review Service — Review & Rating API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  Review,
  ReviewDetail,
  ReviewStatus,
  ReviewFilters,
  ReviewStats,
  VendorReviewStats,
  ProductReviewStats,
  CreateResponseRequest,
  ReviewResponse,
} from '@/types'
import type { PaginatedResponse } from '@/types'

export type { ReviewFilters, ReviewStats }

export const reviewService = {
  // ═══════════════════════════════════════════════════════════════════
  // Admin: Review Management — /admin/reviews
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get paginated reviews (admin)
   */
  async getAll(params?: ReviewFilters): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>('/admin/reviews', { params })
    return response.data
  },

  /**
   * Get single review (admin)
   */
  async getById(id: number): Promise<ReviewDetail> {
    const response = await api.get<{ data: ReviewDetail }>(`/admin/reviews/${id}`)
    return response.data.data
  },

  /**
   * Get review statistics (admin)
   */
  async getStats(): Promise<ReviewStats> {
    const response = await api.get<{ data: ReviewStats }>('/admin/reviews/stats')
    return response.data.data
  },

  /**
   * Approve review (admin)
   */
  async approve(id: number, notes?: string): Promise<Review> {
    const response = await api.put<{ data: Review }>(`/admin/reviews/${id}/approve`, {
      admin_notes: notes,
    })
    return response.data.data
  },

  /**
   * Reject review (admin)
   */
  async reject(id: number, reason?: string): Promise<Review> {
    const response = await api.put<{ data: Review }>(`/admin/reviews/${id}/reject`, { reason })
    return response.data.data
  },

  /**
   * Delete review (admin)
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/reviews/${id}`)
  },

  /**
   * Bulk approve reviews (admin)
   */
  async bulkApprove(reviewIds: number[]): Promise<{ approved_count: number }> {
    const response = await api.put<{ data: { approved_count: number } }>(
      '/admin/reviews/bulk-approve',
      { review_ids: reviewIds }
    )
    return response.data.data
  },

  /**
   * Bulk reject reviews (admin)
   */
  async bulkReject(
    reviewIds: number[],
    reason?: string
  ): Promise<{ rejected_count: number }> {
    const response = await api.put<{ data: { rejected_count: number } }>(
      '/admin/reviews/bulk-reject',
      { review_ids: reviewIds, reason }
    )
    return response.data.data
  },

  /**
   * Delete vendor response (admin)
   */
  async deleteResponseAdmin(responseId: number): Promise<void> {
    await api.delete(`/admin/reviews/responses/${responseId}`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // Vendor: Review Management — /vendor/reviews
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get vendor's product reviews
   */
  async getVendorReviews(params?: ReviewFilters): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>('/vendor/reviews', { params })
    return response.data
  },

  /**
   * Get reviews needing vendor response
   */
  async getNeedsResponse(params?: { per_page?: number; page?: number }): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>(
      '/vendor/reviews/needs-response',
      { params }
    )
    return response.data
  },

  /**
   * Get single vendor review
   */
  async getVendorReviewById(id: number): Promise<ReviewDetail> {
    const response = await api.get<{ data: ReviewDetail }>(`/vendor/reviews/${id}`)
    return response.data.data
  },

  /**
   * Get vendor review statistics
   */
  async getVendorStats(): Promise<VendorReviewStats> {
    const response = await api.get<{ data: VendorReviewStats }>('/vendor/reviews/stats')
    return response.data.data
  },

  /**
   * Respond to a review (vendor)
   */
  async respond(reviewId: number, data: CreateResponseRequest): Promise<ReviewResponse> {
    const response = await api.post<{ data: ReviewResponse }>(
      `/vendor/reviews/${reviewId}/respond`,
      data
    )
    return response.data.data
  },

  /**
   * Update response (vendor)
   */
  async updateResponse(responseId: number, data: CreateResponseRequest): Promise<ReviewResponse> {
    const response = await api.put<{ data: ReviewResponse }>(
      `/vendor/reviews/responses/${responseId}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete response (vendor)
   */
  async deleteResponse(responseId: number): Promise<void> {
    await api.delete(`/vendor/reviews/responses/${responseId}`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // Product Reviews (public/customer)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get reviews for a product (public)
   */
  async getProductReviews(
    productId: number,
    params?: { per_page?: number; page?: number; sort?: string; rating?: number }
  ): Promise<{
    reviews: PaginatedResponse<Review>
    stats: ProductReviewStats
  }> {
    const response = await api.get<{
      data: { reviews: PaginatedResponse<Review>; stats: ProductReviewStats }
    }>(`/customer/products/${productId}/reviews`, { params })
    return response.data.data
  },

  /**
   * Check if user can review a product
   */
  async canReview(productId: number): Promise<{
    can_review: boolean
    is_verified_purchase?: boolean
    order_id?: number
    reason?: string
    existing_review_id?: number
  }> {
    const response = await api.get<{ data: any }>(`/customer/products/${productId}/can-review`)
    return response.data.data
  },

  /**
   * Get user's own reviews
   */
  async getMyReviews(params?: { per_page?: number; page?: number }): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>('/customer/reviews/my', { params })
    return response.data
  },

  /**
   * Create a review (customer)
   */
  async createReview(data: {
    product_id: number
    order_id?: number
    rating: number
    title?: string
    comment: string
    images?: string[]
  }): Promise<Review> {
    const response = await api.post<{ data: Review }>('/customer/reviews', data)
    return response.data.data
  },

  /**
   * Update a review (customer)
   */
  async updateReview(
    id: number,
    data: { rating?: number; title?: string; comment?: string; images?: string[] }
  ): Promise<Review> {
    const response = await api.put<{ data: Review }>(`/customer/reviews/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a review (customer)
   */
  async deleteReview(id: number): Promise<void> {
    await api.delete(`/customer/reviews/${id}`)
  },

  /**
   * Vote on a review (helpful/not helpful)
   */
  async vote(
    reviewId: number,
    voteType: 'helpful' | 'not_helpful'
  ): Promise<{
    action: 'created' | 'changed' | 'removed'
    vote_type?: string
    helpful_count: number
    not_helpful_count: number
  }> {
    const response = await api.post<{ data: any }>(`/customer/reviews/${reviewId}/vote`, {
      vote_type: voteType,
    })
    return response.data.data
  },

  /**
   * Remove vote from a review
   */
  async removeVote(reviewId: number): Promise<{
    action: 'removed'
    helpful_count: number
    not_helpful_count: number
  }> {
    const response = await api.delete<{ data: any }>(`/customer/reviews/${reviewId}/vote`)
    return response.data.data
  },
}
