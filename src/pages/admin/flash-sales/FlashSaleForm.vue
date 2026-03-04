<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Flash Sale Form — Create/Edit flash sale with product selection -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { flashSaleService, productService } from '@/services'
import { useToast, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { Product, FlashSaleProduct } from '@/types'
import {
  ArrowLeftIcon,
  BoltIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

// Mode detection
const flashSaleId = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw || raw === 'new') return undefined
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})
const isEditMode = computed(() => flashSaleId.value !== undefined)
const pageTitle = computed(() => isEditMode.value ? 'Edit Flash Sale' : 'Create Flash Sale')

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Flash Sales', to: '/admin/flash-sales' },
    { label: pageTitle.value },
  ])
  
  fetchProducts()
  if (isEditMode.value) {
    fetchFlashSale()
  }
})

// Data
const isLoading = ref(false)
const products = ref<Product[]>([])
const selectedProducts = ref<FlashSaleProduct[]>([])
const productSearch = ref('')
const showProductSearch = ref(false)

// Form validation
const flashSaleSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  starts_at: z.string().min(1, 'Start date is required'),
  ends_at: z.string().min(1, 'End date is required'),
  is_active: z.boolean(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: flashSaleSchema,
  initialValues: {
    name: '',
    description: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
  },
})

const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')
const [startsAt, startsAtAttrs] = defineField('starts_at')
const [endsAt, endsAtAttrs] = defineField('ends_at')
const [isActive, isActiveAttrs] = defineField('is_active')

// Fetch flash sale for editing
async function fetchFlashSale() {
  if (!flashSaleId.value) return
  
  isLoading.value = true
  try {
    const flashSale = await flashSaleService.getById(flashSaleId.value)
    setValues({
      name: flashSale.name,
      description: flashSale.description || '',
      starts_at: formatDateTimeLocal(flashSale.starts_at),
      ends_at: formatDateTimeLocal(flashSale.ends_at),
      is_active: flashSale.is_active,
    })
    // Map products
    if (flashSale.products && flashSale.products.length > 0) {
      selectedProducts.value = flashSale.products.map(p => ({
        product_id: p.product_id || p.id,
        flash_price: p.flash_price || p.pivot?.flash_price || 0,
        flash_quantity: p.flash_quantity || p.pivot?.flash_quantity,
        product: p.product || p,
      }))
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to fetch flash sale')
    router.push('/admin/flash-sales')
  } finally {
    isLoading.value = false
  }
}

// Fetch products for selection
async function fetchProducts() {
  try {
    // Use admin endpoint to list all products (max 100 per page)
    const response = await productService.adminList({ per_page: 100 })
    // Handle various response structures
    const data = response as any
    if (Array.isArray(data.data)) {
      products.value = data.data
    } else if (Array.isArray(data)) {
      products.value = data
    } else {
      products.value = []
    }
  } catch (error: any) {
    console.error('Failed to fetch products:', error)
    toast.error(error.response?.data?.message || 'Failed to load products. Please check your permissions.')
    products.value = []
  }
}

// Format datetime for input
function formatDateTimeLocal(date: string) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().slice(0, 16)
}

// Filtered products for search
const filteredProducts = computed(() => {
  if (!productSearch.value) return products.value.slice(0, 20)
  const search = productSearch.value.toLowerCase()
  return products.value
    .filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.sku?.toLowerCase().includes(search)
    )
    .slice(0, 20)
})

// Check if product is already selected
function isProductSelected(productId: number) {
  return selectedProducts.value.some(p => p.product_id === productId)
}

// Add product to selection
function addProduct(product: Product) {
  if (isProductSelected(product.id)) return
  
  selectedProducts.value.push({
    product_id: product.id,
    flash_price: product.price * 0.8, // Default 20% discount
    flash_quantity: product.stock_quantity || undefined,
    product: product,
  })
  productSearch.value = ''
  showProductSearch.value = false
}

// Remove product from selection
function removeProduct(index: number) {
  selectedProducts.value.splice(index, 1)
}

// Calculate discount percentage
function getDiscountPercent(item: FlashSaleProduct) {
  if (!item.product?.price || !item.flash_price) return 0
  return Math.round((1 - item.flash_price / item.product.price) * 100)
}

// Submit form
const onSubmit = handleSubmit(async (values) => {
  if (selectedProducts.value.length === 0) {
    toast.error('Please add at least one product to the flash sale')
    return
  }

  try {
    const payload = {
      name: values.name,
      description: values.description,
      starts_at: values.starts_at,
      ends_at: values.ends_at,
      is_active: values.is_active,
      products: selectedProducts.value.map(p => ({
        product_id: p.product_id,
        flash_price: p.flash_price,
        flash_quantity: p.flash_quantity || undefined,
      })),
    }
    
    if (isEditMode.value && flashSaleId.value) {
      await flashSaleService.update(flashSaleId.value, payload)
      toast.success('Flash sale updated successfully')
    } else {
      await flashSaleService.create(payload)
      toast.success('Flash sale created successfully')
    }
    
    router.push('/admin/flash-sales')
  } catch (error: any) {
    toast.error(error.response?.data?.message || (isEditMode.value ? 'Failed to update flash sale' : 'Failed to create flash sale'))
  }
})

// Navigation
function goBack() {
  router.push('/admin/flash-sales')
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
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
      </div>
      <div class="flex gap-3">
        <BaseButton variant="secondary" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">
          {{ isEditMode ? 'Update Flash Sale' : 'Create Flash Sale' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>

    <form v-else @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Information -->
        <BaseCard title="Flash Sale Details">
          <div class="space-y-4">
            <FormInput
              v-model="name"
              v-bind="nameAttrs"
              label="Sale Name"
              placeholder="e.g., Weekend Mega Sale"
              :error="errors.name"
              required
            />
            
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
              label="Description"
              placeholder="Describe the flash sale campaign"
              :rows="3"
              :error="errors.description"
            />
            
            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="startsAt"
                v-bind="startsAtAttrs"
                label="Start Date & Time"
                type="datetime-local"
                :error="errors.starts_at"
                required
              />
              
              <FormInput
                v-model="endsAt"
                v-bind="endsAtAttrs"
                label="End Date & Time"
                type="datetime-local"
                :error="errors.ends_at"
                required
              />
            </div>
          </div>
        </BaseCard>

        <!-- Products -->
        <BaseCard title="Flash Sale Products">
          <div class="space-y-4">
            <!-- Product Search -->
            <div class="relative">
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <FormInput
                    v-model="productSearch"
                    name="productSearch"
                    placeholder="Search products to add..."
                    class="pl-10"
                    @focus="showProductSearch = true"
                    @input="showProductSearch = true"
                  />
                </div>
              </div>
              
              <!-- Search Results Dropdown -->
              <div
                v-if="showProductSearch && filteredProducts.length > 0"
                class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-64 overflow-auto"
              >
                <button
                  v-for="product in filteredProducts"
                  :key="product.id"
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  :disabled="isProductSelected(product.id)"
                  @click="addProduct(product)"
                >
                  <img
                    v-if="product.thumbnail || product.images?.[0]?.url"
                    :src="product.thumbnail || product.images?.[0]?.url"
                    :alt="product.name"
                    class="h-10 w-10 rounded-lg object-cover"
                  />
                  <div v-else class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                    <ShoppingBagIcon class="h-5 w-5 text-gray-400" />
                  </div>
                  <div class="flex-1 text-left">
                    <p class="font-medium text-gray-900 dark:text-white">{{ product.name }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatCurrency(product.price) }}
                      <span v-if="product.sku" class="ml-2">SKU: {{ product.sku }}</span>
                    </p>
                  </div>
                  <BaseBadge v-if="isProductSelected(product.id)" variant="secondary">Added</BaseBadge>
                  <PlusIcon v-else class="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <!-- No results message -->
              <div
                v-else-if="showProductSearch && productSearch && filteredProducts.length === 0"
                class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 p-4 text-center text-gray-500"
              >
                No products found for "{{ productSearch }}"
              </div>
            </div>

            <!-- Backdrop to close dropdown -->
            <div
              v-if="showProductSearch"
              class="fixed inset-0 z-40"
              @click="showProductSearch = false"
            />

            <!-- Selected Products -->
            <div v-if="selectedProducts.length === 0" class="py-8 text-center">
              <ShoppingBagIcon class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No products added yet. Search and add products above.
              </p>
            </div>

            <div v-else class="space-y-3">
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-2">
                <span>{{ selectedProducts.length }} products added</span>
              </div>
              
              <div
                v-for="(item, index) in selectedProducts"
                :key="item.product_id"
                class="flex items-center gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <!-- Product Info -->
                <img
                  v-if="item.product?.thumbnail || item.product?.images?.[0]?.url"
                  :src="item.product?.thumbnail || item.product?.images?.[0]?.url"
                  :alt="item.product?.name"
                  class="h-16 w-16 rounded-lg object-cover"
                />
                <div v-else class="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                  <ShoppingBagIcon class="h-8 w-8 text-gray-400" />
                </div>
                
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ item.product?.name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Original: {{ formatCurrency(item.product?.price || 0) }}
                  </p>
                </div>
                
                <!-- Flash Price -->
                <div class="w-32">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Flash Price</label>
                  <FormInput
                    v-model.number="item.flash_price"
                    name="flash_price"
                    type="number"
                    :min="0"
                    size="sm"
                  />
                </div>
                
                <!-- Quantity -->
                <div class="w-24">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qty Limit</label>
                  <FormInput
                    v-model.number="item.flash_quantity"
                    name="flash_quantity"
                    type="number"
                    :min="1"
                    placeholder="∞"
                    size="sm"
                  />
                </div>
                
                <!-- Discount % -->
                <div class="text-center">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Discount</p>
                  <p class="text-lg font-bold text-success-600 dark:text-success-400">
                    {{ getDiscountPercent(item) }}%
                  </p>
                </div>
                
                <!-- Remove -->
                <button
                  type="button"
                  class="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Remove"
                  @click="removeProduct(index)"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status -->
        <BaseCard title="Status">
          <div class="space-y-4">
            <FormSwitch
              v-model="isActive"
              v-bind="isActiveAttrs"
              label="Active"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Flash sale will be visible to customers when active and within the scheduled period.
            </p>
          </div>
        </BaseCard>

        <!-- Preview -->
        <BaseCard title="Preview">
          <div class="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg text-white">
            <div class="flex items-center justify-between mb-3">
              <BoltIcon class="h-8 w-8" />
              <span class="text-xs uppercase tracking-wider opacity-75">Flash Sale</span>
            </div>
            <div class="text-xl font-bold mb-1">
              {{ name || 'Flash Sale Name' }}
            </div>
            <div v-if="description" class="text-sm opacity-90 mb-3 line-clamp-2">
              {{ description }}
            </div>
            <div class="text-sm mt-2">
              <p class="opacity-75">{{ selectedProducts.length }} products</p>
            </div>
          </div>
        </BaseCard>

        <!-- Summary -->
        <BaseCard title="Summary">
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Products</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedProducts.length }}</span>
            </div>
            <div v-if="selectedProducts.length > 0" class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Avg Discount</span>
              <span class="font-medium text-success-600 dark:text-success-400">
                {{ Math.round(selectedProducts.reduce((sum, p) => sum + getDiscountPercent(p), 0) / selectedProducts.length) }}%
              </span>
            </div>
          </div>
        </BaseCard>
      </div>
    </form>
  </div>
</template>
