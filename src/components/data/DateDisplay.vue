<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Date Display — Formatted date with relative time tooltip -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useDate } from '@/composables/useDate'

interface Props {
  date: string | Date
  format?: string
  relative?: boolean
  showTooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'MMM D, YYYY',
  relative: false,
  showTooltip: true,
})

const { formatDate, formatRelative } = useDate()

const formatted = computed(() =>
  formatDate(props.date, props.format)
)

const relativeTime = computed(() =>
  formatRelative(props.date)
)

const fullDate = computed(() =>
  formatDate(props.date, 'MMMM D, YYYY h:mm A')
)
</script>

<template>
  <time
    :datetime="typeof date === 'string' ? date : date.toISOString()"
    :title="showTooltip ? (relative ? fullDate : relativeTime) : undefined"
    class="inline-flex cursor-default text-gray-600 dark:text-gray-400"
  >
    {{ relative ? relativeTime : formatted }}
  </time>
</template>
