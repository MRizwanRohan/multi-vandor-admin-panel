<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Notification Preferences Page — Manage email/in-app/push prefs -->
<!-- Shared between Admin and Vendor dashboards -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useBreadcrumbStore, useNotificationStore, useAuthStore } from '@/stores'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import NotificationToggle from '@/components/domain/NotificationToggle.vue'
import type { UpdateNotificationPreferencesPayload } from '@/types'
import {
  EnvelopeIcon,
  BellIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/vue/24/outline'

// ─────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────

const breadcrumbStore = useBreadcrumbStore()
const store = useNotificationStore()
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(true)
const isSaving = ref(false)
const hasChanges = ref(false)

// Is vendor user (for showing vendor-specific preferences)
const isVendor = computed(() => authStore.isVendor)

// ─────────────────────────────────────────────────────────────────
// Local form state (mirrors API preferences)
// ─────────────────────────────────────────────────────────────────

const form = reactive({
  // Email preferences
  email_promotional: true,
  email_new_products: true,
  email_special_offers: true,
  email_wishlist_alerts: true,
  email_newsletter: true,
  // Email vendor-specific
  email_new_orders: true,
  email_payout: true,

  // In-app preferences
  inapp_order_updates: true,
  inapp_reviews: true,
  inapp_stock_alerts: true,
  // In-app vendor-specific
  inapp_new_orders: true,
  inapp_low_stock: true,
  inapp_return_requests: true,

  // Push
  push_enabled: false,
})

// Track changes
watch(form, () => {
  hasChanges.value = true
}, { deep: true })

// ─────────────────────────────────────────────────────────────────
// Load preferences from API
// ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  breadcrumbStore.setPageInfo('Notification Preferences', [
    { label: 'Notifications', to: authStore.isAdmin ? '/admin/notifications' : '/vendor/notifications' },
    { label: 'Preferences' },
  ])

  isLoading.value = true
  try {
    const prefs = await store.fetchPreferences()
    if (prefs) {
      // Email
      form.email_promotional = prefs.email.promotional
      form.email_new_products = prefs.email.newProducts
      form.email_special_offers = prefs.email.specialOffers
      form.email_wishlist_alerts = prefs.email.wishlistAlerts
      form.email_newsletter = prefs.email.newsletter
      if (prefs.email.newOrders != null) form.email_new_orders = prefs.email.newOrders
      if (prefs.email.payout != null) form.email_payout = prefs.email.payout

      // In-app
      form.inapp_order_updates = prefs.inapp.orderUpdates
      form.inapp_reviews = prefs.inapp.reviews
      form.inapp_stock_alerts = prefs.inapp.stockAlerts
      if (prefs.inapp.newOrders != null) form.inapp_new_orders = prefs.inapp.newOrders
      if (prefs.inapp.lowStock != null) form.inapp_low_stock = prefs.inapp.lowStock
      if (prefs.inapp.returnRequests != null) form.inapp_return_requests = prefs.inapp.returnRequests

      // Push
      form.push_enabled = prefs.push.enabled
    }
    hasChanges.value = false
  } catch {
    // Defaults are already set in form
  } finally {
    isLoading.value = false
  }
})

// ─────────────────────────────────────────────────────────────────
// Save preferences
// ─────────────────────────────────────────────────────────────────

async function savePreferences() {
  isSaving.value = true
  try {
    const payload: UpdateNotificationPreferencesPayload = {
      email_promotional: form.email_promotional,
      email_new_products: form.email_new_products,
      email_special_offers: form.email_special_offers,
      email_wishlist_alerts: form.email_wishlist_alerts,
      email_newsletter: form.email_newsletter,
      inapp_order_updates: form.inapp_order_updates,
      inapp_reviews: form.inapp_reviews,
      inapp_stock_alerts: form.inapp_stock_alerts,
      push_enabled: form.push_enabled,
    }

    // Add vendor-specific fields only for vendors
    if (isVendor.value) {
      payload.email_new_orders = form.email_new_orders
      payload.email_payout = form.email_payout
      payload.inapp_new_orders = form.inapp_new_orders
      payload.inapp_low_stock = form.inapp_low_stock
      payload.inapp_return_requests = form.inapp_return_requests
    }

    const success = await store.updatePreferences(payload)
    if (success) {
      toast.success('Notification preferences updated successfully')
      hasChanges.value = false
    } else {
      toast.error('Failed to update preferences')
    }
  } catch {
    toast.error('Failed to update preferences')
  } finally {
    isSaving.value = false
  }
}

// ─────────────────────────────────────────────────────────────────
// Preference sections configuration
// ─────────────────────────────────────────────────────────────────

const emailPreferences = computed(() => {
  const prefs = [
    {
      key: 'email_promotional' as const,
      label: 'Promotional emails',
      description: 'Receive updates about sales and special offers',
    },
    {
      key: 'email_new_products' as const,
      label: 'New product announcements',
      description: 'Get notified when vendors you follow add new products',
    },
    {
      key: 'email_special_offers' as const,
      label: 'Special offers & coupons',
      description: 'Receive exclusive discounts and coupon codes',
    },
    {
      key: 'email_wishlist_alerts' as const,
      label: 'Wishlist alerts',
      description: 'Be notified when wishlist items go on sale or back in stock',
    },
    {
      key: 'email_newsletter' as const,
      label: 'Newsletter',
      description: 'Weekly digest of trending products and platform updates',
    },
  ]
  return prefs
})

const vendorEmailPreferences = computed(() => [
  {
    key: 'email_new_orders' as const,
    label: 'New order alerts',
    description: 'Get notified when customers place orders for your products',
  },
  {
    key: 'email_payout' as const,
    label: 'Payout notifications',
    description: 'Receive confirmation when payouts are processed',
  },
])

const inappPreferences = computed(() => [
  {
    key: 'inapp_order_updates' as const,
    label: 'Order updates',
    description: 'Status changes, shipping updates, delivery notifications',
  },
  {
    key: 'inapp_reviews' as const,
    label: 'Review notifications',
    description: 'When your reviews are approved or vendors respond',
  },
  {
    key: 'inapp_stock_alerts' as const,
    label: 'Stock alerts',
    description: 'When wishlist items are back in stock',
  },
])

const vendorInappPreferences = computed(() => [
  {
    key: 'inapp_new_orders' as const,
    label: 'New order alerts',
    description: 'Real-time alerts when orders are placed',
  },
  {
    key: 'inapp_low_stock' as const,
    label: 'Low stock warnings',
    description: 'Alert when product stock falls below threshold',
  },
  {
    key: 'inapp_return_requests' as const,
    label: 'Return request notifications',
    description: 'Get notified when customers request returns',
  },
])
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Notification Preferences
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Choose how you want to be notified about activities and updates
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <template v-else>
      <!-- Email Notifications -->
      <BaseCard>
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <EnvelopeIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Email Notifications
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Manage your email notification preferences
            </p>
          </div>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <NotificationToggle
            v-for="pref in emailPreferences"
            :key="pref.key"
            v-model="form[pref.key]"
            :label="pref.label"
            :description="pref.description"
          />
        </div>

        <!-- Vendor-specific email prefs -->
        <template v-if="isVendor">
          <hr class="my-4 border-gray-200 dark:border-gray-700" />
          <div class="mb-3">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vendor Email Notifications
            </h3>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <NotificationToggle
              v-for="pref in vendorEmailPreferences"
              :key="pref.key"
              v-model="form[pref.key]"
              :label="pref.label"
              :description="pref.description"
            />
          </div>
        </template>
      </BaseCard>

      <!-- In-App Notifications -->
      <BaseCard>
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
            <BellIcon class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              In-App Notifications
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Control what notifications appear in the app
            </p>
          </div>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <NotificationToggle
            v-for="pref in inappPreferences"
            :key="pref.key"
            v-model="form[pref.key]"
            :label="pref.label"
            :description="pref.description"
          />
        </div>

        <!-- Vendor-specific in-app prefs -->
        <template v-if="isVendor">
          <hr class="my-4 border-gray-200 dark:border-gray-700" />
          <div class="mb-3">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vendor In-App Notifications
            </h3>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <NotificationToggle
              v-for="pref in vendorInappPreferences"
              :key="pref.key"
              v-model="form[pref.key]"
              :label="pref.label"
              :description="pref.description"
            />
          </div>
        </template>
      </BaseCard>

      <!-- Push Notifications -->
      <BaseCard>
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
            <DevicePhoneMobileIcon class="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Push Notifications
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Enable browser push notifications for real-time alerts
            </p>
          </div>
        </div>

        <NotificationToggle
          v-model="form.push_enabled"
          label="Enable push notifications"
          description="Receive real-time browser notifications even when the app isn't in focus"
        />
      </BaseCard>

      <!-- Note about transactional emails -->
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div class="flex gap-3">
          <EnvelopeIcon class="h-5 w-5 shrink-0 text-blue-500" />
          <div>
            <p class="text-sm font-medium text-blue-800 dark:text-blue-300">
              Transactional emails are always sent
            </p>
            <p class="mt-1 text-sm text-blue-600 dark:text-blue-400">
              Important emails like order confirmations, password resets, and payment receipts will always be delivered regardless of your preferences.
            </p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex items-center justify-end gap-3">
        <span v-if="hasChanges" class="text-sm text-amber-600 dark:text-amber-400">
          You have unsaved changes
        </span>
        <BaseButton
          variant="primary"
          :loading="isSaving"
          :disabled="!hasChanges"
          @click="savePreferences"
        >
          Save Preferences
        </BaseButton>
      </div>
    </template>
  </div>
</template>
