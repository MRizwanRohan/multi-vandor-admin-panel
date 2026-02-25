<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Edit Category — Vendor: edit own pending category                 -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import type { Category } from '@/types'
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

const categoryId = computed(() => Number(route.params.id))

// State
const category = ref<Category | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const loadError = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  display_order: 0,
  seo_title: '',
  seo_description: '',
  keywords: '',
})

onMounted(() => {
  breadcrumbStore.setPageInfo('Edit Category', [
    { label: 'Categories', to: '/vendor/categories/my' },
    { label: 'Edit' },
  ])
  fetchCategory()
})

async function fetchCategory() {
  isLoading.value = true
  loadError.value = null
  try {
    const cat = await categoryService.getVendorCategoryDetail(categoryId.value)
    category.value = cat

    // Only pending own categories can be edited
    if (cat.status !== 'pending') {
      loadError.value = 'Only pending categories can be edited.'
      return
    }

    // Populate form
    form.value = {
      name: cat.name || '',
      description: cat.description || '',
      display_order: cat.display_order || 0,
      seo_title: cat.seo_title || '',
      seo_description: cat.seo_description || '',
      keywords: (cat.keywords || []).join(', '),
    }

    breadcrumbStore.setPageInfo(`Edit: ${cat.name}`, [
      { label: 'Categories', to: '/vendor/categories/my' },
      { label: cat.name },
    ])
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load category'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    toast.error('Category name is required')
    return
  }

  isSaving.value = true
  try {
    const keywords = form.value.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)

    await categoryService.updatePendingCategory(categoryId.value, {
      name: form.value.name,
      description: form.value.description || undefined,
      display_order: form.value.display_order,
      metadata: {
        seo_title: form.value.seo_title || undefined,
        seo_description: form.value.seo_description || undefined,
        keywords: keywords.length ? keywords : undefined,
      },
    })

    toast.success('Category updated successfully')
    router.push('/vendor/categories/my')
  } catch (err: any) {
    const errors = err.response?.data?.errors
    if (errors) {
      const firstError = Object.values(errors).flat()[0] as string
      toast.error(firstError || 'Validation failed')
    } else {
      toast.error(err.response?.data?.message || 'Failed to update category')
    }
  } finally {
    isSaving.value = false
  }
}

function goBack() {
  router.push('/vendor/categories/my')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <BaseButton variant="ghost" size="sm" @click="goBack">
        <ArrowLeftIcon class="h-4 w-4" />
      </BaseButton>
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Category</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Update your pending category suggestion
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <!-- Error state -->
    <BaseCard v-else-if="loadError" class="!py-12">
      <div class="flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <ExclamationTriangleIcon class="h-7 w-7 text-amber-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cannot Edit</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ loadError }}</p>
        <BaseButton variant="primary" class="mt-6" @click="goBack">
          <ArrowLeftIcon class="mr-1.5 h-4 w-4" />
          Back to My Categories
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Edit form -->
    <template v-else-if="category">
      <!-- Info banner -->
      <BaseCard class="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
        <div class="flex items-center gap-3">
          <ExclamationTriangleIcon class="h-5 w-5 shrink-0 text-amber-500" />
          <div class="text-sm text-amber-700 dark:text-amber-300">
            <p>
              You can only edit <strong>name</strong>, <strong>description</strong>,
              <strong>display order</strong>, and <strong>SEO settings</strong>.
              Parent category, status, and image cannot be changed.
            </p>
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
                placeholder="Enter category name"
                required
              />

              <FormTextarea
                v-model="form.description"
                label="Description"
                placeholder="Describe what products would belong in this category..."
                :rows="4"
              />

              <FormInput
                v-model.number="form.display_order"
                label="Display Order"
                type="number"
                :min="0"
              />
            </div>
          </BaseCard>

          <!-- SEO -->
          <BaseCard title="SEO Settings">
            <div class="space-y-4">
              <FormInput
                v-model="form.seo_title"
                label="SEO Title"
                placeholder="Category title for search engines"
                hint="Max 255 characters"
              />
              <FormTextarea
                v-model="form.seo_description"
                label="SEO Description"
                placeholder="Brief description for search engine results"
                :rows="2"
                hint="Max 500 characters"
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

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Current status -->
          <BaseCard title="Status">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Status</span>
                <BaseBadge variant="warning" dot rounded size="sm">
                  {{ category.status_label || 'Pending Review' }}
                </BaseBadge>
              </div>
              <div v-if="category.parent_id" class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Parent</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {{ category.parent?.name || `ID: ${category.parent_id}` }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Depth</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">Level {{ category.depth }}</span>
              </div>
            </div>
          </BaseCard>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              :loading="isSaving"
              :disabled="!form.name.trim()"
              class="w-full"
            >
              Save Changes
            </BaseButton>
            <BaseButton variant="secondary" class="w-full" @click="goBack">
              Cancel
            </BaseButton>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>
