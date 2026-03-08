// ═══════════════════════════════════════════════════════════════════
// Currency Service — REST calls for /admin/currencies
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type { Currency, CurrencyFilters, CurrencyFormData } from '@/types'

interface PaginatedResponse<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export const currencyService = {
  /** GET /admin/currencies */
  async getAll(params?: CurrencyFilters): Promise<PaginatedResponse<Currency>> {
    const res = await api.get<{ data: PaginatedResponse<Currency> }>('/admin/currencies', { params })
    return res.data.data
  },

  /** GET /admin/currencies/:id */
  async getOne(id: number): Promise<Currency> {
    const res = await api.get<{ data: Currency }>(`/admin/currencies/${id}`)
    return res.data.data
  },

  /** POST /admin/currencies */
  async create(data: CurrencyFormData): Promise<Currency> {
    const res = await api.post<{ data: Currency }>('/admin/currencies', data)
    return res.data.data
  },

  /** PUT /admin/currencies/:id */
  async update(id: number, data: Partial<CurrencyFormData>): Promise<Currency> {
    const res = await api.put<{ data: Currency }>(`/admin/currencies/${id}`, data)
    return res.data.data
  },

  /** DELETE /admin/currencies/:id */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/currencies/${id}`)
  },

  /** PATCH /admin/currencies/:id/default */
  async setDefault(id: number): Promise<Currency> {
    const res = await api.patch<{ data: Currency }>(`/admin/currencies/${id}/default`)
    return res.data.data
  },

  /** PATCH /admin/currencies/:id/toggle-status */
  async toggleStatus(id: number): Promise<{ id: number; is_active: boolean }> {
    const res = await api.patch<{ data: { id: number; is_active: boolean } }>(`/admin/currencies/${id}/toggle-status`)
    return res.data.data
  },
}
