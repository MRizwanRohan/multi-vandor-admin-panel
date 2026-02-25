// ═══════════════════════════════════════════════════════════════════
// Coupon Service — Coupon API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  Coupon,
  CouponDetail,
  CouponStatus,
  CouponType,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponListParams,
  CouponUsage,
} from '@/types'
import type { PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/coupons`

export interface CouponFilters extends CouponListParams {
  vendor_id?: number
  expired?: boolean
}

export interface CouponStats {
  total: number
  active: number
  expired: number
  total_usage: number
  total_discount_given: number
}

export interface ValidateCouponRequest {
  code: string
  order_amount: number
  product_ids?: number[]
  category_ids?: number[]
}

export interface ValidateCouponResponse {
  valid: boolean
  coupon: Coupon | null
  discount_amount: number
  message?: string
}

export const couponService = {
  /**
   * Get paginated coupons
   */
  async getAll(params?: CouponFilters): Promise<PaginatedResponse<Coupon>> {
    const response = await api.get<PaginatedResponse<Coupon>>(prefix(), { params })
    return response.data
  },

  /**
   * Get single coupon
   */
  async getById(id: number): Promise<CouponDetail> {
    const response = await api.get<{ data: CouponDetail }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Get coupon by code
   */
  async getByCode(code: string): Promise<CouponDetail> {
    const response = await api.get<{ data: CouponDetail }>(`${prefix()}/code/${code}`)
    return response.data.data
  },

  /**
   * Get coupon statistics
   */
  async getStats(): Promise<CouponStats> {
    const response = await api.get<{ data: CouponStats }>(`${prefix()}/stats`)
    return response.data.data
  },

  /**
   * Create coupon
   */
  async create(data: CreateCouponRequest): Promise<Coupon> {
    const response = await api.post<{ data: Coupon }>(prefix(), data)
    return response.data.data
  },

  /**
   * Update coupon
   */
  async update(id: number, data: Partial<UpdateCouponRequest>): Promise<Coupon> {
    const response = await api.put<{ data: Coupon }>(`${prefix()}/${id}`, data)
    return response.data.data
  },

  /**
   * Delete coupon
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: number): Promise<Coupon> {
    const response = await api.patch<{ data: Coupon }>(`${prefix()}/${id}/toggle-active`)
    return response.data.data
  },

  /**
   * Update status
   */
  async updateStatus(id: number, status: CouponStatus): Promise<Coupon> {
    const response = await api.patch<{ data: Coupon }>(`${prefix()}/${id}/status`, { status })
    return response.data.data
  },

  /**
   * Validate coupon code
   */
  async validate(data: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    const response = await api.post<{ data: ValidateCouponResponse }>(`${prefix()}/validate`, data)
    return response.data.data
  },

  /**
   * Generate unique coupon code
   */
  async generateCode(type: CouponType = 'percentage'): Promise<string> {
    const response = await api.get<{ data: { code: string } }>(`${prefix()}/generate-code`, {
      params: { type },
    })
    return response.data.data.code
  },

  /**
   * Get coupon usage history
   */
  async getUsageHistory(id: number, params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<CouponUsage>> {
    const response = await api.get<PaginatedResponse<CouponUsage>>(
      `${prefix()}/${id}/usage`,
      { params }
    )
    return response.data
  },

  /**
   * Bulk delete coupons
   */
  async bulkDelete(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-delete`,
      { ids }
    )
    return response.data.data
  },

  /**
   * Bulk activate coupons
   */
  async bulkActivate(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-activate`,
      { ids }
    )
    return response.data.data
  },

  /**
   * Bulk deactivate coupons
   */
  async bulkDeactivate(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-deactivate`,
      { ids }
    )
    return response.data.data
  },

  /**
   * Duplicate coupon
   */
  async duplicate(id: number): Promise<Coupon> {
    const response = await api.post<{ data: Coupon }>(`${prefix()}/${id}/duplicate`)
    return response.data.data
  },

  /**
   * Export coupons
   */
  async export(params?: CouponFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/export`, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
