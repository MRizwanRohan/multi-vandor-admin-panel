<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Shipping Settings — Shipping methods and zones configuration -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const toast = useToast()

// Shipping settings
const shippingSettings = ref({
  free_shipping_enabled: false,
  free_shipping_threshold: 1000,
  default_shipping_cost: 60,
  enable_weight_based_shipping: false,
  weight_unit: 'kg',
  distance_unit: 'km',
})

// Shipping zones
const shippingZones = ref([
  { id: 1, name: 'Dhaka City', cost: 60, is_active: true },
  { id: 2, name: 'Outside Dhaka', cost: 120, is_active: true },
  { id: 3, name: 'Remote Areas', cost: 200, is_active: true },
])

// Weight unit options
const weightUnitOptions = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lb', label: 'Pound (lb)' },
]

// Distance unit options
const distanceUnitOptions = [
  { value: 'km', label: 'Kilometer (km)' },
  { value: 'mi', label: 'Mile (mi)' },
]

// Loading state
const isSaving = ref(false)
const isLoading = ref(true)

// Fetch settings
onMounted(async () => {
  try {
    const data = await settingsService.getSettings()
    if (data.shipping) {
      shippingSettings.value = { ...shippingSettings.value, ...data.shipping }
    }
    if (data.shipping_zones) {
      shippingZones.value = data.shipping_zones
    }
  } catch (error) {
    // Use default values
  } finally {
    isLoading.value = false
  }
})

// Add shipping zone
function addShippingZone() {
  const newId = Math.max(...shippingZones.value.map(z => z.id), 0) + 1
  shippingZones.value.push({
    id: newId,
    name: '',
    cost: 0,
    is_active: true,
  })
}

// Remove shipping zone
function removeShippingZone(id: number) {
  shippingZones.value = shippingZones.value.filter(z => z.id !== id)
}

// Save settings
async function saveSettings() {
  isSaving.value = true
  try {
    await settingsService.updateSettings('shipping', {
      ...shippingSettings.value,
      zones: shippingZones.value,
    })
    toast.success('Shipping settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="!isLoading" class="space-y-6">
    <!-- General Shipping Settings -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        General Shipping Settings
      </h3>

      <div class="space-y-4">
        <FormInput
          v-model.number="shippingSettings.default_shipping_cost"
          label="Default Shipping Cost"
          name="default_shipping_cost"
          type="number"
          :min="0"
          hint="Default cost when no zone-specific rate applies"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="shippingSettings.weight_unit"
            label="Weight Unit"
            name="weight_unit"
            :options="weightUnitOptions"
          />

          <FormSelect
            v-model="shippingSettings.distance_unit"
            label="Distance Unit"
            name="distance_unit"
            :options="distanceUnitOptions"
          />
        </div>

        <FormSwitch
          v-model="shippingSettings.enable_weight_based_shipping"
          name="enable_weight_based_shipping"
          label="Enable Weight-Based Shipping"
          description="Calculate shipping cost based on product weight"
        />
      </div>
    </BaseCard>

    <!-- Free Shipping -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Free Shipping
      </h3>

      <div class="space-y-4">
        <FormSwitch
          v-model="shippingSettings.free_shipping_enabled"
          name="free_shipping_enabled"
          label="Enable Free Shipping"
          description="Offer free shipping for orders above a threshold"
        />

        <FormInput
          v-if="shippingSettings.free_shipping_enabled"
          v-model.number="shippingSettings.free_shipping_threshold"
          label="Free Shipping Threshold"
          name="free_shipping_threshold"
          type="number"
          :min="0"
          hint="Minimum order amount for free shipping"
        />
      </div>
    </BaseCard>

    <!-- Shipping Zones -->
    <BaseCard>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Shipping Zones
        </h3>
        <BaseButton size="sm" variant="secondary" @click="addShippingZone">
          <PlusIcon class="h-4 w-4 mr-1" />
          Add Zone
        </BaseButton>
      </div>

      <div class="space-y-3">
        <div
          v-for="zone in shippingZones"
          :key="zone.id"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex-1 grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="zone.name"
              :name="`zone_name_${zone.id}`"
              placeholder="Zone name (e.g., Dhaka City)"
            />

            <FormInput
              v-model.number="zone.cost"
              :name="`zone_cost_${zone.id}`"
              type="number"
              :min="0"
              placeholder="Shipping cost"
            />
          </div>

          <div class="flex items-center gap-2">
            <BaseBadge :color="zone.is_active ? 'green' : 'gray'" size="sm">
              {{ zone.is_active ? 'Active' : 'Inactive' }}
            </BaseBadge>

            <BaseButton
              size="sm"
              variant="ghost"
              @click="zone.is_active = !zone.is_active"
            >
              {{ zone.is_active ? 'Disable' : 'Enable' }}
            </BaseButton>

            <BaseButton
              size="sm"
              variant="ghost"
              class="text-red-600 hover:text-red-700"
              @click="removeShippingZone(zone.id)"
            >
              <TrashIcon class="h-4 w-4" />
            </BaseButton>
          </div>
        </div>

        <p v-if="shippingZones.length === 0" class="text-center text-gray-500 py-6">
          No shipping zones configured. Click "Add Zone" to create one.
        </p>
      </div>
    </BaseCard>

    <!-- Save button -->
    <div class="flex justify-end">
      <BaseButton variant="primary" :loading="isSaving" @click="saveSettings">
        Save Changes
      </BaseButton>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
</template>
