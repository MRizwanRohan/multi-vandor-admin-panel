<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Payouts — Payout history and requests page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useCurrency, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import StatCard from '@/components/ui/StatCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  WalletIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Payouts', [
    { label: 'Payouts' },
  ], 'View and request payouts')
})

// Stats
const stats = computed(() => [
  {
    title: 'Available Balance',
    value: formatCurrency(75000),
    icon: WalletIcon,
    color: 'primary' as const,
  },
  {
    title: 'Pending Payout',
    value: formatCurrency(25000),
    icon: ClockIcon,
    color: 'warning' as const,
  },
  {
    title: 'This Month',
    value: formatCurrency(50000),
    icon: BanknotesIcon,
    trend: { value: 15, type: 'up' as const },
    color: 'success' as const,
  },
  {
    title: 'Total Received',
    value: formatCurrency(450000),
    icon: CheckCircleIcon,
    color: 'info' as const,
  },
])

// Table columns
const columns = [
  { key: 'id', label: 'Payout ID', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'method', label: 'Method' },
  { key: 'requestedAt', label: 'Requested', sortable: true },
  { key: 'processedAt', label: 'Processed', sortable: true },
  { key: 'status', label: 'Status' },
]

// Mock data
const payouts = ref([
  {
    id: 'PAY-001',
    amount: 50000,
    method: 'bKash',
    accountNumber: '01712345678',
    requestedAt: '2024-12-10T10:00:00Z',
    processedAt: '2024-12-11T15:00:00Z',
    status: 'completed',
  },
  {
    id: 'PAY-002',
    amount: 25000,
    method: 'Bank Transfer',
    accountNumber: '1234567890',
    requestedAt: '2024-12-12T10:00:00Z',
    processedAt: null,
    status: 'pending',
  },
  {
    id: 'PAY-003',
    amount: 75000,
    method: 'Bank Transfer',
    accountNumber: '1234567890',
    requestedAt: '2024-12-01T10:00:00Z',
    processedAt: '2024-12-03T12:00:00Z',
    status: 'completed',
  },
])

// Request payout modal
const showRequestModal = ref(false)
const requestAmount = ref(0)
const payoutMethod = ref('bank')

const methodOptions = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
]

// Available balance (for validation)
const availableBalance = 75000
const minPayout = 5000

// Open request modal
function openRequestModal() {
  requestAmount.value = availableBalance
  showRequestModal.value = true
}

// Submit payout request
function submitPayoutRequest() {
  if (requestAmount.value < minPayout) {
    toast.error(`Minimum payout amount is ${formatCurrency(minPayout)}`)
    return
  }
  
  if (requestAmount.value > availableBalance) {
    toast.error('Amount exceeds available balance')
    return
  }

  // Add new payout request
  payouts.value.unshift({
    id: `PAY-${Date.now().toString().slice(-5)}`,
    amount: requestAmount.value,
    method: methodOptions.find(m => m.value === payoutMethod.value)?.label || 'Bank Transfer',
    accountNumber: '****7890',
    requestedAt: new Date().toISOString(),
    processedAt: null,
    status: 'pending',
  })

  toast.success('Payout request submitted successfully')
  showRequestModal.value = false
}

// Get status variant
function getStatusVariant(status: string) {
  switch (status) {
    case 'completed': return 'success'
    case 'pending': return 'warning'
    case 'processing': return 'info'
    case 'rejected': return 'danger'
    default: return 'secondary'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :trend="stat.trend"
        :color="stat.color"
      />
    </div>

    <!-- Request payout button -->
    <div class="flex justify-end">
      <BaseButton variant="primary" @click="openRequestModal">
        <PlusIcon class="mr-2 h-4 w-4" />
        Request Payout
      </BaseButton>
    </div>

    <!-- Payouts table -->
    <BaseCard title="Payout History">
      <DataTable
        :columns="columns"
        :data="payouts"
        :loading="false"
        :total="payouts.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-id="{ row }">
          <span class="font-mono font-medium text-gray-900 dark:text-white">
            {{ row.id }}
          </span>
        </template>

        <template #cell-amount="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(row.amount) }}
          </span>
        </template>

        <template #cell-method="{ row }">
          <div>
            <div class="text-gray-900 dark:text-white">{{ row.method }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ row.accountNumber }}
            </div>
          </div>
        </template>

        <template #cell-requestedAt="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(row.requestedAt) }}
          </span>
        </template>

        <template #cell-processedAt="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ row.processedAt ? formatDate(row.processedAt) : '-' }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)">
            {{ row.status }}
          </BaseBadge>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Info card -->
    <BaseCard>
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <BanknotesIcon class="h-5 w-5" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Payout Information
          </h3>
          <ul class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>• Minimum payout amount: {{ formatCurrency(minPayout) }}</li>
            <li>• Payouts are processed within 2-3 business days</li>
            <li>• Bank transfers may take an additional 1-2 days</li>
            <li>• Commission rate: 10% (deducted from order total)</li>
          </ul>
        </div>
      </div>
    </BaseCard>

    <!-- Request payout modal -->
    <BaseModal
      :show="showRequestModal"
      title="Request Payout"
      size="md"
      @close="showRequestModal = false"
    >
      <div class="space-y-4">
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Available Balance</span>
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(availableBalance) }}
            </span>
          </div>
        </div>

        <FormInput
          v-model.number="requestAmount"
          label="Payout Amount (৳)"
          name="amount"
          type="number"
          :min="minPayout"
          :max="availableBalance"
        />

        <FormSelect
          v-model="payoutMethod"
          label="Payout Method"
          name="method"
          :options="methodOptions"
        />

        <p class="text-sm text-gray-500 dark:text-gray-400">
          The payout will be sent to your registered account.
          <router-link
            to="/vendor/settings/bank-details"
            class="text-primary-600 hover:underline dark:text-primary-400"
          >
            Update account details
          </router-link>
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showRequestModal = false">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" @click="submitPayoutRequest">
            Request Payout
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
