// ═══════════════════════════════════════════════════════════════════
// Newsletter Types — Email subscription management
// ═══════════════════════════════════════════════════════════════════

export type SubscriberStatus = 'active' | 'inactive' | 'verified' | 'unverified'
export type SubscriptionSource = 'website' | 'checkout' | 'popup' | 'import' | 'admin'

export interface NewsletterSubscriber {
  id: number
  email: string
  name?: string | null
  source: SubscriptionSource | string
  is_active: boolean
  verified_at?: string | null
  subscribed_at?: string | null
  unsubscribed_at?: string | null
  resubscribed_at?: string | null
  status?: SubscriberStatus
  created_at: string
  updated_at: string
}

export interface NewsletterStats {
  total_subscribers: number
  active_subscribers: number
  verified_subscribers: number
  unverified: number
  unsubscribed: number
  this_month: number
  growth_rate: number
  by_source: Record<string, number>
  recent_subscribers: NewsletterSubscriber[]
}

// ── DTOs ──
export interface CreateSubscriberRequest {
  email: string
  name?: string | null
  skip_verification?: boolean
}

export interface UpdateSubscriberRequest {
  name?: string | null
  is_active?: boolean
}

export interface SubscriberFilters {
  page?: number
  per_page?: number
  status?: SubscriberStatus
  source?: SubscriptionSource | string
  search?: string
  subscribed_from?: string
  subscribed_to?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface BulkSubscriberRequest {
  subscriber_ids: number[]
}

export interface ImportSubscribersResponse {
  imported_count: number
  skipped_count: number
  errors: string[]
}

// ── Public Subscribe ──
export interface SubscribeRequest {
  email: string
  name?: string
}

export interface SubscribeResponse {
  subscribed?: boolean
  already_subscribed?: boolean
  verification_required?: boolean
}

export interface UnsubscribeRequest {
  email?: string
  token?: string
}

// ── Source Options ──
export const SUBSCRIPTION_SOURCES: Array<{ value: SubscriptionSource; label: string }> = [
  { value: 'website', label: 'Website' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'popup', label: 'Popup' },
  { value: 'import', label: 'Import' },
  { value: 'admin', label: 'Admin' },
]
