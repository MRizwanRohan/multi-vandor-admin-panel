// ═══════════════════════════════════════════════════════════════════
// Commission & Payout Types
// ═══════════════════════════════════════════════════════════════════

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled'
export type PayoutMethod = 'bank' | 'bkash' | 'nagad' | 'rocket'

export interface Commission {
  id: number
  vendor_id: number
  order_id: number
  order_number: string
  order_item_id: number
  product_name: string
  gross_amount: number
  commission_rate: number
  commission_amount: number
  net_amount: number
  status: 'pending' | 'available' | 'paid'
  available_at: string | null
  paid_at: string | null
  payout_id: number | null
  created_at: string
}

export interface Payout {
  id: number
  vendor_id: number
  vendor_name: string
  payout_number: string
  amount: number
  fee: number
  net_amount: number
  method: PayoutMethod
  account_details: PayoutAccountDetails
  status: PayoutStatus
  notes: string | null
  requested_at: string
  processed_at: string | null
  processed_by: number | null
  created_at: string
}

export interface PayoutDetail extends Payout {
  commissions: Commission[]
  vendor: PayoutVendor
  transaction_reference: string | null
}

export interface PayoutAccountDetails {
  account_type: PayoutMethod
  bank_name?: string
  account_name: string
  account_number: string
  branch_name?: string
  routing_number?: string
}

export interface PayoutVendor {
  id: number
  store_name: string
  owner_name: string
  email: string
  phone: string | null
}

// ── DTOs ──
export interface RequestPayoutRequest {
  amount: number
  bank_account_id: number
  notes?: string
}

export interface ProcessPayoutRequest {
  status: 'completed' | 'rejected'
  transaction_reference?: string
  notes?: string
}

export interface PayoutListParams {
  page?: number
  per_page?: number
  vendor_id?: number
  status?: PayoutStatus
  method?: PayoutMethod
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
}

// ── Earnings Summary ──
export interface EarningsSummary {
  available_balance: number
  pending_balance: number
  total_earned: number
  total_commission: number
  total_paid_out: number
  this_month_revenue: number
  this_month_commission: number
  last_payout: Payout | null
}
