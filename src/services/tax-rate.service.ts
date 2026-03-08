// ═══════════════════════════════════════════════════════════════════
// TaxRate Service — REST calls for /admin/tax-rates
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type { TaxRate, TaxRateFilters, TaxRateFormData } from '@/types'

interface PaginatedResponse<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export const taxRateService = {
  /** GET /admin/tax-rates */
  async getAll(params?: TaxRateFilters): Promise<PaginatedResponse<TaxRate>> {
    const res = await api.get<{ data: PaginatedResponse<TaxRate> }>('/admin/tax-rates', { params })
    return res.data.data
  },

  /** GET /admin/tax-rates/:id */
  async getOne(id: number): Promise<TaxRate> {
    const res = await api.get<{ data: TaxRate }>(`/admin/tax-rates/${id}`)
    return res.data.data
  },

  /** POST /admin/tax-rates */
  async create(data: TaxRateFormData): Promise<TaxRate> {
    const res = await api.post<{ data: TaxRate }>('/admin/tax-rates', data)
    return res.data.data
  },

  /** PUT /admin/tax-rates/:id */
  async update(id: number, data: Partial<TaxRateFormData>): Promise<TaxRate> {
    const res = await api.put<{ data: TaxRate }>(`/admin/tax-rates/${id}`, data)
    return res.data.data
  },

  /** DELETE /admin/tax-rates/:id */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/tax-rates/${id}`)
  },

  /** PATCH /admin/tax-rates/:id/toggle-status */
  async toggleStatus(id: number): Promise<{ id: number; is_active: boolean }> {
    const res = await api.patch<{ data: { id: number; is_active: boolean } }>(`/admin/tax-rates/${id}/toggle-status`)
    return res.data.data
  },

  /** GET /admin/tax-rates/lookup?country=BD&state=... */
  async lookup(params: { country?: string; state?: string; city?: string }): Promise<TaxRate[]> {
    const res = await api.get<{ data: TaxRate[] }>('/admin/tax-rates/lookup', { params })
    return res.data.data
  },
}
