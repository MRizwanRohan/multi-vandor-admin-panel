<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- General Settings — Site-wide general settings -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'

const toast = useToast()

// General settings
const generalSettings = ref({
  siteName: 'MVE Marketplace',
  siteDescription: 'Multi-vendor e-commerce marketplace',
  supportEmail: 'support@mve.com',
  supportPhone: '+880123456789',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
  maintenanceMode: false,
  enableRegistration: true,
  enableGuestCheckout: true,
})

// Currency options
const currencyOptions = [
  { value: 'BDT', label: 'BDT - Bangladeshi Taka (৳)' },
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
]

// Timezone options
const timezoneOptions = [
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
]

// Loading state
const isSaving = ref(false)
const isLoading = ref(true)

// Fetch settings
onMounted(async () => {
  try {
    const data = await settingsService.getSettings()
    if (data.general) {
      generalSettings.value = { ...generalSettings.value, ...data.general }
    }
  } catch (error) {
    // Use default values
  } finally {
    isLoading.value = false
  }
})

// Save settings
async function saveSettings() {
  isSaving.value = true
  try {
    await settingsService.updateSettings('general', generalSettings.value)
    toast.success('General settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseCard v-if="!isLoading" class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
      General Settings
    </h3>

    <div class="grid gap-4 sm:grid-cols-2">
      <FormInput
        v-model="generalSettings.siteName"
        label="Site Name"
        name="siteName"
        required
      />

      <FormInput
        v-model="generalSettings.supportEmail"
        label="Support Email"
        name="supportEmail"
        type="email"
        required
      />
    </div>

    <FormTextarea
      v-model="generalSettings.siteDescription"
      label="Site Description"
      name="siteDescription"
      :rows="3"
    />

    <div class="grid gap-4 sm:grid-cols-2">
      <FormInput
        v-model="generalSettings.supportPhone"
        label="Support Phone"
        name="supportPhone"
        type="tel"
      />

      <FormSelect
        v-model="generalSettings.currency"
        label="Default Currency"
        name="currency"
        :options="currencyOptions"
        required
      />
    </div>

    <FormSelect
      v-model="generalSettings.timezone"
      label="Timezone"
      name="timezone"
      :options="timezoneOptions"
      required
    />

    <div class="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h4 class="font-medium text-gray-900 dark:text-white">Site Features</h4>
      
      <FormSwitch
        v-model="generalSettings.maintenanceMode"
        name="maintenanceMode"
        label="Maintenance Mode"
        description="Enable to show maintenance page to visitors"
      />

      <FormSwitch
        v-model="generalSettings.enableRegistration"
        name="enableRegistration"
        label="Enable User Registration"
        description="Allow new users to register accounts"
      />

      <FormSwitch
        v-model="generalSettings.enableGuestCheckout"
        name="enableGuestCheckout"
        label="Enable Guest Checkout"
        description="Allow customers to checkout without creating an account"
      />
    </div>

    <!-- Save button -->
    <div class="flex justify-end pt-4">
      <BaseButton variant="primary" :loading="isSaving" @click="saveSettings">
        Save Changes
      </BaseButton>
    </div>
  </BaseCard>

  <!-- Loading state -->
  <div v-else class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
</template>
