<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Shipping Method Form — Create/Edit shipping method           -->
<!-- Uses shippingService.createMethod(), updateMethod()                -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { shippingService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { ShippingZone, ShippingMethodType, ShippingRateType } from '@/types'
import {
  ArrowLeftIcon,
  TruckIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// ── Mode detection ───────────────────────────────────────────────

const methodId = computed(() => {
  const id = route.params.id as string
  return id && id !== 'new' ? parseInt(id, 10) : null
})
const isEditMode = computed(() => methodId.value !== null)
const pageTitle = computed(() => isEditMode.value ? 'Edit Shipping Method' : 'Add Shipping Method')

// ── Data ─────────────────────────────────────────────────────────

const isLoading = ref(false)
const zones = ref<ShippingZone[]>([])

// Options
const typeOptions: { value: ShippingMethodType; label: string; description: string }[] = [
  { value: 'flat', label: 'Flat Rate', description: 'Fixed shipping cost regardless of cart contents' },
  { value: 'per_item', label: 'Per Item', description: 'Charge per item in the cart' },
  { value: 'weight_based', label: 'Weight Based', description: 'Charge based on total weight' },
  { value: 'price_based', label: 'Price Based', description: 'Charge based on order subtotal' },
  { value: 'free', label: 'Free Shipping', description: 'No shipping cost' },
]

const rateTypeOptions: { value: ShippingRateType; label: string }[] = [
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'percentage', label: 'Percentage' },
]

const zoneOptions = computed(() => [
  { value: '', label: 'Select a zone' },
  ...zones.value.map(z => ({ value: z.id.toString(), label: z.name })),
])

// ── Form validation ──────────────────────────────────────────────

const methodSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  zone_id: z.coerce.number().min(1, 'Please select a zone'),
  type: z.enum(['flat', 'per_item', 'weight_based', 'price_based', 'free']),
  rate_type: z.enum(['fixed', 'percentage']),
  base_rate: z.coerce.number().min(0).optional().nullable(),
  per_item_rate: z.coerce.number().min(0).optional().nullable(),
  per_kg_rate: z.coerce.number().min(0).optional().nullable(),
  free_shipping_threshold: z.coerce.number().min(0).optional().nullable(),
  min_delivery_days: z.coerce.number().int().min(1).optional().nullable(),
  max_delivery_days: z.coerce.number().int().min(1).optional().nullable(),
  is_active: z.boolean(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
  values,
} = useForm({
  validationSchema: methodSchema,
  initialValues: {
    name: '',
    description: '',
    zone_id: 0,
    type: 'flat' as ShippingMethodType,
    rate_type: 'fixed' as ShippingRateType,
    base_rate: null as number | null,
    per_item_rate: null as number | null,
    per_kg_rate: null as number | null,
    free_shipping_threshold: null as number | null,
    min_delivery_days: null as number | null,
    max_delivery_days: null as number | null,
    is_active: true,
  },
})

const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')
const [zoneId, zoneIdAttrs] = defineField('zone_id')
const [type, typeAttrs] = defineField('type')
const [rateType, rateTypeAttrs] = defineField('rate_type')
const [baseRate, baseRateAttrs] = defineField('base_rate')
const [perItemRate, perItemRateAttrs] = defineField('per_item_rate')
const [perKgRate, perKgRateAttrs] = defineField('per_kg_rate')
const [freeShippingThreshold, freeShippingThresholdAttrs] = defineField('free_shipping_threshold')
const [minDeliveryDays, minDeliveryDaysAttrs] = defineField('min_delivery_days')
const [maxDeliveryDays, maxDeliveryDaysAttrs] = defineField('max_delivery_days')
const [isActive, isActiveAttrs] = defineField('is_active')

// Dynamic visibility based on type
const showBaseRate = computed(() => ['flat', 'price_based'].includes(values.type))
const showPerItemRate = computed(() => values.type === 'per_item')
const showPerKgRate = computed(() => values.type === 'weight_based')
const showFreeThreshold = computed(() => values.type !== 'free')
const showRateType = computed(() => ['price_based'].includes(values.type))

// ── Fetch method for editing ─────────────────────────────────────

async function fetchMethod() {
  if (!methodId.value) return

  isLoading.value = true
  try {
    const method = await shippingService.getMethodById(methodId.value)
    setValues({
      name: method.name,
      description: method.description || '',
      zone_id: method.zone_id,
      type: method.type,
      rate_type: method.rate_type || 'fixed',
      base_rate: method.base_rate,
      per_item_rate: method.per_item_rate,
      per_kg_rate: method.per_kg_rate,
      free_shipping_threshold: method.free_shipping_threshold,
      min_delivery_days: method.min_delivery_days,
      max_delivery_days: method.max_delivery_days,
      is_active: method.is_active ?? true,
    })
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load method')
    router.push('/admin/shipping/methods')
  } finally {
    isLoading.value = false
  }
}

// Fetch zones
async function fetchZones() {
  try {
    const response = await shippingService.getZones({ per_page: 100, is_active: true })
    const resData = response.data as any
    if (Array.isArray(resData)) {
      zones.value = resData
    } else if (resData?.shipping_zones || resData?.zones) {
      zones.value = resData.shipping_zones || resData.zones
    } else {
      zones.value = []
    }
  } catch {
    zones.value = []
  }
}

// ── Form submission ──────────────────────────────────────────────

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      zone_id: values.zone_id,
      type: values.type,
      rate_type: values.rate_type,
      base_rate: showBaseRate.value ? values.base_rate : undefined,
      per_item_rate: showPerItemRate.value ? values.per_item_rate : undefined,
      per_kg_rate: showPerKgRate.value ? values.per_kg_rate : undefined,
      free_shipping_threshold: showFreeThreshold.value ? values.free_shipping_threshold : undefined,
      min_delivery_days: values.min_delivery_days || undefined,
      max_delivery_days: values.max_delivery_days || undefined,
      is_active: values.is_active,
    }

    if (isEditMode.value && methodId.value) {
      await shippingService.updateMethod(methodId.value, payload)
      toast.success('Shipping method updated')
    } else {
      await shippingService.createMethod(payload)
      toast.success('Shipping method created')
    }
    router.push('/admin/shipping/methods')
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to save method'
    toast.error(message)
  }
})

function goBack() {
  router.push('/admin/shipping/methods')
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Shipping', to: '/admin/shipping' },
    { label: 'Methods', to: '/admin/shipping/methods' },
    { label: pageTitle.value },
  ])

  fetchZones()
  if (isEditMode.value) {
    fetchMethod()
  }
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
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Update method details' : 'Create a new shipping method' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Info -->
      <BaseCard title="Method Information">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="md:col-span-2">
            <FormInput
              v-model="name"
              v-bind="nameAttrs"
              label="Method Name"
              name="name"
              placeholder="e.g., Standard Shipping, Express Delivery"
              :error="errors.name"
              required
            />
          </div>

          <div class="md:col-span-2">
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
              label="Description"
              name="description"
              placeholder="Optional description shown to customers"
              :rows="2"
              :error="errors.description"
            />
          </div>

          <FormSelect
            v-model="zoneId"
            v-bind="zoneIdAttrs"
            label="Shipping Zone"
            name="zone_id"
            :options="zoneOptions"
            :error="errors.zone_id"
            required
          />

          <FormSwitch
            v-model="isActive"
            v-bind="isActiveAttrs"
            name="is_active"
            label="Active"
            description="Enable this method for shipping"
          />
        </div>
      </BaseCard>

      <!-- Shipping Type -->
      <BaseCard title="Shipping Type">
        <div class="space-y-4">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label
              v-for="opt in typeOptions"
              :key="opt.value"
              class="relative flex cursor-pointer rounded-lg border p-4 transition-all"
              :class="type === opt.value
                ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'"
            >
              <input
                type="radio"
                :value="opt.value"
                v-model="type"
                class="sr-only"
              />
              <div class="flex-1">
                <span class="block text-sm font-medium text-gray-900 dark:text-white">
                  {{ opt.label }}
                </span>
                <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  {{ opt.description }}
                </span>
              </div>
              <div
                v-if="type === opt.value"
                class="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary-500"
              ></div>
            </label>
          </div>
        </div>
      </BaseCard>

      <!-- Rate Configuration -->
      <BaseCard title="Rate Configuration" v-if="type !== 'free'">
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Rate Type (for percentage-based) -->
          <FormSelect
            v-if="showRateType"
            v-model="rateType"
            v-bind="rateTypeAttrs"
            label="Rate Type"
            name="rate_type"
            :options="rateTypeOptions"
            :error="errors.rate_type"
          />

          <!-- Base Rate -->
          <FormInput
            v-if="showBaseRate"
            v-model="baseRate"
            v-bind="baseRateAttrs"
            :label="rateType === 'percentage' ? 'Rate (%)' : 'Base Rate'"
            name="base_rate"
            type="number"
            step="0.01"
            min="0"
            :placeholder="rateType === 'percentage' ? 'e.g., 5.00' : 'e.g., 50.00'"
            :error="errors.base_rate"
          />

          <!-- Per Item Rate -->
          <FormInput
            v-if="showPerItemRate"
            v-model="perItemRate"
            v-bind="perItemRateAttrs"
            label="Rate Per Item"
            name="per_item_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 10.00"
            :error="errors.per_item_rate"
          />

          <!-- Weight Based Rate -->
          <FormInput
            v-if="showPerKgRate"
            v-model="perKgRate"
            v-bind="perKgRateAttrs"
            label="Rate Per KG"
            name="per_kg_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 20.00"
            :error="errors.per_kg_rate"
          />

          <!-- Free Shipping Threshold -->
          <div v-if="showFreeThreshold" class="md:col-span-2">
            <FormInput
              v-model="freeShippingThreshold"
              v-bind="freeShippingThresholdAttrs"
              label="Free Shipping Threshold (optional)"
              name="free_shipping_threshold"
              type="number"
              step="0.01"
              min="0"
              placeholder="Orders above this amount get free shipping"
              :error="errors.free_shipping_threshold"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <InformationCircleIcon class="mr-1 inline h-4 w-4" />
              Leave empty to disable free shipping threshold
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Free Shipping Info -->
      <BaseCard v-else>
        <div class="flex items-center gap-3 rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
          <InformationCircleIcon class="h-6 w-6 text-success-600 dark:text-success-400" />
          <div>
            <p class="font-medium text-success-800 dark:text-success-300">Free Shipping</p>
            <p class="text-sm text-success-600 dark:text-success-400">
              No shipping cost will be charged for orders using this method.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Delivery Time -->
      <BaseCard title="Delivery Time">
        <div class="grid gap-6 md:grid-cols-2">
          <FormInput
            v-model="minDeliveryDays"
            v-bind="minDeliveryDaysAttrs"
            label="Minimum Days"
            name="min_delivery_days"
            type="number"
            min="1"
            placeholder="e.g., 3"
            :error="errors.min_delivery_days"
          />

          <FormInput
            v-model="maxDeliveryDays"
            v-bind="maxDeliveryDaysAttrs"
            label="Maximum Days"
            name="max_delivery_days"
            type="number"
            min="1"
            placeholder="e.g., 7"
            :error="errors.max_delivery_days"
          />
        </div>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Estimated delivery time shown to customers (e.g., "3-7 business days")
        </p>
      </BaseCard>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <BaseButton type="button" variant="secondary" @click="goBack">
          Cancel
        </BaseButton>
        <BaseButton type="submit" :loading="isSubmitting">
          {{ isEditMode ? 'Update Method' : 'Create Method' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
