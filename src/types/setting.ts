// ═══════════════════════════════════════════════════════════════════
// Settings Types
// ═══════════════════════════════════════════════════════════════════

export type SettingType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'multiselect' 
  | 'json' 
  | 'image' 
  | 'color' 
  | 'email' 
  | 'url' 
  | 'date' 
  | 'time' 
  | 'datetime'

export type SettingGroup = 
  | 'general' 
  | 'business' 
  | 'security' 
  | 'email' 
  | 'sms' 
  | 'payment' 
  | 'shipping' 
  | 'features' 
  | 'social' 
  | 'seo'

export interface Setting {
  id: number
  key: string
  value: string | number | boolean | object | null
  display_name: string
  description: string | null
  type: SettingType
  group: SettingGroup
  options: SettingOption[] | null
  validation_rules: SettingValidationRules | null
  is_public: boolean
  is_encrypted: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface SettingOption {
  value: string | number
  label: string
}

export interface SettingValidationRules {
  required?: boolean
  min?: number
  max?: number
  min_length?: number
  max_length?: number
  regex?: string
  allowed_values?: (string | number)[]
}

export interface SettingGroupInfo {
  key: SettingGroup
  name: string
  description: string
  icon: string
  settings_count: number
}

// ── DTOs ──
export interface CreateSettingRequest {
  key: string
  value: string | number | boolean | object
  display_name: string
  description?: string
  type: SettingType
  group: SettingGroup
  options?: SettingOption[]
  validation_rules?: SettingValidationRules
  is_public?: boolean
  is_encrypted?: boolean
  display_order?: number
}

export interface UpdateSettingRequest {
  value: string | number | boolean | object
  display_name?: string
  description?: string
  options?: SettingOption[]
  validation_rules?: SettingValidationRules
  is_public?: boolean
  display_order?: number
}

export interface BulkUpdateSettingsRequest {
  settings: { key: string; value: string | number | boolean | object }[]
}

export interface SettingListParams {
  page?: number
  per_page?: number
  search?: string
  group?: SettingGroup
  type?: SettingType
  is_public?: boolean
}
