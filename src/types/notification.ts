// ═══════════════════════════════════════════════════════════════════
// Notification Types — Matches backend API contract
// ═══════════════════════════════════════════════════════════════════

/**
 * Notification type categories from backend
 */
export type NotificationType =
  | 'order_status_changed'
  | 'order_placed'
  | 'review_approved'
  | 'review_replied'
  | 'product_approved'
  | 'product_rejected'
  | 'product_low_stock'
  | 'product_back_in_stock'
  | 'vendor_approved'
  | 'vendor_rejected'
  | 'vendor_registered'
  | 'payout_processed'
  | 'return_requested'
  | 'dispute_escalated'
  | 'category_requested'
  | 'system'
  | 'promotional'

/**
 * Notification icon names (Heroicons)
 */
export type NotificationIcon =
  | 'check-circle'
  | 'clock'
  | 'truck'
  | 'package-check'
  | 'x-circle'
  | 'star'
  | 'shopping-bag'
  | 'exclamation-triangle'
  | 'building-storefront'
  | 'banknotes'
  | 'arrow-uturn-left'
  | 'shield-exclamation'
  | 'tag'
  | 'bell'
  | 'megaphone'

/**
 * Notification color scheme
 */
export type NotificationColor = 'blue' | 'green' | 'red' | 'yellow' | 'indigo' | 'gray' | 'purple' | 'orange'

/**
 * Notification metadata (varies by type)
 */
export interface NotificationMetadata {
  order_id?: number
  order_number?: string
  status?: string
  previous_status?: string
  tracking_number?: string
  product_id?: number
  product_name?: string
  product_slug?: string
  review_id?: number
  rating?: number
  vendor_id?: number
  vendor_name?: string
  payout_id?: number
  amount?: number
  current_stock?: number
  threshold?: number
  dispute_id?: number
  category_name?: string
  reason?: string
  [key: string]: unknown
}

/**
 * Single notification item — matches GET /notifications response
 */
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  icon: NotificationIcon | string
  color: NotificationColor | string
  action_url: string | null
  action_text: string | null
  metadata: NotificationMetadata
  read_at: string | null
  created_at: string
}

/**
 * Email notification preferences
 */
export interface EmailPreferences {
  promotional: boolean
  new_products: boolean
  special_offers: boolean
  wishlist_alerts: boolean
  newsletter: boolean
  // Vendor-only (null for customers)
  new_orders?: boolean | null
  payout?: boolean | null
}

/**
 * In-app notification preferences
 */
export interface InAppPreferences {
  order_updates: boolean
  reviews: boolean
  stock_alerts: boolean
  // Vendor-only (null for customers)
  new_orders?: boolean | null
  low_stock?: boolean | null
  return_requests?: boolean | null
}

/**
 * Push notification preferences
 */
export interface PushPreferences {
  enabled: boolean
}

/**
 * Full notification preferences — matches GET /notifications/preferences
 */
export interface NotificationPreferences {
  email: EmailPreferences
  inapp: InAppPreferences
  push: PushPreferences
}

/**
 * Update preferences request — flat keys matching PUT /notifications/preferences
 */
export interface UpdateNotificationPreferencesPayload {
  // Email
  email_promotional?: boolean
  email_new_products?: boolean
  email_special_offers?: boolean
  email_wishlist_alerts?: boolean
  email_newsletter?: boolean
  email_new_orders?: boolean
  email_payout?: boolean
  // In-app
  inapp_order_updates?: boolean
  inapp_reviews?: boolean
  inapp_stock_alerts?: boolean
  inapp_new_orders?: boolean
  inapp_low_stock?: boolean
  inapp_return_requests?: boolean
  // Push
  push_enabled?: boolean
}

/**
 * Notification list query params
 */
export interface NotificationFilters {
  page?: number
  per_page?: number
  unread_only?: boolean
}

/**
 * Notification list meta from paginated response
 */
export interface NotificationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
  unread_count: number
}

/**
 * Admin broadcast notification request
 */
export interface BroadcastNotificationPayload {
  title: string
  message: string
  type: 'info' | 'warning' | 'promotional'
  roles: ('customer' | 'vendor')[]
  channels: ('database' | 'broadcast' | 'mail')[]
}

/**
 * Admin send notification to specific users
 */
export interface SendNotificationPayload {
  user_ids: string[]
  title: string
  message: string
  type: string
  action_url?: string
  channels: ('database' | 'broadcast' | 'mail')[]
}

/**
 * Email log entry — matches GET /admin/email-logs response
 */
export interface EmailLog {
  id: number
  recipient_email: string
  email_type: string
  subject: string
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'
  sent_at: string | null
  delivered_at: string | null
  error_message: string | null
  created_at: string
}

/**
 * Email log query filters
 */
export interface EmailLogFilters {
  status?: EmailLog['status']
  email_type?: string
  user_id?: string
  per_page?: number
  page?: number
}
