// ═══════════════════════════════════════════════════════════════════
// Inventory Service — Admin & Vendor inventory API calls
// Admin: 9 endpoints  |  Vendor: 5 endpoints
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type {
  InventoryStats,
  StockOverviewItem,
  InventoryLog,
  StockAlert,
  StockReservation,
  StockSummary,
  AlertSummary,
  ReservationSummary,
  InventoryListParams,
  MovementListParams,
  AlertListParams,
  ReservationListParams,
  StockAdjustmentRequest,
  BulkStockAdjustmentRequest,
  PaginationMeta,
} from '@/types'

// API Prefixes
const ADMIN_BASE = '/admin/inventory'
const VENDOR_BASE = '/vendor/inventory'

// ── Response shapes ──────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface PaginatedApiResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: PaginationMeta
}

interface InventoryListResponse extends PaginatedApiResponse<StockOverviewItem> {
  summary: StockSummary
}

interface AlertListResponse extends PaginatedApiResponse<StockAlert> {
  summary: AlertSummary
}

interface ReservationListResponse extends PaginatedApiResponse<StockReservation> {
  summary: ReservationSummary
}

interface StockUpdateResponse {
  success: boolean
  message: string
  data: {
    productId: number
    variantId?: number
    previousStock: number
    newStock: number
    change: number
  }
}

// ══════════════════════════════════════════════════════════════════
// Admin Inventory Service
// ══════════════════════════════════════════════════════════════════

const adminInventory = {
  /**
   * GET /admin/inventory/stats
   * Overall inventory statistics: products, alerts, reservations, activity, vendors
   */
  async getStats(): Promise<InventoryStats> {
    const response = await api.get<ApiResponse<InventoryStats>>(`${ADMIN_BASE}/stats`)
    return response.data.data
  },

  /**
   * GET /admin/inventory/alerts
   * Paginated stock alerts with optional filters
   */
  async getAlerts(params?: AlertListParams): Promise<AlertListResponse> {
    const response = await api.get(`${ADMIN_BASE}/alerts`, { params })
    return response.data  // paginatedResponse: { success, message, data: [], meta: {} }
  },

  /**
   * GET /admin/inventory/movements
   * Paginated inventory log / movements
   */
  async getMovements(params?: MovementListParams): Promise<PaginatedApiResponse<InventoryLog>> {
    const response = await api.get(`${ADMIN_BASE}/movements`, { params })
    return response.data  // paginatedResponse: { success, message, data: [], meta: {} }
  },

  /**
   * GET /admin/inventory/stock
   * All products stock overview (paginated StockOverview)
   */
  async getAllStock(params?: InventoryListParams): Promise<InventoryListResponse> {
    const response = await api.get(`${ADMIN_BASE}/stock`, { params })
    return response.data  // paginatedResponse: { success, message, data: [], meta: {} }
  },

  /**
   * GET /admin/inventory/low-stock
   * Low stock products (paginated StockOverview)
   */
  async getLowStock(params?: InventoryListParams): Promise<InventoryListResponse> {
    const response = await api.get(`${ADMIN_BASE}/low-stock`, { params })
    return response.data  // paginatedResponse: { success, message, data: [], meta: {} }
  },

  /**
   * PUT /admin/inventory/alerts/{id}/resolve
   * Resolve a single alert
   */
  async resolveAlert(id: number): Promise<void> {
    await api.put(`${ADMIN_BASE}/alerts/${id}/resolve`)
  },

  /**
   * POST /admin/inventory/alerts/bulk-resolve
   * Bulk resolve multiple alerts
   */
  async bulkResolveAlerts(ids: number[]): Promise<void> {
    await api.post(`${ADMIN_BASE}/alerts/bulk-resolve`, { alert_ids: ids })
  },

  /**
   * POST /admin/inventory/adjust
   * Adjust stock for a single product/variant
   */
  async adjustStock(data: StockAdjustmentRequest): Promise<StockUpdateResponse> {
    // Backend expects quantity_change (positive/negative integer) + reason
    let quantityChange: number
    if (data.type === 'set') {
      quantityChange = data.quantity - data.currentStock
    } else if (data.type === 'subtract') {
      quantityChange = -Math.abs(data.quantity)
    } else {
      quantityChange = Math.abs(data.quantity)
    }

    const response = await api.post<StockUpdateResponse>(`${ADMIN_BASE}/adjust`, {
      product_id: data.productId,
      variant_id: data.variantId,
      quantity_change: quantityChange,
      reason: data.reason,
    })
    return response.data
  },

  /**
   * POST /admin/inventory/bulk-adjust
   * Bulk adjust stock for multiple products
   */
  async bulkAdjustStock(data: BulkStockAdjustmentRequest): Promise<StockUpdateResponse> {
    const adjustments = data.adjustments.map(a => ({
      product_id: a.productId,
      variant_id: a.variantId,
      quantity: a.quantity,
      type: a.type,
      reason: a.reason,
    }))
    const response = await api.post<StockUpdateResponse>(`${ADMIN_BASE}/bulk-adjust`, { adjustments })
    return response.data
  },

  /**
   * POST /admin/inventory/scan-alerts
   * Trigger a scan for new stock alerts
   */
  async scanForAlerts(): Promise<{ created: number; resolved: number }> {
    const response = await api.post<ApiResponse<{ created: number; resolved: number }>>(`${ADMIN_BASE}/scan-alerts`)
    return response.data.data
  },

  // ── Reservations ─────────────────────────────────────────────────

  /**
   * GET /admin/inventory/reservations
   * Paginated stock reservations list
   */
  async getReservations(params?: ReservationListParams): Promise<ReservationListResponse> {
    const response = await api.get(`${ADMIN_BASE}/reservations`, { params })
    return response.data
  },

  /**
   * GET /admin/inventory/reservations/{id}
   * Single reservation details
   */
  async getReservation(id: number): Promise<StockReservation> {
    const response = await api.get<ApiResponse<StockReservation>>(`${ADMIN_BASE}/reservations/${id}`)
    return response.data.data
  },

  /**
   * PUT /admin/inventory/reservations/{id}/release
   * Manually release a reservation (restore stock)
   */
  async releaseReservation(id: number, reason?: string): Promise<void> {
    await api.put(`${ADMIN_BASE}/reservations/${id}/release`, { reason })
  },

  /**
   * POST /admin/inventory/reservations/bulk-release
   * Bulk release multiple reservations
   */
  async bulkReleaseReservations(ids: number[], reason?: string): Promise<{ released: number }> {
    const response = await api.post<ApiResponse<{ released: number }>>(`${ADMIN_BASE}/reservations/bulk-release`, {
      reservation_ids: ids,
      reason,
    })
    return response.data.data
  },

  /**
   * POST /admin/inventory/reservations/release-expired
   * Release all expired reservations
   */
  async releaseExpiredReservations(): Promise<{ released: number }> {
    const response = await api.post<ApiResponse<{ released: number }>>(`${ADMIN_BASE}/reservations/release-expired`)
    return response.data.data
  },
}

// ══════════════════════════════════════════════════════════════════
// Vendor Inventory Service
// ══════════════════════════════════════════════════════════════════

const vendorInventory = {
  /**
   * GET /vendor/inventory
   * Paginated stock overview for the vendor's products
   */
  async getInventory(params?: InventoryListParams): Promise<InventoryListResponse> {
    const response = await api.get(VENDOR_BASE, { params })
    return response.data.data
  },

  /**
   * PUT /vendor/inventory/{id}?type=product|variant
   * Update stock for a product or variant
   * Backend takes the ID from URL + type param to determine product vs variant
   */
  async updateStock(productId: number, data: {
    stockQuantity: number
    variantId?: number
    reason?: string
  }): Promise<StockUpdateResponse> {
    const id = data.variantId || productId
    const type = data.variantId ? 'variant' : 'product'
    const response = await api.put<StockUpdateResponse>(`${VENDOR_BASE}/${id}`, {
      stock_quantity: data.stockQuantity,
      type,
      reason: data.reason || 'Stock adjustment',
    })
    return response.data
  },

  /**
   * GET /vendor/inventory/movements
   * Paginated stock movement history for vendor's products
   */
  async getMovements(params?: MovementListParams): Promise<PaginatedApiResponse<InventoryLog>> {
    const response = await api.get(`${VENDOR_BASE}/movements`, { params })
    return response.data  // paginatedResponse: { success, message, data: [], meta: {} }
  },

  /**
   * GET /vendor/inventory/alerts
   * Paginated stock alerts for vendor's products
   */
  async getAlerts(params?: AlertListParams): Promise<AlertListResponse> {
    const response = await api.get(`${VENDOR_BASE}/alerts`, { params })
    return response.data.data
  },

  /**
   * PUT /vendor/inventory/alerts/{id}/resolve
   * Resolve a single vendor alert
   */
  async resolveAlert(id: number): Promise<void> {
    await api.put(`${VENDOR_BASE}/alerts/${id}/resolve`)
  },
}

// ── Combined export ──────────────────────────────────────────────

export const inventoryService = {
  admin: adminInventory,
  vendor: vendorInventory,
}
