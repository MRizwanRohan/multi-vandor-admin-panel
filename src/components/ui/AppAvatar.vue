<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Avatar — User/vendor avatar with fallback initials -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { UserIcon } from '@heroicons/vue/24/solid'

interface Props {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: boolean
  status?: 'online' | 'offline' | 'away' | 'busy'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  rounded: true,
})

const imgError = ref(false)

// Initials from name
const initials = computed(() => {
  if (!props.name) return ''
  return props.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }
  return sizes[props.size]
})

// Icon sizes
const iconSizeClasses = computed(() => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  }
  return sizes[props.size]
})

// Status dot size
const statusSize = computed(() => {
  const sizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
  }
  return sizes[props.size]
})

// Status dot color
const statusColor = computed(() => {
  const colors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    away: 'bg-warning-500',
    busy: 'bg-danger-500',
  }
  return props.status ? colors[props.status] : ''
})

// Random bg color from name for initials
const bgColor = computed(() => {
  if (!props.name) return 'bg-gray-200 dark:bg-gray-700'
  const colors = [
    'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300',
    'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300',
    'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300',
    'bg-info-100 text-info-700 dark:bg-info-900/50 dark:text-info-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  ]
  const hash = props.name?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) ?? 0
  return colors[hash % colors.length]
})

const showImage = computed(() => props.src && !imgError.value)
</script>

<template>
  <div class="relative inline-flex shrink-0">
    <!-- Image -->
    <img
      v-if="showImage"
      :src="src"
      :alt="alt || name || 'Avatar'"
      :class="[
        sizeClasses,
        rounded ? 'rounded-full' : 'rounded-lg',
        'object-cover',
      ]"
      @error="imgError = true"
    />

    <!-- Initials fallback -->
    <div
      v-else-if="initials"
      :class="[
        sizeClasses,
        bgColor,
        rounded ? 'rounded-full' : 'rounded-lg',
        'flex items-center justify-center font-semibold',
      ]"
    >
      {{ initials }}
    </div>

    <!-- Icon fallback -->
    <div
      v-else
      :class="[
        sizeClasses,
        rounded ? 'rounded-full' : 'rounded-lg',
        'flex items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
      ]"
    >
      <UserIcon :class="iconSizeClasses" />
    </div>

    <!-- Status indicator -->
    <span
      v-if="status"
      :class="[
        statusSize,
        statusColor,
        'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800',
      ]"
    />
  </div>
</template>
