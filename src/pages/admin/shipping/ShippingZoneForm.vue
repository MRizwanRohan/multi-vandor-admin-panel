<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Shipping Zone Form — Create/Edit shipping zone              -->
<!-- Uses shippingService.createZone(), updateZone()                   -->
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
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { ShippingZone } from '@/types'
import {
  ArrowLeftIcon,
  GlobeAltIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// ── Mode detection ───────────────────────────────────────────────

const zoneId = computed(() => {
  const id = route.params.id as string
  return id && id !== 'new' ? parseInt(id, 10) : null
})
const isEditMode = computed(() => zoneId.value !== null)
const pageTitle = computed(() => isEditMode.value ? 'Edit Shipping Zone' : 'Add Shipping Zone')

// ── Data ─────────────────────────────────────────────────────────

const isLoading = ref(false)
const countries = ref<string[]>([])
const newCountry = ref('')

// Common country list for quick selection
const commonCountries = [
  'Bangladesh', 'India', 'Pakistan', 'United States', 'United Kingdom',
  'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China',
  'Singapore', 'Malaysia', 'UAE', 'Saudi Arabia', 'Nepal', 'Sri Lanka',
]

// ── Form validation ──────────────────────────────────────────────

const zoneSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  is_active: z.boolean(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: zoneSchema,
  initialValues: {
    name: '',
    description: '',
    is_active: true,
  },
})

const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')
const [isActive, isActiveAttrs] = defineField('is_active')

// ── Fetch zone for editing ───────────────────────────────────────

async function fetchZone() {
  if (!zoneId.value) return

  isLoading.value = true
  try {
    const zone = await shippingService.getZoneById(zoneId.value)
    setValues({
      name: zone.name,
      description: zone.description || '',
      is_active: zone.is_active ?? true,
    })
    countries.value = zone.countries || []
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load zone')
    router.push('/admin/shipping/zones')
  } finally {
    isLoading.value = false
  }
}

// ── Country management ───────────────────────────────────────────

function addCountry() {
  const trimmed = newCountry.value.trim()
  if (trimmed && !countries.value.includes(trimmed)) {
    countries.value.push(trimmed)
    newCountry.value = ''
  }
}

function addCommonCountry(country: string) {
  if (!countries.value.includes(country)) {
    countries.value.push(country)
  }
}

function removeCountry(country: string) {
  countries.value = countries.value.filter(c => c !== country)
}

// ── Form submission ──────────────────────────────────────────────

const onSubmit = handleSubmit(async (values) => {
  if (countries.value.length === 0) {
    toast.error('Please add at least one country')
    return
  }

  try {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      countries: countries.value,
      is_active: values.is_active,
    }

    if (isEditMode.value && zoneId.value) {
      await shippingService.updateZone(zoneId.value, payload)
      toast.success('Shipping zone updated')
    } else {
      await shippingService.createZone(payload)
      toast.success('Shipping zone created')
    }
    router.push('/admin/shipping/zones')
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to save zone'
    toast.error(message)
  }
})

function goBack() {
  router.push('/admin/shipping/zones')
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Shipping', to: '/admin/shipping' },
    { label: 'Zones', to: '/admin/shipping/zones' },
    { label: pageTitle.value },
  ])

  if (isEditMode.value) {
    fetchZone()
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
          <GlobeAltIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Update zone details' : 'Create a new shipping zone' }}
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
      <BaseCard title="Zone Information">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="md:col-span-2">
            <FormInput
              v-model="name"
              v-bind="nameAttrs"
              label="Zone Name"
              name="name"
              placeholder="e.g., Domestic, International, South Asia"
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
              placeholder="Optional description for this zone"
              :rows="2"
              :error="errors.description"
            />
          </div>

          <div class="md:col-span-2">
            <FormSwitch
              v-model="isActive"
              v-bind="isActiveAttrs"
              name="is_active"
              label="Active"
              description="Enable this zone for shipping calculations"
            />
          </div>
        </div>
      </BaseCard>

      <!-- Countries -->
      <BaseCard title="Countries">
        <div class="space-y-4">
          <!-- Add custom country -->
          <div class="flex gap-2">
            <FormInput
              v-model="newCountry"
              name="new_country"
              placeholder="Enter country name"
              class="flex-1"
              @keyup.enter.prevent="addCountry"
            />
            <BaseButton type="button" variant="secondary" @click="addCountry">
              <PlusIcon class="h-4 w-4" />
              Add
            </BaseButton>
          </div>

          <!-- Quick add common countries -->
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick add:
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="country in commonCountries"
                :key="country"
                type="button"
                class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                :class="countries.includes(country)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
                @click="addCommonCountry(country)"
              >
                {{ country }}
              </button>
            </div>
          </div>

          <!-- Selected countries -->
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected countries ({{ countries.length }}):
            </p>
            <div v-if="countries.length > 0" class="flex flex-wrap gap-2">
              <BaseBadge
                v-for="country in countries"
                :key="country"
                variant="info"
                class="flex items-center gap-1"
              >
                {{ country }}
                <button
                  type="button"
                  class="ml-1 rounded-full p-0.5 hover:bg-white/20"
                  @click="removeCountry(country)"
                >
                  <XMarkIcon class="h-3 w-3" />
                </button>
              </BaseBadge>
            </div>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
              No countries selected. Add at least one country.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <BaseButton type="button" variant="secondary" @click="goBack">
          Cancel
        </BaseButton>
        <BaseButton type="submit" :loading="isSubmitting">
          {{ isEditMode ? 'Update Zone' : 'Create Zone' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
