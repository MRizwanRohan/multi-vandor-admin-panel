<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Product Detail — View product details page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService } from '@/services'
import { useCurrency, useDate, useConfirm, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import type { ProductDetail } from '@/types'
import { PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const confirm = useConfirm()
const toast = useToast()

// Data
const product = ref<ProductDetail | null>(null)
const isLoading = ref(true)
const productId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? null : id
})

// Set page info
onMounted(() => {
  if (!productId.value) {
    toast.error('Invalid product ID')
    router.push('/admin/products')
    return
  }
  fetchProduct()
})

// Fetch product
async function fetchProduct() {
  isLoading.value = true
  try {
    product.value = await productService.adminShow(productId.value) as ProductDetail
    breadcrumbStore.setPageInfo(product.value.name, [
      { label: 'Products', to: '/admin/products' },
      { label: product.value.name },
    ])
  } catch (error) {
    toast.error('Failed to fetch product')
    // Mock data for demo
    product.value = {
      id: productId.value,
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt',
      sku: 'TSH-001',
      description: 'This premium cotton t-shirt is made from 100% organic cotton, providing exceptional comfort and durability.',
      short_description: 'High quality cotton t-shirt for everyday wear',
      price: 1500,
      sale_price: 1200,
      effective_price: 1200,
      cost_price: 800,
      type: 'simple',
      status: 'approved',
      visibility: 'visible',
      stock_quantity: 150,
      low_stock_threshold: 20,
      is_featured: false,
      is_active: true,
      is_in_stock: true,
      rating_average: 4.5,
      review_count: 12,
      sales_count: 45,
      weight: 0.3,
      dimensions: { length: 30, width: 20, height: 2 },
      meta_title: 'Premium Cotton T-Shirt | Fashion Store',
      meta_description: 'Shop premium cotton t-shirts made from organic materials.',
      published_at: '2024-01-15T10:30:00Z',
      category: { id: 1, name: 'Clothing', slug: 'clothing' },
      brand: null,
      vendor: { id: 1, store_name: 'Fashion Store', slug: 'fashion-store', logo_url: null },
      primary_image: 'https://placehold.co/400x400?text=Product',
      images: [
        { id: 1, url: 'https://placehold.co/400x400?text=Image+1', alt_text: 'Product image 1', is_primary: true, sort_order: 1 },
        { id: 2, url: 'https://placehold.co/400x400?text=Image+2', alt_text: 'Product image 2', is_primary: false, sort_order: 2 },
      ],
      attributes: [
        { template_id: 1, template_name: 'Material', template_slug: 'material', data_type: 'text', value: '100% Cotton', display_value: '100% Cotton' },
        { template_id: 2, template_name: 'Care', template_slug: 'care', data_type: 'text', value: 'Machine washable', display_value: 'Machine washable' },
      ],
      variant_config: null,
      variant_matrix: null,
      variants: [],
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z',
    }
    breadcrumbStore.setPageInfo(product.value.name, [
      { label: 'Products', to: '/admin/products' },
      { label: product.value.name },
    ])
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
      await productService.adminDelete(product.value.id)
      toast.success('Product deleted successfully')
      router.push('/admin/products')
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }
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
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            SKU: {{ product.sku }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton variant="secondary" :to="`/admin/products/${product.id}/edit`">
          <PencilIcon class="mr-2 h-4 w-4" />
          Edit
        </BaseButton>
        <BaseButton variant="danger" @click="deleteProduct">
          <TrashIcon class="mr-2 h-4 w-4" />
          Delete
        </BaseButton>
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
              <span class="text-gray-500 dark:text-gray-400">Stock</span>
              <span
                class="font-bold"
                :class="[
                  product.stock_quantity === 0 ? 'text-danger-600 dark:text-danger-400' :
                  product.stock_quantity <= (product.low_stock_threshold || 10) ? 'text-warning-600 dark:text-warning-400' :
                  'text-gray-900 dark:text-white'
                ]"
              >
                {{ product.stock_quantity }} units
              </span>
            </div>
            <div v-if="product.low_stock_threshold" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Low Stock Alert</span>
              <span class="text-gray-900 dark:text-white">
                {{ product.low_stock_threshold }} units
              </span>
            </div>
          </div>
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
            Timestamps
          </h3>
          <div class="space-y-3 text-sm">
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
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
