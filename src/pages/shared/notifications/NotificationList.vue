<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Notification List Page — All notifications with filtering -->
<!-- Shared between Admin and Vendor dashboards -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore, useNotificationStore } from '@/stores'
import { useNotification, useToast, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import NotificationItem from '@/components/domain/NotificationItem.vue'
import type { Notification } from '@/types'
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  InboxIcon,
} from '@heroicons/vue/24/outline'

// ─────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────

const breadcrumbStore = useBreadcrumbStore()
const store = useNotificationStore()
const { handleNotificationClick, viewAllNotifications } = useNotification()
const toast = useToast()
const { confirm } = useConfirm()

// Filter state
const activeFilter = ref<'all' | 'unread' | 'read'>('all')

onMounted(() => {
  breadcrumbStore.setPageInfo('Notifications', [
    { label: 'Notifications' },
  ])
  store.fetchNotifications(true)
})

// ─────────────────────────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────────────────────────

const filteredNotifications = computed(() => {
  switch (activeFilter.value) {
    case 'unread':
      return store.notifications.filter((n) => !n.read_at)
    case 'read':
      return store.notifications.filter((n) => !!n.read_at)
    default:
      return store.notifications
  }
})

const filterCounts = computed(() => ({
  all: store.notifications.length,
  unread: store.notifications.filter((n) => !n.read_at).length,
  read: store.notifications.filter((n) => !!n.read_at).length,
}))

const isEmpty = computed(() => filteredNotifications.value.length === 0 && !store.isLoading)

// ─────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────

function onNotificationClick(notification: Notification) {
  handleNotificationClick(notification)
}

function onDelete(id: string) {
  store.deleteNotification(id)
  toast.success('Notification deleted')
}

async function handleMarkAllRead() {
  await store.markAllAsRead()
  toast.success('All notifications marked as read')
}

async function handleClearAll() {
  const confirmed = await confirm({
    title: 'Clear All Notifications',
    message: 'Are you sure you want to delete all notifications? This action cannot be undone.',
    confirmText: 'Clear All',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    const count = await store.clearAll()
    toast.success(`${count} notifications cleared`)
  }
}

function loadMore() {
  store.fetchNotifications(false)
}

// Filters
const filters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
] as const
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Stay updated with your latest activities and alerts
        </p>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton
          v-if="store.unreadCount > 0"
          variant="secondary"
          size="sm"
          @click="handleMarkAllRead"
        >
          <CheckIcon class="mr-1.5 h-4 w-4" />
          Mark all read
        </BaseButton>
        <BaseButton
          v-if="store.hasNotifications"
          variant="danger"
          size="sm"
          @click="handleClearAll"
        >
          <TrashIcon class="mr-1.5 h-4 w-4" />
          Clear all
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50">
      <button
        v-for="filter in filters"
        :key="filter.id"
        type="button"
        class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        :class="[
          activeFilter === filter.id
            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
        ]"
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
        <span
          v-if="filterCounts[filter.id] > 0"
          class="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs"
          :class="[
            activeFilter === filter.id
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
          ]"
        >
          {{ filterCounts[filter.id] }}
        </span>
      </button>
    </div>

    <!-- Notification List -->
    <BaseCard padding="none">
      <!-- Loading -->
      <div v-if="store.isLoading && store.notifications.length === 0" class="flex justify-center py-16">
        <AppSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="isEmpty"
        :icon="activeFilter === 'unread' ? InboxIcon : BellIcon"
        :title="activeFilter === 'unread' ? 'No unread notifications' : activeFilter === 'read' ? 'No read notifications' : 'No notifications yet'"
        :description="activeFilter === 'all' ? 'We\'ll notify you when something important happens' : `No ${activeFilter} notifications to show`"
      />

      <!-- Items -->
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-700/50">
        <NotificationItem
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :notification="notification"
          :show-delete="true"
          @click="onNotificationClick"
          @delete="onDelete"
        />
      </div>

      <!-- Load More -->
      <div
        v-if="store.hasMore && !isEmpty"
        class="border-t border-gray-100 px-4 py-4 text-center dark:border-gray-700"
      >
        <BaseButton
          variant="secondary"
          size="sm"
          :loading="store.isLoading"
          @click="loadMore"
        >
          Load more notifications
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
