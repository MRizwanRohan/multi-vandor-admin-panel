<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin FAQ Form — Create or edit an FAQ -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast } from '@/composables'
import { faqService } from '@/services'
import { sanitizeHtml } from '@/utils/sanitize'
import type { Faq, FaqCategory } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import SearchableSelectSimple from '@/components/form/SearchableSelectSimple.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import {
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

const faqId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!faqId.value)

// State
const isLoading = ref(false)
const isSaving = ref(false)
const existingFaq = ref<Faq | null>(null)
const categories = ref<FaqCategory[]>([])
const errors = ref<Record<string, string>>({})

// Form fields
const question = ref('')
const answer = ref('')
const categoryId = ref<number | null>(null)
const sortOrder = ref(0)
const isActive = ref(true)

// Category options
const categoryOptions = computed(() => [
  { value: null, label: 'No category' },
  ...categories.value.map(c => ({ value: c.id, label: c.name }))
])

onMounted(async () => {
  breadcrumbStore.setPageInfo(
    isEditMode.value ? 'Edit FAQ' : 'Create FAQ',
    [
      { label: 'CMS' },
      { label: 'FAQs', to: '/admin/cms/faqs' },
      { label: isEditMode.value ? 'Edit' : 'Create' },
    ],
    isEditMode.value ? 'Edit frequently asked question' : 'Create a new FAQ'
  )

  await fetchCategories()
  
  if (isEditMode.value) {
    await fetchFaq()
  }
})

// Fetch categories
async function fetchCategories() {
  try {
    const response = await faqService.getCategories()
    categories.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

// Fetch existing FAQ
async function fetchFaq() {
  isLoading.value = true
  try {
    const response = await faqService.getById(faqId.value!)
    existingFaq.value = response.data
    
    // Populate form
    question.value = response.data.question
    answer.value = response.data.answer
    categoryId.value = response.data.category_id || null
    sortOrder.value = response.data.sort_order || 0
    isActive.value = response.data.is_active
  } catch (error) {
    toast.error('Failed to load FAQ')
    router.push('/admin/cms/faqs')
  } finally {
    isLoading.value = false
  }
}

// Validate form
function validateForm(): boolean {
  errors.value = {}
  
  if (!question.value || question.value.length < 10) {
    errors.value.question = 'Question must be at least 10 characters'
  }
  if (!answer.value || answer.value.length < 20) {
    errors.value.answer = 'Answer must be at least 20 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

// Submit form
async function handleSubmit() {
  if (!validateForm()) {
    toast.error('Please fix the form errors')
    return
  }

  isSaving.value = true
  try {
    const data = {
      question: question.value,
      answer: answer.value,
      category_id: categoryId.value || null,
      sort_order: sortOrder.value,
      is_active: isActive.value,
    }

    if (isEditMode.value) {
      await faqService.update(faqId.value!, data)
      toast.success('FAQ updated successfully')
    } else {
      await faqService.create(data)
      toast.success('FAQ created successfully')
    }
    router.push('/admin/cms/faqs')
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message || 'Failed to save FAQ')
    }
  } finally {
    isSaving.value = false
  }
}

// Cancel
function goBack() {
  router.push('/admin/cms/faqs')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="goBack"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode ? 'Edit FAQ' : 'Create FAQ' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Update question and answer' : 'Add a new frequently asked question' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="outline" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSaving" @click="handleSubmit">
          <CheckIcon class="mr-2 h-5 w-5" />
          {{ isEditMode ? 'Update FAQ' : 'Create FAQ' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else>
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Question & Answer</h3>
            <div class="space-y-6">
              <FormTextarea
                v-model="question"
                name="question"
                label="Question"
                placeholder="What is the question customers frequently ask?"
                :error="errors.question"
                :rows="3"
                required
              />

              <FormTextarea
                v-model="answer"
                name="answer"
                label="Answer"
                placeholder="Provide a clear and helpful answer..."
                :error="errors.answer"
                :rows="8"
                required
              />
              <p class="text-xs text-gray-500">
                You can use HTML for formatting the answer.
              </p>
            </div>
          </BaseCard>

          <!-- Answer Preview -->
          <BaseCard v-if="answer">
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Answer Preview</h3>
            <div 
              class="prose max-w-none dark:prose-invert text-sm"
              v-html="sanitizeHtml(answer)"
            ></div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Settings</h3>
            <div class="space-y-6">
              <SearchableSelectSimple
                v-model="categoryId"
                name="category_id"
                label="Category"
                placeholder="Search categories..."
                :options="categoryOptions"
                :error="errors.category_id"
                clearable
              />

              <FormInput
                v-model="sortOrder"
                name="sort_order"
                label="Sort Order"
                type="number"
                placeholder="0"
                :error="errors.sort_order"
              />
              <p class="text-xs text-gray-500">
                Lower numbers appear first
              </p>

              <div class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">Active</h4>
                  <p class="text-sm text-gray-500">Show this FAQ publicly</p>
                </div>
                <FormSwitch
                  v-model="isActive"
                  name="is_active"
                />
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>
