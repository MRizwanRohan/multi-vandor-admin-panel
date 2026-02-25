// ═══════════════════════════════════════════════════════════════════
// Order Types
// ═══════════════════════════════════════════════════════════════════

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned' 
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

export interface Order {
  id: number
  order_number: string
  customer: OrderCustomer
  vendor: OrderVendor
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  item_count: number
  placed_at: string
  created_at: string
  updated_at: string
}

export interface OrderDetail extends Order {
  items: OrderItem[]
  shipping_address: OrderAddress
  billing_address: OrderAddress | null
  status_history: OrderStatusHistory[]
  notes: string | null
  tracking_number: string | null
  shipped_at: string | null
  delivered_at: string | null
  commission_amount: number
  vendor_earning: number
}

export interface OrderCustomer {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
}

export interface OrderVendor {
  id: number
  store_name: string
  logo_url: string | null
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_slug: string
  product_image: string | null
  variant_id: number | null
  variant_name: string | null
  sku: string
  quantity: number
  unit_price: number
  total_price: number
  commission_rate: number
  commission_amount: number
}

export interface OrderAddress {
  name: string
  phone: string
  address_line_1: string
  address_line_2: string | null
  city: string
  district: string
  postal_code: string | null
  country: string
}

export interface OrderStatusHistory {
  id: number
  from_status: OrderStatus | null
  to_status: OrderStatus
  notes: string | null
  changed_by: string
  changed_at: string
}

// ── Update DTOs ──
export interface UpdateOrderStatusRequest {
  status: OrderStatus
  notes?: string
  tracking_number?: string
}

export interface OrderListParams {
  page?: number
  per_page?: number
  search?: string
  status?: OrderStatus
  payment_status?: PaymentStatus
  vendor_id?: number
  customer_id?: number
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  sort?: string
  order?: 'asc' | 'desc'
}
