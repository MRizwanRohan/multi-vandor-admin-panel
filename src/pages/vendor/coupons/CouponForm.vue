<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Coupon Form — Create/Edit vendor's own coupons -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { couponService, productService } from '@/services'
import { useToast, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { Product } from '@/types'
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
    { label: 'Coupons', to: '/vendor/coupons' },
    { label: pageTitle.value },
  ])
  
  if (isEditMode.value) {
    fetchCoupon()
  }
  fetchProducts()
})

// Data
const isLoading = ref(false)
const products = ref<Product[]>([])

// Form validation
const couponSchema = toTypedSchema(z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed']),
  discount_value: z.coerce.number().min(0),
  min_order_amount: z.coerce.number().min(0).optional(),
  max_discount_amount: z.coerce.number().min(0).optional().nullable(),
  usage_limit: z.coerce.number().int().min(1).optional().nullable(),
  per_customer_limit: z.coerce.number().int().min(1).optional().nullable(),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
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

// Selected products
const selectedProducts = ref<number[]>([])

// Options
const typeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (৳)' },
]

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
      type: coupon.type === 'free_shipping' ? 'percentage' : coupon.type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount_amount: coupon.max_discount_amount,
      usage_limit: coupon.usage_limit,
      per_customer_limit: coupon.per_customer_limit,
      starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
    })
    selectedProducts.value = coupon.applicable_products || []
  } catch (error) {
    toast.error('Failed to fetch coupon')
    router.push('/vendor/coupons')
  } finally {
    isLoading.value = false
  }
}

// Fetch products
async function fetchProducts() {
  try {
    const response = await productService.getAll({ per_page: 100 })
    products.value = response.data
  } catch (error) {
    products.value = []
  }
}

// Toggle product selection
function toggleProduct(id: number) {
  const index = selectedProducts.value.indexOf(id)
  if (index >= 0) {
    selectedProducts.value.splice(index, 1)
  } else {
    selectedProducts.value.push(id)
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
      applicable_products: selectedProducts.value.length > 0 ? selectedProducts.value : undefined,
    }
    
    if (isEditMode.value && couponId.value) {
      await couponService.update(couponId.value, payload)
      toast.success('Coupon updated successfully')
    } else {
      await couponService.create(payload)
      toast.success('Coupon created successfully')
    }
    
    router.push('/vendor/coupons')
  } catch (error) {
    toast.error(isEditMode.value ? 'Failed to update coupon' : 'Failed to create coupon')
  }
})

// Navigation
function goBack() {
  router.push('/vendor/coupons')
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
              placeholder="Describe the coupon terms"
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
            
            <div class="grid grid-cols-2 gap-4">
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
            />
          </div>
        </BaseCard>

        <!-- Usage & Validity -->
        <BaseCard title="Usage & Validity">
          <div class="grid grid-cols-2 gap-4 mb-4">
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
            />
          </div>
          
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

        <!-- Applicable Products -->
        <BaseCard title="Applicable Products">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Leave empty to apply coupon to all your products. Select specific products to restrict usage.
          </p>
          
          <div v-if="products.length === 0" class="text-center py-4 text-gray-500">
            No products available
          </div>
          
          <div v-else class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            <button
              v-for="product in products"
              :key="product.id"
              type="button"
              @click="toggleProduct(product.id)"
              :class="[
                'p-3 rounded-lg border text-left transition-colors',
                selectedProducts.includes(product.id)
                  ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              <p class="font-medium text-sm text-gray-900 dark:text-white truncate">
                {{ product.name }}
              </p>
              <p class="text-xs text-gray-500">{{ currency.formatCurrency(product.price) }}</p>
            </button>
          </div>
          
          <p v-if="selectedProducts.length > 0" class="mt-3 text-sm text-indigo-600 dark:text-indigo-400">
            {{ selectedProducts.length }} product(s) selected
          </p>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status -->
        <BaseCard title="Status">
          <FormSwitch
            v-model="isActive"
            v-bind="isActiveAttrs"
            label="Active"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Coupon will be available for use when active
          </p>
        </BaseCard>

        <!-- Preview -->
        <BaseCard title="Preview">
          <div class="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
            <div class="flex items-center justify-between mb-3">
              <TicketIcon class="h-8 w-8" />
              <span class="text-xs uppercase tracking-wider opacity-75">Your Store</span>
            </div>
            <div class="text-2xl font-bold mb-1">
              {{ code || 'CODE' }}
            </div>
            <div class="text-sm opacity-90 mb-3">
              {{ name || 'Coupon Name' }}
            </div>
            <div class="text-lg font-semibold">
              <template v-if="type === 'percentage'">
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
