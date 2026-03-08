// ═══════════════════════════════════════════════════════════════════
// Currency Types — Matches Laravel Currency model & CurrencyController
// ═══════════════════════════════════════════════════════════════════

export interface Currency {
  id: number
  code: string          // ISO 4217 — 3 chars e.g. "BDT"
  name: string
  symbol: string
  exchange_rate: string // decimal:6 comes as string from JSON
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CurrencyFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean | ''
  sort_by?: 'name' | 'code' | 'exchange_rate' | 'is_active' | 'is_default' | 'created_at'
  sort_dir?: 'asc' | 'desc'
}

export interface CurrencyFormData {
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_default?: boolean
  is_active?: boolean
}
