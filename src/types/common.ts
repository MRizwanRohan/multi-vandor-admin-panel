// ═══════════════════════════════════════════════════════════════════
// Common Types — Pagination, API Responses, Meta
// ═══════════════════════════════════════════════════════════════════

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginationLinks {
  first: string
  last: string
  prev: string | null
  next: string | null
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta | string
  links?: PaginationLinks
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
  links: PaginationLinks
}

export interface ValidationError {
  message: string
  errors: Record<string, string[]>
}

export interface QueryParams {
  page?: number
  per_page?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  [key: string]: string | number | boolean | undefined
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

export interface TableColumn<T = unknown> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T) => string | number
}

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: string | null
  direction: SortDirection
}
