<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Card — Vendor profile summary card -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import type { Vendor } from '@/types'
import { useCurrency } from '@/composables'
import { BaseBadge, BaseButton } from '@/components/ui'
import {
  BuildingStorefrontIcon,
  StarIcon,
  CubeIcon,
  ShoppingCartIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  PhoneIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

interface Props {
  vendor: Vendor
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
  (e: 'approve'): void
  (e: 'reject'): void
}>()

const { formatPrice } = useCurrency()

// Status badge config
const statusConfig: Record<string, { variant: string; label: string }> = {
  pending: { variant: 'warning', label: 'অপেক্ষমান' },
  active: { variant: 'success', label: 'সক্রিয়' },
  suspended: { variant: 'danger', label: 'সাসপেন্ডেড' },
  rejected: { variant: 'danger', label: 'প্রত্যাখ্যাত' }
}

// Rating stars (out of 5)
const ratingStars = computed(() => {
  const rating = props.vendor.rating_average
  const full = Math.floor(rating)
  const empty = 5 - full
  return { full, empty, rating }
})
</script>

<template>
  <!-- Compact Version -->
  <div
    v-if="compact"
    class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Logo -->
    <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
      <img
        v-if="vendor.logo_url"
        :src="vendor.logo_url"
        :alt="vendor.store_name"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex h-full items-center justify-center">
        <BuildingStorefrontIcon class="h-6 w-6 text-gray-400" />
      </div>
    </div>

    <!-- Info -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h4 class="truncate font-medium text-gray-900 dark:text-white">
          {{ vendor.store_name }}
        </h4>
        <CheckBadgeIcon
          v-if="vendor.is_verified"
          class="h-5 w-5 shrink-0 text-primary-500"
        />
      </div>
      <div class="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span class="flex items-center gap-1">
          <StarIconSolid class="h-4 w-4 text-warning-400" />
          {{ vendor.rating_average.toFixed(1) }}
        </span>
        <span>{{ vendor.product_count }} পণ্য</span>
      </div>
    </div>

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
    <!-- Banner -->
    <div class="relative h-24 bg-gradient-to-r from-primary-500 to-primary-600">
      <img
        v-if="vendor.banner_url"
        :src="vendor.banner_url"
        :alt="vendor.store_name"
        class="h-full w-full object-cover"
      />
    </div>

    <!-- Content -->
    <div class="relative px-6 pb-6">
      <!-- Logo -->
      <div class="-mt-10 mb-4 flex items-end justify-between">
        <div class="h-20 w-20 overflow-hidden rounded-xl border-4 border-white bg-white shadow dark:border-gray-800 dark:bg-gray-800">
          <img
            v-if="vendor.logo_url"
            :src="vendor.logo_url"
            :alt="vendor.store_name"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
            <BuildingStorefrontIcon class="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <!-- Status Badge -->
        <BaseBadge
          :variant="statusConfig[vendor.status]?.variant as any || 'gray'"
          class="mt-12"
        >
          {{ statusConfig[vendor.status]?.label || vendor.status }}
        </BaseBadge>
      </div>

      <!-- Name & Verified -->
      <div class="flex items-center gap-2">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ vendor.store_name }}
        </h3>
        <CheckBadgeIcon
          v-if="vendor.is_verified"
          class="h-6 w-6 text-primary-500"
          title="ভেরিফাইড ভেন্ডর"
        />
      </div>

      <!-- Business Name -->
      <p
        v-if="vendor.business_name"
        class="mt-1 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ vendor.business_name }}
      </p>

      <!-- Description -->
      <p
        v-if="vendor.description"
        class="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300"
      >
        {{ vendor.description }}
      </p>

      <!-- Rating -->
      <div class="mt-4 flex items-center gap-2">
        <div class="flex items-center">
          <StarIconSolid
            v-for="n in ratingStars.full"
            :key="`full-${n}`"
            class="h-5 w-5 text-warning-400"
          />
          <StarIcon
            v-for="n in ratingStars.empty"
            :key="`empty-${n}`"
            class="h-5 w-5 text-gray-300"
          />
        </div>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ ratingStars.rating.toFixed(1) }} ({{ vendor.review_count }} রিভিউ)
        </span>
      </div>

      <!-- Stats -->
      <div class="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
        <div class="text-center">
          <CubeIcon class="mx-auto h-5 w-5 text-gray-400" />
          <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {{ vendor.product_count }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">পণ্য</p>
        </div>
        <div class="text-center">
          <ShoppingCartIcon class="mx-auto h-5 w-5 text-gray-400" />
          <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {{ vendor.order_count }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">অর্ডার</p>
        </div>
        <div class="text-center">
          <div class="mx-auto h-5 w-5 text-center text-lg font-bold text-success-500">৳</div>
          <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {{ formatPrice(vendor.total_sales).replace('৳', '') }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">বিক্রি</p>
        </div>
      </div>

      <!-- Commission -->
      <div class="mt-4 flex items-center justify-between text-sm">
        <span class="text-gray-500 dark:text-gray-400">কমিশন রেট</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ vendor.commission_rate }}%
        </span>
      </div>

      <!-- Owner Info -->
      <div class="mt-4 space-y-2 text-sm">
        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span class="font-medium">মালিক:</span>
          <span>{{ vendor.owner.name }}</span>
        </div>
        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <EnvelopeIcon class="h-4 w-4" />
          <span>{{ vendor.owner.email }}</span>
        </div>
        <div v-if="vendor.owner.phone" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <PhoneIcon class="h-4 w-4" />
          <span>{{ vendor.owner.phone }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="showActions" class="mt-6 flex gap-3">
        <BaseButton
          v-if="vendor.status === 'pending'"
          variant="primary"
          class="flex-1"
          @click="emit('approve')"
        >
          অনুমোদন করুন
        </BaseButton>
        <BaseButton
          v-if="vendor.status === 'pending'"
          variant="danger"
          class="flex-1"
          @click="emit('reject')"
        >
          প্রত্যাখ্যান
        </BaseButton>
        <BaseButton variant="outline" class="flex-1" @click="emit('view')">
          <EyeIcon class="mr-2 h-4 w-4" />
          বিস্তারিত
        </BaseButton>
        <BaseButton variant="ghost" @click="emit('contact')">
          <EnvelopeIcon class="h-4 w-4" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>
