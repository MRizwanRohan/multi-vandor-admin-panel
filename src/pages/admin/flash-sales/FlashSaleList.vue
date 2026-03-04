<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Flash Sales — Flash sale management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useCurrency, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { flashSaleService } from '@/services'
import type { FlashSale, FlashSaleStats, FlashSaleFilters } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BoltIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDateTime, formatDate } = useDate()
const { formatCurrency } = useCurrency()

// ── State ──
const loading = ref(false)
const flashSales = ref<FlashSale[]>([])
const stats = ref<FlashSaleStats | null>(null)
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Flash Sales', [
    { label: 'Flash Sales' },
  ], 'Manage time-limited flash sales')
  fetchStats()
  fetchFlashSales()
})

// Search and filters
const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ended', label: 'Ended' },
  { value: 'draft', label: 'Draft' },
]

// Table columns
const columns = [
  { key: 'name', label: 'Flash Sale', sortable: true },
  { key: 'products', label: 'Products' },
  { key: 'period', label: 'Period', sortable: true },
  { key: 'discount', label: 'Discount Range' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// ── API Methods ──
async function fetchStats() {
  try {
    stats.value = await flashSaleService.getStats()
  } catch (error: any) {
    console.error('Failed to load stats:', error)
  }
}

async function fetchFlashSales() {
  loading.value = true
  try {
    const params: FlashSaleFilters = {
      page: currentPage.value,
      per_page: perPage.value,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value) params.status = statusFilter.value as any

    const response = await flashSaleService.getAll(params)
    // Handle response format
    const resData = response as any
    if (Array.isArray(resData.data)) {
      flashSales.value = resData.data
      totalItems.value = resData.meta?.total || resData.data.length
    } else if (Array.isArray(resData)) {
      flashSales.value = resData
      totalItems.value = resData.length
    } else {
      flashSales.value = []
      totalItems.value = 0
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load flash sales')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounce(fetchFlashSales, 300)

// Watch filters
watch(statusFilter, () => {
  currentPage.value = 1
  fetchFlashSales()
})

watch(searchQuery, () => {
  currentPage.value = 1
  debouncedFetch()
})

// Pagination
function handlePageChange(page: number) {
  currentPage.value = page
  fetchFlashSales()
}

function handlePerPageChange(size: number) {
  perPage.value = size
  currentPage.value = 1
  fetchFlashSales()
}

// ── Actions ──
function createFlashSale() {
  router.push({ name: 'admin-flash-sale-create' })
}

function editFlashSale(sale: FlashSale) {
  router.push({ name: 'admin-flash-sale-edit', params: { id: sale.id } })
}

async function toggleFlashSale(sale: FlashSale) {
  try {
    const updated = await flashSaleService.toggle(sale.id)
    sale.is_active = updated.is_active
    toast.success(sale.is_active ? 'Flash sale activated' : 'Flash sale deactivated')
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to toggle flash sale')
  }
}

async function deleteFlashSale(sale: FlashSale) {
  const confirmed = await confirm.danger({
    title: 'Delete Flash Sale',
    message: `Are you sure you want to delete "${sale.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
  })
  if (!confirmed) return

  try {
    await flashSaleService.delete(sale.id)
    toast.success('Flash sale deleted')
    flashSales.value = flashSales.value.filter(s => s.id !== sale.id)
    totalItems.value--
    fetchStats()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete flash sale')
  }
}

// ── Helpers ──
function getStatus(sale: FlashSale) {
  if (!sale.is_active) return 'draft'
  const now = new Date()
  const start = new Date(sale.starts_at)
  const end = new Date(sale.ends_at)
  if (now < start) return 'scheduled'
  if (now > end) return 'ended'
  return 'active'
}

function getStatusVariant(sale: FlashSale) {
  const status = getStatus(sale)
  switch (status) {
    case 'active': return 'success'
    case 'scheduled': return 'info'
    case 'ended': return 'secondary'
    case 'draft': return 'warning'
    default: return 'secondary'
  }
}

function getStatusLabel(sale: FlashSale) {
  const status = getStatus(sale)
  switch (status) {
    case 'active': return 'Active'
    case 'scheduled': return 'Scheduled'
    case 'ended': return 'Ended'
    case 'draft': return 'Draft'
    default: return status
  }
}

function getTimeRemaining(sale: FlashSale) {
  const status = getStatus(sale)
  if (status === 'ended') return 'Ended'
  
  const now = new Date()
  const target = status === 'scheduled' ? new Date(sale.starts_at) : new Date(sale.ends_at)
  const diff = target.getTime() - now.getTime()
  
  if (diff <= 0) return status === 'scheduled' ? 'Starting now' : 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <BoltIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Flash Sales</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.total_flash_sales }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
          <CheckCircleIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.active_flash_sales }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400">
          <ClockIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.upcoming_flash_sales }}</p>
        </div>
      </BaseCard>

      <BaseCard class="flex items-center gap-4 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400">
          <ShoppingBagIcon class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.total_products_on_sale }}</p>
        </div>
      </BaseCard>
    </div>

    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <FormInput
              v-model="searchQuery"
              name="search"
              placeholder="Search flash sales..."
              class="pl-10"
            />
          </div>
          <FormSelect
            v-model="statusFilter"
            name="status"
            :options="statusOptions"
            class="w-40"
          />
          <BaseButton variant="ghost" size="sm" @click="fetchFlashSales">
            <ArrowPathIcon class="h-4 w-4" />
          </BaseButton>
        </div>
        <BaseButton variant="primary" @click="createFlashSale">
          <PlusIcon class="mr-2 h-4 w-4" />
          Create Flash Sale
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Flash Sales table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="flashSales"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #cell-name="{ item }">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <BoltIcon class="h-5 w-5" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ item.name }}</p>
              <p v-if="item.description" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {{ item.description }}
              </p>
            </div>
          </div>
        </template>

        <template #cell-products="{ item }">
          <div class="flex items-center gap-2">
            <ShoppingBagIcon class="h-4 w-4 text-gray-400" />
            <span class="text-gray-600 dark:text-gray-400">
              {{ item.products_count ?? item.products?.length ?? 0 }} products
            </span>
          </div>
        </template>

        <template #cell-period="{ item }">
          <div class="text-sm">
            <p class="text-gray-900 dark:text-white">{{ formatDate(item.starts_at) }}</p>
            <p class="text-gray-500 dark:text-gray-400">to {{ formatDate(item.ends_at) }}</p>
            <p class="mt-1 text-xs font-medium" :class="getStatus(item) === 'active' ? 'text-success-600 dark:text-success-400' : 'text-gray-500 dark:text-gray-400'">
              <ClockIcon class="inline h-3 w-3 mr-1" />
              {{ getTimeRemaining(item) }}
            </p>
          </div>
        </template>

        <template #cell-discount="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ item.min_discount ?? 0 }}% - {{ item.max_discount ?? item.discount_percentage ?? 0 }}%
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item)">
            {{ getStatusLabel(item) }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="item.is_active ? 'text-success-500' : 'text-gray-400'"
              :title="item.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleFlashSale(item)"
            >
              <CheckCircleIcon v-if="item.is_active" class="h-4 w-4" />
              <XCircleIcon v-else class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Edit"
              @click="editFlashSale(item)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deleteFlashSale(item)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <BoltIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No flash sales found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new flash sale campaign.
            </p>
            <div class="mt-6">
              <BaseButton variant="primary" @click="createFlashSale">
                <PlusIcon class="mr-2 h-4 w-4" />
                Create Flash Sale
              </BaseButton>
            </div>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
