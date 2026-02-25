// ═══════════════════════════════════════════════════════════════════
// useDate Composable — Date formatting utilities
// ═══════════════════════════════════════════════════════════════════

import { computed, type MaybeRef, unref } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

import { DEFAULT_TIMEZONE } from '@/utils/constants'

// Configure dayjs
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(isBetween)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.tz.setDefault(DEFAULT_TIMEZONE)

export function useDate() {
  /**
   * Format date (returns computed ref)
   */
  function format(
    date: MaybeRef<string | Date | null | undefined>,
    formatStr: string = 'DD MMM, YYYY'
  ) {
    return computed(() => {
      const value = unref(date)
      if (!value) return '—'
      return dayjs(value).tz().format(formatStr)
    })
  }

  /**
   * Format date (returns string directly)
   */
  function formatDate(
    date: string | Date | null | undefined,
    formatStr: string = 'DD MMM, YYYY'
  ): string {
    if (!date) return '—'
    return dayjs(date).tz().format(formatStr)
  }

  /**
   * Format time
   */
  function formatTime(
    date: MaybeRef<string | Date | null | undefined>,
    formatStr: string = 'hh:mm A'
  ) {
    return computed(() => {
      const value = unref(date)
      if (!value) return '—'
      return dayjs(value).tz().format(formatStr)
    })
  }

  /**
   * Format date and time
   */
  function formatDateTime(
    date: MaybeRef<string | Date | null | undefined>,
    formatStr: string = 'DD MMM, YYYY hh:mm A'
  ) {
    return computed(() => {
      const value = unref(date)
      if (!value) return '—'
      return dayjs(value).tz().format(formatStr)
    })
  }

  /**
   * Format relative time (returns computed ref)
   */
  function relative(date: MaybeRef<string | Date | null | undefined>) {
    return computed(() => {
      const value = unref(date)
      if (!value) return '—'
      return dayjs(value).tz().fromNow()
    })
  }

  /**
   * Format relative time (returns string directly)
   */
  function timeAgo(date: string | Date | null | undefined): string {
    if (!date) return '—'
    return dayjs(date).tz().fromNow()
  }

  /**
   * Check if date is today
   */
  function isToday(date: string | Date): boolean {
    return dayjs(date).tz().isSame(dayjs().tz(), 'day')
  }

  /**
   * Check if date is in the past
   */
  function isPast(date: string | Date): boolean {
    return dayjs(date).tz().isBefore(dayjs().tz())
  }

  /**
   * Check if date is in the future
   */
  function isFuture(date: string | Date): boolean {
    return dayjs(date).tz().isAfter(dayjs().tz())
  }

  /**
   * Get date range presets
   */
  function getDateRangePresets() {
    const now = dayjs().tz()
    return {
      today: {
        start: now.startOf('day').toISOString(),
        end: now.endOf('day').toISOString(),
      },
      yesterday: {
        start: now.subtract(1, 'day').startOf('day').toISOString(),
        end: now.subtract(1, 'day').endOf('day').toISOString(),
      },
      last7Days: {
        start: now.subtract(6, 'day').startOf('day').toISOString(),
        end: now.endOf('day').toISOString(),
      },
      last30Days: {
        start: now.subtract(29, 'day').startOf('day').toISOString(),
        end: now.endOf('day').toISOString(),
      },
      thisMonth: {
        start: now.startOf('month').toISOString(),
        end: now.endOf('month').toISOString(),
      },
      lastMonth: {
        start: now.subtract(1, 'month').startOf('month').toISOString(),
        end: now.subtract(1, 'month').endOf('month').toISOString(),
      },
      thisYear: {
        start: now.startOf('year').toISOString(),
        end: now.endOf('year').toISOString(),
      },
    }
  }

  /**
   * Get current date in ISO format
   */
  function now(): string {
    return dayjs().tz().toISOString()
  }

  /**
   * Parse date string
   */
  function parse(date: string | Date) {
    return dayjs(date).tz()
  }

  return {
    format,
    formatDate,
    formatTime,
    formatDateTime,
    relative,
    timeAgo,
    isToday,
    isPast,
    isFuture,
    getDateRangePresets,
    now,
    parse,
    dayjs,
  }
}
