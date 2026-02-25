<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Category Form — Create/Edit category page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast } from '@/composables'
import { getImageUrl } from '@/utils/helpers'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { Category } from '@/types'
import { PhotoIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Mode detection
const categorySlug = computed(() => {
  const raw = route.params.slug as string | undefined
  if (!raw || raw === 'new') return undefined
  return raw
})
const isEditMode = computed(() => categorySlug.value !== undefined)
const pageTitle = computed(() => isEditMode.value ? 'Edit Category' : 'Add Category')

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Categories', to: '/admin/categories' },
    { label: pageTitle.value },
  ])
  
  if (isEditMode.value) {
    fetchCategory()
  }
  fetchParentCategories()
})

// Data
const isLoading = ref(false)
const parentCategories = ref<Category[]>([])
const imagePreview = ref<string | null>(null)
const selectedImage = ref<File | null>(null)
const currentCategoryId = ref<number | null>(null)

// Form validation
const categorySchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.coerce.number().optional().nullable(),
  status: z.enum(['active', 'inactive', 'pending', 'rejected']),
  is_active: z.boolean().optional(),
  display_order: z.coerce.number().int().min(0).optional(),
  seo_title: z.string().max(255).optional(),
  seo_description: z.string().max(500).optional(),
  keywords: z.string().optional(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
  setErrors,
} = useForm({
  validationSchema: categorySchema,
  initialValues: {
    name: '',
    slug: '',
    description: '',
    parent_id: null as number | null,
    status: 'active' as const,
    is_active: true,
    display_order: 0,
    seo_title: '',
    seo_description: '',
    keywords: '',
  },
})

const [name, nameAttrs] = defineField('name')
const [slug, slugAttrs] = defineField('slug')
const [description, descriptionAttrs] = defineField('description')
const [parentId, parentIdAttrs] = defineField('parent_id')
const [status, statusAttrs] = defineField('status')
const [isActive, isActiveAttrs] = defineField('is_active')
const [displayOrder, displayOrderAttrs] = defineField('display_order')
const [seoTitle, seoTitleAttrs] = defineField('seo_title')
const [seoDescription, seoDescriptionAttrs] = defineField('seo_description')
const [keywords, keywordsAttrs] = defineField('keywords')

// Auto-generate slug from name
watch(name, (newName) => {
  if (!isEditMode.value && newName) {
    slug.value = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }
})

// Options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

// Flatten tree for parent dropdown
function flattenCategories(cats: Category[], prefix = ''): { value: number; label: string }[] {
  const result: { value: number; label: string }[] = []
  for (const c of cats) {
    result.push({ value: c.id, label: prefix ? `${prefix} → ${c.name}` : c.name })
    if (c.children && c.children.length > 0) {
      result.push(...flattenCategories(c.children, prefix ? `${prefix} → ${c.name}` : c.name))
    }
  }
  return result
}

const parentOptions = computed(() => [
  { value: '', label: 'None (Top Level)' },
  ...flattenCategories(parentCategories.value)
    .filter(c => c.value !== currentCategoryId.value),
])

// Fetch category for editing
async function fetchCategory() {
  if (!categorySlug.value) return
  
  isLoading.value = true
  try {
    const category = await categoryService.get(categorySlug.value)
    currentCategoryId.value = category.id
    setValues({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id,
      status: category.status || 'active',
      is_active: category.is_active ?? true,
      display_order: category.display_order || 0,
      seo_title: category.seo_title || '',
      seo_description: category.seo_description || '',
      keywords: (category.keywords || []).join(', '),
    })
    // Show existing image
    if (category.image || category.image_field) {
      imagePreview.value = getImageUrl(category.image || category.image_field)
    }
  } catch (error) {
    toast.error('Failed to fetch category')
    router.push('/admin/categories')
  } finally {
    isLoading.value = false
  }
}

// Fetch parent categories
async function fetchParentCategories() {
  try {
    const response = await categoryService.getAll()
    parentCategories.value = response.data
  } catch (error) {
    parentCategories.value = []
  }
}

// Image upload
function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload an image file')
    return
  }
  
  selectedImage.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeImage() {
  imagePreview.value = null
  selectedImage.value = null
}

// Image error handler
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  console.error('Failed to load image:', target.src)
  toast.error('Failed to load image')
  imagePreview.value = null
}

// Submit form
const onSubmit = handleSubmit(async (values) => {
  try {
    const keywordsArray = (values.keywords || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean)

    const formData: Record<string, unknown> = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      parent_id: values.parent_id || null,
      status: values.status,
      is_active: values.is_active ?? (values.status === 'active'),
      display_order: values.display_order,
      metadata: {
        seo_title: values.seo_title || undefined,
        seo_description: values.seo_description || undefined,
        keywords: keywordsArray.length ? keywordsArray : undefined,
      },
    }
    
    // Add selected image file if present
    if (selectedImage.value) {
      formData.image = selectedImage.value
    }
    
    if (isEditMode.value && categorySlug.value) {
      await categoryService.update(categorySlug.value, formData as Parameters<typeof categoryService.update>[1])
      toast.success('Category updated successfully')
    } else {
      await categoryService.create(formData as Parameters<typeof categoryService.create>[0])
      toast.success('Category created successfully')
    }
    
    router.push('/admin/categories')
  } catch (error: any) {
    const apiErrors = error.response?.data?.errors
    if (apiErrors) {
      const mappedErrors: Record<string, string> = {}
      for (const [field, msgs] of Object.entries(apiErrors)) {
        mappedErrors[field] = (msgs as string[])[0]
      }
      setErrors(mappedErrors)
      toast.error('Please fix the validation errors')
    } else {
      toast.error(error.response?.data?.message || (isEditMode.value ? 'Failed to update category' : 'Failed to create category'))
    }
  }
})

// Navigation
function goBack() {
  router.push('/admin/categories')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" @click="goBack">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
      </div>
      <div class="flex gap-3">
        <BaseButton variant="secondary" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">
          {{ isEditMode ? 'Update Category' : 'Create Category' }}
        </BaseButton>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Information -->
        <BaseCard title="Basic Information">
          <div class="space-y-4">
            <FormInput
              v-model="name"
              v-bind="nameAttrs"
              name="name"
              label="Category Name"
              placeholder="Enter category name"
              :error="errors.name"
              required
            />
            
            <FormInput
              v-model="slug"
              v-bind="slugAttrs"
              name="slug"
              label="Slug"
              placeholder="category-slug"
              :error="errors.slug"
              hint="URL-friendly identifier (auto-generated from name)"
            />
            
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
              name="description"
              label="Description"
              placeholder="Enter category description"
              :rows="4"
              :error="errors.description"
            />
          </div>
        </BaseCard>

        <!-- Category Image -->
        <BaseCard title="Category Image">
          <div class="space-y-4">
            <div v-if="imagePreview" class="relative inline-block">
              <img
                :src="imagePreview"
                alt="Category image"
                class="w-48 h-48 object-cover rounded-lg"
                @error="handleImageError"
              />
              <button
                type="button"
                @click="removeImage"
                class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
            
            <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
              <label class="flex flex-col items-center cursor-pointer">
                <PhotoIcon class="h-12 w-12 text-gray-400" />
                <span class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Click to upload image
                </span>
                <span class="mt-1 text-xs text-gray-400">PNG, JPG up to 2MB</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                />
              </label>
            </div>
          </div>
        </BaseCard>

        <!-- SEO Settings -->
        <BaseCard title="SEO Settings">
          <div class="space-y-4">
            <FormInput
              v-model="seoTitle"
              v-bind="seoTitleAttrs"
              name="seo_title"
              label="SEO Title"
              placeholder="SEO title for search engines"
              :error="errors.seo_title"
            />
            
            <FormTextarea
              v-model="seoDescription"
              v-bind="seoDescriptionAttrs"
              name="seo_description"
              label="SEO Description"
              placeholder="SEO description for search engines"
              :rows="3"
              :error="errors.seo_description"
            />

            <FormInput
              v-model="keywords"
              v-bind="keywordsAttrs"
              name="keywords"
              label="Keywords"
              placeholder="Comma-separated keywords"
              :error="errors.keywords"
              hint="Separate keywords with commas"
            />
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status & Hierarchy -->
        <BaseCard title="Organization">
          <div class="space-y-4">
            <FormSelect
              v-model="status"
              v-bind="statusAttrs"
              name="status"
              label="Status"
              :options="statusOptions"
              :error="errors.status"
            />
            
            <FormSelect
              v-model="parentId"
              v-bind="parentIdAttrs"
              name="parent_id"
              label="Parent Category"
              :options="parentOptions"
              :error="errors.parent_id"
            />
            
            <FormInput
              v-model="displayOrder"
              v-bind="displayOrderAttrs"
              name="display_order"
              label="Display Order"
              type="number"
              :min="0"
              :error="errors.display_order"
            />
            
            <FormSwitch
              v-model="isActive"
              v-bind="isActiveAttrs"
              name="is_active"
              label="Active"
            />
          </div>
        </BaseCard>

        <!-- Keywords Note -->
        <BaseCard title="Attribute Templates">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Attribute templates are managed from the category detail page after creation.
          </p>
        </BaseCard>
      </div>
    </form>
  </div>
</template>
