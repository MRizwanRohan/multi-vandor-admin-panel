// ═══════════════════════════════════════════════════════════════════
// Auth Types — User, Login, Token, Permissions
// ═══════════════════════════════════════════════════════════════════

export type UserRole = 'customer' | 'vendor' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: number
  uuid: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  email_verified_at: string | null
  phone: string | null
  avatar: string | null
  status: UserStatus
  userType: UserRole // CamelCase version from interceptor
  user_type: UserRole // Original snake_case version
  role: UserRole // Alias for user_type
  permissions: string[]
  profile_completed: boolean
  last_login_at: string | null
  timezone: string
  preferred_currency: string
  created_at: string
  updated_at: string
  vendor?: VendorProfile | null
}

export interface VendorProfile {
  id: number
  store_name: string
  slug: string | null
  logo_url: string | null
  status: VendorStatus
}

export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected' | 'banned' | 'inactive'

export interface LoginRequest {
  login: string
  password: string
  remember?: boolean
}

export interface RegisterRequest {
  first_name: string
  last_name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
}

export interface LoginResponse {
  user: User
  token: string
  token_type: string
  expires_at: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface ChangePasswordRequest {
  current_password: string
  password: string
  password_confirmation: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  permissions: string[]
  abilities: string[]
}

// Aliases for compatibility
export type LoginCredentials = LoginRequest
export type AuthResponse = LoginResponse
export type PasswordResetRequest = ForgotPasswordRequest
export type PasswordResetConfirm = ResetPasswordRequest
export type RegisterData = RegisterRequest
