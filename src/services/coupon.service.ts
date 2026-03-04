// ═══════════════════════════════════════════════════════════════════
// Coupon Service — Coupon API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  Coupon,
  CouponDetail,
  CouponStats,
  CreateCouponRequest,
  UpdateCouponRequest,
  BulkCreateCouponRequest,
  CouponFilters,
  CouponUsage,
  ValidateCouponRequest,
  ValidateCouponResponse,
  ApplyCouponRequest,
  ApplyCouponResponse,
} from '@/types'
import type { PaginatedResponse } from '@/types'

export type { CouponFilters, CouponStats, ValidateCouponRequest, ValidateCouponResponse }

export const couponService = {
  // ═══════════════════════════════════════════════════════════════════
  // Admin: Coupon Management — /admin/coupons
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get paginated coupons
   */
  async getAll(params?: CouponFilters): Promise<PaginatedResponse<Coupon>> {
    const response = await api.get<PaginatedResponse<Coupon>>('/admin/coupons', { params })
    return response.data
  },

  /**
   * Get coupon statistics
   */
  async getStats(): Promise<CouponStats> {
    const response = await api.get<{ data: CouponStats }>('/admin/coupons/stats')
    return response.data.data
  },

  /**
   * Generate unique coupon code
   */
  async generateCode(length: number = 8): Promise<string> {
    const response = await api.get<{ data: { code: string } }>('/admin/coupons/generate-code', {
      params: { length },
    })
    return response.data.data.code
  },

  /**
   * Validate coupon code (admin testing)
   */
  async validate(data: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    const response = await api.post<{ data: ValidateCouponResponse }>('/admin/coupons/validate', data)
    return response.data.data
  },

  /**
   * Bulk create coupons with auto-generated codes
   */
  async bulkCreate(data: BulkCreateCouponRequest): Promise<{ count: number; coupons: Coupon[] }> {
    const response = await api.post<{ data: { count: number; coupons: Coupon[] } }>(
      '/admin/coupons/bulk',
      data
    )
    return response.data.data
  },

  /**
   * Get single coupon with usage stats
   */
  async getById(id: number): Promise<{ coupon: CouponDetail; stats: CouponDetail['stats'] }> {
    const response = await api.get<{ data: { coupon: CouponDetail; stats: CouponDetail['stats'] } }>(
      `/admin/coupons/${id}`
    )
    return response.data.data
  },

  /**
   * Create coupon
   */
  async create(data: CreateCouponRequest): Promise<Coupon> {
    const response = await api.post<{ data: Coupon }>('/admin/coupons', data)
    return response.data.data
  },

  /**
   * Update coupon
   */
  async update(id: number, data: UpdateCouponRequest): Promise<Coupon> {
    const response = await api.put<{ data: Coupon }>(`/admin/coupons/${id}`, data)
    return response.data.data
  },

  /**
   * Delete coupon
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/coupons/${id}`)
  },

  /**
   * Toggle coupon active status
   */
  async toggle(id: number): Promise<Coupon> {
    const response = await api.put<{ data: Coupon }>(`/admin/coupons/${id}/toggle`)
    return response.data.data
  },

  // ═══════════════════════════════════════════════════════════════════
  // Customer: Coupon Usage — /customer/coupons
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Validate coupon for customer
   */
  async customerValidate(code: string, subtotal: number): Promise<ValidateCouponResponse> {
    const response = await api.post<{ data: ValidateCouponResponse }>('/customer/coupons/validate', {
      code,
      subtotal,
    })
    return response.data.data
  },

  /**
   * Apply coupon to cart
   */
  async apply(data: ApplyCouponRequest): Promise<ApplyCouponResponse> {
    const response = await api.post<{ data: ApplyCouponResponse }>('/customer/coupons/apply', data)
    return response.data.data
  },

  /**
   * Get available coupons for customer
   */
  async getAvailable(subtotal?: number): Promise<Coupon[]> {
    const response = await api.get<{ data: Coupon[] }>('/customer/coupons/available', {
      params: subtotal ? { subtotal } : undefined,
    })
    return response.data.data
  },

  // ═══════════════════════════════════════════════════════════════════
  // Vendor: Coupon Management — /vendor/coupons
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get vendor's coupons
   */
  async getVendorCoupons(params?: CouponFilters): Promise<PaginatedResponse<Coupon>> {
    const response = await api.get<PaginatedResponse<Coupon>>('/vendor/coupons', { params })
    return response.data
  },

  /**
   * Get vendor coupon stats
   */
  async getVendorStats(): Promise<CouponStats> {
    const response = await api.get<{ data: CouponStats }>('/vendor/coupons/stats')
    return response.data.data
  },

  /**
   * Create vendor coupon
   */
  async createVendorCoupon(data: CreateCouponRequest): Promise<Coupon> {
    const response = await api.post<{ data: Coupon }>('/vendor/coupons', data)
    return response.data.data
  },

  /**
   * Update vendor coupon
   */
  async updateVendorCoupon(id: number, data: UpdateCouponRequest): Promise<Coupon> {
    const response = await api.put<{ data: Coupon }>(`/vendor/coupons/${id}`, data)
    return response.data.data
  },

  /**
   * Delete vendor coupon
   */
  async deleteVendorCoupon(id: number): Promise<void> {
    await api.delete(`/vendor/coupons/${id}`)
  },

  /**
   * Toggle vendor coupon status
   */
  async toggleVendorCoupon(id: number): Promise<Coupon> {
    const response = await api.put<{ data: Coupon }>(`/vendor/coupons/${id}/toggle`)
    return response.data.data
  },
}
