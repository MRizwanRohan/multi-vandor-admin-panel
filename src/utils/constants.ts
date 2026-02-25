// ═══════════════════════════════════════════════════════════════════
// Constants — App-wide constants and enums
// ═══════════════════════════════════════════════════════════════════

// App Info
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MVE Dashboard'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'

// Pagination
export const DEFAULT_PAGE_SIZE = 15
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100]

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_IMAGES = 10
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Currency
export const DEFAULT_CURRENCY = 'BDT'
export const CURRENCY_SYMBOL = '৳'
export const CURRENCY_LOCALE = 'en-BD'

// Timezone
export const DEFAULT_TIMEZONE = 'Asia/Dhaka'

// Debounce
export const DEBOUNCE_DELAY = 300

// Status Colors
export const STATUS_COLORS = {
  // Generic
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-400' },
  pending: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-300', dot: 'bg-warning-500' },
  approved: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-300', dot: 'bg-success-500' },
  active: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-300', dot: 'bg-success-500' },
  rejected: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-300', dot: 'bg-danger-500' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', dot: 'bg-gray-400' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', dot: 'bg-gray-400' },
  suspended: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-300', dot: 'bg-danger-500' },
  banned: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-300', dot: 'bg-danger-500' },
  
  // Order Status
  confirmed: { bg: 'bg-info-50', text: 'text-info-700', border: 'border-info-300', dot: 'bg-info-500' },
  processing: { bg: 'bg-info-50', text: 'text-info-700', border: 'border-info-300', dot: 'bg-info-500' },
  shipped: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-300', dot: 'bg-primary-500' },
  delivered: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-300', dot: 'bg-success-500' },
  completed: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-300', dot: 'bg-success-500' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', dot: 'bg-gray-400' },
  returned: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-300', dot: 'bg-warning-500' },
  refunded: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-300', dot: 'bg-warning-500' },
  
  // Payment Status
  paid: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-300', dot: 'bg-success-500' },
  failed: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-300', dot: 'bg-danger-500' },
  partially_refunded: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-300', dot: 'bg-warning-500' },
} as const

// Status Labels
export const STATUS_LABELS: Record<string, string> = {
  // Product
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
  
  // Order
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
  
  // Generic
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  banned: 'Banned',
  
  // Payment
  paid: 'Paid',
  failed: 'Failed',
  partially_refunded: 'Partially Refunded',
}

// Data Types for Attributes
export const ATTRIBUTE_DATA_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select (Single)' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'boolean', label: 'Yes/No' },
]

// Setting Types
export const SETTING_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Switch (On/Off)' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'json', label: 'JSON' },
  { value: 'image', label: 'Image' },
  { value: 'color', label: 'Color' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & Time' },
]

// Setting Groups
export const SETTING_GROUPS = [
  { value: 'general', label: 'General', icon: 'Cog6ToothIcon' },
  { value: 'business', label: 'Business', icon: 'BuildingStorefrontIcon' },
  { value: 'security', label: 'Security', icon: 'ShieldCheckIcon' },
  { value: 'email', label: 'Email', icon: 'EnvelopeIcon' },
  { value: 'sms', label: 'SMS', icon: 'ChatBubbleLeftIcon' },
  { value: 'payment', label: 'Payment', icon: 'CreditCardIcon' },
  { value: 'shipping', label: 'Shipping', icon: 'TruckIcon' },
  { value: 'features', label: 'Features', icon: 'SparklesIcon' },
  { value: 'social', label: 'Social', icon: 'ShareIcon' },
  { value: 'seo', label: 'SEO', icon: 'MagnifyingGlassIcon' },
]
