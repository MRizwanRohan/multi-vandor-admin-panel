<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Payment Settings — Payment gateway configuration -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'

const toast = useToast()

// Payment settings
const paymentSettings = ref({
  cod_enabled: true,
  online_payment_enabled: true,
  stripe_enabled: false,
  stripe_public_key: '',
  stripe_secret_key: '',
  paypal_enabled: false,
  paypal_client_id: '',
  paypal_secret: '',
  paypal_mode: 'sandbox',
  sslcommerz_enabled: true,
  sslcommerz_store_id: '',
  sslcommerz_store_password: '',
  sslcommerz_mode: 'sandbox',
  bkash_enabled: false,
  bkash_app_key: '',
  bkash_app_secret: '',
  bkash_username: '',
  bkash_password: '',
  bkash_mode: 'sandbox',
})

// Mode options
const modeOptions = [
  { value: 'sandbox', label: 'Sandbox (Test)' },
  { value: 'live', label: 'Live (Production)' },
]

// Loading state
const isSaving = ref(false)
const isLoading = ref(true)

// Fetch settings
onMounted(async () => {
  try {
    const data = await settingsService.getSettings()
    if (data.payment) {
      paymentSettings.value = { ...paymentSettings.value, ...data.payment }
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
    await settingsService.updateSettings('payment', paymentSettings.value)
    toast.success('Payment settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="!isLoading" class="space-y-6">
    <!-- Payment Methods Overview -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Payment Methods
      </h3>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span class="font-medium">Cash on Delivery</span>
          <BaseBadge :color="paymentSettings.cod_enabled ? 'green' : 'gray'" size="sm">
            <CheckCircleIcon v-if="paymentSettings.cod_enabled" class="h-4 w-4 mr-1" />
            <XCircleIcon v-else class="h-4 w-4 mr-1" />
            {{ paymentSettings.cod_enabled ? 'Enabled' : 'Disabled' }}
          </BaseBadge>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span class="font-medium">Stripe</span>
          <BaseBadge :color="paymentSettings.stripe_enabled ? 'green' : 'gray'" size="sm">
            <CheckCircleIcon v-if="paymentSettings.stripe_enabled" class="h-4 w-4 mr-1" />
            <XCircleIcon v-else class="h-4 w-4 mr-1" />
            {{ paymentSettings.stripe_enabled ? 'Enabled' : 'Disabled' }}
          </BaseBadge>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span class="font-medium">SSLCommerz</span>
          <BaseBadge :color="paymentSettings.sslcommerz_enabled ? 'green' : 'gray'" size="sm">
            <CheckCircleIcon v-if="paymentSettings.sslcommerz_enabled" class="h-4 w-4 mr-1" />
            <XCircleIcon v-else class="h-4 w-4 mr-1" />
            {{ paymentSettings.sslcommerz_enabled ? 'Enabled' : 'Disabled' }}
          </BaseBadge>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span class="font-medium">bKash</span>
          <BaseBadge :color="paymentSettings.bkash_enabled ? 'green' : 'gray'" size="sm">
            <CheckCircleIcon v-if="paymentSettings.bkash_enabled" class="h-4 w-4 mr-1" />
            <XCircleIcon v-else class="h-4 w-4 mr-1" />
            {{ paymentSettings.bkash_enabled ? 'Enabled' : 'Disabled' }}
          </BaseBadge>
        </div>
      </div>
    </BaseCard>

    <!-- Cash on Delivery -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cash on Delivery
      </h3>
      
      <FormSwitch
        v-model="paymentSettings.cod_enabled"
        name="cod_enabled"
        label="Enable Cash on Delivery"
        description="Allow customers to pay when they receive their order"
      />
    </BaseCard>

    <!-- Stripe -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Stripe Payment Gateway
      </h3>
      
      <FormSwitch
        v-model="paymentSettings.stripe_enabled"
        name="stripe_enabled"
        label="Enable Stripe"
        description="Accept credit/debit card payments via Stripe"
        class="mb-4"
      />

      <div v-if="paymentSettings.stripe_enabled" class="space-y-4">
        <FormInput
          v-model="paymentSettings.stripe_public_key"
          label="Publishable Key"
          name="stripe_public_key"
          placeholder="pk_test_..."
        />
        
        <FormInput
          v-model="paymentSettings.stripe_secret_key"
          label="Secret Key"
          name="stripe_secret_key"
          type="password"
          placeholder="sk_test_..."
        />
      </div>
    </BaseCard>

    <!-- SSLCommerz -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        SSLCommerz Payment Gateway
      </h3>
      
      <FormSwitch
        v-model="paymentSettings.sslcommerz_enabled"
        name="sslcommerz_enabled"
        label="Enable SSLCommerz"
        description="Popular payment gateway in Bangladesh"
        class="mb-4"
      />

      <div v-if="paymentSettings.sslcommerz_enabled" class="space-y-4">
        <FormSelect
          v-model="paymentSettings.sslcommerz_mode"
          label="Mode"
          name="sslcommerz_mode"
          :options="modeOptions"
        />

        <FormInput
          v-model="paymentSettings.sslcommerz_store_id"
          label="Store ID"
          name="sslcommerz_store_id"
        />
        
        <FormInput
          v-model="paymentSettings.sslcommerz_store_password"
          label="Store Password"
          name="sslcommerz_store_password"
          type="password"
        />
      </div>
    </BaseCard>

    <!-- bKash -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        bKash Mobile Banking
      </h3>
      
      <FormSwitch
        v-model="paymentSettings.bkash_enabled"
        name="bkash_enabled"
        label="Enable bKash"
        description="Accept payments via bKash mobile wallet"
        class="mb-4"
      />

      <div v-if="paymentSettings.bkash_enabled" class="space-y-4">
        <FormSelect
          v-model="paymentSettings.bkash_mode"
          label="Mode"
          name="bkash_mode"
          :options="modeOptions"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="paymentSettings.bkash_app_key"
            label="App Key"
            name="bkash_app_key"
          />
          
          <FormInput
            v-model="paymentSettings.bkash_app_secret"
            label="App Secret"
            name="bkash_app_secret"
            type="password"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="paymentSettings.bkash_username"
            label="Username"
            name="bkash_username"
          />
          
          <FormInput
            v-model="paymentSettings.bkash_password"
            label="Password"
            name="bkash_password"
            type="password"
          />
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
