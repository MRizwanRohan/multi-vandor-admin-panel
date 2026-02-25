<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- My Promotions — Vendor promotions list                            -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { useDate } from '@/composables/useDate'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MegaphoneIcon,
  GiftIcon,
  ReceiptPercentIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

const searchQuery = ref('')
const statusFilter = ref('all')
const isLoading = ref(false)

const stats = [
  { title: 'Active Promotions', value: '3', icon: MegaphoneIcon, change: 1, trend: 'up' as const, changeLabel: 'this week', color: 'success' as const },
  { title: 'Total Discount Given', value: formatCurrency(45200), icon: GiftIcon, change: 12, trend: 'up' as const, changeLabel: 'vs last month', color: 'primary' as const },
  { title: 'Orders with Promo', value: '156', icon: ReceiptPercentIcon, change: 8, trend: 'up' as const, changeLabel: 'vs last month', color: 'info' as const },
  { title: 'Upcoming', value: '2', icon: ClockIcon, change: 0, trend: 'up' as const, changeLabel: 'scheduled', color: 'warning' as const },
]

const promotions = ref([
  {
    id: 1,
    name: 'Summer Sale 2026',
    type: 'percentage',
    discount_value: 15,
    min_purchase: 500,
    max_discount: 2000,
    start_date: '2026-02-15',
    end_date: '2026-03-15',
    status: 'active',
    uses_count: 87,
    total_discount: 28500,
    products_count: 'All products',
  },
  {
    id: 2,
    name: 'New Arrivals Discount',
    type: 'percentage',
    discount_value: 10,
    min_purchase: 300,
    max_discount: 1000,
    start_date: '2026-02-20',
    end_date: '2026-03-20',
    status: 'active',
    uses_count: 45,
    total_discount: 12300,
    products_count: '12 products',
  },
  {
    id: 3,
    name: 'Flash Deal — Electronics',
    type: 'fixed',
    discount_value: 200,
    min_purchase: 1000,
    max_discount: null,
    start_date: '2026-02-24',
    end_date: '2026-02-25',
    status: 'active',
    uses_count: 24,
    total_discount: 4400,
    products_count: '5 products',
  },
  {
    id: 4,
    name: 'March Madness Sale',
    type: 'percentage',
    discount_value: 20,
    min_purchase: 1000,
    max_discount: 5000,
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    status: 'scheduled',
    uses_count: 0,
    total_discount: 0,
    products_count: 'All products',
  },
  {
    id: 5,
    name: 'Valentine Special',
    type: 'fixed',
    discount_value: 100,
    min_purchase: 500,
    max_discount: null,
    start_date: '2026-02-10',
    end_date: '2026-02-15',
    status: 'expired',
    uses_count: 63,
    total_discount: 6300,
    products_count: '8 products',
  },
])

const columns = [
  { key: 'name', label: 'Promotion', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'discount_value', label: 'Discount' },
  { key: 'duration', label: 'Duration' },
  { key: 'uses_count', label: 'Uses', align: 'right' as const, sortable: true },
  { key: 'total_discount', label: 'Total Discount', align: 'right' as const },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'center' as const },
]

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    active: 'success',
    scheduled: 'info',
    expired: 'danger',
    draft: 'warning',
  }
  return map[status] ?? 'info'
}

function handleDelete(id: number) {
  promotions.value = promotions.value.filter((p) => p.id !== id)
}

onMounted(() => {
  breadcrumbStore.setPageInfo('My Promotions', [
    { label: 'Promotions' },
  ], 'Manage your product promotions and sales')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">My Promotions</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Create and manage promotional offers for your products</p>
      </div>
      <router-link
        to="/vendor/promotions/create"
        class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        <PlusIcon class="h-4 w-4" />
        Create Promotion
      </router-link>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :change="stat.change"
        :trend="stat.trend"
        :change-label="stat.changeLabel"
        :color="stat.color"
      />
    </div>

    <!-- Table -->
    <BaseCard>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            placeholder="Search promotions..."
            class="pl-10"
          />
        </div>
        <FormSelect
          v-model="statusFilter"
          :options="[
            { label: 'All Statuses', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Expired', value: 'expired' },
          ]"
          class="w-36"
        />
      </div>

      <DataTable
        :columns="columns"
        :data="promotions"
        :loading="isLoading"
        :total="promotions.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.products_count }}</p>
          </div>
        </template>

        <template #cell-type="{ row }">
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {{ row.type }}
          </span>
        </template>

        <template #cell-discount_value="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ row.type === 'percentage' ? `${row.discount_value}%` : formatCurrency(row.discount_value) }}
          </span>
        </template>

        <template #cell-duration="{ row }">
          <div class="text-xs text-gray-600 dark:text-gray-400">
            <p>{{ formatDate(row.start_date, 'MMM D') }}</p>
            <p>→ {{ formatDate(row.end_date, 'MMM D') }}</p>
          </div>
        </template>

        <template #cell-total_discount="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatCurrency(row.total_discount) }}</span>
        </template>

        <template #cell-status="{ row }">
          <span
            :class="{
              'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400': getStatusVariant(row.status) === 'success',
              'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-400': getStatusVariant(row.status) === 'info',
              'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400': getStatusVariant(row.status) === 'danger',
              'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400': getStatusVariant(row.status) === 'warning',
            }"
            class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          >
            {{ row.status }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-1">
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-900/20"
              @click="handleDelete(row.id)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
