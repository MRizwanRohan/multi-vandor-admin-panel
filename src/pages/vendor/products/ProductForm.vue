<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Product Form — Create/edit product page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService, categoryService, attributeTemplateService } from '@/services'
import { useToast } from '@/composables'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import { ProductAttributes, VariantMatrix } from '@/components/domain'
import type { 
  AttributeTemplate, 
  ProductAttributeInput, 
  VariantMatrixAttribute, 
  ProductVariant,
  ProductType 
} from '@/types'
import {
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  CubeIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Check if editing
const productId = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw) return undefined
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})
const isEditing = computed(() => productId.value !== undefined)

// Loading
const isLoading = ref(false)
const isSaving = ref(false)
const isLoadingTemplates = ref(false)

// Categories
const categories = ref<{ value: string; label: string }[]>([])

// Product Type
const productType = ref<ProductType>('simple')

// Attribute Templates (from category)
const categoryTemplates = ref<AttributeTemplate[]>([])
const attributeValues = ref<ProductAttributeInput[]>([])
const attributeErrors = ref<Record<number, string>>({})

// Variants (for variable products)
const variantAttributes = ref<VariantMatrixAttribute[]>([])
const variants = ref<ProductVariant[]>([])

// Images
const images = ref<string[]>([])
const imageInput = ref<HTMLInputElement | null>(null)

// Form schema
const schema = toTypedSchema(
  z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    categoryId: z.string().min(1, 'Please select a category'),
    price: z.number().min(1, 'Price must be greater than 0'),
    compareAtPrice: z.number().optional(),
    sku: z.string().optional(),
    stock: z.number().min(0, 'Stock cannot be negative'),
    weight: z.number().optional(),
    isActive: z.boolean(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  })
)

const { handleSubmit, setValues, values, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    compareAtPrice: undefined,
    sku: '',
    stock: 0,
    weight: undefined,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  },
})

// Set page info
onMounted(async () => {
  const title = isEditing.value ? 'Edit Product' : 'Add Product'
  breadcrumbStore.setPageInfo(title, [
    { label: 'Products', to: '/vendor/products' },
    { label: title },
  ])

  await loadCategories()
  
  if (isEditing.value) {
    await loadProduct()
  }
})

// Load categories
async function loadCategories() {
  try {
    const response = await categoryService.getAll({ per_page: 100 })
    categories.value = response.data.map(cat => ({
      value: String(cat.id),
      label: cat.name,
    }))
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to load categories'
    toast.error(message)
    console.error('Category API Error:', err)
    categories.value = []
  }
}

// Load attribute templates when category changes
watch(
  () => values.categoryId,
  async (categoryId) => {
    if (!categoryId) {
      categoryTemplates.value = []
      attributeValues.value = []
      return
    }
    
    isLoadingTemplates.value = true
    try {
      // Use vendor endpoint to get category templates
      const templates = await attributeTemplateService.getByCategory(categoryId, true)
      categoryTemplates.value = templates
      
      // Reset attribute values when category changes (for new products)
      if (!isEditing.value) {
        attributeValues.value = []
      }
    } catch (err: any) {
      console.error('Failed to load templates:', err)
      categoryTemplates.value = []
    } finally {
      isLoadingTemplates.value = false
    }
  },
  { immediate: false }
)

// Load product for editing
async function loadProduct() {
  if (!productId.value) return
  
  isLoading.value = true
  try {
    const product = await productService.getById(productId.value!) as import('@/types').ProductDetail
    setValues({
      name: product.name,
      description: product.description,
      categoryId: String(product.category?.id ?? ''),
      price: product.price,
      compareAtPrice: product.sale_price ?? undefined,
      sku: product.sku,
      stock: product.stock_quantity,
      weight: product.weight ?? undefined,
      isActive: product.status === 'approved',
      metaTitle: product.meta_title,
      metaDescription: product.meta_description,
    })
    images.value = product.images?.map(img => img.url) || []
    
    // Load product type
    productType.value = product.type || 'simple'
    
    // Load attributes
    if (product.attributes?.length) {
      attributeValues.value = product.attributes.map(attr => ({
        template_id: attr.template_id,
        value: attr.value,
      }))
    }
    
    // Load variants
    if (product.variants?.length) {
      variants.value = product.variants
    }
    
    // Load variant config
    if (product.variant_matrix?.attributes) {
      variantAttributes.value = product.variant_matrix.attributes
    }
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to load product'
    toast.error(message)
    console.error('Product Load API Error:', err)
  } finally {
    isLoading.value = false
  }
}

// Handle image upload
function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  for (const file of Array.from(input.files)) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          images.value.push(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Reset input
  input.value = ''
}

// Remove image
function removeImage(index: number) {
  images.value.splice(index, 1)
}

// Handle variant attributes change (from ProductAttributes component)
function handleVariantAttributesChange(attrs: VariantMatrixAttribute[]) {
  variantAttributes.value = attrs
}

// Generate variant combinations from selected attributes
function generateVariants() {
  if (variantAttributes.value.length === 0) {
    toast.error('প্রথমে ভেরিয়েন্ট অ্যাট্রিবিউট নির্বাচন করুন')
    return
  }

  const generateCombinations = (
    attrs: VariantMatrixAttribute[],
    index: number,
    current: { template: string; template_id: number; value: string; option_id: number }[]
  ): { template: string; template_id: number; value: string; option_id: number }[][] => {
    if (index >= attrs.length) return [current]

    const result: { template: string; template_id: number; value: string; option_id: number }[][] = []
    const attr = attrs[index]

    for (const option of attr.options) {
      result.push(
        ...generateCombinations(attrs, index + 1, [
          ...current,
          {
            template: attr.name,
            template_id: attr.id,
            value: option.label,
            option_id: option.id,
          },
        ])
      )
    }

    return result
  }

  const combinations = generateCombinations(variantAttributes.value, 0, [])

  variants.value = combinations.map((options, i) => ({
    id: 0,
    sku: `${values.sku || 'SKU'}-${options.map((o) => o.value.substring(0, 2).toUpperCase()).join('-')}`,
    name: options.map((o) => o.value).join(' / '),
    price: values.price || 0,
    sale_price: values.compareAtPrice || null,
    effective_price: values.compareAtPrice || values.price || 0,
    stock_quantity: 0,
    is_in_stock: false,
    is_active: true,
    weight: null,
    image_url: null,
    barcode: null,
    options,
  }))

  toast.success(`${variants.value.length}টি ভেরিয়েন্ট তৈরি হয়েছে`)
}

// Validate required attributes
function validateAttributes(): boolean {
  attributeErrors.value = {}
  let isValid = true

  for (const template of categoryTemplates.value) {
    if (template.is_required) {
      const attrValue = attributeValues.value.find((a) => a.template_id === template.id)
      const value = attrValue?.value

      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        attributeErrors.value[template.id] = `${template.name} আবশ্যক`
        isValid = false
      }
    }
  }

  return isValid
}

// Submit form
const onSubmit = handleSubmit(async (formValues) => {
  // Validate attributes
  if (!validateAttributes()) {
    toast.error('সব আবশ্যক অ্যাট্রিবিউট পূরণ করুন')
    return
  }

  // For variable products, check if variants exist
  if (productType.value === 'variable' && variants.value.length === 0) {
    toast.error('ভেরিয়েবল প্রোডাক্টের জন্য ভেরিয়েন্ট তৈরি করুন')
    return
  }

  isSaving.value = true
  try {
    const data = {
      name: formValues.name,
      description: formValues.description,
      category_id: Number(formValues.categoryId),
      type: productType.value,
      base_price: formValues.price,
      sale_price: formValues.compareAtPrice,
      sku: formValues.sku || '',
      stock_quantity: formValues.stock,
      weight: formValues.weight,
      meta_title: formValues.metaTitle,
      meta_description: formValues.metaDescription,
      status: (formValues.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
      attributes: attributeValues.value,
      variants: productType.value === 'variable' 
        ? variants.value.map(v => ({
            sku: v.sku,
            price: v.price,
            sale_price: v.sale_price,
            stock_quantity: v.stock_quantity,
            is_active: v.is_active,
            weight: v.weight,
            barcode: v.barcode,
            options: v.options.map(o => ({ option_id: o.option_id })),
          }))
        : undefined,
    }

    if (isEditing.value) {
      await productService.update(productId.value!, data)
      toast.success('Product updated successfully')
    } else {
      await productService.create(data as import('@/services/product.service').ProductFormData)
      toast.success('Product created successfully')
    }
    
    router.push('/vendor/products')
  } catch (error) {
    toast.error(isEditing.value ? 'Failed to update product' : 'Failed to create product')
  } finally {
    isSaving.value = false
  }
})

// Cancel
function cancel() {
  router.back()
}
</script>

<template>
  <PageLoader v-if="isLoading" />
  <form v-else class="space-y-6" @submit.prevent="onSubmit">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <BaseButton variant="ghost" @click="cancel">
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Back
      </BaseButton>
      <div class="flex gap-3">
        <BaseButton type="button" variant="secondary" @click="cancel">
          Cancel
        </BaseButton>
        <BaseButton type="submit" variant="primary" :loading="isSaving">
          {{ isEditing ? 'Save Changes' : 'Create Product' }}
        </BaseButton>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main content -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Basic info -->
        <BaseCard title="Basic Information">
          <div class="space-y-4">
            <FormInput
              v-model="values.name"
              label="Product Name"
              name="name"
              placeholder="Enter product name"
              required
            />

            <FormTextarea
              v-model="values.description"
              label="Description"
              name="description"
              placeholder="Describe your product"
              :rows="5"
              required
            />

            <FormSelect
              v-model="values.categoryId"
              label="Category"
              name="categoryId"
              :options="categories"
              placeholder="Select category"
              required
            />

            <!-- Product Type -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Type <span class="text-danger-500">*</span>
              </label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  :class="[
                    'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                    productType === 'simple'
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                  ]"
                  @click="productType = 'simple'"
                >
                  <CubeIcon
                    :class="[
                      'h-8 w-8',
                      productType === 'simple' ? 'text-primary-600' : 'text-gray-400',
                    ]"
                  />
                  <div>
                    <p
                      :class="[
                        'font-medium',
                        productType === 'simple'
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-900 dark:text-white',
                      ]"
                    >
                      Simple Product
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      সিঙ্গল আইটেম, কোনো ভেরিয়েশন নেই
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  :class="[
                    'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                    productType === 'variable'
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                  ]"
                  @click="productType = 'variable'"
                >
                  <Squares2X2Icon
                    :class="[
                      'h-8 w-8',
                      productType === 'variable' ? 'text-primary-600' : 'text-gray-400',
                    ]"
                  />
                  <div>
                    <p
                      :class="[
                        'font-medium',
                        productType === 'variable'
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-900 dark:text-white',
                      ]"
                    >
                      Variable Product
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      সাইজ, কালার ইত্যাদি ভেরিয়েশন সহ
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Attributes (from category templates) -->
        <BaseCard
          v-if="values.categoryId && categoryTemplates.length > 0"
          title="Product Attributes"
        >
          <template #header-actions>
            <span
              v-if="isLoadingTemplates"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              Loading...
            </span>
          </template>
          
          <ProductAttributes
            v-model="attributeValues"
            :templates="categoryTemplates"
            :product-type="productType"
            :errors="attributeErrors"
            :non-variant-only="productType === 'variable'"
            @variant-attributes="handleVariantAttributesChange"
          />
        </BaseCard>

        <!-- Variant Configuration (for variable products) -->
        <BaseCard
          v-if="productType === 'variable' && values.categoryId"
          title="Variant Configuration"
        >
          <div class="space-y-4">
            <!-- Variant-defining attributes selection -->
            <div v-if="categoryTemplates.filter(t => t.is_variant_defining).length > 0">
              <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
                ভেরিয়েন্ট তৈরির জন্য অ্যাট্রিবিউট অপশন নির্বাচন করুন
              </p>
              
              <ProductAttributes
                v-model="attributeValues"
                :templates="categoryTemplates"
                :product-type="productType"
                :errors="attributeErrors"
                variant-only
                @variant-attributes="handleVariantAttributesChange"
              />

              <BaseButton
                v-if="variantAttributes.length > 0"
                variant="primary"
                class="mt-4"
                @click="generateVariants"
              >
                ভেরিয়েন্ট তৈরি করুন
              </BaseButton>
            </div>
            <div
              v-else
              class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                এই ক্যাটাগরিতে কোনো ভেরিয়েন্ট-নির্ধারণকারী অ্যাট্রিবিউট নেই।
                <br />
                অ্যাডমিনকে অনুরোধ করুন ক্যাটাগরিতে Color, Size এর মতো অ্যাট্রিবিউট যোগ করতে।
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Variant Matrix (for variable products with generated variants) -->
        <BaseCard
          v-if="productType === 'variable' && variants.length > 0"
          title="Product Variants"
        >
          <VariantMatrix
            :attributes="variantAttributes"
            :variants="variants"
            @update:variants="variants = $event"
            @generate="generateVariants"
          />
        </BaseCard>

        <!-- Images -->
        <BaseCard title="Product Images">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <!-- Existing images -->
              <div
                v-for="(image, index) in images"
                :key="index"
                class="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <img
                  :src="image"
                  :alt="`Product image ${index + 1}`"
                  class="h-full w-full object-cover"
                />
                <button
                  type="button"
                  class="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  @click="removeImage(index)"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </div>

              <!-- Upload button -->
              <button
                type="button"
                class="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-primary-500 hover:text-primary-500 dark:border-gray-600 dark:hover:border-primary-400"
                @click="imageInput?.click()"
              >
                <div class="text-center">
                  <PhotoIcon class="mx-auto h-8 w-8" />
                  <span class="mt-1 block text-sm">Add Image</span>
                </div>
              </button>
            </div>

            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleImageUpload"
            />

            <p class="text-sm text-gray-500 dark:text-gray-400">
              You can upload up to 10 images. First image will be the main product image.
            </p>
          </div>
        </BaseCard>

        <!-- Pricing -->
        <BaseCard title="Pricing">
          <div class="grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model.number="values.price"
              :label="productType === 'variable' ? 'Base Price (৳)' : 'Price (৳)'"
              name="price"
              type="number"
              :min="0"
              required
            />

            <FormInput
              v-model.number="values.compareAtPrice"
              :label="productType === 'variable' ? 'Base Sale Price (৳)' : 'Compare at Price (৳)'"
              name="compareAtPrice"
              type="number"
              :min="0"
              :hint="productType === 'variable' ? 'Default for new variants' : 'Original price before discount'"
            />
          </div>
          <p
            v-if="productType === 'variable'"
            class="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            💡 প্রতিটি ভেরিয়েন্টের জন্য আলাদা দাম সেট করতে পারবেন
          </p>
        </BaseCard>

        <!-- Inventory (only for simple products) -->
        <BaseCard v-if="productType === 'simple'" title="Inventory">
          <div class="grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="values.sku"
              label="SKU"
              name="sku"
              placeholder="Stock Keeping Unit"
            />

            <FormInput
              v-model.number="values.stock"
              label="Stock Quantity"
              name="stock"
              type="number"
              :min="0"
              required
            />
          </div>

          <div class="mt-4">
            <FormInput
              v-model.number="values.weight"
              label="Weight (kg)"
              name="weight"
              type="number"
              :min="0"
              :step="0.01"
            />
          </div>
        </BaseCard>

        <!-- SEO -->
        <BaseCard title="SEO (Search Engine Optimization)">
          <div class="space-y-4">
            <FormInput
              v-model="values.metaTitle"
              label="Meta Title"
              name="metaTitle"
              placeholder="SEO title"
            />

            <FormTextarea
              v-model="values.metaDescription"
              label="Meta Description"
              name="metaDescription"
              placeholder="SEO description"
              :rows="3"
            />
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status -->
        <BaseCard title="Status">
          <FormSwitch
            v-model="values.isActive"
            name="isActive"
            label="Product Active"
            description="Product will be visible to customers"
          />
        </BaseCard>

        <!-- Quick tips -->
        <BaseCard title="Tips">
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li class="flex items-start gap-2">
              <span class="text-primary-500">•</span>
              Use clear, descriptive product names
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary-500">•</span>
              Add high-quality images from multiple angles
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary-500">•</span>
              Write detailed descriptions with key features
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary-500">•</span>
              Set competitive prices
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary-500">•</span>
              Keep stock quantities updated
            </li>
          </ul>
        </BaseCard>
      </div>
    </div>
  </form>
</template>
