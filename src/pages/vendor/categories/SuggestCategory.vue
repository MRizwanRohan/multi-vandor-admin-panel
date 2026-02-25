<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Suggest Category — Vendor: submit new category suggestion         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import {
  LightBulbIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const router = useRouter()

const isSubmitting = ref(false)
const isSubmitted = ref(false)

const form = ref({
  name: '',
  parent_category: '',
  description: '',
  products_estimate: '',
  sample_products: '',
  reason: '',
})

const parentCategories = [
  { label: 'None (Top-level)', value: '' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'Home & Living', value: 'home-living' },
  { label: 'Baby & Kids', value: 'baby-kids' },
  { label: 'Sports & Outdoors', value: 'sports-outdoors' },
  { label: 'Food & Groceries', value: 'food-groceries' },
  { label: 'Books', value: 'books' },
]

async function handleSubmit() {
  if (!form.value.name || !form.value.description) return
  isSubmitting.value = true
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500))
  isSubmitting.value = false
  isSubmitted.value = true
}

function handleBack() {
  router.push('/vendor/categories')
}

function handleSubmitAnother() {
  isSubmitted.value = false
  form.value = {
    name: '',
    parent_category: '',
    description: '',
    products_estimate: '',
    sample_products: '',
    reason: '',
  }
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Suggest Category', [
    { label: 'Categories', link: '/vendor/categories' },
    { label: 'Suggest' },
  ], 'Suggest a new category for the marketplace')
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Suggest New Category</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Can't find a suitable category? Suggest one and our team will review it.
      </p>
    </div>

    <!-- Success state -->
    <BaseCard v-if="isSubmitted" class="text-center">
      <div class="mx-auto max-w-md py-8">
        <CheckCircleIcon class="mx-auto h-16 w-16 text-success-500" />
        <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Suggestion Submitted!</h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Thank you for your suggestion. Our team will review it and notify you once a decision is made.
          This typically takes 2-3 business days.
        </p>
        <div class="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            @click="handleBack"
          >
            Back to Categories
          </button>
          <button
            type="button"
            class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            @click="handleSubmitAnother"
          >
            Suggest Another
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- Suggestion form -->
    <template v-else>
      <!-- Info banner -->
      <BaseCard class="border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/20">
        <div class="flex gap-3">
          <LightBulbIcon class="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
          <div class="text-sm text-primary-800 dark:text-primary-300">
            <p class="font-medium">Tips for a successful suggestion:</p>
            <ul class="mt-1 list-inside list-disc space-y-0.5 text-primary-700 dark:text-primary-400">
              <li>Check existing categories first to avoid duplicates</li>
              <li>Provide a clear, descriptive name</li>
              <li>Explain why this category is needed with examples</li>
              <li>Estimate how many products you'd list in this category</li>
            </ul>
          </div>
        </div>
      </BaseCard>

      <form @submit.prevent="handleSubmit">
        <BaseCard>
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Category Details</h3>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category Name <span class="text-danger-500">*</span>
              </label>
              <FormInput
                v-model="form.name"
                placeholder="e.g., Smart Home Devices"
                required
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Parent Category
              </label>
              <FormSelect
                v-model="form.parent_category"
                :options="parentCategories"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select a parent category if this is a sub-category, or leave as top-level.
              </p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span class="text-danger-500">*</span>
              </label>
              <FormTextarea
                v-model="form.description"
                placeholder="Describe what products would belong in this category..."
                :rows="3"
                required
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estimated Products
              </label>
              <FormInput
                v-model="form.products_estimate"
                type="number"
                placeholder="How many products do you plan to list?"
                min="1"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sample Products
              </label>
              <FormTextarea
                v-model="form.sample_products"
                placeholder="List a few example products that would belong here..."
                :rows="2"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason for Request
              </label>
              <FormTextarea
                v-model="form.reason"
                placeholder="Why do you think this category should be added?"
                :rows="2"
              />
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="handleBack"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !form.name || !form.description"
              class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {{ isSubmitting ? 'Submitting...' : 'Submit Suggestion' }}
            </button>
          </div>
        </BaseCard>
      </form>
    </template>
  </div>
</template>
