// ═══════════════════════════════════════════════════════════════════
// Activity Log Service
// API service for system activity logs and audit trail
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type { ActivityEntry, ActivityStats, ActivityFilters } from '@/types/activity'
import type { PaginatedResponse } from '@/types/common'

const BASE_PATH = '/admin/activity-logs'

export const activityService = {
  /**
   * Get paginated activity logs
   */
  async getActivities(filters: ActivityFilters = {}): Promise<PaginatedResponse<ActivityEntry>> {
    const params: Record<string, unknown> = {}
    
    if (filters.action && filters.action !== 'all') params.action = filters.action
    if (filters.user_type && filters.user_type !== 'all') params.user_type = filters.user_type
    if (filters.date_range) params.date_range = filters.date_range
    if (filters.search) params.search = filters.search
    if (filters.per_page) params.per_page = filters.per_page
    if (filters.page) params.page = filters.page

    const response = await api.get<{ success: boolean; data: ActivityEntry[]; meta: PaginatedResponse<ActivityEntry>['meta'] }>(
      BASE_PATH,
      { params }
    )
    
    return {
      data: response.data.data,
      meta: response.data.meta,
    }
  },

  /**
   * Get activity statistics for today
   */
  async getStats(): Promise<ActivityStats> {
    const response = await api.get<{ success: boolean; data: ActivityStats }>(`${BASE_PATH}/stats`)
    return response.data.data
  },

  /**
   * Export activity logs (placeholder for future implementation)
   */
  async exportLogs(filters: ActivityFilters = {}): Promise<Blob> {
    const params: Record<string, unknown> = { ...filters, export: true }
    const response = await api.get(`${BASE_PATH}/export`, {
      params,
      responseType: 'blob',
    })
    return response.data as Blob
  },
}

export default activityService
