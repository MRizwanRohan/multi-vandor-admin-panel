<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Product Form — Create/Edit product page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { productService, categoryService } from '@/services'
import { attributeTemplateService } from '@/services/attribute-template.service'
import { useToast, useDragDrop, useConfirm } from '@/composables'
import { sanitizeHtml } from '@/utils/sanitize'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import { ProductAttributes, VariantMatrix } from '@/components/domain'
import type { 
  ProductDetail, 
  Category, 
  ProductType, 
  AttributeTemplate, 
  ProductAttributeInput, 
  VariantMatrixAttribute, 
  ProductVariant 
} from '@/types'
import RichTextEditor from '@/components/form/RichTextEditor.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import { PhotoIcon, XMarkIcon, CubeIcon, Squares2X2Icon, Bars3Icon, ArrowLeftIcon, EyeIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()

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

// Attribute Templates
const categoryTemplates = ref<AttributeTemplate[]>([])
const attributeValues = ref<ProductAttributeInput[]>([])
const attributeErrors = ref<Record<number, string>>({})
const isLoadingTemplates = ref(false)
const categorySlugMap = ref<Record<number, string>>({})
const isLoadingProduct = ref(false)
const formTouched = ref(false)
const isSavedSuccessfully = ref(false)
const showPreviewModal = ref(false)

// Normalize ISO date strings to datetime-local format (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return null
  }
}

// Non-variant templates for simple products or non-variant attrs for variable
const nonVariantTemplates = computed(() =>
  productType.value === 'variable'
    ? categoryTemplates.value.filter(t => !t.is_variant_defining && !(t as any).isVariantDefining)
    : categoryTemplates.value
)

// Variants for variable products
const variantAttributes = ref<VariantMatrixAttribute[]>([])
const variants = ref<ProductVariant[]>([])

// Data
const isLoading = ref(false)
const categories = ref<Category[]>([])
const uploadedImages = ref<{ id: string; url: string; file?: File }[]>([])
const variantImageInput = ref<HTMLInputElement | null>(null)
const currentVariantIndex = ref<number | null>(null)
const categoryOptions = computed(() => 
  categories.value.map(cat => ({ 
    value: String(cat.id), 
    label: cat.name 
  }))
)

// ── Form Progress Indicator ──
const formProgress = computed(() => {
  const fields = [
    { filled: !!formValues.name && String(formValues.name).length >= 2, weight: 15 },
    { filled: !!formValues.description && String(formValues.description).length >= 10, weight: 15 },
    { filled: !!formValues.category_id, weight: 15 },
    { filled: Number(formValues.price) > 0, weight: 15 },
    { filled: uploadedImages.value.length > 0, weight: 15 },
    { filled: !!formValues.sku, weight: 5 },
    { filled: Number(formValues.stock_quantity) > 0 || productType.value === 'variable', weight: 10 },
    { filled: !!formValues.meta_title, weight: 5 },
    { filled: !!formValues.meta_description, weight: 5 },
  ]
  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0)
  const filledWeight = fields.filter(f => f.filled).reduce((sum, f) => sum + f.weight, 0)
  return Math.round((filledWeight / totalWeight) * 100)
})

// ── Profit Margin Calculator ──
const profitMargin = computed(() => {
  const cp = Number(formValues.cost_price) || 0
  const sp = Number(formValues.sale_price) || Number(formValues.price) || 0
  if (cp <= 0 || sp <= 0) return null
  const profit = sp - cp
  const margin = (profit / sp) * 100
  return {
    profit,
    margin: margin.toFixed(1),
    isGood: margin >= 20,
    isWarning: margin >= 10 && margin < 20,
    isDanger: margin < 10,
  }
})

// ── Price Range (variable products) ──
const previewPriceRange = computed(() => {
  if (productType.value !== 'variable' || variants.value.length === 0) return null
  const prices = variants.value
    .filter(v => v.is_active)
    .map(v => {
      const basePrice = v.price || Number(formValues.price) || 0
      const sp = v.sale_price
      return (sp && sp < basePrice) ? sp : basePrice
    })
  if (prices.length === 0) return null
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  return {
    min: minP, max: maxP,
    display: minP === maxP ? `৳${minP.toLocaleString('en-BD')}` : `৳${minP.toLocaleString('en-BD')} – ৳${maxP.toLocaleString('en-BD')}`,
  }
})

// ── SEO Character Counters ──
const META_TITLE_MAX = 60
const META_DESC_MAX = 160
const metaTitleLength = computed(() => String(formValues.meta_title || '').length)
const metaDescLength = computed(() => String(formValues.meta_description || '').length)
const metaTitleRemaining = computed(() => META_TITLE_MAX - metaTitleLength.value)
const metaDescRemaining = computed(() => META_DESC_MAX - metaDescLength.value)

// Drag-and-drop image reorder
const { handlers: dragHandlers, isDraggingIndex, isDropTarget } = useDragDrop(uploadedImages, {
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
  scheduled_publish_at: z.string().optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0, 'Stock must be a positive integer'),
  low_stock_threshold: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional().nullable(),
  dimension_length: z.coerce.number().min(0).optional().nullable(),
  dimension_width: z.coerce.number().min(0).optional().nullable(),
  dimension_height: z.coerce.number().min(0).optional().nullable(),
  visibility: z.enum(['visible', 'hidden', 'catalog_only']),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'archived']),
  category_id: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.sale_price && data.price && data.sale_price >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sale price must be less than regular price',
      path: ['sale_price'],
    })
  }
  if (data.sale_start_date && data.sale_end_date && data.sale_end_date <= data.sale_start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be after start date',
      path: ['sale_end_date'],
    })
  }
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
  setFieldError,
  setErrors,
  values: formValues,
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
    scheduled_publish_at: null as string | null,
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
    category_id: '' as string,
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
const [scheduledPublishAt, scheduledPublishAtAttrs] = defineField('scheduled_publish_at')
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

// ── Unsaved Changes Tracking ──
watch(() => formValues, () => {
  if (!isSavedSuccessfully.value) formTouched.value = true
}, { deep: true })

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (formTouched.value && !isSavedSuccessfully.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (formTouched.value && !isSavedSuccessfully.value) {
    const confirmed = await confirm.confirm({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      confirmText: 'Leave',
      cancelText: 'Stay',
      variant: 'warning',
    })
    if (!confirmed) return false
  }
  return true
})

function cancel() {
  router.push('/admin/products')
}

// Set page info & load data
onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Products', to: '/admin/products' },
    { label: pageTitle.value },
  ])
  
  await fetchCategories()
  
  if (isEditMode.value) {
    await fetchProduct()
  }
})

// Watch category changes to load templates — AFTER defineField so categoryId exists
watch(
  () => formValues.category_id,
  async (catId, oldCatId) => {
    if (!catId) {
      categoryTemplates.value = []
      if (!isLoadingProduct.value) {
        attributeValues.value = []
      }
      return
    }
    
    isLoadingTemplates.value = true
    try {
      const slug = categorySlugMap.value[Number(catId)]
      if (!slug) {
        console.error('Category slug not found for id:', catId)
        categoryTemplates.value = []
        return
      }
      const templates = await attributeTemplateService.getCategoryTemplates(slug)
      categoryTemplates.value = templates
      
      // Reset attribute values only when user manually changes category
      if (!isLoadingProduct.value && oldCatId && oldCatId !== catId) {
        attributeValues.value = []
      }
      
      // Seed variant-defining attribute selections in edit mode
      if (isLoadingProduct.value && productType.value === 'variable' && variantAttributes.value.length > 0) {
        const variantDefTemplates = templates.filter((t: any) => t.is_variant_defining || t.isVariantDefining)
        for (const template of variantDefTemplates) {
          const varAttr = variantAttributes.value.find(va => va.id === template.id)
          if (!varAttr || varAttr.options.length === 0) continue
          
          const selectedValues: string[] = []
          for (const selectedOpt of varAttr.options) {
            const templateOpt = template.options?.find((to: any) => to.id === selectedOpt.id)
            if (templateOpt) {
              selectedValues.push(templateOpt.value)
            }
          }
          
          if (selectedValues.length > 0) {
            const existing = attributeValues.value.filter(av => av.template_id !== template.id)
            attributeValues.value = [...existing, { template_id: template.id, value: selectedValues }]
          }
        }
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

// Fetch existing product
async function fetchProduct() {
  if (!productSlug.value) return
  
  isLoading.value = true
  isLoadingProduct.value = true
  try {
    const product = await productService.adminShow(productSlug.value) as any
    
    const categoryIdVal = product.category?.id ?? product.categoryId ?? product.category_id
    
    setValues({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      short_description: product.shortDescription ?? product.short_description ?? '',
      price: product.price,
      sale_price: product.salePrice ?? product.sale_price,
      cost_price: product.costPrice ?? product.cost_price,
      sale_start_date: toDatetimeLocal(product.saleStartDate ?? product.sale_start_date),
      sale_end_date: toDatetimeLocal(product.saleEndDate ?? product.sale_end_date),
      scheduled_publish_at: toDatetimeLocal(product.scheduledPublishAt ?? product.scheduled_publish_at),
      stock_quantity: product.stockQuantity ?? product.stock_quantity ?? 0,
      low_stock_threshold: product.lowStockThreshold ?? product.low_stock_threshold ?? 10,
      weight: product.weight || null,
      dimension_length: product.dimensions?.length ?? null,
      dimension_width: product.dimensions?.width ?? null,
      dimension_height: product.dimensions?.height ?? null,
      visibility: (product.visibility === 'catalog' ? 'catalog_only' : product.visibility || 'visible') as 'visible' | 'hidden' | 'catalog_only',
      is_active: product.isActive ?? product.is_active ?? true,
      is_featured: product.isFeatured ?? product.is_featured ?? false,
      status: product.status,
      category_id: categoryIdVal != null ? String(categoryIdVal) : '',
      meta_title: product.metaTitle ?? product.meta_title ?? '',
      meta_description: product.metaDescription ?? product.meta_description ?? '',
    })
    
    // Load product type, attributes, and variants
    productType.value = product.type || 'simple'
    
    // Load attributes
    const attrs = product.attributes || []
    if (attrs.length > 0) {
      attributeValues.value = attrs.map((attr: any) => ({
        template_id: attr.templateId ?? attr.template_id,
        value: attr.value,
      }))
    }
    
    // Load variants
    const productVariants = product.variants || []
    if (productVariants.length > 0) {
      variants.value = productVariants.map((v: any) => {
        let options: any[] = []
        if (v.options?.length > 0) {
          options = v.options.map((o: any) => ({
            option_id: o.optionId ?? o.option_id ?? o.attribute_template_option_id ?? o.id,
            template: o.template ?? o.templateName ?? o.template_name ?? '',
            template_id: o.templateId ?? o.template_id ?? o.attribute_template_id ?? null,
            value: o.value ?? o.optionValue ?? o.option_value ?? '',
            label: o.label ?? o.optionLabel ?? o.option_label ?? o.value ?? '',
          }))
        }
        
        return {
          id: v.id,
          sku: v.sku,
          name: v.name ?? v.combinationString ?? v.combination_string ?? '',
          price: v.price,
          sale_price: v.salePrice ?? v.sale_price ?? null,
          sale_start_date: v.saleStartDate ?? v.sale_start_date ?? null,
          sale_end_date: v.saleEndDate ?? v.sale_end_date ?? null,
          effective_price: v.effectivePrice ?? v.effective_price ?? v.price,
          is_sale_active: v.isSaleActive ?? v.is_sale_active ?? false,
          stock_quantity: v.stockQuantity ?? v.stock_quantity ?? 0,
          is_in_stock: v.isInStock ?? v.is_in_stock ?? false,
          is_active: v.isActive ?? v.is_active ?? true,
          has_orders: v.hasOrders ?? v.has_orders ?? false,
          weight: v.weight ?? null,
          barcode: v.barcode ?? null,
          image_url: v.imageUrl ?? v.image_url ?? null,
          options,
        }
      })
    }
    
    // Load variant config / matrix
    const varMatrix = product.variantMatrix ?? product.variant_matrix
    const varConfig = product.variantConfig ?? product.variant_config
    const varOptions = product.variantOptions ?? product.variant_options
    
    const matrixAxes = varMatrix?.axes ?? varMatrix?.attributes
    if (matrixAxes?.length > 0) {
      variantAttributes.value = matrixAxes.map((attr: any) => ({
        id: attr.templateId ?? attr.template_id ?? attr.id,
        name: attr.name,
        options: attr.options?.map((o: any) => ({
          id: o.optionId ?? o.option_id ?? o.id,
          value: o.value ?? o.label ?? '',
          label: o.label ?? o.value ?? '',
        })) ?? [],
      }))
    } else if (varOptions?.length > 0) {
      variantAttributes.value = varOptions.map((vo: any) => ({
        id: vo.templateId ?? vo.template_id,
        name: vo.name,
        options: vo.options?.map((o: any) => ({
          id: o.id,
          value: o.value ?? o.label ?? '',
          label: o.label ?? o.value ?? '',
        })) ?? [],
      }))
    } else if (varConfig?.length > 0) {
      variantAttributes.value = varConfig.map((vc: any) => {
        const templateId = vc.templateId ?? vc.template_id
        const optionMap = new Map<number, string>()
        if (productVariants.length > 0) {
          for (const v of productVariants) {
            const vOpts = v.options || []
            for (const o of vOpts) {
              const oTemplateId = o.templateId ?? o.template_id ?? o.attribute_template_id
              if (oTemplateId === templateId) {
                const optId = o.optionId ?? o.option_id ?? o.attribute_template_option_id ?? o.id
                const optVal = o.value ?? o.optionValue ?? o.option_value ?? ''
                if (optId) optionMap.set(optId, optVal)
              }
            }
          }
        }
        
        return {
          id: templateId,
          name: vc.name,
          options: optionMap.size > 0
            ? Array.from(optionMap.entries()).map(([id, value]) => ({ id, value, label: value }))
            : (vc.options || []).map((val: string) => ({ id: 0, value: val, label: val })),
        }
      })
    }
    
    uploadedImages.value = product.images?.map((img: any) => ({
      id: String(img.id),
      url: img.url || img.imageUrl || img.image_url,
    })) || []
  } catch (error) {
    toast.error('Failed to fetch product')
    router.push('/admin/products')
  } finally {
    isLoading.value = false
    isLoadingProduct.value = false
  }
}

// Fetch categories
async function fetchCategories() {
  try {
    const response = await categoryService.getAll()
    categories.value = response.data
    // Build id → slug map
    const slugMap: Record<number, string> = {}
    response.data.forEach(cat => {
      slugMap[cat.id] = cat.slug
    })
    categorySlugMap.value = slugMap
  } catch (error) {
    toast.error('Failed to load categories')
    categories.value = []
  }
}

// Handle variant attributes change
function handleVariantAttributesChange(attrs: VariantMatrixAttribute[]) {
  variantAttributes.value = attrs
}

// Generate variant combinations
function generateVariants() {
  if (variantAttributes.value.length === 0) {
    toast.error('Please select variant attributes first')
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

  // Fingerprint-based matching: preserve existing variant data when regenerating
  const existingMap = new Map<string, ProductVariant>()
  for (const v of variants.value) {
    if (v.options?.length) {
      const fp = v.options.map((o: any) => `${o.template_id || o.templateId}:${o.option_id || o.optionId}`).sort().join('|')
      existingMap.set(fp, v)
    }
  }

  variants.value = combinations.map((options) => {
    const fp = options.map(o => `${o.template_id}:${o.option_id}`).sort().join('|')
    const existing = existingMap.get(fp)
    
    if (existing) {
      return { ...existing, options }
    }
    
    return {
      id: 0,
      sku: `${sku.value || 'SKU'}-${options.map((o) => o.value.substring(0, 2).toUpperCase()).join('-')}`,
      name: options.map((o) => o.value).join(' / '),
      price: Number(price.value) || 0,
      sale_price: Number(salePrice.value) || 0,
      sale_start_date: (saleStartDate.value as string) || '',
      sale_end_date: (saleEndDate.value as string) || '',
      effective_price: Number(salePrice.value) || Number(price.value) || 0,
      is_sale_active: !!salePrice.value,
      stock_quantity: 0,
      is_in_stock: false,
      is_active: true,
      has_orders: false,
      weight: null,
      image_url: null,
      barcode: null,
      options,
    } as any
  })

  toast.success(`Generated ${variants.value.length} variants`)
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
        attributeErrors.value[template.id] = `${template.name} is required`
        isValid = false
      }
    }
  }

  return isValid
}

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

// Variant image upload
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

// Submit form
const onSubmit = handleSubmit(async (values) => {
  // Validate attributes
  if (!validateAttributes()) {
    toast.error('Please fill all required attributes')
    return
  }

  // For variable products, check if variants exist
  if (productType.value === 'variable' && variants.value.length === 0) {
    toast.error('Please generate variants for variable products')
    return
  }

  if (!isEditMode.value) {
    toast.error('Admin cannot create products. Products are created by vendors.')
    router.push('/admin/products')
    return
  }

  try {
    const productData: Record<string, any> = {
      name: values.name,
      sku: values.sku,
      description: values.description,
      short_description: values.short_description,
      type: productType.value,
      price: values.price,
      cost_price: values.cost_price || undefined,
      sale_price: values.sale_price || undefined,
      sale_start_date: values.sale_start_date || undefined,
      sale_end_date: values.sale_end_date || undefined,
      scheduled_publish_at: values.scheduled_publish_at || undefined,
      stock_quantity: productType.value === 'simple' ? values.stock_quantity : undefined,
      low_stock_threshold: values.low_stock_threshold || undefined,
      weight: values.weight,
      dimensions: (values.dimension_length || values.dimension_width || values.dimension_height)
        ? {
            length: values.dimension_length || 0,
            width: values.dimension_width || 0,
            height: values.dimension_height || 0,
          }
        : undefined,
      visibility: values.visibility,
      is_active: values.is_active,
      is_featured: values.is_featured,
      status: values.status,
      category_id: values.category_id ? Number(values.category_id) : undefined,
      meta_title: values.meta_title || values.name,
      meta_description: values.meta_description || values.short_description,
      attribute_values: attributeValues.value.length > 0 ? attributeValues.value : undefined,
      variants: productType.value === 'variable' 
        ? variants.value.map(v => ({
            id: v.id || undefined,
            sku: v.sku,
            price: Number(v.price) || 0,
            sale_price: v.sale_price != null ? Number(v.sale_price) : null,
            sale_start_date: v.sale_start_date || undefined,
            sale_end_date: v.sale_end_date || undefined,
            stock_quantity: Number(v.stock_quantity) || 0,
            is_active: v.is_active,
            weight: v.weight,
            barcode: v.barcode,
            image_url: v.image_url,
            option_ids: v.options?.map((o: any) => o.option_id),
          }))
        : undefined,
      variant_config: productType.value === 'variable' && variantAttributes.value.length > 0
        ? variantAttributes.value.map(attr => ({
            template_id: attr.id,
            option_ids: attr.options.map(o => o.id),
          }))
        : undefined,
    }

    await productService.adminUpdate(productSlug.value!, productData as any)
    isSavedSuccessfully.value = true
    toast.success('Product updated successfully')
    router.push('/admin/products')
  } catch (error: any) {
    // Map backend 422 errors to form fields
    if (error.response?.status === 422 && error.response?.data) {
      const data = error.response.data
      const backendErrors = data.errors || {}
      const fieldNameMap: Record<string, string> = {
        name: 'name', sku: 'sku', price: 'price', sale_price: 'sale_price',
        cost_price: 'cost_price', stock_quantity: 'stock_quantity',
        category_id: 'category_id', description: 'description',
        short_description: 'short_description', weight: 'weight',
        visibility: 'visibility', status: 'status',
        meta_title: 'meta_title', meta_description: 'meta_description',
        low_stock_threshold: 'low_stock_threshold',
        sale_start_date: 'sale_start_date', sale_end_date: 'sale_end_date',
        scheduled_publish_at: 'scheduled_publish_at',
        is_active: 'is_active', is_featured: 'is_featured',
      }
      
      let firstErrorField: string | null = null
      for (const [backendField, messages] of Object.entries(backendErrors)) {
        const formField = fieldNameMap[backendField] || backendField
        const msg = Array.isArray(messages) ? (messages as string[])[0] : messages
        setFieldError(formField as any, msg as string)
        if (!firstErrorField) firstErrorField = formField
      }
      
      // Scroll to first error
      if (firstErrorField) {
        const el = document.querySelector(`[name="${firstErrorField}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      
      const errorCount = Object.keys(backendErrors).length
      if (errorCount > 0) {
        toast.error(`Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''}`)
      } else if (data.message) {
        toast.error(data.message)
      }
    } else {
      toast.error(error.response?.data?.message || 'Failed to update product')
    }
  }
})
</script>

<template>
  <div>
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
            
            <BaseButton type="button" variant="ghost" size="sm" @click="cancel">
              Cancel
            </BaseButton>
            <BaseButton type="submit" variant="primary" size="sm" :loading="isSubmitting">
              {{ isEditMode ? 'Update Product' : 'Save Product' }}
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
                v-model="name"
                v-bind="nameAttrs"
                label="Product Name"
                name="name"
                placeholder="Enter product name"
                :error="errors.name"
                required
              />

              <FormTextarea
                v-model="shortDescription"
                v-bind="shortDescriptionAttrs"
                label="Short Description"
                name="short_description"
                placeholder="Brief product summary (shown in product cards)"
                :rows="2"
                :error="errors.short_description"
              />

              <RichTextEditor
                :modelValue="description as string"
                @update:modelValue="description = $event"
                label="বিস্তারিত বর্ণনা / Description"
                name="description"
                placeholder="পণ্যের বিস্তারিত বর্ণনা লিখুন..."
                hint="Bold, Italic, Lists, Links সহ rich formatting সমর্থিত"
              />

              <FormSelect
                v-model="categoryId"
                v-bind="categoryIdAttrs"
                label="Category"
                name="category_id"
                :options="categoryOptions"
                placeholder="Select category"
                :error="errors.category_id"
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
            v-if="categoryId && (productType === 'simple' ? categoryTemplates.length > 0 : nonVariantTemplates.length > 0)"
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
            />
          </BaseCard>

          <!-- Variant Configuration (for variable products) -->
          <BaseCard
            v-if="productType === 'variable' && categoryId"
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
                    🔄 ভেরিয়েন্ট তৈরি করুন ({{ variantAttributes.reduce((total: number, a: VariantMatrixAttribute) => total * a.options.length, 1) }}টি)
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
                  ক্যাটাগরিতে Color, Size এর মতো অ্যাট্রিবিউট যোগ করুন।
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
                💰 <strong>প্রাইসিং:</strong> প্রতিটি ভেরিয়েন্টের আলাদা দাম সেট করতে পারবেন। যদি ফাঁকা রাখেন, উপরের বেস প্রাইস (৳{{ Number(price || 0).toLocaleString() }}) ব্যবহার হবে।
              </p>
            </div>
            
            <VariantMatrix
              :variants="variants"
              :attributes="variantAttributes"
              :base-price="Number(price) || 0"
              :base-sku="sku || ''"
              @update:variants="variants = $event"
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
            <template #header-actions>
              <span class="text-sm" :class="uploadedImages.length >= 10 ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'">
                {{ uploadedImages.length }}/10
              </span>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <!-- Draggable images -->
                <div
                  v-for="(image, index) in uploadedImages"
                  :key="image.id"
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
                    :src="image.url"
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
                    @click.stop="removeImage(image.id)"
                  >
                    <XMarkIcon class="h-4 w-4" />
                  </button>
                </div>

                <!-- Upload button -->
                <label
                  v-if="uploadedImages.length < 10"
                  class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 dark:border-gray-600 dark:hover:border-primary-400"
                >
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
                ছবি ড্র্যাগ করে সাজান। প্রথম ছবিটি প্রাইমারি ছবি হবে। সর্বোচ্চ ১০টি ছবি।
              </p>
              
              <!-- Image Upload Hints -->
              <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p class="text-xs font-medium text-blue-800 dark:text-blue-300">📷 ছবির নির্দেশিকা:</p>
                <ul class="mt-1 space-y-0.5 text-xs text-blue-700 dark:text-blue-400">
                  <li>• সাইজ: 800x800px বা 1:1 অনুপাত সেরা</li>
                  <li>• ফরম্যাট: JPG, PNG, WebP, GIF (প্রতিটি সর্বোচ্চ 5MB)</li>
                  <li>• সাদা ব্যাকগ্রাউন্ড ব্যবহার করুন সেরা ফলাফলের জন্য</li>
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
            
            <div class="grid gap-4 sm:grid-cols-3">
              <FormInput
                v-model="price"
                v-bind="priceAttrs"
                :label="productType === 'variable' ? 'Base Price (৳)' : 'Price (৳)'"
                name="price"
                type="number"
                prefix="৳"
                :error="errors.price"
                required
              />
              
              <FormInput
                v-model="costPrice"
                v-bind="costPriceAttrs"
                label="Cost Price (৳)"
                name="cost_price"
                type="number"
                prefix="৳"
                hint="For profit calculation only"
                :error="errors.cost_price"
              />
              
              <FormInput
                v-model="salePrice"
                v-bind="salePriceAttrs"
                :label="productType === 'variable' ? 'Base Sale Price (৳)' : 'Sale Price (৳)'"
                name="sale_price"
                type="number"
                prefix="৳"
                :hint="productType === 'variable' ? 'Default for new variants' : 'Discounted price'"
                :error="errors.sale_price"
              />
            </div>

            <!-- Sale Date Range -->
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <FormInput
                v-model="saleStartDate"
                v-bind="saleStartDateAttrs"
                label="Sale Start Date"
                name="sale_start_date"
                type="datetime-local"
                hint="When the sale price becomes active"
              />
              <FormInput
                v-model="saleEndDate"
                v-bind="saleEndDateAttrs"
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

          <!-- Inventory -->
          <BaseCard title="ইনভেন্টরি / Inventory">
            <div class="space-y-4">
              <!-- SKU -->
              <FormInput
                v-model="sku"
                v-bind="skuAttrs"
                label="SKU (Stock Keeping Unit)"
                name="sku"
                placeholder="Product SKU"
                :error="errors.sku"
                required
              />

              <!-- Stock & Threshold -->
              <div v-if="productType === 'simple'" class="grid gap-4 sm:grid-cols-2">
                <FormInput
                  v-model="stockQuantity"
                  v-bind="stockQuantityAttrs"
                  label="স্টক সংখ্যা / Stock Quantity"
                  name="stock_quantity"
                  type="number"
                  :error="errors.stock_quantity"
                  required
                />

                <FormInput
                  v-model="lowStockThreshold"
                  v-bind="lowStockThresholdAttrs"
                  label="লো স্টক থ্রেশহোল্ড"
                  name="low_stock_threshold"
                  type="number"
                  hint="স্টক এর নিচে গেলে অ্যালার্ট পাবেন"
                  :error="errors.low_stock_threshold"
                />
              </div>

              <div v-if="productType === 'variable'" class="space-y-3">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      স্টক সংখ্যা / Stock Quantity
                    </label>
                    <div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {{ variants.length > 0 
                        ? `${variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0)} (${variants.filter(v => Number(v.stock_quantity) > 0).length}/${variants.length} ভেরিয়েন্টে স্টক আছে)`
                        : '0 — ভেরিয়েন্ট তৈরি করুন' 
                      }}
                    </div>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      📦 ভেরিয়েবল প্রোডাক্টের স্টক প্রতিটি ভেরিয়েন্টেই আলাদাভাবে সেট করা হয়।
                    </p>
                  </div>

                  <FormInput
                    v-model="lowStockThreshold"
                    v-bind="lowStockThresholdAttrs"
                    label="লো স্টক থ্রেশহোল্ড"
                    name="low_stock_threshold"
                    type="number"
                    hint="মোট স্টক এর নিচে গেলে অ্যালার্ট পাবেন"
                    :error="errors.low_stock_threshold"
                  />
                </div>
              </div>

              <!-- Weight -->
              <FormInput
                v-model="weight"
                v-bind="weightAttrs"
                label="ওজন / Weight (kg)"
                name="weight"
                type="number"
                :min="0"
                :step="0.01"
              />

              <!-- Dimensions -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">মাত্রা / Dimensions (cm)</label>
                <div class="grid grid-cols-3 gap-3">
                  <FormInput
                    v-model="dimensionLength"
                    v-bind="dimensionLengthAttrs"
                    label="দৈর্ঘ্য"
                    name="dimension_length"
                    type="number"
                    :min="0"
                    :step="0.1"
                    placeholder="L"
                  />
                  <FormInput
                    v-model="dimensionWidth"
                    v-bind="dimensionWidthAttrs"
                    label="প্রস্থ"
                    name="dimension_width"
                    type="number"
                    :min="0"
                    :step="0.1"
                    placeholder="W"
                  />
                  <FormInput
                    v-model="dimensionHeight"
                    v-bind="dimensionHeightAttrs"
                    label="উচ্চতা"
                    name="dimension_height"
                    type="number"
                    :min="0"
                    :step="0.1"
                    placeholder="H"
                  />
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- SEO -->
          <BaseCard title="SEO (Search Engine Optimization)">
            <div class="space-y-4">
              <!-- Meta Title with character counter -->
              <div class="space-y-1">
                <FormInput
                  v-model="metaTitle"
                  v-bind="metaTitleAttrs"
                  label="Meta Title"
                  name="meta_title"
                  placeholder="SEO title (recommended: 50-60 characters)"
                  :error="errors.meta_title"
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
                  v-model="metaDescription"
                  v-bind="metaDescriptionAttrs"
                  label="Meta Description"
                  name="meta_description"
                  placeholder="SEO description (recommended: 120-160 characters)"
                  :rows="3"
                  :error="errors.meta_description"
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
              <div v-if="metaTitle || metaDescription" class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">🔍 Search Preview</p>
                <div class="space-y-1">
                  <p class="text-lg text-blue-700 dark:text-blue-400 line-clamp-1">
                    {{ metaTitle || name || 'Product Title' }}
                  </p>
                  <p class="text-sm text-green-700 dark:text-green-400">
                    yourstore.com/products/{{ sku || 'product-slug' }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {{ metaDescription || shortDescription || 'Product description will appear here...' }}
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
              <FormSelect
                v-model="status"
                v-bind="statusAttrs"
                name="status"
                :options="statusOptions"
                :error="errors.status"
              />
              <FormSwitch
                v-model="isActive"
                v-bind="isActiveAttrs"
                name="is_active"
                label="Product Active"
                description="Product will be visible to customers"
              />
              <FormSwitch
                v-model="isFeatured"
                v-bind="isFeaturedAttrs"
                name="is_featured"
                label="Featured"
                description="Show in featured products"
              />

              <!-- Scheduled Publishing -->
              <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    :checked="!!scheduledPublishAt"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    @change="(e: Event) => scheduledPublishAt = (e.target as HTMLInputElement).checked ? new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16) : null"
                  />
                  <span>⏰ Schedule Publishing</span>
                </label>
                <p class="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
                  পরে প্রকাশ করতে তারিখ ও সময় সেট করুন
                </p>
                
                <div v-if="scheduledPublishAt" class="mt-3 ml-6 space-y-2">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    প্রকাশের তারিখ ও সময়
                  </label>
                  <input
                    type="datetime-local"
                    :value="scheduledPublishAt"
                    :min="new Date().toISOString().slice(0, 16)"
                    class="block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    @input="(e: Event) => scheduledPublishAt = (e.target as HTMLInputElement).value"
                  />
                  <p v-if="scheduledPublishAt && new Date(scheduledPublishAt as string) > new Date()" class="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                    <span class="h-2 w-2 animate-pulse rounded-full bg-primary-500"></span>
                    ✅ {{ new Date(scheduledPublishAt as string).toLocaleString('bn-BD', { dateStyle: 'long', timeStyle: 'short' }) }} তে প্রকাশ হবে
                  </p>
                  <p v-else-if="scheduledPublishAt" class="text-xs text-warning-600 dark:text-warning-400">
                    ⚠️ নির্বাচিত সময় অতীতে - ভবিষ্যতের সময় নির্বাচন করুন
                  </p>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Visibility -->
          <BaseCard title="Visibility">
            <FormSelect
              v-model="visibility"
              v-bind="visibilityAttrs"
              name="visibility"
              :options="visibilityOptions"
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
                        v-if="uploadedImages.length > 0"
                        :src="uploadedImages[0].url"
                        :alt="(name as string)"
                        class="h-full w-full object-cover"
                      />
                      <div v-else class="flex h-full items-center justify-center">
                        <PhotoIcon class="h-24 w-24 text-gray-300" />
                      </div>
                    </div>
                    
                    <!-- Thumbnail Gallery -->
                    <div v-if="uploadedImages.length > 1" class="grid grid-cols-4 gap-2">
                      <div
                        v-for="(img, idx) in uploadedImages.slice(0, 4)"
                        :key="idx"
                        class="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600"
                      >
                        <img :src="img.url" :alt="`Image ${idx + 1}`" class="h-full w-full object-cover" />
                      </div>
                    </div>
                  </div>

                  <!-- Product Info -->
                  <div class="space-y-4">
                    <!-- Title -->
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ name || 'Product Name' }}
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
                          ৳{{ Number(salePrice || price || 0).toLocaleString('en-BD') }}
                        </span>
                        <span
                          v-if="salePrice && price && Number(salePrice) < Number(price)"
                          class="text-lg text-gray-400 line-through"
                        >
                          ৳{{ Number(price).toLocaleString('en-BD') }}
                        </span>
                        <span
                          v-if="salePrice && price && Number(salePrice) < Number(price)"
                          class="rounded bg-danger-100 px-2 py-0.5 text-sm font-medium text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
                        >
                          -{{ Math.round((1 - Number(salePrice) / Number(price)) * 100) }}%
                        </span>
                      </div>
                    </div>

                    <!-- Short Description -->
                    <p v-if="shortDescription" class="text-gray-600 dark:text-gray-300">
                      {{ shortDescription }}
                    </p>

                    <!-- Stock Status -->
                    <div class="flex items-center gap-2">
                      <span
                        :class="[
                          'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                          (productType === 'variable' ? variants.filter(v => v.stock_quantity > 0).length > 0 : Number(stockQuantity) > 0)
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
                          {{ Number(stockQuantity) > 0 ? `In Stock (${stockQuantity})` : 'Out of Stock' }}
                        </template>
                      </span>
                    </div>

                    <!-- Variants preview -->
                    <div v-if="productType === 'variable' && variantAttributes.length > 0" class="space-y-3">
                      <div v-for="attr in variantAttributes" :key="attr.id" class="space-y-2">
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ attr.name }}:</p>
                        <div class="flex flex-wrap gap-2">
                          <span
                            v-for="opt in attr.options"
                            :key="opt.id"
                            class="rounded-md border border-gray-300 px-3 py-1 text-sm hover:border-primary-500 dark:border-gray-600"
                          >
                            {{ opt.label }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- SKU -->
                    <p v-if="sku" class="text-sm text-gray-500">
                      SKU: {{ sku }}
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
                    v-if="description"
                    class="prose prose-sm max-w-none dark:prose-invert"
                    v-html="sanitizeHtml(description)"
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
  </div>
</template>
