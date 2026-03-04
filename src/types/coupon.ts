// ═══════════════════════════════════════════════════════════════════
// Coupon Types — Marketing coupon system
// ═══════════════════════════════════════════════════════════════════

export type CouponType = 'percentage' | 'fixed' | 'free_shipping'
export type CouponStatus = 'active' | 'inactive' | 'expired' | 'scheduled'

export interface Coupon {
  id: number
  code: string
  name: string
  description?: string | null
  type: CouponType
  value: number
  discount_value?: number // alias
  min_order_amount: number | null
  max_discount: number | null
  max_discount_amount?: number | null // alias
  usage_limit: number | null
  used_count: number
  per_user_limit: number | null
  per_customer_limit?: number | null // alias
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  status: CouponStatus
  vendor_id?: number | null
  vendor?: {
    id: number
    shop_name: string
  } | null
  created_by?: number | null
  created_at: string
  updated_at: string
}

export interface CouponDetail extends Coupon {
  usages: CouponUsage[]
  stats?: {
    total_uses: number
    unique_users: number
    total_discount_given: number
    average_order_value: number
    usage_by_date: Array<{
      date: string
      count: number
      total_discount: number
    }>
  }
}

export interface CouponUsage {
  id: number
  coupon_id: number
  order_id: number
  order_number?: string
  user_id: number
  customer_id?: number
  customer_name?: string
  user?: {
    id: number
    name: string
  }
  order?: {
    id: number
    order_number: string
  }
  discount_amount: number
  order_total: number
  used_at?: string
  created_at: string
}

// ── Stats ──
export interface CouponStats {
  total_coupons: number
  total?: number
  active_coupons: number
  active?: number
  expired_coupons: number
  expired?: number
  total_uses_this_month: number
  total_usage?: number
  total_discount_this_month: number
  total_discount_given?: number
  top_coupons: Array<{
    id: number
    code: string
    name: string
    used_count: number
  }>
}

// ── DTOs ──
export interface CreateCouponRequest {
  code?: string
  name: string
  description?: string
  type: CouponType
  value: number
  min_order_amount?: number | null
  max_discount?: number | null
  usage_limit?: number | null
  per_user_limit?: number | null
  starts_at?: string | null
  ends_at?: string | null
  expires_at?: string | null
  is_active?: boolean
  vendor_id?: number | null
  category_ids?: number[]
  product_ids?: number[]
}

export interface UpdateCouponRequest extends Partial<Omit<CreateCouponRequest, 'code'>> {
  id?: number
}

export interface BulkCreateCouponRequest extends Omit<CreateCouponRequest, 'code'> {
  count: number
}

export interface CouponFilters {
  page?: number
  per_page?: number
  search?: string
  type?: CouponType
  status?: CouponStatus
  vendor_id?: number
  is_active?: boolean
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface ValidateCouponRequest {
  code: string
  subtotal: number
  user_id?: number
}

export interface ValidateCouponResponse {
  valid: boolean
  error?: string
  error_code?: string
  coupon?: Coupon
  discount?: number
  subtotal_after_discount?: number
}

export interface ApplyCouponRequest {
  code: string
  subtotal: number
  shipping_cost?: number
}

export interface ApplyCouponResponse {
  coupon: Coupon
  discount_amount: number
  free_shipping: boolean
  subtotal: number
  final_total: number
}
