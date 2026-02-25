<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Product Form — Create/Edit product page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { productService, categoryService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { ProductDetail, Category } from '@/types'
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Mode detection
const productId = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw || raw === 'new') return undefined
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})
const isEditMode = computed(() => productId.value !== undefined)
const pageTitle = computed(() => isEditMode.value ? 'Edit Product' : 'Add Product')

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Products', to: '/admin/products' },
    { label: pageTitle.value },
  ])
  
  if (isEditMode.value) {
    fetchProduct()
  }
  fetchCategories()
})

// Data
const isLoading = ref(false)
const categories = ref<Category[]>([])
const uploadedImages = ref<{ id: string; url: string; file?: File }[]>([])

// Form validation
const productSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  cost_price: z.coerce.number().min(0).optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0, 'Stock must be a positive integer'),
  low_stock_threshold: z.coerce.number().int().min(0).optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'archived']),
  category_id: z.coerce.number().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: productSchema,
  initialValues: {
    name: '',
    sku: '',
    description: '',
    short_description: '',
    price: 0,
    sale_price: null as number | null,
    cost_price: null as number | null,
    stock_quantity: 0,
    low_stock_threshold: 10,
    status: 'draft' as const,
    category_id: undefined as number | undefined,
    meta_title: '',
    meta_description: '',
  },
})

const [name, nameAttrs] = defineField('name')
const [sku, skuAttrs] = defineField('sku')
const [description, descriptionAttrs] = defineField('description')
const [shortDescription, shortDescriptionAttrs] = defineField('short_description')
const [price, priceAttrs] = defineField('price')
const [salePrice, salePriceAttrs] = defineField('sale_price')
const [costPrice, costPriceAttrs] = defineField('cost_price')
const [stockQuantity, stockQuantityAttrs] = defineField('stock_quantity')
const [lowStockThreshold, lowStockThresholdAttrs] = defineField('low_stock_threshold')
const [status, statusAttrs] = defineField('status')
const [categoryId, categoryIdAttrs] = defineField('category_id')
const [metaTitle, metaTitleAttrs] = defineField('meta_title')
const [metaDescription, metaDescriptionAttrs] = defineField('meta_description')

// Status options
const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
]

// Fetch existing product
async function fetchProduct() {
  if (!productId.value) return
  
  isLoading.value = true
  try {
    // When editing, the API returns full ProductDetail
    const product = await productService.getById(productId.value!) as ProductDetail
    setValues({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price,
      sale_price: product.sale_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 10,
      status: product.status,
      category_id: product.category?.id,
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
    })
    uploadedImages.value = product.images?.map(img => ({
      id: String(img.id),
      url: img.url,
    })) || []
  } catch (error) {
    toast.error('Failed to fetch product')
    router.push('/admin/products')
  } finally {
    isLoading.value = false
  }
}

// Fetch categories
async function fetchCategories() {
  try {
    const response = await categoryService.getAll()
    categories.value = response.data
  } catch (error) {
    // Use mock data
    categories.value = [
      { id: 1, name: 'Clothing', slug: 'clothing', description: null, parent_id: null, status: 'active' as const, is_active: true, display_order: 1, product_count: 0, depth: 0, created_at: '', updated_at: '' },
      { id: 2, name: 'Shoes', slug: 'shoes', description: null, parent_id: null, status: 'active' as const, is_active: true, display_order: 2, product_count: 0, depth: 0, created_at: '', updated_at: '' },
      { id: 3, name: 'Accessories', slug: 'accessories', description: null, parent_id: null, status: 'active' as const, is_active: true, display_order: 3, product_count: 0, depth: 0, created_at: '', updated_at: '' },
    ]
  }
}

// Category options
const categoryOptions = computed(() => 
  categories.value.map(c => ({ value: c.id, label: c.name }))
)

// Image upload
function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  
  if (!files) return
  
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload only image files')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImages.value.push({
        id: String(Math.random()),
        url: e.target?.result as string,
        file,
      })
    }
    reader.readAsDataURL(file)
  })
  
  input.value = ''
}

function removeImage(imageId: string) {
  uploadedImages.value = uploadedImages.value.filter(img => img.id !== imageId)
}

// Submit form
const onSubmit = handleSubmit(async (values) => {
  try {
    const productData = {
      ...values,
      meta_title: values.meta_title || values.name,
      meta_description: values.meta_description || values.short_description,
    }
    
    if (isEditMode.value) {
      await productService.update(productId.value!, productData as any)
      toast.success('Product updated successfully')
    } else {
      await productService.create(productData as any)
      toast.success('Product created successfully')
    }
    
    router.push('/admin/products')
  } catch (error) {
    toast.error(isEditMode.value ? 'Failed to update product' : 'Failed to create product')
  }
})
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <form @submit.prevent="onSubmit" class="space-y-6">
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main content -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Basic info -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h3>
            <div class="space-y-4">
              <FormInput
                v-model="name"
                v-bind="nameAttrs"
                label="Product Name"
                name="name"
                :error="errors.name"
                required
              />
              
              <FormInput
                v-model="sku"
                v-bind="skuAttrs"
                label="SKU"
                name="sku"
                :error="errors.sku"
                required
              />
              
              <FormTextarea
                v-model="shortDescription"
                v-bind="shortDescriptionAttrs"
                label="Short Description"
                name="short_description"
                :rows="2"
                :error="errors.short_description"
              />
              
              <FormTextarea
                v-model="description"
                v-bind="descriptionAttrs"
                label="Full Description"
                name="description"
                :rows="5"
                :error="errors.description"
              />
            </div>
          </BaseCard>

          <!-- Images -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Product Images
            </h3>
            <div class="space-y-4">
              <div class="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                <div
                  v-for="image in uploadedImages"
                  :key="image.id"
                  class="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <img
                    :src="image.url"
                    class="h-full w-full object-cover"
                    alt="Product image"
                  />
                  <button
                    type="button"
                    class="absolute right-1 top-1 rounded-full bg-danger-600 p-1 text-white hover:bg-danger-700"
                    @click="removeImage(image.id)"
                  >
                    <XMarkIcon class="h-4 w-4" />
                  </button>
                </div>
                
                <label class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 dark:border-gray-600 dark:hover:border-primary-400">
                  <PhotoIcon class="h-8 w-8 text-gray-400" />
                  <span class="mt-2 text-xs text-gray-500">Add Image</span>
                  <input
                    type="file"
                    class="hidden"
                    accept="image/*"
                    multiple
                    @change="handleImageUpload"
                  />
                </label>
              </div>
            </div>
          </BaseCard>

          <!-- Pricing -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Pricing
            </h3>
            <div class="grid gap-4 sm:grid-cols-3">
              <FormInput
                v-model="price"
                v-bind="priceAttrs"
                label="Price"
                name="price"
                type="number"
                prefix="৳"
                :error="errors.price"
                required
              />
              
              <FormInput
                v-model="salePrice"
                v-bind="salePriceAttrs"
                label="Sale Price"
                name="sale_price"
                type="number"
                prefix="৳"
                :error="errors.sale_price"
              />
              
              <FormInput
                v-model="costPrice"
                v-bind="costPriceAttrs"
                label="Cost per Item"
                name="cost_price"
                type="number"
                prefix="৳"
                :error="errors.cost_price"
              />
            </div>
          </BaseCard>

          <!-- Inventory -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Inventory
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <FormInput
                v-model="stockQuantity"
                v-bind="stockQuantityAttrs"
                label="Stock Quantity"
                name="stock_quantity"
                type="number"
                :error="errors.stock_quantity"
                required
              />
              
              <FormInput
                v-model="lowStockThreshold"
                v-bind="lowStockThresholdAttrs"
                label="Low Stock Alert"
                name="low_stock_threshold"
                type="number"
                :error="errors.low_stock_threshold"
              />
            </div>
          </BaseCard>

          <!-- SEO -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Search Engine Optimization
            </h3>
            <div class="space-y-4">
              <FormInput
                v-model="metaTitle"
                v-bind="metaTitleAttrs"
                label="Meta Title"
                name="meta_title"
                :error="errors.meta_title"
              />
              
              <FormTextarea
                v-model="metaDescription"
                v-bind="metaDescriptionAttrs"
                label="Meta Description"
                name="meta_description"
                :rows="3"
                :error="errors.meta_description"
              />
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Status
            </h3>
            <FormSelect
              v-model="status"
              v-bind="statusAttrs"
              name="status"
              :options="statusOptions"
              :error="errors.status"
            />
          </BaseCard>

          <!-- Category -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Category
            </h3>
            <FormSelect
              v-model="categoryId"
              v-bind="categoryIdAttrs"
              name="category_id"
              :options="categoryOptions"
              :error="errors.category_id"
            />
          </BaseCard>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <BaseButton type="submit" variant="primary" :loading="isSubmitting" block>
              {{ isEditMode ? 'Update Product' : 'Create Product' }}
            </BaseButton>
            <BaseButton type="button" variant="secondary" to="/admin/products" block>
              Cancel
            </BaseButton>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
