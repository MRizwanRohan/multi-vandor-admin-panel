<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Customers — Customer list page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useCurrency, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Customers', [
    { label: 'Customers' },
  ], 'Manage your customers')
})

// Search
const searchQuery = ref('')

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

// Mock data
const customers = ref([
  {
    id: '1',
    name: 'আহমেদ হোসেন',
    email: 'ahmed@example.com',
    phone: '+8801712345678',
    avatar: null,
    orders: 15,
    totalSpent: 45000,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'ফাতেমা বেগম',
    email: 'fatema@example.com',
    phone: '+8801812345678',
    avatar: null,
    orders: 8,
    totalSpent: 28500,
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'করিম উদ্দিন',
    email: 'karim@example.com',
    phone: '+8801912345678',
    avatar: null,
    orders: 3,
    totalSpent: 12000,
    status: 'blocked',
    createdAt: '2024-03-10',
  },
])

// Send email (mock)
function sendEmail(customer: typeof customers.value[0]) {
  toast.info(`Opening email for ${customer.email}`)
}

// View details (would navigate to detail page)
function viewDetails(customer: typeof customers.value[0]) {
  toast.info(`Viewing details for ${customer.name}`)
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
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            name="search"
            placeholder="Search customers..."
            class="pl-10"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Customer table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="customers"
        :loading="false"
        :total="customers.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-customer="{ item }">
          <div class="flex items-center gap-3">
            <div
              v-if="item.avatar"
              class="h-10 w-10 shrink-0 overflow-hidden rounded-full"
            >
              <img :src="item.avatar" :alt="item.name" class="h-full w-full object-cover" />
            </div>
            <div
              v-else
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
            >
              {{ getInitials(item.name) }}
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ item.name }}
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
            {{ item.phone }}
          </span>
        </template>

        <template #cell-orders="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ item.orders }}
          </span>
        </template>

        <template #cell-totalSpent="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ formatCurrency(item.totalSpent) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)">
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-createdAt="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(item.createdAt) }}
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
