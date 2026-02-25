<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Activity Feed — Recent activity stream -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserPlusIcon,
  StarIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import AppAvatar from '../ui/AppAvatar.vue'

export interface ActivityItem {
  id: string | number
  type: 'order' | 'product' | 'user' | 'review' | 'payout' | 'comment' | 'system'
  title: string
  description?: string
  user?: {
    name: string
    avatar?: string
  }
  timestamp: string
  meta?: Record<string, string | number>
}

interface Props {
  activities: ActivityItem[]
  loading?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxItems: 10,
})

const displayedActivities = computed(() =>
  props.activities.slice(0, props.maxItems)
)

// Type → icon mapping
const typeIcons: Record<string, Component> = {
  order: ShoppingCartIcon,
  product: ShoppingBagIcon,
  user: UserPlusIcon,
  review: StarIcon,
  payout: CurrencyDollarIcon,
  comment: ChatBubbleLeftIcon,
  system: ArrowPathIcon,
}

// Type → color mapping
const typeColors: Record<string, string> = {
  order: 'bg-info-100 text-info-600 dark:bg-info-900/50 dark:text-info-400',
  product: 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400',
  user: 'bg-success-100 text-success-600 dark:bg-success-900/50 dark:text-success-400',
  review: 'bg-warning-100 text-warning-600 dark:bg-warning-900/50 dark:text-warning-400',
  payout: 'bg-success-100 text-success-600 dark:bg-success-900/50 dark:text-success-400',
  comment: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

function timeAgo(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}
</script>

<template>
  <div class="flow-root">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="flex items-start gap-3">
        <div class="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>

    <!-- Activity list -->
    <ul v-else role="list" class="-mb-4">
      <li
        v-for="(activity, index) in displayedActivities"
        :key="activity.id"
        class="relative pb-4"
      >
        <!-- Vertical line -->
        <span
          v-if="index !== displayedActivities.length - 1"
          class="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
        />

        <div class="relative flex items-start gap-3">
          <!-- Icon or Avatar -->
          <div v-if="activity.user" class="relative z-10">
            <AppAvatar
              :src="activity.user.avatar"
              :name="activity.user.name"
              size="sm"
            />
          </div>
          <div
            v-else
            :class="[
              'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
              typeColors[activity.type] || typeColors.system,
            ]"
          >
            <component
              :is="typeIcons[activity.type] || typeIcons.system"
              class="h-4 w-4"
            />
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-900 dark:text-white">
              <span v-if="activity.user" class="font-medium">
                {{ activity.user.name }}
              </span>
              {{ activity.title }}
            </p>
            <p
              v-if="activity.description"
              class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
            >
              {{ activity.description }}
            </p>
            <p class="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              {{ timeAgo(activity.timestamp) }}
            </p>
          </div>
        </div>
      </li>
    </ul>

    <!-- Empty state -->
    <div
      v-if="!loading && activities.length === 0"
      class="py-6 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      No recent activity
    </div>
  </div>
</template>
