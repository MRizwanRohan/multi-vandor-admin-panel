<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Order Detail — View order details page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { orderService } from '@/services'
import { useCurrency, useDate, useConfirm, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import type { OrderDetail as OrderDetailType, OrderStatus } from '@/types'
import type { OrderStatusUpdate } from '@/services/order.service'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const date = useDate()
const confirm = useConfirm()
const toast = useToast()

// Data
const order = ref<OrderDetailType | null>(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const orderId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? null : id
})

// Status options
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Set page info
onMounted(() => {
  if (!orderId.value) {
    toast.error('Invalid order ID')
    return
  }
  fetchOrder()
})

// Fetch order
async function fetchOrder() {
  isLoading.value = true
  try {
    order.value = await orderService.getById(orderId.value!) as OrderDetailType
    breadcrumbStore.setPageInfo(`Order ${order.value.order_number}`, [
      { label: 'Orders', to: '/admin/orders' },
      { label: order.value.order_number },
    ])
  } catch (error) {
    toast.error('Failed to fetch order')
    // Mock data
    order.value = {
      id: orderId.value!,
      order_number: 'ORD-2024-001',
      customer: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+880123456789',
      },
      items: [
        { id: 1, product_id: 1, product_name: 'Premium T-Shirt', variant_name: 'Red / M', quantity: 2, unit_price: 1500, total_price: 3000, product_image: 'https://placehold.co/100x100?text=T-Shirt' },
        { id: 2, product_id: 2, product_name: 'Classic Jeans', variant_name: 'Blue / 32', quantity: 1, unit_price: 3500, total_price: 3500, product_image: 'https://placehold.co/100x100?text=Jeans' },
      ],
      subtotal: 6500,
      tax_amount: 325,
      shipping_amount: 100,
      discount_amount: 500,
      total_amount: 6425,
      status: 'processing',
      payment_status: 'paid',
      payment_method: 'bkash',
      shipping_address: {
        name: 'John Doe',
        phone: '+880123456789',
        address_line_1: '123 Fashion Street',
        address_line_2: null,
        city: 'Dhaka',
        district: 'Dhaka',
        postal_code: '1205',
        country: 'Bangladesh',
      },
      billing_address: {
        name: 'John Doe',
        phone: '+880123456789',
        address_line_1: '123 Fashion Street',
        address_line_2: null,
        city: 'Dhaka',
        district: 'Dhaka',
        postal_code: '1205',
        country: 'Bangladesh',
      },
      notes: 'Please deliver before 5 PM',
      status_history: [
        { id: 1, from_status: null, to_status: 'pending', notes: 'Order was placed by customer', changed_by: 'system', changed_at: '2024-01-15T10:30:00Z' },
        { id: 2, from_status: 'pending', to_status: 'processing', notes: 'Order is being prepared', changed_by: 'admin', changed_at: '2024-01-15T11:00:00Z' },
      ],
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T11:00:00Z',
    } as any
    breadcrumbStore.setPageInfo(`Order ${order.value!.order_number}`, [
      { label: 'Orders', to: '/admin/orders' },
      { label: order.value!.order_number },
    ])
  } finally {
    isLoading.value = false
  }
}

// Update status
async function updateStatus(newStatus: OrderStatus) {
  if (!order.value) return

  isUpdating.value = true
  try {
    const statusUpdate: OrderStatusUpdate = { status: newStatus }
    await orderService.updateStatus(order.value.id, statusUpdate)
    toast.success('Order status updated')
    order.value.status = newStatus
  } catch (error) {
    toast.error('Failed to update status')
  } finally {
    isUpdating.value = false
  }
}

// Cancel order
async function cancelOrder() {
  if (!order.value) return

  const confirmed = await confirm.confirm({
    title: 'Cancel Order',
    message: 'Are you sure you want to cancel this order? This action cannot be undone.',
    confirmText: 'Cancel Order',
    cancelText: 'Keep Order',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      await orderService.updateStatus(order.value.id, { status: 'cancelled' })
      toast.success('Order cancelled')
      order.value.status = 'cancelled'
    } catch (error) {
      toast.error('Failed to cancel order')
    }
  }
}

// Status variants
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
  <PageLoader v-if="isLoading" />

  <div v-else-if="order" class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" to="/admin/orders">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ order.order_number }}
            </h1>
            <BaseBadge :variant="getStatusVariant(order.status)" class="capitalize">
              {{ order.status }}
            </BaseBadge>
            <BaseBadge :variant="getPaymentVariant(order.payment_status)" class="capitalize">
              {{ order.payment_status }}
            </BaseBadge>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Placed on {{ date.format(order.created_at, 'MMMM D, YYYY [at] h:mm A') }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton variant="secondary" size="sm">
          <PrinterIcon class="mr-2 h-4 w-4" />
          Print
        </BaseButton>
        <BaseButton
          v-if="order.status !== 'cancelled' && order.status !== 'delivered'"
          variant="danger"
          size="sm"
          @click="cancelOrder"
        >
          Cancel Order
        </BaseButton>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main content -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Order items -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Order Items
          </h3>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <img
                  v-if="item.product_image"
                  :src="item.product_image"
                  :alt="item.product_name"
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ item.product_name }}
                </p>
                <p v-if="item.variant_name" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ item.variant_name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ currency.formatCurrency(item.unit_price) }} × {{ item.quantity }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ currency.formatCurrency(item.total_price) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Order summary -->
          <div class="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span class="text-gray-900 dark:text-white">{{ currency.formatCurrency(order.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Tax</span>
              <span class="text-gray-900 dark:text-white">{{ currency.formatCurrency(order.tax_amount) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Shipping</span>
              <span class="text-gray-900 dark:text-white">{{ currency.formatCurrency(order.shipping_amount) }}</span>
            </div>
            <div v-if="order.discount_amount" class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Discount</span>
              <span class="text-success-600 dark:text-success-400">-{{ currency.formatCurrency(order.discount_amount) }}</span>
            </div>
            <div class="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
              <span class="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
              <span class="text-lg font-bold text-gray-900 dark:text-white">{{ currency.formatCurrency(order.total_amount) }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Timeline -->
        <BaseCard v-if="order.status_history?.length">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Order Timeline
          </h3>
          <div class="space-y-4">
            <div
              v-for="(event, index) in order.status_history"
              :key="event.id"
              class="flex gap-4"
            >
              <div class="flex flex-col items-center">
                <div class="h-3 w-3 rounded-full bg-primary-600"></div>
                <div v-if="index < order.status_history.length - 1" class="h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div class="flex-1 pb-4">
                <p class="font-medium text-gray-900 dark:text-white capitalize">
                  {{ event.to_status }}
                </p>
                <p v-if="event.notes" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ event.notes }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  {{ date.format(event.changed_at, 'MMM D, YYYY [at] h:mm A') }}
                </p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Update status -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Update Status
          </h3>
          <FormSelect
            name="orderStatus"
            :model-value="order.status"
            :options="statusOptions"
            :disabled="order.status === 'cancelled' || order.status === 'delivered'"
            @update:modelValue="updateStatus($event as OrderStatus)"
          />
        </BaseCard>

        <!-- Customer info -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Customer
          </h3>
          <div class="space-y-3">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ order.customer?.name }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ order.customer?.email }}
            </p>
            <p v-if="(order.customer as any)?.phone" class="text-sm text-gray-500 dark:text-gray-400">
              {{ (order.customer as any).phone }}
            </p>
          </div>
        </BaseCard>

        <!-- Shipping address -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Shipping Address
          </h3>
          <address class="not-italic text-sm text-gray-600 dark:text-gray-400">
            {{ order.shipping_address.address_line_1 }}<br>
            {{ order.shipping_address.city }}, {{ order.shipping_address.district }} {{ order.shipping_address.postal_code }}<br>
            {{ order.shipping_address.country }}
          </address>
        </BaseCard>

        <!-- Payment info -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Payment
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Method</span>
              <span class="text-sm font-medium capitalize text-gray-900 dark:text-white">
                {{ order.payment_method }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <BaseBadge :variant="getPaymentVariant(order.payment_status)" size="sm" class="capitalize">
                {{ order.payment_status }}
              </BaseBadge>
            </div>
          </div>
        </BaseCard>

        <!-- Notes -->
        <BaseCard v-if="order.notes">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Order Notes
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ order.notes }}
          </p>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
