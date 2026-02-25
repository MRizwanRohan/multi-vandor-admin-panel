<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Skeleton — Skeleton loading placeholders -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string
  height?: string
  lines?: number
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  lines: 1,
  animated: true,
})

const baseClasses = computed(() => [
  'bg-gray-200 dark:bg-gray-700',
  props.animated ? 'animate-pulse' : '',
])

const variantClasses = computed(() => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  }
  return variants[props.variant]
})

const style = computed(() => ({
  width: props.width || (props.variant === 'circular' ? '40px' : '100%'),
  height:
    props.height ||
    (props.variant === 'circular'
      ? '40px'
      : props.variant === 'card'
        ? '200px'
        : props.variant === 'rectangular'
          ? '100px'
          : undefined),
}))

// Generate line widths for multi-line text skeleton
function lineWidth(index: number): string {
  if (index === props.lines - 1) return '60%'
  return '100%'
}
</script>

<template>
  <!-- Multi-line text skeleton -->
  <div v-if="variant === 'text' && lines > 1" class="space-y-2.5">
    <div
      v-for="i in lines"
      :key="i"
      :class="[...baseClasses, 'h-4 rounded']"
      :style="{ width: lineWidth(i - 1) }"
    />
  </div>

  <!-- Single element skeleton -->
  <div
    v-else
    :class="[...baseClasses, variantClasses]"
    :style="style"
  />
</template>
