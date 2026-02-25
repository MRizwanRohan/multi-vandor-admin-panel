<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Activity Log — System activity log viewer                         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useDate } from '@/composables/useDate'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  CubeIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatDate } = useDate()

const searchQuery = ref('')
const actionFilter = ref('all')
const userFilter = ref('all')
const dateFilter = ref('last_7_days')
const isLoading = ref(false)

interface ActivityEntry {
  id: number
  user: string
  user_role: string
  action: string
  action_type: 'create' | 'update' | 'delete' | 'login' | 'settings' | 'payout'
  resource: string
  resource_type: string
  ip_address: string
  timestamp: string
  details: string
}

const activities = ref<ActivityEntry[]>([
  { id: 1, user: 'Admin User', user_role: 'admin', action: 'Updated product', action_type: 'update', resource: 'Wireless Bluetooth Earbuds', resource_type: 'product', ip_address: '192.168.1.1', timestamp: '2026-02-24T14:32:00', details: 'Changed price from ৳2000 to ৳2500' },
  { id: 2, user: 'TechMart', user_role: 'vendor', action: 'Created product', action_type: 'create', resource: 'USB-C Hub 7-in-1', resource_type: 'product', ip_address: '103.45.67.89', timestamp: '2026-02-24T13:15:00', details: 'New product submitted for review' },
  { id: 3, user: 'Admin User', user_role: 'admin', action: 'Approved vendor', action_type: 'update', resource: 'FoodFresh Market', resource_type: 'vendor', ip_address: '192.168.1.1', timestamp: '2026-02-24T12:45:00', details: 'Vendor application approved' },
  { id: 4, user: 'FashionHub', user_role: 'vendor', action: 'Logged in', action_type: 'login', resource: '', resource_type: 'auth', ip_address: '103.22.33.44', timestamp: '2026-02-24T11:20:00', details: 'Successful login from Dhaka, BD' },
  { id: 5, user: 'Admin User', user_role: 'admin', action: 'Updated settings', action_type: 'settings', resource: 'Commission Rate', resource_type: 'settings', ip_address: '192.168.1.1', timestamp: '2026-02-24T10:05:00', details: 'Default commission changed from 8% to 10%' },
  { id: 6, user: 'Admin User', user_role: 'admin', action: 'Processed payout', action_type: 'payout', resource: 'PAY-2026-0145', resource_type: 'payout', ip_address: '192.168.1.1', timestamp: '2026-02-24T09:30:00', details: 'Payout of ৳45,000 to TechMart' },
  { id: 7, user: 'KidZone', user_role: 'vendor', action: 'Deleted product', action_type: 'delete', resource: 'Baby Socks Set', resource_type: 'product', ip_address: '103.55.66.77', timestamp: '2026-02-23T16:45:00', details: 'Product permanently removed' },
  { id: 8, user: 'Admin User', user_role: 'admin', action: 'Created category', action_type: 'create', resource: 'Smart Home', resource_type: 'category', ip_address: '192.168.1.1', timestamp: '2026-02-23T15:20:00', details: 'New category under Electronics' },
  { id: 9, user: 'SportGear', user_role: 'vendor', action: 'Updated product', action_type: 'update', resource: 'Running Shoes Ultra', resource_type: 'product', ip_address: '103.88.99.10', timestamp: '2026-02-23T14:10:00', details: 'Updated stock from 30 to 45' },
  { id: 10, user: 'Admin User', user_role: 'admin', action: 'Suspended vendor', action_type: 'update', resource: 'GadgetStore', resource_type: 'vendor', ip_address: '192.168.1.1', timestamp: '2026-02-23T11:00:00', details: 'Suspended for policy violation' },
])

const columns = [
  { key: 'timestamp', label: 'Time', sortable: true },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'resource', label: 'Resource' },
  { key: 'ip_address', label: 'IP Address' },
  { key: 'details', label: 'Details' },
]

function getActionIcon(type: string) {
  const map: Record<string, typeof CubeIcon> = {
    create: PlusCircleIcon,
    update: PencilSquareIcon,
    delete: TrashIcon,
    login: ArrowRightOnRectangleIcon,
    settings: Cog6ToothIcon,
    payout: CurrencyDollarIcon,
  }
  return map[type] ?? CubeIcon
}

function getActionColor(type: string): string {
  const map: Record<string, string> = {
    create: 'text-success-500',
    update: 'text-info-500',
    delete: 'text-danger-500',
    login: 'text-gray-500',
    settings: 'text-warning-500',
    payout: 'text-primary-500',
  }
  return map[type] ?? 'text-gray-500'
}

function getResourceIcon(type: string) {
  const map: Record<string, typeof CubeIcon> = {
    product: CubeIcon,
    vendor: UserCircleIcon,
    order: ShoppingCartIcon,
    settings: Cog6ToothIcon,
    auth: ShieldCheckIcon,
    payout: CurrencyDollarIcon,
    category: CubeIcon,
  }
  return map[type] ?? CubeIcon
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Activity Log', [
    { label: 'System' },
    { label: 'Activity Log' },
  ], 'System-wide activity log and audit trail')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">View all system activities and audit trail</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <ArrowDownTrayIcon class="h-4 w-4" />
        Export Log
      </button>
    </div>

    <!-- Summary cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <PlusCircleIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">45</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Created today</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-info-50 dark:bg-info-900/30">
            <PencilSquareIcon class="h-5 w-5 text-info-600 dark:text-info-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">128</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Updated today</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-50 dark:bg-danger-900/30">
            <TrashIcon class="h-5 w-5 text-danger-600 dark:text-danger-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">7</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Deleted today</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard class="!p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 dark:bg-success-900/30">
            <ArrowRightOnRectangleIcon class="h-5 w-5 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">34</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Logins today</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Filters & Table -->
    <BaseCard>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            placeholder="Search activities..."
            class="pl-10"
          />
        </div>
        <FormSelect
          v-model="actionFilter"
          :options="[
            { label: 'All Actions', value: 'all' },
            { label: 'Create', value: 'create' },
            { label: 'Update', value: 'update' },
            { label: 'Delete', value: 'delete' },
            { label: 'Login', value: 'login' },
            { label: 'Settings', value: 'settings' },
          ]"
          class="w-36"
        />
        <FormSelect
          v-model="userFilter"
          :options="[
            { label: 'All Users', value: 'all' },
            { label: 'Admins', value: 'admin' },
            { label: 'Vendors', value: 'vendor' },
          ]"
          class="w-32"
        />
        <FormSelect
          v-model="dateFilter"
          :options="[
            { label: 'Last 24h', value: 'last_24h' },
            { label: 'Last 7 days', value: 'last_7_days' },
            { label: 'Last 30 days', value: 'last_30_days' },
          ]"
          class="w-36"
        />
      </div>

      <DataTable
        :columns="columns"
        :data="activities"
        :loading="isLoading"
        :total="activities.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-timestamp="{ row }">
          <span class="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
            {{ formatDate(row.timestamp, 'MMM D, HH:mm') }}
          </span>
        </template>

        <template #cell-user="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-white">{{ row.user }}</span>
            <span
              :class="row.user_role === 'admin' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              class="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase"
            >
              {{ row.user_role }}
            </span>
          </div>
        </template>

        <template #cell-action="{ row }">
          <div class="flex items-center gap-2">
            <component :is="getActionIcon(row.action_type)" :class="getActionColor(row.action_type)" class="h-4 w-4" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.action }}</span>
          </div>
        </template>

        <template #cell-resource="{ row }">
          <div v-if="row.resource" class="flex items-center gap-2">
            <component :is="getResourceIcon(row.resource_type)" class="h-4 w-4 text-gray-400" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.resource }}</span>
          </div>
          <span v-else class="text-sm text-gray-400">—</span>
        </template>

        <template #cell-ip_address="{ row }">
          <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ row.ip_address }}</span>
        </template>

        <template #cell-details="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ row.details }}</span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
