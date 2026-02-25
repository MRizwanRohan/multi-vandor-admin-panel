// ═══════════════════════════════════════════════════════════════════
// Settings Service — Settings API calls
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import { getRolePrefix } from './api'
import type { Setting, SettingGroup } from '@/types'

const prefix = () => `${getRolePrefix()}/settings`

export const settingsService = {
  /**
   * Get all settings
   */
  async getAll(): Promise<Setting[]> {
    const response = await api.get<{ data: Setting[] }>(prefix())
    return response.data.data
  },

  /**
   * Get settings by group
   */
  async getByGroup(group: SettingGroup): Promise<Setting[]> {
    const response = await api.get<{ data: Setting[] }>(`${prefix()}/group/${group}`)
    return response.data.data
  },

  /**
   * Get single setting by key
   */
  async getByKey(key: string): Promise<Setting> {
    const response = await api.get<{ data: Setting }>(`${prefix()}/${key}`)
    return response.data.data
  },

  /**
   * Update setting
   */
  async update(key: string, value: unknown): Promise<Setting> {
    const response = await api.put<{ data: Setting }>(`${prefix()}/${key}`, { value })
    return response.data.data
  },

  /**
   * Bulk update settings
   */
  async bulkUpdate(settings: { key: string; value: unknown }[]): Promise<Setting[]> {
    const response = await api.post<{ data: Setting[] }>(`${prefix()}/bulk`, { settings })
    return response.data.data
  },

  /**
   * Upload file setting (logo, favicon, etc.)
   */
  async uploadFile(key: string, file: File): Promise<Setting> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<{ data: Setting }>(`${prefix()}/${key}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Reset settings to default
   */
  async resetToDefault(group?: SettingGroup): Promise<void> {
    await api.post(`${prefix()}/reset`, { group })
  },

  /**
   * Get public settings (no auth required)
   */
  async getPublic(): Promise<Record<string, unknown>> {
    const response = await api.get<{ data: Record<string, unknown> }>(`${prefix()}/public`)
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Group Update Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Update settings by group (batch update for a section)
   */
  async updateByGroup(
    group: SettingGroup,
    settings: Record<string, unknown>
  ): Promise<Setting[]> {
    const response = await api.put<{ data: Setting[] }>(
      `${prefix()}/group/${group}`,
      { settings }
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Email & Notification Settings
  // ─────────────────────────────────────────────────────────────────

  /**
   * Test email configuration
   */
  async testEmail(recipientEmail?: string): Promise<TestEmailResult> {
    const response = await api.post<{ data: TestEmailResult }>(`${prefix()}/test-email`, {
      recipient: recipientEmail
    })
    return response.data.data
  },

  /**
   * Get email templates
   */
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const response = await api.get<{ data: EmailTemplate[] }>(`${prefix()}/email-templates`)
    return response.data.data
  },

  /**
   * Update email template
   */
  async updateEmailTemplate(
    templateKey: string,
    data: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    const response = await api.put<{ data: EmailTemplate }>(
      `${prefix()}/email-templates/${templateKey}`,
      data
    )
    return response.data.data
  },

  /**
   * Preview email template
   */
  async previewEmailTemplate(templateKey: string): Promise<string> {
    const response = await api.get<{ data: string }>(
      `${prefix()}/email-templates/${templateKey}/preview`
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // System & Cache Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Clear system cache
   */
  async clearCache(cacheType?: 'all' | 'config' | 'views' | 'routes' | 'data'): Promise<ClearCacheResult> {
    const response = await api.post<{ data: ClearCacheResult }>(`${prefix()}/clear-cache`, {
      type: cacheType || 'all'
    })
    return response.data.data
  },

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const response = await api.get<{ data: SystemHealthStatus }>(`${prefix()}/system-health`)
    return response.data.data
  },

  /**
   * Get system info (versions, environment)
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const response = await api.get<{ data: SystemInfo }>(`${prefix()}/system-info`)
    return response.data.data
  },

  /**
   * Run database migration (admin only)
   */
  async runMigration(): Promise<MigrationResult> {
    const response = await api.post<{ data: MigrationResult }>(`${prefix()}/run-migration`)
    return response.data.data
  },

  /**
   * Optimize system (clear temp files, optimize DB)
   */
  async optimizeSystem(): Promise<OptimizeResult> {
    const response = await api.post<{ data: OptimizeResult }>(`${prefix()}/optimize`)
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Backup & Restore
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create system backup
   */
  async createBackup(type: 'full' | 'database' | 'files'): Promise<BackupInfo> {
    const response = await api.post<{ data: BackupInfo }>(`${prefix()}/backup`, { type })
    return response.data.data
  },

  /**
   * Get available backups
   */
  async getBackups(): Promise<BackupInfo[]> {
    const response = await api.get<{ data: BackupInfo[] }>(`${prefix()}/backups`)
    return response.data.data
  },

  /**
   * Download backup file
   */
  async downloadBackup(backupId: string): Promise<Blob> {
    const response = await api.get(`${prefix()}/backups/${backupId}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    await api.delete(`${prefix()}/backups/${backupId}`)
  },
}

// ─────────────────────────────────────────────────────────────────
// Settings Service Types
// ─────────────────────────────────────────────────────────────────

export interface TestEmailResult {
  success: boolean
  message: string
  sent_to: string
  sent_at: string
  error?: string
}

export interface EmailTemplate {
  key: string
  name: string
  subject: string
  body: string
  variables: string[]
  is_active: boolean
  updated_at: string
}

export interface ClearCacheResult {
  success: boolean
  cleared: string[]
  message: string
}

export interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  checks: {
    database: HealthCheck
    cache: HealthCheck
    storage: HealthCheck
    queue: HealthCheck
    mail: HealthCheck
  }
  uptime: string
  last_checked: string
}

export interface HealthCheck {
  status: 'ok' | 'warning' | 'error'
  message: string
  response_time_ms?: number
  details?: Record<string, unknown>
}

export interface SystemInfo {
  app_version: string
  php_version: string
  laravel_version: string
  database_type: string
  cache_driver: string
  queue_driver: string
  environment: string
  debug_mode: boolean
  server_time: string
  timezone: string
}

export interface MigrationResult {
  success: boolean
  migrations_run: string[]
  message: string
}

export interface OptimizeResult {
  success: boolean
  actions: string[]
  freed_space_mb?: number
  message: string
}

export interface BackupInfo {
  id: string
  type: 'full' | 'database' | 'files'
  filename: string
  size_mb: number
  created_at: string
  created_by: string
}
