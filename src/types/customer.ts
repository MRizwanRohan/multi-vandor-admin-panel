// ═══════════════════════════════════════════════════════════════════
// Customer Types
// ═══════════════════════════════════════════════════════════════════

import type { UserStatus } from './auth'

export interface Customer {
  id: number
  uuid: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  avatar: string | null
  status: UserStatus
  order_count: number
  total_spent: number
  last_order_at: string | null
  created_at: string
  updated_at: string
}

export interface CustomerDetail extends Customer {
  email_verified_at: string | null
  addresses: CustomerAddress[]
  recent_orders: CustomerOrder[]
  review_count: number
}

export interface CustomerAddress {
  id: number
  label: string
  name: string
  phone: string
  address_line_1: string
  address_line_2: string | null
  city: string
  district: string
  postal_code: string | null
  country: string
  is_default_shipping: boolean
  is_default_billing: boolean
}

export interface CustomerOrder {
  id: number
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

export interface CustomerListParams {
  page?: number
  per_page?: number
  search?: string
  status?: UserStatus
  min_orders?: number
  max_orders?: number
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
}
