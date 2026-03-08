<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin TaxRates — Tax rate management                             -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { taxRateService } from '@/services'
import type { TaxRate, TaxRateFilters, TaxRateFormData } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalculatorIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()

// ── State ──
const loading = ref(false)
const saving = ref(false)
const taxRates = ref<TaxRate[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(20)

// Filters
const searchQuery = ref('')
const statusFilter = ref<'' | '1' | '0'>('')
const countryFilter = ref('')

// Modal
const showModal = ref(false)
const editingRate = ref<TaxRate | null>(null)

// Form
const form = ref<TaxRateFormData>({
  name: '',
  rate: 0,
  country: '',
  state: '',
  city: '',
  postal_code: '',
  is_compound: false,
  priority: 1,
  is_active: true,
})
const formErrors = ref<Record<string, string>>({})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'rate', label: 'Rate %', align: 'right' as const, sortable: true },
  { key: 'location', label: 'Location' },
  { key: 'compound', label: 'Compound', align: 'center' as const },
  { key: 'priority', label: 'Priority', align: 'center' as const, sortable: true },
  { key: 'is_active', label: 'Status', align: 'center' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

// ── Lifecycle ──
onMounted(() => {
  breadcrumbStore.setPageInfo('Tax Rates', [{ label: 'Tax Rates' }], 'Manage tax rates for orders')
  fetchRates()
})

// ── API ──
async function fetchRates() {
  loading.value = true
  try {
    const params: TaxRateFilters = { page: currentPage.value, per_page: perPage.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value !== '') params.is_active = statusFilter.value === '1'
    if (countryFilter.value) params.country = countryFilter.value
    const res = await taxRateService.getAll(params)
    taxRates.value = Array.isArray(res?.data) ? res.data : []
    totalItems.value = res?.meta?.total ?? taxRates.value.length
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to load tax rates')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounce(fetchRates, 350)
watch([searchQuery, statusFilter, countryFilter], () => { currentPage.value = 1; debouncedFetch() })
watch(currentPage, fetchRates)

// ── CRUD ──
function openCreate() {
  editingRate.value = null
  form.value = { name: '', rate: 0, country: '', state: '', city: '', postal_code: '', is_compound: false, priority: 1, is_active: true }
  formErrors.value = {}
  showModal.value = true
}

function openEdit(rate: TaxRate) {
  editingRate.value = rate
  form.value = {
    name: rate.name,
    rate: parseFloat(rate.rate),
    country: rate.country ?? '',
    state: rate.state ?? '',
    city: rate.city ?? '',
    postal_code: rate.postal_code ?? '',
    is_compound: rate.is_compound,
    priority: rate.priority,
    is_active: rate.is_active,
  }
  formErrors.value = {}
  showModal.value = true
}

async function saveForm() {
  formErrors.value = {}
  if (!form.value.name.trim()) { formErrors.value.name = 'Name is required'; return }
  if (form.value.rate < 0 || form.value.rate > 99.9999) { formErrors.value.rate = 'Rate must be between 0 and 99.9999'; return }
  saving.value = true
  try {
    // Clean up empty strings to null
    const payload: TaxRateFormData = {
      ...form.value,
      country: form.value.country || null,
      state: form.value.state || null,
      city: form.value.city || null,
      postal_code: form.value.postal_code || null,
    }
    if (editingRate.value) {
      await taxRateService.update(editingRate.value.id, payload)
      toast.success('Tax rate updated')
    } else {
      await taxRateService.create(payload)
      toast.success('Tax rate created')
    }
    showModal.value = false
    fetchRates()
  } catch (e: any) {
    const errs = e?.response?.data?.errors
    if (errs) Object.keys(errs).forEach(k => { formErrors.value[k] = Array.isArray(errs[k]) ? errs[k][0] : errs[k] })
    else toast.error(e?.response?.data?.message || 'Failed to save tax rate')
  } finally {
    saving.value = false
  }
}

async function deleteRate(rate: TaxRate) {
  const ok = await confirm.show({
    title: 'Delete Tax Rate',
    message: `Delete "${rate.name}"?`,
    confirmText: 'Delete',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await taxRateService.delete(rate.id)
    toast.success('Tax rate deleted')
    fetchRates()
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to delete')
  }
}

async function toggleStatus(rate: TaxRate) {
  try {
    const res = await taxRateService.toggleStatus(rate.id)
    rate.is_active = res.is_active
    toast.success(res.is_active ? 'Tax rate activated' : 'Tax rate deactivated')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to toggle status')
  }
}

function locationText(rate: TaxRate): string {
  const parts = [rate.city, rate.state, rate.country].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Global'
}

const modalTitle = computed(() => editingRate.value ? 'Edit Tax Rate' : 'Add Tax Rate')
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Tax Rates</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ totalItems }} rate{{ totalItems !== 1 ? 's' : '' }}</p>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="mr-2 h-4 w-4" />
        Add Tax Rate
      </BaseButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-md">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tax rates..."
          class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <input
        v-model="countryFilter"
        type="text"
        placeholder="Country code (e.g. BD)"
        maxlength="2"
        class="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm uppercase focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      <FormSelect v-model="statusFilter" name="status" :options="statusOptions" class="w-36" />
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        @click="fetchRates"
      >
        <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="taxRates"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="p => { currentPage = p; fetchRates() }"
        @per-page-change="pp => { perPage = pp; currentPage = 1; fetchRates() }"
      >
        <template #cell-rate="{ row }">
          <span class="font-mono font-medium text-gray-900 dark:text-white">{{ parseFloat(row.rate).toFixed(2) }}%</span>
        </template>

        <template #cell-location="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ locationText(row) }}</span>
        </template>

        <template #cell-compound="{ row }">
          <BaseBadge :variant="row.is_compound ? 'warning' : 'secondary'">
            {{ row.is_compound ? 'Yes' : 'No' }}
          </BaseBadge>
        </template>

        <template #cell-priority="{ row }">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ row.priority }}</span>
        </template>

        <template #cell-is_active="{ row }">
          <button @click="toggleStatus(row)">
            <BaseBadge :variant="row.is_active ? 'success' : 'secondary'">
              {{ row.is_active ? 'Active' : 'Inactive' }}
            </BaseBadge>
          </button>
        </template>

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
              @click="deleteRate(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="CalculatorIcon"
            title="No tax rates found"
            :description="searchQuery ? 'Try adjusting your search' : 'Create your first tax rate'"
          >
            <BaseButton size="sm" @click="openCreate">
              <PlusIcon class="mr-2 h-4 w-4" />
              Add Tax Rate
            </BaseButton>
          </EmptyState>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Create / Edit Modal -->
    <BaseModal v-model="showModal" :title="modalTitle" max-width="lg">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <FormInput v-model="form.name" name="name" label="Name" placeholder="e.g. VAT Standard" required :error="formErrors.name" />
        </div>
        <FormInput
          v-model.number="form.rate"
          name="rate"
          label="Rate (%)"
          type="number"
          placeholder="15"
          required
          :error="formErrors.rate"
        />
        <FormInput
          v-model.number="form.priority"
          name="priority"
          label="Priority (1 = highest)"
          type="number"
          placeholder="1"
          :error="formErrors.priority"
        />
        <FormInput
          v-model="form.country"
          name="country"
          label="Country Code (ISO 2)"
          placeholder="BD"
          :error="formErrors.country"
        />
        <FormInput
          v-model="form.state"
          name="state"
          label="State / Province"
          placeholder="Leave blank for all"
          :error="formErrors.state"
        />
        <FormInput v-model="form.city" name="city" label="City" placeholder="Leave blank for all" :error="formErrors.city" />
        <FormInput v-model="form.postal_code" name="postal_code" label="Postal Code" placeholder="Leave blank for all" :error="formErrors.postal_code" />

        <!-- Toggles -->
        <div class="sm:col-span-2 flex flex-wrap gap-6">
          <label class="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="switch"
              :aria-checked="form.is_compound"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors"
              :class="form.is_compound ? 'bg-warning-500' : 'bg-gray-300 dark:bg-gray-600'"
              @click="form.is_compound = !form.is_compound"
            >
              <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition" :class="form.is_compound ? 'translate-x-5' : 'translate-x-0'" />
            </button>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Compound Tax</span>
          </label>
          <label class="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="switch"
              :aria-checked="form.is_active"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors"
              :class="form.is_active ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              @click="form.is_active = !form.is_active"
            >
              <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition" :class="form.is_active ? 'translate-x-5' : 'translate-x-0'" />
            </button>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showModal = false">Cancel</BaseButton>
          <BaseButton :loading="saving" @click="saveForm">
            {{ editingRate ? 'Update' : 'Create' }} Tax Rate
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
