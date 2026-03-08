// ═══════════════════════════════════════════════════════════════════
// TaxRate Types — Matches Laravel TaxRate model & TaxRateController
// ═══════════════════════════════════════════════════════════════════

export interface TaxRate {
  id: number
  name: string
  rate: string          // decimal:4 comes as string from JSON
  country: string | null
  state: string | null
  city: string | null
  postal_code: string | null
  is_compound: boolean
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaxRateFilters {
  page?: number
  per_page?: number
  search?: string
  country?: string
  is_active?: boolean | ''
  sort_by?: 'name' | 'rate' | 'country' | 'priority' | 'created_at' | 'is_active'
  sort_dir?: 'asc' | 'desc'
}

export interface TaxRateFormData {
  name: string
  rate: number
  country?: string | null
  state?: string | null
  city?: string | null
  postal_code?: string | null
  is_compound?: boolean
  priority?: number
  is_active?: boolean
}
