// Utility functions for working with country codes and names

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
let allCodes: string[] = []
// Some JS environments (especially older Node versions or certain browsers)
// support Intl.supportedValuesOf but reject the "region" key with a RangeError.
// We'll attempt to call it inside a try/catch; failure simply leaves the list empty.
try {
  if (typeof Intl.supportedValuesOf === 'function') {
    allCodes = Intl.supportedValuesOf('region')
  }
} catch (e) {
  console.warn('Intl.supportedValuesOf("region") failed, falling back to empty array', e)
}
// Normalize to uppercase 2-letter ISO code

// Normalize to uppercase 2-letter ISO code
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * Given a country name or ISO code, return the 2-letter ISO code if valid.
 * Returns null when no matching code is found.
 */
export function getCountryCode(input: string): string | null {
  const t = input.trim()
  if (!t) return null
  if (t.length === 2) {
    const code = normalizeCode(t)
    if (allCodes.includes(code)) return code
    return null
  }
  // try to match by display name (case-insensitive)
  const lower = t.toLowerCase()
  for (const code of allCodes) {
    const name = regionNames.of(code)
    if (name && name.toLowerCase() === lower) {
      return code
    }
  }
  return null
}

/**
 * Return the display name for a given 2-letter country code.
 * If code is invalid, returns the original string.
 */
export function getCountryName(code: string): string {
  const c = normalizeCode(code)
  if (allCodes.includes(c)) {
    const name = regionNames.of(c)
    return name || c
  }
  return code
}

// Prebuilt list of common countries with both name and code (for quick buttons)
export const commonCountryList: Array<{ name: string; code: string }> = [
  { name: 'Bangladesh', code: 'BD' },
  { name: 'India', code: 'IN' },
  { name: 'Pakistan', code: 'PK' },
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Canada', code: 'CA' },
  { name: 'Australia', code: 'AU' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Japan', code: 'JP' },
  { name: 'China', code: 'CN' },
  { name: 'Singapore', code: 'SG' },
  { name: 'Malaysia', code: 'MY' },
  { name: 'UAE', code: 'AE' },
  { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Nepal', code: 'NP' },
  { name: 'Sri Lanka', code: 'LK' },
]
