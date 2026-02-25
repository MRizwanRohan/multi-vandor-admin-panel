<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Vendor Form — Edit vendor details and settings -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { vendorService } from '@/services'
import { useCurrency, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { VendorDetail } from '@/types'
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const currency = useCurrency()

// Vendor ID
const vendorId = computed(() => {
  const raw = route.params.id as string
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Edit Vendor', [
    { label: 'Vendors', to: '/admin/vendors' },
    { label: 'Edit Vendor' },
  ])
  
  if (vendorId.value) {
    fetchVendor()
  } else {
    router.push('/admin/vendors')
  }
})

// Data
const isLoading = ref(true)
const vendor = ref<VendorDetail | null>(null)
const logoPreview = ref<string | null>(null)
const selectedLogo = ref<File | null>(null)
const bannerPreview = ref<string | null>(null)
const selectedBanner = ref<File | null>(null)

// Form validation
const vendorSchema = toTypedSchema(z.object({
  store_name: z.string().min(2, 'Store name must be at least 2 characters'),
  business_name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'active', 'suspended', 'rejected']),
  commission_rate: z.coerce.number().min(0).max(100),
  commission_type: z.enum(['percentage', 'fixed']),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
  return_policy: z.string().optional(),
  shipping_policy: z.string().optional(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: vendorSchema,
  initialValues: {
    store_name: '',
    business_name: '',
    description: '',
    status: 'pending' as const,
    commission_rate: 10,
    commission_type: 'percentage' as const,
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Bangladesh',
    tax_id: '',
    return_policy: '',
    shipping_policy: '',
  },
})

const [storeName, storeNameAttrs] = defineField('store_name')
const [businessName, businessNameAttrs] = defineField('business_name')
const [description, descriptionAttrs] = defineField('description')
const [status, statusAttrs] = defineField('status')
const [commissionRate, commissionRateAttrs] = defineField('commission_rate')
const [commissionType, commissionTypeAttrs] = defineField('commission_type')
const [phone, phoneAttrs] = defineField('phone')
const [address, addressAttrs] = defineField('address')
const [city, cityAttrs] = defineField('city')
const [state, stateAttrs] = defineField('state')
const [postalCode, postalCodeAttrs] = defineField('postal_code')
const [country, countryAttrs] = defineField('country')
const [taxId, taxIdAttrs] = defineField('tax_id')
const [returnPolicy, returnPolicyAttrs] = defineField('return_policy')
const [shippingPolicy, shippingPolicyAttrs] = defineField('shipping_policy')

// Options
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
]

const commissionTypeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
]

// Get status badge color
function getStatusColor(s: string): 'yellow' | 'green' | 'red' | 'gray' {
  const colors: Record<string, 'yellow' | 'green' | 'red' | 'gray'> = {
    pending: 'yellow',
    active: 'green',
    suspended: 'red',
    rejected: 'gray',
  }
  return colors[s] || 'gray'
}

// Fetch vendor
async function fetchVendor() {
  if (!vendorId.value) return
  
  isLoading.value = true
  try {
    const data = await vendorService.getById(vendorId.value)
    vendor.value = data as VendorDetail
    
    setValues({
      store_name: data.store_name,
      business_name: data.business_name || '',
      description: data.description || '',
      status: data.status as 'pending',
      commission_rate: data.commission_rate,
      commission_type: 'percentage',
      phone: data.owner.phone || '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Bangladesh',
      tax_id: '',
      return_policy: (data as VendorDetail).return_policy || '',
      shipping_policy: (data as VendorDetail).shipping_policy || '',
    })
    
    logoPreview.value = data.logo_url
    bannerPreview.value = data.banner_url
  } catch (error) {
    toast.error('Failed to fetch vendor')
    router.push('/admin/vendors')
  } finally {
    isLoading.value = false
  }
}

// Image upload
function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload an image file')
    return
  }
  
  selectedLogo.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeLogo() {
  logoPreview.value = null
  selectedLogo.value = null
}

function handleBannerUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload an image file')
    return
  }
  
  selectedBanner.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    bannerPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeBanner() {
  bannerPreview.value = null
  selectedBanner.value = null
}

// Submit form
const onSubmit = handleSubmit(async (values) => {
  if (!vendorId.value) return
  
  try {
    const formData: Record<string, unknown> = {
      shop_name: values.store_name,
      shop_description: values.description,
      phone: values.phone,
      status: values.status,
      commission_rate: values.commission_rate,
      commission_type: values.commission_type,
      address: values.address,
      city: values.city,
      state: values.state,
      postal_code: values.postal_code,
      country: values.country,
      tax_id: values.tax_id,
    }
    
    if (selectedLogo.value) {
      formData.logo = selectedLogo.value
    }
    if (selectedBanner.value) {
      formData.banner = selectedBanner.value
    }
    
    await vendorService.update(vendorId.value, formData as Parameters<typeof vendorService.update>[1])
    toast.success('Vendor updated successfully')
    router.push('/admin/vendors')
  } catch (error) {
    toast.error('Failed to update vendor')
  }
})

// Navigation
function goBack() {
  router.push('/admin/vendors')
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
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Edit Vendor</h1>
          <p v-if="vendor" class="text-sm text-gray-500">{{ vendor.store_name }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <BaseButton variant="secondary" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">
          Update Vendor
        </BaseButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Store Information -->
        <BaseCard title="Store Information">
          <div class="space-y-4">
            <FormInput
              v-model="storeName"
              v-bind="storeNameAttrs"
              label="Store Name"
              :error="errors.store_name"
              required
            />
            
            <FormInput
              v-model="businessName"
              v-bind="businessNameAttrs"
              label="Business Name"
              :error="errors.business_name"
            />
            
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
              label="Store Description"
              :rows="4"
              :error="errors.description"
            />
          </div>
        </BaseCard>

        <!-- Store Images -->
        <BaseCard title="Store Images">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Logo -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Store Logo
              </label>
              <div v-if="logoPreview" class="relative inline-block">
                <img
                  :src="logoPreview"
                  alt="Store logo"
                  class="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  @click="removeLogo"
                  class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </div>
              <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <label class="flex flex-col items-center cursor-pointer">
                  <BuildingStorefrontIcon class="h-10 w-10 text-gray-400" />
                  <span class="mt-2 text-sm text-gray-500">Upload logo</span>
                  <input type="file" accept="image/*" class="hidden" @change="handleLogoUpload" />
                </label>
              </div>
            </div>

            <!-- Banner -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Store Banner
              </label>
              <div v-if="bannerPreview" class="relative inline-block">
                <img
                  :src="bannerPreview"
                  alt="Store banner"
                  class="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  @click="removeBanner"
                  class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </div>
              <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <label class="flex flex-col items-center cursor-pointer">
                  <PhotoIcon class="h-10 w-10 text-gray-400" />
                  <span class="mt-2 text-sm text-gray-500">Upload banner</span>
                  <input type="file" accept="image/*" class="hidden" @change="handleBannerUpload" />
                </label>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Contact & Address -->
        <BaseCard title="Contact & Address">
          <div class="space-y-4">
            <FormInput
              v-model="phone"
              v-bind="phoneAttrs"
              label="Phone"
              type="tel"
              :error="errors.phone"
            />
            
            <FormTextarea
              v-model="address"
              v-bind="addressAttrs"
              label="Address"
              :rows="2"
              :error="errors.address"
            />
            
            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="city"
                v-bind="cityAttrs"
                label="City"
                :error="errors.city"
              />
              <FormInput
                v-model="state"
                v-bind="stateAttrs"
                label="State/Division"
                :error="errors.state"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="postalCode"
                v-bind="postalCodeAttrs"
                label="Postal Code"
                :error="errors.postal_code"
              />
              <FormInput
                v-model="country"
                v-bind="countryAttrs"
                label="Country"
                :error="errors.country"
              />
            </div>
            
            <FormInput
              v-model="taxId"
              v-bind="taxIdAttrs"
              label="Tax ID / VAT Number"
              :error="errors.tax_id"
            />
          </div>
        </BaseCard>

        <!-- Policies -->
        <BaseCard title="Store Policies">
          <div class="space-y-4">
            <FormTextarea
              v-model="returnPolicy"
              v-bind="returnPolicyAttrs"
              label="Return Policy"
              :rows="4"
              :error="errors.return_policy"
            />
            
            <FormTextarea
              v-model="shippingPolicy"
              v-bind="shippingPolicyAttrs"
              label="Shipping Policy"
              :rows="4"
              :error="errors.shipping_policy"
            />
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Vendor Stats -->
        <BaseCard v-if="vendor" title="Vendor Overview">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Products</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ vendor.product_count }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Orders</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ vendor.order_count }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Total Sales</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ currency.formatCurrency(vendor.total_sales) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Rating</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ vendor.rating_average.toFixed(1) }} ({{ vendor.review_count }} reviews)
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Status & Commission -->
        <BaseCard title="Status & Commission">
          <div class="space-y-4">
            <FormSelect
              v-model="status"
              v-bind="statusAttrs"
              label="Status"
              :options="statusOptions"
              :error="errors.status"
            />
            
            <FormSelect
              v-model="commissionType"
              v-bind="commissionTypeAttrs"
              label="Commission Type"
              :options="commissionTypeOptions"
              :error="errors.commission_type"
            />
            
            <FormInput
              v-model="commissionRate"
              v-bind="commissionRateAttrs"
              :label="commissionType === 'percentage' ? 'Commission Rate (%)' : 'Commission Amount'"
              type="number"
              :min="0"
              :max="commissionType === 'percentage' ? 100 : undefined"
              :error="errors.commission_rate"
            />
            
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ commissionType === 'percentage' 
                ? `${commissionRate}% commission on each sale` 
                : `${currency.formatCurrency(commissionRate)} fixed commission per sale` 
              }}
            </p>
          </div>
        </BaseCard>

        <!-- Owner Info -->
        <BaseCard v-if="vendor" title="Owner Information">
          <div class="space-y-3">
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Name</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ vendor.owner.name }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Email</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ vendor.owner.email }}</p>
            </div>
            <div v-if="vendor.owner.phone">
              <span class="text-sm text-gray-500 dark:text-gray-400">Phone</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ vendor.owner.phone }}</p>
            </div>
            <div class="pt-2">
              <BaseBadge :color="vendor.is_verified ? 'green' : 'yellow'">
                {{ vendor.is_verified ? 'Verified' : 'Not Verified' }}
              </BaseBadge>
            </div>
          </div>
        </BaseCard>
      </div>
    </form>
  </div>
</template>
