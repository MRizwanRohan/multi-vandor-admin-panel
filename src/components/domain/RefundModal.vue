<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Refund Modal — Process refunds for orders                          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { refundService } from '@/services/payment.service'
import { useCurrency, useToast } from '@/composables'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import type { RefundEligibility } from '@/types/payment'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  modelValue: boolean
  orderId: number
  orderNumber: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refunded'): void
}>()

const { formatCurrency } = useCurrency()
const toast = useToast()

// State
const isCheckingEligibility = ref(false)
const isProcessing = ref(false)
const eligibility = ref<RefundEligibility | null>(null)
const eligibilityError = ref<string | null>(null)

// Form fields
const refundAmount = ref<number | string>('')
const refundReason = ref('')
const refundNotes = ref('')

// Refund reason options
const reasonOptions = [
  { value: '', label: 'Select reason...' },
  { value: 'product_damaged', label: 'Product Damaged' },
  { value: 'product_defective', label: 'Product Defective' },
  { value: 'wrong_item', label: 'Wrong Item Received' },
  { value: 'item_not_received', label: 'Item Not Received' },
  { value: 'not_as_described', label: 'Not As Described' },
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'duplicate_order', label: 'Duplicate Order' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'other', label: 'Other' },
]

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const canProcessRefund = computed(() => {
  if (!eligibility.value?.eligible) return false
  const amount = Number(refundAmount.value)
  if (!amount || amount <= 0) return false
  if (amount > eligibility.value.refundable_amount) return false
  if (!refundReason.value) return false
  return true
})

const amountError = computed(() => {
  if (!refundAmount.value) return null
  const amount = Number(refundAmount.value)
  if (isNaN(amount) || amount <= 0) {
    return 'Please enter a valid amount'
  }
  if (eligibility.value && amount > eligibility.value.refundable_amount) {
    return `Maximum refundable amount is ${formatCurrency(eligibility.value.refundable_amount)}`
  }
  return null
})

// Watch for modal open to check eligibility
watch(isOpen, async (open) => {
  if (open) {
    await checkEligibility()
  } else {
    resetForm()
  }
})

// Check refund eligibility
async function checkEligibility() {
  isCheckingEligibility.value = true
  eligibilityError.value = null
  eligibility.value = null

  try {
    eligibility.value = await refundService.checkEligibility(props.orderId)
    // Pre-fill with max refundable amount
    if (eligibility.value.eligible) {
      refundAmount.value = eligibility.value.refundable_amount
    }
  } catch (error: any) {
    eligibilityError.value = error.response?.data?.message || 'Failed to check refund eligibility'
  } finally {
    isCheckingEligibility.value = false
  }
}

// Process refund
async function processRefund() {
  if (!canProcessRefund.value) return

  isProcessing.value = true
  try {
    await refundService.processRefund({
      order_id: props.orderId,
      amount: Number(refundAmount.value),
      reason: refundReason.value,
      notes: refundNotes.value || undefined,
    })
    toast.success('Refund processed successfully')
    emit('refunded')
    isOpen.value = false
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to process refund')
  } finally {
    isProcessing.value = false
  }
}

// Reset form
function resetForm() {
  refundAmount.value = ''
  refundReason.value = ''
  refundNotes.value = ''
  eligibility.value = null
  eligibilityError.value = null
}

// Set full refund
function setFullRefund() {
  if (eligibility.value) {
    refundAmount.value = eligibility.value.refundable_amount
  }
}
</script>

<template>
  <BaseModal
    v-model="isOpen"
    title="Process Refund"
    :description="`Order: ${orderNumber}`"
    size="lg"
    :persistent="isProcessing"
  >
    <!-- Loading state -->
    <div v-if="isCheckingEligibility" class="flex flex-col items-center justify-center py-8">
      <AppSpinner size="lg" />
      <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Checking refund eligibility...
      </p>
    </div>

    <!-- Error state -->
    <div v-else-if="eligibilityError" class="rounded-lg bg-danger-50 p-4 dark:bg-danger-900/20">
      <div class="flex items-start gap-3">
        <XCircleIcon class="h-5 w-5 shrink-0 text-danger-500" />
        <div>
          <h4 class="font-medium text-danger-800 dark:text-danger-400">Unable to Check Eligibility</h4>
          <p class="mt-1 text-sm text-danger-700 dark:text-danger-300">{{ eligibilityError }}</p>
          <BaseButton variant="secondary" size="sm" class="mt-3" @click="checkEligibility">
            Try Again
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Not eligible state -->
    <div v-else-if="eligibility && !eligibility.eligible" class="rounded-lg bg-warning-50 p-4 dark:bg-warning-900/20">
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="h-5 w-5 shrink-0 text-warning-500" />
        <div>
          <h4 class="font-medium text-warning-800 dark:text-warning-400">Refund Not Available</h4>
          <p class="mt-1 text-sm text-warning-700 dark:text-warning-300">
            {{ eligibility.message || 'This order is not eligible for a refund.' }}
          </p>
          <ul v-if="eligibility.reasons?.length" class="mt-2 list-inside list-disc text-sm text-warning-700 dark:text-warning-300">
            <li v-for="(reason, index) in eligibility.reasons" :key="index">{{ reason }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Eligible - show refund form -->
    <div v-else-if="eligibility && eligibility.eligible" class="space-y-6">
      <!-- Order summary -->
      <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Order Total
            </p>
            <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(eligibility.total_amount) }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Already Refunded
            </p>
            <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(eligibility.total_refunded) }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Available for Refund
            </p>
            <div class="mt-1 flex items-center gap-2">
              <p class="text-xl font-bold text-primary-600 dark:text-primary-400">
                {{ formatCurrency(eligibility.refundable_amount) }}
              </p>
              <BaseBadge variant="success" size="sm">
                <CheckCircleIcon class="mr-1 h-3 w-3" />
                Eligible
              </BaseBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Refund form -->
      <div class="space-y-4">
        <!-- Amount -->
        <div>
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Refund Amount <span class="text-danger-500">*</span>
            </label>
            <button
              type="button"
              class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              @click="setFullRefund"
            >
              Full Refund
            </button>
          </div>
          <div class="relative mt-1">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <BanknotesIcon class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="refundAmount"
              type="number"
              step="0.01"
              min="0"
              :max="eligibility.refundable_amount"
              class="form-input w-full pl-10"
              :class="{ 'border-danger-500 focus:border-danger-500 focus:ring-danger-500': amountError }"
              placeholder="Enter refund amount"
            />
          </div>
          <p v-if="amountError" class="mt-1 text-sm text-danger-500">{{ amountError }}</p>
        </div>

        <!-- Reason -->
        <FormSelect
          v-model="refundReason"
          name="refundReason"
          label="Refund Reason"
          :options="reasonOptions"
          required
        />

        <!-- Notes -->
        <FormTextarea
          v-model="refundNotes"
          name="refundNotes"
          label="Additional Notes"
          placeholder="Optional notes about this refund..."
          :rows="3"
        />
      </div>

      <!-- Warning -->
      <div class="rounded-lg bg-warning-50 p-3 dark:bg-warning-900/20">
        <div class="flex items-center gap-2">
          <ExclamationTriangleIcon class="h-5 w-5 shrink-0 text-warning-500" />
          <p class="text-sm text-warning-700 dark:text-warning-300">
            This action cannot be undone. The refund will be processed immediately.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <BaseButton variant="secondary" @click="isOpen = false" :disabled="isProcessing">
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="!canProcessRefund"
        :loading="isProcessing"
        @click="processRefund"
      >
        Process Refund
      </BaseButton>
    </template>
  </BaseModal>
</template>
