<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin FAQ List — Manage FAQs with categories -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { faqService } from '@/services'
import type { Faq, FaqCategory } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
  FolderIcon,
  ArrowsUpDownIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate } = useDate()
const confirm = useConfirm()

onMounted(() => {
  breadcrumbStore.setPageInfo('FAQs', [
    { label: 'CMS' },
    { label: 'FAQs' },
  ], 'Manage frequently asked questions')
  fetchCategories()
  fetchFaqs()
})

// State
const isLoading = ref(false)
const faqs = ref<Faq[]>([])
const categories = ref<FaqCategory[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const searchQuery = ref('')
const selectedCategory = ref<number | ''>('')
const activeTab = ref<'faqs' | 'categories'>('faqs')

// Category options
const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...categories.value.map(c => ({ value: c.id, label: c.name }))
])

// FAQ Columns
const faqColumns = [
  { key: 'question', label: 'Question', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'order', label: 'Order', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Category Columns
const categoryColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug' },
  { key: 'faqCount', label: 'FAQs' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Fetch categories
async function fetchCategories() {
  try {
    const response = await faqService.getCategories()
    categories.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

// Fetch FAQs
async function fetchFaqs() {
  isLoading.value = true
  try {
    const response = await faqService.getAll({
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      category_id: selectedCategory.value || undefined,
    })
    faqs.value = Array.isArray(response.data) ? response.data : []
    totalItems.value = response.meta?.total || faqs.value.length
  } catch (error: any) {
    console.error('Failed to fetch FAQs:', error)
    if (error.response?.status !== 404) {
      toast.error('Failed to load FAQs')
    }
    faqs.value = []
  } finally {
    isLoading.value = false
  }
}

// Debounced search
const debouncedFetch = useDebounce(() => {
  currentPage.value = 1
  fetchFaqs()
}, 300)

watch(searchQuery, () => debouncedFetch())
watch(selectedCategory, () => {
  currentPage.value = 1
  fetchFaqs()
})

// Page change
function onPageChange(page: number) {
  currentPage.value = page
  fetchFaqs()
}

// Toggle FAQ status
async function toggleFaqStatus(faq: Faq) {
  try {
    await faqService.toggle(faq.id)
    toast.success(`FAQ ${faq.is_active ? 'deactivated' : 'activated'}`)
    fetchFaqs()
  } catch (error) {
    toast.error('Failed to update status')
  }
}

// Toggle category status
async function toggleCategoryStatus(category: FaqCategory) {
  try {
    await faqService.toggleCategory(category.id)
    toast.success(`Category ${category.is_active ? 'deactivated' : 'activated'}`)
    fetchCategories()
  } catch (error) {
    toast.error('Failed to update status')
  }
}

// Delete FAQ
async function deleteFaq(faq: Faq) {
  const confirmed = await confirm.require({
    title: 'Delete FAQ',
    message: `Are you sure you want to delete this FAQ? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await faqService.delete(faq.id)
      toast.success('FAQ deleted successfully')
      fetchFaqs()
    } catch (error) {
      toast.error('Failed to delete FAQ')
    }
  }
}

// Delete category
async function deleteCategory(category: FaqCategory) {
  const confirmed = await confirm.require({
    title: 'Delete Category',
    message: `Are you sure you want to delete "${category.name}"? FAQs in this category will be unassigned.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await faqService.deleteCategory(category.id)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }
}

// Navigate
function createFaq() {
  router.push('/admin/cms/faqs/create')
}

function editFaq(faq: Faq) {
  router.push(`/admin/cms/faqs/${faq.id}/edit`)
}

function createCategory() {
  router.push('/admin/cms/faqs/categories/create')
}

function editCategory(category: FaqCategory) {
  router.push(`/admin/cms/faqs/categories/${category.id}/edit`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">FAQs</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage frequently asked questions and categories
        </p>
      </div>
      <div class="flex gap-3">
        <BaseButton v-if="activeTab === 'categories'" variant="outline" @click="createCategory">
          <FolderIcon class="mr-2 h-5 w-5" />
          Add Category
        </BaseButton>
        <BaseButton v-if="activeTab === 'faqs'" @click="createFaq">
          <PlusIcon class="mr-2 h-5 w-5" />
          Add FAQ
        </BaseButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <button
          :class="[
            'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
            activeTab === 'faqs'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          ]"
          @click="activeTab = 'faqs'"
        >
          <QuestionMarkCircleIcon class="h-5 w-5" />
          FAQs
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
            {{ totalItems }}
          </span>
        </button>
        <button
          :class="[
            'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
            activeTab === 'categories'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          ]"
          @click="activeTab = 'categories'"
        >
          <FolderIcon class="h-5 w-5" />
          Categories
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
            {{ categories.length }}
          </span>
        </button>
      </nav>
    </div>

    <!-- FAQs Tab -->
    <template v-if="activeTab === 'faqs'">
      <!-- Filters -->
      <BaseCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <FormInput
              v-model="searchQuery"
              name="search"
              placeholder="Search FAQs..."
              class="pl-10"
            />
          </div>
          <FormSelect
            v-model="selectedCategory"
            name="category"
            :options="categoryOptions"
            class="w-full sm:w-48"
          />
        </div>
      </BaseCard>

      <!-- FAQ Table -->
      <BaseCard>
        <DataTable
          :columns="faqColumns"
          :data="faqs"
          :loading="isLoading"
          :total="totalItems"
          :current-page="currentPage"
          :per-page="perPage"
          @page-change="onPageChange"
        >
          <template #cell-question="{ item }">
            <div class="max-w-md">
              <p class="font-medium text-gray-900 dark:text-white line-clamp-2">
                {{ item.question }}
              </p>
            </div>
          </template>

          <template #cell-category="{ item }">
            <BaseBadge v-if="item.category" variant="info">
              {{ item.category.name }}
            </BaseBadge>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #cell-status="{ item }">
            <button @click="toggleFaqStatus(item)">
              <BaseBadge :variant="item.is_active ? 'success' : 'secondary'">
                {{ item.is_active ? 'Active' : 'Draft' }}
              </BaseBadge>
            </button>
          </template>

          <template #cell-order="{ item }">
            <div class="flex items-center gap-1 text-gray-500">
              <ArrowsUpDownIcon class="h-4 w-4" />
              {{ item.sort_order || 0 }}
            </div>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-2">
              <button
                class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Edit"
                @click="editFaq(item)"
              >
                <PencilSquareIcon class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete"
                @click="deleteFaq(item)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </template>

          <template #empty>
            <div class="py-12 text-center">
              <QuestionMarkCircleIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No FAQs</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating your first FAQ.</p>
              <div class="mt-6">
                <BaseButton @click="createFaq">
                  <PlusIcon class="mr-2 h-5 w-5" />
                  Add FAQ
                </BaseButton>
              </div>
            </div>
          </template>
        </DataTable>
      </BaseCard>
    </template>

    <!-- Categories Tab -->
    <template v-if="activeTab === 'categories'">
      <BaseCard>
        <DataTable
          :columns="categoryColumns"
          :data="categories"
          :loading="isLoading"
        >
          <template #cell-name="{ item }">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <FolderIcon class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                <p v-if="item.description" class="text-xs text-gray-500 line-clamp-1">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </template>

          <template #cell-slug="{ item }">
            <code class="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
              {{ item.slug }}
            </code>
          </template>

          <template #cell-faqCount="{ item }">
            <span class="font-medium">{{ item.faqs_count || 0 }}</span>
          </template>

          <template #cell-status="{ item }">
            <button @click="toggleCategoryStatus(item)">
              <BaseBadge :variant="item.is_active ? 'success' : 'secondary'">
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </BaseBadge>
            </button>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-2">
              <button
                class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Edit"
                @click="editCategory(item)"
              >
                <PencilSquareIcon class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete"
                @click="deleteCategory(item)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </template>

          <template #empty>
            <div class="py-12 text-center">
              <FolderIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No categories</h3>
              <p class="mt-1 text-sm text-gray-500">Create categories to organize your FAQs.</p>
              <div class="mt-6">
                <BaseButton @click="createCategory">
                  <PlusIcon class="mr-2 h-5 w-5" />
                  Add Category
                </BaseButton>
              </div>
            </div>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
