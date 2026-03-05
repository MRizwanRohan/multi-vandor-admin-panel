// ═══════════════════════════════════════════════════════════════════
// Analytics & Dashboard Types — Matches Laravel backend responses
// ═══════════════════════════════════════════════════════════════════

// ── Dashboard ──

export type DashboardPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year'

export interface DashboardStatsCard {
  key: string
  label: string
  value: number
  formatted: string
  change_percent: number
  trend: 'up' | 'down' | 'neutral'
  icon: string
  color: string
}

export interface DashboardRecentOrder {
  id: number
  order_number: string
  customer_name: string
  vendor_store: string
  total_amount: number
  status: {
    value: string
    label: string
    color: string
  }
  payment_status: string
  created_at: string
}

export interface DashboardPendingActions {
  pending_orders: number
  pending_vendor_approvals: number
  pending_product_reviews: number
  pending_payouts: number
  low_stock_alerts: number
  pending_category_approvals: number
  unread_contact_messages: number
}

export interface DashboardRevenueChart {
  labels: string[]
  datasets: {
    revenue: number[]
    orders: number[]
  }
}

export interface DashboardTopProduct {
  product_name: string
  total_sold: number
  revenue: number
}

export interface DashboardOrderStatusDistribution {
  pending: number
  confirmed: number
  processing: number
  shipped: number
  delivered: number
  completed: number
  cancelled: number
  refunded: number
}

export interface DashboardResponse {
  stats_cards: DashboardStatsCard[]
  recent_orders: DashboardRecentOrder[]
  pending_actions: DashboardPendingActions
  revenue_chart: DashboardRevenueChart
  top_products: DashboardTopProduct[]
  order_status_distribution: DashboardOrderStatusDistribution
}

// ── Sales Analytics ──

export interface SalesOverview {
  total_revenue: number
  total_orders: number
  average_order_value: number
  total_items_sold: number
  comparison: {
    revenue_change: number
    orders_change: number
    aov_change: number
  }
}

export interface SalesAnalyticsResponse {
  overview: SalesOverview
  revenue_by_status: Record<string, number>
  orders_by_status: Record<string, number>
  payment_methods: { method: string; count: number; total: number }[]
}

export interface SalesChartResponse {
  labels: string[]
  datasets: {
    orders: number[]
    revenue: number[]
  }
  period: string
  group_by: string
}

// ── Top Products ──

export interface AnalyticsTopProduct {
  product_id: number
  product_name: string
  product_slug: string
  category: string | null
  vendor_store: string | null
  total_sold: number
  total_revenue: number
  average_rating: number
  image_url?: string | null
}

// ── Top Vendors ──

export interface AnalyticsTopVendor {
  vendor_id: number
  store_name: string
  owner_name: string
  total_orders: number
  total_revenue: number
  total_products: number
  average_rating: number
  commission_earned: number
  trend: 'up' | 'down' | 'neutral'
  change_percent: number
}

// ── Revenue by Category ──

export interface RevenueByCategory {
  category_id: number
  category_name: string
  total_revenue: number
  percentage: number
  total_orders: number
  total_items: number
}

// ── Customer Insights ──

export interface CustomerInsightsResponse {
  total_customers: number
  new_customers: number
  returning_customers: number
  new_vs_returning_ratio: number
  comparison: {
    total_change: number
    new_change: number
  }
  top_customers: {
    customer_id: number
    name: string
    email: string
    total_orders: number
    total_spent: number
    last_order_at: string
  }[]
  customer_acquisition: {
    labels: string[]
    data: number[]
  }
}

// ── Inventory Overview ──

export interface InventoryOverviewResponse {
  total_products: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  total_stock_value: number
  categories_with_low_stock: {
    category_id: number
    category_name: string
    low_stock_count: number
    out_of_stock_count: number
  }[]
  recent_stock_alerts: {
    product_id: number
    product_name: string
    sku: string
    current_stock: number
    threshold: number
    status: 'low' | 'out_of_stock'
    updated_at: string
  }[]
}

// ── Platform Summary ──

export interface PlatformMetric {
  value: number
  change_percent: number
  trend: 'up' | 'down' | 'neutral'
}

export interface PlatformSummaryResponse {
  gmv: PlatformMetric
  net_revenue: PlatformMetric
  total_orders: PlatformMetric
  average_order_value: PlatformMetric
  active_customers: PlatformMetric
  active_vendors: PlatformMetric
  conversion_rate: PlatformMetric
  refund_rate: PlatformMetric
  pending_payouts: PlatformMetric
}

// ── Analytics Query Params ──

export interface AnalyticsParams {
  period?: DashboardPeriod | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'custom'
  start_date?: string
  end_date?: string
  group_by?: 'day' | 'week' | 'month'
  limit?: number
  fresh?: boolean
}

// ── Export/Import Types ──

export interface ExportFilters {
  status?: string
  payment_status?: string
  start_date?: string
  end_date?: string
  format?: 'xlsx' | 'csv'
  queue?: boolean
  category_id?: number
  low_stock?: boolean
}

export interface ExportStatus {
  id: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filename: string
  progress: number
  download_url: string | null
}

export interface ImportResult {
  success_count: number
  failure_count: number
  errors: { row: number; field: string; message: string }[]
}

// ── Legacy compatibility aliases ──

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  fill?: boolean
}

export interface ReportParams {
  period?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'custom'
  date_from?: string
  date_to?: string
  group_by?: 'day' | 'week' | 'month'
  vendor_id?: number
  category_id?: number
}

// Keep old names for backward compatibility with existing report pages
export type DashboardStats = DashboardResponse
export type StatCard = DashboardStatsCard
export type RevenueChartData = DashboardRevenueChart & { total: number; average: number }
export type TopProduct = DashboardTopProduct & { id: number; slug: string; image: string | null }
export type TopVendor = AnalyticsTopVendor
export type TopCategory = RevenueByCategory
export type PendingAction = {
  type: 'product' | 'category' | 'vendor' | 'order' | 'review' | 'refund' | 'payout'
  count: number
  label: string
  route: string
  color: 'red' | 'yellow' | 'blue' | 'orange' | 'green'
}
export type ActivityItem = {
  id: number
  type: string
  message: string
  user: string
  user_avatar: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ── Vendor Dashboard ──
export interface VendorDashboardStats {
  revenue: { value: number; formatted: string; change: number; change_type: 'increase' | 'decrease' | 'neutral'; period: string }
  orders: { value: number; formatted: string; change: number; change_type: 'increase' | 'decrease' | 'neutral'; period: string }
  products: { value: number; formatted: string; change: number; change_type: 'increase' | 'decrease' | 'neutral'; period: string }
  rating: { value: number; formatted: string; change: number; change_type: 'increase' | 'decrease' | 'neutral'; period: string }
  pending_orders: number
  low_stock_count: number
  available_balance: number
  pending_balance: number
}

export interface LowStockAlert {
  id: number
  name: string
  slug: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  variant_name: string | null
}
