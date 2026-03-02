<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Notification Item — Single notification display component -->
<!-- Reusable in dropdown, list page, and anywhere needed -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { Notification } from '@/types'
import { useNotification, timeAgo } from '@/composables'

interface Props {
  notification: Notification
  /** Show delete button */
  showDelete?: boolean
  /** Compact mode for dropdown */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDelete: false,
  compact: false,
})

const emit = defineEmits<{
  (e: 'click', notification: Notification): void
  (e: 'delete', id: string): void
}>()

const { getIcon, getColors } = useNotification()

const isUnread = computed(() => !props.notification.readAt)
const IconComponent = computed(() => getIcon(props.notification))
const colors = computed(() => getColors(props.notification))
const formattedTime = computed(() => timeAgo(props.notification.createdAt))

function handleClick() {
  emit('click', props.notification)
}

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.notification.id)
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="group relative flex w-full gap-3 px-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
    :class="[
      compact ? 'py-3' : 'py-4',
      isUnread ? 'bg-primary-50/50 dark:bg-primary-900/10' : '',
    ]"
    @click="handleClick"
    @keydown.enter="handleClick"
  >
    <!-- Icon -->
    <div class="mt-0.5 shrink-0">
      <div
        class="flex items-center justify-center rounded-full"
        :class="[
          compact ? 'h-8 w-8' : 'h-10 w-10',
          colors.iconBg,
        ]"
      >
        <component
          :is="IconComponent"
          :class="[
            compact ? 'h-4 w-4' : 'h-5 w-5',
            colors.text,
          ]"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <p
          class="text-sm text-gray-900 dark:text-white"
          :class="isUnread ? 'font-semibold' : 'font-normal'"
        >
          {{ notification.title }}
        </p>

        <!-- Unread dot -->
        <div v-if="isUnread" class="mt-1.5 shrink-0">
          <div class="h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400" />
        </div>
      </div>

      <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-400" :class="compact ? 'truncate' : 'line-clamp-2'">
        {{ notification.message }}
      </p>

      <div class="mt-1 flex items-center gap-2">
        <p class="text-xs text-gray-400 dark:text-gray-500">
          {{ formattedTime }}
        </p>
        <span
          v-if="notification.actionText"
          class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {{ notification.actionText }}
        </span>
      </div>
    </div>

    <!-- Delete button -->
    <button
      v-if="showDelete"
      type="button"
      class="absolute right-2 top-2 hidden rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 group-hover:block dark:hover:bg-gray-600 dark:hover:text-gray-200"
      title="Delete notification"
      @click="handleDelete"
    >
      <XMarkIcon class="h-4 w-4" />
    </button>
  </div>
</template>
