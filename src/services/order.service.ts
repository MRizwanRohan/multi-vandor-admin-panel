// ═══════════════════════════════════════════════════════════════════
// Order Service — Order API calls
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import { getRolePrefix } from './api'
import type { Order, PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/orders`

export interface OrderFilters {
  search?: string
  status?: string
  payment_status?: string
  vendor_id?: number
  customer_id?: number
  date_from?: string
  date_to?: string
  min_total?: number
  max_total?: number
  page?: number
  per_page?: number
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface OrderStatusUpdate {
  status: string
  notify_customer?: boolean
  note?: string
}

export const orderService = {
  /**
   * Get paginated orders
   */
  async getAll(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>(prefix(), { params: filters })
    return response.data
  },

  /**
   * Get single order
   */
  async getById(id: number): Promise<Order> {
    const response = await api.get<{ data: Order }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Update order status
   */
  async updateStatus(id: number, data: OrderStatusUpdate): Promise<Order> {
    const response = await api.patch<{ data: Order }>(`${prefix()}/${id}/status`, data)
    return response.data.data
  },

  /**
   * Add order note
   */
  async addNote(id: number, note: string, is_customer_note: boolean = false): Promise<void> {
    await api.post(`${prefix()}/${id}/notes`, { note, is_customer_note })
  },

  /**
   * Get order timeline
   */
  async getTimeline(id: number): Promise<OrderTimelineEvent[]> {
    const response = await api.get<{ data: OrderTimelineEvent[] }>(`${prefix()}/${id}/timeline`)
    return response.data.data
  },

  /**
   * Process refund
   */
  async refund(id: number, data: RefundData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/refund`, data)
    return response.data.data
  },

  /**
   * Download invoice
   */
  async downloadInvoice(id: number): Promise<Blob> {
    const response = await api.get(`${prefix()}/${id}/invoice`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export orders
   */
  async export(filters?: OrderFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Get order statistics
   */
  async getStatistics(filters?: { date_from?: string; date_to?: string }): Promise<OrderStatistics> {
    const response = await api.get<{ data: OrderStatistics }>(`${prefix()}/statistics`, {
      params: filters,
    })
    return response.data.data
  },

  /**
   * Bulk update order status
   */
  async bulkUpdateStatus(ids: number[], status: string): Promise<void> {
    await api.post(`${prefix()}/bulk-status`, { ids, status })
  },

  /**
   * Assign to vendor (for marketplace scenarios)
   */
  async assignToVendor(orderId: number, vendorId: number): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${orderId}/assign`, {
      vendor_id: vendorId,
    })
    return response.data.data
  },

  /**
   * Update shipping info
   */
  async updateShipping(id: number, data: ShippingUpdateData): Promise<Order> {
    const response = await api.patch<{ data: Order }>(`${prefix()}/${id}/shipping`, data)
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Order Status Action Methods (Vendor Operations)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Confirm order (vendor accepts the order)
   */
  async confirmOrder(id: number, note?: string): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/confirm`, {
      note,
      notify_customer: true
    })
    return response.data.data
  },

  /**
   * Mark order as shipped
   */
  async markShipped(id: number, data: MarkShippedData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/ship`, {
      ...data,
      notify_customer: true
    })
    return response.data.data
  },

  /**
   * Mark order as delivered
   */
  async markDelivered(id: number, data?: MarkDeliveredData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/deliver`, {
      ...data,
      notify_customer: true
    })
    return response.data.data
  },

  /**
   * Cancel order
   */
  async cancelOrder(id: number, data: CancelOrderData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/cancel`, {
      ...data,
      notify_customer: true
    })
    return response.data.data
  },

  /**
   * Mark order as processing (started preparing)
   */
  async markProcessing(id: number, note?: string): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/process`, {
      note,
      notify_customer: true
    })
    return response.data.data
  },

  /**
   * Request return for order
   */
  async requestReturn(id: number, data: ReturnRequestData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/return-request`, data)
    return response.data.data
  },

  /**
   * Process return request (approve/reject)
   */
  async processReturn(id: number, data: ProcessReturnData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`${prefix()}/${id}/process-return`, data)
    return response.data.data
  },

  /**
   * Print order label/invoice
   */
  async printLabel(id: number): Promise<Blob> {
    const response = await api.get(`${prefix()}/${id}/print-label`, {
      responseType: 'blob',
    })
    return response.data
  },
}

// ─────────────────────────────────────────────────────────────────
// Additional Types for Order Actions
// ─────────────────────────────────────────────────────────────────

export interface MarkShippedData {
  tracking_number?: string
  shipping_carrier?: string
  estimated_delivery?: string
  note?: string
}

export interface MarkDeliveredData {
  delivered_at?: string
  received_by?: string
  note?: string
  signature_image?: string
}

export interface CancelOrderData {
  reason: string
  cancel_type: 'customer_request' | 'out_of_stock' | 'payment_failed' | 'fraud' | 'other'
  refund_requested?: boolean
  note?: string
}

export interface ReturnRequestData {
  reason: string
  items: { order_item_id: number; quantity: number; reason?: string }[]
  images?: string[]
}

export interface ProcessReturnData {
  status: 'approved' | 'rejected'
  refund_amount?: number
  restock_items?: boolean
  note?: string
}

// Additional types
export interface OrderTimelineEvent {
  id: number
  type: 'status_change' | 'note' | 'payment' | 'shipping' | 'refund'
  title: string
  description?: string
  user?: { id: number; name: string }
  created_at: string
  metadata?: Record<string, unknown>
}

export interface RefundData {
  amount: number
  reason: string
  items?: { order_item_id: number; quantity: number }[]
  restock_items?: boolean
}

export interface OrderStatistics {
  total_orders: number
  total_revenue: number
  average_order_value: number
  pending_orders: number
  processing_orders: number
  completed_orders: number
  cancelled_orders: number
  orders_by_status: Record<string, number>
  revenue_by_day: { date: string; revenue: number }[]
}

export interface ShippingUpdateData {
  tracking_number?: string
  shipping_carrier?: string
  shipping_method?: string
  estimated_delivery?: string
}
