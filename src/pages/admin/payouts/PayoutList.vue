<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Payouts — Payout management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import StatCard from '@/components/ui/StatCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  MagnifyingGlassIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate } = useDate()
const { formatCurrency } = useCurrency()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Payouts', [
    { label: 'Payouts' },
  ], 'Manage vendor payouts')
})

// Search and filters
const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
]

// Stats
const stats = computed(() => [
  {
    title: 'Total Pending',
    value: formatCurrency(175000),
    icon: ClockIcon,
    trend: { value: 12, type: 'up' as const },
    color: 'warning' as const,
  },
  {
    title: 'Approved This Month',
    value: formatCurrency(450000),
    icon: CheckCircleIcon,
    trend: { value: 8, type: 'up' as const },
    color: 'success' as const,
  },
  {
    title: 'Completed This Month',
    value: formatCurrency(380000),
    icon: BanknotesIcon,
    trend: { value: 15, type: 'up' as const },
    color: 'primary' as const,
  },
  {
    title: 'Total Paid (All Time)',
    value: formatCurrency(2450000),
    icon: CurrencyDollarIcon,
    color: 'info' as const,
  },
])

// Table columns
const columns = [
  { key: 'vendor', label: 'Vendor', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'method', label: 'Method' },
  { key: 'requestedAt', label: 'Requested', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Mock data
const payouts = ref([
  {
    id: '1',
    vendor: {
      id: 'v1',
      name: 'টেক হাব বিডি',
      email: 'techhub@example.com',
    },
    amount: 75000,
    method: 'bKash',
    accountNumber: '01712345678',
    requestedAt: '2024-12-12T10:00:00Z',
    processedAt: null,
    status: 'pending',
    note: '',
  },
  {
    id: '2',
    vendor: {
      id: 'v2',
      name: 'ফ্যাশন ওয়ার্ল্ড',
      email: 'fashion@example.com',
    },
    amount: 50000,
    method: 'Bank Transfer',
    accountNumber: '1234567890',
    requestedAt: '2024-12-11T15:30:00Z',
    processedAt: '2024-12-12T09:00:00Z',
    status: 'approved',
    note: '',
  },
  {
    id: '3',
    vendor: {
      id: 'v3',
      name: 'হোম ডেকো',
      email: 'homedeco@example.com',
    },
    amount: 100000,
    method: 'Bank Transfer',
    accountNumber: '9876543210',
    requestedAt: '2024-12-10T08:00:00Z',
    processedAt: '2024-12-11T14:00:00Z',
    status: 'completed',
    note: 'Processed via BEFTN',
  },
])

// View modal
const showViewModal = ref(false)
const selectedPayout = ref<typeof payouts.value[0] | null>(null)

// View payout
function viewPayout(payout: typeof payouts.value[0]) {
  selectedPayout.value = payout
  showViewModal.value = true
}

// Approve payout
function approvePayout(payout: typeof payouts.value[0]) {
  payout.status = 'approved'
  payout.processedAt = new Date().toISOString()
  toast.success('Payout approved')
}

// Mark as completed
function completePayout(payout: typeof payouts.value[0]) {
  payout.status = 'completed'
  toast.success('Payout marked as completed')
}

// Reject payout
function rejectPayout(payout: typeof payouts.value[0]) {
  payout.status = 'rejected'
  payout.processedAt = new Date().toISOString()
  toast.success('Payout rejected')
}

// Get status variant
function getStatusVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'info'
    case 'completed': return 'success'
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

    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            name="search"
            placeholder="Search payouts..."
            class="pl-10"
          />
        </div>
        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-40"
        />
      </div>
    </BaseCard>

    <!-- Payouts table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="payouts"
        :loading="false"
        :total="payouts.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-vendor="{ item }">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ item.vendor.name }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ item.vendor.email }}
            </div>
          </div>
        </template>

        <template #cell-amount="{ item }">
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(item.amount) }}
          </span>
        </template>

        <template #cell-method="{ item }">
          <div>
            <div class="text-gray-900 dark:text-white">{{ item.method }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ item.accountNumber }}
            </div>
          </div>
        </template>

        <template #cell-requestedAt="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(item.requestedAt) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)">
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View"
              @click="viewPayout(item)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <button
              v-if="item.status === 'pending'"
              type="button"
              class="rounded-lg p-2 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
              title="Approve"
              @click="approvePayout(item)"
            >
              <CheckIcon class="h-4 w-4" />
            </button>
            <button
              v-if="item.status === 'approved'"
              type="button"
              class="rounded-lg p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
              title="Mark Completed"
              @click="completePayout(item)"
            >
              <CheckCircleIcon class="h-4 w-4" />
            </button>
            <button
              v-if="item.status === 'pending'"
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Reject"
              @click="rejectPayout(item)"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </BaseCard>

    <!-- View modal -->
    <BaseModal
      v-model="showViewModal"
      title="Payout Details"
      size="lg"
      @close="showViewModal = false"
    >
      <div v-if="selectedPayout" class="space-y-4">
        <!-- Vendor -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</label>
            <p class="text-gray-900 dark:text-white">{{ selectedPayout.vendor.name }}</p>
            <p class="text-sm text-gray-500">{{ selectedPayout.vendor.email }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(selectedPayout.amount) }}
            </p>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</label>
            <p class="text-gray-900 dark:text-white">{{ selectedPayout.method }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</label>
            <p class="text-gray-900 dark:text-white">{{ selectedPayout.accountNumber }}</p>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Requested At</label>
            <p class="text-gray-900 dark:text-white">{{ formatDate(selectedPayout.requestedAt, 'full') }}</p>
          </div>
          <div v-if="selectedPayout.processedAt">
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Processed At</label>
            <p class="text-gray-900 dark:text-white">{{ formatDate(selectedPayout.processedAt, 'full') }}</p>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
          <div class="mt-1">
            <BaseBadge :variant="getStatusVariant(selectedPayout.status)">
              {{ selectedPayout.status }}
            </BaseBadge>
          </div>
        </div>

        <!-- Note -->
        <div v-if="selectedPayout.note">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Note</label>
          <p class="text-gray-900 dark:text-white">{{ selectedPayout.note }}</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showViewModal = false">
            Close
          </BaseButton>
          <BaseButton
            v-if="selectedPayout?.status === 'pending'"
            variant="primary"
            @click="approvePayout(selectedPayout!); showViewModal = false"
          >
            <CheckIcon class="mr-2 h-4 w-4" />
            Approve Payout
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
