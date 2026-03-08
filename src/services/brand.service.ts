// ═══════════════════════════════════════════════════════════════════
// Brand Service — REST calls for /admin/brands
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type { Brand, BrandFilters } from '@/types'

interface PaginatedResponse<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

function buildFormData(data: Record<string, any>): FormData {
  const fd = new FormData()
  for (const [key, val] of Object.entries(data)) {
    if (val === null || val === undefined) continue
    if (val instanceof File) fd.append(key, val)
    else fd.append(key, String(val))
  }
  return fd
}

export const brandService = {
  /** GET /admin/brands */
  async getAll(params?: BrandFilters): Promise<PaginatedResponse<Brand>> {
    const res = await api.get<{ data: PaginatedResponse<Brand> }>('/admin/brands', { params })
    return res.data.data
  },

  /** GET /admin/brands/:id */
  async getOne(id: number): Promise<Brand> {
    const res = await api.get<{ data: Brand }>(`/admin/brands/${id}`)
    return res.data.data
  },

  /** POST /admin/brands  (multipart — logo may be a File) */
  async create(data: Record<string, any>): Promise<Brand> {
    const res = await api.post<{ data: Brand }>('/admin/brands', buildFormData(data), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  /** POST /admin/brands/:id  (Laravel accepts POST for updates with files) */
  async update(id: number, data: Record<string, any>): Promise<Brand> {
    const fd = buildFormData(data)
    fd.append('_method', 'PUT')
    const res = await api.post<{ data: Brand }>(`/admin/brands/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  /** DELETE /admin/brands/:id */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/brands/${id}`)
  },

  /** PATCH /admin/brands/:id/toggle-status */
  async toggleStatus(id: number): Promise<{ id: number; is_active: boolean }> {
    const res = await api.patch<{ data: { id: number; is_active: boolean } }>(`/admin/brands/${id}/toggle-status`)
    return res.data.data
  },
}
