<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Reset Password Page — Set new password -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { authService } from '@/services'
import { useToast } from '@/composables'
import FormInput from '@/components/form/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const token = ref<string>('')
const email = ref<string>('')
const resetComplete = ref(false)
const invalidToken = ref(false)

// Get token from URL
onMounted(() => {
  token.value = (route.query.token as string) || ''
  email.value = (route.query.email as string) || ''

  if (!token.value) {
    invalidToken.value = true
  }
})

// Form validation schema
const resetPasswordSchema = toTypedSchema(
  z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  }).refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })
)

// Form setup
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: resetPasswordSchema,
  initialValues: {
    password: '',
    password_confirmation: '',
  },
})

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  try {
    await authService.resetPassword({
      token: token.value,
      email: email.value,
      password: values.password,
      password_confirmation: values.password_confirmation,
    })

    resetComplete.value = true
    toast.success('Password reset successfully!')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to reset password')
  }
})
</script>

<template>
  <div>
    <!-- Invalid token state -->
    <div v-if="invalidToken" class="text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/50">
        <ExclamationTriangleIcon class="h-8 w-8 text-danger-600 dark:text-danger-400" />
      </div>

      <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
        Invalid reset link
      </h1>

      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        This password reset link is invalid or has expired.
      </p>

      <RouterLink
        to="/forgot-password"
        class="mt-8 inline-flex text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
      >
        Request a new link
      </RouterLink>
    </div>

    <!-- Success state -->
    <div v-else-if="resetComplete" class="text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/50">
        <CheckCircleIcon class="h-8 w-8 text-success-600 dark:text-success-400" />
      </div>

      <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
        Password reset complete
      </h1>

      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Your password has been successfully reset.<br />
        You can now sign in with your new password.
      </p>

      <BaseButton
        to="/login"
        variant="primary"
        size="lg"
        class="mt-8"
      >
        Sign in
      </BaseButton>
    </div>

    <!-- Form state -->
    <template v-else>
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Set new password
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your new password must be different from previous passwords
        </p>
      </div>

      <form @submit="onSubmit" class="space-y-6">
        <!-- Password -->
        <FormInput
          name="password"
          label="New password"
          type="password"
          placeholder="••••••••"
          required
          hint="Must be at least 8 characters"
        />

        <!-- Confirm password -->
        <FormInput
          name="password_confirmation"
          label="Confirm password"
          type="password"
          placeholder="••••••••"
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
          Reset password
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
