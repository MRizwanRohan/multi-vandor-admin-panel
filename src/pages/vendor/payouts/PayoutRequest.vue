<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Payout Request — Request a new payout -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { payoutService } from '@/services'
import { useToast, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import type { EarningsSummary } from '@/types'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const currency = useCurrency()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Request Payout', [
    { label: 'Payouts', to: '/vendor/payouts' },
    { label: 'Request Payout' },
  ])
  fetchEarnings()
  fetchBankAccounts()
})

// Data
const isLoading = ref(true)
const earnings = ref<EarningsSummary | null>(null)
const bankAccounts = ref<Array<{
  id: number
  account_type: string
  bank_name: string | null
  account_holder_name: string
  account_number_masked: string
  is_primary: boolean
  is_verified: boolean
}>>([])

// Form validation
const payoutSchema = toTypedSchema(z.object({
  amount: z.coerce.number().min(100, 'Minimum payout amount is ৳100'),
  bank_account_id: z.coerce.number().min(1, 'Please select a bank account'),
  notes: z.string().optional(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setFieldError,
} = useForm({
  validationSchema: payoutSchema,
  initialValues: {
    amount: 0,
    bank_account_id: 0,
    notes: '',
  },
})

const [amount, amountAttrs] = defineField('amount')
const [bankAccountId, bankAccountIdAttrs] = defineField('bank_account_id')
const [notes, notesAttrs] = defineField('notes')

// Computed
const bankAccountOptions = computed(() => 
  bankAccounts.value.map(acc => ({
    value: acc.id,
    label: `${getAccountTypeLabel(acc.account_type)} - ${acc.account_number_masked}`,
  }))
)

const selectedAccount = computed(() =>
  bankAccounts.value.find(acc => acc.id === bankAccountId.value)
)

const availableBalance = computed(() => earnings.value?.available_balance || 0)

const isValidAmount = computed(() => {
  const amt = Number(amount.value)
  return amt >= 100 && amt <= availableBalance.value
})

// Get account type label
function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bank: 'Bank Account',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
  }
  return labels[type] || type
}

// Fetch earnings summary (uses /vendor/payouts/balance)
async function fetchEarnings() {
  try {
    const data = await payoutService.getEarningsSummary()
    earnings.value = data
  } catch (error) {
    toast.error('Failed to load earnings data')
    earnings.value = {
      available_balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_commission: 0,
      total_paid_out: 0,
      this_month_revenue: 0,
      this_month_commission: 0,
    }
  }
}

// Fetch bank accounts (uses /vendor/bank-accounts)
async function fetchBankAccounts() {
  isLoading.value = true
  try {
    const data = await payoutService.getBankAccounts()
    bankAccounts.value = data
    
    // Auto-select primary account
    const primary = data.find(acc => acc.is_primary)
    if (primary) {
      bankAccountId.value = primary.id
    }
  } catch (error) {
    toast.error('Failed to load bank accounts')
    bankAccounts.value = []
  } finally {
    isLoading.value = false
  }
}

// Set max amount
function setMaxAmount() {
  amount.value = availableBalance.value
}

// Submit form
const onSubmit = handleSubmit(async (values) => {
  if (values.amount > availableBalance.value) {
    setFieldError('amount', 'Amount exceeds available balance')
    return
  }
  
  try {
    await payoutService.requestPayout({
      amount: values.amount,
      bank_account_id: values.bank_account_id,
      notes: values.notes,
    })
    toast.success('Payout request submitted successfully')
    router.push('/vendor/payouts')
  } catch (error) {
    toast.error('Failed to submit payout request')
  }
})

// Navigation
function goBack() {
  router.push('/vendor/payouts')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <BaseButton variant="ghost" size="sm" @click="goBack">
        <ArrowLeftIcon class="h-5 w-5" />
      </BaseButton>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Request Payout</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Content -->
    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Balance Card -->
          <BaseCard>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p class="text-sm text-green-600 dark:text-green-400">Available Balance</p>
                <p class="text-2xl font-bold text-green-700 dark:text-green-300">
                  {{ currency.formatCurrency(availableBalance) }}
                </p>
              </div>
              <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p class="text-sm text-yellow-600 dark:text-yellow-400">Pending Balance</p>
                <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {{ currency.formatCurrency(earnings?.pending_balance || 0) }}
                </p>
              </div>
              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-sm text-blue-600 dark:text-blue-400">Total Paid Out</p>
                <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {{ currency.formatCurrency(earnings?.total_paid_out || 0) }}
                </p>
              </div>
            </div>
          </BaseCard>

          <!-- Request Form -->
          <BaseCard title="Payout Details">
            <form @submit.prevent="onSubmit" class="space-y-6">
              <!-- Amount -->
              <div>
                <div class="flex items-end gap-4">
                  <div class="flex-1">
                    <FormInput
                      v-model="amount"
                      v-bind="amountAttrs"
                      label="Amount"
                      type="number"
                      :min="100"
                      :max="availableBalance"
                      :error="errors.amount"
                      required
                    />
                  </div>
                  <BaseButton type="button" variant="secondary" @click="setMaxAmount">
                    Max
                  </BaseButton>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Minimum: ৳100 · Maximum: {{ currency.formatCurrency(availableBalance) }}
                </p>
              </div>

              <!-- Bank Account -->
              <div>
                <FormSelect
                  v-model="bankAccountId"
                  v-bind="bankAccountIdAttrs"
                  label="Payout Method"
                  :options="bankAccountOptions"
                  :error="errors.bank_account_id"
                  required
                />
                
                <div v-if="selectedAccount" class="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="flex items-center gap-3 mb-2">
                    <CreditCardIcon class="h-5 w-5 text-gray-400" />
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ getAccountTypeLabel(selectedAccount.account_type) }}
                    </span>
                    <BaseBadge v-if="selectedAccount.is_primary" color="blue" size="sm">
                      Primary
                    </BaseBadge>
                    <BaseBadge v-if="selectedAccount.is_verified" color="green" size="sm">
                      Verified
                    </BaseBadge>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ selectedAccount.account_holder_name }} · {{ selectedAccount.account_number_masked }}
                  </p>
                  <p v-if="selectedAccount.bank_name" class="text-sm text-gray-500">
                    {{ selectedAccount.bank_name }}
                  </p>
                </div>
              </div>

              <!-- Notes -->
              <FormTextarea
                v-model="notes"
                v-bind="notesAttrs"
                label="Notes (Optional)"
                placeholder="Any additional notes for this payout request"
                :rows="3"
                :error="errors.notes"
              />

              <!-- Warning -->
              <div v-if="bankAccounts.length === 0" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
                <ExclamationTriangleIcon class="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="font-medium text-yellow-800 dark:text-yellow-200">No Bank Account</p>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300">
                    Please add a bank account in your profile settings before requesting a payout.
                  </p>
                </div>
              </div>

              <!-- Submit -->
              <div class="flex gap-3 pt-4">
                <BaseButton variant="secondary" type="button" @click="goBack">
                  Cancel
                </BaseButton>
                <BaseButton
                  type="submit"
                  :loading="isSubmitting"
                  :disabled="!isValidAmount || bankAccounts.length === 0"
                >
                  <BanknotesIcon class="h-5 w-5 mr-2" />
                  Request Payout
                </BaseButton>
              </div>
            </form>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary -->
          <BaseCard title="Request Summary">
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-gray-500">Payout Amount</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ currency.formatCurrency(amount || 0) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Processing Fee</span>
                <span class="font-semibold text-gray-900 dark:text-white">৳0</span>
              </div>
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300">You'll Receive</span>
                <span class="font-bold text-lg text-green-600 dark:text-green-400">
                  {{ currency.formatCurrency(amount || 0) }}
                </span>
              </div>
            </div>
          </BaseCard>

          <!-- Info -->
          <BaseCard title="Payout Information">
            <div class="space-y-4 text-sm">
              <div class="flex items-start gap-3">
                <CheckCircleIcon class="h-5 w-5 text-green-500 flex-shrink-0" />
                <p class="text-gray-600 dark:text-gray-400">
                  Payouts are processed within 3-5 business days
                </p>
              </div>
              <div class="flex items-start gap-3">
                <CheckCircleIcon class="h-5 w-5 text-green-500 flex-shrink-0" />
                <p class="text-gray-600 dark:text-gray-400">
                  Bank transfers have no processing fees
                </p>
              </div>
              <div class="flex items-start gap-3">
                <CheckCircleIcon class="h-5 w-5 text-green-500 flex-shrink-0" />
                <p class="text-gray-600 dark:text-gray-400">
                  Mobile wallet payouts are instant
                </p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>
