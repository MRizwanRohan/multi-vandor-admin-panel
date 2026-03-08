// ═══════════════════════════════════════════════════════════════════
// Analytics Service — Dashboard & Analytics API calls (Phase 1 + 2)
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  DashboardResponse,
  DashboardPeriod,
  AnalyticsParams,
  SalesAnalyticsResponse,
  SalesChartResponse,
  AnalyticsTopProduct,
  AnalyticsTopVendor,
  RevenueByCategory,
  CustomerInsightsResponse,
  InventoryOverviewResponse,
  PlatformSummaryResponse,
  ExportFilters,
  ExportStatus,
  ImportResult,
  VendorDashboardStats,
  LowStockAlert,
  ReportParams,
} from '@/types'

// Keep for backward compat with existing report pages
export interface DateRange { from: string; to: string }
export interface SalesReport {
  summary: { total_revenue: number; total_orders: number; average_order_value: number; total_commission: number; net_revenue: number }
  chart: { labels: string[]; datasets: { label: string; data: number[] }[] }
  by_category: { category: string; revenue: number; orders: number }[]
  by_vendor: { vendor: string; revenue: number; orders: number }[]
  by_payment_method: { method: string; revenue: number; count: number }[]
}
export interface VendorReport {
  vendor_id: number; store_name: string
  summary: { total_revenue: number; total_orders: number; total_products: number; average_rating: number; commission_paid: number; payout_received: number }
  performance: { labels: string[]; datasets: { label: string; data: number[] }[] }
  top_products: { id: number; name: string; slug: string; image: string | null; revenue: number; units_sold: number }[]
}
export interface ProductReport {
  product_id: number; product_name: string
  summary: { total_revenue: number; units_sold: number; average_price: number; review_count: number; average_rating: number }
  sales_trend: { labels: string[]; datasets: { label: string; data: number[] }[] }
  by_variant: { variant: string; units: number; revenue: number }[]
}

export const analyticsService = {
  // ═══════════════════════════════════════════════════════════════
  // Phase 1: Admin Dashboard
  // ═══════════════════════════════════════════════════════════════

  /** GET /admin/dashboard?period=month */
  async getDashboard(period: DashboardPeriod = 'month', fresh = false): Promise<DashboardResponse> {
    const response = await api.get<{ data: DashboardResponse }>(`${getRolePrefix()}/dashboard`, {
      // Laravel boolean validation accepts 1/0 but NOT the string "true"/"false"
      params: { period, ...(fresh ? { fresh: 1 } : {}) },
    })
    return response.data.data
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: Analytics Endpoints
  // ═══════════════════════════════════════════════════════════════

  /** GET /admin/analytics/sales */
  async getSalesAnalytics(params?: AnalyticsParams): Promise<SalesAnalyticsResponse> {
    const response = await api.get<{ data: SalesAnalyticsResponse }>(`${getRolePrefix()}/analytics/sales`, { params })
    return response.data.data
  },

  /** GET /admin/analytics/sales-chart */
  async getSalesChart(params?: AnalyticsParams): Promise<SalesChartResponse> {
    const response = await api.get<{ data: SalesChartResponse }>(`${getRolePrefix()}/analytics/sales-chart`, { params })
    return response.data.data
  },

  /** GET /admin/analytics/top-products */
  async getTopProducts(params?: AnalyticsParams): Promise<AnalyticsTopProduct[]> {
    const response = await api.get<{ data: AnalyticsTopProduct[] }>(`${getRolePrefix()}/analytics/top-products`, { params })
    return response.data.data
  },

  /** GET /admin/analytics/top-vendors */
  async getTopVendors(params?: AnalyticsParams): Promise<AnalyticsTopVendor[]> {
    const response = await api.get<{ data: AnalyticsTopVendor[] }>(`${getRolePrefix()}/analytics/top-vendors`, { params })
    return response.data.data
  },

  /** GET /admin/analytics/revenue-by-category */
  async getRevenueByCategory(params?: AnalyticsParams): Promise<RevenueByCategory[]> {
    const response = await api.get<{ data: RevenueByCategory[] }>(`${getRolePrefix()}/analytics/revenue-by-category`, { params })
    return response.data.data
  },

  /** GET /admin/analytics/customer-insights */
  async getCustomerInsights(params?: AnalyticsParams): Promise<CustomerInsightsResponse> {
    const response = await api.get<{ data: CustomerInsightsResponse }>(`${getRolePrefix()}/analytics/customer-insights`, { params })
    return response.data.data
  },

  /** GET /admin/analytics/inventory-overview */
  async getInventoryOverview(): Promise<InventoryOverviewResponse> {
    const response = await api.get<{ data: InventoryOverviewResponse }>(`${getRolePrefix()}/analytics/inventory-overview`)
    return response.data.data
  },

  /** GET /admin/analytics/platform-summary */
  async getPlatformSummary(params?: AnalyticsParams): Promise<PlatformSummaryResponse> {
    const response = await api.get<{ data: PlatformSummaryResponse }>(`${getRolePrefix()}/analytics/platform-summary`, { params })
    return response.data.data
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: Export
  // ═══════════════════════════════════════════════════════════════

  /** GET /admin/orders/export */
  async exportOrders(filters?: ExportFilters): Promise<Blob> {
    const response = await api.get(`${getRolePrefix()}/orders/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /** GET /admin/products/export */
  async exportProducts(filters?: ExportFilters): Promise<Blob> {
    const response = await api.get(`${getRolePrefix()}/products/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /** GET /admin/customers/export */
  async exportCustomers(filters?: ExportFilters): Promise<Blob> {
    const response = await api.get(`${getRolePrefix()}/customers/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /** GET /admin/vendors/export */
  async exportVendors(filters?: ExportFilters): Promise<Blob> {
    const response = await api.get(`${getRolePrefix()}/vendors/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /** GET /admin/exports/{id}/status */
  async getExportStatus(id: number): Promise<ExportStatus> {
    const response = await api.get<{ data: ExportStatus }>(`${getRolePrefix()}/exports/${id}/status`)
    return response.data.data
  },

  /** GET /admin/exports/{id}/download */
  async downloadExport(id: number): Promise<Blob> {
    const response = await api.get(`${getRolePrefix()}/exports/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: Import
  // ═══════════════════════════════════════════════════════════════

  /** POST /admin/products/import */
  async importProducts(file: File, vendorId?: number): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    if (vendorId) formData.append('vendor_id', String(vendorId))
    const response = await api.post<{ data: ImportResult }>(`${getRolePrefix()}/products/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /** GET /admin/products/import/template */
  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${getRolePrefix()}/products/import/template`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ═══════════════════════════════════════════════════════════════
  // Legacy — backward-compat with existing report pages
  // ═══════════════════════════════════════════════════════════════

  async getDashboardStats(params?: ReportParams) {
    return this.getDashboard((params?.period as DashboardPeriod) || 'month')
  },

  async getVendorDashboardStats(params?: ReportParams): Promise<VendorDashboardStats> {
    const response = await api.get<{ data: VendorDashboardStats }>(`${getRolePrefix()}/analytics/vendor-dashboard`, { params })
    return response.data.data
  },

  async getLowStockAlerts(limit = 10): Promise<LowStockAlert[]> {
    const response = await api.get<{ data: LowStockAlert[] }>(`${getRolePrefix()}/analytics/low-stock`, { params: { limit } })
    return response.data.data
  },

  async getSalesReport(params?: ReportParams): Promise<SalesReport> {
    const response = await api.get<{ data: SalesReport }>(`${getRolePrefix()}/analytics/reports/sales`, { params })
    return response.data.data
  },

  async getVendorReport(vendorId: number, params?: ReportParams): Promise<VendorReport> {
    const response = await api.get<{ data: VendorReport }>(`${getRolePrefix()}/analytics/reports/vendor/${vendorId}`, { params })
    return response.data.data
  },

  async getProductReport(productId: number, params?: ReportParams): Promise<ProductReport> {
    const response = await api.get<{ data: ProductReport }>(`${getRolePrefix()}/analytics/reports/product/${productId}`, { params })
    return response.data.data
  },
}
