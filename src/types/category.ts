// ═══════════════════════════════════════════════════════════════════
// Category Types — Category, Tree, Suggestions
// ═══════════════════════════════════════════════════════════════════

export type CategoryStatus = 'active' | 'inactive' | 'pending' | 'rejected'

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  image: string | null
  image_field: string | null
  parent_id: number | null
  depth: number
  parent: { id: number; name: string; slug: string } | null
  children: Category[]
  status: CategoryStatus
  status_label: string
  status_color: string
  is_active: boolean
  display_order: number
  created_by: number | null
  creator: { id: number; name: string; email: string } | null
  approved_by: number | null
  approver: { id: number; name: string } | null
  approved_at: string | null
  rejection_reason: string | null
  product_count: number
  vendor_count: number
  metadata: Record<string, unknown> | null
  seo_title: string | null
  seo_description: string | null
  keywords: string[]
  attribute_templates: CategoryTemplateAssignment[]
  path: string[]
  can_have_children: boolean
  can_be_deleted: boolean
  created_at: string
  updated_at: string
}

/** Alias for backward compatibility */
export type CategoryTreeNode = Category

export interface CategoryBreadcrumb {
  id: number
  name: string
  slug: string
}

export interface CategoryTemplateAssignment {
  attribute_template_id: number
  is_required_override: boolean | null
  display_order: number
  inheritance_mode: 'inherit' | 'replace' | null
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
  parent_id?: number | null
  description?: string
  display_order?: number
  metadata?: {
    seo_title?: string
    seo_description?: string
    keywords?: string[]
  }
}

export interface CategoryTemplateInput {
  attribute_template_id: number
  is_required_override?: boolean | null
  display_order?: number
  inheritance_mode?: 'inherit' | 'replace'
}

export interface CategoryApprovePayload {
  modifications?: {
    name?: string
    description?: string
    parent_id?: number | null
    metadata?: {
      seo_title?: string
      seo_description?: string
      keywords?: string[]
    }
  }
}

export interface CategoryRejectPayload {
  reason: string
  suggested_category_id?: number | null
  admin_notes?: string
}

export interface CategoryRequest {
  id: number
  category_id: number
  vendor_id: number
  vendor?: { id: number; name: string }
  action: 'submitted' | 'approved' | 'rejected'
  action_by: number | null
  acted_by?: { id: number; name: string }
  data: Record<string, unknown>
  rejection_reason?: string
  suggested_category_id?: number | null
  admin_notes?: string
  created_at: string
}

export interface CategoryListParams {
  page?: number
  per_page?: number
  search?: string
  status?: CategoryStatus
  parent_id?: number | null
  is_active?: boolean
}
