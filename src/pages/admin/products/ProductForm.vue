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
import { useToast, useDragDrop } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { ProductDetail, Category, ProductType } from '@/types'
import { PhotoIcon, XMarkIcon, CubeIcon, Squares2X2Icon, Bars3Icon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Mode detection
const productSlug = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw || raw === 'create') return undefined
  return raw
})
const isEditMode = computed(() => !!productSlug.value)
const pageTitle = computed(() => isEditMode.value ? 'Edit Product' : 'Add Product')

// Product type
const productType = ref<ProductType>('simple')

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

// Drag-and-drop image reorder
const { state: dragState, handlers: dragHandlers, isDraggingIndex, isDropTarget } = useDragDrop(uploadedImages, {
  onReorder: (newItems) => {
    uploadedImages.value = newItems
  },
})

// Form validation
const productSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  cost_price: z.coerce.number().min(0).optional().nullable(),
  sale_start_date: z.string().optional().nullable(),
  sale_end_date: z.string().optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0, 'Stock must be a positive integer'),
  low_stock_threshold: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional().nullable(),
  dimension_length: z.coerce.number().min(0).optional().nullable(),
  dimension_width: z.coerce.number().min(0).optional().nullable(),
  dimension_height: z.coerce.number().min(0).optional().nullable(),
  visibility: z.enum(['visible', 'hidden', 'catalog_only']).default('visible'),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
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
    sale_start_date: null as string | null,
    sale_end_date: null as string | null,
    stock_quantity: 0,
    low_stock_threshold: 10,
    weight: null as number | null,
    dimension_length: null as number | null,
    dimension_width: null as number | null,
    dimension_height: null as number | null,
    visibility: 'visible' as const,
    is_active: true,
    is_featured: false,
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
const [saleStartDate, saleStartDateAttrs] = defineField('sale_start_date')
const [saleEndDate, saleEndDateAttrs] = defineField('sale_end_date')
const [weight, weightAttrs] = defineField('weight')
const [dimensionLength, dimensionLengthAttrs] = defineField('dimension_length')
const [dimensionWidth, dimensionWidthAttrs] = defineField('dimension_width')
const [dimensionHeight, dimensionHeightAttrs] = defineField('dimension_height')
const [visibility, visibilityAttrs] = defineField('visibility')
const [isActive, isActiveAttrs] = defineField('is_active')
const [isFeatured, isFeaturedAttrs] = defineField('is_featured')

// Visibility options
const visibilityOptions = [
  { value: 'visible', label: 'Visible (Search & Catalog)' },
  { value: 'catalog_only', label: 'Catalog Only' },
  { value: 'hidden', label: 'Hidden' },
]

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
  if (!productSlug.value) return
  
  isLoading.value = true
  try {
    const product = await productService.adminShow(productSlug.value) as ProductDetail
    setValues({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price,
      sale_price: product.sale_price,
      cost_price: product.cost_price,
      sale_start_date: product.sale_start_date || null,
      sale_end_date: product.sale_end_date || null,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 10,
      weight: product.weight || null,
      dimension_length: product.dimensions?.length ?? null,
      dimension_width: product.dimensions?.width ?? null,
      dimension_height: product.dimensions?.height ?? null,
      visibility: product.visibility || 'visible',
      is_active: product.is_active,
      is_featured: product.is_featured,
      status: product.status,
      category_id: product.category?.id,
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
    })
    productType.value = product.type || 'simple'
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
    toast.error('Failed to load categories')
    categories.value = []
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
      type: productType.value,
      dimensions: (values.dimension_length || values.dimension_width || values.dimension_height)
        ? {
            length: values.dimension_length || 0,
            width: values.dimension_width || 0,
            height: values.dimension_height || 0,
          }
        : undefined,
      meta_title: values.meta_title || values.name,
      meta_description: values.meta_description || values.short_description,
    }
    // Clean up dimension fields from payload
    delete (productData as any).dimension_length
    delete (productData as any).dimension_width
    delete (productData as any).dimension_height
    
    if (isEditMode.value) {
      await productService.adminUpdate(productSlug.value!, productData as any)
      toast.success('Product updated successfully')
    } else {
      await productService.adminUpdate('', productData as any)
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
              Product Type
            </h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <button
                type="button"
                :class="[
                  'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                  productType === 'simple'
                    ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
                ]"
                @click="productType = 'simple'"
              >
                <CubeIcon :class="['h-8 w-8', productType === 'simple' ? 'text-primary-600' : 'text-gray-400']" />
                <div>
                  <p :class="['font-medium', productType === 'simple' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white']">Simple</p>
                  <p class="text-sm text-gray-500">Single item, no variations</p>
                </div>
              </button>
              <button
                type="button"
                :class="[
                  'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                  productType === 'variable'
                    ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
                ]"
                @click="productType = 'variable'"
              >
                <Squares2X2Icon :class="['h-8 w-8', productType === 'variable' ? 'text-primary-600' : 'text-gray-400']" />
                <div>
                  <p :class="['font-medium', productType === 'variable' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white']">Variable</p>
                  <p class="text-sm text-gray-500">Size, color variations</p>
                </div>
              </button>
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
                  draggable="true"
                  v-bind="dragHandlers(uploadedImages.indexOf(image))"
                  :class="[
                    'group relative aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing',
                    isDraggingIndex(uploadedImages.indexOf(image))
                      ? 'border-primary-500 opacity-50 scale-95'
                      : isDropTarget(uploadedImages.indexOf(image))
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                  ]"
                >
                  <img
                    :src="image.url"
                    class="h-full w-full object-cover pointer-events-none"
                    alt="Product image"
                    loading="lazy"
                  />
                  <!-- Drag handle -->
                  <div class="absolute left-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Bars3Icon class="h-4 w-4" />
                  </div>
                  <!-- Primary badge -->
                  <div v-if="uploadedImages.indexOf(image) === 0" class="absolute left-1 bottom-1 rounded bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Primary
                  </div>
                  <button
                    type="button"
                    class="absolute right-1 top-1 rounded-full bg-danger-600 p-1 text-white hover:bg-danger-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="removeImage(image.id)"
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
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Drag images to reorder. First image is the primary product image.
              </p>
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
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <FormInput
                v-model="saleStartDate"
                v-bind="saleStartDateAttrs"
                label="Sale Start Date"
                name="sale_start_date"
                type="datetime-local"
              />
              <FormInput
                v-model="saleEndDate"
                v-bind="saleEndDateAttrs"
                label="Sale End Date"
                name="sale_end_date"
                type="datetime-local"
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
            <div class="mt-4">
              <FormInput
                v-model="weight"
                v-bind="weightAttrs"
                label="Weight (kg)"
                name="weight"
                type="number"
                :step="0.01"
              />
            </div>
            <!-- Dimensions -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dimensions (cm)</label>
              <div class="grid grid-cols-3 gap-3">
                <FormInput
                  v-model="dimensionLength"
                  v-bind="dimensionLengthAttrs"
                  label="Length"
                  name="dimension_length"
                  type="number"
                  :min="0"
                  :step="0.1"
                  placeholder="L"
                />
                <FormInput
                  v-model="dimensionWidth"
                  v-bind="dimensionWidthAttrs"
                  label="Width"
                  name="dimension_width"
                  type="number"
                  :min="0"
                  :step="0.1"
                  placeholder="W"
                />
                <FormInput
                  v-model="dimensionHeight"
                  v-bind="dimensionHeightAttrs"
                  label="Height"
                  name="dimension_height"
                  type="number"
                  :min="0"
                  :step="0.1"
                  placeholder="H"
                />
              </div>
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
            <div class="mt-4 space-y-3">
              <FormSwitch
                v-model="isActive"
                v-bind="isActiveAttrs"
                name="is_active"
                label="Active"
                description="Product is visible to customers"
              />
              <FormSwitch
                v-model="isFeatured"
                v-bind="isFeaturedAttrs"
                name="is_featured"
                label="Featured"
                description="Show in featured products"
              />
            </div>
          </BaseCard>

          <!-- Visibility -->
          <BaseCard>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Visibility
            </h3>
            <FormSelect
              v-model="visibility"
              v-bind="visibilityAttrs"
              name="visibility"
              :options="visibilityOptions"
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
