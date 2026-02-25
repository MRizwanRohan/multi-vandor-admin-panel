<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Progress Bar — Progress indicator bar -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  showLabel?: boolean
  animated?: boolean
  striped?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 'md',
  color: 'primary',
  showLabel: false,
  animated: false,
  striped: false,
})

const percentage = computed(() =>
  Math.min(Math.max((props.value / props.max) * 100, 0), 100)
)

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }
  return sizes[props.size]
})

const colorClasses = computed(() => {
  const colors = {
    primary: 'bg-primary-600 dark:bg-primary-500',
    success: 'bg-success-600 dark:bg-success-500',
    warning: 'bg-warning-500 dark:bg-warning-400',
    danger: 'bg-danger-600 dark:bg-danger-500',
    info: 'bg-info-600 dark:bg-info-500',
  }
  return colors[props.color]
})

// Auto-color based on percentage
const autoColor = computed(() => {
  if (percentage.value >= 80) return 'text-success-600 dark:text-success-400'
  if (percentage.value >= 50) return 'text-primary-600 dark:text-primary-400'
  if (percentage.value >= 25) return 'text-warning-600 dark:text-warning-400'
  return 'text-danger-600 dark:text-danger-400'
})
</script>

<template>
  <div>
    <!-- Label -->
    <div v-if="showLabel" class="mb-1 flex items-center justify-between">
      <span class="text-sm text-gray-600 dark:text-gray-400">
        <slot name="label" />
      </span>
      <span :class="['text-sm font-medium', autoColor]">
        {{ Math.round(percentage) }}%
      </span>
    </div>

    <!-- Track -->
    <div
      :class="[
        'w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        sizeClasses,
      ]"
      role="progressbar"
      :aria-valuenow="value"
      :aria-valuemin="0"
      :aria-valuemax="max"
    >
      <!-- Bar -->
      <div
        :class="[
          'h-full rounded-full transition-all duration-500 ease-out',
          colorClasses,
          striped ? 'bg-stripes' : '',
          animated && striped ? 'animate-stripes' : '',
        ]"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>

<style scoped>
.bg-stripes {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

.animate-stripes {
  animation: stripes 1s linear infinite;
}

@keyframes stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}
</style>
