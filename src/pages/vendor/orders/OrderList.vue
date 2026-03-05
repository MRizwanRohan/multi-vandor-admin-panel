<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Order List — Vendor's order management page                -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { orderService } from '@/services'
import { useCurrency, usePagination, useDate, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Order, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()
const toast = useToast()
const pagination = usePagination()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('My Orders', [
    { label: 'Orders' },
  ], 'Manage orders for your products')
  fetchOrders()
})

// Data
const orders = ref<Order[]>([])
const isLoading = ref(true)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'orderNumber', label: 'Order', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'items', label: 'Items', align: 'center' },
  { key: 'total', label: 'Total', sortable: true, align: 'right' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
  { key: 'payment', label: 'Payment', align: 'center' },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch orders
async function fetchOrders() {
  isLoading.value = true
  try {
    const response = await orderService.getAll({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
    })
    orders.value = response.data
    pagination.total.value = response.meta.total
  } catch (error) {
    toast.error('Failed to load orders')
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch([searchQuery, statusFilter], () => {
  pagination.currentPage.value = 1
  fetchOrders()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchOrders()
})

// Actions
function viewOrder(order: Order) {
  router.push(`/vendor/orders/${order.id}`)
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    confirmed: 'info',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
  }
  return variants[status] || 'secondary'
}

function getPaymentVariant(status: string): 'success' | 'warning' | 'danger' {
  const variants: Record<string, 'success' | 'warning' | 'danger'> = {
    paid: 'success',
    pending: 'warning',
    failed: 'danger',
  }
  return variants[status] || 'warning'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="flex flex-1 items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search orders..."
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-40"
        />
      </div>
    </div>

    <!-- Orders table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="orders"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.total.value"
        @update:currentPage="pagination.currentPage.value = $event"
        @update:perPage="pagination.perPage.value = $event"
      >
        <template #cell-orderNumber="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ item.order_number }}
          </span>
        </template>

        <template #cell-customer="{ item }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ item.customer?.name || 'Guest' }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ item.customer?.email }}
            </p>
          </div>
        </template>

        <template #cell-items="{ item }">
          <span class="text-gray-900 dark:text-white">
            {{ item.items_count ?? 0 }}
          </span>
        </template>

        <template #cell-total="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ formatCurrency(item.total_amount) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)" class="capitalize">
            {{ item.status_label || item.status }}
          </BaseBadge>
        </template>

        <template #cell-payment="{ item }">
          <BaseBadge :variant="getPaymentVariant(item.payment_status)" size="sm" class="capitalize">
            {{ item.payment_status }}
          </BaseBadge>
        </template>

        <template #cell-date="{ item }">
          <span class="text-gray-500 dark:text-gray-400">
            {{ formatDate(item.created_at, 'MMM D, YYYY') }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <button
            type="button"
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            @click="viewOrder(item)"
          >
            <EyeIcon class="h-5 w-5" />
          </button>
        </template>

        <template #empty>
          <EmptyState
            title="No orders yet"
            description="Orders for your products will appear here."
          />
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
