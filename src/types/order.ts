// ═══════════════════════════════════════════════════════════════════
// Order Types — matches Laravel OrderResource / OrderItemResource
// ═══════════════════════════════════════════════════════════════════

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled'

export type PaymentMethod =
  | 'cod'
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'card'
  | 'bank_transfer'

// ── Allowed transitions per status (mirrors OrderStatus::allowedTransitions) ──
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
}

// ── Order (list item — relations may or may not be loaded) ──
export interface Order {
  id: number
  order_number: string
  status: OrderStatus
  status_label: string
  status_color: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  shipping_method: string | null
  coupon_code: string | null
  notes: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  // Conditionally loaded relations
  items?: OrderItem[]
  items_count?: number
  customer?: OrderCustomer | null
  vendor?: OrderVendor | null
  shipping_address?: OrderAddress | null
  billing_address?: OrderAddress | null
  status_history?: OrderStatusHistory[]
  order_notes?: OrderNote[]
}

// Alias — show() loads all relations
export type OrderDetail = Order

export interface OrderCustomer {
  id: number
  name: string
  email: string
}

export interface OrderVendor {
  id: number
  store_name: string
  store_slug: string
}

export interface OrderItem {
  id: number
  quantity: number
  unit_price: number
  subtotal: number
  discount: number
  tax: number
  total: number
  commission_rate: number
  commission_amount: number
  product: OrderItemProduct | null
  variant: OrderItemVariant | null
  vendor?: { id: number; store_name: string } | null
}

export interface OrderItemProduct {
  id: number
  name: string
  slug: string
  thumbnail: string | null
}

export interface OrderItemVariant {
  id: number
  sku: string
  name: string | null
}

export interface OrderAddress {
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string | null
  country: string
}

export interface OrderStatusHistory {
  old_status: OrderStatus | null
  new_status: OrderStatus
  notes: string | null
  changed_by: string | null
  created_at: string
}

export interface OrderNote {
  note: string
  created_at: string
}

// ── DTOs ──
export interface UpdateOrderStatusRequest {
  status: OrderStatus
  notes?: string
}

export interface OrderListParams {
  page?: number
  per_page?: number
  search?: string
  status?: OrderStatus
  payment_status?: PaymentStatus
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
}

// ── Vendor order stats ──
export interface VendorOrderStats {
  total_orders: number
  pending_orders: number
  processing_orders: number
  completed_orders: number
  cancelled_orders: number
  total_revenue: number
  total_commission: number
  net_earnings: number
}
