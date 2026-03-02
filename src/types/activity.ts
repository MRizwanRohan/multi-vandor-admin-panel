/**
 * Activity Log Types
 * 
 * Types for system activity log and audit trail
 */

export type ActivityActionType = 'create' | 'update' | 'delete' | 'login' | 'settings' | 'payout'
export type ActivityResourceType = 'product' | 'category' | 'vendor' | 'order' | 'settings' | 'auth' | 'payout' | 'user' | 'unknown'

export interface ActivityEntry {
  id: number
  user: string
  user_id: number | null
  user_role: string
  action: string
  action_type: ActivityActionType
  resource: string
  resource_type: ActivityResourceType
  resource_id: number | null
  ip_address: string
  timestamp: string
  details: string
  properties?: Record<string, unknown>
}

export interface ActivityStats {
  created_today: number
  updated_today: number
  deleted_today: number
  logins_today: number
}

export interface ActivityFilters {
  action?: string
  user_type?: string
  date_range?: 'last_24h' | 'last_7_days' | 'last_30_days'
  search?: string
  per_page?: number
  page?: number
}
