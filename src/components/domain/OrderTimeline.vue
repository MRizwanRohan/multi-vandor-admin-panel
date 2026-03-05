<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Order Timeline — Visual order status history -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus, OrderStatusHistory } from '@/types'
import { useDate } from '@/composables'
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  CubeIcon,
  XCircleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ShoppingBagIcon
} from '@heroicons/vue/24/solid'

interface Props {
  history: OrderStatusHistory[]
  currentStatus: OrderStatus
}

const props = defineProps<Props>()

const { formatDateTime, formatRelative } = useDate()

// Status configuration
const statusConfig: Record<OrderStatus, {
  label: string
  icon: typeof CheckCircleIcon
  color: string
  bgColor: string
}> = {
  pending: {
    label: 'অপেক্ষমান',
    icon: ClockIcon,
    color: 'text-warning-500',
    bgColor: 'bg-warning-100 dark:bg-warning-900/50'
  },
  confirmed: {
    label: 'নিশ্চিত',
    icon: CheckCircleIcon,
    color: 'text-primary-500',
    bgColor: 'bg-primary-100 dark:bg-primary-900/50'
  },
  processing: {
    label: 'প্রক্রিয়াধীন',
    icon: CubeIcon,
    color: 'text-info-500',
    bgColor: 'bg-info-100 dark:bg-info-900/50'
  },
  shipped: {
    label: 'শিপড',
    icon: TruckIcon,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/50'
  },
  delivered: {
    label: 'ডেলিভার্ড',
    icon: CheckCircleIcon,
    color: 'text-success-500',
    bgColor: 'bg-success-100 dark:bg-success-900/50'
  },
  cancelled: {
    label: 'বাতিল',
    icon: XCircleIcon,
    color: 'text-danger-500',
    bgColor: 'bg-danger-100 dark:bg-danger-900/50'
  },
  completed: {
    label: 'সম্পন্ন',
    icon: CheckCircleIcon,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/50'
  },
  refunded: {
    label: 'রিফান্ড',
    icon: BanknotesIcon,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50'
  }
}

// Standard order flow
const standardFlow: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered'
]

// Get expected statuses based on current status
const expectedStatuses = computed(() => {
  // For cancelled/completed/refunded, show only what happened
  if (['cancelled', 'completed', 'refunded'].includes(props.currentStatus)) {
    const statusesInHistory = props.history.map(h => h.new_status)
    return [...new Set(statusesInHistory)]
  }
  
  // For normal flow, show standard flow up to and including current
  const currentIndex = standardFlow.indexOf(props.currentStatus)
  if (currentIndex === -1) return standardFlow
  return standardFlow.slice(0, currentIndex + 1)
})

// Map history to statuses
const timelineItems = computed(() => {
  const historyMap = new Map<OrderStatus, OrderStatusHistory>()
  
  props.history.forEach(h => {
    historyMap.set(h.new_status, h)
  })
  
  return expectedStatuses.value.map((status, index) => {
    const historyItem = historyMap.get(status)
    const config = statusConfig[status]
    const isCompleted = !!historyItem
    const isCurrent = status === props.currentStatus
    const isLast = index === expectedStatuses.value.length - 1
    
    return {
      status,
      ...config,
      isCompleted,
      isCurrent,
      isLast,
      changedAt: historyItem?.created_at,
      changedBy: historyItem?.changed_by,
      notes: historyItem?.notes
    }
  })
})
</script>

<template>
  <div class="space-y-4">
    <!-- Timeline -->
    <div class="relative">
      <!-- Vertical Line -->
      <div
        class="absolute left-5 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"
        aria-hidden="true"
      />

      <!-- Timeline Items -->
      <ul class="relative space-y-6">
        <li
          v-for="item in timelineItems"
          :key="item.status"
          class="relative pl-14"
        >
          <!-- Icon -->
          <div
            :class="[
              'absolute left-0 flex h-10 w-10 items-center justify-center rounded-full',
              item.isCompleted ? item.bgColor : 'bg-gray-100 dark:bg-gray-800'
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                'h-5 w-5',
                item.isCompleted ? item.color : 'text-gray-400 dark:text-gray-500'
              ]"
            />
          </div>

          <!-- Content -->
          <div
            :class="[
              'rounded-lg border p-4',
              item.isCurrent
                ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            ]"
          >
            <div class="flex items-start justify-between">
              <div>
                <h4
                  :class="[
                    'font-medium',
                    item.isCompleted
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  ]"
                >
                  {{ item.label }}
                </h4>
                
                <p
                  v-if="item.changedAt"
                  class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ formatDateTime(item.changedAt) }}
                  <span class="text-gray-400 dark:text-gray-500">
                    ({{ formatRelative(item.changedAt) }})
                  </span>
                </p>
                
                <p
                  v-if="item.changedBy"
                  class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                >
                  দ্বারা: <span class="font-medium">{{ item.changedBy }}</span>
                </p>
              </div>

              <!-- Current Badge -->
              <span
                v-if="item.isCurrent"
                class="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/50 dark:text-primary-300"
              >
                বর্তমান
              </span>
            </div>

            <!-- Notes -->
            <p
              v-if="item.notes"
              class="mt-3 rounded bg-gray-50 p-2 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300"
            >
              <span class="font-medium">নোট:</span> {{ item.notes }}
            </p>
          </div>
        </li>
      </ul>
    </div>

    <!-- Legend for non-standard statuses -->
    <div
      v-if="['cancelled', 'completed', 'refunded'].includes(currentStatus)"
      class="rounded-lg border border-danger-200 bg-danger-50 p-3 dark:border-danger-800 dark:bg-danger-900/20"
    >
      <div class="flex items-center gap-2 text-sm text-danger-800 dark:text-danger-300">
        <XCircleIcon class="h-5 w-5" />
        <span>
          এই অর্ডারটি {{ statusConfig[currentStatus].label }} হয়েছে
        </span>
      </div>
    </div>
  </div>
</template>
