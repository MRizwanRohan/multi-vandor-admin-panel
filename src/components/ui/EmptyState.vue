<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Empty State — Display when no data available -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { FolderOpenIcon } from '@heroicons/vue/24/outline'
import BaseButton from './BaseButton.vue'

interface Props {
  title?: string
  description?: string
  icon?: Component
  actionLabel?: string
  actionTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'No data found',
  description: 'There are no items to display at the moment.',
})

const emit = defineEmits<{
  (e: 'action'): void
}>()

const IconComponent = computed(() => props.icon || FolderOpenIcon)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <!-- Icon -->
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
      <component
        :is="IconComponent"
        class="h-8 w-8 text-gray-400 dark:text-gray-500"
      />
    </div>

    <!-- Title -->
    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>

    <!-- Action button -->
    <BaseButton
      v-if="actionLabel"
      :to="actionTo"
      variant="primary"
      class="mt-6"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>
