// ═══════════════════════════════════════════════════════════════════
// Coupon Types
// ═══════════════════════════════════════════════════════════════════

export type CouponType = 'percentage' | 'fixed' | 'free_shipping'
export type CouponStatus = 'active' | 'inactive' | 'expired' | 'scheduled'

export interface Coupon {
  id: number
  code: string
  name: string
  type: CouponType
  discount_value: number
  min_order_amount: number | null
  max_discount_amount: number | null
  usage_limit: number | null
  per_customer_limit: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  status: CouponStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CouponDetail extends Coupon {
  description: string | null
  applicable_categories: number[]
  applicable_products: number[]
  applicable_vendors: number[]
  excluded_products: number[]
  first_order_only: boolean
  usages: CouponUsage[]
}

export interface CouponUsage {
  id: number
  coupon_id: number
  order_id: number
  order_number: string
  customer_id: number
  customer_name: string
  discount_amount: number
  used_at: string
}

// ── DTOs ──
export interface CreateCouponRequest {
  code?: string
  name: string
  type: CouponType
  discount_value: number
  description?: string
  min_order_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  per_customer_limit?: number
  starts_at?: string
  expires_at?: string
  is_active?: boolean
  applicable_categories?: number[]
  applicable_products?: number[]
  applicable_vendors?: number[]
  excluded_products?: number[]
  first_order_only?: boolean
}

export interface UpdateCouponRequest extends Partial<CreateCouponRequest> {
  id: number
}

export interface CouponListParams {
  page?: number
  per_page?: number
  search?: string
  type?: CouponType
  status?: CouponStatus
  is_active?: boolean
}
