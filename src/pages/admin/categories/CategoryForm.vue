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
import { categoryService, attributeTemplateService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { Category, AttributeTemplate } from '@/types'
import { PhotoIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Mode detection
const categoryId = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw || raw === 'new') return undefined
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})
const isEditMode = computed(() => categoryId.value !== undefined)
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
  fetchAttributeTemplates()
})

// Data
const isLoading = ref(false)
const parentCategories = ref<Category[]>([])
const attributeTemplates = ref<AttributeTemplate[]>([])
const imagePreview = ref<string | null>(null)
const selectedImage = ref<File | null>(null)

// Form validation
const categorySchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.coerce.number().optional().nullable(),
  status: z.enum(['active', 'inactive']),
  is_featured: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  attribute_template_id: z.coerce.number().optional().nullable(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: categorySchema,
  initialValues: {
    name: '',
    slug: '',
    description: '',
    parent_id: null as number | null,
    status: 'active' as const,
    is_featured: false,
    sort_order: 0,
    meta_title: '',
    meta_description: '',
    attribute_template_id: null as number | null,
  },
})

const [name, nameAttrs] = defineField('name')
const [slug, slugAttrs] = defineField('slug')
const [description, descriptionAttrs] = defineField('description')
const [parentId, parentIdAttrs] = defineField('parent_id')
const [status, statusAttrs] = defineField('status')
const [isFeatured, isFeaturedAttrs] = defineField('is_featured')
const [sortOrder, sortOrderAttrs] = defineField('sort_order')
const [metaTitle, metaTitleAttrs] = defineField('meta_title')
const [metaDescription, metaDescriptionAttrs] = defineField('meta_description')
const [attributeTemplateId, attributeTemplateIdAttrs] = defineField('attribute_template_id')

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
]

const parentOptions = computed(() => [
  { value: '', label: 'None (Top Level)' },
  ...parentCategories.value
    .filter(c => c.id !== categoryId.value)
    .map(c => ({ value: c.id, label: c.name })),
])

const templateOptions = computed(() => [
  { value: '', label: 'No Template' },
  ...attributeTemplates.value.map(t => ({ value: t.id, label: t.name })),
])

// Fetch category for editing
async function fetchCategory() {
  if (!categoryId.value) return
  
  isLoading.value = true
  try {
    const category = await categoryService.getById(categoryId.value)
    setValues({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id,
      status: category.status === 'active' ? 'active' : 'inactive',
      is_featured: false,
      sort_order: category.display_order || 0,
      meta_title: '',
      meta_description: '',
      attribute_template_id: null,
    })
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

// Fetch attribute templates
async function fetchAttributeTemplates() {
  try {
    attributeTemplates.value = await attributeTemplateService.getAllForSelect()
  } catch (error) {
    attributeTemplates.value = []
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

// Submit form
const onSubmit = handleSubmit(async (values) => {
  try {
    const formData: Record<string, unknown> = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      parent_id: values.parent_id || null,
      status: values.status,
      is_featured: values.is_featured,
      sort_order: values.sort_order,
      meta_title: values.meta_title,
      meta_description: values.meta_description,
      attribute_template_id: values.attribute_template_id || null,
    }
    
    if (selectedImage.value) {
      formData.image = selectedImage.value
    }
    
    if (isEditMode.value && categoryId.value) {
      await categoryService.update(categoryId.value, formData as Parameters<typeof categoryService.update>[1])
      toast.success('Category updated successfully')
    } else {
      await categoryService.create(formData as Parameters<typeof categoryService.create>[0])
      toast.success('Category created successfully')
    }
    
    router.push('/admin/categories')
  } catch (error) {
    toast.error(isEditMode.value ? 'Failed to update category' : 'Failed to create category')
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
              label="Category Name"
              placeholder="Enter category name"
              :error="errors.name"
              required
            />
            
            <FormInput
              v-model="slug"
              v-bind="slugAttrs"
              label="Slug"
              placeholder="category-slug"
              :error="errors.slug"
              hint="URL-friendly identifier (auto-generated from name)"
            />
            
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
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
              v-model="metaTitle"
              v-bind="metaTitleAttrs"
              label="Meta Title"
              placeholder="SEO title for search engines"
              :error="errors.meta_title"
            />
            
            <FormTextarea
              v-model="metaDescription"
              v-bind="metaDescriptionAttrs"
              label="Meta Description"
              placeholder="SEO description for search engines"
              :rows="3"
              :error="errors.meta_description"
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
              label="Status"
              :options="statusOptions"
              :error="errors.status"
            />
            
            <FormSelect
              v-model="parentId"
              v-bind="parentIdAttrs"
              label="Parent Category"
              :options="parentOptions"
              :error="errors.parent_id"
            />
            
            <FormInput
              v-model="sortOrder"
              v-bind="sortOrderAttrs"
              label="Display Order"
              type="number"
              :min="0"
              :error="errors.sort_order"
            />
            
            <FormSwitch
              v-model="isFeatured"
              v-bind="isFeaturedAttrs"
              label="Featured Category"
            />
          </div>
        </BaseCard>

        <!-- Attribute Template -->
        <BaseCard title="Attribute Template">
          <div class="space-y-4">
            <FormSelect
              v-model="attributeTemplateId"
              v-bind="attributeTemplateIdAttrs"
              label="Assign Template"
              :options="templateOptions"
              :error="errors.attribute_template_id"
              hint="Products in this category will inherit attributes from the selected template"
            />
          </div>
        </BaseCard>
      </div>
    </form>
  </div>
</template>
