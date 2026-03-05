<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Contact Messages List — Manage contact form submissions -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { contactService } from '@/services'
import type { ContactMessage, ContactStats } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  InboxIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDateTime, formatRelative } = useDate()
const confirm = useConfirm()

onMounted(() => {
  breadcrumbStore.setPageInfo('Contact Messages', [
    { label: 'CMS' },
    { label: 'Contact' },
  ], 'Manage customer inquiries')
  fetchStats()
  fetchMessages()
})

// State
const isLoading = ref(false)
const messages = ref<ContactMessage[]>([])
const stats = ref<ContactStats | null>(null)
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedMessages = ref<number[]>([])

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'spam', label: 'Spam' },
]

// Status badge variants
const statusVariants: Record<string, 'warning' | 'info' | 'success' | 'primary' | 'danger'> = {
  new: 'warning',
  read: 'info',
  replied: 'primary',
  resolved: 'success',
  spam: 'danger',
}

// Status icons
const statusIcons = {
  new: EnvelopeIcon,
  read: EnvelopeOpenIcon,
  replied: ChatBubbleLeftIcon,
  resolved: CheckCircleIcon,
  spam: ExclamationTriangleIcon,
}

// Columns
const columns = [
  { key: 'select', label: '', width: '40px' },
  { key: 'sender', label: 'From', sortable: true },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Received', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Fetch stats
async function fetchStats() {
  try {
    const response = await contactService.getStats()
    stats.value = response.data
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

// Fetch messages
async function fetchMessages() {
  isLoading.value = true
  try {
    const response = await contactService.getAll({
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      status: selectedStatus.value || undefined,
    })
    messages.value = Array.isArray(response.data) ? response.data : []
    totalItems.value = response.meta?.total || messages.value.length
  } catch (error: any) {
    console.error('Failed to fetch messages:', error)
    if (error.response?.status !== 404) {
      toast.error('Failed to load messages')
    }
    messages.value = []
  } finally {
    isLoading.value = false
  }
}

// Debounced search
const debouncedFetch = useDebounce(() => {
  currentPage.value = 1
  fetchMessages()
}, 300)

watch(searchQuery, () => debouncedFetch())
watch(selectedStatus, () => {
  currentPage.value = 1
  fetchMessages()
})

// Page change
function onPageChange(page: number) {
  currentPage.value = page
  fetchMessages()
}

// Toggle selection
function toggleSelect(id: number) {
  const index = selectedMessages.value.indexOf(id)
  if (index > -1) {
    selectedMessages.value.splice(index, 1)
  } else {
    selectedMessages.value.push(id)
  }
}

// Select all
function toggleSelectAll() {
  if (selectedMessages.value.length === messages.value.length) {
    selectedMessages.value = []
  } else {
    selectedMessages.value = messages.value.map(m => m.id)
  }
}

// Bulk mark as read
async function bulkMarkAsRead() {
  if (selectedMessages.value.length === 0) return
  
  try {
    await contactService.bulkMarkAsRead(selectedMessages.value)
    toast.success(`${selectedMessages.value.length} messages marked as read`)
    selectedMessages.value = []
    fetchMessages()
    fetchStats()
  } catch (error) {
    toast.error('Failed to update messages')
  }
}

// Bulk delete
async function bulkDelete() {
  if (selectedMessages.value.length === 0) return
  
  const confirmed = await confirm.require({
    title: 'Delete Messages',
    message: `Are you sure you want to delete ${selectedMessages.value.length} messages? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await contactService.bulkDelete(selectedMessages.value)
      toast.success(`${selectedMessages.value.length} messages deleted`)
      selectedMessages.value = []
      fetchMessages()
      fetchStats()
    } catch (error) {
      toast.error('Failed to delete messages')
    }
  }
}

// Delete single message
async function deleteMessage(message: ContactMessage) {
  const confirmed = await confirm.require({
    title: 'Delete Message',
    message: `Are you sure you want to delete this message from "${message.name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await contactService.delete(message.id)
      toast.success('Message deleted')
      fetchMessages()
      fetchStats()
    } catch (error) {
      toast.error('Failed to delete message')
    }
  }
}

// View message
function viewMessage(message: ContactMessage) {
  router.push(`/admin/cms/contact/${message.id}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Contact Messages</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage customer inquiries and feedback
        </p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <InboxIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total || 0 }}</p>
            <p class="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <EnvelopeIcon class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.new || 0 }}</p>
            <p class="text-xs text-gray-500">New</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <EnvelopeOpenIcon class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.read || 0 }}</p>
            <p class="text-xs text-gray-500">Read</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <CheckCircleIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.resolved || 0 }}</p>
            <p class="text-xs text-gray-500">Resolved</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.spam || 0 }}</p>
            <p class="text-xs text-gray-500">Spam</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Filters & Bulk Actions -->
    <BaseCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-1">
          <div class="relative flex-1 max-w-md">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <FormInput
              v-model="searchQuery"
              name="search"
              placeholder="Search messages..."
              class="pl-10"
            />
          </div>
          <FormSelect
            v-model="selectedStatus"
            name="status"
            :options="statusOptions"
            class="w-full sm:w-36"
          />
        </div>
        
        <div v-if="selectedMessages.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-gray-500">{{ selectedMessages.length }} selected</span>
          <BaseButton size="sm" variant="secondary" @click="bulkMarkAsRead">
            Mark as Read
          </BaseButton>
          <BaseButton size="sm" variant="danger" @click="bulkDelete">
            Delete
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Messages Table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="messages"
        :loading="isLoading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="onPageChange"
      >
        <template #header-select>
          <input
            type="checkbox"
            :checked="selectedMessages.length === messages.length && messages.length > 0"
            :indeterminate="selectedMessages.length > 0 && selectedMessages.length < messages.length"
            class="h-4 w-4 rounded border-gray-300"
            @change="toggleSelectAll"
          />
        </template>

        <template #cell-select="{ item }">
          <input
            type="checkbox"
            :checked="selectedMessages.includes(item.id)"
            class="h-4 w-4 rounded border-gray-300"
            @change="toggleSelect(item.id)"
          />
        </template>

        <template #cell-sender="{ item }">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ item.name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </div>
            <div>
              <p 
                :class="[
                  'font-medium',
                  item.status === 'new' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ item.name }}
              </p>
              <p class="text-xs text-gray-500">{{ item.email }}</p>
            </div>
          </div>
        </template>

        <template #cell-subject="{ item }">
          <div class="max-w-xs">
            <p 
              :class="[
                'line-clamp-1',
                item.status === 'new' ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              ]"
            >
              {{ item.subject || '(No subject)' }}
            </p>
            <p class="text-xs text-gray-500 line-clamp-1">
              {{ item.message }}
            </p>
          </div>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="statusVariants[item.status] || 'secondary'">
            <component :is="statusIcons[item.status]" class="mr-1 h-3 w-3" />
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-createdAt="{ item }">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ formatRelative(item.created_at) }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <button
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="View"
              @click="viewMessage(item)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <button
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deleteMessage(item)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <InboxIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No messages</h3>
            <p class="mt-1 text-sm text-gray-500">
              Contact form submissions will appear here.
            </p>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
