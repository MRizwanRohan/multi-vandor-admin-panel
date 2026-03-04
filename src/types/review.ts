// ═══════════════════════════════════════════════════════════════════
// Review Types — Review & Rating system types
// ═══════════════════════════════════════════════════════════════════

export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type VoteType = 'helpful' | 'not_helpful'

export interface Review {
  id: number
  product_id: number
  product_name?: string
  product_slug?: string
  product_image?: string | null
  user_id: number
  customer_id?: number
  customer_name?: string
  customer_avatar?: string | null
  order_id?: number | null
  vendor_id?: number
  rating: number
  title: string | null
  comment: string | null
  content?: string // alias for comment
  images: ReviewImage[]
  status: ReviewStatus
  is_verified_purchase: boolean
  helpful_count: number
  reported_count?: number
  admin_notes?: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  // Relationships
  user?: {
    id: number
    name: string
    avatar?: string | null
  }
  product?: {
    id: number
    name: string
    slug: string
    image?: string
    vendor?: {
      id: number
      shop_name: string
    }
  }
  responses?: ReviewResponse[]
  vendor_response?: ReviewResponse | null
  user_vote?: VoteType | null
}

export interface ReviewDetail extends Review {
  order?: {
    id: number
    order_number: string
  }
  votes?: ReviewVote[]
}

export interface ReviewImage {
  id: number
  url: string
  image_url?: string
  display_order?: number
  alt_text?: string | null
}

export interface ReviewResponse {
  id: number
  review_id: number
  responder_id: number
  response: string
  content?: string // alias
  responder?: {
    id: number
    name: string
  }
  responded_at?: string
  created_at: string
  updated_at?: string
}

export interface ReviewVote {
  id: number
  review_id: number
  user_id: number
  vote_type: VoteType
  created_at: string
}

// ── Stats ──
export interface ReviewStats {
  total: number
  total_reviews?: number
  pending: number
  approved: number
  rejected: number
  today?: number
  this_week?: number
  this_month?: number
  average_rating: number
}

export interface VendorReviewStats {
  reviews: {
    total_reviews: number
    average_rating: number
    pending_reviews: number
    needs_response: number
    five_star: number
    four_star: number
    three_star: number
    two_star: number
    one_star: number
  }
  responses: {
    total_reviews: number
    responded: number
    response_rate: number
    needs_response: number
  }
}

export interface ProductReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    [key: string]: {
      count: number
      percentage: number
    }
  }
  verified_purchase_count: number
  with_images_count: number
}

// ── DTOs ──
export interface CreateReviewRequest {
  product_id: number
  order_id?: number
  rating: number
  title?: string
  comment: string
  images?: string[]
}

export interface UpdateReviewRequest {
  rating?: number
  title?: string
  comment?: string
  images?: string[]
}

export interface CreateResponseRequest {
  response: string
}

export interface VoteRequest {
  vote_type: VoteType
}

export interface ReviewFilters {
  page?: number
  per_page?: number
  product_id?: number
  vendor_id?: number
  user_id?: number
  rating?: number
  status?: ReviewStatus
  has_response?: boolean
  is_verified_purchase?: boolean
  from_date?: string
  to_date?: string
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  sort?: string
}
