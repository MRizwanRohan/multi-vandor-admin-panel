<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Category Breadcrumb — Category path display with links -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRightIcon, HomeIcon } from '@heroicons/vue/24/outline'

export interface CategoryPathItem {
  id: number | string
  name: string
  slug?: string
}

interface Props {
  /** Array of CategoryPathItem objects or plain string names */
  path: (CategoryPathItem | string)[]
  linkable?: boolean
  routePrefix?: string
  showHome?: boolean
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  linkable: true,
  routePrefix: '/admin/categories',
  showHome: false,
  size: 'sm',
})

/** Normalize path items — support both string[] and CategoryPathItem[] */
const normalizedPath = computed(() =>
  props.path.map((item, index) => {
    if (typeof item === 'string') {
      return { id: index, name: item, slug: undefined } as CategoryPathItem
    }
    return item
  })
)

/** When path items are plain strings, disable linking (no real IDs) */
const isLinkable = computed(() => {
  if (!props.linkable) return false
  return props.path.length > 0 && typeof props.path[0] !== 'string'
})

const textSize = computed(() =>
  props.size === 'sm' ? 'text-xs' : 'text-sm'
)
</script>

<template>
  <nav :class="['flex items-center gap-1', textSize]">
    <!-- Home icon -->
    <template v-if="showHome">
      <RouterLink
        v-if="isLinkable"
        :to="routePrefix"
        class="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <HomeIcon class="h-3.5 w-3.5" />
      </RouterLink>
      <HomeIcon v-else class="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
      <ChevronRightIcon
        v-if="normalizedPath.length > 0"
        class="h-3 w-3 shrink-0 text-gray-300 dark:text-gray-600"
      />
    </template>

    <!-- Path items -->
    <template v-for="(item, index) in normalizedPath" :key="item.id">
      <!-- Separator -->
      <ChevronRightIcon
        v-if="index > 0"
        class="h-3 w-3 shrink-0 text-gray-300 dark:text-gray-600"
      />

      <!-- Link or text -->
      <RouterLink
        v-if="isLinkable && index < normalizedPath.length - 1"
        :to="`${routePrefix}/${item.id}`"
        class="truncate text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
      >
        {{ item.name }}
      </RouterLink>
      <span
        v-else
        :class="[
          'truncate',
          index === normalizedPath.length - 1
            ? 'font-medium text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400',
        ]"
      >
        {{ item.name }}
      </span>
    </template>
  </nav>
</template>
