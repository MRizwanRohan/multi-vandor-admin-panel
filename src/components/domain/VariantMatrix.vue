<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Variant Matrix — Daraz-style product variant combination editor -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VariantMatrixAttribute, ProductVariant, VariantOption } from '@/types'
import { FormInput, FormSwitch } from '@/components/form'
import { BaseButton } from '@/components/ui'
import { useConfirm } from '@/composables'
import { 
  PhotoIcon, 
  TrashIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  CubeIcon,
  TagIcon
} from '@heroicons/vue/24/outline'

interface Props {
  attributes: VariantMatrixAttribute[]
  variants: ProductVariant[]
  currency?: string
  basePrice?: number
  baseSku?: string
}

const props = withDefaults(defineProps<Props>(), {
  currency: '৳',
  basePrice: 0,
  baseSku: ''
})

const emit = defineEmits<{
  (e: 'update:variants', variants: ProductVariant[]): void
  (e: 'generate'): void
  (e: 'uploadImage', variantIndex: number): void
}>()

const confirm = useConfirm()

// Local state
const expandedRows = ref<Set<number>>(new Set())
const bulkEditMode = ref(false)
const bulkPrice = ref<number | null>(null)
const bulkStock = ref<number | null>(null)
const showQuickActions = ref(false)

// Computed: All possible combinations
const attributeCombinations = computed(() => {
  if (props.attributes.length === 0) return []
  
  const generateCombinations = (
    attrs: VariantMatrixAttribute[],
    index: number,
    current: VariantOption[]
  ): VariantOption[][] => {
    if (index >= attrs.length) return [current]
    
    const result: VariantOption[][] = []
    const attr = attrs[index]
    
    for (const option of attr.options) {
      result.push(...generateCombinations(attrs, index + 1, [
        ...current,
        {
          template: attr.name,
          template_id: attr.id,
          value: option.label,
          option_id: option.id
        }
      ]))
    }
    
    return result
  }
  
  return generateCombinations(props.attributes, 0, [])
})

// Get variant name from options
const getVariantName = (options: VariantOption[]): string => {
  return options.map(o => o.value).join(' / ')
}

// Get SKU suggestion
const generateSku = (options: VariantOption[], baseSku: string = ''): string => {
  const suffix = options.map(o => o.value.substring(0, 2).toUpperCase()).join('-')
  return baseSku ? `${baseSku}-${suffix}` : suffix
}

// Toggle row expansion
const toggleRow = (index: number) => {
  if (expandedRows.value.has(index)) {
    expandedRows.value.delete(index)
  } else {
    expandedRows.value.add(index)
  }
}

// Update variant field
const updateVariant = (index: number, field: keyof ProductVariant, value: unknown) => {
  const updated = [...props.variants]
  updated[index] = { ...updated[index], [field]: value }
  emit('update:variants', updated)
}

// Delete variant with confirmation
const deleteVariant = async (index: number) => {
  const variant = props.variants[index]
  const confirmed = await confirm.confirm({
    title: 'Delete Variant?',
    message: `Are you sure you want to delete "${variant.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  
  if (confirmed) {
    const updated = props.variants.filter((_, i) => i !== index)
    emit('update:variants', updated)
  }
}

// ══════════════════════════════════════════════════════════════════════
// Quick Actions
// ══════════════════════════════════════════════════════════════════════

// Copy base price to all variants
const copyBasePriceToAll = () => {
  if (!props.basePrice) return
  const updated = props.variants.map(v => ({ ...v, price: props.basePrice || 0 }))
  emit('update:variants', updated)
  showQuickActions.value = false
}

// Set same stock for all variants
const setStockForAll = (stock: number) => {
  const updated = props.variants.map(v => ({ ...v, stock_quantity: stock }))
  emit('update:variants', updated)
  showQuickActions.value = false
}

// Generate SKU pattern for all variants
const generateSkuPattern = () => {
  const baseSku = props.baseSku || 'SKU'
  const updated = props.variants.map(v => ({
    ...v,
    sku: `${baseSku}-${v.options.map(o => o.value.substring(0, 2).toUpperCase()).join('-')}`
  }))
  emit('update:variants', updated)
  showQuickActions.value = false
}

// Apply bulk edit
const applyBulkEdit = () => {
  const updated = props.variants.map(v => ({
    ...v,
    ...(bulkPrice.value !== null && { price: bulkPrice.value }),
    ...(bulkStock.value !== null && { stock_quantity: bulkStock.value })
  }))
  emit('update:variants', updated)
  bulkEditMode.value = false
  bulkPrice.value = null
  bulkStock.value = null
}

// Toggle all active
const toggleAllActive = (active: boolean) => {
  const updated = props.variants.map(v => ({ ...v, is_active: active }))
  emit('update:variants', updated)
}

// Stats
const stats = computed(() => ({
  total: props.variants.length,
  active: props.variants.filter(v => v.is_active).length,
  inStock: props.variants.filter(v => v.stock_quantity > 0).length,
  totalStock: props.variants.reduce((sum, v) => sum + v.stock_quantity, 0)
}))

// Price Range
const priceRange = computed(() => {
  if (props.variants.length === 0) return null
  
  const prices = props.variants
    .filter(v => v.is_active)
    .map(v => {
      // Calculate effective price for each variant
      const basePrice = v.price || props.basePrice || 0
      const salePrice = v.sale_price
      // If sale is active and sale_price is less than price
      if (salePrice && salePrice < basePrice) {
        return salePrice
      }
      return basePrice
    })
  
  if (prices.length === 0) return null
  
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  
  return {
    min,
    max,
    isSame: Math.abs(min - max) < 0.01,
    display: min === max 
      ? `${props.currency}${min.toLocaleString('en-BD')}`
      : `${props.currency}${min.toLocaleString('en-BD')} – ${props.currency}${max.toLocaleString('en-BD')}`
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header with stats -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-4 text-sm">
        <span class="text-gray-600 dark:text-gray-400">
          মোট: <span class="font-semibold text-gray-900 dark:text-white">{{ stats.total }}</span>
        </span>
        <span class="text-gray-600 dark:text-gray-400">
          সক্রিয়: <span class="font-semibold text-success-600">{{ stats.active }}</span>
        </span>
        <span class="text-gray-600 dark:text-gray-400">
          স্টকে: <span class="font-semibold text-primary-600">{{ stats.inStock }}</span>
        </span>
        <span class="text-gray-600 dark:text-gray-400">
          মোট স্টক: <span class="font-semibold text-gray-900 dark:text-white">{{ stats.totalStock }}</span>
        </span>
        
        <!-- Price Range Badge -->
        <span v-if="priceRange" class="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
          💰 {{ priceRange.display }}
        </span>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Quick Actions Dropdown -->
        <div class="relative">
          <BaseButton
            variant="outline"
            size="sm"
            @click="showQuickActions = !showQuickActions"
          >
            ⚡ Quick Actions
          </BaseButton>
          
          <div
            v-if="showQuickActions"
            class="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              :disabled="!basePrice"
              @click="copyBasePriceToAll"
            >
              <ClipboardIcon class="h-4 w-4" />
              Copy base price to all
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="setStockForAll(10)"
            >
              <CubeIcon class="h-4 w-4" />
              Set stock 10 for all
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="generateSkuPattern"
            >
              <TagIcon class="h-4 w-4" />
              Auto-generate SKUs
            </button>
            <hr class="my-1 border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="toggleAllActive(false)"
            >
              সব নিষ্ক্রিয়
            </button>
          </div>
        </div>
        
        <BaseButton
          v-if="!bulkEditMode"
          variant="outline"
          size="sm"
          @click="bulkEditMode = true"
        >
          Bulk Edit
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          @click="toggleAllActive(true)"
        >
          সব সক্রিয়
        </BaseButton>
        <BaseButton
          variant="primary"
          size="sm"
          @click="emit('generate')"
        >
          <PlusIcon class="mr-1 h-4 w-4" />
          Generate All
        </BaseButton>
      </div>
    </div>

    <!-- Bulk Edit Panel -->
    <div
      v-if="bulkEditMode"
      class="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20"
    >
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-40">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            সব দাম
          </label>
          <input
            v-model.number="bulkPrice"
            type="number"
            min="0"
            step="0.01"
            class="input w-full"
            placeholder="দাম"
          />
        </div>
        <div class="w-40">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            সব স্টক
          </label>
          <input
            v-model.number="bulkStock"
            type="number"
            min="0"
            class="input w-full"
            placeholder="স্টক"
          />
        </div>
        <BaseButton variant="primary" size="sm" @click="applyBulkEdit">
          প্রয়োগ করুন
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="bulkEditMode = false">
          বাতিল
        </BaseButton>
      </div>
    </div>

    <!-- Variants Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="w-10 px-3 py-3"></th>
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              ছবি
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Variant
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              SKU
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              দাম ({{ currency }})
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              সেল দাম
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              স্টক
            </th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              সক্রিয়
            </th>
            <th class="w-10 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          <template v-for="(variant, index) in variants" :key="variant.id || index">
            <!-- Main Row -->
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <!-- Expand -->
              <td class="px-3 py-3">
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  @click="toggleRow(index)"
                >
                  <ChevronDownIcon
                    v-if="!expandedRows.has(index)"
                    class="h-4 w-4"
                  />
                  <ChevronUpIcon v-else class="h-4 w-4" />
                </button>
              </td>

              <!-- Image -->
              <td class="px-3 py-3">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 hover:border-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  @click="emit('uploadImage', index)"
                >
                  <img
                    v-if="variant.image_url"
                    :src="variant.image_url"
                    :alt="variant.name"
                    class="h-full w-full object-cover"
                  />
                  <PhotoIcon v-else class="h-5 w-5 text-gray-400" />
                </button>
              </td>

              <!-- Variant Name -->
              <td class="px-3 py-3">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ variant.name }}
                </span>
                <div class="mt-0.5 flex flex-wrap gap-1">
                  <span
                    v-for="option in variant.options"
                    :key="option.option_id"
                    class="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {{ option.template }}: {{ option.value }}
                  </span>
                </div>
              </td>

              <!-- SKU -->
              <td class="px-3 py-3">
                <input
                  :value="variant.sku"
                  type="text"
                  class="input w-28 text-sm"
                  @input="updateVariant(index, 'sku', ($event.target as HTMLInputElement).value)"
                />
              </td>

              <!-- Price -->
              <td class="px-3 py-3">
                <input
                  :value="variant.price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input w-24 text-sm"
                  @input="updateVariant(index, 'price', parseFloat(($event.target as HTMLInputElement).value) || 0)"
                />
              </td>

              <!-- Sale Price -->
              <td class="px-3 py-3">
                <input
                  :value="variant.sale_price || ''"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input w-24 text-sm"
                  placeholder="—"
                  @input="updateVariant(index, 'sale_price', parseFloat(($event.target as HTMLInputElement).value) || null)"
                />
              </td>

              <!-- Stock -->
              <td class="px-3 py-3">
                <input
                  :value="variant.stock_quantity"
                  type="number"
                  min="0"
                  class="input w-20 text-sm"
                  @input="updateVariant(index, 'stock_quantity', parseInt(($event.target as HTMLInputElement).value) || 0)"
                />
              </td>

              <!-- Active -->
              <td class="px-3 py-3 text-center">
                <FormSwitch
                  :model-value="variant.is_active"
                  name=""
                  @update:model-value="updateVariant(index, 'is_active', $event)"
                />
              </td>

              <!-- Delete -->
              <td class="px-3 py-3">
                <button
                  type="button"
                  class="text-gray-400 hover:text-danger-500"
                  @click="deleteVariant(index)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </td>
            </tr>

            <!-- Expanded Details -->
            <tr v-if="expandedRows.has(index)" class="bg-gray-50 dark:bg-gray-800/50">
              <td colspan="9" class="px-6 py-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                      ওজন (গ্রাম)
                    </label>
                    <input
                      :value="variant.weight || ''"
                      type="number"
                      min="0"
                      class="input w-full"
                      placeholder="ওজন"
                      @input="updateVariant(index, 'weight', parseFloat(($event.target as HTMLInputElement).value) || null)"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                      বারকোড
                    </label>
                    <input
                      :value="variant.barcode || ''"
                      type="text"
                      class="input w-full"
                      placeholder="বারকোড"
                      @input="updateVariant(index, 'barcode', ($event.target as HTMLInputElement).value || null)"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                      স্টক স্ট্যাটাস
                    </label>
                    <span
                      :class="[
                        'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                        variant.is_in_stock
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
                          : 'bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300'
                      ]"
                    >
                      {{ variant.is_in_stock ? 'স্টকে আছে' : 'স্টকে নেই' }}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-if="variants.length === 0">
            <td colspan="9" class="px-6 py-12 text-center">
              <div class="text-gray-500 dark:text-gray-400">
                <p class="text-lg font-medium">কোনো ভেরিয়েন্ট নেই</p>
                <p class="mt-1 text-sm">
                  প্রথমে অ্যাট্রিবিউট নির্বাচন করুন এবং "Generate All" ক্লিক করুন
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
