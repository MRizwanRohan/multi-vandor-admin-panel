<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Shipping Settings — Vendor shipping methods (real API)            -->
<!-- Uses shippingService.getAvailableZones(), getMyMethods(), etc     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { shippingService } from '@/services'
import { useCurrency, useToast, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { ShippingMethod, ShippingZone, ShippingMethodType } from '@/types'
import {
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  GlobeAltIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()
const toast = useToast()
const confirm = useConfirm()

// ── Data ─────────────────────────────────────────────────────────

const isLoading = ref(true)
const isSaving = ref(false)
const zones = ref<ShippingZone[]>([])
const myMethods = ref<ShippingMethod[]>([])

// Modal state
const showMethodModal = ref(false)
const editingMethod = ref<ShippingMethod | null>(null)
const methodForm = ref({
  name: '',
  description: '',
  zone_id: 0,
  type: 'flat' as ShippingMethodType,
  base_rate: 0,
  per_item_rate: null as number | null,
  per_kg_rate: null as number | null,
  free_shipping_threshold: null as number | null,
  min_delivery_days: null as number | null,
  max_delivery_days: null as number | null,
  is_active: true,
})

// Options
const typeOptions = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'per_item', label: 'Per Item' },
  { value: 'weight_based', label: 'Weight Based' },
  { value: 'free', label: 'Free Shipping' },
]

const zoneOptions = computed(() => [
  { value: '', label: 'Select a zone' },
  ...zones.value.map(z => ({ value: z.id.toString(), label: z.name })),
])

// Group methods by zone
const methodsByZone = computed(() => {
  const grouped: Record<number, ShippingMethod[]> = {}
  for (const method of myMethods.value) {
    const zoneId = method.zone_id
    if (!grouped[zoneId]) grouped[zoneId] = []
    grouped[zoneId].push(method)
  }
  return grouped
})

// ── Fetch ────────────────────────────────────────────────────────

async function fetchData() {
  isLoading.value = true
  try {
    const [zonesData, methodsData] = await Promise.all([
      shippingService.getAvailableZones(),
      shippingService.getMyMethods(),
    ])
    zones.value = zonesData || []
    myMethods.value = methodsData || []
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load shipping data')
  } finally {
    isLoading.value = false
  }
}

// ── Modal Actions ────────────────────────────────────────────────

function openAddMethod(zoneId?: number) {
  editingMethod.value = null
  methodForm.value = {
    name: '',
    description: '',
    zone_id: zoneId || 0,
    type: 'flat',
    base_rate: 0,
    per_item_rate: null,
    per_kg_rate: null,
    free_shipping_threshold: null,
    min_delivery_days: null,
    max_delivery_days: null,
    is_active: true,
  }
  showMethodModal.value = true
}

function openEditMethod(method: ShippingMethod) {
  editingMethod.value = method
  methodForm.value = {
    name: method.name,
    description: '',
    zone_id: method.zone_id,
    type: method.type,
    base_rate: method.base_rate || 0,
    per_item_rate: method.per_item_rate,
    per_kg_rate: method.per_kg_rate,
    free_shipping_threshold: method.free_shipping_threshold,
    min_delivery_days: method.min_delivery_days,
    max_delivery_days: method.max_delivery_days,
    is_active: method.is_active ?? true,
  }
  showMethodModal.value = true
}

async function saveMethod() {
  if (!methodForm.value.name || !methodForm.value.zone_id) {
    toast.error('Please fill in all required fields')
    return
  }

  isSaving.value = true
  try {
    const payload = {
      name: methodForm.value.name,
      description: methodForm.value.description || undefined,
      zone_id: methodForm.value.zone_id,
      type: methodForm.value.type,
      base_rate: methodForm.value.type !== 'free' ? methodForm.value.base_rate : undefined,
      per_item_rate: methodForm.value.type === 'per_item' ? methodForm.value.per_item_rate : undefined,
      per_kg_rate: methodForm.value.type === 'weight_based' ? methodForm.value.per_kg_rate : undefined,
      free_shipping_threshold: methodForm.value.free_shipping_threshold || undefined,
      min_delivery_days: methodForm.value.min_delivery_days || undefined,
      max_delivery_days: methodForm.value.max_delivery_days || undefined,
      is_active: methodForm.value.is_active,
    }

    if (editingMethod.value) {
      await shippingService.updateMyMethod(editingMethod.value.id, payload)
      toast.success('Shipping method updated')
    } else {
      await shippingService.createMyMethod(payload)
      toast.success('Shipping method created')
    }
    showMethodModal.value = false
    await fetchData()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to save method')
  } finally {
    isSaving.value = false
  }
}

async function deleteMethod(method: ShippingMethod) {
  const confirmed = await confirm.require({
    title: 'Delete Shipping Method',
    message: `Are you sure you want to delete "${method.name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  if (!confirmed) return

  try {
    await shippingService.deleteMyMethod(method.id)
    toast.success('Shipping method deleted')
    await fetchData()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to delete method')
  }
}

async function toggleMethodStatus(method: ShippingMethod) {
  try {
    await shippingService.updateMyMethod(method.id, { is_active: !method.is_active })
    method.is_active = !method.is_active
    toast.success(method.is_active ? 'Method enabled' : 'Method disabled')
  } catch (err: any) {
    toast.error('Failed to update method status')
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function getZoneName(zoneId: number): string {
  const zone = zones.value.find(z => z.id === zoneId)
  return zone?.name || 'Unknown Zone'
}

function formatDeliveryDays(method: ShippingMethod): string {
  const min = method.min_delivery_days
  const max = method.max_delivery_days
  if (min && max) {
    return min === max ? `${min} days` : `${min}-${max} days`
  }
  if (min) return `${min}+ days`
  if (max) return `Up to ${max} days`
  return '-'
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    flat: 'Flat Rate',
    per_item: 'Per Item',
    weight_based: 'Weight Based',
    free: 'Free',
  }
  return labels[type] || type
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Shipping Settings', [
    { label: 'Settings' },
    { label: 'Shipping' },
  ], 'Configure your shipping methods')
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
          <TruckIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Shipping Settings</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ myMethods.length }} method{{ myMethods.length !== 1 ? 's' : '' }} configured
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="secondary" size="sm" @click="fetchData">
          <ArrowPathIcon class="h-4 w-4" />
        </BaseButton>
        <BaseButton @click="openAddMethod()">
          <PlusIcon class="mr-2 h-4 w-4" />
          Add Method
        </BaseButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else>
      <!-- Available Zones Info -->
      <BaseCard v-if="zones.length > 0">
        <div class="flex items-start gap-3">
          <GlobeAltIcon class="mt-0.5 h-5 w-5 text-primary-500" />
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Available Shipping Zones</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              You can create shipping methods for these zones:
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <BaseBadge v-for="zone in zones" :key="zone.id" variant="secondary">
                {{ zone.name }}
                <span v-if="zone.countries?.length" class="ml-1 opacity-60">
                  ({{ zone.countries.length }} countries)
                </span>
              </BaseBadge>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Empty State -->
      <BaseCard v-if="myMethods.length === 0">
        <div class="py-8 text-center">
          <TruckIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No shipping methods</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add shipping methods to start delivering your products.
          </p>
          <div class="mt-6">
            <BaseButton @click="openAddMethod()">
              <PlusIcon class="mr-2 h-4 w-4" />
              Add Shipping Method
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Methods grouped by Zone -->
      <template v-for="zone in zones" :key="zone.id">
        <BaseCard v-if="methodsByZone[zone.id]?.length">
          <div class="mb-4 flex items-start justify-between">
            <div class="flex items-center gap-2">
              <MapPinIcon class="h-5 w-5 text-primary-500" />
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ zone.name }}</h3>
                <p v-if="zone.countries?.length" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ zone.countries.slice(0, 5).join(', ') }}
                  <span v-if="zone.countries.length > 5">+{{ zone.countries.length - 5 }} more</span>
                </p>
              </div>
            </div>
            <BaseButton variant="ghost" size="sm" @click="openAddMethod(zone.id)">
              <PlusIcon class="mr-1 h-4 w-4" />
              Add
            </BaseButton>
          </div>

          <!-- Methods list -->
          <div class="space-y-2">
            <div
              v-for="method in methodsByZone[zone.id]"
              :key="method.id"
              class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div class="flex items-center gap-3">
                <TruckIcon
                  :class="method.is_active ? 'text-success-500' : 'text-gray-300 dark:text-gray-600'"
                  class="h-5 w-5"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ method.name }}</p>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDeliveryDays(method) }}
                    </span>
                    <BaseBadge variant="secondary" size="sm">
                      {{ getTypeLabel(method.type) }}
                    </BaseBadge>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ method.type === 'free' ? 'Free' : formatCurrency(method.base_rate || 0) }}
                  </p>
                  <p
                    v-if="method.free_shipping_threshold"
                    class="text-xs text-success-600 dark:text-success-400"
                  >
                    Free above {{ formatCurrency(method.free_shipping_threshold) }}
                  </p>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                    title="Edit"
                    @click="openEditMethod(method)"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-danger-500 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-900/20"
                    title="Delete"
                    @click="deleteMethod(method)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
                <FormSwitch
                  :model-value="method.is_active"
                  @update:model-value="toggleMethodStatus(method)"
                />
              </div>
            </div>
          </div>
        </BaseCard>
      </template>
    </template>

    <!-- Add/Edit Method Modal -->
    <BaseModal
      :show="showMethodModal"
      :title="editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'"
      size="lg"
      @close="showMethodModal = false"
    >
      <div class="space-y-4">
        <FormInput
          v-model="methodForm.name"
          label="Method Name"
          name="name"
          placeholder="e.g., Standard Delivery"
          required
        />

        <FormTextarea
          v-model="methodForm.description"
          label="Description (optional)"
          name="description"
          placeholder="Description shown to customers"
          :rows="2"
        />

        <FormSelect
          v-model="methodForm.zone_id"
          label="Shipping Zone"
          name="zone_id"
          :options="zoneOptions"
          required
        />

        <FormSelect
          v-model="methodForm.type"
          label="Shipping Type"
          name="type"
          :options="typeOptions"
        />

        <div v-if="methodForm.type !== 'free'" class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-if="methodForm.type === 'flat'"
            v-model="methodForm.base_rate"
            label="Flat Rate"
            name="base_rate"
            type="number"
            min="0"
            step="0.01"
          />
          <FormInput
            v-if="methodForm.type === 'per_item'"
            v-model="methodForm.per_item_rate"
            label="Rate Per Item"
            name="per_item_rate"
            type="number"
            min="0"
            step="0.01"
          />
          <FormInput
            v-if="methodForm.type === 'weight_based'"
            v-model="methodForm.per_kg_rate"
            label="Rate Per KG"
            name="per_kg_rate"
            type="number"
            min="0"
            step="0.01"
          />
          <FormInput
            v-model="methodForm.free_shipping_threshold"
            label="Free Above (optional)"
            name="free_shipping_threshold"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g., 5000"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="methodForm.min_delivery_days"
            label="Min Delivery Days"
            name="min_delivery_days"
            type="number"
            min="1"
            placeholder="e.g., 1"
          />
          <FormInput
            v-model="methodForm.max_delivery_days"
            label="Max Delivery Days"
            name="max_delivery_days"
            type="number"
            min="1"
            placeholder="e.g., 3"
          />
        </div>

        <FormSwitch
          v-model="methodForm.is_active"
          name="is_active"
          label="Active"
          description="Enable this method for customers"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showMethodModal = false">
            Cancel
          </BaseButton>
          <BaseButton :loading="isSaving" @click="saveMethod">
            {{ editingMethod ? 'Update Method' : 'Create Method' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
