// ═══════════════════════════════════════════════════════════════════
// Flash Sale Service — Time-limited promotional sales API
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type {
  FlashSale,
  FlashSaleDetail,
  FlashSaleStats,
  FlashSaleFilters,
  CreateFlashSaleRequest,
  UpdateFlashSaleRequest,
  FlashSaleProductInput,
  ConflictCheckRequest,
  ConflictCheckResponse,
  FlashSalePublic,
  ProductFlashPriceResponse,
} from '@/types'
import type { PaginatedResponse } from '@/types'

export type { FlashSaleFilters, FlashSaleStats }

export const flashSaleService = {
  // ═══════════════════════════════════════════════════════════════════
  // Admin: Flash Sale Management — /admin/flash-sales
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get paginated flash sales
   */
  async getAll(params?: FlashSaleFilters): Promise<PaginatedResponse<FlashSale>> {
    const response = await api.get<PaginatedResponse<FlashSale>>('/admin/flash-sales', { params })
    return response.data
  },

  /**
   * Get flash sale statistics
   */
  async getStats(): Promise<FlashSaleStats> {
    const response = await api.get<{ data: FlashSaleStats }>('/admin/flash-sales/stats')
    return response.data.data
  },

  /**
   * Get currently active flash sales
   */
  async getActive(): Promise<FlashSaleDetail[]> {
    const response = await api.get<{ data: FlashSaleDetail[] }>('/admin/flash-sales/active')
    return response.data.data
  },

  /**
   * Check for product conflicts with other flash sales
   */
  async checkConflicts(data: ConflictCheckRequest): Promise<ConflictCheckResponse> {
    const response = await api.post<{ data: ConflictCheckResponse }>(
      '/admin/flash-sales/check-conflicts',
      data
    )
    return response.data.data
  },

  /**
   * Get single flash sale with stats
   */
  async getById(id: number): Promise<{ flash_sale: FlashSaleDetail; stats: FlashSaleDetail['stats'] }> {
    const response = await api.get<{ data: { flash_sale: FlashSaleDetail; stats: FlashSaleDetail['stats'] } }>(
      `/admin/flash-sales/${id}`
    )
    return response.data.data
  },

  /**
   * Create flash sale
   */
  async create(data: CreateFlashSaleRequest): Promise<FlashSaleDetail> {
    const response = await api.post<{ data: FlashSaleDetail }>('/admin/flash-sales', data)
    return response.data.data
  },

  /**
   * Update flash sale
   */
  async update(id: number, data: UpdateFlashSaleRequest): Promise<FlashSaleDetail> {
    const response = await api.put<{ data: FlashSaleDetail }>(`/admin/flash-sales/${id}`, data)
    return response.data.data
  },

  /**
   * Delete flash sale
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/flash-sales/${id}`)
  },

  /**
   * Toggle flash sale active status
   */
  async toggle(id: number): Promise<FlashSale> {
    const response = await api.put<{ data: FlashSale }>(`/admin/flash-sales/${id}/toggle`)
    return response.data.data
  },

  /**
   * Add products to flash sale
   */
  async addProducts(id: number, products: FlashSaleProductInput[]): Promise<FlashSaleDetail> {
    const response = await api.post<{ data: FlashSaleDetail }>(
      `/admin/flash-sales/${id}/products`,
      { products }
    )
    return response.data.data
  },

  /**
   * Sync (replace) all products in flash sale
   */
  async syncProducts(id: number, products: FlashSaleProductInput[]): Promise<FlashSaleDetail> {
    const response = await api.put<{ data: FlashSaleDetail }>(
      `/admin/flash-sales/${id}/products`,
      { products }
    )
    return response.data.data
  },

  /**
   * Remove product from flash sale
   */
  async removeProduct(flashSaleId: number, productId: number): Promise<void> {
    await api.delete(`/admin/flash-sales/${flashSaleId}/products/${productId}`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // Public: Flash Sale Display — /flash-sales
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get active flash sales (public)
   */
  async getPublicActive(): Promise<FlashSalePublic[]> {
    const response = await api.get<{ data: FlashSalePublic[] }>('/flash-sales')
    return response.data.data
  },

  /**
   * Get upcoming flash sales (public)
   */
  async getUpcoming(): Promise<FlashSale[]> {
    const response = await api.get<{ data: FlashSale[] }>('/flash-sales/upcoming')
    return response.data.data
  },

  /**
   * Get flash sale details (public)
   */
  async getPublicById(id: number): Promise<FlashSalePublic> {
    const response = await api.get<{ data: FlashSalePublic }>(`/flash-sales/${id}`)
    return response.data.data
  },

  /**
   * Check if product has flash sale price
   */
  async getProductPrice(productId: number): Promise<ProductFlashPriceResponse> {
    const response = await api.get<{ data: ProductFlashPriceResponse }>(
      `/flash-sales/product/${productId}/price`
    )
    return response.data.data
  },
}
