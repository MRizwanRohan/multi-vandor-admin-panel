<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Product Form — Create/edit product page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService, categoryService } from '@/services'
import { vendorTemplateService } from '@/services/attribute-template.service'
import { useToast, useDragDrop, useConfirm } from '@/composables'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import RichTextEditor from '@/components/form/RichTextEditor.vue'
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
  EyeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()

// Form dirty tracking
const formTouched = ref(false)
const isSavedSuccessfully = ref(false)

// Check if editing
const productSlug = computed(() => route.params.id as string | undefined)
const isEditing = computed(() => !!productSlug.value)

// Loading
const isLoading = ref(false)
const isSaving = ref(false)
const isLoadingTemplates = ref(false)
const showPreviewModal = ref(false)

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
    publish_at: z.string().optional().nullable(),
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
    publish_at: null as string | null,
    metaTitle: '',
    metaDescription: '',
  },
})

// ══════════════════════════════════════════════════════════════════════
// SEO Character Counters
// ══════════════════════════════════════════════════════════════════════
const META_TITLE_MAX = 60
const META_DESC_MAX = 160

const metaTitleLength = computed(() => (values.metaTitle || '').length)
const metaDescLength = computed(() => (values.metaDescription || '').length)
const metaTitleRemaining = computed(() => META_TITLE_MAX - metaTitleLength.value)
const metaDescRemaining = computed(() => META_DESC_MAX - metaDescLength.value)

// ══════════════════════════════════════════════════════════════════════
// Profit Margin Calculator
// ══════════════════════════════════════════════════════════════════════
const profitMargin = computed(() => {
  const costPrice = values.cost_price || 0
  const sellPrice = values.sale_price || values.price || 0
  
  if (costPrice <= 0 || sellPrice <= 0) return null
  
  const profit = sellPrice - costPrice
  const margin = (profit / sellPrice) * 100
  
  return {
    profit: profit,
    margin: margin.toFixed(1),
    isGood: margin >= 20,
    isWarning: margin >= 10 && margin < 20,
    isDanger: margin < 10,
  }
})

// ══════════════════════════════════════════════════════════════════════
// Auto-generate SKU from product name
// ══════════════════════════════════════════════════════════════════════
const suggestedSku = computed(() => {
  const name = values.name || ''
  if (name.length < 3) return ''
  
  // Generate SKU: First 3 letters of each word (max 3 words) + random number
  const words = name.trim().toUpperCase().split(/\s+/).slice(0, 3)
  const prefix = words.map(w => w.substring(0, 3)).join('-')
  const suffix = String(Date.now()).slice(-4)
  
  return `${prefix}-${suffix}`
})

const applySuggestedSku = () => {
  if (suggestedSku.value) {
    values.sku = suggestedSku.value
    toast.success('SKU applied')
  }
}

// ══════════════════════════════════════════════════════════════════════
// Form Progress Indicator
// ══════════════════════════════════════════════════════════════════════
const formProgress = computed(() => {
  const fields = [
    { filled: !!values.name && values.name.length >= 3, weight: 15 },
    { filled: !!values.description && values.description.length >= 10, weight: 15 },
    { filled: !!values.categoryId, weight: 15 },
    { filled: values.price > 0, weight: 15 },
    { filled: images.value.length > 0, weight: 15 },
    { filled: !!values.sku, weight: 5 },
    { filled: values.stock > 0 || productType.value === 'variable', weight: 10 },
    { filled: !!values.metaTitle, weight: 5 },
    { filled: !!values.metaDescription, weight: 5 },
  ]
  
  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0)
  const filledWeight = fields.filter(f => f.filled).reduce((sum, f) => sum + f.weight, 0)
  
  return Math.round((filledWeight / totalWeight) * 100)
})

// ══════════════════════════════════════════════════════════════════════
// Price Range Calculation (for variable products)
// ══════════════════════════════════════════════════════════════════════
const previewPriceRange = computed(() => {
  if (productType.value !== 'variable' || variants.value.length === 0) {
    return null
  }
  
  const prices = variants.value
    .filter(v => v.is_active)
    .map(v => {
      // Calculate effective price for each variant
      const basePrice = v.price || values.price || 0
      const salePrice = v.sale_price
      // If sale_price exists and is less than price
      if (salePrice && salePrice < basePrice) {
        return salePrice
      }
      return basePrice
    })
  
  if (prices.length === 0) return null
  
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  
  return {
    min,
    max,
    isSame: Math.abs(min - max) < 0.01,
    display: min === max 
      ? `৳${min.toLocaleString('en-BD')}`
      : `৳${min.toLocaleString('en-BD')} – ৳${max.toLocaleString('en-BD')}`
  }
})

// ══════════════════════════════════════════════════════════════════════
// Unsaved Changes Warning
// ══════════════════════════════════════════════════════════════════════
watch(values, () => {
  if (!isSavedSuccessfully.value) {
    formTouched.value = true
  }
}, { deep: true })

// Browser close/refresh warning
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (formTouched.value && !isSavedSuccessfully.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Vue Router guard for unsaved changes
onBeforeRouteLeave(async (to, from) => {
  if (formTouched.value && !isSavedSuccessfully.value) {
    const confirmed = await confirm.warning({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      confirmText: 'Leave',
      cancelText: 'Stay',
    })
    if (!confirmed) return false
  }
  return true
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
  } else {
    // Check for duplicate product data
    loadDuplicateData()
  }
  
  // Reset form touched after initial load
  setTimeout(() => {
    formTouched.value = false
  }, 100)
})

// Load duplicate product data from sessionStorage
function loadDuplicateData() {
  const storedData = sessionStorage.getItem('duplicateProduct')
  if (!storedData) return
  
  try {
    const data = JSON.parse(storedData)
    
    // Set form values
    setValues(data.formValues)
    
    // Set product type
    productType.value = data.productType || 'simple'
    
    // Set images
    images.value = data.images || []
    
    // Set attributes (after templates load via watch)
    if (data.attributeValues?.length > 0) {
      setTimeout(() => {
        attributeValues.value = data.attributeValues
      }, 500)
    }
    
    // Set variants
    if (data.productType === 'variable') {
      variantAttributes.value = data.variantAttributes || []
      variants.value = data.variants || []
    }
    
    toast.success('Product duplicated! Update the details and save.')
    
    // Clear stored data
    sessionStorage.removeItem('duplicateProduct')
  } catch (e) {
    console.error('Failed to load duplicate data:', e)
    sessionStorage.removeItem('duplicateProduct')
  }
}

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

// Duplicate product function
function duplicateProduct() {
  // Store current form data in sessionStorage
  const duplicateData = {
    ...values,
    name: `${values.name} - Copy`,
    sku: values.sku ? `${values.sku}-COPY` : '',
    isActive: false, // Start as draft
    publish_at: null,
  }
  
  // Store product type, images, attributes, and variants
  const fullState = {
    formValues: duplicateData,
    productType: productType.value,
    images: images.value,
    attributeValues: attributeValues.value,
    variantAttributes: variantAttributes.value,
    variants: variants.value.map(v => ({
      ...v,
      sku: v.sku ? `${v.sku}-COPY` : '',
    })),
  }
  
  sessionStorage.setItem('duplicateProduct', JSON.stringify(fullState))
  
  toast.info('Product data copied. You are now creating a new product.')
  isSavedSuccessfully.value = true // Prevent unsaved warning
  router.push({ name: 'vendor-products-new' })
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
    
    isSavedSuccessfully.value = true
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
    <!-- Sticky Header with Progress -->
    <div class="sticky top-0 z-20 -mx-6 -mt-6 mb-6 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <BaseButton variant="ghost" size="sm" @click="cancel">
            <ArrowLeftIcon class="mr-2 h-4 w-4" />
            Back
          </BaseButton>
          
          <!-- Progress Indicator -->
          <div class="hidden items-center gap-2 md:flex">
            <div class="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div 
                class="h-full rounded-full transition-all duration-300"
                :class="[
                  formProgress >= 80 ? 'bg-success-500' :
                  formProgress >= 50 ? 'bg-primary-500' :
                  formProgress >= 25 ? 'bg-warning-500' : 'bg-gray-400'
                ]"
                :style="{ width: `${formProgress}%` }"
              />
            </div>
            <span class="text-sm font-medium" :class="[
              formProgress >= 80 ? 'text-success-600' :
              formProgress >= 50 ? 'text-primary-600' :
              'text-gray-500'
            ]">
              {{ formProgress }}% Complete
            </span>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Unsaved indicator -->
          <span v-if="formTouched && !isSavedSuccessfully" class="hidden text-sm text-warning-600 sm:inline-flex items-center gap-1">
            <span class="h-2 w-2 animate-pulse rounded-full bg-warning-500"></span>
            Unsaved
          </span>

          <!-- Preview Button -->
          <BaseButton type="button" variant="outline" size="sm" @click="showPreviewModal = true">
            <EyeIcon class="mr-2 h-4 w-4" />
            Preview
          </BaseButton>

          <!-- Duplicate Button (only for editing) -->
          <BaseButton v-if="isEditing" type="button" variant="outline" size="sm" @click="duplicateProduct">
            <DocumentDuplicateIcon class="mr-2 h-4 w-4" />
            Duplicate
          </BaseButton>
          
          <BaseButton type="button" variant="ghost" size="sm" @click="cancel">
            Cancel
          </BaseButton>
          <BaseButton type="button" variant="secondary" size="sm" :loading="isSaving" @click="submitAsDraft">
            Save as Draft
          </BaseButton>
          <BaseButton type="button" variant="primary" size="sm" :loading="isSaving" @click="submitAndPublish">
            {{ isEditing ? 'Save Changes' : 'Save & Submit' }}
          </BaseButton>
        </div>
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

            <RichTextEditor
              v-model="values.description"
              label="বিস্তারিত বর্ণনা / Description"
              name="description"
              placeholder="পণ্যের বিস্তারিত বর্ণনা লিখুন..."
              hint="Bold, Italic, Lists, Links সহ rich formatting সমর্থিত"
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
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                পণ্যের ধরন / Product Type <span class="text-danger-500">*</span>
              </label>
              
              <!-- Info Banner -->
              <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>সিম্পল:</strong> একটি দাম, একটি স্টক (যেমন: বই, চার্জার)
                  &nbsp;|&nbsp;
                  <strong>ভ্যারিয়েবল:</strong> সাইজ/কালার ভেদে ভিন্ন দাম (যেমন: টিশার্ট, জুতা)
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  :class="[
                    'relative flex flex-col rounded-lg border-2 p-4 text-left transition-all',
                    productType === 'simple'
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:border-primary-400 dark:bg-primary-900/20 dark:ring-primary-800'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                  ]"
                  @click="productType = 'simple'"
                >
                  <!-- Checkmark -->
                  <div
                    v-if="productType === 'simple'"
                    class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <div class="flex items-center gap-3">
                    <CubeIcon
                      :class="[
                        'h-8 w-8 shrink-0',
                        productType === 'simple' ? 'text-primary-600' : 'text-gray-400',
                      ]"
                    />
                    <div>
                      <p
                        :class="[
                          'font-semibold',
                          productType === 'simple'
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-white',
                        ]"
                      >
                        সিম্পল প্রোডাক্ট
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        একক আইটেম, কোনো সাইজ/কালার ভ্যারিয়েশন নেই
                      </p>
                    </div>
                  </div>
                  
                  <!-- Example -->
                  <div class="mt-3 rounded bg-white/60 px-2 py-1.5 text-xs dark:bg-gray-800/60">
                    <span class="text-gray-500">উদাহরণ:</span>
                    <span class="font-medium text-gray-700 dark:text-gray-300">দাম: ৳৫০০ | স্টক: ১০০টি</span>
                  </div>
                </button>

                <button
                  type="button"
                  :class="[
                    'relative flex flex-col rounded-lg border-2 p-4 text-left transition-all',
                    productType === 'variable'
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:border-primary-400 dark:bg-primary-900/20 dark:ring-primary-800'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                  ]"
                  @click="productType = 'variable'"
                >
                  <!-- Checkmark -->
                  <div
                    v-if="productType === 'variable'"
                    class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <div class="flex items-center gap-3">
                    <Squares2X2Icon
                      :class="[
                        'h-8 w-8 shrink-0',
                        productType === 'variable' ? 'text-primary-600' : 'text-gray-400',
                      ]"
                    />
                    <div>
                      <p
                        :class="[
                          'font-semibold',
                          productType === 'variable'
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-white',
                        ]"
                      >
                        ভ্যারিয়েবল প্রোডাক্ট
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        সাইজ/কালার ভেদে ভিন্ন দাম ও স্টক
                      </p>
                    </div>
                  </div>
                  
                  <!-- Example -->
                  <div class="mt-3 rounded bg-white/60 px-2 py-1.5 text-xs dark:bg-gray-800/60">
                    <span class="text-gray-500">উদাহরণ:</span>
                    <span class="font-medium text-gray-700 dark:text-gray-300">S=৳৫০০ | M=৳৫৫০ | L=৳৬০০</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Attributes (from category templates) -->
        <BaseCard
          v-if="values.categoryId && (productType === 'simple' ? categoryTemplates.length > 0 : nonVariantTemplates.length > 0)"
          :title="productType === 'simple' ? 'পণ্যের বৈশিষ্ট্য / Attributes' : 'অন্যান্য অ্যাট্রিবিউট'"
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
          title="📦 ভেরিয়েন্ট কনফিগারেশন"
        >
          <div class="space-y-4">
            <!-- Step indicator -->
            <div class="flex items-center gap-2 rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">১</span>
              <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
                Color/Size থেকে একাধিক অপশন নির্বাচন করুন
              </span>
            </div>
            
            <!-- Variant-defining attributes selection -->
            <div v-if="categoryTemplates.filter(t => t.is_variant_defining).length > 0">
              <ProductAttributes
                v-model="attributeValues"
                :templates="categoryTemplates"
                :product-type="productType"
                :errors="attributeErrors"
                variant-only
                @variant-attributes="handleVariantAttributesChange"
              />

              <!-- Step 2: Generate button -->
              <div v-if="variantAttributes.length > 0" class="mt-4 space-y-2">
                <div class="flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">২</span>
                  <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
                    ভেরিয়েন্ট জেনারেট করুন
                  </span>
                </div>
                <BaseButton
                  variant="primary"
                  class="w-full"
                  @click="generateVariants"
                >
                  🔄 ভেরিয়েন্ট তৈরি করুন ({{ variantAttributes.reduce((total, a) => total * a.options.length, 1) }}টি)
                </BaseButton>
              </div>
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
        >
          <template #title>
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-success-500 text-xs font-bold text-white">৩</span>
              <span>প্রতিটি ভেরিয়েন্টের দাম ও স্টক সেট করুন</span>
              <span class="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/50 dark:text-success-300">
                {{ variants.length }}টি ভেরিয়েন্ট
              </span>
            </div>
          </template>
          
          <!-- Pricing explanation -->
          <div class="mb-4 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <p class="text-xs text-amber-700 dark:text-amber-300">
              💰 <strong>প্রাইসিং:</strong> প্রতিটি ভেরিয়েন্টের আলাদা দাম সেট করতে পারবেন। যদি ফাঁকা রাখেন, উপরের বেস প্রাইস (৳{{ Number(values.price || 0).toLocaleString() }}) ব্যবহার হবে।
            </p>
          </div>
          
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
            
            <!-- Image Upload Hints -->
            <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p class="text-xs font-medium text-blue-800 dark:text-blue-300">📷 Image Guidelines:</p>
              <ul class="mt-1 space-y-0.5 text-xs text-blue-700 dark:text-blue-400">
                <li>• Recommended: 800x800px or 1:1 aspect ratio</li>
                <li>• Formats: PNG, JPG, WebP (max 5MB each)</li>
                <li>• Use white background for best results</li>
              </ul>
            </div>
          </div>
        </BaseCard>

        <!-- Pricing -->
        <BaseCard title="Pricing">
          <!-- Profit Margin Indicator -->
          <div v-if="profitMargin" class="mb-4 rounded-lg p-3" :class="[
            profitMargin.isGood ? 'bg-success-50 dark:bg-success-900/20' :
            profitMargin.isWarning ? 'bg-warning-50 dark:bg-warning-900/20' :
            'bg-danger-50 dark:bg-danger-900/20'
          ]">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium" :class="[
                profitMargin.isGood ? 'text-success-700 dark:text-success-300' :
                profitMargin.isWarning ? 'text-warning-700 dark:text-warning-300' :
                'text-danger-700 dark:text-danger-300'
              ]">
                {{ profitMargin.isGood ? '✓ Good Margin' : profitMargin.isWarning ? '⚠ Low Margin' : '⚠ Very Low Margin' }}
              </span>
              <div class="text-right">
                <p class="text-lg font-bold" :class="[
                  profitMargin.isGood ? 'text-success-600' :
                  profitMargin.isWarning ? 'text-warning-600' :
                  'text-danger-600'
                ]">
                  {{ profitMargin.margin }}%
                </p>
                <p class="text-xs text-gray-500">Profit: ৳{{ profitMargin.profit.toFixed(0) }}</p>
              </div>
            </div>
          </div>
          
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
            <!-- SKU with Auto-generate -->
            <div class="space-y-1">
              <FormInput
                v-model="values.sku"
                label="SKU"
                name="sku"
                placeholder="Stock Keeping Unit"
              />
              <button
                v-if="suggestedSku && !values.sku"
                type="button"
                class="text-xs text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400"
                @click="applySuggestedSku"
              >
                💡 Suggest: {{ suggestedSku }}
              </button>
            </div>

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
            <!-- Meta Title with character counter -->
            <div class="space-y-1">
              <FormInput
                v-model="values.metaTitle"
                label="Meta Title"
                name="metaTitle"
                placeholder="SEO title (recommended: 50-60 characters)"
                :maxlength="META_TITLE_MAX"
              />
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Optimal length: 50-60 characters</span>
                <span :class="[
                  metaTitleRemaining < 0 ? 'text-danger-500' :
                  metaTitleRemaining <= 10 ? 'text-warning-500' :
                  'text-gray-500'
                ]">
                  {{ metaTitleLength }} / {{ META_TITLE_MAX }}
                  <span v-if="metaTitleRemaining >= 0">({{ metaTitleRemaining }} left)</span>
                </span>
              </div>
            </div>

            <!-- Meta Description with character counter -->
            <div class="space-y-1">
              <FormTextarea
                v-model="values.metaDescription"
                label="Meta Description"
                name="metaDescription"
                placeholder="SEO description (recommended: 120-160 characters)"
                :rows="3"
                :maxlength="META_DESC_MAX"
              />
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Optimal length: 120-160 characters</span>
                <span :class="[
                  metaDescRemaining < 0 ? 'text-danger-500' :
                  metaDescRemaining <= 20 ? 'text-warning-500' :
                  'text-gray-500'
                ]">
                  {{ metaDescLength }} / {{ META_DESC_MAX }}
                  <span v-if="metaDescRemaining >= 0">({{ metaDescRemaining }} left)</span>
                </span>
              </div>
            </div>
            
            <!-- SEO Preview -->
            <div v-if="values.metaTitle || values.metaDescription" class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">🔍 Search Preview</p>
              <div class="space-y-1">
                <p class="text-lg text-blue-700 dark:text-blue-400 line-clamp-1">
                  {{ values.metaTitle || values.name || 'Product Title' }}
                </p>
                <p class="text-sm text-green-700 dark:text-green-400">
                  yourstore.com/products/{{ values.sku || 'product-slug' }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {{ values.metaDescription || values.short_description || values.description?.substring(0, 160) || 'Product description will appear here...' }}
                </p>
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
              v-model="values.isActive"
              name="isActive"
              label="Product Active"
              description="Product will be visible to customers"
            />

            <!-- Scheduled Publishing -->
            <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  :checked="!!values.publish_at"
                  class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="(e) => values.publish_at = (e.target as HTMLInputElement).checked ? new Date().toISOString().slice(0, 16) : null"
                />
                Schedule Publishing
              </label>
              
              <div v-if="values.publish_at" class="mt-3 space-y-2">
                <input
                  type="datetime-local"
                  :value="values.publish_at"
                  :min="new Date().toISOString().slice(0, 16)"
                  class="block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  @input="(e) => values.publish_at = (e.target as HTMLInputElement).value"
                />
                <p v-if="values.publish_at && new Date(values.publish_at) > new Date()" class="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                  <span class="h-2 w-2 animate-pulse rounded-full bg-primary-500"></span>
                  Will publish on {{ new Date(values.publish_at).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }) }}
                </p>
                <p v-else-if="values.publish_at" class="text-xs text-warning-600 dark:text-warning-400">
                  ⚠️ Selected time is in the past
                </p>
              </div>
            </div>
          </div>
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

  <!-- Product Preview Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showPreviewModal" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50" @click="showPreviewModal = false" />
        
        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                <EyeIcon class="mr-2 inline-block h-5 w-5" />
                Product Preview
              </h3>
              <button
                type="button"
                class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                @click="showPreviewModal = false"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
            
            <!-- Preview Content -->
            <div class="max-h-[70vh] overflow-y-auto p-6">
              <div class="grid gap-8 lg:grid-cols-2">
                <!-- Images -->
                <div class="space-y-4">
                  <!-- Main Image -->
                  <div class="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                    <img
                      v-if="images.length > 0"
                      :src="images[0]"
                      :alt="values.name"
                      class="h-full w-full object-cover"
                    />
                    <div v-else class="flex h-full items-center justify-center">
                      <PhotoIcon class="h-24 w-24 text-gray-300" />
                    </div>
                  </div>
                  
                  <!-- Thumbnail Gallery -->
                  <div v-if="images.length > 1" class="grid grid-cols-4 gap-2">
                    <div
                      v-for="(img, idx) in images.slice(0, 4)"
                      :key="idx"
                      class="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600"
                    >
                      <img :src="img" :alt="`Image ${idx + 1}`" class="h-full w-full object-cover" />
                    </div>
                  </div>
                </div>

                <!-- Product Info -->
                <div class="space-y-4">
                  <!-- Title -->
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ values.name || 'Product Name' }}
                  </h1>
                  
                  <!-- Price Display -->
                  <div class="space-y-2">
                    <!-- Variable Product: Show Price Range -->
                    <div v-if="productType === 'variable' && previewPriceRange">
                      <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                          {{ previewPriceRange.display }}
                        </span>
                      </div>
                      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {{ variants.length }} variants available
                      </p>
                    </div>
                    
                    <!-- Simple Product: Show Single Price -->
                    <div v-else class="flex items-baseline gap-3">
                      <span class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        ৳{{ Number(values.sale_price || values.price || 0).toLocaleString('en-BD') }}
                      </span>
                      <span
                        v-if="values.sale_price && values.price && values.sale_price < values.price"
                        class="text-lg text-gray-400 line-through"
                      >
                        ৳{{ Number(values.price).toLocaleString('en-BD') }}
                      </span>
                      <span
                        v-if="values.sale_price && values.price && values.sale_price < values.price"
                        class="rounded bg-danger-100 px-2 py-0.5 text-sm font-medium text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
                      >
                        -{{ Math.round((1 - values.sale_price / values.price) * 100) }}%
                      </span>
                    </div>
                  </div>

                  <!-- Short Description -->
                  <p v-if="values.short_description" class="text-gray-600 dark:text-gray-300">
                    {{ values.short_description }}
                  </p>

                  <!-- Stock Status -->
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                        (productType === 'variable' ? variants.filter(v => v.stock_quantity > 0).length > 0 : Number(values.stock) > 0)
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                          : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                      ]"
                    >
                      <template v-if="productType === 'variable'">
                        {{ variants.filter(v => v.stock_quantity > 0).length > 0 
                          ? `In Stock (${variants.filter(v => v.stock_quantity > 0).length} variants)` 
                          : 'Out of Stock' }}
                      </template>
                      <template v-else>
                        {{ Number(values.stock) > 0 ? `In Stock (${values.stock})` : 'Out of Stock' }}
                      </template>
                    </span>
                  </div>

                  <!-- Variants preview -->
                  <div v-if="productType === 'variable' && variantAttributes.length > 0" class="space-y-3">
                    <div v-for="attr in variantAttributes" :key="attr.templateId" class="space-y-2">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ attr.name }}:</p>
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="val in attr.selectedValues"
                          :key="val"
                          class="rounded-md border border-gray-300 px-3 py-1 text-sm hover:border-primary-500 dark:border-gray-600"
                        >
                          {{ val }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- SKU -->
                  <p v-if="values.sku" class="text-sm text-gray-500">
                    SKU: {{ values.sku }}
                  </p>

                  <!-- Action Buttons (Preview only) -->
                  <div class="flex gap-3 pt-4">
                    <button
                      type="button"
                      class="flex-1 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700"
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border-2 border-primary-600 px-6 py-3 font-semibold text-primary-600 transition hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      ♥
                    </button>
                  </div>
                </div>
              </div>

              <!-- Description Tab -->
              <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Description</h3>
                <div
                  v-if="values.description"
                  class="prose prose-sm max-w-none dark:prose-invert"
                  v-html="values.description"
                />
                <p v-else class="text-gray-500">No description provided.</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <p class="text-sm text-gray-500">
                This is a preview of how your product will appear to customers.
              </p>
              <BaseButton variant="primary" size="sm" @click="showPreviewModal = false">
                Close Preview
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
