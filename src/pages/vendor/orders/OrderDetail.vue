<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Order Detail — View order details page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { orderService } from '@/services'
import { useToast, useCurrency, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import FormSelect from '@/components/form/FormSelect.vue'
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
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

const orderId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? null : id
})

// Loading
const isLoading = ref(true)

// Order data
const order = ref<any>(null)

// Status options (vendor can only update to certain statuses)
const statusOptions = [
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

// New status
const newStatus = ref('')

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
    newStatus.value = order.value.status
  } catch {
    // Mock data
    order.value = {
      id: orderId.value,
      orderNumber: `ORD-${orderId.value}`,
      status: 'processing',
      customer: {
        name: 'আহমেদ হোসেন',
        email: 'ahmed@example.com',
        phone: '+8801712345678',
      },
      shippingAddress: {
        street: '১২৩ গুলশান এভিনিউ',
        city: 'ঢাকা',
        state: 'ঢাকা',
        postalCode: '১২১২',
        country: 'বাংলাদেশ',
      },
      items: [
        {
          id: '1',
          product: {
            id: 'p1',
            name: 'স্মার্ট ওয়াচ প্রো',
            image: null,
          },
          quantity: 2,
          price: 4500,
          subtotal: 9000,
        },
        {
          id: '2',
          product: {
            id: 'p2',
            name: 'ওয়্যারলেস হেডফোন',
            image: null,
          },
          quantity: 1,
          price: 2500,
          subtotal: 2500,
        },
      ],
      subtotal: 11500,
      shippingCost: 100,
      total: 11600,
      yourEarnings: 10440,
      commission: 1160,
      paymentMethod: 'bKash',
      paymentStatus: 'paid',
      createdAt: '2024-12-12T10:30:00Z',
      updatedAt: '2024-12-12T10:30:00Z',
    }
    newStatus.value = order.value.status
  } finally {
    isLoading.value = false
  }
}

// Update status
async function updateStatus() {
  if (newStatus.value === order.value.status) return
  
  try {
    await orderService.updateStatus(orderId.value!, newStatus.value)
    order.value.status = newStatus.value
    toast.success('Order status updated')
  } catch {
    toast.error('Failed to update status')
  }
}

// Get status variant
function getStatusVariant(status: string) {
  const variants: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'danger'> = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger',
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
  return variants[status] || 'secondary'
}

// Go back
function goBack() {
  router.push('/vendor/orders')
}
</script>

<template>
  <PageLoader v-if="isLoading" />
  <div v-else-if="order" class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" @click="goBack">
          <ArrowLeftIcon class="mr-2 h-4 w-4" />
          Back
        </BaseButton>
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ order.orderNumber }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Placed on {{ formatDate(order.createdAt, 'full') }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseBadge :variant="getStatusVariant(order.status)" size="lg">
          {{ order.status }}
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
              <div
                v-if="item.product.image"
                class="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
              >
                <img
                  :src="item.product.image"
                  :alt="item.product.name"
                  class="h-full w-full object-cover"
                />
              </div>
              <div
                v-else
                class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700"
              >
                <CubeIcon class="h-8 w-8" />
              </div>

              <div class="flex-1">
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ item.product.name }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Qty: {{ item.quantity }} × {{ formatCurrency(item.price) }}
                </p>
              </div>

              <div class="text-right">
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ formatCurrency(item.subtotal) }}
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
              <div class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Shipping</span>
                <span class="text-gray-900 dark:text-white">{{ formatCurrency(order.shippingCost) }}</span>
              </div>
              <div class="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold dark:border-gray-700">
                <span class="text-gray-900 dark:text-white">Total</span>
                <span class="text-gray-900 dark:text-white">{{ formatCurrency(order.total) }}</span>
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
                <p class="text-gray-900 dark:text-white">
                  {{ order.customer.name }}
                </p>
                <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <EnvelopeIcon class="h-4 w-4" />
                  {{ order.customer.email }}
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <PhoneIcon class="h-4 w-4" />
                  {{ order.customer.phone }}
                </div>
              </div>
            </div>

            <div>
              <h4 class="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <MapPinIcon class="h-5 w-5" />
                Shipping Address
              </h4>
              <address class="not-italic text-gray-600 dark:text-gray-400">
                {{ order.shippingAddress.street }}<br />
                {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }}<br />
                {{ order.shippingAddress.postalCode }}<br />
                {{ order.shippingAddress.country }}
              </address>
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
              {{ formatCurrency(order.yourEarnings) }}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Commission: {{ formatCurrency(order.commission) }}
            </p>
          </div>
        </BaseCard>

        <!-- Update status -->
        <BaseCard title="Update Status">
          <div class="space-y-4">
            <FormSelect
              v-model="newStatus"
              name="status"
              :options="statusOptions"
            />
            <BaseButton
              variant="primary"
              block
              :disabled="newStatus === order.status"
              @click="updateStatus"
            >
              <TruckIcon class="mr-2 h-4 w-4" />
              Update Status
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Payment info -->
        <BaseCard title="Payment">
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Method</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ order.paymentMethod }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Status</span>
              <BaseBadge :variant="getPaymentVariant(order.paymentStatus)">
                {{ order.paymentStatus }}
              </BaseBadge>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
