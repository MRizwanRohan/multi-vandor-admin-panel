<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Shipping Settings — Vendor shipping zones and methods config      -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import {
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CheckCircleIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const isSaving = ref(false)
const showAddZone = ref(false)
const editingZoneId = ref<number | null>(null)

interface ShippingMethod {
  id: number
  name: string
  estimated_days: string
  flat_rate: number
  free_above: number | null
  enabled: boolean
}

interface ShippingZone {
  id: number
  name: string
  regions: string[]
  methods: ShippingMethod[]
}

const zones = ref<ShippingZone[]>([
  {
    id: 1,
    name: 'Dhaka Metro',
    regions: ['Dhaka City', 'Gazipur', 'Narayanganj'],
    methods: [
      { id: 1, name: 'Standard Delivery', estimated_days: '1-2 days', flat_rate: 60, free_above: 1000, enabled: true },
      { id: 2, name: 'Express Delivery', estimated_days: 'Same day', flat_rate: 120, free_above: null, enabled: true },
    ],
  },
  {
    id: 2,
    name: 'Major Cities',
    regions: ['Chittagong', 'Sylhet', 'Rajshahi', 'Khulna'],
    methods: [
      { id: 3, name: 'Standard Delivery', estimated_days: '2-3 days', flat_rate: 100, free_above: 2000, enabled: true },
      { id: 4, name: 'Express Delivery', estimated_days: '1-2 days', flat_rate: 180, free_above: null, enabled: false },
    ],
  },
  {
    id: 3,
    name: 'Rest of Bangladesh',
    regions: ['All other districts'],
    methods: [
      { id: 5, name: 'Standard Delivery', estimated_days: '3-5 days', flat_rate: 150, free_above: 3000, enabled: true },
    ],
  },
])

// Default settings
const defaultSettings = ref({
  free_shipping_enabled: true,
  free_shipping_minimum: 5000,
  handling_time: '1-2',
  return_shipping: 'seller',
})

const newZone = ref({
  name: '',
  regions: '',
})

function handleAddZone() {
  if (!newZone.value.name) return
  const zone: ShippingZone = {
    id: Date.now(),
    name: newZone.value.name,
    regions: newZone.value.regions.split(',').map((r) => r.trim()).filter(Boolean),
    methods: [
      { id: Date.now() + 1, name: 'Standard Delivery', estimated_days: '3-5 days', flat_rate: 100, free_above: null, enabled: true },
    ],
  }
  zones.value.push(zone)
  showAddZone.value = false
  newZone.value = { name: '', regions: '' }
}

function handleDeleteZone(zoneId: number) {
  zones.value = zones.value.filter((z) => z.id !== zoneId)
}

function handleToggleMethod(zoneId: number, methodId: number) {
  const zone = zones.value.find((z) => z.id === zoneId)
  if (zone) {
    const method = zone.methods.find((m) => m.id === methodId)
    if (method) method.enabled = !method.enabled
  }
}

async function handleSave() {
  isSaving.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  isSaving.value = false
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Shipping Settings', [
    { label: 'Settings' },
    { label: 'Shipping' },
  ], 'Configure your shipping zones and delivery methods')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Shipping Settings</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage your shipping zones, methods, and rates</p>
      </div>
      <button
        type="button"
        :disabled="isSaving"
        class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        @click="handleSave"
      >
        <span v-if="isSaving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <!-- Default Settings -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Default Settings</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Free Shipping</label>
            <FormSwitch v-model="defaultSettings.free_shipping_enabled" />
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Enable free shipping above a minimum order</p>
        </div>
        <div v-if="defaultSettings.free_shipping_enabled">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Order for Free Shipping</label>
          <FormInput v-model="defaultSettings.free_shipping_minimum" type="number" prefix="৳" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Handling Time</label>
          <FormSelect
            v-model="defaultSettings.handling_time"
            :options="[
              { label: 'Same day', value: '0' },
              { label: '1-2 business days', value: '1-2' },
              { label: '2-3 business days', value: '2-3' },
              { label: '3-5 business days', value: '3-5' },
            ]"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Return Shipping Paid By</label>
          <FormSelect
            v-model="defaultSettings.return_shipping"
            :options="[
              { label: 'Seller', value: 'seller' },
              { label: 'Buyer', value: 'buyer' },
            ]"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Shipping Zones -->
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Shipping Zones</h3>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="showAddZone = !showAddZone"
      >
        <PlusIcon class="h-4 w-4" />
        Add Zone
      </button>
    </div>

    <!-- Add zone form -->
    <BaseCard v-if="showAddZone">
      <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">New Shipping Zone</h4>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Zone Name</label>
          <FormInput v-model="newZone.name" placeholder="e.g., International" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Regions (comma-separated)</label>
          <FormInput v-model="newZone.regions" placeholder="e.g., India, Nepal, Sri Lanka" />
        </div>
      </div>
      <div class="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          @click="showAddZone = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          @click="handleAddZone"
        >
          Add Zone
        </button>
      </div>
    </BaseCard>

    <!-- Zone cards -->
    <BaseCard v-for="zone in zones" :key="zone.id">
      <div class="mb-3 flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <MapPinIcon class="h-5 w-5 text-primary-500" />
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ zone.name }}</h4>
          </div>
          <div class="ml-7 mt-0.5 flex flex-wrap gap-1">
            <span
              v-for="region in zone.regions"
              :key="region"
              class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              {{ region }}
            </span>
          </div>
        </div>
        <button
          type="button"
          class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-900/20"
          @click="handleDeleteZone(zone.id)"
        >
          <TrashIcon class="h-4 w-4" />
        </button>
      </div>

      <!-- Methods -->
      <div class="space-y-2">
        <div
          v-for="method in zone.methods"
          :key="method.id"
          class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <div class="flex items-center gap-3">
            <TruckIcon :class="method.enabled ? 'text-success-500' : 'text-gray-300 dark:text-gray-600'" class="h-5 w-5" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ method.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ method.estimated_days }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatCurrency(method.flat_rate) }}</p>
              <p v-if="method.free_above" class="text-xs text-success-600 dark:text-success-400">
                Free above {{ formatCurrency(method.free_above) }}
              </p>
            </div>
            <FormSwitch
              :model-value="method.enabled"
              @update:model-value="handleToggleMethod(zone.id, method.id)"
            />
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
