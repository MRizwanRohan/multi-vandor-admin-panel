<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Product Detail — View product details page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService } from '@/services'
import { useCurrency, useDate, useConfirm, useToast, useProduct } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import type { ProductDetail } from '@/types'
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const confirm = useConfirm()
const toast = useToast()
const {
  approveProduct,
  rejectProduct,
  toggleFeatured,
  adminDeleteProduct,
  submitting,
} = useProduct()

// Data
const product = ref<ProductDetail | null>(null)
const isLoading = ref(true)
const productSlug = computed(() => route.params.id as string)
const showRejectModal = ref(false)
const rejectionReason = ref('')

// Set page info
onMounted(() => {
  if (!productSlug.value) {
    toast.error('Invalid product')
    router.push('/admin/products')
    return
  }
  fetchProduct()
})

// Computed
const isPending = computed(() => product.value?.status === 'pending')
const isRejected = computed(() => product.value?.status === 'rejected')

// Fetch product
async function fetchProduct() {
  isLoading.value = true
  try {
    product.value = await productService.adminShow(productSlug.value) as ProductDetail
    breadcrumbStore.setPageInfo(product.value.name, [
      { label: 'Products', to: '/admin/products' },
      { label: product.value.name },
    ])
  } catch (error) {
    toast.error('Failed to fetch product')
    router.push('/admin/products')
  } finally {
    isLoading.value = false
  }
}

// Delete product
async function deleteProduct() {
  if (!product.value) return
  
  const confirmed = await confirm.show({
    title: 'Delete Product',
    message: `Are you sure you want to delete "${product.value.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      await adminDeleteProduct(product.value.slug)
      router.push('/admin/products')
    } catch { /* handled in composable */ }
  }
}

// Approve
async function handleApprove() {
  if (!product.value) return
  try {
    const updated = await approveProduct(product.value.slug)
    product.value = updated as ProductDetail
  } catch { /* handled in composable */ }
}

// Reject
function openRejectModal() {
  rejectionReason.value = ''
  showRejectModal.value = true
}

async function handleReject() {
  if (!product.value || !rejectionReason.value.trim()) {
    toast.error('Please provide a rejection reason')
    return
  }
  try {
    const updated = await rejectProduct(product.value.slug, rejectionReason.value)
    product.value = updated as ProductDetail
    showRejectModal.value = false
  } catch { /* handled in composable */ }
}

// Toggle Featured
async function handleToggleFeatured() {
  if (!product.value) return
  try {
    const result = await toggleFeatured(product.value.slug)
    product.value.is_featured = result.is_featured
  } catch { /* handled in composable */ }
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'secondary' | 'danger' {
  const variants: Record<string, 'success' | 'warning' | 'secondary' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    draft: 'secondary',
    rejected: 'danger',
    archived: 'secondary',
  }
  return variants[status] || 'secondary'
}

// Calculate profit margin
const profitMargin = computed(() => {
  if (!product.value?.cost_price || !product.value?.price) return 0
  return ((product.value.price - product.value.cost_price) / product.value.price * 100).toFixed(1)
})
</script>

<template>
  <PageLoader v-if="isLoading" />

  <div v-else-if="product" class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" to="/admin/products">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ product.name }}
            </h1>
            <BaseBadge :variant="getStatusVariant(product.status)" class="capitalize">
              {{ product.status }}
            </BaseBadge>
            <BaseBadge :variant="product.type === 'variable' ? 'info' : 'secondary'" size="sm" class="capitalize">
              {{ product.type || 'simple' }}
            </BaseBadge>
            <StarSolidIcon v-if="product.is_featured" class="h-5 w-5 text-yellow-500" title="Featured" />
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            SKU: {{ product.sku }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Approve/Reject for pending -->
        <template v-if="isPending">
          <BaseButton variant="success" @click="handleApprove" :disabled="submitting">
            <CheckIcon class="mr-2 h-4 w-4" />
            Approve
          </BaseButton>
          <BaseButton variant="danger" @click="openRejectModal" :disabled="submitting">
            <XMarkIcon class="mr-2 h-4 w-4" />
            Reject
          </BaseButton>
        </template>
        <!-- Featured toggle -->
        <BaseButton
          variant="secondary"
          @click="handleToggleFeatured"
          :disabled="submitting"
          :title="product.is_featured ? 'Remove from featured' : 'Mark as featured'"
        >
          <component :is="product.is_featured ? StarSolidIcon : StarIcon" class="mr-2 h-4 w-4" :class="product.is_featured ? 'text-yellow-500' : ''" />
          {{ product.is_featured ? 'Unfeature' : 'Feature' }}
        </BaseButton>
        <BaseButton variant="secondary" :to="`/admin/products/${product.slug}/edit`">
          <PencilIcon class="mr-2 h-4 w-4" />
          Edit
        </BaseButton>
        <BaseButton variant="danger" @click="deleteProduct" :disabled="submitting">
          <TrashIcon class="mr-2 h-4 w-4" />
          Delete
        </BaseButton>
      </div>
    </div>

    <!-- Rejection Alert -->
    <div v-if="isRejected" class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="h-5 w-5 text-danger-600 dark:text-danger-400 mt-0.5 shrink-0" />
        <div>
          <h3 class="font-medium text-danger-800 dark:text-danger-200">Product Rejected</h3>
          <p v-if="product.rejection_reason" class="mt-1 text-sm text-danger-700 dark:text-danger-300">
            Reason: {{ product.rejection_reason }}
          </p>
          <p v-if="product.rejected_at" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
            Rejected on {{ date.format(product.rejected_at, 'MMM D, YYYY') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pending Review Alert -->
    <div v-if="isPending" class="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
      <div class="flex items-center gap-3">
        <ExclamationTriangleIcon class="h-5 w-5 text-warning-600 dark:text-warning-400 shrink-0" />
        <p class="text-sm text-warning-800 dark:text-warning-200">This product is awaiting your review. Please approve or reject it.</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main content -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Images -->
        <BaseCard v-if="product.images?.length">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Images
          </h3>
          <div class="grid grid-cols-3 gap-4 sm:grid-cols-4">
            <div
              v-for="image in product.images"
              :key="image.id"
              class="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <img
                :src="image.url"
                :alt="image.alt_text || product.name"
                class="h-full w-full object-cover"
              />
            </div>
          </div>
        </BaseCard>

        <!-- Description -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Description
          </h3>
          <div class="space-y-4">
            <div v-if="product.short_description">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Short Description
              </h4>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ product.short_description }}
              </p>
            </div>
            <div v-if="product.description">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Full Description
              </h4>
              <p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">
                {{ product.description }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Attributes -->
        <BaseCard v-if="product.attributes?.length">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Attributes
          </h3>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="attr in product.attributes"
              :key="attr.template_id"
              class="flex items-center justify-between py-3"
            >
              <span class="text-gray-500 dark:text-gray-400">{{ attr.template_name }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ attr.display_value }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Variants -->
        <BaseCard v-if="product.variants && product.variants.length > 0">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Variants ({{ product.variants.length }})
          </h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="variant in product.variants" :key="variant.id">
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {{ variant.name || variant.attribute_combination?.map(a => a.value).join(' / ') }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ variant.sku }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                    <template v-if="variant.sale_price && variant.sale_price < variant.price">
                      {{ currency.formatCurrency(variant.sale_price) }}
                      <span class="text-xs text-gray-400 line-through ml-1">
                        {{ currency.formatCurrency(variant.price) }}
                      </span>
                    </template>
                    <template v-else>
                      {{ currency.formatCurrency(variant.price) }}
                    </template>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="variant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'" class="font-medium text-sm">
                      {{ variant.stock_quantity }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <BaseBadge :variant="variant.is_active ? 'success' : 'secondary'" size="sm">
                      {{ variant.is_active ? 'Active' : 'Inactive' }}
                    </BaseBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <!-- SEO -->
        <BaseCard v-if="product.meta_title || product.meta_description || product.slug">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            SEO Settings
          </h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Meta Title
              </h4>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ product.meta_title || 'Not set' }}
              </p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Meta Description
              </h4>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ product.meta_description || 'Not set' }}
              </p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
                URL Slug
              </h4>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ product.slug }}
              </p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Pricing -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Pricing
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Price</span>
              <span class="text-lg font-bold text-gray-900 dark:text-white">
                {{ currency.formatCurrency(product.price) }}
              </span>
            </div>
            <div v-if="product.sale_price" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Sale Price</span>
              <span class="text-success-600 dark:text-success-400 font-medium">
                {{ currency.formatCurrency(product.sale_price) }}
              </span>
            </div>
            <div v-if="product.sale_start_date || product.sale_end_date" class="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Sale Period</p>
              <p v-if="product.sale_start_date" class="text-sm text-gray-900 dark:text-white">
                From: {{ date.format(product.sale_start_date, 'MMM D, YYYY') }}
              </p>
              <p v-if="product.sale_end_date" class="text-sm text-gray-900 dark:text-white">
                To: {{ date.format(product.sale_end_date, 'MMM D, YYYY') }}
              </p>
              <BaseBadge v-if="product.is_sale_active" color="green" size="sm" class="mt-1">Sale Active</BaseBadge>
            </div>
            <div v-if="product.cost_price" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Cost</span>
              <span class="text-gray-900 dark:text-white">
                {{ currency.formatCurrency(product.cost_price) }}
              </span>
            </div>
            <div v-if="product.cost_price" class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
              <span class="text-gray-500 dark:text-gray-400">Profit Margin</span>
              <span class="font-medium text-success-600 dark:text-success-400">
                {{ profitMargin }}%
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Inventory -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Inventory
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">
                {{ product.type === 'variable' ? 'Total Stock (all variants)' : 'Stock' }}
              </span>
              <span
                class="font-bold"
                :class="[
                  (product.type === 'variable' ? (product as any).total_stock : product.stock_quantity) === 0 ? 'text-danger-600 dark:text-danger-400' :
                  (product.type === 'variable' ? (product as any).total_stock : product.stock_quantity) <= (product.low_stock_threshold || 10) ? 'text-warning-600 dark:text-warning-400' :
                  'text-gray-900 dark:text-white'
                ]"
              >
                {{ product.type === 'variable' ? ((product as any).total_stock ?? 0) : product.stock_quantity }} units
              </span>
            </div>
            <div v-if="product.low_stock_threshold" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Low Stock Alert</span>
              <span class="text-gray-900 dark:text-white">
                {{ product.low_stock_threshold }} units
              </span>
            </div>
            <div v-if="product.type === 'variable' && product.variants?.length" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Variant Count</span>
              <span class="text-gray-900 dark:text-white">
                {{ product.variants.length }}
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Weight & Dimensions -->
        <BaseCard v-if="product.weight || (product as any).dimensions">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Shipping
          </h3>
          <div class="space-y-3">
            <div v-if="product.weight" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Weight</span>
              <span class="text-gray-900 dark:text-white">{{ product.weight }} kg</span>
            </div>
            <div v-if="(product as any).dimensions" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Dimensions (L×W×H)</span>
              <span class="text-gray-900 dark:text-white">
                {{ (product as any).dimensions.length }} × {{ (product as any).dimensions.width }} × {{ (product as any).dimensions.height }} cm
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Brand -->
        <BaseCard v-if="(product as any).brand">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Brand
          </h3>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ (product as any).brand.name }}
          </p>
        </BaseCard>

        <!-- Category -->
        <BaseCard v-if="product.category">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Category
          </h3>
          <div class="flex flex-wrap gap-2">
            <BaseBadge variant="secondary">
              {{ product.category.name }}
            </BaseBadge>
          </div>
        </BaseCard>

        <!-- Vendor -->
        <BaseCard v-if="product.vendor">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Vendor
          </h3>
          <div class="space-y-2">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ product.vendor.store_name }}
            </p>
            <RouterLink
              :to="`/admin/vendors/${product.vendor.id}`"
              class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              View Vendor Profile →
            </RouterLink>
          </div>
        </BaseCard>

        <!-- Timestamps -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Details
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Visibility</span>
              <BaseBadge variant="secondary" size="sm" class="capitalize">
                {{ product.visibility || 'visible' }}
              </BaseBadge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Active</span>
              <BaseBadge :variant="product.is_active ? 'success' : 'secondary'" size="sm">
                {{ product.is_active ? 'Yes' : 'No' }}
              </BaseBadge>
            </div>
            <div v-if="(product as any).scheduled_publish_at" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Scheduled</span>
              <span class="text-gray-900 dark:text-white">
                {{ date.format((product as any).scheduled_publish_at, 'MMM D, YYYY HH:mm') }}
              </span>
            </div>
            <div v-if="(product as any).published_at" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Published</span>
              <span class="text-gray-900 dark:text-white">
                {{ date.format((product as any).published_at, 'MMM D, YYYY') }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Created</span>
              <span class="text-gray-900 dark:text-white">
                {{ date.format(product.created_at, 'MMM D, YYYY') }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Updated</span>
              <span class="text-gray-900 dark:text-white">
                {{ date.format(product.updated_at, 'MMM D, YYYY') }}
              </span>
            </div>
            <div v-if="(product as any).rating_average" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Rating</span>
              <div class="flex items-center gap-1">
                <StarSolidIcon class="h-4 w-4 text-yellow-500" />
                <span class="text-gray-900 dark:text-white">{{ (product as any).rating_average }}</span>
                <span class="text-gray-400">({{ (product as any).review_count || 0 }})</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Reject Modal -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showRejectModal = false"></div>
        <div class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Product</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Rejecting: <strong>{{ product?.name }}</strong>
          </p>
          <textarea
            v-model="rejectionReason"
            rows="3"
            placeholder="Provide a reason for rejection..."
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
          <div class="mt-4 flex justify-end gap-3">
            <BaseButton variant="secondary" size="sm" @click="showRejectModal = false">Cancel</BaseButton>
            <BaseButton variant="danger" size="sm" @click="handleReject" :disabled="submitting">Reject</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
