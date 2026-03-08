<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Coupon Form — Create/Edit coupon with full options -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { couponService, categoryService, productService, vendorService } from '@/services'
import { useToast, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { Category, Product, Vendor } from '@/types'
import { ArrowLeftIcon, TicketIcon, SparklesIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const currency = useCurrency()

// Mode detection
const couponId = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw || raw === 'new') return undefined
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})
const isEditMode = computed(() => couponId.value !== undefined)
const pageTitle = computed(() => isEditMode.value ? 'Edit Coupon' : 'Create Coupon')

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Coupons', to: '/admin/coupons' },
    { label: pageTitle.value },
  ])
  
  if (isEditMode.value) {
    fetchCoupon()
  }
  fetchData()
})

// Data
const isLoading = ref(false)
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const vendors = ref<Vendor[]>([])

// Form validation
const couponSchema = toTypedSchema(z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  discount_value: z.coerce.number().min(0),
  min_order_amount: z.coerce.number().min(0).optional(),
  max_discount_amount: z.coerce.number().min(0).optional().nullable(),
  usage_limit: z.coerce.number().int().min(1).optional().nullable(),
  per_customer_limit: z.coerce.number().int().min(1).optional().nullable(),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
  first_order_only: z.boolean(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: couponSchema,
  initialValues: {
    code: '',
    name: '',
    description: '',
    type: 'percentage' as const,
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: null as number | null,
    usage_limit: null as number | null,
    per_customer_limit: null as number | null,
    starts_at: '',
    expires_at: '',
    is_active: true,
    first_order_only: false,
  },
})

const [code, codeAttrs] = defineField('code')
const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')
const [type, typeAttrs] = defineField('type')
const [discountValue, discountValueAttrs] = defineField('discount_value')
const [minOrderAmount, minOrderAmountAttrs] = defineField('min_order_amount')
const [maxDiscountAmount, maxDiscountAmountAttrs] = defineField('max_discount_amount')
const [usageLimit, usageLimitAttrs] = defineField('usage_limit')
const [perCustomerLimit, perCustomerLimitAttrs] = defineField('per_customer_limit')
const [startsAt, startsAtAttrs] = defineField('starts_at')
const [expiresAt, expiresAtAttrs] = defineField('expires_at')
const [isActive, isActiveAttrs] = defineField('is_active')
const [firstOrderOnly, firstOrderOnlyAttrs] = defineField('first_order_only')

// Selected items
const selectedCategories = ref<number[]>([])
const selectedProducts = ref<number[]>([])
const selectedVendors = ref<number[]>([])
const excludedProducts = ref<number[]>([])

// Options
const typeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (৳)' },
  { value: 'free_shipping', label: 'Free Shipping' },
]

// Show discount value field
const showDiscountValue = computed(() => type.value !== 'free_shipping')

// Show max discount for percentage
const showMaxDiscount = computed(() => type.value === 'percentage')

// Generate random code
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  code.value = result
}

// Fetch coupon for editing
async function fetchCoupon() {
  if (!couponId.value) return
  
  isLoading.value = true
  try {
    const coupon = await couponService.getById(couponId.value)
    setValues({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount_amount: coupon.max_discount_amount,
      usage_limit: coupon.usage_limit,
      per_customer_limit: coupon.per_customer_limit,
      starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
      first_order_only: coupon.first_order_only,
    })
    selectedCategories.value = coupon.applicable_categories || []
    selectedProducts.value = coupon.applicable_products || []
    selectedVendors.value = coupon.applicable_vendors || []
    excludedProducts.value = coupon.excluded_products || []
  } catch (error) {
    toast.error('Failed to fetch coupon')
    router.push('/admin/coupons')
  } finally {
    isLoading.value = false
  }
}

// Fetch reference data (max 100 per page per backend limit)
async function fetchData() {
  try {
    const [catRes, prodRes, vendorRes] = await Promise.all([
      categoryService.getAll({ per_page: 100 }),
      productService.adminList({ per_page: 100 }),
      vendorService.getAll({ per_page: 100, status: 'active' }),
    ])
    categories.value = Array.isArray(catRes.data) ? catRes.data : []
    products.value = Array.isArray(prodRes.data) ? prodRes.data : []
    // Backend returns { vendors: [...], pagination: {...} } nested under .data
    const vData = vendorRes.data as any
    vendors.value = Array.isArray(vData) ? vData : (vData?.vendors ?? [])
  } catch (error: any) {
    console.error('Failed to fetch reference data:', error)
    toast.error(error.response?.data?.message || 'Failed to load reference data')
    categories.value = []
    products.value = []
    vendors.value = []
  }
}

// Category options
const categoryOptions = computed(() =>
  categories.value.map(c => ({ value: c.id, label: c.name }))
)

// Vendor options
const vendorOptions = computed(() =>
  vendors.value.map(v => ({ value: v.id, label: v.store_name }))
)

// Product options
const productOptions = computed(() =>
  products.value.map(p => ({ value: p.id, label: p.name }))
)

// Toggle selection
function toggleCategory(id: number) {
  const index = selectedCategories.value.indexOf(id)
  if (index >= 0) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(id)
  }
}

function toggleVendor(id: number) {
  const index = selectedVendors.value.indexOf(id)
  if (index >= 0) {
    selectedVendors.value.splice(index, 1)
  } else {
    selectedVendors.value.push(id)
  }
}

// Submit form
const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      code: values.code.toUpperCase(),
      name: values.name,
      description: values.description,
      type: values.type,
      discount_value: values.discount_value,
      min_order_amount: values.min_order_amount || undefined,
      max_discount_amount: values.max_discount_amount || undefined,
      usage_limit: values.usage_limit || undefined,
      per_customer_limit: values.per_customer_limit || undefined,
      starts_at: values.starts_at || undefined,
      expires_at: values.expires_at || undefined,
      is_active: values.is_active,
      first_order_only: values.first_order_only,
      applicable_categories: selectedCategories.value.length > 0 ? selectedCategories.value : undefined,
      applicable_products: selectedProducts.value.length > 0 ? selectedProducts.value : undefined,
      applicable_vendors: selectedVendors.value.length > 0 ? selectedVendors.value : undefined,
      excluded_products: excludedProducts.value.length > 0 ? excludedProducts.value : undefined,
    }
    
    if (isEditMode.value && couponId.value) {
      await couponService.update(couponId.value, payload)
      toast.success('Coupon updated successfully')
    } else {
      await couponService.create(payload)
      toast.success('Coupon created successfully')
    }
    
    router.push('/admin/coupons')
  } catch (error) {
    toast.error(isEditMode.value ? 'Failed to update coupon' : 'Failed to create coupon')
  }
})

// Navigation
function goBack() {
  router.push('/admin/coupons')
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
          {{ isEditMode ? 'Update Coupon' : 'Create Coupon' }}
        </BaseButton>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Information -->
        <BaseCard title="Basic Information">
          <div class="space-y-4">
            <div class="flex gap-4">
              <div class="flex-1">
                <FormInput
                  v-model="code"
                  v-bind="codeAttrs"
                  label="Coupon Code"
                  placeholder="e.g., SAVE20"
                  :error="errors.code"
                  required
                  class="uppercase"
                />
              </div>
              <div class="flex items-end">
                <BaseButton type="button" variant="secondary" @click="generateCode">
                  <SparklesIcon class="h-5 w-5 mr-2" />
                  Generate
                </BaseButton>
              </div>
            </div>
            
            <FormInput
              v-model="name"
              v-bind="nameAttrs"
              label="Coupon Name"
              placeholder="e.g., Summer Sale 20% Off"
              :error="errors.name"
              required
            />
            
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
              label="Description"
              placeholder="Describe the coupon terms and conditions"
              :rows="3"
              :error="errors.description"
            />
          </div>
        </BaseCard>

        <!-- Discount Settings -->
        <BaseCard title="Discount Settings">
          <div class="space-y-4">
            <FormSelect
              v-model="type"
              v-bind="typeAttrs"
              label="Discount Type"
              :options="typeOptions"
              :error="errors.type"
            />
            
            <div v-if="showDiscountValue" class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="discountValue"
                v-bind="discountValueAttrs"
                :label="type === 'percentage' ? 'Discount (%)' : 'Discount Amount'"
                type="number"
                :min="0"
                :max="type === 'percentage' ? 100 : undefined"
                :error="errors.discount_value"
                required
              />
              
              <FormInput
                v-if="showMaxDiscount"
                v-model="maxDiscountAmount"
                v-bind="maxDiscountAmountAttrs"
                label="Max Discount Amount"
                type="number"
                :min="0"
                :error="errors.max_discount_amount"
                hint="Leave empty for no limit"
              />
            </div>
            
            <FormInput
              v-model="minOrderAmount"
              v-bind="minOrderAmountAttrs"
              label="Minimum Order Amount"
              type="number"
              :min="0"
              :error="errors.min_order_amount"
              hint="Minimum cart value required to use this coupon"
            />
          </div>
        </BaseCard>

        <!-- Usage Limits -->
        <BaseCard title="Usage Limits">
          <div class="grid grid-cols-2 gap-4">
            <FormInput
              v-model="usageLimit"
              v-bind="usageLimitAttrs"
              label="Total Usage Limit"
              type="number"
              :min="1"
              :error="errors.usage_limit"
              hint="Leave empty for unlimited"
            />
            
            <FormInput
              v-model="perCustomerLimit"
              v-bind="perCustomerLimitAttrs"
              label="Per Customer Limit"
              type="number"
              :min="1"
              :error="errors.per_customer_limit"
              hint="Leave empty for unlimited"
            />
          </div>
        </BaseCard>

        <!-- Validity Period -->
        <BaseCard title="Validity Period">
          <div class="grid grid-cols-2 gap-4">
            <FormInput
              v-model="startsAt"
              v-bind="startsAtAttrs"
              label="Start Date"
              type="date"
              :error="errors.starts_at"
            />
            
            <FormInput
              v-model="expiresAt"
              v-bind="expiresAtAttrs"
              label="End Date"
              type="date"
              :error="errors.expires_at"
            />
          </div>
        </BaseCard>

        <!-- Applicable Items -->
        <BaseCard title="Applicable Items">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Leave all empty to apply coupon to all products. Select specific items to restrict usage.
          </p>
          
          <!-- Categories -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categories
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                @click="toggleCategory(cat.id)"
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  selectedCategories.includes(cat.id)
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>
          
          <!-- Vendors -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendors
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="vendor in vendors"
                :key="vendor.id"
                type="button"
                @click="toggleVendor(vendor.id)"
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  selectedVendors.includes(vendor.id)
                    ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
              >
                {{ vendor.store_name }}
              </button>
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
              Coupon will be available for use when active
            </p>
          </div>
        </BaseCard>

        <!-- Conditions -->
        <BaseCard title="Conditions">
          <div class="space-y-4">
            <FormSwitch
              v-model="firstOrderOnly"
              v-bind="firstOrderOnlyAttrs"
              label="First Order Only"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Only allow customers to use this coupon on their first order
            </p>
          </div>
        </BaseCard>

        <!-- Preview -->
        <BaseCard title="Coupon Preview">
          <div class="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
            <div class="flex items-center justify-between mb-3">
              <TicketIcon class="h-8 w-8" />
              <span class="text-xs uppercase tracking-wider opacity-75">Coupon</span>
            </div>
            <div class="text-2xl font-bold mb-1">
              {{ code || 'CODE' }}
            </div>
            <div class="text-sm opacity-90 mb-3">
              {{ name || 'Coupon Name' }}
            </div>
            <div class="text-lg font-semibold">
              <template v-if="type === 'free_shipping'">
                Free Shipping
              </template>
              <template v-else-if="type === 'percentage'">
                {{ discountValue }}% OFF
              </template>
              <template v-else>
                {{ currency.formatCurrency(discountValue) }} OFF
              </template>
            </div>
            <div v-if="minOrderAmount && Number(minOrderAmount) > 0" class="text-xs mt-2 opacity-75">
              Min. order: {{ currency.formatCurrency(minOrderAmount) }}
            </div>
          </div>
        </BaseCard>
      </div>
    </form>
  </div>
</template>
