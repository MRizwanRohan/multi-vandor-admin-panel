<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin FAQ Category Form — Create or edit an FAQ category -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast } from '@/composables'
import { faqService } from '@/services'
import type { FaqCategory } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import IconPicker from '@/components/form/IconPicker.vue'
import {
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

const categoryId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!categoryId.value)

// State
const isLoading = ref(false)
const isSaving = ref(false)
const existingCategory = ref<FaqCategory | null>(null)
const errors = ref<Record<string, string>>({})

// Form fields
const name = ref('')
const slug = ref('')
const description = ref('')
const icon = ref('')
const sortOrder = ref(0)
const isActive = ref(true)

onMounted(async () => {
  breadcrumbStore.setPageInfo(
    isEditMode.value ? 'Edit Category' : 'Create Category',
    [
      { label: 'CMS' },
      { label: 'FAQs', to: '/admin/cms/faqs' },
      { label: 'Categories' },
      { label: isEditMode.value ? 'Edit' : 'Create' },
    ],
    isEditMode.value ? 'Edit FAQ category' : 'Create a new FAQ category'
  )

  if (isEditMode.value) {
    await fetchCategory()
  }
})

// Auto-generate slug from name
watch(name, (newName) => {
  if (!isEditMode.value && newName) {
    slug.value = newName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
})

// Fetch existing category
async function fetchCategory() {
  isLoading.value = true
  try {
    const response = await faqService.getCategoryById(categoryId.value!)
    existingCategory.value = response.data
    
    // Populate form
    name.value = response.data.name
    slug.value = response.data.slug
    description.value = response.data.description || ''
    icon.value = response.data.icon || ''
    sortOrder.value = response.data.sort_order || 0
    isActive.value = response.data.is_active
  } catch (error) {
    toast.error('Failed to load category')
    router.push('/admin/cms/faqs')
  } finally {
    isLoading.value = false
  }
}

// Validate form
function validateForm(): boolean {
  errors.value = {}
  
  if (!name.value || name.value.length < 2) {
    errors.value.name = 'Name must be at least 2 characters'
  }
  if (!slug.value || !/^[a-z0-9-]+$/.test(slug.value)) {
    errors.value.slug = 'Slug must only contain lowercase letters, numbers, and hyphens'
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
      name: name.value,
      slug: slug.value,
      description: description.value || undefined,
      icon: icon.value || undefined,
      sort_order: sortOrder.value,
      is_active: isActive.value,
    }

    if (isEditMode.value) {
      await faqService.updateCategory(categoryId.value!, data)
      toast.success('Category updated successfully')
    } else {
      await faqService.createCategory(data)
      toast.success('Category created successfully')
    }
    router.push('/admin/cms/faqs')
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message || 'Failed to save category')
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
            {{ isEditMode ? 'Edit Category' : 'Create Category' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Update FAQ category' : 'Create a new FAQ category' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="outline" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSaving" @click="handleSubmit">
          <CheckIcon class="mr-2 h-5 w-5" />
          {{ isEditMode ? 'Update' : 'Create' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else>
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="lg:col-span-2">
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Category Details</h3>
            <div class="space-y-6">
              <FormInput
                v-model="name"
                name="name"
                label="Category Name"
                placeholder="e.g., Shipping & Delivery"
                :error="errors.name"
                required
              />

              <FormInput
                v-model="slug"
                name="slug"
                label="URL Slug"
                placeholder="shipping-delivery"
                :error="errors.slug"
                required
              />

              <FormTextarea
                v-model="description"
                name="description"
                label="Description"
                placeholder="Brief description of this FAQ category"
                :error="errors.description"
                :rows="3"
              />

              <IconPicker
                v-model="icon"
                label="Icon (optional)"
                placeholder="Select an icon"
                :error="errors.icon"
              />
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Settings</h3>
            <div class="space-y-6">
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
                  <p class="text-sm text-gray-500">Show this category publicly</p>
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
