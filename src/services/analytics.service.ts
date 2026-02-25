// ═══════════════════════════════════════════════════════════════════
// Analytics Service — Dashboard & Reports API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  DashboardStats,
  VendorDashboardStats,
  ChartData,
  RevenueChartData,
  TopProduct,
  TopVendor,
  TopCategory,
  PendingAction,
  ActivityItem,
  LowStockAlert,
  ReportParams,
} from '@/types'

const prefix = () => `${getRolePrefix()}/analytics`

export interface DateRange {
  from: string
  to: string
}

export interface SalesReport {
  summary: {
    total_revenue: number
    total_orders: number
    average_order_value: number
    total_commission: number
    net_revenue: number
  }
  chart: RevenueChartData
  by_category: { category: string; revenue: number; orders: number }[]
  by_vendor: { vendor: string; revenue: number; orders: number }[]
  by_payment_method: { method: string; revenue: number; count: number }[]
}

export interface VendorReport {
  vendor_id: number
  store_name: string
  summary: {
    total_revenue: number
    total_orders: number
    total_products: number
    average_rating: number
    commission_paid: number
    payout_received: number
  }
  performance: ChartData
  top_products: TopProduct[]
}

export interface ProductReport {
  product_id: number
  product_name: string
  summary: {
    total_revenue: number
    units_sold: number
    average_price: number
    review_count: number
    average_rating: number
  }
  sales_trend: ChartData
  by_variant: { variant: string; units: number; revenue: number }[]
}

export const analyticsService = {
  // ─────────────────────────────────────────────────────────────────
  // Dashboard Stats
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get admin dashboard stats
   */
  async getDashboardStats(params?: ReportParams): Promise<DashboardStats> {
    const response = await api.get<{ data: DashboardStats }>(`${prefix()}/dashboard`, { params })
    return response.data.data
  },

  /**
   * Get vendor dashboard stats
   */
  async getVendorDashboardStats(params?: ReportParams): Promise<VendorDashboardStats> {
    const response = await api.get<{ data: VendorDashboardStats }>(`${prefix()}/vendor-dashboard`, {
      params,
    })
    return response.data.data
  },

  /**
   * Get pending actions for dashboard
   */
  async getPendingActions(): Promise<PendingAction[]> {
    const response = await api.get<{ data: PendingAction[] }>(`${prefix()}/pending-actions`)
    return response.data.data
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    const response = await api.get<{ data: ActivityItem[] }>(`${prefix()}/activity`, {
      params: { limit },
    })
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Charts
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get revenue chart data
   */
  async getRevenueChart(params?: ReportParams): Promise<RevenueChartData> {
    const response = await api.get<{ data: RevenueChartData }>(`${prefix()}/charts/revenue`, {
      params,
    })
    return response.data.data
  },

  /**
   * Get orders chart data
   */
  async getOrdersChart(params?: ReportParams): Promise<ChartData> {
    const response = await api.get<{ data: ChartData }>(`${prefix()}/charts/orders`, { params })
    return response.data.data
  },

  /**
   * Get category distribution chart
   */
  async getCategoryChart(): Promise<ChartData> {
    const response = await api.get<{ data: ChartData }>(`${prefix()}/charts/categories`)
    return response.data.data
  },

  /**
   * Get vendor comparison chart
   */
  async getVendorChart(params?: ReportParams): Promise<ChartData> {
    const response = await api.get<{ data: ChartData }>(`${prefix()}/charts/vendors`, { params })
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Top Lists
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get top products
   */
  async getTopProducts(limit: number = 10, params?: ReportParams): Promise<TopProduct[]> {
    const response = await api.get<{ data: TopProduct[] }>(`${prefix()}/top-products`, {
      params: { limit, ...params },
    })
    return response.data.data
  },

  /**
   * Get top vendors
   */
  async getTopVendors(limit: number = 10, params?: ReportParams): Promise<TopVendor[]> {
    const response = await api.get<{ data: TopVendor[] }>(`${prefix()}/top-vendors`, {
      params: { limit, ...params },
    })
    return response.data.data
  },

  /**
   * Get top categories
   */
  async getTopCategories(limit: number = 10, params?: ReportParams): Promise<TopCategory[]> {
    const response = await api.get<{ data: TopCategory[] }>(`${prefix()}/top-categories`, {
      params: { limit, ...params },
    })
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Vendor Specific
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get low stock alerts for vendor
   */
  async getLowStockAlerts(limit: number = 10): Promise<LowStockAlert[]> {
    const response = await api.get<{ data: LowStockAlert[] }>(`${prefix()}/low-stock`, {
      params: { limit },
    })
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Reports
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get sales report
   */
  async getSalesReport(params?: ReportParams): Promise<SalesReport> {
    const response = await api.get<{ data: SalesReport }>(`${prefix()}/reports/sales`, { params })
    return response.data.data
  },

  /**
   * Get vendor report
   */
  async getVendorReport(vendorId: number, params?: ReportParams): Promise<VendorReport> {
    const response = await api.get<{ data: VendorReport }>(
      `${prefix()}/reports/vendor/${vendorId}`,
      { params }
    )
    return response.data.data
  },

  /**
   * Get product report
   */
  async getProductReport(productId: number, params?: ReportParams): Promise<ProductReport> {
    const response = await api.get<{ data: ProductReport }>(
      `${prefix()}/reports/product/${productId}`,
      { params }
    )
    return response.data.data
  },

  /**
   * Export sales report
   */
  async exportSalesReport(params?: ReportParams, format: 'csv' | 'xlsx' | 'pdf' = 'xlsx'): Promise<Blob> {
    const response = await api.get(`${prefix()}/reports/sales/export`, {
      params: { ...params, format },
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export vendor report
   */
  async exportVendorReport(vendorId: number, params?: ReportParams, format: 'csv' | 'xlsx' | 'pdf' = 'xlsx'): Promise<Blob> {
    const response = await api.get(`${prefix()}/reports/vendor/${vendorId}/export`, {
      params: { ...params, format },
      responseType: 'blob',
    })
    return response.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Comparison
  // ─────────────────────────────────────────────────────────────────

  /**
   * Compare periods (e.g., this month vs last month)
   */
  async comparePeriods(currentRange: DateRange, previousRange: DateRange): Promise<{
    current: DashboardStats
    previous: DashboardStats
    changes: Record<string, number>
  }> {
    const response = await api.post<{
      data: {
        current: DashboardStats
        previous: DashboardStats
        changes: Record<string, number>
      }
    }>(`${prefix()}/compare`, { current_range: currentRange, previous_range: previousRange })
    return response.data.data
  },
}
