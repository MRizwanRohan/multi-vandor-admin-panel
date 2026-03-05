<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Blog List — Manage blog posts and categories -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { blogService } from '@/services'
import type { BlogPost, BlogCategory } from '@/types'
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
  EyeIcon,
  NewspaperIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate, formatDateTime } = useDate()
const confirm = useConfirm()

onMounted(() => {
  breadcrumbStore.setPageInfo('Blog', [
    { label: 'CMS' },
    { label: 'Blog' },
  ], 'Manage blog posts and categories')
  fetchCategories()
  fetchPosts()
})

// State
const isLoading = ref(false)
const posts = ref<BlogPost[]>([])
const categories = ref<BlogCategory[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const searchQuery = ref('')
const selectedCategory = ref<number | ''>('')
const selectedStatus = ref('')
const activeTab = ref<'posts' | 'categories'>('posts')

// Category options
const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...categories.value.map(c => ({ value: c.id, label: c.name }))
])

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'archived', label: 'Archived' },
]

// Status badge variants
const statusVariants: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
  published: 'success',
  draft: 'secondary',
  scheduled: 'info',
  archived: 'warning',
}

// Post Columns
const postColumns = [
  { key: 'title', label: 'Post', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'author', label: 'Author' },
  { key: 'status', label: 'Status' },
  { key: 'publishedAt', label: 'Published', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Category Columns
const categoryColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug' },
  { key: 'postCount', label: 'Posts' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Fetch categories
async function fetchCategories() {
  try {
    const response = await blogService.getCategories()
    categories.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

// Fetch posts
async function fetchPosts() {
  isLoading.value = true
  try {
    const response = await blogService.getAll({
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      category_id: selectedCategory.value || undefined,
      status: selectedStatus.value || undefined,
    })
    posts.value = Array.isArray(response.data) ? response.data : []
    totalItems.value = response.meta?.total || posts.value.length
  } catch (error: any) {
    console.error('Failed to fetch posts:', error)
    if (error.response?.status !== 404) {
      toast.error('Failed to load posts')
    }
    posts.value = []
  } finally {
    isLoading.value = false
  }
}

// Debounced search
const debouncedFetch = useDebounce(() => {
  currentPage.value = 1
  fetchPosts()
}, 300)

watch(searchQuery, () => debouncedFetch())
watch([selectedCategory, selectedStatus], () => {
  currentPage.value = 1
  fetchPosts()
})

// Page change
function onPageChange(page: number) {
  currentPage.value = page
  fetchPosts()
}

// Publish/Unpublish post
async function togglePublish(post: BlogPost) {
  try {
    if (post.status === 'published') {
      await blogService.unpublish(post.id)
      toast.success('Post unpublished')
    } else {
      await blogService.publish(post.id)
      toast.success('Post published')
    }
    fetchPosts()
  } catch (error) {
    toast.error('Failed to update post status')
  }
}

// Toggle category status
async function toggleCategoryStatus(category: BlogCategory) {
  try {
    await blogService.toggleCategory(category.id)
    toast.success(`Category ${category.is_active ? 'deactivated' : 'activated'}`)
    fetchCategories()
  } catch (error) {
    toast.error('Failed to update status')
  }
}

// Delete post
async function deletePost(post: BlogPost) {
  const confirmed = await confirm.require({
    title: 'Delete Post',
    message: `Are you sure you want to delete "${post.title}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await blogService.delete(post.id)
      toast.success('Post deleted successfully')
      fetchPosts()
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }
}

// Delete category
async function deleteCategory(category: BlogCategory) {
  const confirmed = await confirm.require({
    title: 'Delete Category',
    message: `Are you sure you want to delete "${category.name}"? Posts in this category will be unassigned.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await blogService.deleteCategory(category.id)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }
}

// Navigate
function createPost() {
  router.push('/admin/cms/blog/create')
}

function editPost(post: BlogPost) {
  router.push(`/admin/cms/blog/${post.id}/edit`)
}

function viewPost(post: BlogPost) {
  window.open(`/blog/${post.slug}`, '_blank')
}

function createCategory() {
  router.push('/admin/cms/blog/categories/create')
}

function editCategory(category: BlogCategory) {
  router.push(`/admin/cms/blog/categories/${category.id}/edit`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Blog</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage blog posts and categories
        </p>
      </div>
      <div class="flex gap-3">
        <BaseButton v-if="activeTab === 'categories'" variant="outline" @click="createCategory">
          <FolderIcon class="mr-2 h-5 w-5" />
          Add Category
        </BaseButton>
        <BaseButton v-if="activeTab === 'posts'" @click="createPost">
          <PlusIcon class="mr-2 h-5 w-5" />
          New Post
        </BaseButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <button
          :class="[
            'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
            activeTab === 'posts'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          ]"
          @click="activeTab = 'posts'"
        >
          <NewspaperIcon class="h-5 w-5" />
          Posts
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

    <!-- Posts Tab -->
    <template v-if="activeTab === 'posts'">
      <!-- Filters -->
      <BaseCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <FormInput
              v-model="searchQuery"
              name="search"
              placeholder="Search posts..."
              class="pl-10"
            />
          </div>
          <FormSelect
            v-model="selectedCategory"
            name="category"
            :options="categoryOptions"
            class="w-full sm:w-48"
          />
          <FormSelect
            v-model="selectedStatus"
            name="status"
            :options="statusOptions"
            class="w-full sm:w-36"
          />
        </div>
      </BaseCard>

      <!-- Posts Table -->
      <BaseCard>
        <DataTable
          :columns="postColumns"
          :data="posts"
          :loading="isLoading"
          :total="totalItems"
          :current-page="currentPage"
          :per-page="perPage"
          @page-change="onPageChange"
        >
          <template #cell-title="{ item }">
            <div class="flex items-center gap-3">
              <div 
                v-if="item.featured_image"
                class="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
              >
                <img 
                  :src="item.featured_image" 
                  :alt="item.title"
                  class="h-full w-full object-cover"
                />
              </div>
              <div 
                v-else 
                class="flex h-12 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
              >
                <NewspaperIcon class="h-6 w-6 text-gray-400" />
              </div>
              <div class="min-w-0">
                <p class="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {{ item.title }}
                </p>
                <p v-if="item.excerpt" class="text-xs text-gray-500 line-clamp-1">
                  {{ item.excerpt }}
                </p>
              </div>
            </div>
          </template>

          <template #cell-category="{ item }">
            <BaseBadge v-if="item.category" variant="info">
              {{ item.category.name }}
            </BaseBadge>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #cell-author="{ item }">
            <span class="text-gray-600 dark:text-gray-400">
              {{ item.author?.name || '—' }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <button @click="togglePublish(item)">
              <BaseBadge :variant="statusVariants[item.status] || 'secondary'">
                {{ item.status }}
              </BaseBadge>
            </button>
          </template>

          <template #cell-publishedAt="{ item }">
            <span class="text-gray-600 dark:text-gray-400">
              {{ item.published_at ? formatDate(item.published_at) : '—' }}
            </span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-2">
              <button
                v-if="item.status === 'published'"
                class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="View"
                @click="viewPost(item)"
              >
                <EyeIcon class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Edit"
                @click="editPost(item)"
              >
                <PencilSquareIcon class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete"
                @click="deletePost(item)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </template>

          <template #empty>
            <div class="py-12 text-center">
              <NewspaperIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No posts</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating your first blog post.</p>
              <div class="mt-6">
                <BaseButton @click="createPost">
                  <PlusIcon class="mr-2 h-5 w-5" />
                  New Post
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
              <div 
                v-if="item.image"
                class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
              >
                <img 
                  :src="item.image" 
                  :alt="item.name"
                  class="h-full w-full object-cover"
                />
              </div>
              <div 
                v-else 
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30"
              >
                <FolderIcon class="h-5 w-5 text-purple-600 dark:text-purple-400" />
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

          <template #cell-postCount="{ item }">
            <span class="font-medium">{{ item.posts_count || 0 }}</span>
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
              <p class="mt-1 text-sm text-gray-500">Create categories to organize blog posts.</p>
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
