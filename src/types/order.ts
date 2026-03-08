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

// ── Invoice ──
export interface InvoiceAddress {
  name?: string | null
  phone?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  full_address?: string | null
}

export interface InvoiceItem {
  id: number
  product_id: number
  variant_id?: number | null
  name: string
  product_name: string
  variant_name?: string | null
  sku?: string | null
  quantity: number
  unit_price: number
  unit_price_formatted: string
  subtotal: number
  subtotal_formatted: string
  discount: number
  discount_formatted: string
  tax: number
  tax_formatted: string
  total: number
  total_formatted: string
}

export interface InvoiceSummary {
  subtotal: number
  subtotal_formatted: string
  tax_amount: number
  tax_amount_formatted: string
  shipping_amount: number
  shipping_amount_formatted: string
  discount_amount: number
  discount_amount_formatted: string
  total_amount: number
  total_amount_formatted: string
  items_count: number
  total_quantity: number
}

export interface Invoice {
  invoice_number: string
  order_number: string
  order_date: string
  order_date_formatted: string
  invoice_date: string
  invoice_date_formatted: string
  due_date: string
  due_date_formatted: string
  status: string
  status_label: string
  payment_status: string
  payment_status_label: string
  payment_method?: string | null
  company: {
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
    logo?: string | null
    website?: string | null
    tax_id?: string | null
  }
  customer: {
    id?: number | null
    name: string
    email?: string | null
    phone?: string | null
  }
  vendor?: {
    id: number
    store_name: string
    business_name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  shipping_address?: InvoiceAddress | null
  billing_address?: InvoiceAddress | null
  items: InvoiceItem[]
  summary: InvoiceSummary
  notes?: string | null
  currency: {
    code: string
    symbol: string
  }
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
