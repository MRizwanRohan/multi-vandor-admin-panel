// ═══════════════════════════════════════════════════════════════════
// Storage Utilities — localStorage wrapper with type safety
// ═══════════════════════════════════════════════════════════════════

const PREFIX = 'mve_'

/**
 * Get item from localStorage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(PREFIX + key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

/**
 * Set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
  }
}

/**
 * Clear all app items from localStorage
 */
export function clearStorage(): void {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════
// Specific Storage Keys
// ═══════════════════════════════════════════════════════════════════

export const StorageKeys = {
  TOKEN: 'auth_token',
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
  LOCALE: 'locale',
  SIDEBAR_EXPANDED: 'sidebar_expanded',
  TABLE_PAGE_SIZE: 'table_page_size',
  RECENT_SEARCHES: 'recent_searches',
} as const

// Aliases for backward compatibility
export function getItem<T = string>(key: string, defaultValue?: T): T | null {
  return getStorageItem(key, defaultValue ?? null) as T | null
}
export const setItem = setStorageItem
export const removeItem = removeStorageItem

// ═══════════════════════════════════════════════════════════════════
// Session Storage
// ═══════════════════════════════════════════════════════════════════

/**
 * Get item from sessionStorage
 */
export function getSessionItem<T>(key: string, defaultValue: T): T {
  try {
    const item = sessionStorage.getItem(PREFIX + key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

/**
 * Set item in sessionStorage
 */
export function setSessionItem<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to sessionStorage:', error)
  }
}

/**
 * Remove item from sessionStorage
 */
export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key)
  } catch (error) {
    console.error('Failed to remove from sessionStorage:', error)
  }
}
