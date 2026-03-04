// ═══════════════════════════════════════════════════════════════════
// Shipping Types — Zones, Methods, Shipments
// ═══════════════════════════════════════════════════════════════════

// ── Enums ────────────────────────────────────────────────────────

export type ShippingMethodType = 'flat' | 'per_item' | 'weight_based' | 'price_based' | 'free'

export type ShippingRateType = 'fixed' | 'percentage'

export type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned'

// ── Shipping Zones ───────────────────────────────────────────────

export interface ShippingZone {
  id: number
  name: string
  description: string | null
  countries: string[] | null  // ISO 2-char country codes
  is_active: boolean
  methods_count?: number
  methods?: ShippingMethod[]
  created_at: string
  updated_at: string
}

export interface CreateShippingZoneRequest {
  name: string
  description?: string
  countries?: string[]
  is_active?: boolean
}

export interface UpdateShippingZoneRequest extends Partial<CreateShippingZoneRequest> {}

// ── Shipping Methods ─────────────────────────────────────────────

export interface ShippingMethod {
  id: number
  zone_id: number
  zone?: ShippingZone
  vendor_id: number | null
  vendor?: { id: number; store_name: string }
  name: string
  type: ShippingMethodType
  rate_type: ShippingRateType
  base_rate: number
  per_item_rate: number
  per_kg_rate: number
  free_shipping_threshold: number | null
  min_delivery_days: number | null
  max_delivery_days: number | null
  delivery_estimate?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateShippingMethodRequest {
  zone_id: number
  name: string
  type?: ShippingMethodType
  rate_type?: ShippingRateType
  base_rate: number
  per_item_rate?: number
  per_kg_rate?: number
  free_shipping_threshold?: number
  min_delivery_days?: number
  max_delivery_days?: number
  is_active?: boolean
}

export interface UpdateShippingMethodRequest extends Partial<CreateShippingMethodRequest> {}

// ── Shipments ────────────────────────────────────────────────────

export interface Shipment {
  id: number
  order_id: number
  vendor_id: number
  tracking_number: string | null
  carrier: string | null
  shipping_method_id: number | null
  shipping_method?: ShippingMethod
  status: ShipmentStatus
  status_label: string
  shipping_cost: number
  weight: number | null
  dimensions: string | null
  shipped_at: string | null
  estimated_delivery: string | null
  delivered_at: string | null
  items?: ShipmentItem[]
  order?: {
    id: number
    order_number: string
    customer_name: string
    shipping_address: string
  }
  created_at: string
  updated_at: string
}

export interface ShipmentItem {
  id: number
  shipment_id: number
  order_item_id: number
  quantity: number
  order_item?: {
    id: number
    product_id: number
    product_name: string
    quantity: number
    unit_price: number
  }
}

export interface CreateShipmentRequest {
  tracking_number?: string
  carrier?: string
  shipping_method_id?: number
  shipping_cost?: number
  weight?: number
  dimensions?: string
  estimated_delivery?: string  // YYYY-MM-DD
  items?: { order_item_id: number; quantity: number }[]
}

export interface UpdateShipmentRequest {
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  weight?: number
  dimensions?: string
}

export interface UpdateShipmentStatusRequest {
  status: ShipmentStatus
}

// ── Shipping Calculation ─────────────────────────────────────────

export interface ShippingCalculateRequest {
  address: {
    country: string
    state?: string
    city?: string
    postal_code?: string
  }
  items: {
    product_id: number
    quantity: number
    weight?: number
  }[]
  shipping_method_id?: number
}

export interface ShippingCalculateResult {
  cost: number
  method_id: number
  method_name: string
  delivery_estimate: string
}

// ── Filters ──────────────────────────────────────────────────────

export interface ShippingZoneFilters {
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export interface ShippingMethodFilters {
  zone_id?: number
  vendor_id?: number
  type?: ShippingMethodType
  is_active?: boolean
  page?: number
  per_page?: number
}

export interface ShipmentFilters {
  order_id?: number
  status?: ShipmentStatus
  tracking_number?: string
  carrier?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}
