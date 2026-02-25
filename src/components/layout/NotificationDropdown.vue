<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Notification Dropdown — Bell icon dropdown with notifications -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { BellIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { useNotificationStore } from '@/stores'
import AppSpinner from '../ui/AppSpinner.vue'

interface Props {
  dashboardType?: 'admin' | 'vendor'
}

const props = withDefaults(defineProps<Props>(), {
  dashboardType: 'admin',
})

const router = useRouter()
const notificationStore = useNotificationStore()

const unreadCount = computed(() => notificationStore.unreadCount)
const notifications = computed(() => notificationStore.recentNotifications)

onMounted(() => {
  notificationStore.fetchNotifications(true)
})

function markAllRead() {
  notificationStore.markAllAsRead()
}

function handleNotificationClick(notification: { id: string | number; read_at: string | null }) {
  if (!notification.read_at) {
    notificationStore.markAsRead(notification.id as string)
  }
}

function viewAll() {
  const path = props.dashboardType === 'admin' ? '/admin/notifications' : '/vendor/notifications'
  router.push(path)
}

function timeAgo(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
</script>

<template>
  <Popover class="relative">
    <PopoverButton
      class="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
    >
      <BellIcon class="h-5 w-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
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
        class="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="inline-flex items-center gap-1 text-xs text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
            @click="markAllRead"
          >
            <CheckIcon class="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <!-- Notifications list -->
        <div class="max-h-80 overflow-y-auto">
          <!-- Loading -->
          <div v-if="notificationStore.isLoading" class="flex justify-center py-6">
            <AppSpinner size="sm" />
          </div>

          <!-- Empty -->
          <div
            v-else-if="notifications.length === 0"
            class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No notifications yet
          </div>

          <!-- Items -->
          <div v-else>
            <button
              v-for="notification in notifications"
              :key="notification.id"
              type="button"
              class="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              :class="!notification.read_at ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''"
              @click="handleNotificationClick(notification)"
            >
              <!-- Unread dot -->
              <div class="mt-1.5 shrink-0">
                <div
                  :class="[
                    'h-2 w-2 rounded-full',
                    !notification.read_at
                      ? 'bg-primary-600 dark:bg-primary-400'
                      : 'bg-transparent',
                  ]"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {{ notification.title }}
                </p>
                <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ notification.message }}
                </p>
                <p class="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                  {{ timeAgo(notification.created_at) }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 p-2 dark:border-gray-700">
          <button
            type="button"
            class="w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-primary-600 transition-colors hover:bg-gray-50 dark:text-primary-400 dark:hover:bg-gray-700"
            @click="viewAll"
          >
            View all notifications
          </button>
        </div>
      </PopoverPanel>
    </Transition>
  </Popover>
</template>
