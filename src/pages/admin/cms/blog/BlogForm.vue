<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Blog Post Form — Create or edit a blog post -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast } from '@/composables'
import { blogService } from '@/services'
import { sanitizeHtml } from '@/utils/sanitize'
import type { BlogPost, BlogCategory } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import SearchableSelectSimple from '@/components/form/SearchableSelectSimple.vue'
import {
  ArrowLeftIcon,
  CheckIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

const postId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!postId.value)

// State
const isLoading = ref(false)
const isSaving = ref(false)
const existingPost = ref<BlogPost | null>(null)
const categories = ref<BlogCategory[]>([])
const activeTab = ref<'content' | 'seo' | 'media'>('content')
const featuredImagePreview = ref<string | null>(null)
const featuredImageFile = ref<File | null>(null)

// Category and status options
const categoryOptions = computed(() => [
  { value: null, label: 'No category' },
  ...categories.value.map(c => ({ value: c.id, label: c.name }))
])

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'archived', label: 'Archived' },
]

// Form fields
const title = ref('')
const slug = ref('')
const content = ref('')
const excerpt = ref('')
const categoryId = ref<number | null>(null)
const status = ref<'draft' | 'published' | 'scheduled' | 'archived'>('draft')
const featuredImage = ref<File | null>(null)
const metaTitle = ref('')
const metaDescription = ref('')
const metaKeywords = ref('')
const publishedAt = ref('')
const tags = ref<string[]>([])
const errors = ref<Record<string, string>>({})

// Validation
function validateForm(): boolean {
  errors.value = {}
  if (!title.value?.trim()) {
    errors.value.title = 'Title is required'
  } else if (title.value.length < 5) {
    errors.value.title = 'Title must be at least 5 characters'
  }
  if (!slug.value?.trim()) {
    errors.value.slug = 'Slug is required'
  } else if (!/^[a-z0-9-]+$/.test(slug.value)) {
    errors.value.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
  }
  if (!content.value?.trim()) {
    errors.value.content = 'Content is required'
  } else if (content.value.length < 50) {
    errors.value.content = 'Content must be at least 50 characters'
  }
  return Object.keys(errors.value).length === 0
}

onMounted(async () => {
  breadcrumbStore.setPageInfo(
    isEditMode.value ? 'Edit Post' : 'Create Post',
    [
      { label: 'CMS' },
      { label: 'Blog', to: '/admin/cms/blog' },
      { label: isEditMode.value ? 'Edit' : 'Create' },
    ],
    isEditMode.value ? 'Edit blog post' : 'Create a new blog post'
  )

  await fetchCategories()
  
  if (isEditMode.value) {
    await fetchPost()
  }
})

// Auto-generate slug from title
watch(title, (newTitle) => {
  if (!isEditMode.value && newTitle) {
    slug.value = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
})

// Fetch categories
async function fetchCategories() {
  try {
    const response = await blogService.getCategories()
    categories.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

// Fetch existing post
async function fetchPost() {
  isLoading.value = true
  try {
    const response = await blogService.getById(postId.value!)
    existingPost.value = response.data
    
    // Populate form
    title.value = response.data.title
    slug.value = response.data.slug
    content.value = response.data.content || ''
    excerpt.value = response.data.excerpt || ''
    categoryId.value = response.data.category_id || null
    status.value = response.data.status || 'draft'
    metaTitle.value = response.data.meta_title || ''
    metaDescription.value = response.data.meta_description || ''
    metaKeywords.value = response.data.meta_keywords || ''
    publishedAt.value = response.data.published_at || ''
    tags.value = response.data.tags || []
    
    // Set existing featured image
    if (response.data.featured_image) {
      featuredImagePreview.value = response.data.featured_image
    }
  } catch (error) {
    toast.error('Failed to load post')
    router.push('/admin/cms/blog')
  } finally {
    isLoading.value = false
  }
}

// Handle featured image selection
function handleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    
    featuredImageFile.value = file
    featuredImage.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      featuredImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Remove featured image
function removeImage() {
  featuredImageFile.value = null
  featuredImagePreview.value = null
  featuredImage.value = null
}

// Submit form
async function handleSubmit() {
  if (!validateForm()) return

  isSaving.value = true
  try {
    // Prepare form data
    const data = {
      title: title.value,
      slug: slug.value,
      content: content.value,
      excerpt: excerpt.value,
      category_id: categoryId.value || null,
      status: status.value,
      featured_image: featuredImage.value,
      meta_title: metaTitle.value,
      meta_description: metaDescription.value,
      meta_keywords: metaKeywords.value,
      published_at: publishedAt.value,
      tags: tags.value?.length ? tags.value : undefined,
    }

    if (isEditMode.value) {
      await blogService.update(postId.value!, data)
      toast.success('Post updated successfully')
    } else {
      await blogService.create(data)
      toast.success('Post created successfully')
    }
    router.push('/admin/cms/blog')
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message || 'Failed to save post')
    }
  } finally {
    isSaving.value = false
  }
}

// Save as draft
async function saveAsDraft() {
  status.value = 'draft'
  await handleSubmit()
}

// Publish now
async function publishNow() {
  status.value = 'published'
  publishedAt.value = new Date().toISOString()
  await handleSubmit()
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
            {{ isEditMode ? 'Edit Post' : 'Create Post' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Update blog post' : 'Create a new blog post' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="outline" @click="goBack">Cancel</BaseButton>
        <BaseButton variant="secondary" :loading="isSaving" @click="saveAsDraft">
          Save Draft
        </BaseButton>
        <BaseButton :loading="isSaving" @click="publishNow">
          <CheckIcon class="mr-2 h-5 w-5" />
          {{ isEditMode && existingPost?.status === 'published' ? 'Update' : 'Publish' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            :class="[
              'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
              activeTab === 'content'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
            @click="activeTab = 'content'"
          >
            <DocumentTextIcon class="h-5 w-5" />
            Content
          </button>
          <button
            :class="[
              'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
              activeTab === 'media'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
            @click="activeTab = 'media'"
          >
            <PhotoIcon class="h-5 w-5" />
            Media
          </button>
          <button
            :class="[
              'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
              activeTab === 'seo'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
            @click="activeTab = 'seo'"
          >
            <MagnifyingGlassIcon class="h-5 w-5" />
            SEO
          </button>
        </nav>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Content Tab -->
          <template v-if="activeTab === 'content'">
            <BaseCard>
              <div class="space-y-6">
                <FormInput
                  v-model="title"
                  name="title"
                  label="Post Title"
                  placeholder="Enter post title"
                  :error="errors.title"
                  required
                />

                <FormInput
                  v-model="slug"
                  name="slug"
                  label="URL Slug"
                  placeholder="post-url-slug"
                  :error="errors.slug"
                  required
                >
                  <template #prefix>
                    <span class="text-gray-500">/blog/</span>
                  </template>
                </FormInput>

                <FormTextarea
                  v-model="excerpt"
                  name="excerpt"
                  label="Excerpt"
                  placeholder="Brief summary of the post (displayed in listings)"
                  :error="errors.excerpt"
                  :rows="3"
                />

                <FormTextarea
                  v-model="content"
                  name="content"
                  label="Content"
                  placeholder="Write your blog post content here (HTML supported)..."
                  :error="errors.content"
                  :rows="20"
                  required
                />
                <p class="text-xs text-gray-500">
                  HTML tags supported for formatting.
                </p>
              </div>
            </BaseCard>
          </template>

          <!-- Media Tab -->
          <template v-if="activeTab === 'media'">
            <BaseCard>
              <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Featured Image</h3>
              
              <div v-if="featuredImagePreview" class="mb-4">
                <div class="relative inline-block">
                  <img 
                    :src="featuredImagePreview" 
                    alt="Featured image preview"
                    class="max-h-64 rounded-lg object-cover"
                  />
                  <button
                    class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    @click="removeImage"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <label class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-primary-400 dark:border-gray-600">
                <PhotoIcon class="h-12 w-12 text-gray-400" />
                <span class="mt-2 text-sm text-gray-500">
                  Click to upload featured image
                </span>
                <span class="mt-1 text-xs text-gray-400">
                  PNG, JPG, GIF up to 5MB
                </span>
                <input
                  type="file"
                  class="hidden"
                  accept="image/*"
                  @change="handleImageSelect"
                />
              </label>
            </BaseCard>
          </template>

          <!-- SEO Tab -->
          <template v-if="activeTab === 'seo'">
            <BaseCard>
              <h3 class="mb-4 font-medium text-gray-900 dark:text-white">SEO Settings</h3>
              <div class="space-y-6">
                <FormInput
                  v-model="metaTitle"
                  name="meta_title"
                  label="Meta Title"
                  placeholder="SEO title (defaults to post title)"
                  :error="errors.meta_title"
                />
                <p class="text-xs text-gray-500">Recommended length: 50-60 characters</p>

                <FormTextarea
                  v-model="metaDescription"
                  name="meta_description"
                  label="Meta Description"
                  placeholder="Brief description for search engines"
                  :error="errors.meta_description"
                  :rows="3"
                />
                <p class="text-xs text-gray-500">Recommended length: 150-160 characters</p>

                <FormInput
                  v-model="metaKeywords"
                  name="meta_keywords"
                  label="Meta Keywords"
                  placeholder="keyword1, keyword2, keyword3"
                  :error="errors.meta_keywords"
                />
              </div>
            </BaseCard>
          </template>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status Card -->
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Publishing</h3>
            <div class="space-y-4">
              <FormSelect
                v-model="status"
                name="status"
                label="Status"
                :options="statusOptions"
                :error="errors.status"
              />

              <FormInput
                v-if="status === 'scheduled'"
                v-model="publishedAt"
                name="published_at"
                label="Publish Date"
                type="datetime-local"
                :error="errors.published_at"
              />

              <div v-if="existingPost" class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p class="text-xs text-gray-500">
                  Current status: 
                  <BaseBadge 
                    :variant="existingPost.status === 'published' ? 'success' : 'secondary'"
                    class="ml-1"
                  >
                    {{ existingPost.status }}
                  </BaseBadge>
                </p>
              </div>
            </div>
          </BaseCard>

          <!-- Category Card -->
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Category</h3>
            <SearchableSelectSimple
              v-model="categoryId"
              name="category_id"
              placeholder="Search categories..."
              :options="categoryOptions"
              :error="errors.category_id"
              clearable
            />
          </BaseCard>

          <!-- Tags Card -->
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Tags</h3>
            <FormInput
              v-model="tags"
              name="tags"
              placeholder="tag1, tag2, tag3"
              :error="errors.tags"
            />
            <p class="mt-2 text-xs text-gray-500">
              Comma-separated list of tags
            </p>
          </BaseCard>
        </div>
      </div>

      <!-- Content Preview -->
      <BaseCard v-if="content && activeTab === 'content'">
        <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Content Preview</h3>
        <div 
          class="prose max-w-none dark:prose-invert"
          v-html="sanitizeHtml(content)"
        ></div>
      </BaseCard>
    </template>
  </div>
</template>
