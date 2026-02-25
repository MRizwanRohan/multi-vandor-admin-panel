<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Inventory — Inventory management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { productService } from '@/services'
import { usePagination, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Product, TableColumn } from '@/types'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const pagination = usePagination()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Inventory', [
    { label: 'Inventory' },
  ], 'Manage your product stock levels')
  fetchProducts()
})

// Data
const products = ref<Product[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

// Stock update modal
const isModalOpen = ref(false)
const selectedProduct = ref<Product | null>(null)
const newStock = ref(0)
const isSaving = ref(false)

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'stock', label: 'Current Stock', sortable: true, align: 'center' },
  { key: 'threshold', label: 'Low Stock Alert', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch products
async function fetchProducts() {
  isLoading.value = true
  try {
    const response = await productService.getAll({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: searchQuery.value,
    })
    products.value = response.data
    pagination.totalItems.value = response.meta.total
  } catch (error) {
    // Mock data
    products.value = [
      { id: 1, name: 'Premium T-Shirt (Red, M)', slug: 'premium-tshirt-red-m', sku: 'TSH-001-RM', price: 1500, sale_price: null, effective_price: 1500, type: 'simple', status: 'approved', visibility: 'visible', is_featured: false, stock_quantity: 3, is_in_stock: true, primary_image: null } as Product,
      { id: 2, name: 'Premium T-Shirt (Blue, L)', slug: 'premium-tshirt-blue-l', sku: 'TSH-001-BL', price: 1500, sale_price: null, effective_price: 1500, type: 'simple', status: 'approved', visibility: 'visible', is_featured: false, stock_quantity: 45, is_in_stock: true, primary_image: null } as Product,
      { id: 3, name: 'Classic Jeans (Blue, 32)', slug: 'classic-jeans-blue-32', sku: 'JNS-002-B32', price: 3500, sale_price: null, effective_price: 3500, type: 'simple', status: 'approved', visibility: 'visible', is_featured: false, stock_quantity: 0, is_in_stock: false, primary_image: null } as Product,
      { id: 4, name: 'Running Shoes (Black, 42)', slug: 'running-shoes-black-42', sku: 'SHO-003-B42', price: 5500, sale_price: null, effective_price: 5500, type: 'simple', status: 'approved', visibility: 'visible', is_featured: false, stock_quantity: 8, is_in_stock: true, primary_image: null } as Product,
    ]
    pagination.totalItems.value = 4
  } finally {
    isLoading.value = false
  }
}

// Low stock count (using default threshold of 10)
const LOW_STOCK_THRESHOLD = 10

const lowStockCount = computed(() => 
  products.value.filter(p => p.stock_quantity <= LOW_STOCK_THRESHOLD).length
)

const outOfStockCount = computed(() => 
  products.value.filter(p => p.stock_quantity === 0).length
)

// Open stock update modal
function openStockModal(product: Product) {
  selectedProduct.value = product
  newStock.value = product.stock_quantity
  isModalOpen.value = true
}

// Close modal
function closeModal() {
  isModalOpen.value = false
  selectedProduct.value = null
}

// Update stock
async function updateStock() {
  if (!selectedProduct.value) return

  isSaving.value = true
  try {
    await productService.update(selectedProduct.value.id, { stock_quantity: newStock.value })
    toast.success('Stock updated successfully')
    closeModal()
    fetchProducts()
  } catch (error) {
    toast.error('Failed to update stock')
  } finally {
    isSaving.value = false
  }
}

// Stock status
function getStockStatus(product: Product): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (product.stock_quantity === 0) {
    return { label: 'Out of Stock', variant: 'danger' }
  }
  if (product.stock_quantity <= LOW_STOCK_THRESHOLD) {
    return { label: 'Low Stock', variant: 'warning' }
  }
  return { label: 'In Stock', variant: 'success' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Alerts -->
    <div v-if="lowStockCount > 0 || outOfStockCount > 0" class="grid gap-4 sm:grid-cols-2">
      <div
        v-if="outOfStockCount > 0"
        class="flex items-center gap-4 rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/50">
          <ExclamationTriangleIcon class="h-5 w-5 text-danger-600 dark:text-danger-400" />
        </div>
        <div>
          <p class="font-medium text-danger-800 dark:text-danger-200">
            {{ outOfStockCount }} products out of stock
          </p>
          <p class="text-sm text-danger-600 dark:text-danger-400">
            Customers can't purchase these items
          </p>
        </div>
      </div>

      <div
        v-if="lowStockCount > 0"
        class="flex items-center gap-4 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/50">
          <ExclamationTriangleIcon class="h-5 w-5 text-warning-600 dark:text-warning-400" />
        </div>
        <div>
          <p class="font-medium text-warning-800 dark:text-warning-200">
            {{ lowStockCount }} products with low stock
          </p>
          <p class="text-sm text-warning-600 dark:text-warning-400">
            Consider restocking soon
          </p>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1 max-w-md">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @input="fetchProducts"
        />
      </div>
    </div>

    <!-- Inventory table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="products"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.totalItems.value"
        @update:currentPage="pagination.currentPage.value = $event; fetchProducts()"
        @update:perPage="pagination.perPage.value = $event; fetchProducts()"
      >
        <template #cell-name="{ row }">
          <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
        </template>

        <template #cell-stock="{ row }">
          <span
            class="font-bold"
            :class="[
              row.stock_quantity === 0 ? 'text-danger-600 dark:text-danger-400' :
              row.stock_quantity <= LOW_STOCK_THRESHOLD ? 'text-warning-600 dark:text-warning-400' :
              'text-gray-900 dark:text-white'
            ]"
          >
            {{ row.stock_quantity }}
          </span>
        </template>

        <template #cell-threshold="{ row }">
          <span class="text-gray-500 dark:text-gray-400">
            {{ LOW_STOCK_THRESHOLD }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getStockStatus(row).variant">
            {{ getStockStatus(row).label }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ row }">
          <BaseButton variant="secondary" size="sm" @click="openStockModal(row)">
            <PencilIcon class="mr-1 h-4 w-4" />
            Update
          </BaseButton>
        </template>

        <template #empty>
          <EmptyState
            title="No products found"
            description="Add products to manage their inventory."
            action-text="Add Product"
            action-to="/vendor/products/new"
          />
        </template>
      </DataTable>
    </BaseCard>

    <!-- Stock update modal -->
    <BaseModal
      :open="isModalOpen"
      title="Update Stock"
      @close="closeModal"
    >
      <div v-if="selectedProduct" class="space-y-4">
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <p class="font-medium text-gray-900 dark:text-white">
            {{ selectedProduct.name }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            SKU: {{ selectedProduct.sku }}
          </p>
        </div>

        <FormInput
          v-model.number="newStock"
          label="New Stock Quantity"
          name="stock"
          type="number"
          :min="0"
          required
        />

        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Current stock:</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ selectedProduct.stock_quantity }}</span>
          <span>→</span>
          <span class="font-medium text-primary-600 dark:text-primary-400">{{ newStock }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeModal">
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            :loading="isSaving"
            @click="updateStock"
          >
            Update Stock
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
