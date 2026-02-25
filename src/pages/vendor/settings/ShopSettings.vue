<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Shop Settings — Shop configuration page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore, useAuthStore } from '@/stores'
import { vendorService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import { BuildingStorefrontIcon } from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const authStore = useAuthStore()
const toast = useToast()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Shop Settings', [
    { label: 'Settings' },
    { label: 'Shop' },
  ], 'Configure your shop information')
})

// Form validation
const shopSchema = toTypedSchema(z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
  shopDescription: z.string().optional(),
  shopLogo: z.string().optional(),
  shopBanner: z.string().optional(),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  businessEmail: z.string().email('Invalid email'),
  businessPhone: z.string().min(1, 'Phone number is required'),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
} = useForm({
  validationSchema: shopSchema,
  initialValues: {
    shopName: 'Fashion Store',
    shopDescription: 'Premium fashion clothing and accessories for men and women.',
    shopLogo: '',
    shopBanner: '',
    street: '123 Fashion Street',
    city: 'Dhaka',
    state: 'Dhaka',
    postalCode: '1205',
    country: 'Bangladesh',
    businessEmail: 'shop@fashionstore.com',
    businessPhone: '+880123456789',
  },
})

const [shopName, shopNameAttrs] = defineField('shopName')
const [shopDescription, shopDescriptionAttrs] = defineField('shopDescription')
const [street, streetAttrs] = defineField('street')
const [city, cityAttrs] = defineField('city')
const [state, stateAttrs] = defineField('state')
const [postalCode, postalCodeAttrs] = defineField('postalCode')
const [country, countryAttrs] = defineField('country')
const [businessEmail, businessEmailAttrs] = defineField('businessEmail')
const [businessPhone, businessPhoneAttrs] = defineField('businessPhone')

// Submit form
const onSubmit = handleSubmit(async (values) => {
  try {
    await vendorService.updateShop(authStore.user?.id || '', values)
    toast.success('Shop settings updated successfully')
  } catch (error) {
    toast.error('Failed to update shop settings')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Shop branding -->
      <BaseCard>
        <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Shop Branding
        </h3>

        <div class="mb-6 flex items-center gap-6">
          <div class="relative">
            <div class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
              <BuildingStorefrontIcon class="h-12 w-12 text-gray-400" />
            </div>
            <button
              type="button"
              class="absolute -bottom-2 -right-2 rounded-full bg-primary-600 p-2 text-white shadow-lg hover:bg-primary-700"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">Shop Logo</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              JPG, PNG or SVG. 200x200 recommended.
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <FormInput
            v-model="shopName"
            v-bind="shopNameAttrs"
            label="Shop Name"
            name="shopName"
            :error="errors.shopName"
            required
          />

          <FormTextarea
            v-model="shopDescription"
            v-bind="shopDescriptionAttrs"
            label="Shop Description"
            name="shopDescription"
            :rows="4"
            :error="errors.shopDescription"
            hint="Describe your shop and what you sell"
          />
        </div>
      </BaseCard>

      <!-- Business contact -->
      <BaseCard>
        <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Business Contact
        </h3>

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="businessEmail"
            v-bind="businessEmailAttrs"
            label="Business Email"
            name="businessEmail"
            type="email"
            :error="errors.businessEmail"
            required
          />

          <FormInput
            v-model="businessPhone"
            v-bind="businessPhoneAttrs"
            label="Business Phone"
            name="businessPhone"
            type="tel"
            :error="errors.businessPhone"
            required
          />
        </div>
      </BaseCard>

      <!-- Business address -->
      <BaseCard>
        <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Business Address
        </h3>

        <div class="space-y-4">
          <FormInput
            v-model="street"
            v-bind="streetAttrs"
            label="Street Address"
            name="street"
            :error="errors.street"
            required
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="city"
              v-bind="cityAttrs"
              label="City"
              name="city"
              :error="errors.city"
              required
            />

            <FormInput
              v-model="state"
              v-bind="stateAttrs"
              label="State/Division"
              name="state"
              :error="errors.state"
              required
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="postalCode"
              v-bind="postalCodeAttrs"
              label="Postal Code"
              name="postalCode"
              :error="errors.postalCode"
              required
            />

            <FormInput
              v-model="country"
              v-bind="countryAttrs"
              label="Country"
              name="country"
              :error="errors.country"
              required
            />
          </div>
        </div>
      </BaseCard>

      <!-- Submit -->
      <div class="flex justify-end">
        <BaseButton type="submit" variant="primary" :loading="isSubmitting">
          Save Changes
        </BaseButton>
      </div>
    </form>
  </div>
</template>
