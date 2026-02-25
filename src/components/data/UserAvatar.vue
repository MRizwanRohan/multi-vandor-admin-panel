<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- User Avatar — User avatar with name, status, and fallback -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import AppAvatar from '../ui/AppAvatar.vue'

interface Props {
  name: string
  email?: string
  avatar?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'away' | 'busy'
  subtitle?: string
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showDetails: true,
})

// Map size to text sizes
const textSizes: Record<string, { name: string; sub: string }> = {
  xs: { name: 'text-xs', sub: 'text-[10px]' },
  sm: { name: 'text-sm', sub: 'text-xs' },
  md: { name: 'text-sm', sub: 'text-xs' },
  lg: { name: 'text-base', sub: 'text-sm' },
}
</script>

<template>
  <div class="inline-flex items-center gap-3">
    <AppAvatar
      :src="avatar"
      :name="name"
      :size="size"
      :status="status"
    />

    <div v-if="showDetails" class="min-w-0">
      <p
        :class="[
          'truncate font-medium text-gray-900 dark:text-white',
          textSizes[size]?.name || 'text-sm',
        ]"
      >
        {{ name }}
      </p>
      <p
        v-if="subtitle || email"
        :class="[
          'truncate text-gray-500 dark:text-gray-400',
          textSizes[size]?.sub || 'text-xs',
        ]"
      >
        {{ subtitle || email }}
      </p>
    </div>
  </div>
</template>
