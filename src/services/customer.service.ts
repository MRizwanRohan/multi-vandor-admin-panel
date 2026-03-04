// ═══════════════════════════════════════════════════════════════════
// Customer Service — Customer API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type { Customer, CustomerDetail, CustomerListParams, PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/customers`

export interface CustomerFilters {
  page?: number
  per_page?: number
  search?: string
  status?: 'active' | 'inactive' | 'blocked'
  min_orders?: number
  max_orders?: number
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface CustomerStats {
  total_customers: number
  active_customers: number
  new_customers_this_month: number
  total_revenue: number
}

export const customerService = {
  /**
   * Get paginated customers
   */
  async getAll(filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> {
    const response = await api.get<PaginatedResponse<Customer>>(prefix(), { params: filters })
    return response.data
  },

  /**
   * Get single customer by ID
   */
  async getById(id: number): Promise<CustomerDetail> {
    const response = await api.get<{ data: CustomerDetail }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Update customer status
   */
  async updateStatus(id: number, status: 'active' | 'inactive' | 'blocked', reason?: string): Promise<Customer> {
    const response = await api.patch<{ data: Customer }>(`${prefix()}/${id}/status`, { status, reason })
    return response.data.data
  },

  /**
   * Block customer
   */
  async block(id: number, reason?: string): Promise<Customer> {
    return this.updateStatus(id, 'blocked', reason)
  },

  /**
   * Unblock / activate customer
   */
  async activate(id: number): Promise<Customer> {
    return this.updateStatus(id, 'active')
  },

  /**
   * Get customer statistics
   */
  async getStats(): Promise<CustomerStats> {
    const response = await api.get<{ data: CustomerStats }>(`${prefix()}/stats`)
    return response.data.data
  },

  /**
   * Get customer orders
   */
  async getOrders(customerId: number, params?: { page?: number; per_page?: number }) {
    const response = await api.get(`${prefix()}/${customerId}/orders`, { params })
    return response.data
  },

  /**
   * Get customer addresses
   */
  async getAddresses(customerId: number) {
    const response = await api.get(`${prefix()}/${customerId}/addresses`)
    return response.data
  },

  /**
   * Export customers
   */
  async export(filters?: CustomerFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await api.get(`${prefix()}/export`, {
      params: { ...filters, format },
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Send email to customer
   */
  async sendEmail(customerId: number, subject: string, message: string): Promise<void> {
    await api.post(`${prefix()}/${customerId}/email`, { subject, message })
  },
}
