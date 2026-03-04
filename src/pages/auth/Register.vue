<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Register Page — Vendor registration with all required fields -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores'
import { useToast } from '@/composables'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormCheckbox from '@/components/form/FormCheckbox.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// NID file refs
const nidFrontFile = ref<File | null>(null)
const nidBackFile = ref<File | null>(null)

// Business type options
const businessTypeOptions = [
  { value: 'food', label: 'Food & Beverages' },
  { value: 'clothing', label: 'Clothing & Fashion' },
  { value: 'gadget', label: 'Electronics & Gadgets' },
  { value: 'health', label: 'Health & Beauty' },
  { value: 'home', label: 'Home & Living' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'books', label: 'Books & Stationery' },
  { value: 'other', label: 'Other' },
]

// Form validation schema
const registerSchema = toTypedSchema(
  z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(11, 'Please enter a valid phone number'),
    store_name: z.string().min(3, 'Store name must be at least 3 characters'),
    business_type: z.string().min(1, 'Please select a business type'),
    nid_number: z.string().min(10, 'Please enter a valid NID number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  }).refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })
)

// Form setup
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: registerSchema,
  initialValues: {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    store_name: '',
    business_type: '',
    nid_number: '',
    password: '',
    password_confirmation: '',
    terms: false,
  },
})

// File handlers
function onNidFrontChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  nidFrontFile.value = file
}

function onNidBackChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  nidBackFile.value = file
}

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.register({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      store_name: values.store_name,
      business_type: values.business_type,
      nid_number: values.nid_number,
      password: values.password,
      password_confirmation: values.password_confirmation,
      user_type: 'vendor',
      nid_front_image: nidFrontFile.value,
      nid_back_image: nidBackFile.value,
    })

    toast.success('Registration successful! Welcome to MVE.')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Registration failed')
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Become a vendor
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Create your vendor account and start selling today
      </p>
    </div>

    <!-- Registration form -->
    <form @submit="onSubmit" class="space-y-5">
      <!-- Name row -->
      <div class="grid grid-cols-2 gap-4">
        <FormInput
          name="first_name"
          label="First name"
          placeholder="John"
          required
        />
        <FormInput
          name="last_name"
          label="Last name"
          placeholder="Doe"
          required
        />
      </div>

      <!-- Email -->
      <FormInput
        name="email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        required
      />

      <!-- Phone -->
      <FormInput
        name="phone"
        label="Phone number"
        type="tel"
        placeholder="01XXXXXXXXX"
        required
      />

      <!-- Store name -->
      <FormInput
        name="store_name"
        label="Store name"
        placeholder="My Awesome Shop"
        required
        hint="This will be your public store name"
      />

      <!-- Business type -->
      <FormSelect
        name="business_type"
        label="Business type"
        :options="businessTypeOptions"
        placeholder="Select your business type"
        required
      />

      <!-- NID Number -->
      <FormInput
        name="nid_number"
        label="NID number"
        placeholder="Enter your National ID number"
        required
        hint="Required for vendor verification"
      />

      <!-- NID Document Uploads -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            NID Front Image
          </label>
          <input
            type="file"
            accept="image/*"
            @change="onNidFrontChange"
            class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-400 dark:file:bg-primary-900/30 dark:file:text-primary-400"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            NID Back Image
          </label>
          <input
            type="file"
            accept="image/*"
            @change="onNidBackChange"
            class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-400 dark:file:bg-primary-900/30 dark:file:text-primary-400"
          />
        </div>
      </div>

      <!-- Password -->
      <FormInput
        name="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
      />

      <!-- Confirm password -->
      <FormInput
        name="password_confirmation"
        label="Confirm password"
        type="password"
        placeholder="••••••••"
        required
      />

      <!-- Terms -->
      <FormCheckbox
        name="terms"
        label="I agree to the terms and conditions"
        description="By registering, you agree to our Terms of Service and Privacy Policy"
      />

      <!-- Submit button -->
      <BaseButton
        type="submit"
        variant="primary"
        size="lg"
        block
        :loading="isSubmitting"
      >
        Create account
      </BaseButton>
    </form>

    <!-- Login link -->
    <p class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
      Already have an account?
      <RouterLink
        to="/login"
        class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
      >
        Sign in
      </RouterLink>
    </p>
  </div>
</template>
