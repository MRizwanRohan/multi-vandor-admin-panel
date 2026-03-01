<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Product Form — Create/edit product page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService, categoryService } from '@/services'
import { vendorTemplateService } from '@/services/attribute-template.service'
import { useToast, useDragDrop } from '@/composables'
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
  Bars3Icon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Check if editing
const productSlug = computed(() => route.params.id as string | undefined)
const isEditing = computed(() => !!productSlug.value)

// Loading
const isLoading = ref(false)
const isSaving = ref(false)
const isLoadingTemplates = ref(false)

// Categories
const categories = ref<{ value: string; label: string }[]>([])
const categorySlugMap = ref<Record<string, string>>({}) // id → slug

// Product Type
const productType = ref<ProductType>('simple')

// Attribute Templates (from category)
const categoryTemplates = ref<AttributeTemplate[]>([])
const attributeValues = ref<ProductAttributeInput[]>([])
const attributeErrors = ref<Record<number, string>>({})

// Non-variant templates (shown in Product Attributes card for simple, or non-variant attrs for variable)
const nonVariantTemplates = computed(() =>
  productType.value === 'variable'
    ? categoryTemplates.value.filter(t => !t.is_variant_defining && !(t as any).isVariantDefining)
    : categoryTemplates.value
)
// Variants (for variable products)
const variantAttributes = ref<VariantMatrixAttribute[]>([])
const variants = ref<ProductVariant[]>([])

// Images
const images = ref<string[]>([])
const imageInput = ref<HTMLInputElement | null>(null)
const variantImageInput = ref<HTMLInputElement | null>(null)
const currentVariantIndex = ref<number | null>(null)

// Drag-and-drop image reorder
const { state: dragState, handlers: dragHandlers, dragClasses, isDraggingIndex, isDropTarget } = useDragDrop(images, {
  onReorder: (newItems) => {
    images.value = newItems
  },
})

// Form schema
const schema = toTypedSchema(
  z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    short_description: z.string().optional(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    categoryId: z.string().min(1, 'Please select a category'),
    brand_id: z.number().optional().nullable(),
    price: z.number().min(1, 'Price must be greater than 0'),
    cost_price: z.number().optional().nullable(),
    sale_price: z.number().optional().nullable(),
    sale_start_date: z.string().optional().nullable(),
    sale_end_date: z.string().optional().nullable(),
    sku: z.string().optional(),
    stock: z.number().min(0, 'Stock cannot be negative'),
    low_stock_threshold: z.number().optional().nullable(),
    weight: z.number().optional(),
    dimensionLength: z.number().optional().nullable(),
    dimensionWidth: z.number().optional().nullable(),
    dimensionHeight: z.number().optional().nullable(),
    visibility: z.enum(['visible', 'hidden', 'catalog_only']),
    isActive: z.boolean(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  })
)

const { handleSubmit, setValues, values, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    short_description: '',
    description: '',
    categoryId: '',
    brand_id: null as number | null,
    price: 0,
    cost_price: null as number | null,
    sale_price: null as number | null,
    sale_start_date: null as string | null,
    sale_end_date: null as string | null,
    sku: '',
    stock: 0,
    low_stock_threshold: null as number | null,
    weight: undefined as number | undefined,
    dimensionLength: null as number | null,
    dimensionWidth: null as number | null,
    dimensionHeight: null as number | null,
    visibility: 'visible' as 'visible' | 'hidden' | 'catalog_only',
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
    // Use vendor endpoint - getAll uses admin endpoint
    const response = await categoryService.getVisibleCategories()
    categories.value = response.data.map(cat => ({
      value: String(cat.id),
      label: cat.name,
    }))
    // Build id → slug map for template loading
    const slugMap: Record<string, string> = {}
    response.data.forEach(cat => {
      slugMap[String(cat.id)] = cat.slug
    })
    categorySlugMap.value = slugMap
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
      // Look up category slug from id (endpoint requires slug, not numeric id)
      const slug = categorySlugMap.value[categoryId]
      if (!slug) {
        console.error('Category slug not found for id:', categoryId)
        categoryTemplates.value = []
        return
      }
      // Use vendor endpoint to get category templates
      const templates = await vendorTemplateService.getCategoryTemplates(slug)
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
  if (!productSlug.value) return
  
  isLoading.value = true
  try {
    const product = await productService.vendorShow(productSlug.value) as import('@/types').ProductDetail
    setValues({
      name: product.name,
      short_description: product.short_description || '',
      description: product.description,
      categoryId: String(product.category?.id ?? ''),
      brand_id: product.brand_id ?? null,
      price: product.price,
      cost_price: product.cost_price ?? null,
      sale_price: product.sale_price ?? null,
      sale_start_date: product.sale_start_date ?? null,
      sale_end_date: product.sale_end_date ?? null,
      sku: product.sku,
      stock: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold ?? null,
      weight: product.weight ?? undefined,
      dimensionLength: product.dimensions?.length ?? null,
      dimensionWidth: product.dimensions?.width ?? null,
      dimensionHeight: product.dimensions?.height ?? null,
      visibility: product.visibility || 'visible',
      isActive: product.is_active,
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

// Handle variant image upload
function handleVariantImageClick(variantIndex: number) {
  currentVariantIndex.value = variantIndex
  variantImageInput.value?.click()
}

function handleVariantImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || currentVariantIndex.value === null) return

  const file = input.files[0]
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && currentVariantIndex.value !== null) {
        updateVariant(currentVariantIndex.value, 'image_url', e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  // Reset
  input.value = ''
  currentVariantIndex.value = null
}

// Update variant field
function updateVariant(index: number, field: keyof ProductVariant, value: unknown) {
  const updated = [...variants.value]
  updated[index] = { ...updated[index], [field]: value }
  variants.value = updated
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
    sale_start_date: null,
    sale_end_date: null,
    is_sale_active: false,
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
let saveAsDraft = false

function submitAsDraft() {
  saveAsDraft = true
  onSubmit()
}

function submitAndPublish() {
  saveAsDraft = false
  onSubmit()
}

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
    const data: Record<string, any> = {
      name: formValues.name,
      short_description: formValues.short_description || undefined,
      description: formValues.description,
      category_id: Number(formValues.categoryId),
      type: productType.value,
      price: formValues.price,
      cost_price: formValues.cost_price || undefined,
      sale_price: formValues.sale_price || undefined,
      sale_start_date: formValues.sale_start_date || undefined,
      sale_end_date: formValues.sale_end_date || undefined,
      sku: formValues.sku || '',
      stock_quantity: formValues.stock,
      low_stock_threshold: formValues.low_stock_threshold || undefined,
      weight: formValues.weight,
      dimensions: (formValues.dimensionLength || formValues.dimensionWidth || formValues.dimensionHeight)
        ? {
            length: formValues.dimensionLength || 0,
            width: formValues.dimensionWidth || 0,
            height: formValues.dimensionHeight || 0,
          }
        : undefined,
      visibility: formValues.visibility,
      is_active: formValues.isActive,
      brand_id: formValues.brand_id || undefined,
      meta_title: formValues.metaTitle,
      meta_description: formValues.metaDescription,
      attribute_values: attributeValues.value.length > 0 ? attributeValues.value : undefined,
      variants: productType.value === 'variable' 
        ? variants.value.map(v => ({
            sku: v.sku,
            price: v.price,
            sale_price: v.sale_price,
            sale_start_date: v.sale_start_date || undefined,
            sale_end_date: v.sale_end_date || undefined,
            stock_quantity: v.stock_quantity,
            is_active: v.is_active,
            weight: v.weight,
            barcode: v.barcode,
            option_ids: v.options?.map(o => o.option_id),
          }))
        : undefined,
      variant_config: productType.value === 'variable' && variantAttributes.value.length > 0
        ? variantAttributes.value.map(attr => ({
            template_id: attr.id,
            option_ids: attr.options.map(o => o.id),
          }))
        : undefined,
    }

    // Remove draft status handling - use save_as_draft flag
    if (saveAsDraft) {
      data.status = 'draft'
    }

    if (isEditing.value) {
      await productService.vendorUpdate(productSlug.value!, data)
      toast.success('Product updated successfully')
    } else {
      await productService.vendorCreate(data as import('@/services/product.service').ProductFormData)
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
        <BaseButton type="button" variant="secondary" :loading="isSaving" @click="submitAsDraft">
          Save as Draft
        </BaseButton>
        <BaseButton type="button" variant="primary" :loading="isSaving" @click="submitAndPublish">
          {{ isEditing ? 'Save Changes' : 'Save & Submit' }}
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
              v-model="values.short_description"
              label="Short Description"
              name="short_description"
              placeholder="Brief product summary (shown in product cards)"
              :rows="2"
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
          v-if="values.categoryId && nonVariantTemplates.length > 0"
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
            @upload-image="handleVariantImageClick"
          />
        </BaseCard>

        <!-- Hidden variant image input -->
        <input
          ref="variantImageInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleVariantImageUpload"
        />

        <!-- Images (Drag & Drop Reorder) -->
        <BaseCard title="Product Images">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <!-- Draggable images -->
              <div
                v-for="(image, index) in images"
                :key="`img-${index}`"
                draggable="true"
                v-bind="dragHandlers(index)"
                :class="[
                  'group relative aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing',
                  isDraggingIndex(index)
                    ? 'border-primary-500 opacity-50 scale-95'
                    : isDropTarget(index)
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 scale-105'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                ]"
              >
                <img
                  :src="image"
                  :alt="`Product image ${index + 1}`"
                  class="h-full w-full object-cover pointer-events-none"
                  loading="lazy"
                />
                <!-- Drag handle indicator -->
                <div class="absolute left-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bars3Icon class="h-4 w-4" />
                </div>
                <!-- Primary badge -->
                <div v-if="index === 0" class="absolute left-1 bottom-1 rounded bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Primary
                </div>
                <!-- Remove button -->
                <button
                  type="button"
                  class="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click.stop="removeImage(index)"
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
              Drag images to reorder. First image is the main product image. Max 10 images.
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
              v-model.number="values.cost_price"
              label="Cost Price (৳)"
              name="cost_price"
              type="number"
              :min="0"
              hint="For profit calculation only, not shown to customers"
            />

            <FormInput
              v-model.number="values.sale_price"
              :label="productType === 'variable' ? 'Base Sale Price (৳)' : 'Sale Price (৳)'"
              name="sale_price"
              type="number"
              :min="0"
              :hint="productType === 'variable' ? 'Default for new variants' : 'Discounted price'"
            />
          </div>

          <!-- Sale Date Range -->
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="values.sale_start_date"
              label="Sale Start Date"
              name="sale_start_date"
              type="datetime-local"
              hint="When the sale price becomes active"
            />
            <FormInput
              v-model="values.sale_end_date"
              label="Sale End Date"
              name="sale_end_date"
              type="datetime-local"
              hint="When the sale price expires"
            />
          </div>

          <p
            v-if="productType === 'variable'"
            class="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            Each variant can have its own price and sale dates
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

            <FormInput
              v-model.number="values.low_stock_threshold"
              label="Low Stock Threshold"
              name="low_stock_threshold"
              type="number"
              :min="0"
              hint="Alert when stock falls below this level"
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

          <!-- Dimensions -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dimensions (cm)</label>
            <div class="grid grid-cols-3 gap-3">
              <FormInput
                v-model.number="values.dimensionLength"
                label="Length"
                name="dimensionLength"
                type="number"
                :min="0"
                :step="0.1"
                placeholder="L"
              />
              <FormInput
                v-model.number="values.dimensionWidth"
                label="Width"
                name="dimensionWidth"
                type="number"
                :min="0"
                :step="0.1"
                placeholder="W"
              />
              <FormInput
                v-model.number="values.dimensionHeight"
                label="Height"
                name="dimensionHeight"
                type="number"
                :min="0"
                :step="0.1"
                placeholder="H"
              />
            </div>
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

        <!-- Visibility -->
        <BaseCard title="Visibility">
          <FormSelect
            v-model="values.visibility"
            name="visibility"
            label="Visibility"
            :options="[
              { value: 'visible', label: 'Visible (Search & Catalog)' },
              { value: 'catalog_only', label: 'Catalog Only' },
              { value: 'hidden', label: 'Hidden' },
            ]"
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
