// ═══════════════════════════════════════════════════════════════════
// Payment Types — Payment Gateway, Transaction, Refund, Webhook
// Strategy Pattern: Gateway interface + concrete implementations
// ═══════════════════════════════════════════════════════════════════

// ── Payment Gateway (Strategy Pattern) ──

export type PaymentGatewayType = 'stripe' | 'paypal' | 'sslcommerz' | 'cod'

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export type RefundStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type WebhookStatus =
  | 'received'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'ignored'

// ── Payment Gateway Config ──

export interface PaymentGatewayConfig {
  id: number
  gateway: PaymentGatewayType
  name: string
  display_name: string
  description: string | null
  icon: string | null
  is_enabled: boolean
  is_default: boolean
  supported_currencies: string[]
  min_amount: number | null
  max_amount: number | null
  test_mode: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ── Payment Transaction ──

export interface PaymentTransaction {
  id: number
  transaction_id: string
  order_id: number
  order_number: string
  gateway: PaymentGatewayType
  gateway_display: string
  status: TransactionStatus
  amount: number
  currency: string
  fee: number
  net_amount: number
  customer: PaymentCustomer
  vendor: PaymentVendor | null
  metadata: Record<string, unknown> | null
  gateway_response: Record<string, unknown> | null
  paid_at: string | null
  failed_at: string | null
  failure_reason: string | null
  created_at: string
  updated_at: string
}

export interface PaymentTransactionDetail extends PaymentTransaction {
  order: PaymentOrderSummary
  refunds: PaymentRefund[]
  webhook_events: WebhookEvent[]
  timeline: PaymentTimelineEvent[]
  gateway_data: GatewaySpecificData | null
}

export interface PaymentCustomer {
  id: number
  name: string
  email: string
  phone: string | null
}

export interface PaymentVendor {
  id: number
  store_name: string
  logo_url: string | null
}

export interface PaymentOrderSummary {
  id: number
  order_number: string
  status: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  item_count: number
  placed_at: string
}

export interface PaymentTimelineEvent {
  id: number
  type: 'created' | 'processing' | 'completed' | 'failed' | 'refunded' | 'webhook' | 'note'
  title: string
  description: string | null
  amount: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ── Gateway-Specific Data (Stripe, PayPal, SSLCommerz) ──

export interface GatewaySpecificData {
  // Stripe
  stripe_payment_intent_id?: string
  stripe_charge_id?: string
  stripe_customer_id?: string
  stripe_payment_method_id?: string
  stripe_receipt_url?: string

  // PayPal
  paypal_order_id?: string
  paypal_capture_id?: string
  paypal_payer_id?: string
  paypal_payer_email?: string

  // SSLCommerz
  sslcommerz_session_key?: string
  sslcommerz_tran_id?: string
  sslcommerz_val_id?: string
  sslcommerz_bank_tran_id?: string
  sslcommerz_card_type?: string
  sslcommerz_card_brand?: string

  // Generic
  [key: string]: unknown
}

// ── Payment Refund ──

export interface PaymentRefund {
  id: number
  refund_id: string
  transaction_id: number
  transaction_ref: string
  order_id: number
  order_number: string
  gateway: PaymentGatewayType
  status: RefundStatus
  amount: number
  currency: string
  reason: string
  reason_category: RefundReasonCategory
  items: RefundItem[] | null
  restock_items: boolean
  customer: PaymentCustomer
  vendor: PaymentVendor | null
  processed_by: string | null
  processed_at: string | null
  gateway_refund_id: string | null
  failure_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type RefundReasonCategory =
  | 'customer_request'
  | 'defective_product'
  | 'wrong_item'
  | 'not_received'
  | 'duplicate_charge'
  | 'fraudulent'
  | 'other'

export interface RefundItem {
  order_item_id: number
  product_name: string
  quantity: number
  amount: number
}

// ── Webhook Events ──

export interface WebhookEvent {
  id: number
  event_id: string
  gateway: PaymentGatewayType
  event_type: string
  status: WebhookStatus
  payload: Record<string, unknown>
  response: Record<string, unknown> | null
  ip_address: string | null
  processed_at: string | null
  failure_reason: string | null
  retry_count: number
  max_retries: number
  related_transaction_id: number | null
  related_order_id: number | null
  created_at: string
  updated_at: string
}

// ── Request DTOs ──

export interface InitiatePaymentRequest {
  order_id: number
  gateway: PaymentGatewayType
  return_url?: string
  cancel_url?: string
  metadata?: Record<string, unknown>
}

export interface InitiatePaymentResponse {
  transaction_id: string
  gateway: PaymentGatewayType
  status: TransactionStatus
  redirect_url: string | null
  client_secret: string | null
  requires_action: boolean
  amount: number
  currency: string
}

export interface CreateRefundRequest {
  transaction_id: number
  amount: number
  reason: string
  reason_category: RefundReasonCategory
  items?: { order_item_id: number; quantity: number }[]
  restock_items?: boolean
  notes?: string
}

export interface RetryWebhookRequest {
  webhook_id: number
}

// ── Filter/Query Params ──

export interface PaymentTransactionFilters {
  search?: string
  gateway?: PaymentGatewayType
  status?: TransactionStatus
  customer_id?: number
  vendor_id?: number
  order_id?: number
  min_amount?: number
  max_amount?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface RefundFilters {
  search?: string
  gateway?: PaymentGatewayType
  status?: RefundStatus
  reason_category?: RefundReasonCategory
  customer_id?: number
  vendor_id?: number
  min_amount?: number
  max_amount?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface WebhookFilters {
  gateway?: PaymentGatewayType
  status?: WebhookStatus
  event_type?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

// ── Statistics ──

export interface PaymentStatistics {
  total_transactions: number
  total_revenue: number
  total_fees: number
  total_net: number
  total_refunded: number
  success_rate: number
  by_gateway: GatewayStats[]
  by_status: { status: TransactionStatus; count: number; amount: number }[]
  revenue_by_day: { date: string; amount: number; count: number }[]
  refund_rate: number
  average_transaction: number
}

export interface GatewayStats {
  gateway: PaymentGatewayType
  display_name: string
  transaction_count: number
  total_amount: number
  total_fees: number
  success_rate: number
  refund_count: number
  refund_amount: number
}

export interface RefundStatistics {
  total_refunds: number
  total_amount: number
  pending_count: number
  pending_amount: number
  completed_count: number
  completed_amount: number
  by_reason: { reason: RefundReasonCategory; count: number; amount: number }[]
  by_gateway: { gateway: PaymentGatewayType; count: number; amount: number }[]
  average_processing_time: number // in hours
}

export interface WebhookStatistics {
  total_events: number
  processed_count: number
  failed_count: number
  pending_count: number
  by_gateway: { gateway: PaymentGatewayType; count: number }[]
  by_event_type: { event_type: string; count: number }[]
  success_rate: number
  average_processing_time: number // in ms
}
