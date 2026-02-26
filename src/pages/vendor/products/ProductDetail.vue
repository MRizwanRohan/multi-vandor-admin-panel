<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Product Detail — View product details (vendor perspective) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService } from '@/services'
import { useToast, useCurrency, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { ProductDetail as ProductDetailType, ProductImage } from '@/types'
import {
  ArrowLeftIcon,
  PencilIcon,
  CubeIcon,
  CurrencyBangladeshiIcon,
  ChartBarIcon,
  StarIcon,
  ShoppingCartIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const currency = useCurrency()
const date = useDate()

// Product ID
const productId = computed(() => {
  const raw = route.params.id as string
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Product Details', [
    { label: 'Products', to: '/vendor/products' },
    { label: 'Product Details' },
  ])
  
  if (productId.value) {
    fetchProduct()
  } else {
    router.push('/vendor/products')
  }
})

// Data
const isLoading = ref(true)
const product = ref<ProductDetailType | null>(null)
const selectedImage = ref<ProductImage | null>(null)

// Fetch product
async function fetchProduct() {
  if (!productId.value) return
  
  isLoading.value = true
  try {
    const data = await productService.vendorShow(productId.value)
    product.value = data as ProductDetailType
    if (data.images && data.images.length > 0) {
      selectedImage.value = data.images[0]
    }
  } catch (error) {
    toast.error('Failed to fetch product')
    router.push('/vendor/products')
  } finally {
    isLoading.value = false
  }
}

// Get status badge color
function getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
  const colors: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
    approved: 'green',
    active: 'green',
    pending: 'yellow',
    rejected: 'red',
    draft: 'gray',
    archived: 'gray',
  }
  return colors[status] || 'gray'
}

// Get stock status
const stockStatus = computed(() => {
  if (!product.value) return { label: 'Unknown', color: 'gray' as const }
  if (product.value.stock_quantity <= 0) return { label: 'Out of Stock', color: 'red' as const }
  if (product.value.stock_quantity <= (product.value.low_stock_threshold || 10)) {
    return { label: 'Low Stock', color: 'yellow' as const }
  }
  return { label: 'In Stock', color: 'green' as const }
})

// Render stars
function renderStars(rating: number): boolean[] {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= Math.round(rating))
  }
  return stars
}

// Navigation
function goBack() {
  router.push('/vendor/products')
}

function editProduct() {
  if (product.value) {
    router.push(`/vendor/products/${product.value.id}/edit`)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" @click="goBack">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Product Details</h1>
          <p v-if="product" class="text-sm text-gray-500">SKU: {{ product.sku }}</p>
        </div>
      </div>
      <BaseButton v-if="product" @click="editProduct">
        <PencilIcon class="h-5 w-5 mr-2" />
        Edit Product
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Content -->
    <template v-else-if="product">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Images & Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Product Images -->
          <BaseCard>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Main Image -->
              <div>
                <div class="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    v-if="selectedImage"
                    :src="selectedImage.url"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <CubeIcon class="h-20 w-20 text-gray-400" />
                  </div>
                </div>
                
                <!-- Thumbnails -->
                <div v-if="product.images && product.images.length > 1" class="flex gap-2 mt-4">
                  <button
                    v-for="image in product.images"
                    :key="image.id"
                    @click="selectedImage = image"
                    :class="[
                      'w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                      selectedImage?.id === image.id
                        ? 'border-indigo-500'
                        : 'border-transparent hover:border-gray-300'
                    ]"
                  >
                    <img :src="image.url" :alt="product.name" class="w-full h-full object-cover" />
                  </button>
                </div>
              </div>

              <!-- Product Info -->
              <div>
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                      {{ product.name }}
                    </h2>
                    <p v-if="product.category" class="text-sm text-gray-500 mt-1">
                      {{ product.category.name }}
                    </p>
                  </div>
                  <BaseBadge :color="getStatusColor(product.status)">
                    {{ product.status }}
                  </BaseBadge>
                </div>

                <!-- Rating -->
                <div class="flex items-center gap-2 mb-4">
                  <div class="flex">
                    <component
                      v-for="(filled, i) in renderStars(product.rating_average)"
                      :key="i"
                      :is="filled ? StarSolidIcon : StarIcon"
                      class="h-5 w-5"
                      :class="filled ? 'text-yellow-400' : 'text-gray-300'"
                    />
                  </div>
                  <span class="text-sm text-gray-500">
                    {{ product.rating_average.toFixed(1) }} ({{ product.review_count }} reviews)
                  </span>
                </div>

                <!-- Price -->
                <div class="mb-6">
                  <div class="flex items-baseline gap-3">
                    <span class="text-3xl font-bold text-gray-900 dark:text-white">
                      {{ currency.formatCurrency(product.effective_price) }}
                    </span>
                    <span v-if="product.sale_price" class="text-lg text-gray-400 line-through">
                      {{ currency.formatCurrency(product.price) }}
                    </span>
                  </div>
                  <p v-if="product.cost_price" class="text-sm text-gray-500 mt-1">
                    Cost: {{ currency.formatCurrency(product.cost_price) }} · 
                    Profit: {{ currency.formatCurrency(product.effective_price - product.cost_price) }}
                  </p>
                </div>

                <!-- Stock -->
                <div class="flex items-center gap-4 mb-6">
                  <BaseBadge :color="stockStatus.color">
                    {{ stockStatus.label }}
                  </BaseBadge>
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ product.stock_quantity }} units available
                  </span>
                </div>

                <!-- Short Description -->
                <div v-if="product.short_description" class="prose dark:prose-invert prose-sm max-w-none">
                  <p>{{ product.short_description }}</p>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Full Description -->
          <BaseCard title="Description">
            <div v-if="product.description" class="prose dark:prose-invert max-w-none">
              {{ product.description }}
            </div>
            <p v-else class="text-gray-500 dark:text-gray-400">No description provided.</p>
          </BaseCard>

          <!-- Variants -->
          <BaseCard v-if="product.variants && product.variants.length > 0" title="Variants">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="variant in product.variants" :key="variant.id">
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {{ variant.name || variant.attribute_combination?.map(a => a.value).join(' / ') }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ variant.sku }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                      {{ currency.formatCurrency(variant.price) }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <BaseBadge :color="variant.stock_quantity > 0 ? 'green' : 'red'" size="sm">
                        {{ variant.stock_quantity }}
                      </BaseBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar Stats -->
        <div class="space-y-6">
          <!-- Quick Stats -->
          <BaseCard title="Performance">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ShoppingCartIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span class="text-gray-600 dark:text-gray-400">Total Sales</span>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ product.sales_count }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <StarSolidIcon class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span class="text-gray-600 dark:text-gray-400">Reviews</span>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ product.review_count }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <ChartBarIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span class="text-gray-600 dark:text-gray-400">Views</span>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  -
                </span>
              </div>
            </div>
          </BaseCard>

          <!-- Product Details -->
          <BaseCard title="Details">
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Type</dt>
                <dd class="font-medium text-gray-900 dark:text-white capitalize">{{ product.type }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Visibility</dt>
                <dd class="font-medium text-gray-900 dark:text-white capitalize">{{ product.visibility }}</dd>
              </div>
              <div v-if="product.is_featured" class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Featured</dt>
                <dd><BaseBadge color="purple" size="sm">Yes</BaseBadge></dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Created</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ date.formatDate(product.created_at) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Updated</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ date.formatDate(product.updated_at) }}</dd>
              </div>
            </dl>
          </BaseCard>

          <!-- SEO Info -->
          <BaseCard v-if="product.meta_title || product.meta_description" title="SEO">
            <div class="space-y-3">
              <div v-if="product.meta_title">
                <span class="text-sm text-gray-500 dark:text-gray-400">Meta Title</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ product.meta_title }}</p>
              </div>
              <div v-if="product.meta_description">
                <span class="text-sm text-gray-500 dark:text-gray-400">Meta Description</span>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ product.meta_description }}</p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>
