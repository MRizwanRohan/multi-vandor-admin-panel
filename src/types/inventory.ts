// ═══════════════════════════════════════════════════════════════════
// Inventory Types — Stock overview, movements, alerts, reservations
// Matches backend Resources: StockOverviewResource, InventoryLogResource, StockAlertResource
// ═══════════════════════════════════════════════════════════════════

// ── Stock Overview (from StockOverviewResource) ──────────────────

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface StockOverviewItem {
  productId: number
  variantId: number | null
  sku: string | null
  name: string
  variantName: string | null
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  lowStockThreshold: number
  isLowStock: boolean
  isOutOfStock: boolean
  status: StockStatus
  lastUpdated: string | null
}

// ── Inventory Log / Movement (from InventoryLogResource) ─────────

export type MovementType =
  | 'sale'
  | 'purchase'
  | 'adjustment'
  | 'return'
  | 'reservation'
  | 'release'
  | 'initial'
  | 'transfer'

export type ChangeDirection = 'increase' | 'decrease'

export interface InventoryLogProduct {
  id: number
  name: string
  slug: string
  sku: string
}

export interface InventoryLogVariant {
  id: number
  sku: string
}

export interface InventoryLogCreatedBy {
  id: number
  name: string
}

export interface InventoryLog {
  id: number
  productId: number
  variantId: number | null
  type: MovementType
  typeLabel: string
  quantityBefore: number
  quantityChange: number
  quantityAfter: number
  changeDirection: ChangeDirection
  referenceType: string | null
  referenceId: number | null
  createdAt: string
  product?: InventoryLogProduct
  variant?: InventoryLogVariant
  createdBy?: InventoryLogCreatedBy
}

// ── Stock Alert (from StockAlertResource) ────────────────────────

export type AlertType = 'low_stock' | 'out_of_stock' | 'restock'

export interface StockAlertProduct {
  id: number
  name: string
  slug: string
  sku: string
}

export interface StockAlertVariant {
  id: number
  sku: string
  name: string | null
}

export interface StockAlertVendor {
  id: number
  shopName: string
}

export interface StockAlert {
  id: number
  productId: number
  variantId: number | null
  alertType: AlertType
  alertTypeLabel: string
  currentStock: number
  thresholdQuantity: number
  isResolved: boolean
  notifiedAt: string | null
  createdAt: string
  updatedAt: string
  product?: StockAlertProduct
  variant?: StockAlertVariant
  vendor?: StockAlertVendor
}

// ── Admin Inventory Stats (from Admin InventoryController@stats) ─

export interface InventoryStats {
  products: {
    total: number
    inStock: number
    lowStock: number
    outOfStock: number
  }
  alerts: {
    totalUnresolved: number
    lowStock: number
    outOfStock: number
  }
  reservations: {
    activeCount: number
    totalQuantity: number
  }
  activity: {
    movements24h: number
  }
  vendors: {
    withLowStock: number
    withOutOfStock: number
  }
}

// ── API Request Params ───────────────────────────────────────────

export interface InventoryListParams {
  page?: number
  perPage?: number
  search?: string
  status?: StockStatus | ''
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface MovementListParams {
  page?: number
  perPage?: number
  productId?: number
  variantId?: number
  type?: MovementType | ''
  dateFrom?: string
  dateTo?: string
}

export interface AlertListParams {
  page?: number
  perPage?: number
  resolved?: boolean | ''
  type?: AlertType | ''
}

export interface StockAdjustmentRequest {
  productId: number
  variantId?: number
  quantity: number
  type: 'set' | 'add' | 'subtract'
  reason?: string
}

export interface BulkStockAdjustmentRequest {
  adjustments: StockAdjustmentRequest[]
}

// ── Summary objects returned alongside paginated data ─────────────

export interface StockSummary {
  totalProducts: number
  inStock: number
  lowStock: number
  outOfStock: number
  unresolvedAlerts?: number
}

export interface AlertSummary {
  total: number
  lowStock: number
  outOfStock: number
  resolved: number
  unresolved: number
}
