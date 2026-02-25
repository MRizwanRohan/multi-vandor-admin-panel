<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Pending Categories — Vendor category suggestions: approve/reject -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useDate } from '@/composables/useDate'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatCard from '@/components/ui/StatCard.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import {
  MagnifyingGlassIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDate, timeAgo } = useDate()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const isLoading = ref(false)
const showDetailModal = ref(false)
const showRejectModal = ref(false)
const rejectionReason = ref('')
const selectedSuggestion = ref<any>(null)

// Mock data
const suggestions = ref([
  {
    id: 1,
    name: 'Smart Home Devices',
    parent_category: 'Electronics',
    vendor: { name: 'TechWorld BD', id: 5 },
    description: 'IoT devices including smart speakers, lights, and security cameras for home automation.',
    status: 'pending',
    submitted_at: '2026-02-20T10:00:00Z',
    products_estimate: 25,
  },
  {
    id: 2,
    name: 'Organic Baby Food',
    parent_category: 'Baby & Kids',
    vendor: { name: 'GreenMart', id: 8 },
    description: 'Certified organic baby food products including purees, cereals, and snacks.',
    status: 'pending',
    submitted_at: '2026-02-19T14:30:00Z',
    products_estimate: 15,
  },
  {
    id: 3,
    name: 'Electric Bikes',
    parent_category: 'Sports & Outdoors',
    vendor: { name: 'BikeZone BD', id: 12 },
    description: 'Electric bicycles and e-scooters for urban commuting.',
    status: 'approved',
    submitted_at: '2026-02-15T09:00:00Z',
    reviewed_at: '2026-02-16T11:00:00Z',
    products_estimate: 10,
  },
  {
    id: 4,
    name: 'Handloom Sarees',
    parent_category: 'Fashion',
    vendor: { name: 'DesiCraft', id: 3 },
    description: 'Traditional handloom sarees from various regions of Bangladesh.',
    status: 'rejected',
    submitted_at: '2026-02-14T08:00:00Z',
    reviewed_at: '2026-02-15T10:00:00Z',
    rejection_reason: 'Already covered under existing "Traditional Clothing" category.',
    products_estimate: 40,
  },
])

// Stats
const stats = computed(() => [
  {
    title: 'Total Suggestions',
    value: suggestions.value.length,
    icon: FolderIcon,
    color: 'primary' as const,
  },
  {
    title: 'Pending Review',
    value: suggestions.value.filter(s => s.status === 'pending').length,
    icon: ClockIcon,
    color: 'warning' as const,
  },
  {
    title: 'Approved',
    value: suggestions.value.filter(s => s.status === 'approved').length,
    icon: CheckCircleIcon,
    color: 'success' as const,
  },
  {
    title: 'Rejected',
    value: suggestions.value.filter(s => s.status === 'rejected').length,
    icon: XCircleIcon,
    color: 'danger' as const,
  },
])

// Filtered data
const filteredSuggestions = computed(() => {
  let data = suggestions.value
  if (statusFilter.value !== 'all') {
    data = data.filter(s => s.status === statusFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    data = data.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.vendor.name.toLowerCase().includes(q) ||
        s.parent_category.toLowerCase().includes(q)
    )
  }
  return data
})

// Table columns
const columns = [
  { key: 'name', label: 'Category Name', sortable: true },
  { key: 'parent_category', label: 'Parent Category' },
  { key: 'vendor', label: 'Suggested By' },
  { key: 'products_estimate', label: 'Est. Products', align: 'center' as const },
  { key: 'submitted_at', label: 'Submitted', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

function getStatusVariant(status: string) {
  const map: Record<string, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'warning'
}

function viewDetail(suggestion: any) {
  selectedSuggestion.value = suggestion
  showDetailModal.value = true
}

async function approveSuggestion(suggestion: any) {
  await confirm.require({
    title: 'Approve Category Suggestion',
    message: `Approve "${suggestion.name}" as a new category under ${suggestion.parent_category}?`,
    confirmText: 'Approve',
    variant: 'primary',
  })
  suggestion.status = 'approved'
  suggestion.reviewed_at = new Date().toISOString()
  toast.success(`"${suggestion.name}" has been approved.`)
}

function openRejectModal(suggestion: any) {
  selectedSuggestion.value = suggestion
  rejectionReason.value = ''
  showRejectModal.value = true
}

function submitRejection() {
  if (!rejectionReason.value.trim()) {
    toast.error('Please provide a rejection reason.')
    return
  }
  if (selectedSuggestion.value) {
    selectedSuggestion.value.status = 'rejected'
    selectedSuggestion.value.reviewed_at = new Date().toISOString()
    selectedSuggestion.value.rejection_reason = rejectionReason.value
    toast.success(`"${selectedSuggestion.value.name}" has been rejected.`)
  }
  showRejectModal.value = false
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Pending Categories', [
    { label: 'Categories' },
    { label: 'Pending Suggestions' },
  ], 'Review vendor category suggestions')
})
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
            placeholder="Search suggestions..."
            class="pl-10"
          />
        </div>
        <FormSelect
          v-model="statusFilter"
          name="status_filter"
          :options="[
            { label: 'All Status', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ]"
          class="w-40"
        />
      </div>
    </BaseCard>

    <!-- Table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="filteredSuggestions"
        :loading="isLoading"
        :total="filteredSuggestions.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.description?.slice(0, 60) }}...</p>
          </div>
        </template>

        <template #cell-vendor="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.vendor.name }}</span>
        </template>

        <template #cell-products_estimate="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">~{{ row.products_estimate }}</span>
        </template>

        <template #cell-submitted_at="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400" :title="formatDate(row.submitted_at, 'MMMM D, YYYY h:mm A')">
            {{ timeAgo(row.submitted_at) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)" dot rounded>
            {{ row.status.charAt(0).toUpperCase() + row.status.slice(1) }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              title="View details"
              @click="viewDetail(row)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <template v-if="row.status === 'pending'">
              <button
                type="button"
                class="rounded-lg p-1.5 text-success-600 transition-colors hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-900/20"
                title="Approve"
                @click="approveSuggestion(row)"
              >
                <CheckCircleIcon class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-lg p-1.5 text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
                title="Reject"
                @click="openRejectModal(row)"
              >
                <XCircleIcon class="h-4 w-4" />
              </button>
            </template>
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="FolderIcon"
            title="No category suggestions"
            description="No vendor category suggestions match your filters."
          />
        </template>
      </DataTable>
    </BaseCard>

    <!-- Detail Modal -->
    <BaseModal v-model="showDetailModal" title="Category Suggestion Details" size="md">
      <div v-if="selectedSuggestion" class="space-y-4">
        <div>
          <label class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Category Name</label>
          <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">{{ selectedSuggestion.name }}</p>
        </div>
        <div>
          <label class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Parent Category</label>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ selectedSuggestion.parent_category }}</p>
        </div>
        <div>
          <label class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Description</label>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ selectedSuggestion.description }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Suggested By</label>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ selectedSuggestion.vendor.name }}</p>
          </div>
          <div>
            <label class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Est. Products</label>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">~{{ selectedSuggestion.products_estimate }}</p>
          </div>
        </div>
        <div>
          <label class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</label>
          <div class="mt-1">
            <BaseBadge :variant="getStatusVariant(selectedSuggestion.status)" dot rounded>
              {{ selectedSuggestion.status.charAt(0).toUpperCase() + selectedSuggestion.status.slice(1) }}
            </BaseBadge>
          </div>
        </div>
        <div v-if="selectedSuggestion.rejection_reason">
          <label class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rejection Reason</label>
          <p class="mt-1 text-sm text-danger-600 dark:text-danger-400">{{ selectedSuggestion.rejection_reason }}</p>
        </div>
      </div>
    </BaseModal>

    <!-- Reject Modal -->
    <BaseModal v-model="showRejectModal" title="Reject Category Suggestion" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Please provide a reason for rejecting
          <span class="font-medium text-gray-900 dark:text-white">"{{ selectedSuggestion?.name }}"</span>.
        </p>
        <FormTextarea
          v-model="rejectionReason"
          name="rejection_reason"
          label="Rejection Reason"
          placeholder="Enter the reason for rejection..."
          :rows="4"
          required
        />
        <div class="flex justify-end gap-2">
          <BaseButton variant="ghost" @click="showRejectModal = false">Cancel</BaseButton>
          <BaseButton variant="danger" @click="submitRejection">Reject</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
