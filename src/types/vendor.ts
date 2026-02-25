// ═══════════════════════════════════════════════════════════════════
// Vendor Types
// ═══════════════════════════════════════════════════════════════════

import type { VendorStatus } from './auth'

export interface Vendor {
  id: number
  user_id: number
  store_name: string
  slug: string
  business_name: string | null
  business_type: string | null
  description: string | null
  logo_url: string | null
  banner_url: string | null
  status: VendorStatus
  commission_rate: number
  rating_average: number
  review_count: number
  product_count: number
  order_count: number
  total_sales: number
  owner: VendorOwner
  is_verified: boolean
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface VendorDetail extends Vendor {
  tax_id: string | null
  nid_number: string | null
  nid_front_image: string | null
  nid_back_image: string | null
  nid_verified: boolean
  nid_verified_at: string | null
  nid_verified_by: number | null
  return_policy: string | null
  shipping_policy: string | null
  bank_accounts: BankAccount[]
  shipping_zones: ShippingZone[]
}

export interface VendorOwner {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
}

export interface BankAccount {
  id: number
  vendor_id: number
  account_type: 'bank' | 'bkash' | 'nagad' | 'rocket'
  bank_name: string | null
  account_name: string
  account_number: string
  branch_name: string | null
  routing_number: string | null
  is_primary: boolean
  is_verified: boolean
  created_at: string
}

export interface ShippingZone {
  id: number
  vendor_id: number
  name: string
  regions: string[]
  methods: ShippingMethod[]
  is_active: boolean
}

export interface ShippingMethod {
  id: number
  name: string
  cost: number
  free_over: number | null
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
}

// ── DTOs ──
export interface UpdateVendorRequest {
  store_name?: string
  business_name?: string
  business_type?: string
  description?: string
  logo?: File
  banner?: File
  return_policy?: string
  shipping_policy?: string
}

export interface CreateBankAccountRequest {
  account_type: 'bank' | 'bkash' | 'nagad' | 'rocket'
  bank_name?: string
  account_name: string
  account_number: string
  branch_name?: string
  routing_number?: string
  is_primary?: boolean
}

export interface VendorListParams {
  page?: number
  per_page?: number
  search?: string
  status?: VendorStatus
  is_verified?: boolean
  min_rating?: number
  sort?: string
  order?: 'asc' | 'desc'
}
