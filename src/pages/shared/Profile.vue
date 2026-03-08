<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Profile Page — Admin & Vendor profile settings              -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore, useAuthStore, useNotificationStore } from '@/stores'
import { authService } from '@/services'
import { useToast } from '@/composables'
import { setItem, StorageKeys } from '@/utils/storage'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import NotificationToggle from '@/components/domain/NotificationToggle.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import {
  UserCircleIcon,
  BellIcon,
  ArrowTopRightOnSquareIcon,
  CameraIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()

const breadcrumbStore = useBreadcrumbStore()
const authStore = useAuthStore()
const toast = useToast()

// Active tab
const activeTab = ref('profile')

const tabs = [
  { id: 'profile',       label: 'Profile',       icon: UserCircleIcon },
  { id: 'password',      label: 'Security',       icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Notifications',  icon: BellIcon },
]

// ─── Avatar upload ────────────────────────────────────────────────
const avatarInputRef    = ref<HTMLInputElement | null>(null)
const avatarPreview     = ref<string | null>(authStore.user?.avatar ?? null)
const isUploadingAvatar = ref(false)

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { toast.error('Avatar must be under 2 MB'); return }
  avatarPreview.value = URL.createObjectURL(file)
  isUploadingAvatar.value = true
  try {
    const res = await authService.updateAvatar(file)
    if (authStore.user) {
      authStore.user.avatar = res.avatar
      setItem(StorageKeys.USER, authStore.user)
    }
    toast.success('Profile photo updated')
  } catch {
    toast.error('Failed to upload photo')
    avatarPreview.value = authStore.user?.avatar ?? null
  } finally {
    isUploadingAvatar.value = false
  }
}

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Profile Settings', [
    { label: 'Settings' },
    { label: 'Profile' },
  ])
})

// Profile form
const profileSchema = toTypedSchema(z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name:  z.string().min(1, 'Last name is required').max(50),
  email:      z.string().email('Invalid email address'),
  phone:      z.string().optional(),
}))

const {
  handleSubmit: handleProfileSubmit,
  errors:       profileErrors,
  defineField:  defineProfileField,
  isSubmitting: isUpdatingProfile,
} = useForm({
  validationSchema: profileSchema,
  initialValues: {
    first_name: authStore.user?.first_name ?? '',
    last_name:  authStore.user?.last_name  ?? '',
    email:      authStore.user?.email      ?? '',
    phone:      authStore.user?.phone      ?? '',
  },
})

const [firstName, firstNameAttrs] = defineProfileField('first_name')
const [lastName,  lastNameAttrs]  = defineProfileField('last_name')
const [email,     emailAttrs]     = defineProfileField('email')
const [phone,     phoneAttrs]     = defineProfileField('phone')

const profileSaved = ref(false)
const submitProfile = handleProfileSubmit(async (values) => {
  try {
    const updated = await authService.updateProfile(values)
    if (authStore.user) {
      Object.assign(authStore.user, updated)
      setItem(StorageKeys.USER, authStore.user)
    }
    profileSaved.value = true
    toast.success('Profile saved successfully')
    setTimeout(() => (profileSaved.value = false), 3000)
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to update profile')
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

const passwordSaved = ref(false)
const submitPassword = handlePasswordSubmit(async (values) => {
  try {
    await authService.changePassword({
      current_password:      values.currentPassword,
      password:              values.newPassword,
      password_confirmation: values.confirmPassword,
    })
    passwordSaved.value = true
    resetPasswordForm()
    toast.success('Password changed successfully')
    setTimeout(() => (passwordSaved.value = false), 4000)
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to change password')
  }
})

// Notification preferences (dynamic from API)
const notificationStore = useNotificationStore()
const isSavingNotifications = ref(false)
const isLoadingNotifications = ref(false)

const notificationForm = ref({
  email_promotional: true,
  email_newsletter: true,
  inapp_order_updates: true,
  inapp_reviews: true,
  push_enabled: false,
})

// Load preferences when notifications tab is first activated
const notificationsLoaded = ref(false)

async function loadNotificationPreferences() {
  if (notificationsLoaded.value) return
  isLoadingNotifications.value = true
  try {
    const prefs = await notificationStore.fetchPreferences()
    if (prefs) {
      notificationForm.value.email_promotional = prefs.email.promotional
      notificationForm.value.email_newsletter = prefs.email.newsletter
      notificationForm.value.inapp_order_updates = prefs.inapp.order_updates
      notificationForm.value.inapp_reviews = prefs.inapp.reviews
      notificationForm.value.push_enabled = prefs.push.enabled
    }
    notificationsLoaded.value = true
  } catch {
    // defaults already set
  } finally {
    isLoadingNotifications.value = false
  }
}

async function saveNotifications() {
  isSavingNotifications.value = true
  try {
    const success = await notificationStore.updatePreferences({
      email_promotional: notificationForm.value.email_promotional,
      email_newsletter: notificationForm.value.email_newsletter,
      inapp_order_updates: notificationForm.value.inapp_order_updates,
      inapp_reviews: notificationForm.value.inapp_reviews,
      push_enabled: notificationForm.value.push_enabled,
    })
    if (success) {
      toast.success('Notification settings saved')
    } else {
      toast.error('Failed to save notification settings')
    }
  } catch {
    toast.error('Failed to save notification settings')
  } finally {
    isSavingNotifications.value = false
  }
}

// Watch tab changes to load notifications when needed
watch(activeTab, (tab) => {
  if (tab === 'notifications') loadNotificationPreferences()
})

// ─── Helpers ──────────────────────────────────────────────────────
const userInitials = computed(() => {
  const u = authStore.user
  return `${u?.first_name?.charAt(0) ?? ''}${u?.last_name?.charAt(0) ?? ''}`.toUpperCase() || '?'
})

const roleBadge = computed(() => {
  const r = authStore.user?.userType ?? authStore.user?.user_type
  const map: Record<string, { label: string; cls: string }> = {
    admin:       { label: 'Admin',       cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    super_admin: { label: 'Super Admin', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    vendor:      { label: 'Vendor',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    customer:    { label: 'Customer',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  }
  return map[r ?? ''] ?? { label: r ?? 'User', cls: 'bg-gray-100 text-gray-600' }
})
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">

    <!-- ── Hero card ───────────────────────────────────────────── -->
    <BaseCard class="overflow-hidden !p-0">
      <div class="h-28 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-500" />
      <div class="flex flex-col items-start gap-4 px-6 pb-6 sm:flex-row sm:items-end">

        <!-- Avatar with upload -->
        <div class="-mt-12 shrink-0">
          <div class="relative">
            <div class="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-lg dark:border-gray-800">
              <img v-if="avatarPreview" :src="avatarPreview" :alt="authStore.user?.full_name" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center bg-primary-100 text-2xl font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                {{ userInitials }}
              </div>
            </div>
            <button
              type="button"
              class="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity hover:opacity-100"
              :class="{ 'opacity-100': isUploadingAvatar }"
              @click="avatarInputRef?.click()"
            >
              <span v-if="isUploadingAvatar" class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <CameraIcon v-else class="h-6 w-6 text-white" />
            </button>
            <input ref="avatarInputRef" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
          </div>
        </div>

        <!-- Name + meta -->
        <div class="flex flex-1 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ authStore.user?.full_name || 'Your Profile' }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
            <div class="mt-1.5 flex items-center gap-2">
              <span :class="['rounded-full px-2.5 py-0.5 text-xs font-semibold', roleBadge.cls]">
                {{ roleBadge.label }}
              </span>
              <span v-if="authStore.user?.status"
                :class="authStore.user.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700'"
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
              >{{ authStore.user.status }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 sm:text-right">
            Member since {{ authStore.user?.created_at
              ? new Date(authStore.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : '—' }}
          </p>
        </div>
      </div>
    </BaseCard>

    <!-- ── Tab nav ────────────────────────────────────────────── -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex items-center gap-2 rounded-t-lg border-b-2 px-5 py-3 text-sm font-medium transition-colors"
          :class="activeTab === tab.id
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- ═══════════ PROFILE TAB ═══════════ -->
    <BaseCard v-show="activeTab === 'profile'">
      <form @submit.prevent="submitProfile" class="space-y-8">

        <div class="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Personal Information</h2>
            <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Update your name, email and contact details</p>
          </div>
          <CheckCircleIcon v-if="profileSaved" class="h-6 w-6 text-green-500" />
        </div>

        <!-- Inline avatar row -->
        <div class="flex items-center gap-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/40">
          <div class="relative h-14 w-14 shrink-0">
            <div class="h-full w-full overflow-hidden rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <img v-if="avatarPreview" :src="avatarPreview" class="h-full w-full object-cover" alt="avatar" />
              <div v-else class="flex h-full w-full items-center justify-center text-base font-bold text-primary-600 dark:text-primary-400">
                {{ userInitials }}
              </div>
            </div>
            <span v-if="isUploadingAvatar" class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF · max 2 MB</p>
          </div>
          <BaseButton type="button" variant="secondary" size="sm" :loading="isUploadingAvatar" @click="avatarInputRef?.click()">
            <CameraIcon class="mr-1.5 h-4 w-4" />
            Change Photo
          </BaseButton>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <FormInput v-model="firstName" v-bind="firstNameAttrs" label="First Name" name="first_name" placeholder="John" :error="profileErrors.first_name" required />
          <FormInput v-model="lastName"  v-bind="lastNameAttrs"  label="Last Name"  name="last_name"  placeholder="Doe"  :error="profileErrors.last_name"  required />
          <FormInput v-model="email"     v-bind="emailAttrs"     label="Email Address" name="email" type="email" placeholder="john@example.com" :error="profileErrors.email" required />
          <FormInput v-model="phone"     v-bind="phoneAttrs"     label="Phone Number"  name="phone" type="tel"   placeholder="+1 555 000 0000"   :error="profileErrors.phone" />
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
          <Transition enter-from-class="opacity-0 -translate-x-2" enter-active-class="transition duration-300" leave-to-class="opacity-0 -translate-x-2" leave-active-class="transition duration-200">
            <span v-if="profileSaved" class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <CheckCircleIcon class="h-4 w-4" /> Saved
            </span>
          </Transition>
          <BaseButton type="submit" variant="primary" :loading="isUpdatingProfile">Save Changes</BaseButton>
        </div>
      </form>
    </BaseCard>

    <!-- ═══════════ SECURITY TAB ═══════════ -->
    <BaseCard v-show="activeTab === 'password'">
      <div class="space-y-8">

        <div class="flex items-start gap-4 border-b border-gray-100 pb-5 dark:border-gray-700">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <ShieldCheckIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
            <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Use a strong password with at least 8 characters, numbers and symbols.
            </p>
          </div>
        </div>

        <Transition enter-from-class="opacity-0 -translate-y-2" enter-active-class="transition duration-300" leave-to-class="opacity-0 -translate-y-2" leave-active-class="transition duration-200">
          <div v-if="passwordSaved" class="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20">
            <CheckCircleIcon class="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <p class="text-sm font-medium text-green-700 dark:text-green-400">Password changed successfully! Keep it safe.</p>
          </div>
        </Transition>

        <form @submit.prevent="submitPassword" class="space-y-5">
          <div class="max-w-md space-y-5">
            <FormInput v-model="currentPassword" v-bind="currentPasswordAttrs" label="Current Password"     name="currentPassword" type="password" placeholder="Enter current password" :error="passwordErrors.currentPassword" required />
            <FormInput v-model="newPassword"      v-bind="newPasswordAttrs"      label="New Password"         name="newPassword"      type="password" placeholder="Min. 8 characters"     :error="passwordErrors.newPassword"      hint="Must be at least 8 characters" required />
            <FormInput v-model="confirmPassword"  v-bind="confirmPasswordAttrs"  label="Confirm New Password" name="confirmPassword"  type="password" placeholder="Repeat new password"    :error="passwordErrors.confirmPassword"  required />
          </div>

          <div class="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0" />
            <span>After changing your password, you may need to log in again on other devices.</span>
          </div>

          <div class="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700">
            <BaseButton type="submit" variant="primary" :loading="isUpdatingPassword">Update Password</BaseButton>
          </div>
        </form>
      </div>
    </BaseCard>

    <!-- ═══════════ NOTIFICATIONS TAB ═══════════ -->
    <BaseCard v-show="activeTab === 'notifications'">
      <div class="space-y-6">

        <div class="border-b border-gray-100 pb-4 dark:border-gray-700">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Manage how and when you receive notifications</p>
        </div>

        <div v-if="isLoadingNotifications" class="flex justify-center py-10">
          <AppSpinner size="lg" />
        </div>

        <template v-else>
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <span class="h-1.5 w-1.5 rounded-full bg-blue-500" /> Email Notifications
            </h4>
            <div class="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-700/50 dark:border-gray-700">
              <NotificationToggle v-model="notificationForm.email_promotional" label="Promotional emails" description="Sales, special offers and featured products" />
              <NotificationToggle v-model="notificationForm.email_newsletter"  label="Newsletter"         description="Weekly digest of platform updates and insights" />
            </div>
          </div>

          <div>
            <h4 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <span class="h-1.5 w-1.5 rounded-full bg-purple-500" /> In-App Notifications
            </h4>
            <div class="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-700/50 dark:border-gray-700">
              <NotificationToggle v-model="notificationForm.inapp_order_updates" label="Order updates"         description="Status changes, shipping and delivery notifications" />
              <NotificationToggle v-model="notificationForm.inapp_reviews"       label="Review notifications" description="When reviews are posted, approved or responded to" />
            </div>
          </div>

          <div>
            <h4 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <span class="h-1.5 w-1.5 rounded-full bg-green-500" /> Push Notifications
            </h4>
            <div class="rounded-xl border border-gray-100 dark:border-gray-700">
              <NotificationToggle v-model="notificationForm.push_enabled" label="Browser push notifications" description="Real-time alerts even when the dashboard is in the background" />
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
            <button type="button"
              class="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              @click="router.push(authStore.isAdmin ? '/admin/notifications/preferences' : '/vendor/notifications/preferences')"
            >
              All notification settings
              <ArrowTopRightOnSquareIcon class="h-4 w-4" />
            </button>
            <BaseButton variant="primary" :loading="isSavingNotifications" @click="saveNotifications">
              Save Preferences
            </BaseButton>
          </div>
        </template>
      </div>
    </BaseCard>

  </div>
</template>
