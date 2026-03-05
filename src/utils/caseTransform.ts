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
 * Check if a value is a plain object (not Date, File, RegExp, Map, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  if (value instanceof Date) return false
  if (value instanceof File) return false
  if (value instanceof Blob) return false
  if (value instanceof RegExp) return false
  if (value instanceof Map) return false
  if (value instanceof Set) return false
  if (value instanceof Error) return false
  if (value instanceof ArrayBuffer) return false
  if (ArrayBuffer.isView(value)) return false
  return true
}

/**
 * Recursively convert all keys in an object from snake_case to camelCase.
 * Handles nested objects, arrays, and preserves non-object values.
 * Uses WeakSet to detect circular references.
 * Also keeps original snake_case keys for backward compatibility.
 */
export function keysToCamel(obj: unknown, seen?: WeakSet<object>): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamel(item, seen))
  }

  if (isPlainObject(obj)) {
    // Circular reference detection
    if (!seen) seen = new WeakSet()
    if (seen.has(obj)) return obj
    seen.add(obj)

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key)
      const transformed = keysToCamel(value, seen)
      result[camelKey] = transformed
      // Keep original snake_case key for backward compatibility
      if (camelKey !== key) {
        result[key] = transformed
      }
    }
    return result
  }

  return obj
}

/**
 * Recursively convert all keys in an object from camelCase to snake_case.
 * Uses WeakSet to detect circular references.
 */
export function keysToSnake(obj: unknown, seen?: WeakSet<object>): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnake(item, seen))
  }

  if (isPlainObject(obj)) {
    // Circular reference detection
    if (!seen) seen = new WeakSet()
    if (seen.has(obj)) return obj
    seen.add(obj)

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[camelToSnake(key)] = keysToSnake(value, seen)
    }
    return result
  }

  return obj
}
