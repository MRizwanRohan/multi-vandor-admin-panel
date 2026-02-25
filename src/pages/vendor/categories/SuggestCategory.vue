<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Suggest Category — Vendor: submit new category suggestion         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { Category } from '@/types'
import {
  LightBulbIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const parentCategories = ref<{ value: string | number; label: string }[]>([])

const form = ref({
  name: '',
  parent_id: null as number | null,
  description: '',
  seo_title: '',
  seo_description: '',
  keywords: '',
})

onMounted(() => {
  breadcrumbStore.setPageInfo('Suggest Category', [
    { label: 'Categories', to: '/vendor/categories' },
    { label: 'Suggest' },
  ], 'Suggest a new category for the marketplace')
  fetchParentCategories()
})

// Load real parent categories for dropdown
async function fetchParentCategories() {
  try {
    const response = await categoryService.getVisibleCategories()
    const options: { value: string | number; label: string }[] = [
      { value: '', label: 'None (Top-level)' },
    ]
    function flatten(cats: Category[], prefix = '') {
      for (const c of cats) {
        const label = prefix ? `${prefix} → ${c.name}` : c.name
        options.push({ value: c.id, label })
        if (c.children?.length) {
          flatten(c.children, label)
        }
      }
    }
    flatten(response.data)
    parentCategories.value = options
  } catch {
    parentCategories.value = [{ value: '', label: 'None (Top-level)' }]
  }
}

// Submit via real API
async function handleSubmit() {
  if (!form.value.name.trim() || !form.value.description.trim()) {
    toast.error('Name and description are required')
    return
  }

  isSubmitting.value = true
  try {
    const keywords = form.value.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)

    await categoryService.suggestCategory({
      name: form.value.name,
      description: form.value.description,
      parent_id: form.value.parent_id || null,
      metadata: {
        seo_title: form.value.seo_title || undefined,
        seo_description: form.value.seo_description || undefined,
        keywords: keywords.length ? keywords : undefined,
      },
    })
    isSubmitted.value = true
    toast.success('Category suggestion submitted!')
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to submit suggestion')
  } finally {
    isSubmitting.value = false
  }
}

function handleBack() {
  router.push('/vendor/categories')
}

function handleSubmitAnother() {
  isSubmitted.value = false
  form.value = {
    name: '',
    parent_id: null,
    description: '',
    seo_title: '',
    seo_description: '',
    keywords: '',
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back -->
    <div class="flex items-center gap-3">
      <BaseButton variant="ghost" size="sm" @click="handleBack">
        <ArrowLeftIcon class="h-4 w-4" />
      </BaseButton>
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Suggest New Category</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Can't find a suitable category? Suggest one and our team will review it.
        </p>
      </div>
    </div>

    <!-- Success state -->
    <BaseCard v-if="isSubmitted" class="text-center">
      <div class="mx-auto max-w-md py-8">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircleIcon class="h-10 w-10 text-green-500" />
        </div>
        <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Suggestion Submitted!</h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Thank you! Our team will review your suggestion and notify you once a decision is made.
          This typically takes 2-3 business days.
        </p>
        <div class="mt-6 flex items-center justify-center gap-3">
          <BaseButton variant="secondary" @click="handleBack">
            Back to Categories
          </BaseButton>
          <BaseButton variant="primary" @click="handleSubmitAnother">
            Suggest Another
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Suggestion form -->
    <template v-else>
      <!-- Tips -->
      <BaseCard class="border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/20">
        <div class="flex gap-3">
          <LightBulbIcon class="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
          <div class="text-sm text-primary-800 dark:text-primary-300">
            <p class="font-medium">Tips for a successful suggestion:</p>
            <ul class="mt-1 list-inside list-disc space-y-0.5 text-primary-700 dark:text-primary-400">
              <li>Check existing categories first to avoid duplicates</li>
              <li>Provide a clear, descriptive name</li>
              <li>Explain why this category is needed with examples</li>
            </ul>
          </div>
        </div>
      </BaseCard>

      <form @submit.prevent="handleSubmit" class="grid gap-6 lg:grid-cols-3">
        <!-- Main form -->
        <div class="lg:col-span-2 space-y-6">
          <BaseCard title="Category Details">
            <div class="space-y-4">
              <FormInput
                v-model="form.name"
                label="Category Name"
                placeholder="e.g., Smart Home Devices"
                required
              />

              <FormSelect
                v-model="form.parent_id"
                label="Parent Category"
                :options="parentCategories"
                hint="Select a parent if this is a sub-category"
              />

              <FormTextarea
                v-model="form.description"
                label="Description"
                placeholder="Describe what products would belong in this category..."
                :rows="4"
                required
              />
            </div>
          </BaseCard>

          <!-- SEO (optional) -->
          <BaseCard title="SEO (Optional)">
            <div class="space-y-4">
              <FormInput
                v-model="form.seo_title"
                label="SEO Title"
                placeholder="Category title for search engines"
              />
              <FormTextarea
                v-model="form.seo_description"
                label="SEO Description"
                placeholder="Brief description for search engine results"
                :rows="2"
              />
              <FormInput
                v-model="form.keywords"
                label="Keywords"
                placeholder="keyword1, keyword2, keyword3"
                hint="Comma-separated list of keywords"
              />
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar summary -->
        <div class="space-y-6">
          <BaseCard title="Summary">
            <div class="space-y-3">
              <div>
                <p class="text-xs font-medium uppercase text-gray-400">Name</p>
                <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                  {{ form.name || '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase text-gray-400">Parent</p>
                <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                  {{ parentCategories.find(p => p.value === form.parent_id)?.label || 'Top-level' }}
                </p>
              </div>
              <div v-if="form.description">
                <p class="text-xs font-medium uppercase text-gray-400">Description</p>
                <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                  {{ form.description }}
                </p>
              </div>
            </div>
          </BaseCard>

          <div class="flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              :loading="isSubmitting"
              :disabled="!form.name || !form.description"
              class="w-full"
            >
              Submit Suggestion
            </BaseButton>
            <BaseButton variant="secondary" class="w-full" @click="handleBack">
              Cancel
            </BaseButton>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>
