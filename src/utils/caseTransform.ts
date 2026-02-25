// ═══════════════════════════════════════════════════════════════════
// Case Transform — Convert between snake_case and camelCase
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert a snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert a camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Recursively convert all keys in an object from snake_case to camelCase.
 * Handles nested objects, arrays, and preserves non-object values.
 */
export function keysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamel(item))
  }

  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof File) && !(obj instanceof Blob)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const camelKey = snakeToCamel(key)
      result[camelKey] = keysToCamel(value)
      // Also keep original snake_case key for backward compatibility
      if (camelKey !== key) {
        result[key] = keysToCamel(value)
      }
    }
    return result
  }

  return obj
}

/**
 * Recursively convert all keys in an object from camelCase to snake_case.
 */
export function keysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnake(item))
  }

  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof File) && !(obj instanceof Blob)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[camelToSnake(key)] = keysToSnake(value)
    }
    return result
  }

  return obj
}
