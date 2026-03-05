<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Blog Category Form — Create or edit a blog category -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast } from '@/composables'
import { blogService } from '@/services'
import type { BlogCategory } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import {
  ArrowLeftIcon,
  CheckIcon,
  PhotoIcon,
  TrashIcon,
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
const existingCategory = ref<BlogCategory | null>(null)
const imagePreview = ref<string | null>(null)
const imageFile = ref<File | null>(null)

// Form fields
const name = ref('')
const slug = ref('')
const description = ref('')
const image = ref<File | null>(null)
const sortOrder = ref(0)
const isActive = ref(true)
const errors = ref<Record<string, string>>({})

// Validation
function validateForm(): boolean {
  errors.value = {}
  if (!name.value?.trim()) {
    errors.value.name = 'Name is required'
  } else if (name.value.length < 2) {
    errors.value.name = 'Name must be at least 2 characters'
  }
  if (!slug.value?.trim()) {
    errors.value.slug = 'Slug is required'
  } else if (!/^[a-z0-9-]+$/.test(slug.value)) {
    errors.value.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
  }
  return Object.keys(errors.value).length === 0
}

onMounted(async () => {
  breadcrumbStore.setPageInfo(
    isEditMode.value ? 'Edit Category' : 'Create Category',
    [
      { label: 'CMS' },
      { label: 'Blog', to: '/admin/cms/blog' },
      { label: 'Categories' },
      { label: isEditMode.value ? 'Edit' : 'Create' },
    ],
    isEditMode.value ? 'Edit blog category' : 'Create a new blog category'
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
    const response = await blogService.getCategoryById(categoryId.value!)
    existingCategory.value = response.data
    
    // Populate form
    name.value = response.data.name
    slug.value = response.data.slug
    description.value = response.data.description || ''
    sortOrder.value = response.data.sort_order || 0
    isActive.value = response.data.is_active
    
    // Set existing image
    if (response.data.image) {
      imagePreview.value = response.data.image
    }
  } catch (error) {
    toast.error('Failed to load category')
    router.push('/admin/cms/blog')
  } finally {
    isLoading.value = false
  }
}

// Handle image selection
function handleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }
    
    imageFile.value = file
    image.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Remove image
function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  image.value = null
}

// Submit form
async function handleSubmit() {
  if (!validateForm()) return

  isSaving.value = true
  try {
    const data = {
      name: name.value,
      slug: slug.value,
      description: description.value,
      image: image.value,
      sort_order: sortOrder.value,
      is_active: isActive.value,
    }
    
    if (isEditMode.value) {
      await blogService.updateCategory(categoryId.value!, data)
      toast.success('Category updated successfully')
    } else {
      await blogService.createCategory(data)
      toast.success('Category created successfully')
    }
    router.push('/admin/cms/blog')
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
  router.push('/admin/cms/blog')
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
            {{ isEditMode ? 'Update blog category' : 'Create a new blog category' }}
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
        <div class="lg:col-span-2 space-y-6">
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Category Details</h3>
            <div class="space-y-6">
              <FormInput
                v-model="name"
                name="name"
                label="Category Name"
                placeholder="e.g., Technology"
                :error="errors.name"
                required
              />

              <FormInput
                v-model="slug"
                name="slug"
                label="URL Slug"
                placeholder="technology"
                :error="errors.slug"
                required
              >
                <template #prefix>
                  <span class="text-gray-500">/blog/category/</span>
                </template>
              </FormInput>

              <FormTextarea
                v-model="description"
                name="description"
                label="Description"
                placeholder="Brief description of this blog category"
                :error="errors.description"
                :rows="3"
              />
            </div>
          </BaseCard>

          <!-- Category Image -->
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Category Image</h3>
            
            <div v-if="imagePreview" class="mb-4">
              <div class="relative inline-block">
                <img 
                  :src="imagePreview" 
                  alt="Category image preview"
                  class="h-32 w-32 rounded-lg object-cover"
                />
                <button
                  class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  @click="removeImage"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>

            <label class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-primary-400 dark:border-gray-600">
              <PhotoIcon class="h-10 w-10 text-gray-400" />
              <span class="mt-2 text-sm text-gray-500">
                Click to upload image
              </span>
              <span class="mt-1 text-xs text-gray-400">
                PNG, JPG up to 2MB
              </span>
              <input
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleImageSelect"
              />
            </label>
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
