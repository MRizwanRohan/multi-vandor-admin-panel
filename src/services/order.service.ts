// ═══════════════════════════════════════════════════════════════════
// Order Service — matches Admin/Vendor/Customer OrderControllers
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import { getRolePrefix } from './api'
import type {
  Order,
  OrderDetail,
  PaginatedResponse,
  ApiResponse,
  VendorOrderStats,
} from '@/types'
import type { OrderRefundHistory } from '@/types/payment'

const prefix = () => `${getRolePrefix()}/orders`

export interface OrderFilters {
  search?: string
  status?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export interface OrderStatusUpdate {
  status: string
  notes?: string
}

export const orderService = {
  /**
   * Get paginated orders (admin or vendor scoped via prefix)
   * Admin:  GET /admin/orders
   * Vendor: GET /vendor/orders
   */
  async getAll(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>(prefix(), { params: filters })
    return response.data
  },

  /**
   * Get single order with all relations
   * Admin:  GET /admin/orders/{id}
   * Vendor: GET /vendor/orders/{id}
   */
  async getById(id: number): Promise<OrderDetail> {
    const response = await api.get<ApiResponse<OrderDetail>>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Update order status
   * Admin:  PUT /admin/orders/{id}/status  (force — bypasses transition rules)
   * Vendor: PUT /vendor/orders/{id}/status (respects transition rules)
   */
  async updateStatus(id: number, data: OrderStatusUpdate): Promise<OrderDetail> {
    const response = await api.put<ApiResponse<OrderDetail>>(`${prefix()}/${id}/status`, data)
    return response.data.data
  },

  /**
   * Get vendor order stats
   * Vendor: GET /vendor/orders/stats
   */
  async getStats(): Promise<VendorOrderStats> {
    const response = await api.get<ApiResponse<VendorOrderStats>>(`${prefix()}/stats`)
    return response.data.data
  },

  /**
   * Export orders (if endpoint exists)
   */
  async exportOrders(filters?: OrderFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Get invoice JSON data
   * Admin: GET /admin/orders/{id}/invoice
   */
  async getInvoice(id: number): Promise<import('@/types').Invoice> {
    const response = await api.get<{ data: import('@/types').Invoice }>(`${prefix()}/${id}/invoice`)
    return response.data.data
  },

  /**
   * Download invoice as PDF
   * Admin: GET /admin/orders/{id}/invoice/pdf
   */
  async downloadInvoicePdf(id: number): Promise<Blob> {
    const response = await api.get(`${prefix()}/${id}/invoice/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Get refund history for an order
   * Admin: GET /admin/orders/{id}/refunds
   */
  async getRefundHistory(id: number): Promise<OrderRefundHistory> {
    const response = await api.get<{ data: OrderRefundHistory }>(`${prefix()}/${id}/refunds`)
    return response.data.data
  },
}
