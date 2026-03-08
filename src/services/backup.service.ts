// ═══════════════════════════════════════════════════════════════════
// Backup Service — Backup management API calls
// ═══════════════════════════════════════════════════════════════════

import api from './api'

export interface BackupFile {
  filename: string
  path: string
  size: number
  size_human: string
  created_at: string
  age: string
}

export interface BackupStats {
  total_backups: number
  total_size: number
  total_size_human: string
  oldest_backup: string | null
  newest_backup: string | null
  disk_name: string
  disk_free_space: string
}

export interface BackupHealthCheck {
  passed: boolean
  message: string
  free_space?: string
}

export interface BackupHealth {
  healthy: boolean
  checks: {
    recent_backup: BackupHealthCheck
    has_backups: BackupHealthCheck
    disk_space: BackupHealthCheck
  }
  stats: BackupStats
}

export interface BackupListResponse {
  backups: BackupFile[]
  stats: BackupStats
}

export interface BackupRunResult {
  success: boolean
  message: string
  data: { duration: number | null }
}

export const backupService = {
  /** GET /admin/backups — List all backups with stats */
  async list(): Promise<BackupListResponse> {
    const res = await api.get<{ success: boolean; data: BackupListResponse }>('/admin/backups')
    return res.data.data
  },

  /** GET /admin/backups/health — Backup health status */
  async health(): Promise<BackupHealth> {
    const res = await api.get<{ success: boolean; data: BackupHealth }>('/admin/backups/health')
    return res.data.data
  },

  /** POST /admin/backups/run — Trigger manual backup */
  async run(onlyDb = false): Promise<BackupRunResult> {
    const res = await api.post<BackupRunResult>('/admin/backups/run', { only_db: onlyDb })
    return res.data
  },

  /** POST /admin/backups/cleanup — Run cleanup */
  async cleanup(): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>('/admin/backups/cleanup')
    return res.data
  },

  /** GET /admin/backups/{filename}/download — Download backup file */
  async download(filename: string): Promise<Blob> {
    const res = await api.get(`/admin/backups/${encodeURIComponent(filename)}/download`, {
      responseType: 'blob',
    })
    return res.data
  },

  /** DELETE /admin/backups/{filename} — Delete backup */
  async delete(filename: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/admin/backups/${encodeURIComponent(filename)}`
    )
    return res.data
  },
}
