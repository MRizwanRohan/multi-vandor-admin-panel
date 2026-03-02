// ═══════════════════════════════════════════════════════════════════
// Settings Types
// ═══════════════════════════════════════════════════════════════════

export type SettingType = 
  | 'string'
  | 'integer'
  | 'float' 
  | 'boolean' 
  | 'json'
  | 'array'

export type SettingInputType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'checkbox' 
  | 'switch'
  | 'toggle'
  | 'select' 
  | 'multiselect' 
  | 'radio'
  | 'file'
  | 'image' 
  | 'color' 
  | 'email' 
  | 'url' 
  | 'password'
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
  group: string
  key: string
  display_name: string
  description: string | null
  value: string | number | boolean | object | null
  default_value: string | number | boolean | object | null
  type: SettingType
  input_type: SettingInputType
  options: (string | SettingOption)[] | null
  validation_rules: string[] | null
  sort_order: number
  is_public: boolean
  is_active: boolean
  updated_by: number | null
  updated_by_user?: { id: number; name: string } | null
  created_at: string
  updated_at: string
}

export interface SettingAudit {
  id: number
  setting_id: number
  user_id: number | null
  old_value: unknown
  new_value: unknown
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: { id: number; name: string } | null
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
