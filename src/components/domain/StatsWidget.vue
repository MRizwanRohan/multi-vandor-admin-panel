<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Stats Widget — Flexible statistics display widget -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/solid'

interface StatItem {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: Component
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
}

interface Props {
  title?: string
  stats: StatItem[]
  columns?: 2 | 3 | 4 | 5
  loading?: boolean
  variant?: 'default' | 'compact' | 'minimal'
}

const props = withDefaults(defineProps<Props>(), {
  columns: 4,
  loading: false,
  variant: 'default'
})

// Grid columns class
const gridClass = computed(() => {
  const cols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-5'
  }
  return cols[props.columns]
})

// Color classes for icons
const getIconClasses = (color: string = 'primary') => {
  const colors = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400',
    success: 'bg-success-100 text-success-600 dark:bg-success-900/50 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/50 dark:text-warning-400',
    danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/50 dark:text-danger-400',
    info: 'bg-info-100 text-info-600 dark:bg-info-900/50 dark:text-info-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
  return colors[color as keyof typeof colors] || colors.primary
}

// Trend color classes
const getTrendClasses = (trend?: string) => {
  if (trend === 'up') return 'text-success-600 dark:text-success-400'
  if (trend === 'down') return 'text-danger-600 dark:text-danger-400'
  return 'text-gray-500 dark:text-gray-400'
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <!-- Title -->
    <div
      v-if="title"
      class="border-b border-gray-200 px-6 py-4 dark:border-gray-700"
    >
      <h3 class="font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h3>
    </div>

    <!-- Stats Grid -->
    <div
      :class="[
        'grid gap-4 p-6',
        gridClass,
        variant === 'compact' ? 'gap-3 p-4' : '',
        variant === 'minimal' ? 'gap-2 p-4' : ''
      ]"
    >
      <!-- Loading State -->
      <template v-if="loading">
        <div
          v-for="n in columns"
          :key="n"
          class="animate-pulse space-y-2"
        >
          <div class="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </template>

      <!-- Stats -->
      <template v-else>
        <div
          v-for="(stat, index) in stats"
          :key="index"
          :class="[
            'relative',
            variant === 'default' ? 'rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50' : '',
            variant === 'compact' ? 'rounded-lg border border-gray-200 p-3 dark:border-gray-700' : '',
            variant === 'minimal' ? 'border-l-4 pl-4' : '',
            variant === 'minimal' && stat.color ? `border-${stat.color}-500` : ''
          ]"
        >
          <!-- Default & Compact Variants -->
          <template v-if="variant !== 'minimal'">
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <!-- Label -->
                <p
                  :class="[
                    'text-gray-500 dark:text-gray-400',
                    variant === 'compact' ? 'text-xs' : 'text-sm'
                  ]"
                >
                  {{ stat.label }}
                </p>

                <!-- Value -->
                <p
                  :class="[
                    'font-bold text-gray-900 dark:text-white',
                    variant === 'compact' ? 'mt-1 text-lg' : 'mt-2 text-2xl'
                  ]"
                >
                  {{ stat.value }}
                </p>

                <!-- Change -->
                <div
                  v-if="stat.change !== undefined"
                  :class="[
                    'flex items-center',
                    variant === 'compact' ? 'mt-1 text-xs' : 'mt-2 text-sm',
                    getTrendClasses(stat.trend)
                  ]"
                >
                  <ArrowUpIcon
                    v-if="stat.trend === 'up'"
                    class="mr-1 h-3 w-3"
                  />
                  <ArrowDownIcon
                    v-else-if="stat.trend === 'down'"
                    class="mr-1 h-3 w-3"
                  />
                  <span class="font-medium">
                    {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}%
                  </span>
                  <span
                    v-if="stat.changeLabel"
                    class="ml-1 text-gray-500 dark:text-gray-400"
                  >
                    {{ stat.changeLabel }}
                  </span>
                </div>
              </div>

              <!-- Icon -->
              <div
                v-if="stat.icon"
                :class="[
                  'flex shrink-0 items-center justify-center rounded-xl',
                  variant === 'compact' ? 'h-10 w-10' : 'h-12 w-12',
                  getIconClasses(stat.color)
                ]"
              >
                <component
                  :is="stat.icon"
                  :class="variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'"
                />
              </div>
            </div>
          </template>

          <!-- Minimal Variant -->
          <template v-else>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ stat.label }}
            </p>
            <div class="flex items-baseline gap-2">
              <p class="text-xl font-bold text-gray-900 dark:text-white">
                {{ stat.value }}
              </p>
              <span
                v-if="stat.change !== undefined"
                :class="['text-sm font-medium', getTrendClasses(stat.trend)]"
              >
                {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}%
              </span>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- Footer Slot -->
    <div
      v-if="$slots.footer"
      class="border-t border-gray-200 px-6 py-4 dark:border-gray-700"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
