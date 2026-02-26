// ═══════════════════════════════════════════════════════════════════
// Attribute Template Types
// ═══════════════════════════════════════════════════════════════════

import type { AttributeDataType } from './product'

export interface AttributeTemplate {
  id: number
  name: string
  slug: string
  description: string | null
  data_type: AttributeDataType
  // Computed fields from API
  data_type_label?: string // e.g., "Single Select"
  input_type?: string // e.g., "select"
  requires_options?: boolean // true for select/multiselect
  can_define_variants?: boolean // true for select/multiselect
  // Main fields
  is_required: boolean
  is_filterable: boolean
  is_variant_defining: boolean
  is_active: boolean
  validation_rules: AttributeValidationRules | null
  display_order: number
  unit: string | null
  placeholder: string | null
  help_text: string | null
  created_by: number | null
  creator?: {
    id: number
    name: string
  }
  options?: AttributeTemplateOption[]
  // Count fields (from API)
  category_count?: number
  categories_count?: number // Detail view uses this name
  product_count?: number
  created_at: string
  updated_at: string
}

export interface AttributeTemplateOption {
  id: number
  attribute_template_id: number
  value: string
  label: string
  color_code: string | null
  image_url: string | null
  is_active: boolean
  is_deprecated: boolean
  // Computed fields from API
  is_color?: boolean // true when color_code is not null
  has_image?: boolean // true when image_url is not null/empty
  display_order: number
  created_at?: string
}

export interface AttributeValidationRules {
  min?: number
  max?: number
  regex?: string
  min_length?: number
  max_length?: number
}

// Data type info from /data-types endpoint
export interface AttributeDataTypeInfo {
  value: AttributeDataType
  label: string
  input_type: string
  requires_options: boolean
}

// ── Create/Update DTOs ──
export interface CreateAttributeTemplateRequest {
  name: string
  data_type: AttributeDataType
  description?: string
  is_required?: boolean
  is_filterable?: boolean
  is_variant_defining?: boolean
  is_active?: boolean
  validation_rules?: AttributeValidationRules
  display_order?: number
  unit?: string
  placeholder?: string
  help_text?: string
  options?: CreateAttributeOptionRequest[]
}

export interface UpdateAttributeTemplateRequest extends Partial<CreateAttributeTemplateRequest> {
  id: number
}

export interface CreateAttributeOptionRequest {
  value: string
  label: string
  color_code?: string
  image?: File
  is_active?: boolean
  display_order?: number
}

export interface UpdateAttributeOptionRequest extends Partial<CreateAttributeOptionRequest> {
  id: number
}

export interface AttributeTemplateListParams {
  page?: number
  per_page?: number
  search?: string
  data_type?: AttributeDataType
  is_filterable?: boolean
  is_variant_defining?: boolean
  is_active?: boolean
}
