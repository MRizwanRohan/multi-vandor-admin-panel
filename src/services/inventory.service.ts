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
  StockSummary,
  AlertSummary,
  InventoryListParams,
  MovementListParams,
  AlertListParams,
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
    const response = await api.get<AlertListResponse>(`${ADMIN_BASE}/alerts`, { params })
    return response.data
  },

  /**
   * GET /admin/inventory/movements
   * Paginated inventory log / movements
   */
  async getMovements(params?: MovementListParams): Promise<PaginatedApiResponse<InventoryLog>> {
    const response = await api.get<PaginatedApiResponse<InventoryLog>>(`${ADMIN_BASE}/movements`, { params })
    return response.data
  },

  /**
   * GET /admin/inventory/low-stock
   * Low stock products (paginated StockOverview)
   */
  async getLowStock(params?: InventoryListParams): Promise<InventoryListResponse> {
    const response = await api.get<InventoryListResponse>(`${ADMIN_BASE}/low-stock`, { params })
    return response.data
  },

  /**
   * POST /admin/inventory/alerts/{id}/resolve
   * Resolve a single alert
   */
  async resolveAlert(id: number): Promise<void> {
    await api.post(`${ADMIN_BASE}/alerts/${id}/resolve`)
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
    const response = await api.post<StockUpdateResponse>(`${ADMIN_BASE}/adjust`, {
      product_id: data.productId,
      variant_id: data.variantId,
      quantity: data.quantity,
      type: data.type,
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
    const response = await api.get<InventoryListResponse>(VENDOR_BASE, { params })
    return response.data
  },

  /**
   * PUT /vendor/inventory/{productId}
   * Update stock for a product or variant
   */
  async updateStock(productId: number, data: {
    stockQuantity: number
    variantId?: number
    type?: 'set' | 'add' | 'subtract'
  }): Promise<StockUpdateResponse> {
    const response = await api.put<StockUpdateResponse>(`${VENDOR_BASE}/${productId}`, {
      stock_quantity: data.stockQuantity,
      variant_id: data.variantId,
      type: data.type || 'set',
    })
    return response.data
  },

  /**
   * GET /vendor/inventory/movements
   * Paginated stock movement history for vendor's products
   */
  async getMovements(params?: MovementListParams): Promise<PaginatedApiResponse<InventoryLog>> {
    const response = await api.get<PaginatedApiResponse<InventoryLog>>(`${VENDOR_BASE}/movements`, { params })
    return response.data
  },

  /**
   * GET /vendor/inventory/alerts
   * Paginated stock alerts for vendor's products
   */
  async getAlerts(params?: AlertListParams): Promise<AlertListResponse> {
    const response = await api.get<AlertListResponse>(`${VENDOR_BASE}/alerts`, { params })
    return response.data
  },

  /**
   * POST /vendor/inventory/alerts/{id}/resolve
   * Resolve a single vendor alert
   */
  async resolveAlert(id: number): Promise<void> {
    await api.post(`${VENDOR_BASE}/alerts/${id}/resolve`)
  },
}

// ── Combined export ──────────────────────────────────────────────

export const inventoryService = {
  admin: adminInventory,
  vendor: vendorInventory,
}
