<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Create Shipment — Create shipment for an order             -->
<!-- Uses shippingService.createShipment()                             -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { shippingService, orderService } from '@/services'
import { useToast, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormCheckbox from '@/components/form/FormCheckbox.vue'
import type { ShippingMethod } from '@/types'
import {
  ArrowLeftIcon,
  TruckIcon,
  CubeIcon,
  MapPinIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

// ── Data ─────────────────────────────────────────────────────────

const orderId = computed(() => parseInt(route.params.orderId as string, 10))
const order = ref<any>(null)
const shippingMethods = ref<ShippingMethod[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

// Form
const form = ref({
  tracking_number: '',
  carrier: '',
  shipping_method_id: null as number | null,
  shipped_at: new Date().toISOString().split('T')[0],
  estimated_delivery: '',
  weight: null as number | null,
  dimensions: '',
  notes: '',
  selectedItems: [] as number[],
})

// Common carriers
const carrierOptions = [
  { value: '', label: 'Select carrier' },
  { value: 'Sundarban Courier', label: 'Sundarban Courier' },
  { value: 'SA Paribahan', label: 'SA Paribahan' },
  { value: 'Pathao', label: 'Pathao' },
  { value: 'Redx', label: 'Redx' },
  { value: 'Paperfly', label: 'Paperfly' },
  { value: 'eCourier', label: 'eCourier' },
  { value: 'DHL', label: 'DHL' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'Other', label: 'Other' },
]

const methodOptions = computed(() => [
  { value: '', label: 'Select shipping method' },
  ...shippingMethods.value.map(m => ({
    value: m.id.toString(),
    label: `${m.name} - ${m.type === 'free' ? 'Free' : formatCurrency(m.base_rate || 0)}`,
  })),
])

// ── Fetch ────────────────────────────────────────────────────────

async function fetchData() {
  if (!orderId.value) return

  isLoading.value = true
  try {
    const [orderData, methodsData] = await Promise.all([
      orderService.getById(orderId.value),
      shippingService.getMyMethods(),
    ])
    order.value = orderData
    shippingMethods.value = methodsData || []

    // Pre-select all items
    if (order.value?.items) {
      form.value.selectedItems = order.value.items.map((item: any) => item.id)
    }

    // Calculate estimated delivery (7 days from now if not set)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + 7)
    form.value.estimated_delivery = estimatedDate.toISOString().split('T')[0]
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load order')
    router.push('/vendor/orders')
  } finally {
    isLoading.value = false
  }
}

// ── Actions ──────────────────────────────────────────────────────

async function submitShipment() {
  if (!orderId.value) return

  if (form.value.selectedItems.length === 0) {
    toast.error('Please select at least one item to ship')
    return
  }

  if (!form.value.carrier) {
    toast.error('Please select a carrier')
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      tracking_number: form.value.tracking_number || undefined,
      carrier: form.value.carrier,
      shipping_method_id: form.value.shipping_method_id || undefined,
      shipped_at: form.value.shipped_at || undefined,
      estimated_delivery: form.value.estimated_delivery || undefined,
      weight: form.value.weight || undefined,
      dimensions: form.value.dimensions || undefined,
      notes: form.value.notes || undefined,
      items: form.value.selectedItems.map(id => ({
        order_item_id: id,
        quantity: order.value?.items?.find((i: any) => i.id === id)?.quantity || 1,
      })),
    }

    const shipment = await shippingService.createShipment(orderId.value, payload)
    toast.success('Shipment created successfully')
    router.push(`/vendor/shipments/${shipment.id}`)
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to create shipment')
  } finally {
    isSubmitting.value = false
  }
}

function goBack() {
  router.push(`/vendor/orders/${orderId.value}`)
}

function toggleItem(itemId: number) {
  const index = form.value.selectedItems.indexOf(itemId)
  if (index === -1) {
    form.value.selectedItems.push(itemId)
  } else {
    form.value.selectedItems.splice(index, 1)
  }
}

function selectAll() {
  if (order.value?.items) {
    form.value.selectedItems = order.value.items.map((item: any) => item.id)
  }
}

function deselectAll() {
  form.value.selectedItems = []
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Create Shipment', [
    { label: 'Orders', to: '/vendor/orders' },
    { label: `Order #${orderId.value}`, to: `/vendor/orders/${orderId.value}` },
    { label: 'Create Shipment' },
  ])
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <BaseButton variant="ghost" size="sm" @click="goBack">
        <ArrowLeftIcon class="h-5 w-5" />
      </BaseButton>
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
          <TruckIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Create Shipment</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <template v-if="order">
              Order #{{ order.order_number || order.id }}
            </template>
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else-if="order">
      <form @submit.prevent="submitShipment" class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Main Form -->
          <div class="space-y-6 lg:col-span-2">
            <!-- Items to Ship -->
            <BaseCard title="Items to Ship">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ form.selectedItems.length }} of {{ order.items?.length || 0 }} items selected
                </p>
                <div class="flex gap-2">
                  <button type="button" class="text-sm text-primary-600 hover:text-primary-700" @click="selectAll">
                    Select All
                  </button>
                  <span class="text-gray-300">|</span>
                  <button type="button" class="text-sm text-gray-600 hover:text-gray-700" @click="deselectAll">
                    Deselect All
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="flex items-center gap-4 rounded-lg border p-3 cursor-pointer transition-colors"
                  :class="form.selectedItems.includes(item.id)
                    ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
                  @click="toggleItem(item.id)"
                >
                  <FormCheckbox
                    :model-value="form.selectedItems.includes(item.id)"
                    @click.stop
                    @update:model-value="toggleItem(item.id)"
                  />
                  <div class="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                    <CubeIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ item.product_name || item.product?.name || `Item #${item.id}` }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Qty: {{ item.quantity }} × {{ formatCurrency(item.unit_price) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ formatCurrency(item.total_price || (item.quantity * item.unit_price)) }}
                    </p>
                  </div>
                </div>
              </div>
            </BaseCard>

            <!-- Shipping Details -->
            <BaseCard title="Shipping Details">
              <div class="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  v-model="form.carrier"
                  label="Carrier"
                  name="carrier"
                  :options="carrierOptions"
                  required
                />

                <FormInput
                  v-model="form.tracking_number"
                  label="Tracking Number"
                  name="tracking_number"
                  placeholder="Enter tracking number"
                />

                <FormSelect
                  v-model="form.shipping_method_id"
                  label="Shipping Method (optional)"
                  name="shipping_method_id"
                  :options="methodOptions"
                />

                <FormInput
                  v-model="form.shipped_at"
                  label="Shipped Date"
                  name="shipped_at"
                  type="date"
                />

                <FormInput
                  v-model="form.estimated_delivery"
                  label="Estimated Delivery"
                  name="estimated_delivery"
                  type="date"
                />

                <FormInput
                  v-model="form.weight"
                  label="Weight (kg)"
                  name="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 1.5"
                />

                <div class="sm:col-span-2">
                  <FormInput
                    v-model="form.dimensions"
                    label="Dimensions (L×W×H cm)"
                    name="dimensions"
                    placeholder="e.g., 30×20×15"
                  />
                </div>

                <div class="sm:col-span-2">
                  <FormTextarea
                    v-model="form.notes"
                    label="Notes (optional)"
                    name="notes"
                    placeholder="Any special instructions for shipping"
                    :rows="2"
                  />
                </div>
              </div>
            </BaseCard>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Order Summary -->
            <BaseCard title="Order Summary">
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <dt class="text-gray-500 dark:text-gray-400">Order Number</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">
                    #{{ order.order_number || order.id }}
                  </dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500 dark:text-gray-400">Total Items</dt>
                  <dd class="text-gray-900 dark:text-white">
                    {{ order.items?.length || 0 }}
                  </dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500 dark:text-gray-400">Order Total</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(order.total_amount || order.total || 0) }}
                  </dd>
                </div>
              </dl>
            </BaseCard>

            <!-- Shipping Address -->
            <BaseCard title="Shipping Address" v-if="order.shipping_address">
              <div class="flex items-start gap-3">
                <MapPinIcon class="mt-0.5 h-5 w-5 text-gray-400" />
                <div class="text-sm text-gray-700 dark:text-gray-300">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ order.shipping_address.name || order.customer?.name }}
                  </p>
                  <p>{{ order.shipping_address.address_line_1 }}</p>
                  <p v-if="order.shipping_address.address_line_2">
                    {{ order.shipping_address.address_line_2 }}
                  </p>
                  <p>
                    {{ order.shipping_address.city }}, {{ order.shipping_address.district }}
                    {{ order.shipping_address.postal_code }}
                  </p>
                  <p>{{ order.shipping_address.country }}</p>
                  <p v-if="order.shipping_address.phone" class="mt-2">
                    Phone: {{ order.shipping_address.phone }}
                  </p>
                </div>
              </div>
            </BaseCard>

            <!-- Submit -->
            <BaseButton
              type="submit"
              class="w-full"
              :loading="isSubmitting"
              :disabled="form.selectedItems.length === 0"
            >
              <TruckIcon class="mr-2 h-5 w-5" />
              Create Shipment
            </BaseButton>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>
