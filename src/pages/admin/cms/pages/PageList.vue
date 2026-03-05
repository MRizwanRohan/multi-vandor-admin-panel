<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Static Pages — List and manage static pages -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { pageService } from '@/services'
import type { Page } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate } = useDate()
const confirm = useConfirm()

onMounted(() => {
  breadcrumbStore.setPageInfo('Static Pages', [
    { label: 'CMS' },
    { label: 'Pages' },
  ], 'Manage static pages')
  fetchPages()
})

// State
const isLoading = ref(false)
const pages = ref<Page[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const searchQuery = ref('')

// Columns
const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'slug', label: 'Slug' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Last Updated', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Fetch pages
async function fetchPages() {
  isLoading.value = true
  try {
    const response = await pageService.getAll({
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
    })
    pages.value = Array.isArray(response.data) ? response.data : []
    totalItems.value = response.meta?.total || pages.value.length
  } catch (error: any) {
    console.error('Failed to fetch pages:', error)
    if (error.response?.status !== 404) {
      toast.error('Failed to load pages')
    }
    pages.value = []
  } finally {
    isLoading.value = false
  }
}

// Debounced search
const debouncedFetch = useDebounce(() => {
  currentPage.value = 1
  fetchPages()
}, 300)

watch(searchQuery, () => debouncedFetch())

// Page change
function onPageChange(page: number) {
  currentPage.value = page
  fetchPages()
}

// Toggle status
async function toggleStatus(page: Page) {
  try {
    await pageService.toggle(page.id)
    toast.success(`Page ${page.is_active ? 'deactivated' : 'activated'}`)
    fetchPages()
  } catch (error) {
    toast.error('Failed to update status')
  }
}

// Delete page
async function deletePage(page: Page) {
  const confirmed = await confirm.require({
    title: 'Delete Page',
    message: `Are you sure you want to delete "${page.title}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await pageService.delete(page.id)
      toast.success('Page deleted successfully')
      fetchPages()
    } catch (error) {
      toast.error('Failed to delete page')
    }
  }
}

// Navigate
function createPage() {
  router.push('/admin/cms/pages/create')
}

function editPage(page: Page) {
  router.push(`/admin/cms/pages/${page.id}/edit`)
}

function viewPage(page: Page) {
  window.open(`/page/${page.slug}`, '_blank')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Static Pages</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage static content pages like About Us, Terms, Privacy Policy
        </p>
      </div>
      <BaseButton @click="createPage">
        <PlusIcon class="mr-2 h-5 w-5" />
        Add Page
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard>
      <div class="flex items-center gap-4">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            name="search"
            placeholder="Search pages..."
            class="pl-10"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="pages"
        :loading="isLoading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="onPageChange"
      >
        <template #cell-title="{ item }">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <DocumentTextIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ item.title }}</p>
              <p v-if="item.meta_title" class="text-xs text-gray-500">{{ item.meta_title }}</p>
            </div>
          </div>
        </template>

        <template #cell-slug="{ item }">
          <code class="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
            /{{ item.slug }}
          </code>
        </template>

        <template #cell-status="{ item }">
          <button @click="toggleStatus(item)">
            <BaseBadge :variant="item.is_active ? 'success' : 'secondary'">
              {{ item.is_active ? 'Active' : 'Draft' }}
            </BaseBadge>
          </button>
        </template>

        <template #cell-updatedAt="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(item.updated_at) }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <button
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="View"
              @click="viewPage(item)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <button
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Edit"
              @click="editPage(item)"
            >
              <PencilSquareIcon class="h-4 w-4" />
            </button>
            <button
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deletePage(item)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <DocumentTextIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pages</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new page.</p>
            <div class="mt-6">
              <BaseButton @click="createPage">
                <PlusIcon class="mr-2 h-5 w-5" />
                Add Page
              </BaseButton>
            </div>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
