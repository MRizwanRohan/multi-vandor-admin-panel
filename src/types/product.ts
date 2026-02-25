// ═══════════════════════════════════════════════════════════════════
// Product Types — Product, Variant, Images
// ═══════════════════════════════════════════════════════════════════

export type ProductType = 'simple' | 'variable'
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived'
export type ProductVisibility = 'visible' | 'hidden' | 'catalog'

export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  price: number
  sale_price: number | null
  effective_price: number
  type: ProductType
  status: ProductStatus
  visibility: ProductVisibility
  stock_quantity: number
  is_featured: boolean
  is_active: boolean
  is_in_stock: boolean
  rating_average: number
  review_count: number
  sales_count: number
  category: ProductCategory
  vendor: ProductVendor
  primary_image: string | null
  created_at: string
  updated_at: string
}

export interface ProductDetail extends Product {
  description: string
  short_description: string
  cost_price: number | null
  weight: number | null
  dimensions: ProductDimensions | null
  low_stock_threshold: number
  meta_title: string
  meta_description: string
  published_at: string | null
  brand: ProductBrand | null
  images: ProductImage[]
  attributes: ProductAttribute[]
  variant_config: VariantConfig | null
  variant_matrix: VariantMatrix | null
  variants: ProductVariant[]
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
}

export interface ProductCategory {
  id: number
  name: string
  slug: string
}

export interface ProductBrand {
  id: number
  name: string
  slug: string | null
}

export interface ProductVendor {
  id: number
  store_name: string
  slug: string | null
  logo_url: string | null
}

export interface ProductImage {
  id: number
  url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

export interface ProductAttribute {
  template_id: number
  template_name: string
  template_slug: string
  data_type: AttributeDataType
  value: string | number | boolean | string[]
  display_value: string
}

export type AttributeDataType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean'

export interface VariantConfig {
  defining_attributes: number[]
  matrix_generated: boolean
}

export interface VariantMatrix {
  attributes: VariantMatrixAttribute[]
  combinations: number
}

export interface VariantMatrixAttribute {
  id: number
  name: string
  options: VariantMatrixOption[]
}

export interface VariantMatrixOption {
  id: number
  value: string
  label: string
}

export interface ProductVariant {
  id: number
  sku: string
  name: string
  price: number
  sale_price: number | null
  effective_price: number
  stock_quantity: number
  is_in_stock: boolean
  is_active: boolean
  weight: number | null
  image_url: string | null
  barcode: string | null
  options: VariantOption[]
}

export interface VariantOption {
  template: string
  template_id: number
  value: string
  option_id: number
}

// ── Create/Update DTOs ──
export interface CreateProductRequest {
  name: string
  category_id: number
  brand_id?: number
  type: ProductType
  description: string
  short_description?: string
  sku: string
  price: number
  sale_price?: number
  cost_price?: number
  stock_quantity?: number
  low_stock_threshold?: number
  weight?: number
  dimensions?: ProductDimensions
  visibility?: ProductVisibility
  meta_title?: string
  meta_description?: string
  attributes?: ProductAttributeInput[]
  variants?: ProductVariantInput[]
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number
}

export interface ProductAttributeInput {
  template_id: number
  value: string | number | boolean | string[]
}

export interface ProductVariantInput {
  sku?: string
  price: number
  sale_price?: number
  stock_quantity: number
  is_active?: boolean
  weight?: number
  image_id?: number
  barcode?: string
  options: { option_id: number }[]
}

export interface ProductListParams {
  page?: number
  per_page?: number
  search?: string
  status?: ProductStatus
  category_id?: number
  vendor_id?: number
  is_featured?: boolean
  is_in_stock?: boolean
  min_price?: number
  max_price?: number
  sort?: string
  order?: 'asc' | 'desc'
}
