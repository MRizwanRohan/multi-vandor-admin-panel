<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Brands — Brand management with logo upload                  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { brandService } from '@/services'
import type { Brand, BrandFilters } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  PhotoIcon,
  ArrowPathIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()

// ── State ──
const loading = ref(false)
const saving = ref(false)
const brands = ref<Brand[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)

// Search & filter
const searchQuery = ref('')
const statusFilter = ref<'' | '1' | '0'>('')

// Modal
const showModal = ref(false)
const editingBrand = ref<Brand | null>(null)

// Form
const form = ref({
  name: '',
  description: '',
  website: '',
  is_active: true,
  logo: null as File | null,
})
const formErrors = ref<Record<string, string>>({})
const logoPreview = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

const columns = [
  { key: 'logo', label: 'Logo' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'website', label: 'Website' },
  { key: 'products_count', label: 'Products', align: 'center' as const },
  { key: 'is_active', label: 'Status', align: 'center' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

// ── Lifecycle ──
onMounted(() => {
  breadcrumbStore.setPageInfo('Brands', [{ label: 'Brands' }], 'Manage product brands')
  fetchBrands()
})

// ── API ──
async function fetchBrands() {
  loading.value = true
  try {
    const params: BrandFilters = { page: currentPage.value, per_page: perPage.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value !== '') params.is_active = statusFilter.value === '1'
    const res = await brandService.getAll(params)
    brands.value = Array.isArray(res?.data) ? res.data : []
    totalItems.value = res?.meta?.total ?? brands.value.length
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to load brands')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounce(fetchBrands, 350)

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
  debouncedFetch()
})
watch(currentPage, fetchBrands)

// ── Logo handling ──
function handleLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    formErrors.value.logo = 'Logo must be under 2 MB'
    return
  }
  form.value.logo = file
  logoPreview.value = URL.createObjectURL(file)
  delete formErrors.value.logo
}

// ── CRUD ──
function openCreate() {
  editingBrand.value = null
  form.value = { name: '', description: '', website: '', is_active: true, logo: null }
  logoPreview.value = null
  formErrors.value = {}
  showModal.value = true
}

function openEdit(brand: Brand) {
  editingBrand.value = brand
  form.value = {
    name: brand.name,
    description: brand.description ?? '',
    website: brand.website ?? '',
    is_active: brand.is_active,
    logo: null,
  }
  logoPreview.value = brand.logo ? `/storage/${brand.logo}` : null
  formErrors.value = {}
  showModal.value = true
}

async function saveForm() {
  formErrors.value = {}
  if (!form.value.name.trim()) {
    formErrors.value.name = 'Name is required'
    return
  }
  saving.value = true
  try {
    const payload: Record<string, any> = {
      name: form.value.name,
      is_active: form.value.is_active ? '1' : '0',
    }
    if (form.value.description) payload.description = form.value.description
    if (form.value.website) payload.website = form.value.website
    if (form.value.logo) payload.logo = form.value.logo

    if (editingBrand.value) {
      await brandService.update(editingBrand.value.id, payload)
      toast.success('Brand updated')
    } else {
      await brandService.create(payload)
      toast.success('Brand created')
    }
    showModal.value = false
    fetchBrands()
  } catch (e: any) {
    const errs = e?.response?.data?.errors
    if (errs) {
      Object.keys(errs).forEach(k => { formErrors.value[k] = Array.isArray(errs[k]) ? errs[k][0] : errs[k] })
    } else {
      toast.error(e?.response?.data?.message || 'Failed to save brand')
    }
  } finally {
    saving.value = false
  }
}

async function deleteBrand(brand: Brand) {
  if (brand.products_count > 0) {
    toast.error(`Cannot delete — ${brand.products_count} product(s) still linked`)
    return
  }
  const ok = await confirm.show({
    title: 'Delete Brand',
    message: `Delete "${brand.name}"? This cannot be undone.`,
    confirmText: 'Delete',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await brandService.delete(brand.id)
    toast.success('Brand deleted')
    fetchBrands()
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to delete brand')
  }
}

async function toggleStatus(brand: Brand) {
  try {
    const res = await brandService.toggleStatus(brand.id)
    brand.is_active = res.is_active
    toast.success(res.is_active ? 'Brand activated' : 'Brand deactivated')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to toggle status')
  }
}

const logoFileInputRef = ref<HTMLInputElement | null>(null)
const isModalTitle = computed(() => editingBrand.value ? 'Edit Brand' : 'Add Brand')
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Brands</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ totalItems }} brand{{ totalItems !== 1 ? 's' : '' }}</p>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="mr-2 h-4 w-4" />
        Add Brand
      </BaseButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-md">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search brands..."
          class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <FormSelect v-model="statusFilter" name="status" :options="statusOptions" class="w-36" />
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        @click="fetchBrands"
      >
        <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="brands"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="p => { currentPage = p; fetchBrands() }"
        @per-page-change="pp => { perPage = pp; currentPage = 1; fetchBrands() }"
      >
        <!-- Logo -->
        <template #cell-logo="{ row }">
          <div class="flex items-center justify-center">
            <img
              v-if="row.logo"
              :src="`/storage/${row.logo}`"
              :alt="row.name"
              class="h-10 w-10 rounded-lg object-contain bg-gray-50 dark:bg-gray-700 p-1 border border-gray-200 dark:border-gray-600"
            />
            <div
              v-else
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
            >
              <TagIcon class="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </template>

        <!-- Name -->
        <template #cell-name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
            <p v-if="row.description" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
              {{ row.description }}
            </p>
          </div>
        </template>

        <!-- Website -->
        <template #cell-website="{ row }">
          <a
            v-if="row.website"
            :href="row.website"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            <GlobeAltIcon class="h-4 w-4" />
            <span class="truncate max-w-[160px]">{{ row.website.replace(/^https?:\/\//, '') }}</span>
          </a>
          <span v-else class="text-gray-400 text-sm">—</span>
        </template>

        <!-- Products count -->
        <template #cell-products_count="{ row }">
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ row.products_count }}</span>
        </template>

        <!-- Status toggle -->
        <template #cell-is_active="{ row }">
          <button @click="toggleStatus(row)" class="group">
            <BaseBadge :variant="row.is_active ? 'success' : 'secondary'">
              {{ row.is_active ? 'Active' : 'Inactive' }}
            </BaseBadge>
          </button>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button
              class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
              title="Edit"
              @click="openEdit(row)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-danger-600 dark:hover:bg-gray-700"
              title="Delete"
              @click="deleteBrand(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <!-- Empty state -->
        <template #empty>
          <EmptyState
            :icon="TagIcon"
            title="No brands found"
            :description="searchQuery ? 'Try adjusting your search' : 'Create your first brand'"
          >
            <BaseButton size="sm" @click="openCreate">
              <PlusIcon class="mr-2 h-4 w-4" />
              Add Brand
            </BaseButton>
          </EmptyState>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Create / Edit Modal -->
    <BaseModal v-model="showModal" :title="isModalTitle" max-width="md">
      <div class="space-y-4">
        <!-- Logo upload -->
        <div>
          <label class="form-label">Logo</label>
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 overflow-hidden">
              <img v-if="logoPreview" :src="logoPreview" alt="logo" class="h-full w-full object-contain p-1" />
              <PhotoIcon v-else class="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <input
                ref="logoFileInputRef"
                type="file"
                accept="image/jpg,image/jpeg,image/png,image/svg+xml,image/webp"
                class="hidden"
                @change="handleLogoChange"
              />
              <BaseButton variant="secondary" size="sm" @click="logoFileInputRef?.click()">
                Choose Image
              </BaseButton>
              <p class="mt-1 text-xs text-gray-500">JPG, PNG, SVG, WebP · max 2 MB</p>
              <p v-if="formErrors.logo" class="form-error">{{ formErrors.logo }}</p>
            </div>
          </div>
        </div>

        <FormInput
          v-model="form.name"
          name="name"
          label="Name"
          placeholder="e.g. Nike"
          required
          :error="formErrors.name"
        />
        <FormInput
          v-model="form.description"
          name="description"
          label="Description"
          placeholder="Short brand description"
          :error="formErrors.description"
        />
        <FormInput
          v-model="form.website"
          name="website"
          label="Website"
          placeholder="https://example.com"
          :error="formErrors.website"
        />

        <!-- Active toggle -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            :aria-checked="form.is_active"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
            :class="form.is_active ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            @click="form.is_active = !form.is_active"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200"
              :class="form.is_active ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showModal = false">Cancel</BaseButton>
          <BaseButton :loading="saving" @click="saveForm">
            {{ editingBrand ? 'Update Brand' : 'Create Brand' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
