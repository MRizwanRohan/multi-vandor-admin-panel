// ═══════════════════════════════════════════════════════════════════
// Review Types
// ═══════════════════════════════════════════════════════════════════

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export interface Review {
  id: number
  product_id: number
  product_name: string
  product_slug: string
  product_image: string | null
  customer_id: number
  customer_name: string
  customer_avatar: string | null
  vendor_id: number
  rating: number
  title: string | null
  content: string
  images: ReviewImage[]
  status: ReviewStatus
  is_verified_purchase: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface ReviewDetail extends Review {
  vendor_response: VendorResponse | null
}

export interface ReviewImage {
  id: number
  url: string
  alt_text: string | null
}

export interface VendorResponse {
  id: number
  content: string
  responded_at: string
}

// ── DTOs ──
export interface CreateReviewRequest {
  product_id: number
  rating: number
  title?: string
  content: string
  images?: File[]
}

export interface CreateVendorResponseRequest {
  content: string
}

export interface ReviewListParams {
  page?: number
  per_page?: number
  product_id?: number
  vendor_id?: number
  customer_id?: number
  rating?: number
  min_rating?: number
  max_rating?: number
  status?: ReviewStatus
  has_response?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}
