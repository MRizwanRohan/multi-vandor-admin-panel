<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Payment Settings — Payment gateway configuration (Dynamic from API) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { settingsService } from '@/services'
import { useToast } from '@/composables'
import type { Setting } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DynamicSettingsForm from '@/components/domain/DynamicSettingsForm.vue'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'

const toast = useToast()
const GROUP = 'payment'

// State
const settings = ref<Setting[]>([])
const formValues = ref<Record<string, unknown>>({})
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref('')

// Initialize form values from settings
function initFormValues(settingsList: Setting[]) {
  const values: Record<string, unknown> = {}
  for (const s of settingsList) {
    values[s.key] = s.value ?? s.default_value
  }
  formValues.value = values
}

// Payment method status for overview
const paymentMethods = computed(() => {
  const getValue = (key: string) => {
    const val = formValues.value[key]
    return val === true || val === '1' || val === 1
  }
  return [
    { name: 'Cash on Delivery', key: 'cod_enabled', enabled: getValue('cod_enabled') },
    { name: 'Stripe', key: 'stripe_enabled', enabled: getValue('stripe_enabled') },
    { name: 'SSLCommerz', key: 'sslcommerz_enabled', enabled: getValue('sslcommerz_enabled') },
    { name: 'bKash', key: 'bkash_enabled', enabled: getValue('bkash_enabled') },
  ].filter((m) => settings.value.some((s) => s.key === m.key))
})

// Fetch settings
async function fetchSettings() {
  isLoading.value = true
  error.value = ''
  try {
    const data = await settingsService.getByGroup(GROUP)
    settings.value = data
    initFormValues(data)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load settings'
    toast.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// Save settings
async function saveSettings() {
  isSaving.value = true
  try {
    await settingsService.bulkUpdateGroup(GROUP, formValues.value)
    toast.success('Payment settings saved successfully')
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to save settings'
    toast.error(message)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>

  <!-- Error state -->
  <BaseCard v-else-if="error" class="text-center py-8">
    <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
    <BaseButton variant="secondary" size="sm" @click="fetchSettings">
      Retry
    </BaseButton>
  </BaseCard>

  <div v-else class="space-y-6">
    <!-- Payment Methods Overview -->
    <BaseCard v-if="paymentMethods.length > 0">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Payment Methods Overview
      </h3>
      
      <div class="space-y-3">
        <div
          v-for="method in paymentMethods"
          :key="method.key"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <span class="font-medium">{{ method.name }}</span>
          <BaseBadge :color="method.enabled ? 'green' : 'gray'" size="sm">
            <CheckCircleIcon v-if="method.enabled" class="h-4 w-4 mr-1" />
            <XCircleIcon v-else class="h-4 w-4 mr-1" />
            {{ method.enabled ? 'Enabled' : 'Disabled' }}
          </BaseBadge>
        </div>
      </div>
    </BaseCard>

    <!-- Settings Form -->
    <BaseCard class="space-y-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Payment Configuration
      </h3>

      <DynamicSettingsForm
        v-model="formValues"
        :settings="settings"
        :disabled="isSaving"
      />

      <!-- Save button -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <BaseButton variant="primary" :loading="isSaving" @click="saveSettings">
          Save Changes
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
