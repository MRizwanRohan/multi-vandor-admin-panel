<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Static Page Form — Create or edit a static page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast } from '@/composables'
import { pageService } from '@/services'
import type { Page } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import {
  ArrowLeftIcon,
  CheckIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

const pageId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!pageId.value)

// State
const isLoading = ref(false)
const isSaving = ref(false)
const existingPage = ref<Page | null>(null)
const activeTab = ref<'content' | 'seo' | 'settings'>('content')
const errors = ref<Record<string, string>>({})

// Form fields
const title = ref('')
const slug = ref('')
const content = ref('')
const metaTitle = ref('')
const metaDescription = ref('')
const metaKeywords = ref('')
const isActive = ref(true)

onMounted(async () => {
  breadcrumbStore.setPageInfo(
    isEditMode.value ? 'Edit Page' : 'Create Page',
    [
      { label: 'CMS' },
      { label: 'Pages', to: '/admin/cms/pages' },
      { label: isEditMode.value ? 'Edit' : 'Create' },
    ],
    isEditMode.value ? 'Edit static page' : 'Create a new static page'
  )

  if (isEditMode.value) {
    await fetchPage()
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

// Fetch existing page
async function fetchPage() {
  isLoading.value = true
  try {
    const response = await pageService.getById(pageId.value!)
    existingPage.value = response.data
    
    // Populate form
    title.value = response.data.title
    slug.value = response.data.slug
    content.value = response.data.content || ''
    metaTitle.value = response.data.meta_title || ''
    metaDescription.value = response.data.meta_description || ''
    metaKeywords.value = response.data.meta_keywords || ''
    isActive.value = response.data.is_active
  } catch (error) {
    toast.error('Failed to load page')
    router.push('/admin/cms/pages')
  } finally {
    isLoading.value = false
  }
}

// Validate form
function validateForm(): boolean {
  errors.value = {}
  
  if (!title.value || title.value.length < 3) {
    errors.value.title = 'Title must be at least 3 characters'
  }
  if (!slug.value || !/^[a-z0-9-]+$/.test(slug.value)) {
    errors.value.slug = 'Slug must only contain lowercase letters, numbers, and hyphens'
  }
  if (!content.value) {
    errors.value.content = 'Content is required'
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
      title: title.value,
      slug: slug.value,
      content: content.value,
      meta_title: metaTitle.value || undefined,
      meta_description: metaDescription.value || undefined,
      meta_keywords: metaKeywords.value || undefined,
      is_active: isActive.value,
    }

    if (isEditMode.value) {
      await pageService.update(pageId.value!, data)
      toast.success('Page updated successfully')
    } else {
      await pageService.create(data)
      toast.success('Page created successfully')
    }
    router.push('/admin/cms/pages')
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message || 'Failed to save page')
    }
  } finally {
    isSaving.value = false
  }
}

// Cancel
function goBack() {
  router.push('/admin/cms/pages')
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
            {{ isEditMode ? 'Edit Page' : 'Create Page' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Update static page content and settings' : 'Create a new static page' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="outline" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSaving" @click="handleSubmit">
          <CheckIcon class="mr-2 h-5 w-5" />
          {{ isEditMode ? 'Update Page' : 'Create Page' }}
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
              activeTab === 'seo'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
            @click="activeTab = 'seo'"
          >
            <MagnifyingGlassIcon class="h-5 w-5" />
            SEO
          </button>
          <button
            :class="[
              'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
            @click="activeTab = 'settings'"
          >
            <Cog6ToothIcon class="h-5 w-5" />
            Settings
          </button>
        </nav>
      </div>

      <!-- Content Tab -->
      <BaseCard v-show="activeTab === 'content'">
        <div class="space-y-6">
          <FormInput
            v-model="title"
            name="title"
            label="Page Title"
            placeholder="Enter page title"
            :error="errors.title"
            required
          />

          <FormInput
            v-model="slug"
            name="slug"
            label="URL Slug"
            placeholder="page-url-slug"
            :error="errors.slug"
            required
          >
            <template #prefix>
              <span class="text-gray-500">/</span>
            </template>
          </FormInput>

          <FormTextarea
            v-model="content"
            name="content"
            label="Page Content"
            placeholder="Enter page content (HTML supported)"
            :error="errors.content"
            :rows="15"
            required
          />
          <p class="text-xs text-gray-500">
            You can use HTML tags for formatting. For advanced editing, consider integrating a rich text editor.
          </p>
        </div>
      </BaseCard>

      <!-- SEO Tab -->
      <BaseCard v-show="activeTab === 'seo'">
        <div class="space-y-6">
          <FormInput
            v-model="metaTitle"
            name="meta_title"
            label="Meta Title"
            placeholder="SEO title (defaults to page title)"
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
          <p class="text-xs text-gray-500">Comma-separated keywords (used by some search engines)</p>
        </div>
      </BaseCard>

      <!-- Settings Tab -->
      <BaseCard v-show="activeTab === 'settings'">
        <div class="space-y-6">
          <div class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">Page Status</h4>
              <p class="text-sm text-gray-500">Make this page visible to visitors</p>
            </div>
            <FormSwitch
              v-model="isActive"
              name="is_active"
            />
          </div>
        </div>
      </BaseCard>

      <!-- Preview -->
      <BaseCard v-if="content">
        <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Content Preview</h3>
        <div 
          class="prose max-w-none dark:prose-invert"
          v-html="content"
        ></div>
      </BaseCard>
    </template>
  </div>
</template>
