<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Commission Settings — Default commission configuration -->
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
import { InformationCircleIcon } from '@heroicons/vue/24/outline'

const toast = useToast()

// Commission settings
const commissionSettings = ref({
  default_commission_rate: 10,
  min_commission: 5,
  max_commission: 30,
  commission_type: 'percentage',
  apply_commission_on_shipping: false,
  apply_commission_on_tax: false,
  payout_schedule: 'weekly',
  minimum_payout_amount: 500,
  auto_payout_enabled: false,
})

// Commission type options
const commissionTypeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (৳)' },
]

// Payout schedule options
const payoutScheduleOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

// Loading state
const isSaving = ref(false)
const isLoading = ref(true)

// Fetch settings
onMounted(async () => {
  try {
    const data = await settingsService.getSettings()
    if (data.commission) {
      commissionSettings.value = { ...commissionSettings.value, ...data.commission }
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
    await settingsService.updateSettings('commission', commissionSettings.value)
    toast.success('Commission settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="!isLoading" class="space-y-6">
    <!-- Default Commission -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Default Commission
      </h3>

      <div class="space-y-4">
        <FormSelect
          v-model="commissionSettings.commission_type"
          label="Commission Type"
          name="commission_type"
          :options="commissionTypeOptions"
          required
        />

        <FormInput
          v-model.number="commissionSettings.default_commission_rate"
          :label="commissionSettings.commission_type === 'percentage' ? 'Default Rate (%)' : 'Default Amount (৳)'"
          name="default_commission_rate"
          type="number"
          :min="0"
          :max="commissionSettings.commission_type === 'percentage' ? 100 : undefined"
          required
        />

        <div v-if="commissionSettings.commission_type === 'percentage'" class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model.number="commissionSettings.min_commission"
            label="Minimum Rate (%)"
            name="min_commission"
            type="number"
            :min="0"
            :max="100"
          />

          <FormInput
            v-model.number="commissionSettings.max_commission"
            label="Maximum Rate (%)"
            name="max_commission"
            type="number"
            :min="0"
            :max="100"
          />
        </div>

        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
          <InformationCircleIcon class="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p class="text-sm text-blue-800 dark:text-blue-200">
            Commission rates can be customized per vendor or category. This is the default rate applied to new vendors.
          </p>
        </div>
      </div>
    </BaseCard>

    <!-- Commission Calculation -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Commission Calculation
      </h3>

      <div class="space-y-4">
        <FormSwitch
          v-model="commissionSettings.apply_commission_on_shipping"
          name="apply_commission_on_shipping"
          label="Apply Commission on Shipping Cost"
          description="Include shipping charges in commission calculation"
        />

        <FormSwitch
          v-model="commissionSettings.apply_commission_on_tax"
          name="apply_commission_on_tax"
          label="Apply Commission on Tax"
          description="Include tax in commission calculation"
        />
      </div>
    </BaseCard>

    <!-- Payout Settings -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Payout Settings
      </h3>

      <div class="space-y-4">
        <FormSelect
          v-model="commissionSettings.payout_schedule"
          label="Payout Schedule"
          name="payout_schedule"
          :options="payoutScheduleOptions"
          required
        />

        <FormInput
          v-model.number="commissionSettings.minimum_payout_amount"
          label="Minimum Payout Amount (৳)"
          name="minimum_payout_amount"
          type="number"
          :min="0"
          hint="Vendors must reach this amount to request a payout"
          required
        />

        <FormSwitch
          v-model="commissionSettings.auto_payout_enabled"
          name="auto_payout_enabled"
          label="Enable Automatic Payouts"
          description="Automatically process payouts based on the schedule"
        />

        <div v-if="commissionSettings.auto_payout_enabled" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
          <InformationCircleIcon class="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            Automatic payouts will be processed based on your configured payment gateway. Ensure your payment methods are properly set up.
          </p>
        </div>
      </div>
    </BaseCard>

    <!-- Advanced Settings -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Additional Information
      </h3>

      <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>• Per-vendor commission rates can be set from the vendor profile page</p>
        <p>• Category-specific commission rates can be configured in Commission Management</p>
        <p>• Commission is calculated after order completion (delivered status)</p>
        <p>• Refunded orders will reverse the commission automatically</p>
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
