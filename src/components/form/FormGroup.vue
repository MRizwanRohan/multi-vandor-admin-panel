<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Group — Fieldset wrapper with title and description -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  border?: boolean
}

withDefaults(defineProps<Props>(), {
  border: true,
})
</script>

<template>
  <fieldset :class="['space-y-4', border ? 'border border-gray-200 dark:border-gray-700 rounded-lg p-4' : '']">
    <!-- Title & Description -->
    <legend v-if="title || description" class="contents">
      <div :class="border ? 'mb-2' : ''">
        <h3 v-if="title" class="text-base font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p v-if="description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
    </legend>

    <!-- Form Fields Slot -->
    <div class="space-y-4">
      <slot />
    </div>
  </fieldset>
</template>
