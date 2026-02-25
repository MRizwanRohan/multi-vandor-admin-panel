// ═══════════════════════════════════════════════════════════════════
// Format Utilities — Currency, Date, Number formatting
// ═══════════════════════════════════════════════════════════════════

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/bn'

import { CURRENCY_SYMBOL, DEFAULT_TIMEZONE } from './constants'

// Configure dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.tz.setDefault(DEFAULT_TIMEZONE)

// ═══════════════════════════════════════════════════════════════════
// Currency Formatting
// ═══════════════════════════════════════════════════════════════════

/**
 * Format number as BDT currency
 * @example formatCurrency(89000) → "৳89,000.00"
 * @example formatCurrency(125000.5) → "৳1,25,000.50"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: {
    showSymbol?: boolean
    decimals?: number
    compact?: boolean
  } = {}
): string {
  const { showSymbol = true, decimals = 2, compact = false } = options

  if (amount === null || amount === undefined) return showSymbol ? `${CURRENCY_SYMBOL}0.00` : '0.00'

  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(num)) return showSymbol ? `${CURRENCY_SYMBOL}0.00` : '0.00'

  if (compact && Math.abs(num) >= 100000) {
    const formatted = formatCompactNumber(num)
    return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted
  }

  // Format with Bangladeshi number system (lakhs, crores)
  const formatted = formatBangladeshiNumber(num, decimals)
  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted
}

/**
 * Format number in Bangladeshi numbering system
 * @example formatBangladeshiNumber(125000) → "1,25,000"
 */
export function formatBangladeshiNumber(num: number, decimals: number = 0): string {
  const [integer, decimal] = num.toFixed(decimals).split('.')
  
  // Indian/Bangladeshi numbering: 12,34,567
  const lastThree = integer.slice(-3)
  const otherDigits = integer.slice(0, -3)
  
  const formatted = otherDigits.length > 0
    ? otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree

  return decimal ? `${formatted}.${decimal}` : formatted
}

/**
 * Format number in compact form
 * @example formatCompactNumber(125000) → "1.25L"
 */
export function formatCompactNumber(num: number): string {
  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absNum >= 10000000) {
    return `${sign}${(absNum / 10000000).toFixed(2)}Cr`
  }
  if (absNum >= 100000) {
    return `${sign}${(absNum / 100000).toFixed(2)}L`
  }
  if (absNum >= 1000) {
    return `${sign}${(absNum / 1000).toFixed(1)}K`
  }
  return `${sign}${absNum}`
}

// ═══════════════════════════════════════════════════════════════════
// Number Formatting
// ═══════════════════════════════════════════════════════════════════

/**
 * Format number with commas
 * @example formatNumber(12345) → "12,345"
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0'
  const value = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(value)) return '0'
  return value.toLocaleString('en-US')
}

/**
 * Format percentage
 * @example formatPercentage(12.5) → "12.5%"
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format change percentage with arrow
 * @example formatChange(12.5) → "+12.5% ↑"
 */
export function formatChange(value: number): { text: string; isPositive: boolean } {
  const isPositive = value >= 0
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : ''
  const sign = value > 0 ? '+' : ''
  return {
    text: `${sign}${value.toFixed(1)}% ${arrow}`.trim(),
    isPositive,
  }
}

// ═══════════════════════════════════════════════════════════════════
// Date Formatting
// ═══════════════════════════════════════════════════════════════════

/**
 * Format date
 * @example formatDate('2026-02-23') → "23 Feb, 2026"
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: string = 'DD MMM, YYYY'
): string {
  if (!date) return '—'
  return dayjs(date).tz().format(format)
}

/**
 * Format time
 * @example formatTime('2026-02-23T10:30:00Z') → "04:30 PM"
 */
export function formatTime(
  date: string | Date | null | undefined,
  format: string = 'hh:mm A'
): string {
  if (!date) return '—'
  return dayjs(date).tz().format(format)
}

/**
 * Format date and time
 * @example formatDateTime('2026-02-23T10:30:00Z') → "23 Feb, 2026 04:30 PM"
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  format: string = 'DD MMM, YYYY hh:mm A'
): string {
  if (!date) return '—'
  return dayjs(date).tz().format(format)
}

/**
 * Format relative time
 * @example formatRelative('2026-02-23T10:30:00Z') → "2 hours ago"
 */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return dayjs(date).tz().fromNow()
}

/**
 * Format date range
 * @example formatDateRange('2026-02-01', '2026-02-28') → "Feb 1 - Feb 28, 2026"
 */
export function formatDateRange(
  start: string | Date,
  end: string | Date
): string {
  const startDate = dayjs(start).tz()
  const endDate = dayjs(end).tz()

  if (startDate.year() === endDate.year()) {
    if (startDate.month() === endDate.month()) {
      return `${startDate.format('MMM D')} - ${endDate.format('D, YYYY')}`
    }
    return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`
  }
  return `${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`
}

// ═══════════════════════════════════════════════════════════════════
// String Formatting
// ═══════════════════════════════════════════════════════════════════

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number = 50): string {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  if (!str) return ''
  return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  )
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Format phone number for Bangladesh
 * @example formatPhone('01712345678') → "+880 1712-345678"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Handle Bangladeshi numbers
  if (digits.startsWith('880')) {
    const local = digits.slice(3)
    return `+880 ${local.slice(0, 4)}-${local.slice(4)}`
  }
  if (digits.startsWith('0')) {
    return `+880 ${digits.slice(1, 5)}-${digits.slice(5)}`
  }
  
  return phone
}

/**
 * Format file size
 * @example formatFileSize(1048576) → "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
