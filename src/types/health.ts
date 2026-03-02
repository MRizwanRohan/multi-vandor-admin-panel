// ═══════════════════════════════════════════════════════════════════
// Health Monitoring Types
// ═══════════════════════════════════════════════════════════════════

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'
export type IncidentSeverity = 'critical' | 'warning' | 'info'
export type IncidentStatus = 'ongoing' | 'acknowledged' | 'resolved'
export type HealthMetricType = 'cpu' | 'memory' | 'disk' | 'swap' | 'load_1' | 'load_5' | 'load_15'

// Resource metrics
export interface HealthMetrics {
  cpu: number
  memory: number
  memory_used: number
  memory_total: number
  disk: number
  disk_used: number
  disk_total: number
  swap: number
  swap_used: number
  swap_total: number
  load_1?: number
  load_5?: number
  load_15?: number
}

// Service health status
export interface ServiceHealth {
  name: string
  status: ServiceStatus
  uptime?: string
  response_time?: string | number
  last_check?: string
  details?: Record<string, unknown>
}

// Service history entry
export interface ServiceHistoryEntry {
  id: number
  service_name: string
  status: ServiceStatus
  response_time_ms: number
  error_message?: string
  checked_at: string
}

// Health incident
export interface HealthIncident {
  id: number
  service_name: string
  title: string
  description?: string
  severity: IncidentSeverity
  status: IncidentStatus
  started_at: string
  acknowledged_at?: string
  resolved_at?: string
  acknowledged_by?: string
  resolution?: string
  created_at: string
  updated_at: string
}

// Dashboard summary
export interface HealthSummary {
  total_services: number
  operational: number
  degraded: number
  down: number
  uptime_percentage: number
}

// Dashboard data
export interface HealthDashboard {
  uptime: {
    percentage: number
    since: string
    formatted: string
  }
  metrics: HealthMetrics
  services: ServiceHealth[]
  active_incidents: HealthIncident[]
  recent_incidents: HealthIncident[]
  summary: HealthSummary
  updated_at: string
}

// Metrics chart point
export interface MetricsChartPoint {
  timestamp: string
  value: number
}

// Metrics chart data
export interface MetricsChartData {
  metric: HealthMetricType
  points: MetricsChartPoint[]
  min: number
  max: number
  avg: number
}

// Incident statistics
export interface IncidentStatistics {
  total: number
  by_severity: {
    critical: number
    warning: number
    info: number
  }
  by_status: {
    ongoing: number
    acknowledged: number
    resolved: number
  }
  mttr?: number // Mean time to resolve (seconds)
  by_service?: Record<string, number>
}

// API filter params
export interface IncidentFilters {
  status?: IncidentStatus
  severity?: IncidentSeverity
  service?: string
  days?: number
  per_page?: number
  page?: number
}

export interface MetricsChartParams {
  metric: HealthMetricType
  hours?: number
  interval?: '1 minute' | '5 minutes' | '15 minutes' | '1 hour'
}
