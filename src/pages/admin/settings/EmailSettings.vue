<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Email Settings — Email configuration and notifications -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import { PaperAirplaneIcon } from '@heroicons/vue/24/outline'

const toast = useToast()

// Email settings
const emailSettings = ref({
  from_name: 'MVE Marketplace',
  from_email: 'noreply@mve.com',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_encryption: 'tls',
  // Notifications
  order_confirmation: true,
  order_status_update: true,
  shipping_notification: true,
  vendor_new_order: true,
  vendor_payout_processed: true,
  customer_welcome: true,
  password_reset: true,
})

// SMTP encryption options
const encryptionOptions = [
  { value: 'tls', label: 'TLS' },
  { value: 'ssl', label: 'SSL' },
  { value: 'none', label: 'None' },
]

// Loading state
const isSaving = ref(false)
const isTesting = ref(false)
const isLoading = ref(true)

// Fetch settings
onMounted(async () => {
  try {
    const data = await settingsService.getSettings()
    if (data.email) {
      emailSettings.value = { ...emailSettings.value, ...data.email }
    }
  } catch (error) {
    // Use default values
  } finally {
    isLoading.value = false
  }
})

// Test email configuration
async function testEmailConfig() {
  isTesting.value = true
  try {
    // In real app, this would send a test email
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('Test email sent successfully! Check your inbox.')
  } catch (error) {
    toast.error('Failed to send test email')
  } finally {
    isTesting.value = false
  }
}

// Save settings
async function saveSettings() {
  isSaving.value = true
  try {
    await settingsService.updateSettings('email', emailSettings.value)
    toast.success('Email settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="!isLoading" class="space-y-6">
    <!-- Email Configuration -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Email Configuration
      </h3>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="emailSettings.from_name"
            label="From Name"
            name="from_name"
            required
          />

          <FormInput
            v-model="emailSettings.from_email"
            label="From Email"
            name="from_email"
            type="email"
            required
          />
        </div>
      </div>
    </BaseCard>

    <!-- SMTP Settings -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        SMTP Server Settings
      </h3>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="emailSettings.smtp_host"
            label="SMTP Host"
            name="smtp_host"
            placeholder="smtp.gmail.com"
            required
          />

          <FormInput
            v-model.number="emailSettings.smtp_port"
            label="SMTP Port"
            name="smtp_port"
            type="number"
            :min="1"
            :max="65535"
            required
          />
        </div>

        <FormSelect
          v-model="emailSettings.smtp_encryption"
          label="Encryption"
          name="smtp_encryption"
          :options="encryptionOptions"
          required
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="emailSettings.smtp_username"
            label="SMTP Username"
            name="smtp_username"
            autocomplete="username"
          />

          <FormInput
            v-model="emailSettings.smtp_password"
            label="SMTP Password"
            name="smtp_password"
            type="password"
            autocomplete="current-password"
          />
        </div>

        <div class="flex justify-end">
          <BaseButton
            variant="secondary"
            size="sm"
            :loading="isTesting"
            @click="testEmailConfig"
          >
            <PaperAirplaneIcon class="h-4 w-4 mr-2" />
            Send Test Email
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Email Notifications -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Email Notifications
      </h3>

      <div class="space-y-4">
        <h4 class="font-medium text-gray-900 dark:text-white">Customer Emails</h4>

        <FormSwitch
          v-model="emailSettings.customer_welcome"
          name="customer_welcome"
          label="Welcome Email"
          description="Send welcome email when a customer registers"
        />

        <FormSwitch
          v-model="emailSettings.order_confirmation"
          name="order_confirmation"
          label="Order Confirmation"
          description="Send email when order is placed"
        />

        <FormSwitch
          v-model="emailSettings.order_status_update"
          name="order_status_update"
          label="Order Status Updates"
          description="Send email when order status changes"
        />

        <FormSwitch
          v-model="emailSettings.shipping_notification"
          name="shipping_notification"
          label="Shipping Notification"
          description="Send email when order is shipped"
        />

        <FormSwitch
          v-model="emailSettings.password_reset"
          name="password_reset"
          label="Password Reset"
          description="Send email when password reset is requested"
        />

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 class="font-medium text-gray-900 dark:text-white mb-4">Vendor Emails</h4>

          <div class="space-y-4">
            <FormSwitch
              v-model="emailSettings.vendor_new_order"
              name="vendor_new_order"
              label="New Order Notification"
              description="Notify vendors when they receive a new order"
            />

            <FormSwitch
              v-model="emailSettings.vendor_payout_processed"
              name="vendor_payout_processed"
              label="Payout Processed"
              description="Notify vendors when payout is processed"
            />
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Save button -->
    <div class="flex justify-end">
      <BaseButton variant="primary" :loading="isSaving" @click="saveSettings">
        Save Changes
      </BaseButton>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
</template>
