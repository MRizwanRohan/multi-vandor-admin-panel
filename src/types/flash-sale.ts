// ═══════════════════════════════════════════════════════════════════
// Flash Sale Types — Time-limited promotional sales
// ═══════════════════════════════════════════════════════════════════

export type FlashSaleStatus = 'active' | 'inactive' | 'upcoming' | 'ended'

export interface FlashSale {
  id: number
  name: string
  description?: string | null
  discount_percentage: number | null
  is_active: boolean
  starts_at: string
  ends_at: string
  status?: FlashSaleStatus
  products_count?: number
  created_at: string
  updated_at: string
}

export interface FlashSaleProduct {
  id: number
  product_id: number
  flash_sale_id: number
  flash_price: number
  flash_quantity: number
  sold_quantity: number
  product?: {
    id: number
    name: string
    slug: string
    price: number
    image?: string | null
    stock_quantity?: number
  }
}

export interface FlashSaleDetail extends FlashSale {
  products: FlashSaleProduct[]
  stats?: FlashSaleProductStats
}

export interface FlashSaleProductStats {
  product_count: number
  total_quantity: number
  sold_quantity: number
  remaining_quantity: number
  sell_through_rate: number
  revenue: number
  customer_savings: number
  status: FlashSaleStatus
  time_remaining?: string | null
}

export interface FlashSaleStats {
  total_flash_sales: number
  active_flash_sales: number
  upcoming_flash_sales: number
  ended_this_month: number
  total_products_on_sale: number
  total_sold_this_month: number
}

// ── DTOs ──
export interface FlashSaleProductInput {
  product_id: number
  flash_price: number
  quantity_limit?: number | null
}

export interface CreateFlashSaleRequest {
  name: string
  description?: string | null
  discount_percentage: number
  starts_at: string
  ends_at: string
  is_active?: boolean
  products?: FlashSaleProductInput[]
}

export interface UpdateFlashSaleRequest extends Partial<CreateFlashSaleRequest> {}

export interface FlashSaleFilters {
  page?: number
  per_page?: number
  status?: FlashSaleStatus
  search?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface ConflictCheckRequest {
  product_ids: number[]
  starts_at: string
  ends_at: string
  exclude_flash_sale_id?: number
}

export interface ConflictCheckResponse {
  has_conflicts: boolean
  conflicts: Array<{
    product_id: number
    product_name: string
    flash_sale_id: number
    flash_sale_name: string
    starts_at: string
    ends_at: string
  }>
}

// ── Public ──
export interface FlashSalePublic {
  id: number
  name: string
  description?: string | null
  starts_at: string
  ends_at: string
  time_remaining?: string
  products: Array<{
    product_id: number
    product: {
      id: number
      name: string
      slug: string
      image?: string
      original_price: number
    }
    flash_price: number
    discount_percentage: number
    quantity_remaining?: number | null
  }>
}

export interface ProductFlashPriceResponse {
  has_flash_sale: boolean
  flash_price?: number
  original_price?: number
  discount_percentage?: number
  ends_at?: string
  quantity_remaining?: number | null
}
