<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Profile Page — Shared profile settings for Admin and Vendor -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore, useAuthStore } from '@/stores'
import { authService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import { UserCircleIcon, KeyIcon, BellIcon } from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const authStore = useAuthStore()
const toast = useToast()

// Active tab
const activeTab = ref('profile')

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'password', label: 'Password', icon: KeyIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
]

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Profile Settings', [
    { label: 'Settings' },
    { label: 'Profile' },
  ])
})

// Profile form
const profileSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
}))

const {
  handleSubmit: handleProfileSubmit,
  errors: profileErrors,
  defineField: defineProfileField,
  isSubmitting: isUpdatingProfile,
  resetForm: resetProfileForm,
} = useForm({
  validationSchema: profileSchema,
  initialValues: {
    name: authStore.user?.full_name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
    avatar: authStore.user?.avatar || '',
  },
})

const [name, nameAttrs] = defineProfileField('name')
const [email, emailAttrs] = defineProfileField('email')
const [phone, phoneAttrs] = defineProfileField('phone')

const submitProfile = handleProfileSubmit(async (values) => {
  try {
    await authService.updateProfile(values)
    toast.success('Profile updated successfully')
  } catch (error) {
    toast.error('Failed to update profile')
  }
})

// Password form
const passwordSchema = toTypedSchema(z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}))

const {
  handleSubmit: handlePasswordSubmit,
  errors: passwordErrors,
  defineField: definePasswordField,
  isSubmitting: isUpdatingPassword,
  resetForm: resetPasswordForm,
} = useForm({
  validationSchema: passwordSchema,
})

const [currentPassword, currentPasswordAttrs] = definePasswordField('currentPassword')
const [newPassword, newPasswordAttrs] = definePasswordField('newPassword')
const [confirmPassword, confirmPasswordAttrs] = definePasswordField('confirmPassword')

const submitPassword = handlePasswordSubmit(async (values) => {
  try {
    await authService.changePassword({
      current_password: values.currentPassword,
      password: values.newPassword,
      password_confirmation: values.confirmPassword,
    })
    toast.success('Password updated successfully')
    resetPasswordForm()
  } catch (error) {
    toast.error('Failed to update password')
  }
})

// Notification settings
const notificationSettings = ref({
  emailOrders: true,
  emailMarketing: false,
  pushOrders: true,
  pushMessages: true,
})

const isSavingNotifications = ref(false)

async function saveNotifications() {
  isSavingNotifications.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Notification settings saved')
  } finally {
    isSavingNotifications.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors"
          :class="[
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="h-5 w-5" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Profile tab -->
    <BaseCard v-show="activeTab === 'profile'">
      <form @submit.prevent="submitProfile" class="space-y-6">
        <div class="flex items-center gap-6">
          <div class="relative">
            <div class="h-20 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <img
                v-if="authStore.user?.avatar"
                :src="authStore.user.avatar"
                :alt="authStore.user.full_name"
                class="h-full w-full object-cover"
              />
              <UserCircleIcon v-else class="h-full w-full text-gray-400" />
            </div>
            <button
              type="button"
              class="absolute bottom-0 right-0 rounded-full bg-primary-600 p-1.5 text-white shadow-lg hover:bg-primary-700"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Profile Photo
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              JPG, GIF or PNG. Max size of 2MB.
            </p>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <FormInput
            v-model="name"
            v-bind="nameAttrs"
            label="Full Name"
            name="name"
            :error="profileErrors.name"
            required
          />

          <FormInput
            v-model="email"
            v-bind="emailAttrs"
            label="Email Address"
            name="email"
            type="email"
            :error="profileErrors.email"
            required
          />

          <FormInput
            v-model="phone"
            v-bind="phoneAttrs"
            label="Phone Number"
            name="phone"
            type="tel"
            :error="profileErrors.phone"
          />
        </div>

        <div class="flex justify-end">
          <BaseButton type="submit" variant="primary" :loading="isUpdatingProfile">
            Save Changes
          </BaseButton>
        </div>
      </form>
    </BaseCard>

    <!-- Password tab -->
    <BaseCard v-show="activeTab === 'password'">
      <form @submit.prevent="submitPassword" class="space-y-6">
        <div class="max-w-md space-y-6">
          <FormInput
            v-model="currentPassword"
            v-bind="currentPasswordAttrs"
            label="Current Password"
            name="currentPassword"
            type="password"
            :error="passwordErrors.currentPassword"
            required
          />

          <FormInput
            v-model="newPassword"
            v-bind="newPasswordAttrs"
            label="New Password"
            name="newPassword"
            type="password"
            :error="passwordErrors.newPassword"
            hint="Must be at least 8 characters"
            required
          />

          <FormInput
            v-model="confirmPassword"
            v-bind="confirmPasswordAttrs"
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            :error="passwordErrors.confirmPassword"
            required
          />
        </div>

        <div class="flex justify-end">
          <BaseButton type="submit" variant="primary" :loading="isUpdatingPassword">
            Update Password
          </BaseButton>
        </div>
      </form>
    </BaseCard>

    <!-- Notifications tab -->
    <BaseCard v-show="activeTab === 'notifications'">
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Email Notifications
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Manage your email notification preferences
          </p>
        </div>

        <div class="space-y-4">
          <label class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Order Updates</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Receive emails about order status changes
              </p>
            </div>
            <input
              v-model="notificationSettings.emailOrders"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          <label class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Marketing</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Receive promotional emails and offers
              </p>
            </div>
            <input
              v-model="notificationSettings.emailMarketing"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>

        <hr class="border-gray-200 dark:border-gray-700" />

        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Push Notifications
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Manage your push notification preferences
          </p>
        </div>

        <div class="space-y-4">
          <label class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Order Updates</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Get push notifications for order updates
              </p>
            </div>
            <input
              v-model="notificationSettings.pushOrders"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          <label class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Messages</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Get push notifications for new messages
              </p>
            </div>
            <input
              v-model="notificationSettings.pushMessages"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>

        <div class="flex justify-end">
          <BaseButton variant="primary" :loading="isSavingNotifications" @click="saveNotifications">
            Save Preferences
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
