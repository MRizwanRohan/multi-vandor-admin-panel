<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Activity Log — System activity log viewer (Dynamic)               -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useDate } from '@/composables/useDate'
import { usePagination } from '@/composables/usePagination'
import { useDebouncedRef } from '@/composables/useDebounce'
import { activityService } from '@/services'
import type { ActivityEntry, ActivityStats, ActivityFilters } from '@/types/activity'
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
  ArrowPathIcon,
  TagIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatDate } = useDate()

// State
const { value: searchQuery, debouncedValue: debouncedSearch } = useDebouncedRef('', 400)
const actionFilter = ref('all')
const userFilter = ref('all')
const dateFilter = ref('last_7_days')
const isLoading = ref(false)
const isStatsLoading = ref(false)

const activities = ref<ActivityEntry[]>([])
const stats = ref<ActivityStats>({
  created_today: 0,
  updated_today: 0,
  deleted_today: 0,
  logins_today: 0,
})

// Pagination
const { currentPage, perPage, total, lastPage, setMeta, goToPage } = usePagination({ syncWithUrl: false })

// Table columns
const columns = [
  { key: 'timestamp', label: 'Time', sortable: true },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'resource', label: 'Resource' },
  { key: 'ip_address', label: 'IP Address' },
  { key: 'details', label: 'Details' },
]

// Icon mapping
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
    category: TagIcon,
    user: UserCircleIcon,
  }
  return map[type] ?? CubeIcon
}

// Computed filters
const filters = computed<ActivityFilters>(() => ({
  action: actionFilter.value !== 'all' ? actionFilter.value : undefined,
  user_type: userFilter.value !== 'all' ? userFilter.value : undefined,
  date_range: dateFilter.value as ActivityFilters['date_range'],
  search: debouncedSearch.value || undefined,
  per_page: perPage.value,
  page: currentPage.value,
}))

// Load activities
async function loadActivities() {
  isLoading.value = true
  try {
    const response = await activityService.getActivities(filters.value)
    activities.value = response.data
    if (response.meta) {
      setMeta(response.meta)
    }
  } catch (error) {
    console.error('Failed to load activities:', error)
    activities.value = []
  } finally {
    isLoading.value = false
  }
}

// Load stats
async function loadStats() {
  isStatsLoading.value = true
  try {
    stats.value = await activityService.getStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    isStatsLoading.value = false
  }
}

// Handle pagination
function handlePageChange(page: number) {
  goToPage(page)
  loadActivities()
}

// Export logs
async function handleExport() {
  try {
    const blob = await activityService.exportLogs(filters.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

// Refresh data
function refresh() {
  loadStats()
  loadActivities()
}

// Watch filter changes
watch([actionFilter, userFilter, dateFilter, debouncedSearch], () => {
  goToPage(1)
  loadActivities()
})

// Initialize
onMounted(() => {
  breadcrumbStore.setPageInfo('Activity Log', [
    { label: 'System' },
    { label: 'Activity Log' },
  ], 'System-wide activity log and audit trail')

  loadStats()
  loadActivities()
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
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="refresh"
        >
          <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="handleExport"
        >
          <ArrowDownTrayIcon class="h-4 w-4" />
          Export Log
        </button>
      </div>
    </div>

    <!-- Summary cards with improved design -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Created Today -->
      <div class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm ring-1 ring-emerald-100 transition-all hover:shadow-md dark:from-emerald-900/20 dark:to-teal-900/20 dark:ring-emerald-800/30">
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl transition-all group-hover:scale-150 dark:bg-emerald-800/20" />
        <div class="relative flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:ring-emerald-500/30">
            <PlusCircleIcon class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              <span v-if="isStatsLoading" class="inline-block h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <span v-else>{{ stats.created_today }}</span>
            </p>
            <p class="text-sm font-medium text-emerald-700 dark:text-emerald-400">Created today</p>
          </div>
        </div>
      </div>

      <!-- Updated Today -->
      <div class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm ring-1 ring-blue-100 transition-all hover:shadow-md dark:from-blue-900/20 dark:to-indigo-900/20 dark:ring-blue-800/30">
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-100/50 blur-2xl transition-all group-hover:scale-150 dark:bg-blue-800/20" />
        <div class="relative flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:ring-blue-500/30">
            <PencilSquareIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              <span v-if="isStatsLoading" class="inline-block h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <span v-else>{{ stats.updated_today }}</span>
            </p>
            <p class="text-sm font-medium text-blue-700 dark:text-blue-400">Updated today</p>
          </div>
        </div>
      </div>

      <!-- Deleted Today -->
      <div class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 p-5 shadow-sm ring-1 ring-rose-100 transition-all hover:shadow-md dark:from-rose-900/20 dark:to-pink-900/20 dark:ring-rose-800/30">
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-100/50 blur-2xl transition-all group-hover:scale-150 dark:bg-rose-800/20" />
        <div class="relative flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20 dark:bg-rose-500/20 dark:ring-rose-500/30">
            <TrashIcon class="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              <span v-if="isStatsLoading" class="inline-block h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <span v-else>{{ stats.deleted_today }}</span>
            </p>
            <p class="text-sm font-medium text-rose-700 dark:text-rose-400">Deleted today</p>
          </div>
        </div>
      </div>

      <!-- Logins Today -->
      <div class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-sm ring-1 ring-violet-100 transition-all hover:shadow-md dark:from-violet-900/20 dark:to-purple-900/20 dark:ring-violet-800/30">
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-100/50 blur-2xl transition-all group-hover:scale-150 dark:bg-violet-800/20" />
        <div class="relative flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20 dark:bg-violet-500/20 dark:ring-violet-500/30">
            <ArrowRightOnRectangleIcon class="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              <span v-if="isStatsLoading" class="inline-block h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <span v-else>{{ stats.logins_today }}</span>
            </p>
            <p class="text-sm font-medium text-violet-700 dark:text-violet-400">Logins today</p>
          </div>
        </div>
      </div>
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
            { label: 'Create', value: 'created' },
            { label: 'Update', value: 'updated' },
            { label: 'Delete', value: 'deleted' },
            { label: 'Login', value: 'login' },
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

      <!-- Empty State -->
      <div v-if="!isLoading && activities.length === 0" class="flex flex-col items-center justify-center py-16">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <ClockIcon class="h-8 w-8 text-gray-400" />
        </div>
        <h3 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">No activity logs found</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Activity logs will appear here as users perform actions in the system.
        </p>
      </div>

      <!-- Data Table -->
      <DataTable
        v-else
        :columns="columns"
        :data="activities"
        :loading="isLoading"
        :total="total"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="handlePageChange"
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
              :class="row.user_role === 'admin' || row.user_role === 'super_admin' 
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              class="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase"
            >
              {{ row.user_role === 'super_admin' ? 'admin' : row.user_role }}
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
