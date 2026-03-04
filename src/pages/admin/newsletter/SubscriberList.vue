<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Newsletter — Subscriber management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { newsletterService } from '@/services'
import type { NewsletterSubscriber, NewsletterStats, SubscriberFilters, SubscriberStatus } from '@/types'
import { SUBSCRIPTION_SOURCES } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  UserGroupIcon,
  ClockIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDateTime, formatDate } = useDate()

// ── State ──
const loading = ref(false)
const subscribers = ref<NewsletterSubscriber[]>([])
const stats = ref<NewsletterStats | null>(null)
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const selectedIds = ref<number[]>([])

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Newsletter', [
    { label: 'Newsletter Subscribers' },
  ], 'Manage newsletter subscribers')
  fetchStats()
  fetchSubscribers()
})

// Search and filters
const searchQuery = ref('')
const statusFilter = ref<SubscriberStatus | ''>('')
const sourceFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
]

const sourceOptions = [
  { value: '', label: 'All Sources' },
  ...SUBSCRIPTION_SOURCES.map(s => ({ value: s.value, label: s.label })),
]

// Table columns
const columns = [
  { key: 'select', label: '' },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'source', label: 'Source' },
  { key: 'subscribed_at', label: 'Subscribed', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Modal state
const showAddModal = ref(false)
const showImportModal = ref(false)
const newEmail = ref('')
const importFile = ref<File | null>(null)
const importing = ref(false)

// ── API Methods ──
async function fetchStats() {
  try {
    stats.value = await newsletterService.getStats()
  } catch (error: any) {
    console.error('Failed to load stats:', error)
  }
}

async function fetchSubscribers() {
  loading.value = true
  try {
    const params: SubscriberFilters = {
      page: currentPage.value,
      per_page: perPage.value,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value) params.status = statusFilter.value
    if (sourceFilter.value) params.source = sourceFilter.value as any

    const response = await newsletterService.getAll(params)
    // Handle response format
    const resData = response as any
    if (Array.isArray(resData.data)) {
      subscribers.value = resData.data
      totalItems.value = resData.meta?.total || resData.data.length
    } else if (Array.isArray(resData)) {
      subscribers.value = resData
      totalItems.value = resData.length
    } else {
      subscribers.value = []
      totalItems.value = 0
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load subscribers')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounce(fetchSubscribers, 300)

// Watch filters
watch([statusFilter, sourceFilter], () => {
  currentPage.value = 1
  fetchSubscribers()
})

watch(searchQuery, () => {
  currentPage.value = 1
  debouncedFetch()
})

// Pagination
function handlePageChange(page: number) {
  currentPage.value = page
  fetchSubscribers()
}

function handlePerPageChange(size: number) {
  perPage.value = size
  currentPage.value = 1
  fetchSubscribers()
}

// ── Selection ──
function toggleSelect(id: number) {
  const index = selectedIds.value.indexOf(id)
  if (index >= 0) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === subscribers.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = subscribers.value.map(s => s.id)
  }
}

// ── Actions ──
async function addSubscriber() {
  if (!newEmail.value) return
  
  try {
    await newsletterService.create({ email: newEmail.value })
    toast.success('Subscriber added successfully')
    newEmail.value = ''
    showAddModal.value = false
    fetchSubscribers()
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to add subscriber')
  }
}

async function resendVerification(subscriber: NewsletterSubscriber) {
  try {
    await newsletterService.resendVerification(subscriber.id)
    toast.success('Verification email sent')
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to send verification email')
  }
}

async function unsubscribe(subscriber: NewsletterSubscriber) {
  const confirmed = await confirm.warning({
    title: 'Unsubscribe',
    message: `Are you sure you want to unsubscribe ${subscriber.email}?`,
    confirmText: 'Unsubscribe',
  })
  if (!confirmed) return

  try {
    await newsletterService.adminUnsubscribe(subscriber.id)
    subscriber.status = 'unsubscribed'
    toast.success('Subscriber unsubscribed')
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to unsubscribe')
  }
}

async function resubscribe(subscriber: NewsletterSubscriber) {
  try {
    await newsletterService.resubscribe(subscriber.id)
    subscriber.status = 'active'
    toast.success('Subscriber reactivated')
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to resubscribe')
  }
}

async function deleteSubscriber(subscriber: NewsletterSubscriber) {
  const confirmed = await confirm.danger({
    title: 'Delete Subscriber',
    message: `Are you sure you want to delete ${subscriber.email}? This action cannot be undone.`,
    confirmText: 'Delete',
  })
  if (!confirmed) return

  try {
    await newsletterService.delete(subscriber.id)
    toast.success('Subscriber deleted')
    subscribers.value = subscribers.value.filter(s => s.id !== subscriber.id)
    totalItems.value--
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete subscriber')
  }
}

async function bulkDelete() {
  if (selectedIds.value.length === 0) return
  
  const confirmed = await confirm.danger({
    title: 'Delete Subscribers',
    message: `Are you sure you want to delete ${selectedIds.value.length} subscribers? This action cannot be undone.`,
    confirmText: 'Delete All',
  })
  if (!confirmed) return

  try {
    await newsletterService.bulkDelete(selectedIds.value)
    toast.success(`${selectedIds.value.length} subscribers deleted`)
    selectedIds.value = []
    fetchSubscribers()
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete subscribers')
  }
}

// Import/Export
async function exportSubscribers() {
  try {
    const blob = await newsletterService.export()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export started')
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to export subscribers')
  }
}

function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    importFile.value = input.files[0]
  }
}

async function importSubscribers() {
  if (!importFile.value) return
  
  importing.value = true
  try {
    const result = await newsletterService.import(importFile.value)
    toast.success(`Imported ${result.imported} subscribers (${result.skipped} skipped)`)
    importFile.value = null
    showImportModal.value = false
    fetchSubscribers()
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to import subscribers')
  } finally {
    importing.value = false
  }
}

// ── Helpers ──
function getStatusVariant(status: SubscriberStatus) {
  switch (status) {
    case 'active': return 'success'
    case 'pending': return 'warning'
    case 'unsubscribed': return 'secondary'
    default: return 'secondary'
  }
}

function getStatusLabel(status: SubscriberStatus) {
  switch (status) {
    case 'active': return 'Active'
    case 'pending': return 'Pending'
    case 'unsubscribed': return 'Unsubscribed'
    default: return status
  }
}

function getSourceLabel(source: string) {
  const found = SUBSCRIPTION_SOURCES.find(s => s.value === source)
  return found?.label || source
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <UserGroupIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Subscribers</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.total_subscribers }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
          <CheckCircleIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.active_subscribers }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400">
          <ClockIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.pending_verification }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400">
          <NoSymbolIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Unsubscribed</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.unsubscribed }}</p>
        </div>
      </BaseCard>
    </div>

    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <FormInput
              v-model="searchQuery"
              name="search"
              placeholder="Search by email..."
              class="pl-10"
            />
          </div>
          <FormSelect
            v-model="statusFilter"
            name="status"
            :options="statusOptions"
            class="w-44"
          />
          <FormSelect
            v-model="sourceFilter"
            name="source"
            :options="sourceOptions"
            class="w-36"
          />
          <BaseButton variant="ghost" size="sm" @click="fetchSubscribers">
            <ArrowPathIcon class="h-4 w-4" />
          </BaseButton>
        </div>
        <div class="flex gap-2">
          <BaseButton variant="secondary" @click="exportSubscribers">
            <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
            Export
          </BaseButton>
          <BaseButton variant="secondary" @click="showImportModal = true">
            <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
            Import
          </BaseButton>
          <BaseButton variant="primary" @click="showAddModal = true">
            <PlusIcon class="mr-2 h-4 w-4" />
            Add Subscriber
          </BaseButton>
        </div>
      </div>
      
      <!-- Bulk Actions -->
      <div v-if="selectedIds.length > 0" class="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ selectedIds.length }} selected
        </span>
        <BaseButton variant="danger" size="sm" @click="bulkDelete">
          <TrashIcon class="mr-1 h-4 w-4" />
          Delete Selected
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Subscribers table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="subscribers"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #cell-select="{ item }">
          <input
            type="checkbox"
            :checked="selectedIds.includes(item.id)"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
            @change="toggleSelect(item.id)"
          />
        </template>

        <template #cell-email="{ item }">
          <div class="flex items-center gap-2">
            <EnvelopeIcon class="h-5 w-5 text-gray-400" />
            <span class="font-medium text-gray-900 dark:text-white">{{ item.email }}</span>
          </div>
        </template>

        <template #cell-source="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ getSourceLabel(item.source) }}
          </span>
        </template>

        <template #cell-subscribed_at="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(item.subscribed_at || item.created_at) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)">
            {{ getStatusLabel(item.status) }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              v-if="item.status === 'pending'"
              type="button"
              class="rounded-lg p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              title="Resend verification"
              @click="resendVerification(item)"
            >
              <PaperAirplaneIcon class="h-4 w-4" />
            </button>
            <button
              v-if="item.status === 'active'"
              type="button"
              class="rounded-lg p-2 text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-900/20"
              title="Unsubscribe"
              @click="unsubscribe(item)"
            >
              <XCircleIcon class="h-4 w-4" />
            </button>
            <button
              v-if="item.status === 'unsubscribed'"
              type="button"
              class="rounded-lg p-2 text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20"
              title="Resubscribe"
              @click="resubscribe(item)"
            >
              <CheckCircleIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deleteSubscriber(item)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <EnvelopeIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No subscribers found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding a new subscriber or importing a list.
            </p>
            <div class="mt-6 flex justify-center gap-3">
              <BaseButton variant="secondary" @click="showImportModal = true">
                <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
                Import CSV
              </BaseButton>
              <BaseButton variant="primary" @click="showAddModal = true">
                <PlusIcon class="mr-2 h-4 w-4" />
                Add Subscriber
              </BaseButton>
            </div>
          </div>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Add Subscriber Modal -->
    <BaseModal
      v-model="showAddModal"
      title="Add Subscriber"
      @close="showAddModal = false"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newEmail"
          label="Email Address"
          name="email"
          type="email"
          placeholder="subscriber@example.com"
          required
        />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showAddModal = false">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" @click="addSubscriber">
            Add Subscriber
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Import Modal -->
    <BaseModal
      v-model="showImportModal"
      title="Import Subscribers"
      @close="showImportModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Upload a CSV file with email addresses. The CSV should have an "email" column.
        </p>
        
        <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary-500 dark:hover:bg-gray-800/50 transition-colors">
          <div class="flex flex-col items-center justify-center py-4">
            <ArrowUpTrayIcon class="w-8 h-8 text-gray-400 mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ importFile ? importFile.name : 'Click to select CSV file' }}
            </p>
          </div>
          <input
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleImportFile"
          />
        </label>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showImportModal = false">
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            :loading="importing"
            :disabled="!importFile"
            @click="importSubscribers"
          >
            Import
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
