<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Data Grid — Card-based responsive grid view -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts" generic="T">
import { computed } from 'vue'
import EmptyState from '../ui/EmptyState.vue'
import AppSpinner from '../ui/AppSpinner.vue'

interface Props {
  items: T[]
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: 3,
  gap: 'md',
  loading: false,
  emptyTitle: 'No items found',
  emptyDescription: 'There are no items to display.',
})

const colClasses = computed(() => {
  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }
  return cols[props.columns]
})

const gapClasses = computed(() => {
  const gaps = {
    sm: 'gap-3',
    md: 'gap-4 lg:gap-6',
    lg: 'gap-6 lg:gap-8',
  }
  return gaps[props.gap]
})
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex items-center justify-center py-12">
    <AppSpinner size="lg" label="Loading..." />
  </div>

  <!-- Empty state -->
  <EmptyState
    v-else-if="items.length === 0"
    :title="emptyTitle"
    :description="emptyDescription"
  >
    <template #default>
      <slot name="empty" />
    </template>
  </EmptyState>

  <!-- Grid -->
  <div
    v-else
    :class="['grid', colClasses, gapClasses]"
  >
    <div
      v-for="(item, index) in items"
      :key="index"
    >
      <slot :item="item" :index="index" />
    </div>
  </div>
</template>
