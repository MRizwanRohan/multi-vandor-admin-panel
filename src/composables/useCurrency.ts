// ═══════════════════════════════════════════════════════════════════
// useCurrency Composable — BDT currency formatting utilities
// ═══════════════════════════════════════════════════════════════════

import { computed, type MaybeRef, unref } from 'vue'
import { formatCurrency, formatCompactNumber } from '@/utils/format'
import { CURRENCY_SYMBOL } from '@/utils/constants'

export function useCurrency() {
  /**
   * Format number as BDT currency (returns computed ref)
   */
  function format(
    amount: MaybeRef<number | string | null | undefined>,
    options?: { showSymbol?: boolean; decimals?: number; compact?: boolean }
  ) {
    return computed(() => formatCurrency(unref(amount) as number, options))
  }

  /**
   * Format number as BDT currency (returns string directly)
   */
  function formatCurrencyValue(
    amount: number | string | null | undefined,
    options?: { showSymbol?: boolean; decimals?: number; compact?: boolean }
  ): string {
    return formatCurrency(amount as number, options)
  }

  /**
   * Format number in compact form (e.g., 1.25L, 2.5Cr)
   */
  function compact(amount: MaybeRef<number>) {
    return computed(() => {
      const value = unref(amount)
      return `${CURRENCY_SYMBOL}${formatCompactNumber(value)}`
    })
  }

  /**
   * Parse currency string to number
   */
  function parse(value: string): number {
    // Remove currency symbol and commas
    const cleaned = value.replace(/[৳,\s]/g, '')
    return parseFloat(cleaned) || 0
  }

  /**
   * Format price range
   */
  function range(min: number, max: number): string {
    if (min === max) {
      return formatCurrency(min)
    }
    return `${formatCurrency(min)} - ${formatCurrency(max)}`
  }

  /**
   * Format discount
   */
  function discount(original: number, discounted: number): { amount: string; percentage: string } {
    const amount = original - discounted
    const percentage = ((amount / original) * 100).toFixed(0)
    return {
      amount: formatCurrency(amount),
      percentage: `${percentage}%`,
    }
  }

  return {
    symbol: CURRENCY_SYMBOL,
    format,
    formatCurrency: formatCurrencyValue,
    compact,
    parse,
    range,
    discount,
  }
}
