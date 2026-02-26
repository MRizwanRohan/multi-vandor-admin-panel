// ═══════════════════════════════════════════════════════════════════
// Product Service — Product API calls
// Complete implementation based on PRODUCT-API.md
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type { 
  Product, 
  ProductDetail,
  ProductVariant,
  ProductListParams,
  CreateProductRequest,
  ProductAttributeInput,
  ProductVariantInput,
  SearchFacets,
  PaginatedResponse 
} from '@/types'

// API Prefixes
const CUSTOMER_BASE = '/customer/products'
const VENDOR_BASE = '/vendor/products'
const ADMIN_BASE = '/admin/products'

// Response types
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface ProductListResponse extends PaginatedResponse<Product> {
  success: boolean
  message: string
}

interface SearchResponse extends ProductListResponse {
  facets?: SearchFacets
  applied_filters?: Record<string, unknown>
}

// Legacy interfaces for backward compatibility
export interface ProductFilters {
  search?: string
  category_id?: number
  vendor_id?: number
  status?: string
  min_price?: number
  max_price?: number
  is_featured?: boolean
  has_variants?: boolean
  page?: number
  per_page?: number
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface ProductFormData {
  name: string
  slug?: string
  description?: string
  short_description?: string
  sku: string
  barcode?: string
  category_id: number
  type?: 'simple' | 'variable'
  base_price: number
  price?: number
  sale_price?: number
  cost_price?: number
  stock_quantity: number
  low_stock_threshold?: number
  weight?: number
  width?: number
  height?: number
  length?: number
  dimensions?: { length?: number; width?: number; height?: number }
  status: 'draft' | 'pending' | 'active' | 'inactive'
  visibility?: 'visible' | 'hidden' | 'catalog'
  is_featured?: boolean
  is_active?: boolean
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  tags?: string[]
  attributes?: ProductAttributeInput[]
  attribute_values?: { attribute_id: number; value: string }[]
  has_variants?: boolean
  variant_config?: { template_id: number; option_ids: number[] }[]
  variants?: ProductVariantInput[]
}

export interface ProductVariantFormData {
  id?: number
  sku: string
  price: number
  sale_price?: number
  stock_quantity: number
  weight?: number
  is_active?: boolean
  barcode?: string
  attributes?: { name: string; value: string }[]
  option_ids?: number[]
  images?: string[]
}

export const productService = {
  // ═════════════════════════════════════════════════════════════════
  // Customer/Public APIs
  // ═════════════════════════════════════════════════════════════════

  /**
   * GET /customer/products - Browse products
   */
  async browse(params: ProductListParams = {}): Promise<ProductListResponse> {
    const response = await api.get<ProductListResponse>(CUSTOMER_BASE, { params })
    return response.data
  },

  /**
   * GET /customer/products/search - Search products
   */
  async search(query: string, params: Omit<ProductListParams, 'search'> = {}): Promise<SearchResponse> {
    const response = await api.get<SearchResponse>(`${CUSTOMER_BASE}/search`, {
      params: { q: query, ...params },
    })
    return response.data
  },

  /**
   * GET /customer/products/featured - Get featured products
   */
  async getFeatured(perPage = 12): Promise<ProductListResponse> {
    const response = await api.get<ProductListResponse>(`${CUSTOMER_BASE}/featured`, {
      params: { per_page: perPage },
    })
    return response.data
  },

  /**
   * GET /customer/products/category/{category} - Products by category
   */
  async getByCategory(categorySlug: string, params: ProductListParams = {}): Promise<ProductListResponse> {
    const response = await api.get<ProductListResponse>(`${CUSTOMER_BASE}/category/${categorySlug}`, {
      params,
    })
    return response.data
  },

  /**
   * GET /customer/products/{slug} - Product detail (public)
   */
  async getDetail(slug: string): Promise<ProductDetail> {
    const response = await api.get<ApiResponse<ProductDetail>>(`${CUSTOMER_BASE}/${slug}`)
    return response.data.data
  },

  // ═════════════════════════════════════════════════════════════════
  // Vendor APIs
  // ═════════════════════════════════════════════════════════════════

  /**
   * GET /vendor/products - List vendor's own products
   */
  async vendorList(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>(VENDOR_BASE, { params })
    return response.data
  },

  /**
   * POST /vendor/products - Create product
   */
  async vendorCreate(data: CreateProductRequest | ProductFormData): Promise<ProductDetail> {
    const response = await api.post<ApiResponse<ProductDetail>>(VENDOR_BASE, data)
    return response.data.data
  },

  /**
   * GET /vendor/products/{product} - Show own product
   */
  async vendorShow(productSlug: string | number): Promise<ProductDetail> {
    const response = await api.get<ApiResponse<ProductDetail>>(`${VENDOR_BASE}/${productSlug}`)
    return response.data.data
  },

  /**
   * PUT /vendor/products/{product} - Update product
   */
  async vendorUpdate(productSlug: string | number, data: Partial<CreateProductRequest | ProductFormData>): Promise<ProductDetail> {
    const response = await api.put<ApiResponse<ProductDetail>>(`${VENDOR_BASE}/${productSlug}`, data)
    return response.data.data
  },

  /**
   * DELETE /vendor/products/{product} - Delete product
   */
  async vendorDelete(productSlug: string | number): Promise<void> {
    await api.delete(`${VENDOR_BASE}/${productSlug}`)
  },

  /**
   * PUT /vendor/products/{product}/submit - Submit for review
   */
  async vendorSubmit(productSlug: string | number): Promise<ProductDetail> {
    const response = await api.put<ApiResponse<ProductDetail>>(`${VENDOR_BASE}/${productSlug}/submit`)
    return response.data.data
  },

  /**
   * PUT /vendor/products/{product}/restore - Restore deleted product
   */
  async vendorRestore(productSlug: string | number): Promise<ProductDetail> {
    const response = await api.put<ApiResponse<ProductDetail>>(`${VENDOR_BASE}/${productSlug}/restore`)
    return response.data.data
  },

  /**
   * GET /vendor/products/{product}/attributes - Get attribute templates
   */
  async vendorGetAttributes(productSlug: string | number): Promise<import('@/types').AttributeTemplate[]> {
    const response = await api.get<ApiResponse<import('@/types').AttributeTemplate[]>>(
      `${VENDOR_BASE}/${productSlug}/attributes`
    )
    return response.data.data
  },

  /**
   * POST /vendor/products/{product}/images - Upload images
   */
  async vendorUploadImages(
    productSlug: string | number,
    files: File[],
    altTexts?: string[]
  ): Promise<import('@/types').ProductImage[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('images[]', file))
    if (altTexts) {
      altTexts.forEach((text) => formData.append('alt_texts[]', text))
    }
    const response = await api.post<ApiResponse<import('@/types').ProductImage[]>>(
      `${VENDOR_BASE}/${productSlug}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  /**
   * DELETE /vendor/products/{product}/images/{image} - Delete image
   */
  async vendorDeleteImage(productSlug: string | number, imageId: number): Promise<void> {
    await api.delete(`${VENDOR_BASE}/${productSlug}/images/${imageId}`)
  },

  /**
   * PUT /vendor/products/{product}/images/reorder - Reorder images
   */
  async vendorReorderImages(productSlug: string | number, imageIds: number[]): Promise<import('@/types').ProductImage[]> {
    const response = await api.put<ApiResponse<import('@/types').ProductImage[]>>(
      `${VENDOR_BASE}/${productSlug}/images/reorder`,
      { image_ids: imageIds }
    )
    return response.data.data
  },

  // ═════════════════════════════════════════════════════════════════
  // Admin APIs
  // ═════════════════════════════════════════════════════════════════

  /**
   * GET /admin/products - List all products
   */
  async adminList(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>(ADMIN_BASE, { params })
    return response.data
  },

  /**
   * GET /admin/products/{product} - Show product detail
   */
  async adminShow(productSlug: string | number): Promise<ProductDetail> {
    const response = await api.get<ApiResponse<ProductDetail>>(`${ADMIN_BASE}/${productSlug}`)
    return response.data.data
  },

  /**
   * PUT /admin/products/{product}/approve - Approve product
   */
  async adminApprove(productSlug: string | number): Promise<ProductDetail> {
    const response = await api.put<ApiResponse<ProductDetail>>(`${ADMIN_BASE}/${productSlug}/approve`)
    return response.data.data
  },

  /**
   * PUT /admin/products/{product}/reject - Reject product
   */
  async adminReject(productSlug: string | number, reason: string): Promise<ProductDetail> {
    const response = await api.put<ApiResponse<ProductDetail>>(`${ADMIN_BASE}/${productSlug}/reject`, {
      reason,
    })
    return response.data.data
  },

  /**
   * PUT /admin/products/{product}/feature - Toggle featured status
   */
  async adminToggleFeatured(productSlug: string | number): Promise<ProductDetail> {
    const response = await api.put<ApiResponse<ProductDetail>>(`${ADMIN_BASE}/${productSlug}/feature`)
    return response.data.data
  },

  /**
   * DELETE /admin/products/{product} - Delete product
   */
  async adminDelete(productSlug: string | number): Promise<void> {
    await api.delete(`${ADMIN_BASE}/${productSlug}`)
  },

  // ═════════════════════════════════════════════════════════════════
  // Legacy methods (backward compatibility with existing code)
  // ═════════════════════════════════════════════════════════════════

  /**
   * Get paginated products (legacy)
   */
  async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return this.vendorList(filters as ProductListParams)
  },

  /**
   * Get single product (legacy)
   */
  async getById(id: number): Promise<Product> {
    return this.vendorShow(id) as Promise<Product>
  },

  /**
   * Create product (legacy)
   */
  async create(data: ProductFormData): Promise<Product> {
    return this.vendorCreate(data) as Promise<Product>
  },

  /**
   * Update product (legacy)
   */
  async update(id: number, data: Partial<ProductFormData>): Promise<Product> {
    return this.vendorUpdate(id, data) as Promise<Product>
  },

  /**
   * Delete product (legacy)
   */
  async delete(id: number): Promise<void> {
    return this.vendorDelete(id)
  },

  /**
   * Toggle featured status (legacy)
   */
  async toggleFeatured(id: number): Promise<Product> {
    return this.adminToggleFeatured(id) as Promise<Product>
  },

  /**
   * Upload product images (legacy)
   */
  async uploadImages(id: number, files: File[]): Promise<string[]> {
    const images = await this.vendorUploadImages(id, files)
    return images.map((img) => img.url)
  },

  /**
   * Delete product image (legacy)
   */
  async deleteImage(productId: number, imageId: number): Promise<void> {
    return this.vendorDeleteImage(productId, imageId)
  },

  /**
   * Reorder product images (legacy)
   */
  async reorderImages(productId: number, imageIds: number[]): Promise<void> {
    await this.vendorReorderImages(productId, imageIds)
  },

  // ─────────────────────────────────────────────────────────────────
  // Variant Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get product variants
   */
  async getVariants(productId: number): Promise<ProductVariant[]> {
    const response = await api.get<ApiResponse<ProductVariant[]>>(
      `${VENDOR_BASE}/${productId}/variants`
    )
    return response.data.data
  },

  /**
   * Create product variant
   */
  async createVariant(productId: number, data: ProductVariantFormData): Promise<ProductVariant> {
    const response = await api.post<ApiResponse<ProductVariant>>(
      `${VENDOR_BASE}/${productId}/variants`,
      data
    )
    return response.data.data
  },

  /**
   * Update product variant
   */
  async updateVariant(
    productId: number,
    variantId: number,
    data: Partial<ProductVariantFormData>
  ): Promise<ProductVariant> {
    const response = await api.put<ApiResponse<ProductVariant>>(
      `${VENDOR_BASE}/${productId}/variants/${variantId}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete product variant
   */
  async deleteVariant(productId: number, variantId: number): Promise<void> {
    await api.delete(`${VENDOR_BASE}/${productId}/variants/${variantId}`)
  },

  /**
   * Bulk create variants (from matrix)
   */
  async bulkCreateVariants(
    productId: number,
    variants: ProductVariantFormData[]
  ): Promise<ProductVariant[]> {
    const response = await api.post<ApiResponse<ProductVariant[]>>(
      `${VENDOR_BASE}/${productId}/variants/bulk`,
      { variants }
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Bulk Operations (Admin)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Bulk delete products
   */
  async bulkDelete(ids: number[]): Promise<void> {
    await api.post(`${ADMIN_BASE}/bulk-delete`, { ids })
  },

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(ids: number[], status: string): Promise<{ success: number; failed: number }> {
    const response = await api.patch<ApiResponse<{ success: number; failed: number }>>(
      `${ADMIN_BASE}/bulk-status`,
      { ids, status }
    )
    return response.data.data
  },

  /**
   * Export products
   */
  async export(filters?: ProductFilters): Promise<Blob> {
    const response = await api.get(`${ADMIN_BASE}/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Import products
   */
  async import(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`${ADMIN_BASE}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
