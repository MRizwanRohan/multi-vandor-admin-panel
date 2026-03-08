<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Payment Detail — Transaction detail with refund & timeline -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { paymentService, refundService } from '@/services/payment.service'
import { useCurrency, useDate, useToast, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import type {
  PaymentTransaction,
  CreateRefundRequest,
} from '@/types/payment'
import {
  ArrowLeftIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const toast = useToast()
const confirm = useConfirm()

const transactionId = computed(() => Number(route.params.id))

// State
const transaction = ref<PaymentTransaction | null>(null)
const isLoading = ref(true)
const error = ref('')

// Refund modal
const showRefundModal = ref(false)
const isProcessingRefund = ref(false)
const refundForm = ref<CreateRefundRequest>({
  payment_id: 0,
  amount: 0,
  reason: '',
})

// Mounted
onMounted(() => {
  breadcrumbStore.setPageInfo('Payment Details', [
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Details' },
  ], 'Transaction details')
  fetchTransaction()
})

// Fetch transaction
async function fetchTransaction() {
  isLoading.value = true
  error.value = ''
  try {
    transaction.value = await paymentService.getTransaction(transactionId.value)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load transaction'
    toast.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// Computed
const canRefund = computed(() => {
  if (!transaction.value) return false
  return (
    transaction.value.status === 'completed' ||
    transaction.value.status === 'partially_refunded'
  )
})

const refundedAmount = computed(() => {
  return transaction.value?.refund_amount ?? 0
})

const refundableAmount = computed(() => {
  return transaction.value?.refundable_amount ?? 0
})

// Open refund modal
function openRefundModal() {
  refundForm.value = {
    payment_id: transactionId.value,
    amount: refundableAmount.value,
    reason: '',
  }
  showRefundModal.value = true
}

// Process refund
async function submitRefund() {
  if (refundForm.value.amount <= 0) {
    toast.error('Refund amount must be greater than 0')
    return
  }
  if (refundForm.value.amount > refundableAmount.value) {
    toast.error(`Refund amount cannot exceed ${currency.formatCurrency(refundableAmount.value)}`)
    return
  }
  if (!refundForm.value.reason.trim()) {
    toast.error('Please provide a reason for the refund')
    return
  }

  isProcessingRefund.value = true
  try {
    await refundService.create(refundForm.value)
    toast.success('Refund initiated successfully')
    showRefundModal.value = false
    fetchTransaction()
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to process refund'
    toast.error(message)
  } finally {
    isProcessingRefund.value = false
  }
}

// Cancel payment
async function cancelPayment() {
  const confirmed = await confirm.require({
    title: 'Cancel Payment',
    message: 'Are you sure you want to cancel this pending payment?',
    confirmText: 'Cancel Payment',
    variant: 'danger',
  })

  if (!confirmed) return

  try {
    await paymentService.cancelPayment(transactionId.value, 'Cancelled by admin')
    toast.success('Payment cancelled')
    fetchTransaction()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to cancel payment')
  }
}

// Copy to clipboard
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Failed to copy')
  }
}

// Status badge helpers
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary',
    refunded: 'primary',
    partially_refunded: 'primary',
  }
  return variants[status] || 'secondary'
}

function getRefundStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary',
  }
  return variants[status] || 'secondary'
}

function getGatewayLabel(gateway: string): string {
  const labels: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    sslcommerz: 'SSLCommerz',
    cod: 'Cash on Delivery',
  }
  return labels[gateway] || gateway
}

function getTimelineIcon(status: string) {
  const icons: Record<string, typeof CheckCircleIcon> = {
    pending: ClockIcon,
    processing: ArrowPathIcon,
    completed: CheckCircleIcon,
    failed: XCircleIcon,
    refunded: ArrowPathIcon,
    partially_refunded: ArrowPathIcon,
  }
  return icons[status] || ClockIcon
}

function getTimelineColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
    processing: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    completed: 'text-green-500 bg-green-100 dark:bg-green-900/30',
    failed: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    refunded: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
    partially_refunded: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  }
  return colors[status] || 'text-gray-500 bg-gray-100'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back button -->
    <div>
      <BaseButton variant="ghost" size="sm" @click="router.push('/admin/payments')">
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Back to Payments
      </BaseButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Error -->
    <BaseCard v-else-if="error" class="text-center py-8">
      <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-red-400" />
      <p class="mt-2 text-red-600 dark:text-red-400">{{ error }}</p>
      <BaseButton variant="secondary" size="sm" class="mt-4" @click="fetchTransaction">
        Retry
      </BaseButton>
    </BaseCard>

    <!-- Content -->
    <template v-else-if="transaction">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Transaction
            </h2>
            <button
              class="inline-flex items-center font-mono text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
              @click="copyToClipboard(transaction.transaction_id)"
            >
              {{ transaction.transaction_id }}
              <ClipboardDocumentIcon class="ml-1 h-4 w-4" />
            </button>
          </div>
          <div class="mt-1 flex items-center gap-3">
            <BaseBadge :variant="getStatusVariant(transaction.status)" class="capitalize">
              {{ transaction.status.replace('_', ' ') }}
            </BaseBadge>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ date.format(transaction.created_at, 'MMM D, YYYY · h:mm A') }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <BaseButton
            v-if="transaction.status === 'pending'"
            variant="danger"
            size="sm"
            @click="cancelPayment"
          >
            <XCircleIcon class="mr-2 h-4 w-4" />
            Cancel
          </BaseButton>
          <BaseButton
            v-if="canRefund"
            variant="warning"
            size="sm"
            @click="openRefundModal"
          >
            <ArrowPathIcon class="mr-2 h-4 w-4" />
            Refund
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left Column — Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Transaction Summary -->
          <BaseCard>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transaction Summary
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ currency.format(transaction.amount) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Net Amount</p>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ currency.format(transaction.net_amount) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Gateway Fee</p>
                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {{ currency.format(transaction.gateway_fee) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Currency</p>
                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  {{ transaction.currency }}
                </p>
              </div>
            </div>

            <!-- Refund info -->
            <div
              v-if="refundedAmount > 0"
              class="mt-4 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20"
            >
              <div class="flex items-center gap-2">
                <ArrowPathIcon class="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <p class="font-medium text-amber-700 dark:text-amber-300">
                  {{ currency.format(refundedAmount) }} refunded
                </p>
              </div>
              <p class="mt-1 text-sm text-amber-600 dark:text-amber-400">
                Remaining refundable: {{ currency.format(refundableAmount) }}
              </p>
            </div>
          </BaseCard>

          <!-- Payment Gateway Details -->
          <BaseCard>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gateway Details
            </h3>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Gateway</dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ getGatewayLabel(transaction.payment_method) }}
                </dd>
              </div>
              <div v-if="transaction.paid_at" class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Paid At</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  {{ date.format(transaction.paid_at, 'MMM D, YYYY · h:mm A') }}
                </dd>
              </div>
              <div v-if="transaction.failure_reason" class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Failure Reason</dt>
                <dd class="text-sm text-red-600 dark:text-red-400">
                  {{ transaction.failure_reason }}
                </dd>
              </div>

              <!-- Gateway-specific data -->
              <template v-if="transaction.gateway_response">
                <div class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    {{ getGatewayLabel(transaction.payment_method) }} Details
                  </p>
                </div>

                <!-- Stripe -->
                <template v-if="transaction.payment_method === 'stripe'">
                  <div v-if="transaction.gateway_response.stripe_payment_intent_id" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Payment Intent</dt>
                    <dd class="text-sm font-mono text-gray-900 dark:text-white">
                      {{ transaction.gateway_response.stripe_payment_intent_id }}
                    </dd>
                  </div>
                  <div v-if="transaction.gateway_response.stripe_charge_id" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Charge ID</dt>
                    <dd class="text-sm font-mono text-gray-900 dark:text-white">
                      {{ transaction.gateway_response.stripe_charge_id }}
                    </dd>
                  </div>
                  <div v-if="transaction.gateway_response.stripe_receipt_url" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Receipt</dt>
                    <dd>
                      <a
                        :href="transaction.gateway_response.stripe_receipt_url as string"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        View Receipt
                        <ArrowTopRightOnSquareIcon class="ml-1 h-3.5 w-3.5" />
                      </a>
                    </dd>
                  </div>
                </template>

                <!-- PayPal -->
                <template v-else-if="transaction.payment_method === 'paypal'">
                  <div v-if="transaction.gateway_response.paypal_order_id" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">PayPal Order</dt>
                    <dd class="text-sm font-mono text-gray-900 dark:text-white">
                      {{ transaction.gateway_response.paypal_order_id }}
                    </dd>
                  </div>
                  <div v-if="transaction.gateway_response.paypal_payer_email" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Payer Email</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ transaction.gateway_response.paypal_payer_email }}
                    </dd>
                  </div>
                </template>

                <!-- SSLCommerz -->
                <template v-else-if="transaction.payment_method === 'sslcommerz'">
                  <div v-if="transaction.gateway_response.sslcommerz_tran_id" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Transaction ID</dt>
                    <dd class="text-sm font-mono text-gray-900 dark:text-white">
                      {{ transaction.gateway_response.sslcommerz_tran_id }}
                    </dd>
                  </div>
                  <div v-if="transaction.gateway_response.sslcommerz_card_type" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Card Type</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ transaction.gateway_response.sslcommerz_card_type }}
                    </dd>
                  </div>
                  <div v-if="transaction.gateway_response.sslcommerz_card_brand" class="flex justify-between">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Card Brand</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ transaction.gateway_response.sslcommerz_card_brand }}
                    </dd>
                  </div>
                </template>
              </template>
            </dl>
          </BaseCard>

          <!-- Refund History -->
          <BaseCard v-if="transaction.refunds && transaction.refunds.length > 0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Refund History
            </h3>
            <div class="space-y-3">
              <div
                v-for="refund in transaction.refunds"
                :key="refund.id"
                class="flex items-start justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm text-gray-700 dark:text-gray-300">
                      {{ refund.refund_number }}
                    </span>
                    <BaseBadge :variant="getRefundStatusVariant(refund.status)" size="sm" class="capitalize">
                      {{ refund.status }}
                    </BaseBadge>
                  </div>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ refund.reason }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400">
                    {{ date.format(refund.created_at, 'MMM D, YYYY · h:mm A') }}
                  </p>
                </div>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ currency.format(refund.refund_amount) }}
                </p>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Right Column — Sidebar -->
        <div class="space-y-6">
          <!-- Order Info -->
          <BaseCard v-if="transaction.order">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order
            </h3>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Order #</dt>
                <dd>
                  <router-link
                    :to="`/admin/orders/${transaction.order.id}`"
                    class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {{ transaction.order.order_number }}
                  </router-link>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <BaseBadge :variant="getStatusVariant(transaction.order.status)" size="sm" class="capitalize">
                    {{ transaction.order.status }}
                  </BaseBadge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Items</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  {{ transaction.order.items_count }} items
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Total</dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ currency.format(transaction.order.total_amount) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Placed</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  {{ date.format(transaction.order.created_at, 'MMM D, YYYY') }}
                </dd>
              </div>
            </dl>
          </BaseCard>

          <!-- Customer Info -->
          <BaseCard>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Customer
            </h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500 dark:text-gray-400">Name</dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ transaction.customer?.name || 'Guest' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  {{ transaction.customer?.email }}
                </dd>
              </div>
              <div v-if="transaction.customer?.phone">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Phone</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  {{ transaction.customer?.phone }}
                </dd>
              </div>
            </dl>
          </BaseCard>

          <!-- Vendor Info -->
          <BaseCard v-if="transaction.vendor">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vendor
            </h3>
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
              >
                <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {{ transaction.vendor.store_name.charAt(0) }}
                </span>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ transaction.vendor.store_name }}
                </p>
                <router-link
                  :to="`/admin/vendors/${transaction.vendor.id}`"
                  class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  View vendor
                </router-link>
              </div>
            </div>
          </BaseCard>

          <!-- Timeline -->
          <BaseCard v-if="transaction.timeline && transaction.timeline.length > 0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h3>
            <div class="relative">
              <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div class="space-y-4">
                <div
                  v-for="(event, idx) in transaction.timeline"
                  :key="idx"
                  class="relative flex gap-3 pl-10"
                >
                  <div
                    class="absolute left-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                    :class="getTimelineColor(event.new_status)"
                  >
                    <component :is="getTimelineIcon(event.new_status)" class="h-3 w-3" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {{ event.old_status ? `${event.old_status.replace('_', ' ')} → ${event.new_status.replace('_', ' ')}` : event.new_status.replace('_', ' ') }}
                    </p>
                    <p v-if="event.notes" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ event.notes }}
                    </p>
                    <p v-if="event.changed_by" class="text-xs text-gray-400 mt-0.5">
                      by {{ event.changed_by }}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      {{ date.format(event.created_at, 'MMM D, h:mm A') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>

    <!-- Refund Modal -->
    <BaseModal
      :show="showRefundModal"
      title="Process Refund"
      @close="showRefundModal = false"
    >
      <div class="space-y-4">
        <div class="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
          <p class="text-sm text-amber-700 dark:text-amber-300">
            <strong>Original Amount:</strong> {{ transaction ? currency.format(transaction.amount) : '' }}
          </p>
          <p v-if="refundedAmount > 0" class="text-sm text-amber-700 dark:text-amber-300 mt-1">
            <strong>Already Refunded:</strong> {{ currency.format(refundedAmount) }}
          </p>
          <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
            <strong>Max Refundable:</strong> {{ currency.format(refundableAmount) }}
          </p>
        </div>

        <FormInput
          v-model.number="refundForm.amount"
          name="amount"
          label="Refund Amount"
          type="number"
          :min="0.01"
          :max="refundableAmount"
          step="0.01"
          required
        />

        <FormTextarea
          v-model="refundForm.reason"
          name="reason"
          label="Reason"
          placeholder="Describe why this refund is being issued..."
          :rows="3"
          required
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showRefundModal = false">
            Cancel
          </BaseButton>
          <BaseButton
            variant="warning"
            :loading="isProcessingRefund"
            @click="submitRefund"
          >
            <ArrowPathIcon class="mr-2 h-4 w-4" />
            Process Refund
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
