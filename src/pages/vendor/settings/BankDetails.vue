<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Bank Details — Bank account configuration page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore, useAuthStore } from '@/stores'
import { vendorService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import { BanknotesIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const authStore = useAuthStore()
const toast = useToast()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Bank Details', [
    { label: 'Settings' },
    { label: 'Bank Details' },
  ], 'Configure your payout account')
})

// Bank options (Bangladesh banks)
const bankOptions = [
  { value: 'dbbl', label: 'Dutch Bangla Bank Ltd (DBBL)' },
  { value: 'brac', label: 'BRAC Bank' },
  { value: 'ebl', label: 'Eastern Bank Ltd (EBL)' },
  { value: 'city', label: 'City Bank' },
  { value: 'ucb', label: 'United Commercial Bank (UCB)' },
  { value: 'scb', label: 'Standard Chartered Bank' },
  { value: 'hsbc', label: 'HSBC Bangladesh' },
  { value: 'mtb', label: 'Mutual Trust Bank' },
  { value: 'prime', label: 'Prime Bank' },
  { value: 'islami', label: 'Islami Bank Bangladesh' },
]

// Account type options
const accountTypeOptions = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current Account' },
]

// Form validation
const bankSchema = toTypedSchema(z.object({
  accountName: z.string().min(2, 'Account name must be at least 2 characters'),
  accountNumber: z.string().min(10, 'Invalid account number'),
  bankName: z.string().min(1, 'Please select a bank'),
  branchName: z.string().min(2, 'Branch name is required'),
  routingNumber: z.string().min(9, 'Routing number must be 9 digits'),
  accountType: z.string().min(1, 'Please select account type'),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
} = useForm({
  validationSchema: bankSchema,
  initialValues: {
    accountName: 'Fashion Store Ltd',
    accountNumber: '1234567890123',
    bankName: 'dbbl',
    branchName: 'Gulshan Branch',
    routingNumber: '123456789',
    accountType: 'current',
  },
})

const [accountName, accountNameAttrs] = defineField('accountName')
const [accountNumber, accountNumberAttrs] = defineField('accountNumber')
const [bankName, bankNameAttrs] = defineField('bankName')
const [branchName, branchNameAttrs] = defineField('branchName')
const [routingNumber, routingNumberAttrs] = defineField('routingNumber')
const [accountType, accountTypeAttrs] = defineField('accountType')

// Submit form
const onSubmit = handleSubmit(async (values) => {
  try {
    await vendorService.updateBankDetails(authStore.user?.id || '', values)
    toast.success('Bank details updated successfully')
  } catch (error) {
    toast.error('Failed to update bank details')
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <!-- Info banner -->
    <div class="mb-6 flex items-start gap-4 rounded-lg border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
      <ShieldCheckIcon class="h-6 w-6 shrink-0 text-info-600 dark:text-info-400" />
      <div>
        <h4 class="font-medium text-info-800 dark:text-info-200">
          Secure Bank Information
        </h4>
        <p class="mt-1 text-sm text-info-600 dark:text-info-400">
          Your bank details are encrypted and securely stored. We use this information only for processing your payouts.
        </p>
      </div>
    </div>

    <form @submit.prevent="onSubmit">
      <BaseCard>
        <div class="mb-6 flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/50">
            <BanknotesIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Bank Account Details
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Your payouts will be sent to this account
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <FormInput
            v-model="accountName"
            v-bind="accountNameAttrs"
            label="Account Holder Name"
            name="accountName"
            :error="errors.accountName"
            hint="Name as it appears on your bank account"
            required
          />

          <FormInput
            v-model="accountNumber"
            v-bind="accountNumberAttrs"
            label="Account Number"
            name="accountNumber"
            :error="errors.accountNumber"
            required
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <FormSelect
              v-model="bankName"
              v-bind="bankNameAttrs"
              label="Bank Name"
              name="bankName"
              :options="bankOptions"
              :error="errors.bankName"
              required
            />

            <FormInput
              v-model="branchName"
              v-bind="branchNameAttrs"
              label="Branch Name"
              name="branchName"
              :error="errors.branchName"
              required
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="routingNumber"
              v-bind="routingNumberAttrs"
              label="Routing Number"
              name="routingNumber"
              :error="errors.routingNumber"
              hint="9-digit routing number"
              required
            />

            <FormSelect
              v-model="accountType"
              v-bind="accountTypeAttrs"
              label="Account Type"
              name="accountType"
              :options="accountTypeOptions"
              :error="errors.accountType"
              required
            />
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <BaseButton type="submit" variant="primary" :loading="isSubmitting">
            Save Bank Details
          </BaseButton>
        </div>
      </BaseCard>
    </form>
  </div>
</template>
