<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Forgot Password Page — Request password reset -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { authService } from '@/services'
import { useToast } from '@/composables'
import FormInput from '@/components/form/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

const toast = useToast()
const emailSent = ref(false)

// Form validation schema
const forgotPasswordSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email address'),
  })
)

// Form setup
const { handleSubmit, isSubmitting, values } = useForm({
  validationSchema: forgotPasswordSchema,
  initialValues: {
    email: '',
  },
})

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  try {
    await authService.forgotPassword({ email: values.email })
    emailSent.value = true
    toast.success('Password reset link sent!')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to send reset link')
  }
})
</script>

<template>
  <div>
    <!-- Success state -->
    <div v-if="emailSent" class="text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/50">
        <CheckCircleIcon class="h-8 w-8 text-success-600 dark:text-success-400" />
      </div>

      <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
        Check your email
      </h1>

      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        We've sent a password reset link to<br />
        <span class="font-medium text-gray-900 dark:text-white">{{ values.email }}</span>
      </p>

      <p class="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Didn't receive the email?
        <button
          type="button"
          class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          @click="emailSent = false"
        >
          Try again
        </button>
      </p>

      <RouterLink
        to="/login"
        class="mt-8 inline-flex text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        ← Back to login
      </RouterLink>
    </div>

    <!-- Form state -->
    <template v-else>
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Forgot password?
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No worries, we'll send you reset instructions
        </p>
      </div>

      <form @submit="onSubmit" class="space-y-6">
        <!-- Email -->
        <FormInput
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          required
        />

        <!-- Submit button -->
        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          block
          :loading="isSubmitting"
        >
          Send reset link
        </BaseButton>
      </form>

      <!-- Back to login -->
      <p class="mt-8 text-center">
        <RouterLink
          to="/login"
          class="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Back to login
        </RouterLink>
      </p>
    </template>
  </div>
</template>
