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
  options?: AttributeTemplateOption[]
  category_count: number
  product_count: number
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
  display_order: number
}

export interface AttributeValidationRules {
  min?: number
  max?: number
  regex?: string
  min_selections?: number
  max_selections?: number
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
