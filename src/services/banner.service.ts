// ═══════════════════════════════════════════════════════════════════
// Banner Service — Promotional banner management API
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type {
  Banner,
  BannerPosition,
  BannerFilters,
  CreateBannerRequest,
  UpdateBannerRequest,
  ReorderBannersRequest,
  BulkBannerRequest,
} from '@/types'
import type { PaginatedResponse } from '@/types'

export type { BannerFilters }

export interface BannerPositionInfo {
  value: string
  label: string
  count: number
}

export const bannerService = {
  // ═══════════════════════════════════════════════════════════════════
  // Admin: Banner Management — /admin/banners
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get paginated banners
   */
  async getAll(params?: BannerFilters): Promise<PaginatedResponse<Banner>> {
    const response = await api.get<PaginatedResponse<Banner>>('/admin/banners', { params })
    return response.data
  },

  /**
   * Get available banner positions with counts
   */
  async getPositions(): Promise<BannerPositionInfo[]> {
    const response = await api.get<{ data: BannerPositionInfo[] }>('/admin/banners/positions')
    return response.data.data
  },

  /**
   * Get banners for a specific position
   */
  async getByPosition(position: string): Promise<Banner[]> {
    const response = await api.get<{ data: Banner[] }>(`/admin/banners/position/${position}`)
    return response.data.data
  },

  /**
   * Reorder banners within a position
   */
  async reorder(data: ReorderBannersRequest): Promise<void> {
    await api.put('/admin/banners/reorder', data)
  },

  /**
   * Bulk activate banners
   */
  async bulkActivate(bannerIds: number[]): Promise<{ count: number }> {
    const response = await api.put<{ data: { count: number } }>(
      '/admin/banners/bulk-activate',
      { banner_ids: bannerIds }
    )
    return response.data.data
  },

  /**
   * Bulk deactivate banners
   */
  async bulkDeactivate(bannerIds: number[]): Promise<{ count: number }> {
    const response = await api.put<{ data: { count: number } }>(
      '/admin/banners/bulk-deactivate',
      { banner_ids: bannerIds }
    )
    return response.data.data
  },

  /**
   * Get single banner
   */
  async getById(id: number): Promise<Banner> {
    const response = await api.get<{ data: Banner }>(`/admin/banners/${id}`)
    return response.data.data
  },

  /**
   * Create banner
   */
  async create(data: CreateBannerRequest): Promise<Banner> {
    const formData = new FormData()
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value)
        } else if (key === 'metadata' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    })

    const response = await api.post<{ data: Banner }>('/admin/banners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Update banner
   */
  async update(id: number, data: UpdateBannerRequest): Promise<Banner> {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value)
        } else if (key === 'metadata' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    })

    const response = await api.post<{ data: Banner }>(`/admin/banners/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Delete banner
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/banners/${id}`)
  },

  /**
   * Toggle banner active status
   */
  async toggle(id: number): Promise<Banner> {
    const response = await api.put<{ data: Banner }>(`/admin/banners/${id}/toggle`)
    return response.data.data
  },

  /**
   * Move banner up in display order
   */
  async moveUp(id: number): Promise<Banner> {
    const response = await api.put<{ data: Banner }>(`/admin/banners/${id}/move-up`)
    return response.data.data
  },

  /**
   * Move banner down in display order
   */
  async moveDown(id: number): Promise<Banner> {
    const response = await api.put<{ data: Banner }>(`/admin/banners/${id}/move-down`)
    return response.data.data
  },

  // ═══════════════════════════════════════════════════════════════════
  // Public: Banner Display — /banners
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get active banners (optionally by position)
   */
  async getPublic(position?: string): Promise<Banner[]> {
    const response = await api.get<{ data: Banner[] }>('/banners', {
      params: position ? { position } : undefined,
    })
    return response.data.data
  },

  /**
   * Get hero banners
   */
  async getHero(): Promise<Banner[]> {
    const response = await api.get<{ data: Banner[] }>('/banners/hero')
    return response.data.data
  },

  /**
   * Get banners by position (public)
   */
  async getPublicByPosition(position: string): Promise<Banner[]> {
    const response = await api.get<{ data: Banner[] }>(`/banners/position/${position}`)
    return response.data.data
  },
}
