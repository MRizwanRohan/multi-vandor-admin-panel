// ═══════════════════════════════════════════════════════════════════
// Commission & Payout Types
// ═══════════════════════════════════════════════════════════════════

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'failed'
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
  payout_number: string
  vendor_id: number
  amount: number
  fee: number
  net_amount: number
  currency: string
  status: PayoutStatus
  status_label: string
  payment_method: string
  transaction_reference: string | null
  notes: string | null
  processed_at: string | null
  processed_by: { id: number; name: string } | null
  vendor?: PayoutVendor
  payout_notes?: PayoutNote[]
  commission_count?: number
  created_at: string
  updated_at: string
}

export type PayoutDetail = Payout

export interface PayoutVendor {
  id: number
  name: string
  slug: string
}

export interface PayoutNote {
  id: number
  message: string
  note_type: string
  created_by: string
  created_at: string
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
  search?: string
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
