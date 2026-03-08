// ═══════════════════════════════════════════════════════════════════
// Brand Types — Matches Laravel Brand model & BrandController
// ═══════════════════════════════════════════════════════════════════

export interface Brand {
  id: number
  name: string
  slug: string
  description: string | null
  logo: string | null
  website: string | null
  is_active: boolean
  products_count: number
  created_at: string
  updated_at: string
}

export interface BrandFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean | ''
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'is_active'
  sort_dir?: 'asc' | 'desc'
}

export interface BrandFormData {
  name: string
  description?: string | null
  logo?: File | null
  website?: string | null
  is_active?: boolean
}
