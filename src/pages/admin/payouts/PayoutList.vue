<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Payouts — Payout management with real API                  -->
<!-- Uses payoutService.getAll(), getStats(), approve/reject          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { payoutService, type PayoutStats } from '@/services'
import { useToast, useDate, useCurrency, usePagination, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import StatCard from '@/components/ui/StatCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { Payout, PayoutStatus, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate } = useDate()
const { formatCurrency } = useCurrency()
const pagination = usePagination()
const confirm = useConfirm()

// ── Filters ──────────────────────────────────────────────────────

const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
]

// ── Data ─────────────────────────────────────────────────────────

const payouts = ref<Payout[]>([])
const stats = ref<PayoutStats | null>(null)
const isLoading = ref(true)
const isProcessing = ref(false)

// Reject modal
const showRejectModal = ref(false)
const rejectingPayoutId = ref<number | null>(null)
const rejectReason = ref('')

// ── Table ────────────────────────────────────────────────────────

const columns: TableColumn[] = [
  { key: 'payout_number', label: 'Payout #', sortable: true },
  { key: 'vendor', label: 'Vendor', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'method', label: 'Method' },
  { key: 'created_at', label: 'Requested', sortable: true },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchPayouts() {
  isLoading.value = true
  try {
    const response = await payoutService.getAll({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      status: (statusFilter.value as PayoutStatus) || undefined,
      search: searchQuery.value || undefined,
    })
    // Backend may return { data: [...], meta } or { data: { payouts: [...], pagination } }
    const resData = response.data as any
    if (Array.isArray(resData)) {
      payouts.value = resData
    } else if (resData?.payouts) {
      payouts.value = resData.payouts
    } else {
      payouts.value = []
    }
    if (response.meta) {
      pagination.setMeta(response.meta)
    } else if (resData?.pagination) {
      pagination.setMeta(resData.pagination)
    }
  } catch {
    toast.error('Failed to load payouts')
  } finally {
    isLoading.value = false
  }
}

async function fetchStats() {
  try {
    stats.value = await payoutService.getStats()
  } catch {
    // Stats are optional — don't block the page
  }
}

async function refresh() {
  await Promise.all([fetchPayouts(), fetchStats()])
}

// ── Actions ──────────────────────────────────────────────────────

async function approvePayout(payout: Payout) {
  const confirmed = await confirm.require({
    title: 'Approve Payout',
    message: `Approve payout of ${formatCurrency(payout.amount)} for ${payout.vendor?.name ?? 'vendor'}?`,
    confirmText: 'Approve',
    cancelText: 'Cancel',
    variant: 'info',
  })
  if (!confirmed) return

  try {
    await payoutService.approve(payout.id)
    toast.success('Payout approved')
    await refresh()
  } catch {
    toast.error('Failed to approve payout')
  }
}

function openRejectModal(payout: Payout) {
  rejectingPayoutId.value = payout.id
  rejectReason.value = ''
  showRejectModal.value = true
}

async function handleReject() {
  if (!rejectingPayoutId.value || !rejectReason.value.trim()) {
    toast.error('Please provide a reason')
    return
  }
  isProcessing.value = true
  try {
    await payoutService.reject(rejectingPayoutId.value, rejectReason.value)
    toast.success('Payout rejected')
    showRejectModal.value = false
    await refresh()
  } catch {
    toast.error('Failed to reject payout')
  } finally {
    isProcessing.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    rejected: 'danger',
    cancelled: 'secondary',
  }
  return map[status] || 'info'
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Payouts', [
    { label: 'Payouts' },
  ], 'Manage vendor payouts')
  refresh()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Pending"
        :value="formatCurrency(stats.total_pending)"
        :icon="ClockIcon"
        color="warning"
      />
      <StatCard
        title="Processing"
        :value="formatCurrency(stats.total_processing)"
        :icon="ArrowPathIcon"
        color="info"
      />
      <StatCard
        title="Completed"
        :value="formatCurrency(stats.total_completed)"
        :icon="CheckCircleIcon"
        color="success"
      />
      <StatCard
        title="Rejected"
        :value="formatCurrency(stats.total_rejected)"
        :icon="CurrencyDollarIcon"
        color="danger"
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
            @keyup.enter="fetchPayouts"
          />
        </div>
        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-40"
          @change="fetchPayouts"
        />
        <BaseButton variant="secondary" size="sm" @click="refresh">
          <ArrowPathIcon class="h-4 w-4" />
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Payouts table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="payouts"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchPayouts()"
        @update:perPage="pagination.perPage.value = $event; fetchPayouts()"
      >
        <template #cell-payout_number="{ row }">
          <RouterLink
            :to="`/admin/payouts/${row.id}`"
            class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ row.payout_number || `#${row.id}` }}
          </RouterLink>
        </template>

        <template #cell-vendor="{ row }">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ row.vendor?.name || '—' }}
            </div>
          </div>
        </template>

        <template #cell-amount="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(row.amount) }}
          </span>
        </template>

        <template #cell-method="{ row }">
          <span class="capitalize text-gray-700 dark:text-gray-300">
            {{ row.payment_method }}
          </span>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)">
            {{ row.status }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <RouterLink
              :to="`/admin/payouts/${row.id}`"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
              title="View Details"
            >
              <EyeIcon class="h-4 w-4" />
            </RouterLink>
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded-lg p-2 text-success-500 hover:bg-success-50 hover:text-success-700 dark:hover:bg-success-900/20"
              title="Approve"
              @click="approvePayout(row)"
            >
              <CheckIcon class="h-4 w-4" />
            </button>
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded-lg p-2 text-danger-500 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-900/20"
              title="Reject"
              @click="openRejectModal(row)"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Reject Modal -->
    <BaseModal
      :show="showRejectModal"
      title="Reject Payout"
      size="md"
      @close="showRejectModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Please provide a reason for rejecting this payout.
        </p>
        <FormTextarea
          v-model="rejectReason"
          label="Rejection Reason"
          name="reject_reason"
          :rows="3"
          placeholder="Enter rejection reason..."
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showRejectModal = false">Cancel</BaseButton>
          <BaseButton variant="danger" :loading="isProcessing" @click="handleReject">
            Reject Payout
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
