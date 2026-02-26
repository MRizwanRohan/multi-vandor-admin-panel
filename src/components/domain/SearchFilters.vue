<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════
// SearchFilters Component — Faceted search UI for products
// ═══════════════════════════════════════════════════════════════════

import { ref, computed, watch } from 'vue'
import { BaseButton, BaseCard } from '@/components/ui'
import { useCurrency } from '@/composables'
import type { SearchFacets, FacetItem, PriceRangeFacet, Category } from '@/types'

interface FilterState {
  categories: number[]
  brands: number[]
  vendors: number[]
  priceMin: number | null
  priceMax: number | null
  attributes: Record<number, string[]>
  inStock: boolean | null
  rating: number | null
}

interface Props {
  facets: SearchFacets | null
  modelValue: FilterState
  loading?: boolean
  collapsible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  collapsible: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterState): void
  (e: 'apply'): void
  (e: 'reset'): void
}>()

const { formatCurrency } = useCurrency()

// Collapsed sections
const collapsedSections = ref<Set<string>>(new Set())

// Local price range state
const localPriceMin = ref<number | null>(null)
const localPriceMax = ref<number | null>(null)

// Initialize local price from model
watch(() => props.modelValue, (val) => {
  localPriceMin.value = val.priceMin
  localPriceMax.value = val.priceMax
}, { immediate: true })

// Active filter count
const activeFilterCount = computed(() => {
  let count = 0
  const val = props.modelValue
  if (val.categories.length > 0) count += val.categories.length
  if (val.brands.length > 0) count += val.brands.length
  if (val.vendors.length > 0) count += val.vendors.length
  if (val.priceMin !== null || val.priceMax !== null) count += 1
  if (val.inStock !== null) count += 1
  if (val.rating !== null) count += 1
  Object.values(val.attributes).forEach(arr => {
    count += arr.length
  })
  return count
})

// Methods
function toggleSection(section: string) {
  if (!props.collapsible) return
  if (collapsedSections.value.has(section)) {
    collapsedSections.value.delete(section)
  } else {
    collapsedSections.value.add(section)
  }
}

function isSectionOpen(section: string): boolean {
  return !collapsedSections.value.has(section)
}

function toggleCategory(categoryId: number) {
  const categories = [...props.modelValue.categories]
  const index = categories.indexOf(categoryId)
  if (index >= 0) {
    categories.splice(index, 1)
  } else {
    categories.push(categoryId)
  }
  updateFilter({ categories })
}

function toggleBrand(brandId: number) {
  const brands = [...props.modelValue.brands]
  const index = brands.indexOf(brandId)
  if (index >= 0) {
    brands.splice(index, 1)
  } else {
    brands.push(brandId)
  }
  updateFilter({ brands })
}

function toggleVendor(vendorId: number) {
  const vendors = [...props.modelValue.vendors]
  const index = vendors.indexOf(vendorId)
  if (index >= 0) {
    vendors.splice(index, 1)
  } else {
    vendors.push(vendorId)
  }
  updateFilter({ vendors })
}

function toggleAttributeValue(attributeId: number, value: string) {
  const attributes = { ...props.modelValue.attributes }
  if (!attributes[attributeId]) {
    attributes[attributeId] = []
  }
  
  const index = attributes[attributeId].indexOf(value)
  if (index >= 0) {
    attributes[attributeId].splice(index, 1)
    if (attributes[attributeId].length === 0) {
      delete attributes[attributeId]
    }
  } else {
    attributes[attributeId].push(value)
  }
  updateFilter({ attributes })
}

function applyPriceRange() {
  updateFilter({
    priceMin: localPriceMin.value,
    priceMax: localPriceMax.value,
  })
}

function setInStock(value: boolean | null) {
  updateFilter({ inStock: value })
}

function setRating(value: number | null) {
  updateFilter({ rating: value })
}

function updateFilter(partial: Partial<FilterState>) {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

function resetFilters() {
  emit('update:modelValue', {
    categories: [],
    brands: [],
    vendors: [],
    priceMin: null,
    priceMax: null,
    attributes: {},
    inStock: null,
    rating: null,
  })
  localPriceMin.value = null
  localPriceMax.value = null
  emit('reset')
}

function isAttributeValueSelected(attributeId: number, value: string): boolean {
  return props.modelValue.attributes[attributeId]?.includes(value) ?? false
}
</script>

<template>
  <div class="search-filters space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-gray-900 dark:text-white">Filters</h3>
      <button
        v-if="activeFilterCount > 0"
        type="button"
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        @click="resetFilters"
      >
        Clear all ({{ activeFilterCount }})
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="animate-pulse">
        <div class="mb-2 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="space-y-2">
          <div class="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>

    <template v-else-if="facets">
      <!-- Categories -->
      <div v-if="facets.categories?.length" class="filter-section">
        <button
          type="button"
          class="flex w-full items-center justify-between py-2 text-left font-medium text-gray-900 dark:text-white"
          @click="toggleSection('categories')"
        >
          Categories
          <svg
            class="h-5 w-5 transition-transform"
            :class="{ 'rotate-180': isSectionOpen('categories') }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="isSectionOpen('categories')" class="space-y-1 pb-4">
          <label
            v-for="category in facets.categories"
            :key="category.id"
            class="flex cursor-pointer items-center gap-2 py-1 text-sm"
          >
            <input
              type="checkbox"
              :checked="modelValue.categories.includes(category.id)"
              @change="toggleCategory(category.id)"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="flex-1 text-gray-700 dark:text-gray-300">{{ category.name }}</span>
            <span class="text-xs text-gray-400">({{ category.count }})</span>
          </label>
        </div>
      </div>

      <!-- Price Range -->
      <div v-if="facets.price_range" class="filter-section">
        <button
          type="button"
          class="flex w-full items-center justify-between py-2 text-left font-medium text-gray-900 dark:text-white"
          @click="toggleSection('price')"
        >
          Price
          <svg
            class="h-5 w-5 transition-transform"
            :class="{ 'rotate-180': isSectionOpen('price') }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="isSectionOpen('price')" class="space-y-3 pb-4">
          <p class="text-xs text-gray-500">
            {{ formatCurrency(facets.price_range.min) }} - {{ formatCurrency(facets.price_range.max) }}
          </p>
          <div class="flex items-center gap-2">
            <input
              v-model.number="localPriceMin"
              type="number"
              :min="facets.price_range.min"
              :max="facets.price_range.max"
              placeholder="Min"
              class="w-full rounded border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <span class="text-gray-400">—</span>
            <input
              v-model.number="localPriceMax"
              type="number"
              :min="facets.price_range.min"
              :max="facets.price_range.max"
              placeholder="Max"
              class="w-full rounded border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <BaseButton size="sm" variant="outline" class="w-full" @click="applyPriceRange">
            Apply Price
          </BaseButton>
        </div>
      </div>

      <!-- Brands -->
      <div v-if="facets.brands?.length" class="filter-section">
        <button
          type="button"
          class="flex w-full items-center justify-between py-2 text-left font-medium text-gray-900 dark:text-white"
          @click="toggleSection('brands')"
        >
          Brands
          <svg
            class="h-5 w-5 transition-transform"
            :class="{ 'rotate-180': isSectionOpen('brands') }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="isSectionOpen('brands')" class="space-y-1 pb-4">
          <label
            v-for="brand in facets.brands"
            :key="brand.id"
            class="flex cursor-pointer items-center gap-2 py-1 text-sm"
          >
            <input
              type="checkbox"
              :checked="modelValue.brands.includes(brand.id)"
              @change="toggleBrand(brand.id)"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="flex-1 text-gray-700 dark:text-gray-300">{{ brand.name }}</span>
            <span class="text-xs text-gray-400">({{ brand.count }})</span>
          </label>
        </div>
      </div>

      <!-- Vendors -->
      <div v-if="facets.vendors?.length" class="filter-section">
        <button
          type="button"
          class="flex w-full items-center justify-between py-2 text-left font-medium text-gray-900 dark:text-white"
          @click="toggleSection('vendors')"
        >
          Sellers
          <svg
            class="h-5 w-5 transition-transform"
            :class="{ 'rotate-180': isSectionOpen('vendors') }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="isSectionOpen('vendors')" class="space-y-1 pb-4">
          <label
            v-for="vendor in facets.vendors"
            :key="vendor.id"
            class="flex cursor-pointer items-center gap-2 py-1 text-sm"
          >
            <input
              type="checkbox"
              :checked="modelValue.vendors.includes(vendor.id)"
              @change="toggleVendor(vendor.id)"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="flex-1 text-gray-700 dark:text-gray-300">{{ vendor.name }}</span>
            <span class="text-xs text-gray-400">({{ vendor.count }})</span>
          </label>
        </div>
      </div>

      <!-- Dynamic Attributes -->
      <div
        v-for="attr in facets.attributes"
        :key="attr.id"
        class="filter-section"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between py-2 text-left font-medium text-gray-900 dark:text-white"
          @click="toggleSection(`attr-${attr.id}`)"
        >
          {{ attr.name }}
          <svg
            class="h-5 w-5 transition-transform"
            :class="{ 'rotate-180': isSectionOpen(`attr-${attr.id}`) }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="isSectionOpen(`attr-${attr.id}`)" class="space-y-1 pb-4">
          <label
            v-for="value in attr.values"
            :key="value.value"
            class="flex cursor-pointer items-center gap-2 py-1 text-sm"
          >
            <input
              type="checkbox"
              :checked="isAttributeValueSelected(attr.id, value.value)"
              @change="toggleAttributeValue(attr.id, value.value)"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="flex-1 text-gray-700 dark:text-gray-300">{{ value.label || value.value }}</span>
            <span class="text-xs text-gray-400">({{ value.count }})</span>
          </label>
        </div>
      </div>

      <!-- Rating -->
      <div v-if="facets.ratings?.length" class="filter-section">
        <button
          type="button"
          class="flex w-full items-center justify-between py-2 text-left font-medium text-gray-900 dark:text-white"
          @click="toggleSection('rating')"
        >
          Rating
          <svg
            class="h-5 w-5 transition-transform"
            :class="{ 'rotate-180': isSectionOpen('rating') }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="isSectionOpen('rating')" class="space-y-1 pb-4">
          <label
            v-for="rating in facets.ratings"
            :key="rating.rating"
            class="flex cursor-pointer items-center gap-2 py-1 text-sm"
          >
            <input
              type="radio"
              :checked="modelValue.rating === rating.rating"
              @change="setRating(rating.rating)"
              name="rating"
              class="border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="flex items-center gap-1 text-gray-700 dark:text-gray-300">
              <span class="text-yellow-400">★</span>
              {{ rating.rating }}+ 
            </span>
            <span class="text-xs text-gray-400">({{ rating.count }})</span>
          </label>
          <button
            v-if="modelValue.rating !== null"
            type="button"
            class="text-xs text-primary-600 hover:text-primary-700"
            @click="setRating(null)"
          >
            Clear rating filter
          </button>
        </div>
      </div>

      <!-- In Stock -->
      <div class="filter-section border-t border-gray-200 pt-4 dark:border-gray-700">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            :checked="modelValue.inStock === true"
            @change="setInStock(modelValue.inStock === true ? null : true)"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span class="text-gray-700 dark:text-gray-300">In Stock Only</span>
        </label>
      </div>
    </template>

    <!-- No Facets -->
    <div v-else class="py-4 text-center text-sm text-gray-500">
      No filters available
    </div>
  </div>
</template>
