// ─────────────────────────────────────────────────────────────────────────────
// Search Types — shapes returned by /api/v1/{admin|vendor}/search
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchProduct {
  id: number
  name: string
  slug: string
  sku: string | null
  price: number
  status: string
  is_active: boolean
  vendor?: string | null   // admin only
  category?: string | null
  url: string
}

export interface SearchOrder {
  id: number
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  customer: string | null
  customer_email?: string | null  // admin only
  created_at: string | null
  url: string
}

export interface SearchCustomer {
  id: number
  name: string
  email: string
  phone: string | null
  status: string
  created_at: string | null
  url: string
}

export interface SearchVendor {
  id: number
  store_name: string
  store_slug: string
  business_name: string | null
  email: string | null
  status: string
  total_sales: number
  average_rating: number | null
  url: string
}

export interface SearchCategory {
  id: number
  name: string
  slug: string
  parent: string | null
  status: string
  is_active: boolean
  product_count: number
  url: string
}

export interface SearchBrand {
  id: number
  name: string
  slug: string
  logo: string | null
  is_active: boolean
  products_count: number
  url: string
}

/** Meta returned alongside search results */
export interface SearchMeta {
  query: string
  type: string
  total_results: number
}

/** Full admin search response (data property of API envelope) */
export interface AdminSearchResults {
  products?: SearchProduct[]
  orders?: SearchOrder[]
  customers?: SearchCustomer[]
  vendors?: SearchVendor[]
  categories?: SearchCategory[]
  brands?: SearchBrand[]
}

/** Full vendor search response (data property of API envelope) */
export interface VendorSearchResults {
  products?: SearchProduct[]
  orders?: SearchOrder[]
}

export type SearchType =
  | 'all'
  | 'products'
  | 'orders'
  | 'customers'
  | 'vendors'
  | 'categories'
  | 'brands'
