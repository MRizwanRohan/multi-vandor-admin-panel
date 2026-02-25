<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Create Promotion — Vendor: create new promotion form              -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import {
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const router = useRouter()

const isSubmitting = ref(false)

const form = ref({
  name: '',
  description: '',
  type: 'percentage',
  discount_value: '',
  min_purchase: '',
  max_discount: '',
  start_date: '',
  end_date: '',
  apply_to: 'all',
  usage_limit: '',
  per_customer_limit: '',
  combinable: false,
})

const discountTypes = [
  { label: 'Percentage Discount', value: 'percentage' },
  { label: 'Fixed Amount Discount', value: 'fixed' },
  { label: 'Buy X Get Y', value: 'bogo' },
  { label: 'Free Shipping', value: 'free_shipping' },
]

const applyToOptions = [
  { label: 'All Products', value: 'all' },
  { label: 'Specific Products', value: 'specific' },
  { label: 'Specific Categories', value: 'categories' },
]

const isValid = computed(() => {
  return (
    form.value.name &&
    form.value.discount_value &&
    form.value.start_date &&
    form.value.end_date
  )
})

async function handleSubmit() {
  if (!isValid.value) return
  isSubmitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  isSubmitting.value = false
  router.push('/vendor/promotions')
}

function handleCancel() {
  router.push('/vendor/promotions')
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Create Promotion', [
    { label: 'Promotions', link: '/vendor/promotions' },
    { label: 'Create' },
  ], 'Set up a new promotional offer')
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Create Promotion</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Set up a new promotional offer for your products</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Basic Information</h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Promotion Name <span class="text-danger-500">*</span>
            </label>
            <FormInput
              v-model="form.name"
              placeholder="e.g., Summer Sale 2026"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <FormTextarea
              v-model="form.description"
              placeholder="Brief description of the promotion..."
              :rows="2"
            />
          </div>
        </div>
      </BaseCard>

      <!-- Discount Details -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Discount Details</h3>
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Type <span class="text-danger-500">*</span>
              </label>
              <FormSelect v-model="form.type" :options="discountTypes" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Value <span class="text-danger-500">*</span>
              </label>
              <FormInput
                v-model="form.discount_value"
                type="number"
                :placeholder="form.type === 'percentage' ? 'e.g., 15' : 'e.g., 200'"
                :suffix="form.type === 'percentage' ? '%' : '৳'"
                min="0"
                required
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Purchase Amount</label>
              <FormInput v-model="form.min_purchase" type="number" placeholder="0" prefix="৳" min="0" />
            </div>
            <div v-if="form.type === 'percentage'">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Discount Amount</label>
              <FormInput v-model="form.max_discount" type="number" placeholder="No limit" prefix="৳" min="0" />
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Schedule -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Schedule</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date <span class="text-danger-500">*</span>
            </label>
            <FormInput v-model="form.start_date" type="date" required />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date <span class="text-danger-500">*</span>
            </label>
            <FormInput v-model="form.end_date" type="date" required />
          </div>
        </div>
      </BaseCard>

      <!-- Apply To -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Apply To</h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Products</label>
            <FormSelect v-model="form.apply_to" :options="applyToOptions" />
          </div>

          <div v-if="form.apply_to !== 'all'" class="flex items-start gap-2 rounded-lg bg-info-50 p-3 dark:bg-info-900/20">
            <InformationCircleIcon class="mt-0.5 h-4 w-4 shrink-0 text-info-500" />
            <p class="text-sm text-info-700 dark:text-info-400">
              Product selection will be available after creating the promotion.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Usage Limits -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Usage Limits</h3>
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Total Usage Limit</label>
              <FormInput v-model="form.usage_limit" type="number" placeholder="Unlimited" min="0" />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Leave empty for unlimited</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Per Customer Limit</label>
              <FormInput v-model="form.per_customer_limit" type="number" placeholder="Unlimited" min="0" />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Leave empty for unlimited</p>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Combinable with other promotions</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Allow this promotion to stack with others</p>
            </div>
            <FormSwitch v-model="form.combinable" />
          </div>
        </div>
      </BaseCard>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSubmitting || !isValid"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {{ isSubmitting ? 'Creating...' : 'Create Promotion' }}
        </button>
      </div>
    </form>
  </div>
</template>
