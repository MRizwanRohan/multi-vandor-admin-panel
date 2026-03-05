<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Order Detail — View & update order status                  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { orderService } from '@/services'
import { useToast, useCurrency, useDate, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { OrderDetail as OrderDetailType, OrderStatus, ORDER_STATUS_TRANSITIONS } from '@/types'
import {
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CubeIcon,
  BanknotesIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirmDialog = useConfirm()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

const orderId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? null : id
})

// Loading
const isLoading = ref(true)
const isUpdating = ref(false)

// Order data
const order = ref<OrderDetailType | null>(null)

// Status update
const newStatus = ref<OrderStatus | ''>('')
const statusNotes = ref('')

// Allowed transitions from the current status (vendor-limited)
const VENDOR_ALLOWED: OrderStatus[] = ['confirmed', 'processing', 'shipped']

const allowedNextStatuses = computed(() => {
  if (!order.value) return []
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['completed', 'refunded'],
    completed: ['refunded'],
    cancelled: [],
    refunded: [],
  }
  return (transitions[order.value.status] || []).filter(s =>
    VENDOR_ALLOWED.includes(s) || s === 'cancelled'
  )
})

const statusOptions = computed(() =>
  allowedNextStatuses.value.map(s => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }))
)

// Computed earnings
const totalCommission = computed(() => {
  if (!order.value?.items) return 0
  return order.value.items.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0)
})

const vendorEarning = computed(() => {
  if (!order.value) return 0
  return Number(order.value.total_amount) - totalCommission.value
})

// Set page info
onMounted(async () => {
  if (!orderId.value) {
    toast.error('Invalid order ID')
    router.push('/vendor/orders')
    return
  }
  breadcrumbStore.setPageInfo('Order Details', [
    { label: 'Orders', to: '/vendor/orders' },
    { label: `Order #${orderId.value}` },
  ])

  await loadOrder()
})

// Load order
async function loadOrder() {
  isLoading.value = true
  try {
    order.value = await orderService.getById(orderId.value!)
    newStatus.value = allowedNextStatuses.value[0] || ''
    breadcrumbStore.setPageInfo(`Order ${order.value.order_number}`, [
      { label: 'Orders', to: '/vendor/orders' },
      { label: order.value.order_number },
    ])
  } catch {
    toast.error('Failed to load order')
    router.push('/vendor/orders')
  } finally {
    isLoading.value = false
  }
}

// Update status
async function updateStatus() {
  if (!order.value || !newStatus.value) return

  isUpdating.value = true
  try {
    const updated = await orderService.updateStatus(order.value.id, {
      status: newStatus.value,
      notes: statusNotes.value || undefined,
    })
    order.value = updated
    statusNotes.value = ''
    newStatus.value = allowedNextStatuses.value[0] || ''
    toast.success('Order status updated')
  } catch {
    toast.error('Failed to update status')
  } finally {
    isUpdating.value = false
  }
}

// Get status variant
function getStatusVariant(status: string) {
  const variants: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'danger' | 'secondary'> = {
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

// Get payment status variant
function getPaymentVariant(status: string) {
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
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" @click="router.push('/vendor/orders')">
          <ArrowLeftIcon class="mr-2 h-4 w-4" />
          Back
        </BaseButton>
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ order.order_number }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Placed on {{ formatDate(order.created_at, 'MMMM D, YYYY [at] h:mm A') }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseBadge :variant="getStatusVariant(order.status)" size="lg" class="capitalize">
          {{ order.status_label || order.status }}
        </BaseBadge>
        <BaseBadge :variant="getPaymentVariant(order.payment_status)" size="lg" class="capitalize">
          {{ order.payment_status }}
        </BaseBadge>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main content -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Order items -->
        <BaseCard title="Order Items">
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
                <h4 class="font-medium text-gray-900 dark:text-white truncate">
                  {{ item.product?.name || 'Deleted Product' }}
                </h4>
                <p v-if="item.variant?.name" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ item.variant.name }}
                  <span v-if="item.variant?.sku" class="ml-2 text-xs text-gray-400">
                    SKU: {{ item.variant.sku }}
                  </span>
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Qty: {{ item.quantity }} × {{ formatCurrency(item.unit_price) }}
                </p>
              </div>

              <div class="text-right shrink-0">
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ formatCurrency(item.total) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Order summary -->
          <div class="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div class="space-y-2">
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
              <div class="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold dark:border-gray-700">
                <span class="text-gray-900 dark:text-white">Total</span>
                <span class="text-gray-900 dark:text-white">{{ formatCurrency(order.total_amount) }}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Customer info -->
        <BaseCard title="Customer Information">
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 class="mb-3 font-medium text-gray-900 dark:text-white">
                Contact Details
              </h4>
              <div class="space-y-2">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ order.customer?.name || 'Guest' }}
                </p>
                <div v-if="order.customer?.email" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <EnvelopeIcon class="h-4 w-4" />
                  {{ order.customer.email }}
                </div>
              </div>
            </div>

            <div v-if="order.shipping_address">
              <h4 class="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <MapPinIcon class="h-5 w-5" />
                Shipping Address
              </h4>
              <address class="not-italic text-sm text-gray-600 dark:text-gray-400">
                <p class="font-medium text-gray-900 dark:text-white">{{ order.shipping_address.full_name }}</p>
                <p v-if="order.shipping_address.phone" class="flex items-center gap-1">
                  <PhoneIcon class="h-3 w-3" /> {{ order.shipping_address.phone }}
                </p>
                <p>{{ order.shipping_address.address_line1 }}</p>
                <p v-if="order.shipping_address.address_line2">{{ order.shipping_address.address_line2 }}</p>
                <p>{{ order.shipping_address.city }}, {{ order.shipping_address.state }} {{ order.shipping_address.postal_code }}</p>
                <p>{{ order.shipping_address.country }}</p>
              </address>
            </div>
          </div>
        </BaseCard>

        <!-- Timeline -->
        <BaseCard v-if="order.status_history?.length" title="Order Timeline">
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
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Your earnings -->
        <BaseCard>
          <div class="text-center">
            <BanknotesIcon class="mx-auto h-12 w-12 text-green-500" />
            <h3 class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
              Your Earnings
            </h3>
            <p class="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(vendorEarning) }}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Commission: {{ formatCurrency(totalCommission) }}
            </p>
          </div>
        </BaseCard>

        <!-- Update status -->
        <BaseCard v-if="statusOptions.length" title="Update Status">
          <div class="space-y-3">
            <FormSelect
              v-model="newStatus"
              name="status"
              :options="statusOptions"
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
              :disabled="!newStatus"
              :loading="isUpdating"
              @click="updateStatus"
            >
              <TruckIcon class="mr-2 h-4 w-4" />
              Update Status
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Status is final -->
        <BaseCard v-else>
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            <p class="font-medium">No further status changes available</p>
            <p class="mt-1">This order is <strong class="capitalize">{{ order.status }}</strong></p>
          </div>
        </BaseCard>

        <!-- Payment info -->
        <BaseCard title="Payment">
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Method</span>
              <span class="font-medium capitalize text-gray-900 dark:text-white">
                {{ order.payment_method || '—' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <BaseBadge :variant="getPaymentVariant(order.payment_status)" size="sm" class="capitalize">
                {{ order.payment_status }}
              </BaseBadge>
            </div>
            <div v-if="order.shipped_at" class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Shipped</span>
              <span class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(order.shipped_at, 'MMM D, YYYY') }}
              </span>
            </div>
            <div v-if="order.delivered_at" class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Delivered</span>
              <span class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(order.delivered_at, 'MMM D, YYYY') }}
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Customer notes -->
        <BaseCard v-if="order.notes" title="Customer Notes">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ order.notes }}
          </p>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
