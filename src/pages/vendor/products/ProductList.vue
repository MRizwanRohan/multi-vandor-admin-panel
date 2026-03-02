<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Product List — Vendor's product management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService } from '@/services'
import { useCurrency, usePagination, useConfirm, useToast, useProduct } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Product, TableColumn } from '@/types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const confirm = useConfirm()
const toast = useToast()
const pagination = usePagination()
const { submitForReview, duplicateProduct, importProducts } = useProduct()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('My Products', [
    { label: 'Products' },
  ], 'Manage your product listings')
  fetchProducts()
})

// Data
const products = ref<Product[]>([])
const isLoading = ref(true)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

// Status tabs for quick filtering
const statusTabs = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'type', label: 'Type', sortable: true, align: 'center' },
  { key: 'price', label: 'Price', sortable: true, align: 'right' },
  { key: 'stock', label: 'Stock', sortable: true, align: 'center' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch products
async function fetchProducts() {
  isLoading.value = true
  try {
    const response = await productService.vendorList({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value,
      status: statusFilter.value || undefined,
    })
    products.value = response.data
    pagination.totalItems.value = response.meta.total
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to load products'
    toast.error(message)
    console.error('Product API Error:', err)
    products.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch([searchQuery, statusFilter], () => {
  pagination.currentPage.value = 1
  fetchProducts()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchProducts()
})

// Actions
function viewProduct(product: Product) {
  router.push(`/vendor/products/${product.slug}`)
}

function editProduct(product: Product) {
  router.push(`/vendor/products/${product.slug}/edit`)
}

async function handleSubmitForReview(product: Product) {
  const confirmed = await confirm.show({
    title: 'Submit for Review',
    message: `Submit "${product.name}" for admin review? You won't be able to edit it until it's reviewed.`,
    confirmText: 'Submit',
    cancelText: 'Cancel',
    variant: 'info',
  })
  if (confirmed) {
    try {
      await submitForReview(product.slug)
      fetchProducts()
    } catch { /* error handled in composable */ }
  }
}

async function handleDuplicate(product: Product) {
  try {
    const duplicated = await duplicateProduct(product.slug)
    router.push(`/vendor/products/${duplicated.slug}/edit`)
  } catch { /* error handled in composable */ }
}

async function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      try {
        await importProducts(file)
        fetchProducts()
      } catch { /* error handled in composable */ }
    }
  }
  input.click()
}

async function deleteProduct(product: Product) {
  const confirmed = await confirm.show({
    title: 'Delete Product',
    message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      await productService.vendorDelete(product.id)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'secondary' | 'info' | 'danger' {
  const variants: Record<string, 'success' | 'warning' | 'secondary' | 'info' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    draft: 'secondary',
    rejected: 'danger',
  }
  return variants[status] || 'secondary'
}

// Stock status — uses total_stock (sum of variant stock for variable products)
function getStockStatus(product: Product): { text: string; class: string } {
  const stock = (product as any).total_stock ?? product.stock_quantity ?? 0
  const hasVariants = (product as any).has_variants || ((product as any).variant_count ?? 0) > 0

  if (stock === 0) {
    return { text: 'Out of Stock', class: 'text-danger-600 dark:text-danger-400' }
  }
  if (stock <= 10) {
    const label = hasVariants ? `Low: ${stock} (variants)` : `Low: ${stock}`
    return { text: label, class: 'text-warning-600 dark:text-warning-400' }
  }
  const label = hasVariants ? `${stock} (variants)` : stock.toString()
  return { text: label, class: 'text-gray-900 dark:text-white' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products..."
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <FormSelect
          v-model="statusFilter"
          name="status"
          :options="statusOptions"
          class="w-40"
        />
      </div>

      <div class="flex items-center gap-2">
        <BaseButton variant="secondary" @click="handleImport">
          <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
          Import
        </BaseButton>
        <BaseButton variant="primary" to="/vendor/products/create">
          <PlusIcon class="mr-2 h-4 w-4" />
          Add Product
        </BaseButton>
      </div>
    </div>

    <!-- Status tabs -->
    <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        type="button"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
          statusFilter === tab.value
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
        ]"
        @click="statusFilter = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Products table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="products"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event"
        @update:perPage="pagination.perPage.value = $event"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
              <img
                v-if="row.thumbnail"
                :src="row.thumbnail"
                :alt="row.name"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">SKU: {{ row.sku }}</p>
            </div>
          </div>
        </template>

        <template #cell-type="{ row }">
          <BaseBadge :variant="row.type === 'variable' ? 'info' : 'secondary'" size="sm" class="capitalize">
            {{ row.type || 'simple' }}
          </BaseBadge>
        </template>

        <template #cell-price="{ row }">
          <div class="text-right">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ currency.format(row.effective_price) }}
            </p>
            <p v-if="row.sale_price" class="text-sm text-gray-500 line-through">
              {{ currency.format(row.price) }}
            </p>
          </div>
        </template>

        <template #cell-stock="{ row }">
          <span :class="getStockStatus(row).class" class="font-medium">
            {{ getStockStatus(row).text }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <div>
            <BaseBadge :variant="getStatusVariant(row.status)" class="capitalize">
              {{ row.status }}
            </BaseBadge>
            <p v-if="row.status === 'rejected' && row.rejection_reason" class="mt-1 text-xs text-danger-600 dark:text-danger-400 max-w-50 truncate" :title="row.rejection_reason">
              {{ row.rejection_reason }}
            </p>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View"
              @click="viewProduct(row)"
            >
              <EyeIcon class="h-5 w-5" />
            </button>
            <button
              v-if="['draft', 'rejected', 'approved'].includes(row.status)"
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Edit"
              @click="editProduct(row)"
            >
              <PencilIcon class="h-5 w-5" />
            </button>
            <button
              v-if="['draft', 'rejected'].includes(row.status)"
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700 dark:hover:text-primary-400"
              title="Submit for Review"
              @click="handleSubmitForReview(row)"
            >
              <PaperAirplaneIcon class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Duplicate"
              @click="handleDuplicate(row)"
            >
              <DocumentDuplicateIcon class="h-5 w-5" />
            </button>
            <button
              v-if="['draft', 'rejected'].includes(row.status)"
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-danger-600 dark:hover:bg-gray-700 dark:hover:text-danger-400"
              title="Delete"
              @click="deleteProduct(row)"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </template>

        <template #empty>
          <EmptyState
            title="No products yet"
            description="Start selling by adding your first product."
            action-text="Add Product"
            action-to="/vendor/products/create"
          />
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
