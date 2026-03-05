<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Customer Detail — Customer info, orders, addresses -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useCurrency, useDate } from '@/composables'
import { customerService } from '@/services'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { CustomerDetail as CustomerDetailType, CustomerOrder, CustomerAddress, TableColumn } from '@/types'
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ShoppingBagIcon,
  CreditCardIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const currency = useCurrency()
const date = useDate()

// Customer ID
const customerId = computed(() => {
  const raw = route.params.id as string
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Customer Details', [
    { label: 'Customers', to: '/admin/customers' },
    { label: 'Customer Details' },
  ])
  
  if (customerId.value) {
    fetchCustomer()
  } else {
    router.push('/admin/customers')
  }
})

// Data
const isLoading = ref(true)
const customer = ref<CustomerDetailType | null>(null)
const activeTab = ref<'orders' | 'addresses'>('orders')

// Tabs
const tabs = [
  { id: 'orders', label: 'Order History', icon: ShoppingBagIcon },
  { id: 'addresses', label: 'Addresses', icon: MapPinIcon },
]

// Order columns
const orderColumns: TableColumn[] = [
  { key: 'order_number', label: 'Order #', sortable: true },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'total', label: 'Total', sortable: true, align: 'right' },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch customer from API
async function fetchCustomer() {
  if (!customerId.value) return
  
  isLoading.value = true
  try {
    const data = await customerService.getById(customerId.value)
    customer.value = data
  } catch (error: any) {
    console.error('Failed to fetch customer:', error)
    toast.error(error.response?.data?.message || 'Failed to fetch customer')
    router.push('/admin/customers')
  } finally {
    isLoading.value = false
  }
}

// Get status badge color
function getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
  const colors: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
    active: 'green',
    inactive: 'gray',
    suspended: 'red',
    delivered: 'green',
    processing: 'blue',
    shipped: 'blue',
    pending: 'yellow',
    cancelled: 'red',
    refunded: 'gray',
  }
  return colors[status] || 'gray'
}

// View order
function viewOrder(order: CustomerOrder) {
  router.push(`/admin/orders/${order.id}`)
}

// Navigation
function goBack() {
  router.push('/admin/customers')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <BaseButton variant="ghost" size="sm" @click="goBack">
        <ArrowLeftIcon class="h-5 w-5" />
      </BaseButton>
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Customer Details</h1>
        <p v-if="customer" class="text-sm text-gray-500">{{ customer.email }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Content -->
    <template v-else-if="customer">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Customer Profile -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Profile Card -->
          <BaseCard>
            <div class="text-center">
              <div class="w-24 h-24 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                <UserCircleIcon class="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ customer.full_name }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Customer since {{ date.formatDate(customer.created_at) }}
              </p>
              <div class="mt-3">
                <BaseBadge :color="getStatusColor(customer.status)">
                  {{ customer.status }}
                </BaseBadge>
              </div>
            </div>
            
            <div class="mt-6 space-y-4">
              <div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <EnvelopeIcon class="h-5 w-5" />
                <span class="text-sm">{{ customer.email }}</span>
              </div>
              <div v-if="customer.phone" class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <PhoneIcon class="h-5 w-5" />
                <span class="text-sm">{{ customer.phone }}</span>
              </div>
            </div>
          </BaseCard>

          <!-- Stats Card -->
          <BaseCard title="Statistics">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CreditCardIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span class="text-gray-600 dark:text-gray-400">Total Spent</span>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ currency.formatCurrency(customer.total_spent) }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <ShoppingBagIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span class="text-gray-600 dark:text-gray-400">Total Orders</span>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ customer.order_count }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Reviews Given</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ customer.review_count }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Avg. Order Value</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ currency.formatCurrency(customer.order_count > 0 ? customer.total_spent / customer.order_count : 0) }}
                </span>
              </div>
              
              <div v-if="customer.last_login_at" class="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Last login: {{ date.formatDate(customer.last_login_at) }}
                </span>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Tabs -->
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex gap-4">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id as typeof activeTab"
                :class="[
                  'pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
              >
                <component :is="tab.icon" class="h-5 w-5" />
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <!-- Orders Tab -->
          <BaseCard v-if="activeTab === 'orders'">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">Order History</h3>
                <span class="text-sm text-gray-500">{{ customer.recent_orders.length }} orders</span>
              </div>
            </template>
            
            <template v-if="customer.recent_orders.length === 0">
              <EmptyState
                :icon="ShoppingBagIcon"
                title="No orders yet"
                description="This customer hasn't placed any orders."
              />
            </template>
            
            <template v-else>
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                <div
                  v-for="order in customer.recent_orders"
                  :key="order.id"
                  class="py-4 flex items-center justify-between"
                >
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ order.order_number }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ date.formatDate(order.created_at) }}
                    </p>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <BaseBadge :color="getStatusColor(order.status)">
                      {{ order.status }}
                    </BaseBadge>
                    <span class="font-semibold text-gray-900 dark:text-white">
                      {{ currency.formatCurrency(order.total_amount) }}
                    </span>
                    <BaseButton variant="ghost" size="sm" @click="viewOrder(order)">
                      View
                    </BaseButton>
                  </div>
                </div>
              </div>
            </template>
          </BaseCard>

          <!-- Addresses Tab -->
          <div v-if="activeTab === 'addresses'" class="space-y-4">
            <template v-if="customer.addresses.length === 0">
              <BaseCard>
                <EmptyState
                  :icon="MapPinIcon"
                  title="No addresses"
                  description="This customer hasn't added any addresses."
                />
              </BaseCard>
            </template>
            
            <template v-else>
              <BaseCard
                v-for="address in customer.addresses"
                :key="address.id"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <MapPinIcon class="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-medium text-gray-900 dark:text-white">
                          {{ address.label }}
                        </span>
                        <BaseBadge v-if="address.is_default_shipping" color="green" size="sm">
                          Default Shipping
                        </BaseBadge>
                        <BaseBadge v-if="address.is_default_billing" color="blue" size="sm">
                          Default Billing
                        </BaseBadge>
                      </div>
                      <p class="text-gray-600 dark:text-gray-400">{{ address.name }}</p>
                      <p class="text-gray-600 dark:text-gray-400">{{ address.phone }}</p>
                      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {{ address.address_line_1 }}
                        <span v-if="address.address_line_2">, {{ address.address_line_2 }}</span>
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ address.city }}, {{ address.district }}
                        <span v-if="address.postal_code"> - {{ address.postal_code }}</span>
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">{{ address.country }}</p>
                    </div>
                  </div>
                </div>
              </BaseCard>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
