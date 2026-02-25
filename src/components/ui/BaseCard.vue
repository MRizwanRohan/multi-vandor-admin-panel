<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Base Card — Reusable card component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  hover: false,
  clickable: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const paddingClasses = computed(() => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  return paddings[props.padding]
})

const classes = computed(() => [
  'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700',
  paddingClasses.value,
  props.hover ? 'hover:shadow-md transition-shadow duration-200' : '',
  props.clickable ? 'cursor-pointer' : '',
])

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <div :class="classes" @click="handleClick">
    <slot />
  </div>
</template>
