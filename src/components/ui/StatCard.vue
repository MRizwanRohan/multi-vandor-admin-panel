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
  <div class="card">
    <div class="flex items-start justify-between">
      <!-- Content -->
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ title }}
        </p>
        
        <!-- Loading state -->
        <div v-if="loading" class="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        
        <!-- Value -->
        <p v-else class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {{ value }}
        </p>

        <!-- Change indicator -->
        <div
          v-if="change !== undefined && !loading"
          class="mt-2 flex items-center text-sm"
          :class="trendClass"
        >
          <component
            v-if="TrendIcon"
            :is="TrendIcon"
            class="mr-1 h-4 w-4"
          />
          <span class="font-medium">{{ change > 0 ? '+' : '' }}{{ change }}%</span>
          <span v-if="changeLabel" class="ml-1 text-gray-500 dark:text-gray-400">
            {{ changeLabel }}
          </span>
        </div>
      </div>

      <!-- Icon -->
      <div
        v-if="icon"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        :class="iconBgClass"
      >
        <component :is="icon" class="h-6 w-6" />
      </div>
    </div>
  </div>
</template>
