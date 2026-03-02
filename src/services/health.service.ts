// ═══════════════════════════════════════════════════════════════════
// Health Monitoring Service
// API service for system health monitoring
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import type {
  HealthDashboard,
  ServiceHealth,
  ServiceHistoryEntry,
  HealthIncident,
  MetricsChartData,
  IncidentStatistics,
  IncidentFilters,
  MetricsChartParams,
} from '@/types/health'
import type { PaginatedResponse } from '@/types/common'

const BASE_PATH = '/admin/health'

export const healthService = {
  // ─── Dashboard ───────────────────────────────────────────────────

  /**
   * Get health dashboard data
   * Returns comprehensive health data including metrics, services, and incidents
   */
  async getDashboard(): Promise<HealthDashboard> {
    const response = await api.get<{ success: boolean; data: HealthDashboard }>(BASE_PATH)
    return response.data.data
  },

  // ─── Services ────────────────────────────────────────────────────

  /**
   * Get all services status
   */
  async getServices(): Promise<ServiceHealth[]> {
    const response = await api.get<{ success: boolean; data: ServiceHealth[] }>(`${BASE_PATH}/services`)
    return response.data.data
  },

  /**
   * Get single service status
   */
  async getServiceStatus(serviceName: string): Promise<ServiceHealth> {
    const response = await api.get<{ success: boolean; data: ServiceHealth }>(`${BASE_PATH}/services/${serviceName}`)
    return response.data.data
  },

  /**
   * Get service history
   */
  async getServiceHistory(serviceName: string, hours = 24): Promise<ServiceHistoryEntry[]> {
    const response = await api.get<{ success: boolean; data: ServiceHistoryEntry[] }>(
      `${BASE_PATH}/services/${serviceName}/history`,
      { params: { hours } }
    )
    return response.data.data
  },

  // ─── Metrics ─────────────────────────────────────────────────────

  /**
   * Get metrics chart data
   */
  async getMetricsChart(params: MetricsChartParams): Promise<MetricsChartData> {
    const response = await api.get<{ success: boolean; data: MetricsChartData }>(`${BASE_PATH}/metrics/chart`, {
      params: {
        metric: params.metric,
        hours: params.hours ?? 24,
        interval: params.interval ?? '5 minutes',
      },
    })
    return response.data.data
  },

  // ─── Incidents ───────────────────────────────────────────────────

  /**
   * Get incidents list with filters
   */
  async getIncidents(filters?: IncidentFilters): Promise<PaginatedResponse<HealthIncident>> {
    const response = await api.get<{
      success: boolean
      data: HealthIncident[]
      meta: { current_page: number; last_page: number; per_page: number; total: number }
    }>(`${BASE_PATH}/incidents`, { params: filters })

    return {
      data: response.data.data,
      meta: {
        current_page: response.data.meta.current_page,
        last_page: response.data.meta.last_page,
        per_page: response.data.meta.per_page,
        total: response.data.meta.total,
        from: (response.data.meta.current_page - 1) * response.data.meta.per_page + 1,
        to: Math.min(response.data.meta.current_page * response.data.meta.per_page, response.data.meta.total),
      },
    }
  },

  /**
   * Get incident statistics
   */
  async getIncidentStatistics(days = 30): Promise<IncidentStatistics> {
    const response = await api.get<{ success: boolean; data: IncidentStatistics }>(
      `${BASE_PATH}/incidents/statistics`,
      { params: { days } }
    )
    return response.data.data
  },

  /**
   * Get single incident
   */
  async getIncident(id: number): Promise<HealthIncident> {
    const response = await api.get<{ success: boolean; data: HealthIncident }>(`${BASE_PATH}/incidents/${id}`)
    return response.data.data
  },

  /**
   * Acknowledge incident
   */
  async acknowledgeIncident(id: number): Promise<HealthIncident> {
    const response = await api.post<{ success: boolean; data: HealthIncident }>(
      `${BASE_PATH}/incidents/${id}/acknowledge`
    )
    return response.data.data
  },

  /**
   * Resolve incident
   */
  async resolveIncident(id: number, resolution?: string): Promise<HealthIncident> {
    const response = await api.post<{ success: boolean; data: HealthIncident }>(
      `${BASE_PATH}/incidents/${id}/resolve`,
      { resolution }
    )
    return response.data.data
  },

  // ─── Actions ─────────────────────────────────────────────────────

  /**
   * Run manual health check
   */
  async runHealthCheck(): Promise<{
    system_status: string
    services_checked: number
    active_incidents: number
    checked_at: string
  }> {
    const response = await api.post<{
      success: boolean
      message: string
      data: {
        system_status: string
        services_checked: number
        active_incidents: number
        checked_at: string
      }
    }>(`${BASE_PATH}/check`)
    return response.data.data
  },

  /**
   * Test alert configuration
   */
  async testAlert(severity: 'critical' | 'warning' | 'info' = 'info'): Promise<void> {
    await api.post(`${BASE_PATH}/test-alert`, { severity })
  },

  /**
   * Clear alert cooldown for a service
   */
  async clearCooldown(service: string): Promise<number> {
    const response = await api.post<{ success: boolean; message: string }>(`${BASE_PATH}/clear-cooldown`, { service })
    // Extract count from message like "Cleared cooldown for 2 alert(s)"
    const match = response.data.message.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  },
}

export default healthService
