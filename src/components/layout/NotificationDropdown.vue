<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Notification Dropdown — Bell icon dropdown with notifications -->
<!-- Dynamic: Fetches from API, real-time ready -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { BellIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { useNotificationStore } from '@/stores'
import { useNotification } from '@/composables'
import NotificationItem from '../domain/NotificationItem.vue'
import AppSpinner from '../ui/AppSpinner.vue'
import type { Notification } from '@/types'

const store = useNotificationStore()
const { handleNotificationClick, viewAllNotifications } = useNotification()

onMounted(() => {
  store.fetchNotifications(true)
  store.startPolling()
})

onUnmounted(() => {
  store.stopPolling()
})

function onNotificationClick(notification: Notification) {
  handleNotificationClick(notification)
}

function onDelete(id: string) {
  store.deleteNotification(id)
}
</script>

<template>
  <Popover class="relative">
    <PopoverButton
      class="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
    >
      <BellIcon class="h-5 w-5" />
      <span
        v-if="store.unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white"
      >
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </PopoverButton>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <PopoverPanel
        class="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
            <span
              v-if="store.unreadCount > 0"
              class="ml-1.5 inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
            >
              {{ store.unreadCount }}
            </span>
          </h3>
          <button
            v-if="store.unreadCount > 0"
            type="button"
            class="inline-flex items-center gap-1 text-xs text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
            @click="store.markAllAsRead()"
          >
            <CheckIcon class="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <!-- Notifications list -->
        <div class="max-h-[400px] overflow-y-auto">
          <!-- Loading -->
          <div v-if="store.isLoading && !store.hasNotifications" class="flex justify-center py-8">
            <AppSpinner size="sm" />
          </div>

          <!-- Empty -->
          <div
            v-else-if="!store.hasNotifications"
            class="px-4 py-10 text-center"
          >
            <BellIcon class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p class="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              We'll notify you when something important happens
            </p>
          </div>

          <!-- Items -->
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <NotificationItem
              v-for="notification in store.recentNotifications"
              :key="notification.id"
              :notification="notification"
              :compact="true"
              :show-delete="true"
              @click="onNotificationClick"
              @delete="onDelete"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 p-2 dark:border-gray-700">
          <button
            type="button"
            class="w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-primary-600 transition-colors hover:bg-gray-50 dark:text-primary-400 dark:hover:bg-gray-700"
            @click="viewAllNotifications"
          >
            View all notifications →
          </button>
        </div>
      </PopoverPanel>
    </Transition>
  </Popover>
</template>
