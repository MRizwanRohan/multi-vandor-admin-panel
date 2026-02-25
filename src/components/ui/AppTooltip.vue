<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Tooltip — Tooltip wrapper using floating-vue -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { Tooltip as VTooltip } from 'floating-vue'
import 'floating-vue/dist/style.css'

interface Props {
  content?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  placement: 'top',
  delay: 200,
  disabled: false,
})
</script>

<template>
  <VTooltip
    :placement="placement"
    :delay="{ show: delay, hide: 100 }"
    :disabled="disabled"
  >
    <slot />
    <template #popper>
      <span v-if="content">{{ content }}</span>
      <slot v-else name="content" />
    </template>
  </VTooltip>
</template>
