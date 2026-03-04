<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Banners — Banner management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { bannerService } from '@/services'
import type { Banner, BannerFilters } from '@/types'
import { BANNER_POSITIONS } from '@/types'
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
  PhotoIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDate } = useDate()

// ── State ──
const loading = ref(false)
const banners = ref<Banner[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Banners', [
    { label: 'Banners' },
  ], 'Manage promotional banners')
  fetchBanners()
})

// Search and filters
const searchQuery = ref('')
const positionFilter = ref('')
const statusFilter = ref('')

const positionOptions = [
  { value: '', label: 'All Positions' },
  ...BANNER_POSITIONS.map(p => ({ value: p.value, label: p.label })),
]

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
]

// Table columns
const columns = [
  { key: 'image', label: 'Banner' },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'position', label: 'Position' },
  { key: 'period', label: 'Period' },
  { key: 'clicks', label: 'Clicks', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// ── API Methods ──
async function fetchBanners() {
  loading.value = true
  try {
    const params: BannerFilters = {
      page: currentPage.value,
      per_page: perPage.value,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (positionFilter.value) params.position = positionFilter.value as any
    if (statusFilter.value) params.is_active = statusFilter.value === 'active'

    const response = await bannerService.getAll(params)
    // Handle response format
    const resData = response as any
    if (Array.isArray(resData.data)) {
      banners.value = resData.data
      totalItems.value = resData.meta?.total || resData.data.length
    } else if (Array.isArray(resData)) {
      banners.value = resData
      totalItems.value = resData.length
    } else {
      banners.value = []
      totalItems.value = 0
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load banners')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounce(fetchBanners, 300)

// Watch filters
watch([positionFilter, statusFilter], () => {
  currentPage.value = 1
  fetchBanners()
})

watch(searchQuery, () => {
  currentPage.value = 1
  debouncedFetch()
})

// Pagination
function handlePageChange(page: number) {
  currentPage.value = page
  fetchBanners()
}

function handlePerPageChange(size: number) {
  perPage.value = size
  currentPage.value = 1
  fetchBanners()
}

// ── Actions ──
function createBanner() {
  router.push({ name: 'admin-banner-create' })
}

function editBanner(banner: Banner) {
  router.push({ name: 'admin-banner-edit', params: { id: banner.id } })
}

async function toggleBanner(banner: Banner) {
  try {
    const updated = await bannerService.toggle(banner.id)
    banner.is_active = updated.is_active
    toast.success(banner.is_active ? 'Banner activated' : 'Banner deactivated')
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to toggle banner')
  }
}

async function moveBannerUp(banner: Banner) {
  try {
    await bannerService.moveUp(banner.id)
    toast.success('Banner moved up')
    fetchBanners()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to move banner')
  }
}

async function moveBannerDown(banner: Banner) {
  try {
    await bannerService.moveDown(banner.id)
    toast.success('Banner moved down')
    fetchBanners()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to move banner')
  }
}

async function deleteBanner(banner: Banner) {
  const confirmed = await confirm.danger({
    title: 'Delete Banner',
    message: `Are you sure you want to delete "${banner.title}"? This action cannot be undone.`,
    confirmText: 'Delete',
  })
  if (!confirmed) return

  try {
    await bannerService.delete(banner.id)
    toast.success('Banner deleted')
    banners.value = banners.value.filter(b => b.id !== banner.id)
    totalItems.value--
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete banner')
  }
}

// ── Helpers ──
function getStatus(banner: Banner) {
  if (!banner.is_active) return 'inactive'
  const now = new Date()
  if (banner.starts_at && new Date(banner.starts_at) > now) return 'scheduled'
  if (banner.ends_at && new Date(banner.ends_at) < now) return 'expired'
  return 'active'
}

function getStatusVariant(banner: Banner) {
  const status = getStatus(banner)
  switch (status) {
    case 'active': return 'success'
    case 'scheduled': return 'info'
    case 'expired': return 'danger'
    case 'inactive': return 'secondary'
    default: return 'secondary'
  }
}

function getStatusLabel(banner: Banner) {
  const status = getStatus(banner)
  switch (status) {
    case 'active': return 'Active'
    case 'scheduled': return 'Scheduled'
    case 'expired': return 'Expired'
    case 'inactive': return 'Inactive'
    default: return status
  }
}

function getPositionLabel(position: string) {
  const found = BANNER_POSITIONS.find(p => p.value === position)
  return found?.label || position
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <FormInput
              v-model="searchQuery"
              name="search"
              placeholder="Search banners..."
              class="pl-10"
            />
          </div>
          <FormSelect
            v-model="positionFilter"
            name="position"
            :options="positionOptions"
            class="w-44"
          />
          <FormSelect
            v-model="statusFilter"
            name="status"
            :options="statusOptions"
            class="w-36"
          />
          <BaseButton variant="ghost" size="sm" @click="fetchBanners">
            <ArrowPathIcon class="h-4 w-4" />
          </BaseButton>
        </div>
        <BaseButton variant="primary" @click="createBanner">
          <PlusIcon class="mr-2 h-4 w-4" />
          Create Banner
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Banners table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="banners"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #cell-image="{ item }">
          <div class="w-24">
            <img
              v-if="item.image_url || item.image"
              :src="item.image_url || item.image"
              :alt="item.title"
              class="h-14 w-24 rounded-lg object-cover"
            />
            <div v-else class="flex h-14 w-24 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
              <PhotoIcon class="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </template>

        <template #cell-title="{ item }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ item.title }}</p>
            <a
              v-if="item.link_url"
              :href="item.link_url"
              target="_blank"
              class="text-xs text-primary-500 hover:underline flex items-center gap-1 mt-1"
            >
              <EyeIcon class="h-3 w-3" />
              Preview link
            </a>
          </div>
        </template>

        <template #cell-position="{ item }">
          <BaseBadge variant="secondary">
            {{ getPositionLabel(item.position) }}
          </BaseBadge>
        </template>

        <template #cell-period="{ item }">
          <div class="text-sm">
            <span v-if="item.starts_at" class="text-gray-600 dark:text-gray-400">
              {{ formatDate(item.starts_at) }}
            </span>
            <span v-else class="text-gray-400">No start</span>
            <span class="text-gray-400"> - </span>
            <span v-if="item.ends_at" class="text-gray-600 dark:text-gray-400">
              {{ formatDate(item.ends_at) }}
            </span>
            <span v-else class="text-gray-400">No end</span>
          </div>
        </template>

        <template #cell-clicks="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ item.click_count ?? item.clicks ?? 0 }}
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
              class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              title="Move up"
              @click="moveBannerUp(item)"
            >
              <ArrowUpIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              title="Move down"
              @click="moveBannerDown(item)"
            >
              <ArrowDownIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="item.is_active ? 'text-success-500' : 'text-gray-400'"
              :title="item.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleBanner(item)"
            >
              <CheckCircleIcon v-if="item.is_active" class="h-4 w-4" />
              <XCircleIcon v-else class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Edit"
              @click="editBanner(item)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deleteBanner(item)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <PhotoIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No banners found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new banner.
            </p>
            <div class="mt-6">
              <BaseButton variant="primary" @click="createBanner">
                <PlusIcon class="mr-2 h-4 w-4" />
                Create Banner
              </BaseButton>
            </div>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
