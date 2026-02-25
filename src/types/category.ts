// ═══════════════════════════════════════════════════════════════════
// Category Types — Category, Tree, Suggestions
// ═══════════════════════════════════════════════════════════════════

export type CategoryStatus = 'active' | 'inactive' | 'pending' | 'rejected'

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  parent_id: number | null
  status: CategoryStatus
  is_active: boolean
  display_order: number
  product_count: number
  depth: number
  created_at: string
  updated_at: string
}

export interface CategoryDetail extends Category {
  parent: Category | null
  seo_title: string | null
  seo_description: string | null
  keywords: string[]
  image_url: string | null
  icon: string | null
  template_assignments: CategoryTemplateAssignment[]
  children?: CategoryTreeNode[]
  breadcrumb: CategoryBreadcrumb[]
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

export interface CategoryBreadcrumb {
  id: number
  name: string
  slug: string
}

export interface CategoryTemplateAssignment {
  template_id: number
  template_name: string
  is_required: boolean
  display_order: number
  inheritance_behavior: 'inherit' | 'replace' | 'merge'
}

// ── Create/Update DTOs ──
export interface CreateCategoryRequest {
  name: string
  parent_id?: number | null
  description?: string
  status?: CategoryStatus
  is_active?: boolean
  display_order?: number
  seo_title?: string
  seo_description?: string
  keywords?: string[]
  icon?: string
  image?: File
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: number
}

export interface CategorySuggestionRequest {
  name: string
  parent_id: number | null
  description?: string
  seo_title?: string
  seo_description?: string
  keywords?: string[]
}

export interface CategoryTemplateInput {
  template_id: number
  is_required?: boolean
  display_order?: number
  inheritance_behavior?: 'inherit' | 'replace' | 'merge'
}

export interface CategoryListParams {
  page?: number
  per_page?: number
  search?: string
  status?: CategoryStatus
  parent_id?: number | null
  is_active?: boolean
}
