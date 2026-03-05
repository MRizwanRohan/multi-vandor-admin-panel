// ═══════════════════════════════════════════════════════════════════
// Payment Types — Matches AdminPaymentController + PaymentTransactionResource
// ═══════════════════════════════════════════════════════════════════

// ── Enums ──

export type PaymentGatewayType = 'stripe' | 'paypal' | 'sslcommerz' | 'cod'

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export type RefundStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type WebhookStatus = 'success' | 'failed'

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

// ── Payment Transaction (from PaymentTransactionResource) ──

export interface PaymentTransaction {
  id: number
  transaction_id: string
  gateway_payment_id: string | null
  amount: number
  currency: string
  refund_amount: number
  gateway_fee: number
  net_amount: number
  payment_method: PaymentGatewayType
  status: TransactionStatus
  status_label: string
  failure_reason: string | null
  is_paid: boolean
  is_refunded: boolean
  refundable_amount: number
  paid_at: string | null
  created_at: string
  updated_at: string
  // Nested relations (loaded on list with basic info)
  order?: PaymentOrderSummary
  customer?: PaymentCustomer
  vendor?: PaymentVendor | null
  // Detail-only (loaded on show)
  timeline?: PaymentTimelineEvent[]
  refunds?: TransactionRefund[]
  gateway_response?: Record<string, unknown> | null
}

// Detail is same type, just with relations always loaded
export type PaymentTransactionDetail = PaymentTransaction

export interface PaymentCustomer {
  id: number
  name: string
  email: string
  phone: string | null
}

export interface PaymentVendor {
  id: number
  store_name: string
  store_slug: string
}

export interface PaymentOrderSummary {
  id: number
  order_number: string
  total_amount: number
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  status: string
  status_label: string
  payment_status: string
  payment_method: string
  coupon_code: string | null
  notes: string | null
  created_at: string
  items?: PaymentOrderItem[]
  items_count?: number
}

export interface PaymentOrderItem {
  id: number
  product_id: number
  product_name: string | null
  product_slug: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface PaymentTimelineEvent {
  old_status: string | null
  new_status: string
  notes: string | null
  changed_by: string | null
  created_at: string
}

// ── Embedded Refund (within PaymentTransactionResource.refunds[]) ──

export interface TransactionRefund {
  id: number
  refund_number: string
  refund_amount: number
  status: RefundStatus
  reason: string
  notes: string | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
}

// ── Payment Refund (from admin refunds list endpoint) ──

export interface PaymentRefund {
  id: number
  refund_number: string
  order_id: number
  order_number: string
  refund_amount: number
  status: RefundStatus
  refund_reason: string
  notes: string | null
  processed_by: string | null
  processed_at: string | null
  items_count: number
  created_at: string
}

// ── Webhook Log (from admin webhook-logs) ──

export interface WebhookEvent {
  id: number
  gateway: PaymentGatewayType | null
  event: string
  status: WebhookStatus | null
  payload: Record<string, unknown> | null
  response: Record<string, unknown> | null
  created_at: string
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
  payment_id: number
  amount: number
  reason: string
  notes?: string
}

// ── Filter/Query Params ──

export interface PaymentTransactionFilters {
  search?: string
  payment_method?: PaymentGatewayType
  status?: TransactionStatus
  customer_id?: number
  order_id?: number
  transaction_id?: string
  min_amount?: number
  max_amount?: number
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface RefundFilters {
  status?: RefundStatus
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

export interface WebhookFilters {
  gateway?: PaymentGatewayType
  status?: WebhookStatus
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

// ── Statistics (from admin payments/statistics) ──

export interface PaymentStatistics {
  overview: {
    total_transactions: number
    total_amount: number
    completed_amount: number
    total_refunded: number
    total_gateway_fees: number
    average_transaction_amount: number
    success_rate: number
  }
  by_status: Record<string, { count: number; total_amount: number }>
  by_gateway: Record<string, { count: number; total_amount: number }>
  daily_trend: { date: string; count: number; total_amount: number }[]
}

// ── Refund Eligibility (from GET /payments/{orderId}/refund-eligibility) ──

export interface RefundEligibility {
  eligible: boolean
  order_id: number
  order_number: string
  total_amount: number
  total_refunded: number
  refundable_amount: number
  payment_status: string
  order_status: string
  reasons?: string[]
  message?: string
}

// ── Order Refund History (from GET /admin/orders/{id}/refunds) ──

export interface OrderRefundHistoryItem {
  id: number
  refund_number: string
  refund_amount: number
  status: RefundStatus
  reason: string
  notes: string | null
  processed_by: {
    id: number
    name: string
  } | null
  processed_at: string | null
  created_at: string
}

export interface OrderRefundHistory {
  order_id: number
  order_number: string
  total_amount: number
  total_refunded: number
  refunds: OrderRefundHistoryItem[]
}

// ── Process Refund Request ──

export interface ProcessRefundRequest {
  order_id: number
  amount: number
  reason: string
  notes?: string
}
