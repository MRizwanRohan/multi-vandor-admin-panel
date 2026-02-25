<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Order List — Order management list page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { orderService } from '@/services'
import { useCurrency, usePagination, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Order, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const pagination = usePagination()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Orders', [
    { label: 'Orders' },
  ], 'Manage all orders')
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
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'orderNumber', label: 'Order', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'items', label: 'Items', align: 'center' },
  { key: 'total', label: 'Total', sortable: true, align: 'right' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
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
      search: searchQuery.value,
      status: statusFilter.value || undefined,
    })
    orders.value = response.data
    pagination.total.value = response.meta.total
  } catch (error) {
    // Mock data
    orders.value = [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        customer: { id: '1', name: 'John Doe', email: 'john@example.com' },
        items: [
          { id: '1', productId: '1', productName: 'T-Shirt', quantity: 2, price: 1500, total: 3000 },
        ],
        subtotal: 3000,
        tax: 150,
        shipping: 100,
        discount: 0,
        total: 3250,
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        shippingAddress: { street: '123 Main St', city: 'Dhaka', state: 'Dhaka', postalCode: '1205', country: 'Bangladesh' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        customer: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        items: [
          { id: '1', productId: '2', productName: 'Jeans', quantity: 1, price: 3500, total: 3500 },
          { id: '2', productId: '3', productName: 'Shoes', quantity: 1, price: 5500, total: 5500 },
        ],
        subtotal: 9000,
        tax: 450,
        shipping: 150,
        discount: 500,
        total: 9100,
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'bkash',
        shippingAddress: { street: '456 Fashion Ave', city: 'Chittagong', state: 'Chittagong', postalCode: '4000', country: 'Bangladesh' },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-003',
        customer: { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
        items: [
          { id: '1', productId: '4', productName: 'Watch', quantity: 1, price: 15000, total: 15000 },
        ],
        subtotal: 15000,
        tax: 750,
        shipping: 0,
        discount: 1000,
        total: 14750,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'cod',
        shippingAddress: { street: '789 Tech Park', city: 'Sylhet', state: 'Sylhet', postalCode: '3100', country: 'Bangladesh' },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as any[]
    pagination.total.value = 3
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
  router.push(`/admin/orders/${order.id}`)
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger',
    refunded: 'secondary',
  }
  return variants[status] || 'secondary'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          name="statusFilter"
          :options="statusOptions"
          class="w-40"
        />
      </div>

      <BaseButton variant="secondary" size="sm">
        <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
        Export
      </BaseButton>
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
            {{ item.item_count || 0 }} items
          </span>
        </template>

        <template #cell-total="{ item }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ currency.format(item.total_amount) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)" class="capitalize">
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-date="{ item }">
          <span class="text-gray-500 dark:text-gray-400">
            {{ date.format(item.created_at, 'MMM D, YYYY') }}
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
      </DataTable>
    </BaseCard>
  </div>
</template>
