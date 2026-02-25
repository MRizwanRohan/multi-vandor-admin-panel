<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Browse Categories — Vendor: browse active marketplace categories  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import {
  MagnifyingGlassIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  TagIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()

const searchQuery = ref('')
const parentFilter = ref('all')
const expandedCategories = ref<number[]>([])

interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  product_count: number
  description: string
  attribute_template: string | null
  children: Category[]
}

const categories = ref<Category[]>([
  {
    id: 1, name: 'Electronics', slug: 'electronics', parent_id: null, product_count: 680,
    description: 'Electronic devices, accessories, and gadgets',
    attribute_template: 'Electronics Template',
    children: [
      { id: 11, name: 'Mobile Phones', slug: 'mobile-phones', parent_id: 1, product_count: 245, description: 'Smartphones and feature phones', attribute_template: 'Mobile Template', children: [] },
      { id: 12, name: 'Laptops', slug: 'laptops', parent_id: 1, product_count: 189, description: 'Notebooks and laptops', attribute_template: 'Laptop Template', children: [] },
      { id: 13, name: 'Accessories', slug: 'accessories', parent_id: 1, product_count: 246, description: 'Cables, chargers, and accessories', attribute_template: null, children: [] },
    ],
  },
  {
    id: 2, name: 'Fashion', slug: 'fashion', parent_id: null, product_count: 820,
    description: 'Clothing, shoes, and fashion accessories',
    attribute_template: 'Fashion Template',
    children: [
      { id: 21, name: "Men's Clothing", slug: 'mens-clothing', parent_id: 2, product_count: 320, description: "Men's shirts, pants, and more", attribute_template: 'Clothing Template', children: [] },
      { id: 22, name: "Women's Clothing", slug: 'womens-clothing', parent_id: 2, product_count: 380, description: "Women's dresses, tops, and more", attribute_template: 'Clothing Template', children: [] },
      { id: 23, name: 'Shoes', slug: 'shoes', parent_id: 2, product_count: 120, description: 'All types of footwear', attribute_template: 'Shoe Template', children: [] },
    ],
  },
  {
    id: 3, name: 'Home & Living', slug: 'home-living', parent_id: null, product_count: 540,
    description: 'Furniture, décor, and home essentials',
    attribute_template: null,
    children: [
      { id: 31, name: 'Furniture', slug: 'furniture', parent_id: 3, product_count: 210, description: 'Tables, chairs, shelves', attribute_template: 'Furniture Template', children: [] },
      { id: 32, name: 'Kitchen', slug: 'kitchen', parent_id: 3, product_count: 185, description: 'Kitchen appliances and tools', attribute_template: null, children: [] },
      { id: 33, name: 'Decor', slug: 'decor', parent_id: 3, product_count: 145, description: 'Home decoration items', attribute_template: null, children: [] },
    ],
  },
  {
    id: 4, name: 'Baby & Kids', slug: 'baby-kids', parent_id: null, product_count: 390,
    description: 'Baby products, toys, and children items',
    attribute_template: null,
    children: [
      { id: 41, name: 'Diapers & Feeding', slug: 'diapers-feeding', parent_id: 4, product_count: 150, description: 'Baby care essentials', attribute_template: null, children: [] },
      { id: 42, name: 'Toys', slug: 'toys', parent_id: 4, product_count: 240, description: 'Toys and games for kids', attribute_template: 'Toy Template', children: [] },
    ],
  },
  {
    id: 5, name: 'Sports & Outdoors', slug: 'sports-outdoors', parent_id: null, product_count: 320,
    description: 'Sports equipment and outdoor gear',
    attribute_template: null,
    children: [],
  },
])

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter((c) => {
    const matchParent = c.name.toLowerCase().includes(q)
    const matchChild = c.children.some((ch) => ch.name.toLowerCase().includes(q))
    return matchParent || matchChild
  })
})

function toggleCategory(id: number) {
  const idx = expandedCategories.value.indexOf(id)
  if (idx === -1) {
    expandedCategories.value.push(id)
  } else {
    expandedCategories.value.splice(idx, 1)
  }
}

function isExpanded(id: number) {
  return expandedCategories.value.includes(id)
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Browse Categories', [
    { label: 'Categories' },
    { label: 'Browse' },
  ], 'Explore marketplace categories for your products')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Browse Categories</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Explore available categories to list your products</p>
      </div>
      <router-link
        to="/vendor/categories/suggest"
        class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        <PlusIcon class="h-4 w-4" />
        Suggest New Category
      </router-link>
    </div>

    <!-- Search -->
    <BaseCard>
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            placeholder="Search categories..."
            class="pl-10"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Category Tree -->
    <div v-if="filteredCategories.length" class="space-y-3">
      <BaseCard v-for="category in filteredCategories" :key="category.id">
        <!-- Parent category -->
        <button
          type="button"
          class="flex w-full items-center gap-3 text-left"
          @click="toggleCategory(category.id)"
        >
          <ChevronRightIcon
            v-if="category.children.length"
            :class="isExpanded(category.id) ? 'rotate-90' : ''"
            class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
          />
          <span v-else class="w-4" />

          <component
            :is="isExpanded(category.id) ? FolderOpenIcon : FolderIcon"
            class="h-5 w-5 shrink-0 text-primary-500"
          />

          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">{{ category.name }}</span>
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {{ category.product_count }} products
              </span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ category.description }}</p>
          </div>

          <div v-if="category.attribute_template" class="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400">
            <DocumentTextIcon class="h-3.5 w-3.5" />
            {{ category.attribute_template }}
          </div>
        </button>

        <!-- Child categories -->
        <div v-if="isExpanded(category.id) && category.children.length" class="ml-8 mt-3 space-y-2 border-l-2 border-gray-100 pl-4 dark:border-gray-700">
          <div
            v-for="child in category.children"
            :key="child.id"
            class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <TagIcon class="h-4 w-4 shrink-0 text-gray-400" />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ child.name }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ child.product_count }} products</span>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500">{{ child.description }}</p>
            </div>
            <div v-if="child.attribute_template" class="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
              <DocumentTextIcon class="h-3 w-3" />
              {{ child.attribute_template }}
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <EmptyState
      v-else
      title="No categories found"
      description="No categories match your search. Try different keywords."
    />
  </div>
</template>
