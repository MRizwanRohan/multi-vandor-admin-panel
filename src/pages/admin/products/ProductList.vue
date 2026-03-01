<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Product List — Product management list page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { productService } from '@/services'
import { useCurrency, usePagination, useConfirm, useToast, useProduct, useDebounce } from '@/composables'
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
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const currency = useCurrency()
const confirm = useConfirm()
const toast = useToast()
const pagination = usePagination()
const {
  approveProduct,
  rejectProduct,
  toggleFeatured,
  adminDeleteProduct,
  adminBulkApprove,
  adminBulkReject,
  adminBulkSetFeatured,
} = useProduct()

// Rejection modal state
const showRejectModal = ref(false)
const rejectingProduct = ref<Product | null>(null)
const rejectionReason = ref('')
const bulkRejectionReason = ref('')
const showBulkRejectModal = ref(false)

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Products', [
    { label: 'Products' },
  ], 'Manage all products in your marketplace')
  fetchProducts()
})

// Data
const products = ref<Product[]>([])
const isLoading = ref(true)
const selectedProducts = ref<Product[]>([])

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const featuredFilter = ref('')
const featuredOptions = [
  { value: '', label: 'All Products' },
  { value: '1', label: 'Featured Only' },
  { value: '0', label: 'Not Featured' },
]

// Status tabs
const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'draft', label: 'Draft' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'price', label: 'Price', sortable: true, align: 'right' },
  { key: 'stock', label: 'Stock', sortable: true, align: 'center' },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
  { key: 'vendor', label: 'Vendor', sortable: true },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch products
async function fetchProducts() {
  isLoading.value = true
  try {
    const response = await productService.adminList({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value,
      status: statusFilter.value || undefined,
      category_id: categoryFilter.value ? Number(categoryFilter.value) : undefined,
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
const debouncedFetch = useDebounce(() => {
  pagination.currentPage.value = 1
  fetchProducts()
}, 300)

watch([searchQuery, statusFilter, categoryFilter], () => {
  debouncedFetch()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchProducts()
})

// Actions
function viewProduct(product: Product) {
  router.push(`/admin/products/${product.slug}`)
}

function editProduct(product: Product) {
  router.push(`/admin/products/${product.slug}/edit`)
}

async function handleApprove(product: Product) {
  try {
    await approveProduct(product.slug)
    fetchProducts()
  } catch { /* handled in composable */ }
}

function openRejectModal(product: Product) {
  rejectingProduct.value = product
  rejectionReason.value = ''
  showRejectModal.value = true
}

async function handleReject() {
  if (!rejectingProduct.value || !rejectionReason.value.trim()) {
    toast.error('Please provide a rejection reason')
    return
  }
  try {
    await rejectProduct(rejectingProduct.value.slug, rejectionReason.value)
    showRejectModal.value = false
    fetchProducts()
  } catch { /* handled in composable */ }
}

async function handleToggleFeatured(product: Product) {
  try {
    await toggleFeatured(product.slug)
    fetchProducts()
  } catch { /* handled in composable */ }
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
      await productService.adminDelete(product.id)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }
}

async function bulkDelete() {
  if (selectedProducts.value.length === 0) return

  const confirmed = await confirm.show({
    title: 'Delete Products',
    message: `Are you sure you want to delete ${selectedProducts.value.length} products? This action cannot be undone.`,
    confirmText: 'Delete All',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  if (confirmed) {
    try {
      const ids = selectedProducts.value.map(p => p.id)
      await productService.bulkDelete(ids)
      toast.success('Products deleted successfully')
      selectedProducts.value = []
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete products')
    }
  }
}

async function handleBulkApprove() {
  if (selectedProducts.value.length === 0) return
  try {
    const ids = selectedProducts.value.map(p => p.id)
    await adminBulkApprove(ids)
    selectedProducts.value = []
    fetchProducts()
  } catch { /* handled in composable */ }
}

function openBulkRejectModal() {
  bulkRejectionReason.value = ''
  showBulkRejectModal.value = true
}

async function handleBulkReject() {
  if (!bulkRejectionReason.value.trim()) {
    toast.error('Please provide a rejection reason')
    return
  }
  try {
    const ids = selectedProducts.value.map(p => p.id)
    await adminBulkReject(ids, bulkRejectionReason.value)
    showBulkRejectModal.value = false
    selectedProducts.value = []
    fetchProducts()
  } catch { /* handled in composable */ }
}

async function handleBulkFeatured(featured: boolean) {
  if (selectedProducts.value.length === 0) return
  try {
    const ids = selectedProducts.value.map(p => p.id)
    await adminBulkSetFeatured(ids, featured)
    selectedProducts.value = []
    fetchProducts()
  } catch { /* handled in composable */ }
}

async function handleExport() {
  try {
    const blob = await productService.export({
      status: statusFilter.value || undefined,
    } as any)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    toast.success('Products exported successfully')
  } catch {
    toast.error('Failed to export products')
  }
}

async function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      try {
        const result = await productService.import(file)
        toast.success(`Import complete: ${result.success} succeeded, ${result.failed} failed`)
        fetchProducts()
      } catch {
        toast.error('Failed to import products')
      }
    }
  }
  input.click()
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'secondary' | 'danger' {
  const variants: Record<string, 'success' | 'warning' | 'secondary' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    draft: 'secondary',
    rejected: 'danger',
    archived: 'secondary',
  }
  return variants[status] || 'secondary'
}

// Stock status
function getStockStatus(product: Product): { text: string; class: string } {
  if (product.stock_quantity === 0) {
    return { text: 'Out of Stock', class: 'text-danger-600 dark:text-danger-400' }
  }
  if (product.stock_quantity <= 10) {
    return { text: `Low: ${product.stock_quantity}`, class: 'text-warning-600 dark:text-warning-400' }
  }
  return { text: product.stock_quantity.toString(), class: 'text-gray-900 dark:text-white' }
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
        <BaseButton variant="secondary" size="sm" @click="handleImport">
          <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
          Import
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="handleExport">
          <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
          Export
        </BaseButton>
        <BaseButton variant="primary" to="/admin/products/create">
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

    <!-- Bulk actions -->
    <div
      v-if="selectedProducts.length > 0"
      class="flex items-center gap-4 rounded-lg bg-primary-50 px-4 py-3 dark:bg-primary-900/20"
    >
      <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
        {{ selectedProducts.length }} selected
      </span>
      <BaseButton variant="success" size="sm" @click="handleBulkApprove">
        <CheckIcon class="mr-2 h-4 w-4" />
        Approve
      </BaseButton>
      <BaseButton variant="warning" size="sm" @click="openBulkRejectModal">
        <XMarkIcon class="mr-2 h-4 w-4" />
        Reject
      </BaseButton>
      <BaseButton variant="secondary" size="sm" @click="handleBulkFeatured(true)">
        <StarIcon class="mr-2 h-4 w-4" />
        Feature
      </BaseButton>
      <BaseButton variant="danger" size="sm" @click="bulkDelete">
        <TrashIcon class="mr-2 h-4 w-4" />
        Delete
      </BaseButton>
    </div>

    <!-- Products table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="products"
        :loading="isLoading"
        :selectable="true"
        v-model:selected="selectedProducts"
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
                v-if="row.primary_image"
                :src="row.primary_image"
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

        <template #cell-price="{ row }">
          <div class="text-right">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ currency.formatCurrency(row.effective_price) }}
            </p>
            <p v-if="row.sale_price && row.sale_price < row.price" class="text-sm text-gray-500 line-through">
              {{ currency.formatCurrency(row.price) }}
            </p>
          </div>
        </template>

        <template #cell-stock="{ row }">
          <span :class="getStockStatus(row).class" class="font-medium">
            {{ getStockStatus(row).text }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStatusVariant(row.status)" class="capitalize">
            {{ row.status }}
          </BaseBadge>
        </template>

        <template #cell-vendor="{ row }">
          <span class="text-gray-900 dark:text-white">
            {{ row.vendor?.store_name || 'N/A' }}
          </span>
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
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Edit"
              @click="editProduct(row)"
            >
              <PencilIcon class="h-5 w-5" />
            </button>
            <!-- Approve/Reject for pending -->
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
              title="Approve"
              @click="handleApprove(row)"
            >
              <CheckIcon class="h-5 w-5" />
            </button>
            <button
              v-if="row.status === 'pending'"
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              title="Reject"
              @click="openRejectModal(row)"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
            <!-- Featured toggle -->
            <button
              type="button"
              class="rounded p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
              :class="row.is_featured ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'"
              :title="row.is_featured ? 'Unfeature' : 'Feature'"
              @click="handleToggleFeatured(row)"
            >
              <component :is="row.is_featured ? StarSolidIcon : StarIcon" class="h-5 w-5" />
            </button>
            <button
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
            title="No products found"
            description="Get started by adding your first product."
            action-text="Add Product"
            action-to="/admin/products/create"
          />
        </template>
      </DataTable>
    </BaseCard>

    <!-- Reject Modal -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showRejectModal = false"></div>
        <div class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Product</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Rejecting: <strong>{{ rejectingProduct?.name }}</strong>
          </p>
          <textarea
            v-model="rejectionReason"
            rows="3"
            placeholder="Provide a reason for rejection..."
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
          <div class="mt-4 flex justify-end gap-3">
            <BaseButton variant="secondary" size="sm" @click="showRejectModal = false">Cancel</BaseButton>
            <BaseButton variant="danger" size="sm" @click="handleReject">Reject</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Bulk Reject Modal -->
    <Teleport to="body">
      <div v-if="showBulkRejectModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showBulkRejectModal = false"></div>
        <div class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bulk Reject Products</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Rejecting {{ selectedProducts.length }} products
          </p>
          <textarea
            v-model="bulkRejectionReason"
            rows="3"
            placeholder="Provide a reason for rejection..."
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
          <div class="mt-4 flex justify-end gap-3">
            <BaseButton variant="secondary" size="sm" @click="showBulkRejectModal = false">Cancel</BaseButton>
            <BaseButton variant="danger" size="sm" @click="handleBulkReject">Reject All</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
