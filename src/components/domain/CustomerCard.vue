<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Customer Card — Customer profile summary card -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import type { Customer } from '@/types'
import { useCurrency, useDate } from '@/composables'
import { BaseBadge, BaseButton } from '@/components/ui'
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShoppingCartIcon,
  CalendarIcon,
  EyeIcon,
  BanknotesIcon
} from '@heroicons/vue/24/outline'

interface Props {
  customer: Customer
  compact?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showActions: true
})

const emit = defineEmits<{
  (e: 'view'): void
  (e: 'contact'): void
}>()

const { formatPrice } = useCurrency()
const { formatDate, formatRelative } = useDate()

// Status badge config
const statusConfig: Record<string, { variant: string; label: string }> = {
  active: { variant: 'success', label: 'সক্রিয়' },
  inactive: { variant: 'gray', label: 'নিষ্ক্রিয়' },
  suspended: { variant: 'danger', label: 'সাসপেন্ডেড' },
  banned: { variant: 'danger', label: 'নিষিদ্ধ' }
}

// Customer tier based on total spent
const customerTier = computed(() => {
  const spent = props.customer.total_spent
  if (spent >= 100000) return { label: 'প্লাটিনাম', color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/50' }
  if (spent >= 50000) return { label: 'গোল্ড', color: 'text-warning-500', bgColor: 'bg-warning-100 dark:bg-warning-900/50' }
  if (spent >= 20000) return { label: 'সিলভার', color: 'text-gray-500', bgColor: 'bg-gray-200 dark:bg-gray-700' }
  return { label: 'নতুন', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/50' }
})

// Get initials
const initials = computed(() => {
  const name = props.customer.full_name
  if (!name) return '??'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})
</script>

<template>
  <!-- Compact Version -->
  <div
    v-if="compact"
    class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Avatar -->
    <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/50">
      <img
        v-if="customer.avatar"
        :src="customer.avatar"
        :alt="customer.full_name"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex h-full items-center justify-center">
        <span class="text-lg font-medium text-primary-600 dark:text-primary-400">
          {{ initials }}
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="min-w-0 flex-1">
      <h4 class="truncate font-medium text-gray-900 dark:text-white">
        {{ customer.full_name }}
      </h4>
      <div class="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>{{ customer.order_count }} অর্ডার</span>
        <span>{{ formatPrice(customer.total_spent) }}</span>
      </div>
    </div>

    <!-- Tier Badge -->
    <span
      :class="[
        'rounded-full px-2 py-0.5 text-xs font-medium',
        customerTier.bgColor,
        customerTier.color
      ]"
    >
      {{ customerTier.label }}
    </span>

    <!-- Action -->
    <BaseButton v-if="showActions" variant="ghost" size="sm" @click="emit('view')">
      <EyeIcon class="h-4 w-4" />
    </BaseButton>
  </div>

  <!-- Full Version -->
  <div
    v-else
    class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-8 dark:from-primary-900/20 dark:to-primary-800/20">
      <div class="flex items-center gap-4">
        <!-- Avatar -->
        <div class="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow dark:border-gray-800 dark:bg-gray-800">
          <img
            v-if="customer.avatar"
            :src="customer.avatar"
            :alt="customer.full_name"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full items-center justify-center bg-primary-100 dark:bg-primary-900/50">
            <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ initials }}
            </span>
          </div>
        </div>

        <!-- Name & Status -->
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ customer.full_name }}
            </h3>
            <BaseBadge
              :variant="statusConfig[customer.status]?.variant as any || 'gray'"
              size="sm"
            >
              {{ statusConfig[customer.status]?.label || customer.status }}
            </BaseBadge>
          </div>
          
          <!-- Tier -->
          <span
            :class="[
              'mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium',
              customerTier.bgColor,
              customerTier.color
            ]"
          >
            {{ customerTier.label }} কাস্টমার
          </span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-6 py-6">
      <!-- Contact Info -->
      <div class="space-y-3">
        <div class="flex items-center gap-3 text-sm">
          <EnvelopeIcon class="h-5 w-5 text-gray-400" />
          <span class="text-gray-600 dark:text-gray-300">{{ customer.email }}</span>
        </div>
        <div v-if="customer.phone" class="flex items-center gap-3 text-sm">
          <PhoneIcon class="h-5 w-5 text-gray-400" />
          <span class="text-gray-600 dark:text-gray-300">{{ customer.phone }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
        <div class="text-center">
          <ShoppingCartIcon class="mx-auto h-5 w-5 text-gray-400" />
          <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {{ customer.order_count }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">অর্ডার</p>
        </div>
        <div class="text-center">
          <BanknotesIcon class="mx-auto h-5 w-5 text-gray-400" />
          <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {{ formatPrice(customer.total_spent) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">মোট খরচ</p>
        </div>
        <div class="text-center">
          <CalendarIcon class="mx-auto h-5 w-5 text-gray-400" />
          <p class="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {{ customer.last_order_at ? formatRelative(customer.last_order_at) : '—' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">শেষ অর্ডার</p>
        </div>
      </div>

      <!-- Dates -->
      <div class="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          <CalendarIcon class="mr-1 inline h-4 w-4" />
          যোগদান: {{ formatDate(customer.created_at) }}
        </span>
      </div>

      <!-- Actions -->
      <div v-if="showActions" class="mt-6 flex gap-3">
        <BaseButton variant="primary" class="flex-1" @click="emit('view')">
          <EyeIcon class="mr-2 h-4 w-4" />
          বিস্তারিত দেখুন
        </BaseButton>
        <BaseButton variant="outline" @click="emit('contact')">
          <EnvelopeIcon class="h-4 w-4" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>
