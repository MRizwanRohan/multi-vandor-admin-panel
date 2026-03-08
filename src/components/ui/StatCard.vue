<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Stat Card — Dashboard statistics card -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/solid'

interface Props {
  title: string
  value: string | number
  icon?: Component
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  color: 'primary',
})

// Icon background color
const iconBgClass = computed(() => {
  const colors = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400',
    success: 'bg-success-100 text-success-600 dark:bg-success-900/50 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/50 dark:text-warning-400',
    danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/50 dark:text-danger-400',
    info: 'bg-info-100 text-info-600 dark:bg-info-900/50 dark:text-info-400',
  }
  return colors[props.color]
})

// Trend indicator
const trendClass = computed(() => {
  if (props.trend === 'up') return 'text-success-600 dark:text-success-400'
  if (props.trend === 'down') return 'text-danger-600 dark:text-danger-400'
  return 'text-gray-500 dark:text-gray-400'
})

const TrendIcon = computed(() => {
  if (props.trend === 'up') return ArrowUpIcon
  if (props.trend === 'down') return ArrowDownIcon
  return null
})
</script>

<template>
  <!-- h-full ensures all cards in a grid row stretch to the same height -->
  <div class="card flex h-full flex-col p-5">
    <!-- Top row: icon + title/value -->
    <div class="flex items-start justify-between gap-3">
      <!-- Content -->
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ title }}
        </p>

        <!-- Loading skeleton -->
        <div v-if="loading" class="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

        <!-- Value — text-xl keeps it readable even on narrow (6-col xl) cards -->
        <p v-else class="mt-1 truncate text-xl font-bold text-gray-900 dark:text-white" :title="String(value)">
          {{ value }}
        </p>
      </div>

      <!-- Icon — slightly smaller so it fits narrow grid cells -->
      <div
        v-if="icon"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        :class="iconBgClass"
      >
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>

    <!-- Bottom row: change indicator (spacer keeps height consistent when absent) -->
    <div class="mt-3">
      <!-- Loading skeleton for change -->
      <div v-if="loading" class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

      <!-- Change indicator -->
      <div
        v-else-if="change !== undefined"
        class="flex items-center gap-1 text-sm"
        :class="trendClass"
      >
        <component v-if="TrendIcon" :is="TrendIcon" class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate font-medium">
          {{ change > 0 ? '+' : '' }}{{ change }}%
          <span v-if="changeLabel" class="font-normal text-gray-500 dark:text-gray-400">
            {{ changeLabel }}
          </span>
        </span>
      </div>

      <!-- Spacer so cards without a change badge still align with those that have one -->
      <div v-else class="h-5" />
    </div>
  </div>
</template>
