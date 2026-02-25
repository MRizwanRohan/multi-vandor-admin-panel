<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Product Quick View — Modal/card view of product details -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Product, ProductDetail } from '@/types'
import { useCurrency, useDate } from '@/composables'
import { BaseBadge, BaseButton } from '@/components/ui'
import {
  XMarkIcon,
  StarIcon,
  ShoppingCartIcon,
  EyeIcon,
  PencilIcon,
  CubeIcon,
  TagIcon,
  BuildingStorefrontIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

interface Props {
  product: Product | ProductDetail
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit'): void
  (e: 'view'): void
}>()

const { formatPrice } = useCurrency()
const { formatDate } = useDate()

// Current image index for gallery
const currentImageIndex = ref(0)

// Check if we have full details
const hasDetails = computed(() => 'images' in props.product)

// Get images
const images = computed(() => {
  if ('images' in props.product && props.product.images?.length) {
    return props.product.images
  }
  if (props.product.primary_image) {
    return [{ id: 0, url: props.product.primary_image, is_primary: true, sort_order: 0, alt_text: null }]
  }
  return []
})

// Status badge config
const statusConfig: Record<string, { variant: string; label: string }> = {
  draft: { variant: 'gray', label: 'ড্রাফট' },
  pending: { variant: 'warning', label: 'অপেক্ষমান' },
  approved: { variant: 'success', label: 'অনুমোদিত' },
  rejected: { variant: 'danger', label: 'প্রত্যাখ্যাত' },
  archived: { variant: 'secondary', label: 'আর্কাইভড' }
}

// Stock status
const stockStatus = computed(() => {
  if (!props.product.is_in_stock) {
    return { text: 'স্টকে নেই', class: 'text-danger-600' }
  }
  if (props.product.stock_quantity <= 5) {
    return { text: 'কম স্টক', class: 'text-warning-600' }
  }
  return { text: 'স্টকে আছে', class: 'text-success-600' }
})

// Rating stars
const ratingStars = computed(() => {
  const full = Math.floor(props.product.rating_average)
  const half = props.product.rating_average % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
})
</script>

<template>
  <div class="overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        পণ্য বিবরণ
      </h3>
      <button
        type="button"
        class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        @click="emit('close')"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse p-6">
      <div class="flex gap-6">
        <div class="h-64 w-64 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div class="flex-1 space-y-4">
          <div class="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="p-6">
      <div class="flex flex-col gap-6 lg:flex-row">
        <!-- Image Gallery -->
        <div class="w-full lg:w-80">
          <!-- Main Image -->
          <div class="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
            <img
              v-if="images.length > 0"
              :src="images[currentImageIndex].url"
              :alt="product.name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full items-center justify-center">
              <CubeIcon class="h-20 w-20 text-gray-300 dark:text-gray-600" />
            </div>
          </div>

          <!-- Thumbnails -->
          <div v-if="images.length > 1" class="mt-3 flex gap-2 overflow-x-auto">
            <button
              v-for="(image, index) in images"
              :key="image.id"
              type="button"
              :class="[
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2',
                currentImageIndex === index
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-gray-300'
              ]"
              @click="currentImageIndex = index"
            >
              <img :src="image.url" :alt="product.name" class="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Details -->
        <div class="flex-1 space-y-4">
          <!-- Status & Type -->
          <div class="flex flex-wrap items-center gap-2">
            <BaseBadge
              :variant="statusConfig[product.status]?.variant as any || 'gray'"
            >
              {{ statusConfig[product.status]?.label || product.status }}
            </BaseBadge>
            <BaseBadge variant="secondary">
              {{ product.type === 'variable' ? 'ভেরিয়েবল' : 'সিম্পল' }}
            </BaseBadge>
            <BaseBadge v-if="product.is_featured" variant="warning">
              ফিচার্ড
            </BaseBadge>
          </div>

          <!-- Name -->
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ product.name }}
          </h2>

          <!-- Rating -->
          <div class="flex items-center gap-2">
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
              {{ product.rating_average.toFixed(1) }} ({{ product.review_count }} রিভিউ)
            </span>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-3">
            <span
              v-if="product.sale_price"
              class="text-2xl font-bold text-danger-600"
            >
              {{ formatPrice(product.sale_price) }}
            </span>
            <span
              :class="[
                'font-bold',
                product.sale_price
                  ? 'text-lg text-gray-400 line-through'
                  : 'text-2xl text-gray-900 dark:text-white'
              ]"
            >
              {{ formatPrice(product.price) }}
            </span>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <div class="flex items-center gap-2">
              <TagIcon class="h-5 w-5 text-gray-400" />
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">SKU</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ product.sku }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CubeIcon class="h-5 w-5 text-gray-400" />
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">স্টক</p>
                <p :class="['font-medium', stockStatus.class]">
                  {{ product.stock_quantity }} ({{ stockStatus.text }})
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <BuildingStorefrontIcon class="h-5 w-5 text-gray-400" />
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">ভেন্ডর</p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ product.vendor.store_name }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <ShoppingCartIcon class="h-5 w-5 text-gray-400" />
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">বিক্রি</p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ product.sales_count }}
                </p>
              </div>
            </div>
          </div>

          <!-- Category -->
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>ক্যাটেগরি:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ product.category.name }}
            </span>
          </div>

          <!-- Description (if available) -->
          <div
            v-if="hasDetails && (product as ProductDetail).short_description"
            class="text-sm text-gray-600 dark:text-gray-400"
          >
            {{ (product as ProductDetail).short_description }}
          </div>

          <!-- Date -->
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <CalendarIcon class="h-4 w-4" />
            <span>তৈরি: {{ formatDate(product.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
      <BaseButton variant="outline" @click="emit('view')">
        <EyeIcon class="mr-2 h-4 w-4" />
        সম্পূর্ণ দেখুন
      </BaseButton>
      <BaseButton variant="primary" @click="emit('edit')">
        <PencilIcon class="mr-2 h-4 w-4" />
        এডিট করুন
      </BaseButton>
    </div>
  </div>
</template>
