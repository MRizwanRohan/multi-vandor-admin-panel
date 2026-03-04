<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Customers — Customer list page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useCurrency, useDate } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { customerService } from '@/services'
import type { Customer } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Customers', [
    { label: 'Customers' },
  ], 'Manage your customers')
  
  fetchCustomers()
})

// State
const isLoading = ref(false)
const customers = ref<Customer[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')

// Status options for filter
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
]

// Table columns
const columns = [
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone' },
  { key: 'orders', label: 'Orders', sortable: true },
  { key: 'totalSpent', label: 'Total Spent', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Joined', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Fetch customers from API
async function fetchCustomers() {
  isLoading.value = true
  try {
    const response = await customerService.getAll({
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value as any || undefined,
    })
    
    // Service now returns clean { data: [...], meta: {...} }
    customers.value = Array.isArray(response.data) ? response.data : []
    totalItems.value = response.meta?.total || customers.value.length
  } catch (error: any) {
    console.error('Failed to fetch customers:', error)
    if (error.response?.status !== 404) {
      toast.error(error.response?.data?.message || 'Failed to load customers')
    }
    customers.value = []
    totalItems.value = 0
  } finally {
    isLoading.value = false
  }
}

// Debounced fetch function
const debouncedFetch = useDebounce(() => {
  currentPage.value = 1
  fetchCustomers()
}, 300)

// Watch for filter changes
watch([searchQuery, statusFilter], () => {
  debouncedFetch()
})

// Page change handler
function onPageChange(page: number) {
  currentPage.value = page
  fetchCustomers()
}

// Send email
function sendEmail(customer: Customer) {
  toast.info(`Opening email for ${customer.email}`)
  window.location.href = `mailto:${customer.email}`
}

// View details
function viewDetails(customer: Customer) {
  router.push(`/admin/customers/${customer.id}`)
}

// Get status variant
function getStatusVariant(status: string) {
  switch (status) {
    case 'active': return 'success'
    case 'blocked': return 'danger'
    default: return 'secondary'
  }
}

// Get initials
function getInitials(name: string | undefined | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            name="search"
            placeholder="Search customers..."
            class="pl-10"
          />
        </div>
        <div class="w-40">
          <FormSelect
            v-model="statusFilter"
            name="status"
            :options="statusOptions"
            placeholder="All Status"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Customer table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="customers"
        :loading="isLoading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="onPageChange"
      >
        <template #cell-customer="{ item }">
          <div class="flex items-center gap-3">
            <div
              v-if="item.avatar"
              class="h-10 w-10 shrink-0 overflow-hidden rounded-full"
            >
              <img :src="item.avatar" :alt="item.full_name || item.name" class="h-full w-full object-cover" />
            </div>
            <div
              v-else
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
            >
              {{ getInitials(item.full_name || item.name || item.email) }}
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ item.full_name || item.name || item.email }}
            </span>
          </div>
        </template>

        <template #cell-email="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ item.email }}
          </span>
        </template>

        <template #cell-phone="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ item.phone || '—' }}
          </span>
        </template>

        <template #cell-orders="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ item.order_count ?? item.orders ?? 0 }}
          </span>
        </template>

        <template #cell-totalSpent="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ formatCurrency(item.total_spent ?? item.totalSpent ?? 0) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)">
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-createdAt="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(item.created_at || item.createdAt) }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Send Email"
              @click="sendEmail(item)"
            >
              <EnvelopeIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View Details"
              @click="viewDetails(item)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
