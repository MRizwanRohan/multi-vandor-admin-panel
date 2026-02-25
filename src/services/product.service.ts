// ═══════════════════════════════════════════════════════════════════
// Product Service — Product API calls
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import { getRolePrefix } from './api'
import type { Product, PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/products`

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
  base_price: number
  sale_price?: number
  cost_price?: number
  stock_quantity: number
  low_stock_threshold?: number
  weight?: number
  width?: number
  height?: number
  length?: number
  status: 'draft' | 'pending' | 'active' | 'inactive'
  is_featured?: boolean
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  tags?: string[]
  attribute_values?: { attribute_id: number; value: string }[]
  has_variants?: boolean
  variants?: ProductVariantFormData[]
}

export interface ProductVariantFormData {
  id?: number
  sku: string
  price: number
  stock_quantity: number
  attributes: { name: string; value: string }[]
  images?: string[]
}

export const productService = {
  /**
   * Get paginated products
   */
  async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>(prefix(), { params: filters })
    return response.data
  },

  /**
   * Get single product
   */
  async getById(id: number): Promise<Product> {
    const response = await api.get<{ data: Product }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Create product
   */
  async create(data: ProductFormData): Promise<Product> {
    const response = await api.post<{ data: Product }>(prefix(), data)
    return response.data.data
  },

  /**
   * Update product
   */
  async update(id: number, data: Partial<ProductFormData>): Promise<Product> {
    const response = await api.put<{ data: Product }>(`${prefix()}/${id}`, data)
    return response.data.data
  },

  /**
   * Delete product
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Bulk delete products
   */
  async bulkDelete(ids: number[]): Promise<void> {
    await api.post(`${prefix()}/bulk-delete`, { ids })
  },

  /**
   * Update product status
   */
  async updateStatus(id: number, status: string): Promise<Product> {
    const response = await api.patch<{ data: Product }>(`${prefix()}/${id}/status`, { status })
    return response.data.data
  },

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: number): Promise<Product> {
    const response = await api.patch<{ data: Product }>(`${prefix()}/${id}/featured`)
    return response.data.data
  },

  /**
   * Update stock
   */
  async updateStock(id: number, quantity: number): Promise<Product> {
    const response = await api.patch<{ data: Product }>(`${prefix()}/${id}/stock`, { quantity })
    return response.data.data
  },

  /**
   * Upload product images
   */
  async uploadImages(id: number, files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('images[]', file))
    const response = await api.post<{ data: string[] }>(`${prefix()}/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Delete product image
   */
  async deleteImage(productId: number, imageId: number): Promise<void> {
    await api.delete(`${prefix()}/${productId}/images/${imageId}`)
  },

  /**
   * Reorder product images
   */
  async reorderImages(productId: number, imageIds: number[]): Promise<void> {
    await api.post(`${prefix()}/${productId}/images/reorder`, { ids: imageIds })
  },

  /**
   * Duplicate product
   */
  async duplicate(id: number): Promise<Product> {
    const response = await api.post<{ data: Product }>(`${prefix()}/${id}/duplicate`)
    return response.data.data
  },

  /**
   * Export products
   */
  async export(filters?: ProductFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/export`, {
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
    const response = await api.post(`${prefix()}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Variant CRUD Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get product variants
   */
  async getVariants(productId: number): Promise<import('@/types').ProductVariant[]> {
    const response = await api.get<{ data: import('@/types').ProductVariant[] }>(
      `${prefix()}/${productId}/variants`
    )
    return response.data.data
  },

  /**
   * Create product variant
   */
  async createVariant(productId: number, data: ProductVariantFormData): Promise<import('@/types').ProductVariant> {
    const response = await api.post<{ data: import('@/types').ProductVariant }>(
      `${prefix()}/${productId}/variants`,
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
  ): Promise<import('@/types').ProductVariant> {
    const response = await api.put<{ data: import('@/types').ProductVariant }>(
      `${prefix()}/${productId}/variants/${variantId}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete product variant
   */
  async deleteVariant(productId: number, variantId: number): Promise<void> {
    await api.delete(`${prefix()}/${productId}/variants/${variantId}`)
  },

  /**
   * Bulk create variants (from matrix)
   */
  async bulkCreateVariants(
    productId: number,
    variants: ProductVariantFormData[]
  ): Promise<import('@/types').ProductVariant[]> {
    const response = await api.post<{ data: import('@/types').ProductVariant[] }>(
      `${prefix()}/${productId}/variants/bulk`,
      { variants }
    )
    return response.data.data
  },

  /**
   * Bulk update variant prices
   */
  async bulkUpdateVariantPrices(
    productId: number,
    updates: { variant_id: number; price: number; sale_price?: number }[]
  ): Promise<void> {
    await api.patch(`${prefix()}/${productId}/variants/bulk-price`, { updates })
  },

  /**
   * Bulk update variant stock
   */
  async bulkUpdateVariantStock(
    productId: number,
    updates: { variant_id: number; stock_quantity: number }[]
  ): Promise<void> {
    await api.patch(`${prefix()}/${productId}/variants/bulk-stock`, { updates })
  },

  /**
   * Bulk delete variants
   */
  async bulkDeleteVariants(productId: number, variantIds: number[]): Promise<void> {
    await api.post(`${prefix()}/${productId}/variants/bulk-delete`, { ids: variantIds })
  },

  // ─────────────────────────────────────────────────────────────────
  // Bulk Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(ids: number[], status: string): Promise<{ success: number; failed: number }> {
    const response = await api.patch<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-status`,
      { ids, status }
    )
    return response.data.data
  },

  /**
   * Bulk update prices
   */
  async bulkUpdatePrices(
    ids: number[],
    adjustment: { type: 'percentage' | 'fixed'; value: number; field: 'price' | 'sale_price' }
  ): Promise<{ success: number; failed: number }> {
    const response = await api.patch<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-price`,
      { ids, ...adjustment }
    )
    return response.data.data
  },

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(
    updates: { product_id: number; stock_quantity: number }[]
  ): Promise<{ success: number; failed: number }> {
    const response = await api.patch<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-stock`,
      { updates }
    )
    return response.data.data
  },
}
