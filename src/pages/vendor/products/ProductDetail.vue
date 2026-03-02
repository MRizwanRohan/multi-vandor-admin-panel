<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Product Detail — View product details (vendor perspective) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService } from '@/services'
import { useToast, useCurrency, useDate, useProduct, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { ProductDetail as ProductDetailType, ProductImage, CompletenessResponse } from '@/types'
import {
  ArrowLeftIcon,
  PencilIcon,
  CubeIcon,
  CurrencyBangladeshiIcon,
  ChartBarIcon,
  StarIcon,
  ShoppingCartIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const currency = useCurrency()
const date = useDate()
const confirmDialog = useConfirm()
const {
  submitForReview,
  duplicateProduct,
  getCompleteness,
  schedulePublish,
  submitting,
} = useProduct()

// Product slug from route
const productSlug = computed(() => route.params.id as string)

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Product Details', [
    { label: 'Products', to: '/vendor/products' },
    { label: 'Product Details' },
  ])
  
  if (productSlug.value) {
    fetchProduct()
  } else {
    router.push('/vendor/products')
  }
})

// Data
const isLoading = ref(true)
const product = ref<ProductDetailType | null>(null)
const selectedImage = ref<ProductImage | null>(null)
const completeness = ref<CompletenessResponse | null>(null)
const showScheduleModal = ref(false)
const scheduleDate = ref('')

// Computed
const canEdit = computed(() => {
  if (!product.value) return false
  return ['draft', 'rejected', 'approved'].includes(product.value.status)
})

const canSubmit = computed(() => {
  if (!product.value) return false
  return ['draft', 'rejected'].includes(product.value.status)
})

const isRejected = computed(() => product.value?.status === 'rejected')
const isPending = computed(() => product.value?.status === 'pending')

// Fetch product
async function fetchProduct() {
  if (!productSlug.value) return
  
  isLoading.value = true
  try {
    const data = await productService.vendorShow(productSlug.value)
    product.value = data as ProductDetailType
    if (data.images && data.images.length > 0) {
      selectedImage.value = data.images[0]
    }
    // Fetch completeness score
    try {
      completeness.value = await getCompleteness(productSlug.value)
    } catch { /* completeness is optional */ }
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
  const isVariable = product.value.type === 'variable'
  const stock = isVariable ? ((product.value as any).total_stock ?? product.value.stock_quantity) : product.value.stock_quantity
  if (stock <= 0) return { label: 'Out of Stock', color: 'red' as const }
  if (stock <= (product.value.low_stock_threshold || 10)) {
    return { label: isVariable ? `Low Stock (${stock} across variants)` : 'Low Stock', color: 'yellow' as const }
  }
  return { label: isVariable ? `In Stock (${stock} across variants)` : 'In Stock', color: 'green' as const }
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
    router.push(`/vendor/products/${product.value.slug}/edit`)
  }
}

async function handleSubmitForReview() {
  if (!product.value) return
  const confirmed = await confirmDialog.show({
    title: 'Submit for Review',
    message: `Submit "${product.value.name}" for admin review? You won't be able to edit it until it's reviewed.`,
    confirmText: 'Submit',
    cancelText: 'Cancel',
    variant: 'info',
  })
  if (confirmed) {
    try {
      const updated = await submitForReview(product.value.slug)
      product.value = updated as ProductDetailType
    } catch { /* handled in composable */ }
  }
}

async function handleDuplicate() {
  if (!product.value) return
  try {
    const duplicated = await duplicateProduct(product.value.slug)
    router.push(`/vendor/products/${duplicated.slug}/edit`)
  } catch { /* handled in composable */ }
}

async function handleSchedule() {
  if (!product.value || !scheduleDate.value) return
  try {
    const updated = await schedulePublish(product.value.slug, scheduleDate.value)
    product.value = updated as ProductDetailType
    showScheduleModal.value = false
    scheduleDate.value = ''
  } catch { /* handled in composable */ }
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
      <div class="flex items-center gap-2">
        <BaseButton v-if="product" variant="ghost" size="sm" @click="handleDuplicate" :disabled="submitting">
          <DocumentDuplicateIcon class="h-5 w-5 mr-1" />
          Duplicate
        </BaseButton>
        <BaseButton v-if="product && canSubmit" variant="primary" size="sm" @click="handleSubmitForReview" :disabled="submitting">
          <PaperAirplaneIcon class="h-5 w-5 mr-1" />
          Submit for Review
        </BaseButton>
        <BaseButton v-if="product && canEdit" variant="secondary" size="sm" @click="editProduct">
          <PencilIcon class="h-5 w-5 mr-2" />
          Edit Product
        </BaseButton>
      </div>
    </div>

    <!-- Rejection Alert -->
    <div v-if="product && isRejected" class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="h-5 w-5 text-danger-600 dark:text-danger-400 mt-0.5 shrink-0" />
        <div>
          <h3 class="font-medium text-danger-800 dark:text-danger-200">Product Rejected</h3>
          <p v-if="product.rejection_reason" class="mt-1 text-sm text-danger-700 dark:text-danger-300">
            {{ product.rejection_reason }}
          </p>
          <p v-if="product.rejected_at" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
            Rejected on {{ date.formatDate(product.rejected_at) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pending Alert -->
    <div v-if="product && isPending" class="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
      <div class="flex items-center gap-3">
        <ClockIcon class="h-5 w-5 text-warning-600 dark:text-warning-400 shrink-0" />
        <p class="text-sm text-warning-800 dark:text-warning-200">This product is pending admin review. You cannot edit it until the review is complete.</p>
      </div>
    </div>

    <!-- Completeness Score -->
    <div v-if="completeness" class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Completeness</span>
        <span class="text-sm font-bold" :class="completeness.score >= 80 ? 'text-green-600' : completeness.score >= 50 ? 'text-yellow-600' : 'text-red-600'">
          {{ completeness.score }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          class="h-2 rounded-full transition-all"
          :class="completeness.score >= 80 ? 'bg-green-500' : completeness.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
          :style="{ width: `${completeness.score}%` }"
        ></div>
      </div>
      <div v-if="completeness.missing && completeness.missing.length > 0" class="mt-2">
        <p class="text-xs text-gray-500 dark:text-gray-400">Missing: {{ completeness.missing.join(', ') }}</p>
      </div>
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
                    {{ product.type === 'variable' ? ((product as any).total_stock ?? product.stock_quantity) : product.stock_quantity }} units available
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
              <div v-if="product.sale_start_date || product.sale_end_date" class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <dt class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Sale Period</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  <p v-if="product.sale_start_date">Start: {{ date.formatDate(product.sale_start_date) }}</p>
                  <p v-if="product.sale_end_date">End: {{ date.formatDate(product.sale_end_date) }}</p>
                  <BaseBadge v-if="product.is_sale_active" color="green" size="sm" class="mt-1">Sale Active</BaseBadge>
                </dd>
              </div>
              <div v-if="product.scheduled_publish_at" class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div class="flex justify-between">
                  <dt class="text-gray-500 dark:text-gray-400">Scheduled</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">{{ date.formatDate(product.scheduled_publish_at) }}</dd>
                </div>
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

          <!-- Schedule Publishing -->
          <BaseCard v-if="canSubmit || product.status === 'approved'" title="Schedule">
            <div class="space-y-3">
              <p class="text-sm text-gray-500 dark:text-gray-400">Schedule this product for future publishing.</p>
              <input
                v-model="scheduleDate"
                type="datetime-local"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <BaseButton
                variant="secondary"
                size="sm"
                class="w-full"
                :disabled="!scheduleDate || submitting"
                @click="handleSchedule"
              >
                <ClockIcon class="h-4 w-4 mr-2" />
                Schedule Publish
              </BaseButton>
            </div>
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
