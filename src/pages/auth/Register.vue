<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Register Page — Vendor registration -->
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
import FormCheckbox from '@/components/form/FormCheckbox.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Form validation schema
const registerSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(11, 'Please enter a valid phone number'),
    shop_name: z.string().min(3, 'Shop name must be at least 3 characters'),
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
    name: '',
    email: '',
    phone: '',
    shop_name: '',
    password: '',
    password_confirmation: '',
    terms: false,
  },
})

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.register({
      name: values.name,
      email: values.email,
      phone: values.phone,
      shop_name: values.shop_name,
      password: values.password,
      password_confirmation: values.password_confirmation,
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
      <!-- Name -->
      <FormInput
        name="name"
        label="Full name"
        placeholder="John Doe"
        required
      />

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

      <!-- Shop name -->
      <FormInput
        name="shop_name"
        label="Shop name"
        placeholder="My Awesome Shop"
        required
        hint="This will be your public shop name"
      />

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
