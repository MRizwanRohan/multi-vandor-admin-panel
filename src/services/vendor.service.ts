// ═══════════════════════════════════════════════════════════════════
// Vendor Service — Vendor API calls
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import { getRolePrefix } from './api'
import type { Vendor, Commission, Payout, PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/vendors`

export interface VendorFilters {
  search?: string
  status?: string
  is_verified?: boolean
  page?: number
  per_page?: number
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface VendorFormData {
  name: string
  email: string
  phone: string
  shop_name: string
  shop_slug?: string
  shop_description?: string
  logo?: File | string
  banner?: File | string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  commission_rate?: number
  commission_type?: 'percentage' | 'fixed'
  status?: 'pending' | 'active' | 'suspended' | 'rejected'
  bank_name?: string
  bank_account_name?: string
  bank_account_number?: string
  bank_routing_number?: string
  tax_id?: string
}

export const vendorService = {
  /**
   * Get paginated vendors
   */
  async getAll(filters?: VendorFilters): Promise<PaginatedResponse<Vendor>> {
    const response = await api.get<PaginatedResponse<Vendor>>(prefix(), { params: filters })
    return response.data
  },

  /**
   * Get single vendor
   */
  async getById(id: number): Promise<Vendor> {
    const response = await api.get<{ data: Vendor }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Create vendor (admin)
   */
  async create(data: VendorFormData): Promise<Vendor> {
    const formData = buildFormData(data)
    const response = await api.post<{ data: Vendor }>(prefix(), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Update vendor
   */
  async update(id: number, data: Partial<VendorFormData>): Promise<Vendor> {
    const formData = buildFormData(data)
    formData.append('_method', 'PUT')
    const response = await api.post<{ data: Vendor }>(`${prefix()}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Delete vendor
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Update vendor status
   */
  async updateStatus(id: number, status: string, reason?: string): Promise<Vendor> {
    const response = await api.patch<{ data: Vendor }>(`${prefix()}/${id}/status`, { status, reason })
    return response.data.data
  },

  /**
   * Verify vendor
   */
  async verify(id: number): Promise<Vendor> {
    const response = await api.patch<{ data: Vendor }>(`${prefix()}/${id}/verify`)
    return response.data.data
  },

  /**
   * Get vendor statistics
   */
  async getStatistics(id: number): Promise<VendorStatistics> {
    const response = await api.get<{ data: VendorStatistics }>(`${prefix()}/${id}/statistics`)
    return response.data.data
  },

  /**
   * Get vendor earnings
   */
  async getEarnings(id: number, filters?: { date_from?: string; date_to?: string }): Promise<VendorEarnings> {
    const response = await api.get<{ data: VendorEarnings }>(`${prefix()}/${id}/earnings`, {
      params: filters,
    })
    return response.data.data
  },

  /**
   * Get vendor commissions
   */
  async getCommissions(id: number, filters?: { page?: number; per_page?: number }): Promise<PaginatedResponse<Commission>> {
    const response = await api.get<PaginatedResponse<Commission>>(`${prefix()}/${id}/commissions`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Get vendor payouts
   */
  async getPayouts(id: number, filters?: { page?: number; per_page?: number }): Promise<PaginatedResponse<Payout>> {
    const response = await api.get<PaginatedResponse<Payout>>(`${prefix()}/${id}/payouts`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Request payout
   */
  async requestPayout(id: number, amount: number): Promise<Payout> {
    const response = await api.post<{ data: Payout }>(`${prefix()}/${id}/payouts`, { amount })
    return response.data.data
  },

  /**
   * Process payout (admin)
   */
  async processPayout(vendorId: number, payoutId: number, data: PayoutProcessData): Promise<Payout> {
    const response = await api.patch<{ data: Payout }>(
      `${prefix()}/${vendorId}/payouts/${payoutId}/process`,
      data
    )
    return response.data.data
  },

  /**
   * Export vendors
   */
  async export(filters?: VendorFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Update shop settings (for vendors)
   */
  async updateShop(id: number | string, data: Record<string, unknown>): Promise<Vendor> {
    const response = await api.patch<{ data: Vendor }>(`${prefix()}/${id}/shop`, data)
    return response.data.data
  },

  /**
   * Update bank details (for vendors)
   */
  async updateBankDetails(id: number | string, data: Record<string, unknown>): Promise<Vendor> {
    const response = await api.patch<{ data: Vendor }>(`${prefix()}/${id}/bank-details`, data)
    return response.data.data
  },
}

// Helper to build FormData
function buildFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData()
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    
    if (value instanceof File) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, String(item))
      })
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  })
  
  return formData
}

// Additional types
export interface VendorStatistics {
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  total_revenue: number
  total_commission: number
  available_balance: number
  pending_balance: number
  average_rating: number
  total_reviews: number
}

export interface VendorEarnings {
  total_sales: number
  total_commission: number
  net_earnings: number
  pending_payout: number
  completed_payouts: number
  earnings_by_day: { date: string; sales: number; commission: number; net: number }[]
  earnings_by_month: { month: string; sales: number; commission: number; net: number }[]
}

export interface PayoutProcessData {
  status: 'completed' | 'rejected'
  transaction_id?: string
  notes?: string
}

// ─────────────────────────────────────────────────────────────────
// Extended Vendor Service Methods
// ─────────────────────────────────────────────────────────────────

// Add these methods to vendorService object
Object.assign(vendorService, {
  // ─────────────────────────────────────────────────────────────────
  // Approval Workflow Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Approve vendor (admin)
   */
  async approve(id: number, note?: string): Promise<Vendor> {
    const response = await api.post<{ data: Vendor }>(`${getRolePrefix()}/vendors/${id}/approve`, { note })
    return response.data.data
  },

  /**
   * Reject vendor (admin)
   */
  async reject(id: number, reason: string): Promise<Vendor> {
    const response = await api.post<{ data: Vendor }>(`${getRolePrefix()}/vendors/${id}/reject`, { reason })
    return response.data.data
  },

  /**
   * Suspend vendor (admin)
   */
  async suspend(id: number, reason: string, duration?: number): Promise<Vendor> {
    const response = await api.post<{ data: Vendor }>(`${getRolePrefix()}/vendors/${id}/suspend`, {
      reason,
      duration_days: duration
    })
    return response.data.data
  },

  /**
   * Reactivate suspended vendor (admin)
   */
  async reactivate(id: number, note?: string): Promise<Vendor> {
    const response = await api.post<{ data: Vendor }>(`${getRolePrefix()}/vendors/${id}/reactivate`, { note })
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Vendor Data Access Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get vendor's products
   */
  async getProducts(
    vendorId: number,
    filters?: { page?: number; per_page?: number; status?: string; search?: string }
  ): Promise<PaginatedResponse<import('@/types').Product>> {
    const response = await api.get<PaginatedResponse<import('@/types').Product>>(
      `${getRolePrefix()}/vendors/${vendorId}/products`,
      { params: filters }
    )
    return response.data
  },

  /**
   * Get vendor's orders
   */
  async getOrders(
    vendorId: number,
    filters?: { page?: number; per_page?: number; status?: string; date_from?: string; date_to?: string }
  ): Promise<PaginatedResponse<import('@/types').Order>> {
    const response = await api.get<PaginatedResponse<import('@/types').Order>>(
      `${getRolePrefix()}/vendors/${vendorId}/orders`,
      { params: filters }
    )
    return response.data
  },

  /**
   * Get vendor's reviews
   */
  async getReviews(
    vendorId: number,
    filters?: { page?: number; per_page?: number; rating?: number; status?: string }
  ): Promise<PaginatedResponse<import('@/types').Review>> {
    const response = await api.get<PaginatedResponse<import('@/types').Review>>(
      `${getRolePrefix()}/vendors/${vendorId}/reviews`,
      { params: filters }
    )
    return response.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Commission Override Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Set commission override for vendor (admin)
   */
  async setCommissionOverride(
    vendorId: number,
    data: CommissionOverrideData
  ): Promise<Vendor> {
    const response = await api.post<{ data: Vendor }>(
      `${getRolePrefix()}/vendors/${vendorId}/commission-override`,
      data
    )
    return response.data.data
  },

  /**
   * Remove commission override (revert to default)
   */
  async removeCommissionOverride(vendorId: number): Promise<Vendor> {
    const response = await api.delete<{ data: Vendor }>(
      `${getRolePrefix()}/vendors/${vendorId}/commission-override`
    )
    return response.data.data
  },

  /**
   * Get commission history for vendor
   */
  async getCommissionHistory(
    vendorId: number,
    filters?: { page?: number; per_page?: number; date_from?: string; date_to?: string }
  ): Promise<PaginatedResponse<CommissionHistoryEntry>> {
    const response = await api.get<PaginatedResponse<CommissionHistoryEntry>>(
      `${getRolePrefix()}/vendors/${vendorId}/commission-history`,
      { params: filters }
    )
    return response.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Vendor Activity & Notes
  // ─────────────────────────────────────────────────────────────────

  /**
   * Add note to vendor (admin)
   */
  async addNote(vendorId: number, note: string, isInternal: boolean = true): Promise<VendorNote> {
    const response = await api.post<{ data: VendorNote }>(
      `${getRolePrefix()}/vendors/${vendorId}/notes`,
      { note, is_internal: isInternal }
    )
    return response.data.data
  },

  /**
   * Get vendor notes
   */
  async getNotes(vendorId: number): Promise<VendorNote[]> {
    const response = await api.get<{ data: VendorNote[] }>(
      `${getRolePrefix()}/vendors/${vendorId}/notes`
    )
    return response.data.data
  },

  /**
   * Get vendor activity log
   */
  async getActivityLog(
    vendorId: number,
    filters?: { page?: number; per_page?: number }
  ): Promise<PaginatedResponse<VendorActivity>> {
    const response = await api.get<PaginatedResponse<VendorActivity>>(
      `${getRolePrefix()}/vendors/${vendorId}/activity`,
      { params: filters }
    )
    return response.data
  },
})

// ─────────────────────────────────────────────────────────────────
// Additional Types
// ─────────────────────────────────────────────────────────────────

export interface CommissionOverrideData {
  rate: number
  type: 'percentage' | 'fixed'
  reason?: string
  valid_until?: string
}

export interface CommissionHistoryEntry {
  id: number
  order_id: number
  order_number: string
  order_total: number
  commission_rate: number
  commission_type: 'percentage' | 'fixed'
  commission_amount: number
  created_at: string
}

export interface VendorNote {
  id: number
  vendor_id: number
  user_id: number
  user_name: string
  note: string
  is_internal: boolean
  created_at: string
}

export interface VendorActivity {
  id: number
  vendor_id: number
  type: 'status_change' | 'commission_change' | 'payout' | 'product_added' | 'order_received' | 'review_received'
  title: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}
