<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Order Detail — View & manage order details                  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { orderService } from '@/services'
import { useCurrency, useDate, useConfirm, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { OrderDetail as OrderDetailType, OrderStatus } from '@/types'
import {
  ArrowLeftIcon,
  PrinterIcon,
  CubeIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()
const confirm = useConfirm()
const toast = useToast()

// Data
const order = ref<OrderDetailType | null>(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const newStatus = ref<OrderStatus | ''>('')
const statusNotes = ref('')

const orderId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? null : id
})

// All statuses — admin can force any status
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

// Computed
const totalCommission = computed(() => {
  if (!order.value?.items) return 0
  return order.value.items.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0)
})

const vendorEarning = computed(() => {
  if (!order.value) return 0
  return Number(order.value.total_amount) - totalCommission.value
})

// Set page info
onMounted(() => {
  if (!orderId.value) {
    toast.error('Invalid order ID')
    router.push('/admin/orders')
    return
  }
  fetchOrder()
})

// Fetch order
async function fetchOrder() {
  isLoading.value = true
  try {
    order.value = await orderService.getById(orderId.value!)
    newStatus.value = order.value.status
    breadcrumbStore.setPageInfo(`Order ${order.value.order_number}`, [
      { label: 'Orders', to: '/admin/orders' },
      { label: order.value.order_number },
    ])
  } catch (error) {
    toast.error('Failed to fetch order')
    router.push('/admin/orders')
  } finally {
    isLoading.value = false
  }
}

// Update status
async function updateStatus() {
  if (!order.value || !newStatus.value || newStatus.value === order.value.status) return

  isUpdating.value = true
  try {
    const updated = await orderService.updateStatus(order.value.id, {
      status: newStatus.value,
      notes: statusNotes.value || undefined,
    })
    order.value = updated
    newStatus.value = updated.status
    statusNotes.value = ''
    toast.success('Order status updated')
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
    isUpdating.value = true
    try {
      const updated = await orderService.updateStatus(order.value.id, {
        status: 'cancelled',
        notes: 'Cancelled by admin',
      })
      order.value = updated
      newStatus.value = updated.status
      toast.success('Order cancelled')
    } catch (error) {
      toast.error('Failed to cancel order')
    } finally {
      isUpdating.value = false
    }
  }
}

// Status variants
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    pending: 'warning',
    confirmed: 'info',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    completed: 'success',
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
    cancelled: 'danger',
  }
  return variants[status] || 'warning'
}

// Check if order can be cancelled
const canCancel = computed(() => {
  if (!order.value) return false
  return ['pending', 'confirmed', 'processing'].includes(order.value.status)
})
</script>

<template>
  <PageLoader v-if="isLoading" />

  <div v-else-if="order" class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" @click="router.push('/admin/orders')">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ order.order_number }}
            </h1>
            <BaseBadge :variant="getStatusVariant(order.status)" class="capitalize">
              {{ order.status_label || order.status }}
            </BaseBadge>
            <BaseBadge :variant="getPaymentVariant(order.payment_status)" class="capitalize">
              {{ order.payment_status }}
            </BaseBadge>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Placed on {{ formatDate(order.created_at, 'MMMM D, YYYY [at] h:mm A') }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton variant="secondary" size="sm">
          <PrinterIcon class="mr-2 h-4 w-4" />
          Print
        </BaseButton>
        <BaseButton
          v-if="canCancel"
          variant="danger"
          size="sm"
          :loading="isUpdating"
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
            Order Items ({{ order.items?.length || 0 }})
          </h3>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <img
                  v-if="item.product?.thumbnail"
                  :src="item.product.thumbnail"
                  :alt="item.product?.name"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
                  <CubeIcon class="h-8 w-8" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {{ item.product?.name || 'Deleted Product' }}
                </p>
                <p v-if="item.variant?.name" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ item.variant.name }}
                  <span v-if="item.variant?.sku" class="ml-2 text-xs text-gray-400">
                    SKU: {{ item.variant.sku }}
                  </span>
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(item.unit_price) }} × {{ item.quantity }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(item.total) }}
                </p>
                <p v-if="item.commission_amount" class="text-xs text-gray-400">
                  Commission: {{ formatCurrency(item.commission_amount) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Order summary -->
          <div class="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span class="text-gray-900 dark:text-white">{{ formatCurrency(order.subtotal) }}</span>
            </div>
            <div v-if="order.tax_amount" class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Tax</span>
              <span class="text-gray-900 dark:text-white">{{ formatCurrency(order.tax_amount) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Shipping</span>
              <span class="text-gray-900 dark:text-white">{{ formatCurrency(order.shipping_amount) }}</span>
            </div>
            <div v-if="order.discount_amount" class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Discount</span>
              <span class="text-green-600 dark:text-green-400">-{{ formatCurrency(order.discount_amount) }}</span>
            </div>
            <div class="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
              <span class="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
              <span class="text-lg font-bold text-gray-900 dark:text-white">{{ formatCurrency(order.total_amount) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Commission</span>
              <span class="text-orange-600 dark:text-orange-400">{{ formatCurrency(totalCommission) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Vendor Earning</span>
              <span class="text-green-600 dark:text-green-400">{{ formatCurrency(vendorEarning) }}</span>
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
              :key="index"
              class="flex gap-4"
            >
              <div class="flex flex-col items-center">
                <div class="h-3 w-3 rounded-full" :class="index === 0 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"></div>
                <div v-if="index < order.status_history!.length - 1" class="h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div class="flex-1 pb-4">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-white capitalize">
                    {{ event.new_status }}
                  </p>
                  <span v-if="event.old_status" class="text-xs text-gray-400">
                    from {{ event.old_status }}
                  </span>
                </div>
                <p v-if="event.notes" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ event.notes }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  {{ formatDate(event.created_at, 'MMM D, YYYY [at] h:mm A') }}
                  <span v-if="event.changed_by"> · by {{ event.changed_by }}</span>
                </p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Order Notes -->
        <BaseCard v-if="order.order_notes?.length">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Order Notes
          </h3>
          <div class="space-y-3">
            <div
              v-for="(note, index) in order.order_notes"
              :key="index"
              class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
            >
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ note.note }}</p>
              <p class="mt-1 text-xs text-gray-400">{{ formatDate(note.created_at, 'MMM D, YYYY h:mm A') }}</p>
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
          <div class="space-y-3">
            <FormSelect
              v-model="newStatus"
              name="orderStatus"
              :options="statusOptions"
              :disabled="order.status === 'cancelled' || order.status === 'refunded'"
            />
            <FormTextarea
              v-model="statusNotes"
              name="statusNotes"
              placeholder="Add a note (optional)"
              :rows="2"
            />
            <BaseButton
              variant="primary"
              block
              :disabled="!newStatus || newStatus === order.status"
              :loading="isUpdating"
              @click="updateStatus"
            >
              Update Status
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Customer info -->
        <BaseCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Customer
          </h3>
          <div class="space-y-2">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ order.customer?.name || 'Guest' }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ order.customer?.email }}
            </p>
          </div>
        </BaseCard>

        <!-- Vendor info -->
        <BaseCard v-if="order.vendor">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Vendor
          </h3>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ order.vendor.store_name }}
          </p>
        </BaseCard>

        <!-- Shipping address -->
        <BaseCard v-if="order.shipping_address">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Shipping Address
          </h3>
          <address class="not-italic text-sm text-gray-600 dark:text-gray-400">
            <p class="font-medium text-gray-900 dark:text-white">{{ order.shipping_address.full_name }}</p>
            <p v-if="order.shipping_address.phone">{{ order.shipping_address.phone }}</p>
            <p>{{ order.shipping_address.address_line1 }}</p>
            <p v-if="order.shipping_address.address_line2">{{ order.shipping_address.address_line2 }}</p>
            <p>{{ order.shipping_address.city }}, {{ order.shipping_address.state }} {{ order.shipping_address.postal_code }}</p>
            <p>{{ order.shipping_address.country }}</p>
          </address>
        </BaseCard>

        <!-- Billing address -->
        <BaseCard v-if="order.billing_address">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Billing Address
          </h3>
          <address class="not-italic text-sm text-gray-600 dark:text-gray-400">
            <p class="font-medium text-gray-900 dark:text-white">{{ order.billing_address.full_name }}</p>
            <p v-if="order.billing_address.phone">{{ order.billing_address.phone }}</p>
            <p>{{ order.billing_address.address_line1 }}</p>
            <p v-if="order.billing_address.address_line2">{{ order.billing_address.address_line2 }}</p>
            <p>{{ order.billing_address.city }}, {{ order.billing_address.state }} {{ order.billing_address.postal_code }}</p>
            <p>{{ order.billing_address.country }}</p>
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
                {{ order.payment_method || '—' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <BaseBadge :variant="getPaymentVariant(order.payment_status)" size="sm" class="capitalize">
                {{ order.payment_status }}
              </BaseBadge>
            </div>
            <div v-if="order.paid_at" class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Paid at</span>
              <span class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(order.paid_at, 'MMM D, YYYY h:mm A') }}
              </span>
            </div>
            <div v-if="order.coupon_code" class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Coupon</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ order.coupon_code }}
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Customer notes -->
        <BaseCard v-if="order.notes">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Customer Notes
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ order.notes }}
          </p>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
