<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Shipment Detail — View and update shipment                  -->
<!-- Uses shippingService.getShipmentById(), updateShipment() etc      -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { shippingService } from '@/services'
import { useToast, useCurrency, useDate, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { Shipment, ShipmentStatus } from '@/types'
import {
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  PencilIcon,
  PrinterIcon,
  CubeIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatCurrency } = useCurrency()
const { formatDate, formatDateTime } = useDate()

// ── Data ─────────────────────────────────────────────────────────

const shipmentId = computed(() => parseInt(route.params.id as string, 10))
const shipment = ref<Shipment | null>(null)
const isLoading = ref(true)
const isUpdating = ref(false)

// Edit modal
const showEditModal = ref(false)
const editForm = ref({
  tracking_number: '',
  carrier: '',
  shipped_at: '',
  estimated_delivery: '',
})

// Status options
const statusOptions: { value: ShipmentStatus; label: string; description: string }[] = [
  { value: 'pending', label: 'Pending', description: 'Shipment created, not yet picked up' },
  { value: 'picked_up', label: 'Picked Up', description: 'Carrier has picked up the package' },
  { value: 'in_transit', label: 'In Transit', description: 'Package is on the way' },
  { value: 'out_for_delivery', label: 'Out for Delivery', description: 'Package will be delivered today' },
  { value: 'delivered', label: 'Delivered', description: 'Package has been delivered' },
  { value: 'returned', label: 'Returned', description: 'Package returned to sender' },
]

// ── Fetch ────────────────────────────────────────────────────────

async function fetchShipment() {
  if (!shipmentId.value) return

  isLoading.value = true
  try {
    shipment.value = await shippingService.getShipmentById(shipmentId.value)
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load shipment')
    router.push('/vendor/shipments')
  } finally {
    isLoading.value = false
  }
}

// ── Actions ──────────────────────────────────────────────────────

function openEditModal() {
  if (!shipment.value) return
  editForm.value = {
    tracking_number: shipment.value.tracking_number || '',
    carrier: shipment.value.carrier || '',
    shipped_at: shipment.value.shipped_at?.split('T')[0] || '',
    estimated_delivery: shipment.value.estimated_delivery?.split('T')[0] || '',
  }
  showEditModal.value = true
}

async function saveEdit() {
  if (!shipment.value) return

  isUpdating.value = true
  try {
    await shippingService.updateShipment(shipment.value.id, {
      tracking_number: editForm.value.tracking_number || undefined,
      carrier: editForm.value.carrier || undefined,
      shipped_at: editForm.value.shipped_at || undefined,
      estimated_delivery: editForm.value.estimated_delivery || undefined,
    })
    toast.success('Shipment updated')
    showEditModal.value = false
    await fetchShipment()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to update shipment')
  } finally {
    isUpdating.value = false
  }
}

async function updateStatus(newStatus: ShipmentStatus) {
  if (!shipment.value) return

  const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus
  const confirmed = await confirm.require({
    title: 'Update Status',
    message: `Update shipment status to "${statusLabel}"?`,
    confirmText: 'Update',
    cancelText: 'Cancel',
    variant: 'info',
  })
  if (!confirmed) return

  isUpdating.value = true
  try {
    await shippingService.updateShipmentStatus(shipment.value.id, newStatus)
    toast.success(`Status updated to ${statusLabel}`)
    await fetchShipment()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to update status')
  } finally {
    isUpdating.value = false
  }
}

function goBack() {
  router.push('/vendor/shipments')
}

// ── Helpers ──────────────────────────────────────────────────────

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
    pending: 'warning',
    picked_up: 'info',
    in_transit: 'info',
    out_for_delivery: 'info',
    delivered: 'success',
    returned: 'danger',
  }
  return map[status] || 'secondary'
}

function getStatusIcon(status: string) {
  const icons: Record<string, any> = {
    pending: ClockIcon,
    picked_up: TruckIcon,
    in_transit: TruckIcon,
    out_for_delivery: MapPinIcon,
    delivered: CheckCircleIcon,
    returned: TruckIcon,
  }
  return icons[status] || TruckIcon
}

function getNextStatus(current: string): ShipmentStatus | null {
  const flow: Record<string, ShipmentStatus> = {
    pending: 'picked_up',
    picked_up: 'in_transit',
    in_transit: 'out_for_delivery',
    out_for_delivery: 'delivered',
  }
  return flow[current] || null
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Shipment Details', [
    { label: 'Shipments', to: '/vendor/shipments' },
    { label: 'Details' },
  ])
  fetchShipment()
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
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ shipment?.tracking_number || `Shipment #${shipmentId}` }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <template v-if="shipment">
              Order #{{ shipment.order?.order_number || shipment.order_id }}
            </template>
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else-if="shipment">
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Info -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Status Card -->
          <BaseCard>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <component
                  :is="getStatusIcon(shipment.status)"
                  class="h-8 w-8"
                  :class="getStatusVariant(shipment.status) === 'success' ? 'text-success-500' :
                    getStatusVariant(shipment.status) === 'warning' ? 'text-warning-500' :
                    getStatusVariant(shipment.status) === 'danger' ? 'text-danger-500' :
                    'text-info-500'"
                />
                <div>
                  <BaseBadge :variant="getStatusVariant(shipment.status)" size="lg">
                    {{ statusOptions.find(s => s.value === shipment.status)?.label || shipment.status }}
                  </BaseBadge>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ statusOptions.find(s => s.value === shipment.status)?.description }}
                  </p>
                </div>
              </div>
              <BaseButton
                v-if="getNextStatus(shipment.status)"
                :loading="isUpdating"
                @click="updateStatus(getNextStatus(shipment.status)!)"
              >
                Mark as {{ statusOptions.find(s => s.value === getNextStatus(shipment.status))?.label }}
              </BaseButton>
            </div>

            <!-- Status Timeline -->
            <div class="mt-6 flex justify-between">
              <div
                v-for="(opt, index) in statusOptions.slice(0, 5)"
                :key="opt.value"
                class="flex flex-col items-center"
              >
                <div
                  class="h-3 w-3 rounded-full"
                  :class="statusOptions.findIndex(s => s.value === shipment.status) >= index
                    ? 'bg-primary-500'
                    : 'bg-gray-300 dark:bg-gray-600'"
                ></div>
                <span class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ opt.label }}
                </span>
              </div>
            </div>
          </BaseCard>

          <!-- Shipment Details -->
          <BaseCard title="Shipment Details">
            <div class="flex justify-end mb-4">
              <BaseButton variant="secondary" size="sm" @click="openEditModal">
                <PencilIcon class="mr-1 h-4 w-4" />
                Edit
              </BaseButton>
            </div>
            <dl class="grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking Number</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ shipment.tracking_number || '-' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Carrier</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ shipment.carrier || '-' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Shipped Date</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ shipment.shipped_at ? formatDate(shipment.shipped_at) : 'Not shipped yet' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Delivery</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ shipment.estimated_delivery ? formatDate(shipment.estimated_delivery) : '-' }}
                </dd>
              </div>
              <div v-if="shipment.delivered_at">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Delivered Date</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ formatDateTime(shipment.delivered_at) }}
                </dd>
              </div>
              <div v-if="shipment.shipping_cost">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Cost</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(shipment.shipping_cost) }}
                </dd>
              </div>
              <div v-if="shipment.weight">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Weight</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ shipment.weight }} kg
                </dd>
              </div>
              <div v-if="shipment.dimensions">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ shipment.dimensions }}
                </dd>
              </div>
            </dl>
          </BaseCard>

          <!-- Items -->
          <BaseCard title="Shipment Items" v-if="shipment.items?.length">
            <div class="space-y-3">
              <div
                v-for="item in shipment.items"
                :key="item.id"
                class="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div class="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                  <CubeIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ item.order_item?.product_name || `Item #${item.order_item_id}` }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Quantity: {{ item.quantity }}
                  </p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <BaseCard title="Quick Actions">
            <div class="space-y-2">
              <BaseButton variant="secondary" class="w-full justify-start" @click="openEditModal">
                <PencilIcon class="mr-2 h-4 w-4" />
                Edit Details
              </BaseButton>
              <BaseButton
                v-if="shipment.status !== 'delivered' && shipment.status !== 'returned'"
                variant="secondary"
                class="w-full justify-start"
                @click="updateStatus('returned')"
              >
                <TruckIcon class="mr-2 h-4 w-4" />
                Mark as Returned
              </BaseButton>
            </div>
          </BaseCard>

          <!-- Order Link -->
          <BaseCard title="Order Information" v-if="shipment.order_id">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400">Order Number</span>
                <RouterLink
                  :to="`/vendor/orders/${shipment.order_id}`"
                  class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  #{{ shipment.order?.order_number || shipment.order_id }}
                </RouterLink>
              </div>
              <BaseButton
                variant="secondary"
                class="w-full"
                :to="`/vendor/orders/${shipment.order_id}`"
              >
                View Order
              </BaseButton>
            </div>
          </BaseCard>

          <!-- Timeline -->
          <BaseCard title="Activity" v-if="shipment.created_at">
            <div class="space-y-3 text-sm">
              <div class="flex items-start gap-3">
                <div class="mt-1 h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div>
                  <p class="text-gray-900 dark:text-white">Shipment created</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDateTime(shipment.created_at) }}
                  </p>
                </div>
              </div>
              <div v-if="shipment.shipped_at" class="flex items-start gap-3">
                <div class="mt-1 h-2 w-2 rounded-full bg-info-500"></div>
                <div>
                  <p class="text-gray-900 dark:text-white">Shipped</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDateTime(shipment.shipped_at) }}
                  </p>
                </div>
              </div>
              <div v-if="shipment.delivered_at" class="flex items-start gap-3">
                <div class="mt-1 h-2 w-2 rounded-full bg-success-500"></div>
                <div>
                  <p class="text-gray-900 dark:text-white">Delivered</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDateTime(shipment.delivered_at) }}
                  </p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>

    <!-- Edit Modal -->
    <BaseModal
      :show="showEditModal"
      title="Edit Shipment"
      size="lg"
      @close="showEditModal = false"
    >
      <div class="space-y-4">
        <FormInput
          v-model="editForm.tracking_number"
          label="Tracking Number"
          name="tracking_number"
          placeholder="Enter tracking number"
        />

        <FormInput
          v-model="editForm.carrier"
          label="Carrier"
          name="carrier"
          placeholder="e.g., DHL, FedEx, Local Courier"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="editForm.shipped_at"
            label="Shipped Date"
            name="shipped_at"
            type="date"
          />

          <FormInput
            v-model="editForm.estimated_delivery"
            label="Estimated Delivery"
            name="estimated_delivery"
            type="date"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showEditModal = false">
            Cancel
          </BaseButton>
          <BaseButton :loading="isUpdating" @click="saveEdit">
            Save Changes
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
