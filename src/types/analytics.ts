// ═══════════════════════════════════════════════════════════════════
// Analytics & Dashboard Types
// ═══════════════════════════════════════════════════════════════════

export interface DashboardStats {
  revenue: StatCard
  orders: StatCard
  products: StatCard
  vendors?: StatCard
  customers?: StatCard
  rating?: StatCard
}

export interface StatCard {
  value: number
  formatted: string
  change: number
  change_type: 'increase' | 'decrease' | 'neutral'
  period: string
}

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

export interface RevenueChartData extends ChartData {
  total: number
  average: number
}

export interface TopProduct {
  id: number
  name: string
  slug: string
  image: string | null
  revenue: number
  units_sold: number
}

export interface TopVendor {
  id: number
  store_name: string
  logo_url: string | null
  revenue: number
  order_count: number
  rating: number
}

export interface TopCategory {
  id: number
  name: string
  slug: string
  revenue: number
  product_count: number
}

export interface PendingAction {
  type: 'product' | 'category' | 'vendor' | 'order' | 'review' | 'refund' | 'payout'
  count: number
  label: string
  route: string
  color: 'red' | 'yellow' | 'blue' | 'orange' | 'green'
}

export interface ActivityItem {
  id: number
  type: string
  message: string
  user: string
  user_avatar: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface ReportParams {
  period?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'custom'
  date_from?: string
  date_to?: string
  group_by?: 'day' | 'week' | 'month'
  vendor_id?: number
  category_id?: number
}

// ── Vendor Dashboard ──
export interface VendorDashboardStats {
  revenue: StatCard
  orders: StatCard
  products: StatCard
  rating: StatCard
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
