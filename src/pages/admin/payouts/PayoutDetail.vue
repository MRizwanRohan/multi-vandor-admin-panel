<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Payout Detail — View and manage a single payout            -->
<!-- Uses GET/PUT /admin/payouts/:id, POST notes                     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { payoutService } from '@/services'
import { useToast, useCurrency, useDate, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import DataTable from '@/components/data/DataTable.vue'
import type { PayoutDetail, Commission } from '@/types'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  UserIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()
const confirm = useConfirm()

// ── State ────────────────────────────────────────────────────────

const payout = ref<PayoutDetail | null>(null)
const isLoading = ref(true)
const payoutId = computed(() => Number(route.params.id))

// Modals
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showCompleteModal = ref(false)
const showNoteModal = ref(false)

// Form data for modals
const transactionReference = ref('')
const rejectReason = ref('')
const completeReference = ref('')
const completeNotes = ref('')
const noteText = ref('')
const isProcessing = ref(false)

// ── Commission Table ─────────────────────────────────────────────

const commissionColumns = [
  { key: 'order_number', label: 'Order', sortable: true },
  { key: 'product_name', label: 'Product' },
  { key: 'gross_amount', label: 'Gross', align: 'right' as const },
  { key: 'commission_rate', label: 'Rate', align: 'center' as const },
  { key: 'commission_amount', label: 'Commission', align: 'right' as const },
  { key: 'net_amount', label: 'Net', align: 'right' as const },
  { key: 'status', label: 'Status', align: 'center' as const },
]

// ── Computed ─────────────────────────────────────────────────────

const canApprove = computed(() => payout.value?.status === 'pending')
const canReject = computed(() => payout.value?.status === 'pending')
const canComplete = computed(() => payout.value?.status === 'processing')

const statusConfig = computed(() => {
  if (!payout.value) return { variant: 'info' as const, label: '' }
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    processing: { variant: 'info', label: 'Processing' },
    completed: { variant: 'success', label: 'Completed' },
    rejected: { variant: 'danger', label: 'Rejected' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  }
  return map[payout.value.status] || { variant: 'info', label: payout.value.status }
})

// ── Fetch ────────────────────────────────────────────────────────

async function fetchPayout() {
  isLoading.value = true
  try {
    payout.value = await payoutService.getById(payoutId.value)
  } catch {
    toast.error('Failed to load payout details')
    router.push('/admin/payouts')
  } finally {
    isLoading.value = false
  }
}

// ── Actions ──────────────────────────────────────────────────────

async function handleApprove() {
  isProcessing.value = true
  try {
    await payoutService.approve(payoutId.value, transactionReference.value || undefined)
    toast.success('Payout approved')
    showApproveModal.value = false
    transactionReference.value = ''
    await fetchPayout()
  } catch {
    toast.error('Failed to approve payout')
  } finally {
    isProcessing.value = false
  }
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    toast.error('Please provide a reason')
    return
  }
  isProcessing.value = true
  try {
    await payoutService.reject(payoutId.value, rejectReason.value)
    toast.success('Payout rejected')
    showRejectModal.value = false
    rejectReason.value = ''
    await fetchPayout()
  } catch {
    toast.error('Failed to reject payout')
  } finally {
    isProcessing.value = false
  }
}

async function handleComplete() {
  if (!completeReference.value.trim()) {
    toast.error('Please provide a transaction reference')
    return
  }
  isProcessing.value = true
  try {
    await payoutService.complete(payoutId.value, {
      transaction_reference: completeReference.value,
      notes: completeNotes.value || undefined,
    })
    toast.success('Payout marked as completed')
    showCompleteModal.value = false
    completeReference.value = ''
    completeNotes.value = ''
    await fetchPayout()
  } catch {
    toast.error('Failed to complete payout')
  } finally {
    isProcessing.value = false
  }
}

async function handleAddNote() {
  if (!noteText.value.trim()) {
    toast.error('Please enter a note')
    return
  }
  isProcessing.value = true
  try {
    await payoutService.addNote(payoutId.value, noteText.value)
    toast.success('Note added')
    showNoteModal.value = false
    noteText.value = ''
    await fetchPayout()
  } catch {
    toast.error('Failed to add note')
  } finally {
    isProcessing.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function getCommissionStatusVariant(status: string): 'success' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'info'> = {
    pending: 'warning',
    available: 'info',
    paid: 'success',
  }
  return map[status] || 'info'
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Payout Details', [
    { label: 'Payouts', to: '/admin/payouts' },
    { label: 'Details' },
  ], 'View and manage payout')
  fetchPayout()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Back button + Actions -->
    <div class="flex items-center justify-between">
      <BaseButton variant="ghost" size="sm" @click="router.push('/admin/payouts')">
        <ArrowLeftIcon class="mr-1 h-4 w-4" />
        Back to Payouts
      </BaseButton>

      <div v-if="payout" class="flex items-center gap-2">
        <BaseButton
          v-if="canApprove"
          variant="primary"
          size="sm"
          @click="showApproveModal = true"
        >
          <CheckCircleIcon class="mr-1 h-4 w-4" />
          Approve
        </BaseButton>
        <BaseButton
          v-if="canComplete"
          variant="primary"
          size="sm"
          @click="showCompleteModal = true"
        >
          <BanknotesIcon class="mr-1 h-4 w-4" />
          Mark Completed
        </BaseButton>
        <BaseButton
          v-if="canReject"
          variant="danger"
          size="sm"
          @click="showRejectModal = true"
        >
          <XCircleIcon class="mr-1 h-4 w-4" />
          Reject
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="showNoteModal = true">
          <ChatBubbleLeftIcon class="mr-1 h-4 w-4" />
          Add Note
        </BaseButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <template v-else-if="payout">
      <!-- Payout overview -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main info -->
        <BaseCard class="lg:col-span-2">
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Payout #{{ payout.payout_number }}
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Requested {{ formatDateTime(payout.requested_at || payout.created_at) }}
              </p>
            </div>
            <BaseBadge :variant="statusConfig.variant" size="lg">
              {{ statusConfig.label }}
            </BaseBadge>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <!-- Amount -->
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Payout Amount</p>
              <p class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(payout.amount) }}
              </p>
              <div v-if="payout.fee" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Fee: {{ formatCurrency(payout.fee) }} · Net: {{ formatCurrency(payout.net_amount) }}
              </div>
            </div>

            <!-- Method -->
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</p>
              <p class="mt-1 text-lg font-semibold capitalize text-gray-900 dark:text-white">
                {{ payout.method }}
              </p>
              <div v-if="payout.account_details" class="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p>{{ payout.account_details.account_name }}</p>
                <p class="font-mono">{{ payout.account_details.account_number }}</p>
                <p v-if="payout.account_details.bank_name">{{ payout.account_details.bank_name }}</p>
              </div>
            </div>
          </div>

          <!-- Transaction reference -->
          <div
            v-if="payout.transaction_reference"
            class="mt-4 rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20"
          >
            <p class="text-sm font-medium text-success-800 dark:text-success-200">
              Transaction Reference
            </p>
            <p class="mt-1 font-mono text-success-700 dark:text-success-300">
              {{ payout.transaction_reference }}
            </p>
          </div>

          <!-- Timeline -->
          <div class="mt-6">
            <h3 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Timeline
            </h3>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <ClockIcon class="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Requested</p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(payout.requested_at || payout.created_at) }}</p>
                </div>
              </div>
              <div v-if="payout.processed_at" class="flex items-start gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
                  <CheckCircleIcon class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Processed</p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(payout.processed_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Vendor info sidebar -->
        <BaseCard v-if="payout.vendor">
          <div class="flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
              <UserIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ payout.vendor.store_name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ payout.vendor.owner_name }}
              </p>
            </div>
          </div>

          <div class="mt-4 space-y-3">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p class="text-sm text-gray-900 dark:text-white">{{ payout.vendor.email }}</p>
            </div>
            <div v-if="payout.vendor.phone">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</p>
              <p class="text-sm text-gray-900 dark:text-white">{{ payout.vendor.phone }}</p>
            </div>
          </div>

          <div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <RouterLink
              :to="`/admin/vendors/${payout.vendor.id}`"
              class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View Vendor Profile →
            </RouterLink>
          </div>
        </BaseCard>
      </div>

      <!-- Payout Notes -->
      <BaseCard v-if="payout.notes">
        <div class="flex items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
          <DocumentTextIcon class="h-5 w-5 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white">Notes</h3>
        </div>
        <p class="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
          {{ payout.notes }}
        </p>
      </BaseCard>

      <!-- Associated Commissions -->
      <BaseCard padding="none">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Associated Commissions
            <span v-if="payout.commissions?.length" class="ml-2 text-sm font-normal text-gray-500">
              ({{ payout.commissions.length }})
            </span>
          </h3>
        </div>

        <DataTable
          v-if="payout.commissions?.length"
          :columns="commissionColumns"
          :data="payout.commissions"
          :loading="false"
          row-key="id"
          :current-page="1"
          :per-page="100"
          :total="payout.commissions.length"
        >
          <template #cell-order_number="{ row }">
            <RouterLink
              :to="`/admin/orders/${row.order_id}`"
              class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              #{{ row.order_number }}
            </RouterLink>
          </template>

          <template #cell-product_name="{ row }">
            <span class="text-sm text-gray-900 dark:text-white">
              {{ row.product_name }}
            </span>
          </template>

          <template #cell-gross_amount="{ row }">
            <span class="text-sm text-gray-900 dark:text-white">
              {{ formatCurrency(row.gross_amount) }}
            </span>
          </template>

          <template #cell-commission_rate="{ row }">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ row.commission_rate }}%
            </span>
          </template>

          <template #cell-commission_amount="{ row }">
            <span class="text-sm font-medium text-danger-600 dark:text-danger-400">
              -{{ formatCurrency(row.commission_amount) }}
            </span>
          </template>

          <template #cell-net_amount="{ row }">
            <span class="text-sm font-bold text-success-600 dark:text-success-400">
              {{ formatCurrency(row.net_amount) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <BaseBadge :variant="getCommissionStatusVariant(row.status)">
              {{ row.status }}
            </BaseBadge>
          </template>
        </DataTable>

        <div v-else class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No commissions associated with this payout.
        </div>
      </BaseCard>
    </template>

    <!-- ── Approve Modal ──────────────────────────────────────────── -->
    <BaseModal
      :show="showApproveModal"
      title="Approve Payout"
      size="md"
      @close="showApproveModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Approving this payout will move it to <strong>processing</strong> status.
        </p>
        <FormInput
          v-model="transactionReference"
          label="Transaction Reference (optional)"
          name="transaction_reference"
          placeholder="e.g. TXN-123456"
          hint="Add a reference if you already have one"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showApproveModal = false">Cancel</BaseButton>
          <BaseButton variant="primary" :loading="isProcessing" @click="handleApprove">
            <CheckCircleIcon class="mr-1 h-4 w-4" />
            Approve
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ── Reject Modal ───────────────────────────────────────────── -->
    <BaseModal
      :show="showRejectModal"
      title="Reject Payout"
      size="md"
      @close="showRejectModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Please provide a reason for rejecting this payout request.
        </p>
        <FormTextarea
          v-model="rejectReason"
          label="Rejection Reason"
          name="reject_reason"
          :rows="3"
          placeholder="Enter the reason for rejection..."
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showRejectModal = false">Cancel</BaseButton>
          <BaseButton variant="danger" :loading="isProcessing" @click="handleReject">
            <XCircleIcon class="mr-1 h-4 w-4" />
            Reject
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ── Complete Modal ─────────────────────────────────────────── -->
    <BaseModal
      :show="showCompleteModal"
      title="Complete Payout"
      size="md"
      @close="showCompleteModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Enter the transaction reference to mark this payout as completed.
        </p>
        <FormInput
          v-model="completeReference"
          label="Transaction Reference"
          name="complete_reference"
          placeholder="e.g. BEFTN-20241215-001"
          required
        />
        <FormTextarea
          v-model="completeNotes"
          label="Notes (optional)"
          name="complete_notes"
          :rows="2"
          placeholder="Any additional notes..."
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showCompleteModal = false">Cancel</BaseButton>
          <BaseButton variant="primary" :loading="isProcessing" @click="handleComplete">
            <BanknotesIcon class="mr-1 h-4 w-4" />
            Mark Completed
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ── Note Modal ─────────────────────────────────────────────── -->
    <BaseModal
      :show="showNoteModal"
      title="Add Note"
      size="md"
      @close="showNoteModal = false"
    >
      <FormTextarea
        v-model="noteText"
        label="Note"
        name="note"
        :rows="4"
        placeholder="Enter a note about this payout..."
        required
      />
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showNoteModal = false">Cancel</BaseButton>
          <BaseButton variant="primary" :loading="isProcessing" @click="handleAddNote">
            <ChatBubbleLeftIcon class="mr-1 h-4 w-4" />
            Add Note
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
