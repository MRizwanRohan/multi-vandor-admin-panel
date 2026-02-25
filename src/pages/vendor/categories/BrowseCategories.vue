<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Browse Categories — Vendor: browse marketplace categories         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { categoryService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Category } from '@/types'
import {
  MagnifyingGlassIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  TagIcon,
  PlusIcon,
  EyeIcon,
  CubeIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// State
const categories = ref<Category[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const expandedIds = ref<Set<number>>(new Set())
const selectedCategory = ref<Category | null>(null)

onMounted(() => {
  breadcrumbStore.setPageInfo('Browse Categories', [
    { label: 'Categories' },
    { label: 'Browse' },
  ], 'Explore marketplace categories for your products')
  fetchCategories()
})

// Fetch real data
async function fetchCategories() {
  isLoading.value = true
  try {
    const response = await categoryService.getVisibleCategories()
    categories.value = response.data
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load categories')
    categories.value = []
  } finally {
    isLoading.value = false
  }
}

// Search filter (recursive)
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  function matches(cat: Category): boolean {
    if (cat.name.toLowerCase().includes(q)) return true
    if (cat.description?.toLowerCase().includes(q)) return true
    return (cat.children || []).some(matches)
  }
  return categories.value.filter(matches)
})

// Total count
const totalCount = computed(() => {
  function count(cats: Category[]): number {
    return cats.reduce((sum, c) => sum + 1 + count(c.children || []), 0)
  }
  return count(categories.value)
})

// Toggle expand
function toggleExpand(id: number) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedIds.value = next
}

function expandAll() {
  const ids = new Set<number>()
  function collect(cats: Category[]) {
    for (const c of cats) {
      if (c.children && c.children.length > 0) {
        ids.add(c.id)
        collect(c.children)
      }
    }
  }
  collect(categories.value)
  expandedIds.value = ids
}

function collapseAll() {
  expandedIds.value = new Set()
}

// Select category for detail panel
function selectCategory(cat: Category) {
  selectedCategory.value = selectedCategory.value?.id === cat.id ? null : cat
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ totalCount }} categories available</p>
      </div>
      <BaseButton variant="primary" @click="router.push('/vendor/categories/suggest')">
        <PlusIcon class="mr-1.5 h-4 w-4" />
        Suggest Category
      </BaseButton>
    </div>

    <!-- Search + controls -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            placeholder="Search categories..."
            class="pl-10"
          />
        </div>
        <div class="flex items-center gap-2 text-xs">
          <button
            type="button"
            class="text-primary-600 hover:text-primary-700 dark:text-primary-400"
            @click="expandAll"
          >
            Expand All
          </button>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button
            type="button"
            class="text-primary-600 hover:text-primary-700 dark:text-primary-400"
            @click="collapseAll"
          >
            Collapse All
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <!-- Layout: tree + detail panel -->
    <div v-else-if="filteredCategories.length" class="grid gap-6" :class="selectedCategory ? 'lg:grid-cols-3' : ''">
      <!-- Tree -->
      <div :class="selectedCategory ? 'lg:col-span-2' : ''" class="space-y-2">
        <BaseCard
          v-for="category in filteredCategories"
          :key="category.id"
          padding="none"
          class="overflow-hidden"
        >
          <!-- Parent row -->
          <div
            class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            :class="selectedCategory?.id === category.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="selectCategory(category)"
          >
            <button
              v-if="category.children && category.children.length"
              type="button"
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click.stop="toggleExpand(category.id)"
            >
              <ChevronRightIcon
                class="h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-90': expandedIds.has(category.id) }"
              />
            </button>
            <span v-else class="w-6 shrink-0" />

            <component
              :is="expandedIds.has(category.id) ? FolderOpenIcon : FolderIcon"
              class="h-5 w-5 shrink-0 text-primary-500"
            />

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">{{ category.name }}</span>
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': category.status === 'active',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': category.status === 'pending',
                  }"
                >
                  {{ category.status }}
                </span>
              </div>
              <p v-if="category.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ category.description }}
              </p>
            </div>

            <div class="flex items-center gap-3 text-xs text-gray-400 shrink-0">
              <span class="flex items-center gap-1" v-if="category.product_count">
                <CubeIcon class="h-3.5 w-3.5" />
                {{ category.product_count }}
              </span>
              <span class="flex items-center gap-1" v-if="category.children?.length">
                <FolderIcon class="h-3.5 w-3.5" />
                {{ category.children.length }}
              </span>
            </div>
          </div>

          <!-- Children -->
          <div
            v-if="expandedIds.has(category.id) && category.children?.length"
            class="border-t border-gray-100 dark:border-gray-700"
          >
            <div
              v-for="child in category.children"
              :key="child.id"
              class="flex items-center gap-3 py-2.5 pl-16 pr-4 transition-colors cursor-pointer"
              :class="selectedCategory?.id === child.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
              @click="selectCategory(child)"
            >
              <TagIcon class="h-4 w-4 shrink-0 text-gray-400" />
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ child.name }}</span>
                <p v-if="child.description" class="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {{ child.description }}
                </p>
              </div>
              <div class="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                <span v-if="child.product_count" class="flex items-center gap-1">
                  <CubeIcon class="h-3.5 w-3.5" />
                  {{ child.product_count }}
                </span>
                <span
                  class="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': child.status === 'active',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': child.status === 'pending',
                  }"
                >
                  {{ child.status }}
                </span>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Detail panel (slide in) -->
      <transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-x-4"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-4"
      >
        <BaseCard v-if="selectedCategory" class="lg:sticky lg:top-6 h-fit">
          <div class="space-y-5">
            <!-- Header -->
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
                <FolderIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedCategory.name }}</h3>
                <span
                  class="inline-block rounded-full px-2 py-0.5 text-xs font-medium mt-1"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': selectedCategory.status === 'active',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': selectedCategory.status === 'pending',
                  }"
                >
                  {{ selectedCategory.status_label || selectedCategory.status }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p v-if="selectedCategory.description" class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectedCategory.description }}
            </p>

            <!-- Info grid -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div class="flex items-center gap-1.5 text-xs text-gray-400">
                  <CubeIcon class="h-3.5 w-3.5" />
                  Products
                </div>
                <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{{ selectedCategory.product_count || 0 }}</p>
              </div>
              <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div class="flex items-center gap-1.5 text-xs text-gray-400">
                  <UserGroupIcon class="h-3.5 w-3.5" />
                  Vendors
                </div>
                <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{{ selectedCategory.vendor_count || 0 }}</p>
              </div>
            </div>

            <!-- Children -->
            <div v-if="selectedCategory.children?.length">
              <p class="text-xs font-medium uppercase text-gray-400 mb-2">Sub-categories ({{ selectedCategory.children.length }})</p>
              <div class="space-y-1.5">
                <div
                  v-for="child in selectedCategory.children"
                  :key="child.id"
                  class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                >
                  <TagIcon class="h-3.5 w-3.5 text-gray-400" />
                  <span class="text-sm text-gray-700 dark:text-gray-300 flex-1">{{ child.name }}</span>
                  <span class="text-xs text-gray-400">{{ child.product_count || 0 }} products</span>
                </div>
              </div>
            </div>

            <!-- SEO -->
            <div v-if="selectedCategory.seo_title || selectedCategory.seo_description">
              <p class="text-xs font-medium uppercase text-gray-400 mb-2">SEO</p>
              <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800 space-y-1">
                <p v-if="selectedCategory.seo_title" class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedCategory.seo_title }}</p>
                <p v-if="selectedCategory.seo_description" class="text-xs text-gray-500 dark:text-gray-400">{{ selectedCategory.seo_description }}</p>
              </div>
            </div>

            <!-- Keywords -->
            <div v-if="selectedCategory.keywords?.length">
              <p class="text-xs font-medium uppercase text-gray-400 mb-2">Keywords</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="kw in selectedCategory.keywords"
                  :key="kw"
                  class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                >
                  {{ kw }}
                </span>
              </div>
            </div>
          </div>
        </BaseCard>
      </transition>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else
      title="No categories found"
      :description="searchQuery ? 'No categories match your search. Try different keywords.' : 'No categories available at this time.'"
    />
  </div>
</template>
