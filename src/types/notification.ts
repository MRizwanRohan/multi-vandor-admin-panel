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
  orderId?: number
  orderNumber?: string
  status?: string
  previousStatus?: string
  trackingNumber?: string
  productId?: number
  productName?: string
  productSlug?: string
  reviewId?: number
  rating?: number
  vendorId?: number
  vendorName?: string
  payoutId?: number
  amount?: number
  currentStock?: number
  threshold?: number
  disputeId?: number
  categoryName?: string
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
  actionUrl: string | null
  actionText: string | null
  metadata: NotificationMetadata
  readAt: string | null
  createdAt: string
}

/**
 * Email notification preferences
 */
export interface EmailPreferences {
  promotional: boolean
  newProducts: boolean
  specialOffers: boolean
  wishlistAlerts: boolean
  newsletter: boolean
  // Vendor-only (null for customers)
  newOrders?: boolean | null
  payout?: boolean | null
}

/**
 * In-app notification preferences
 */
export interface InAppPreferences {
  orderUpdates: boolean
  reviews: boolean
  stockAlerts: boolean
  // Vendor-only (null for customers)
  newOrders?: boolean | null
  lowStock?: boolean | null
  returnRequests?: boolean | null
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
  currentPage: number
  perPage: number
  total: number
  lastPage: number
  unreadCount: number
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
  userIds: string[]
  title: string
  message: string
  type: string
  actionUrl?: string
  channels: ('database' | 'broadcast' | 'mail')[]
}

/**
 * Email log entry — matches GET /admin/email-logs response
 */
export interface EmailLog {
  id: number
  recipientEmail: string
  emailType: string
  subject: string
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'
  sentAt: string | null
  deliveredAt: string | null
  errorMessage: string | null
  createdAt: string
}

/**
 * Email log query filters
 */
export interface EmailLogFilters {
  status?: EmailLog['status']
  emailType?: string
  userId?: string
  perPage?: number
  page?: number
}
