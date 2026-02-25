// ═══════════════════════════════════════════════════════════════════
// Notification Types
// ═══════════════════════════════════════════════════════════════════

export type NotificationType = 
  | 'order' 
  | 'product' 
  | 'review' 
  | 'payout' 
  | 'system' 
  | 'promotion' 
  | 'stock'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  icon: string
  color: string
  data: NotificationData
  action_url: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationData {
  [key: string]: unknown
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  sound_enabled: boolean
  types: {
    [K in NotificationType]: {
      email: boolean
      push: boolean
    }
  }
}
