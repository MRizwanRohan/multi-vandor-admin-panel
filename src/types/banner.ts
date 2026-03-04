// ═══════════════════════════════════════════════════════════════════
// Banner Types — Promotional banner management
// ═══════════════════════════════════════════════════════════════════

export type BannerPosition =
  | 'homepage_hero'
  | 'homepage_secondary'
  | 'category_top'
  | 'category_sidebar'
  | 'product_sidebar'
  | 'checkout'
  | 'popup'

export type BannerStatus = 'active' | 'inactive' | 'expired' | 'scheduled'

export interface Banner {
  id: number
  title: string
  subtitle?: string | null
  image_url: string
  link_url?: string | null
  link_text?: string | null
  position: BannerPosition
  display_order: number
  is_active: boolean
  starts_at?: string | null
  expires_at?: string | null
  background_color?: string | null
  text_color?: string | null
  metadata?: Record<string, any> | null
  status?: BannerStatus
  created_at: string
  updated_at: string
}

export interface BannerPosition {
  value: string
  label: string
  count?: number
}

export interface BannerStats {
  total_banners: number
  active_banners: number
  inactive_banners: number
  by_position: Record<string, number>
}

// ── DTOs ──
export interface CreateBannerRequest {
  title: string
  subtitle?: string | null
  position: BannerPosition
  link_url?: string | null
  link_text?: string | null
  image?: File
  image_url?: string | null
  display_order?: number
  background_color?: string | null
  text_color?: string | null
  starts_at?: string | null
  ends_at?: string | null
  expires_at?: string | null
  is_active?: boolean
  metadata?: Record<string, any>
}

export interface UpdateBannerRequest extends Partial<CreateBannerRequest> {}

export interface BannerFilters {
  page?: number
  per_page?: number
  position?: BannerPosition | string
  status?: BannerStatus
  search?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface ReorderBannersRequest {
  position: BannerPosition | string
  banner_ids: number[]
}

export interface BulkBannerRequest {
  banner_ids: number[]
}

// ── Position Options ──
export const BANNER_POSITIONS: Array<{ value: BannerPosition; label: string }> = [
  { value: 'homepage_hero', label: 'Homepage Hero' },
  { value: 'homepage_secondary', label: 'Homepage Secondary' },
  { value: 'category_top', label: 'Category Top' },
  { value: 'category_sidebar', label: 'Category Sidebar' },
  { value: 'product_sidebar', label: 'Product Sidebar' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'popup', label: 'Popup' },
]
