<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Login Page — User authentication -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores'
import { useToast } from '@/composables'
import FormInput from '@/components/form/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// Form validation schema
const loginSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    remember: z.boolean().optional(),
  })
)

// Form setup
const { handleSubmit, isSubmitting, errors } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    email: '',
    password: '',
    remember: false,
  },
})

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.login({
      login: values.email,
      password: values.password,
      remember: values.remember,
    })

    toast.success('Welcome back!')

    // Redirect to intended page or dashboard
    const redirect = route.query.redirect as string
    if (redirect) {
      router.push(redirect)
    }
    // Router push is handled in auth store based on role
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Invalid credentials')
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Welcome back
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Sign in to your account to continue
      </p>
    </div>

    <!-- Login form -->
    <form @submit="onSubmit" class="space-y-6">
      <!-- Email -->
      <FormInput
        name="email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        required
      />

      <!-- Password -->
      <FormInput
        name="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
      />

      <!-- Remember me & Forgot password -->
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <label
            for="remember"
            class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Remember me
          </label>
        </div>

        <RouterLink
          to="/forgot-password"
          class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          Forgot password?
        </RouterLink>
      </div>

      <!-- Submit button -->
      <BaseButton
        type="submit"
        variant="primary"
        size="lg"
        block
        :loading="isSubmitting"
      >
        Sign in
      </BaseButton>
    </form>

    <!-- Register link -->
    <p class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
      Want to sell on our platform?
      <RouterLink
        to="/register"
        class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
      >
        Register as a vendor
      </RouterLink>
    </p>
  </div>
</template>
