<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Currencies — Currency management with set-default action   -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useConfirm } from '@/composables'
import { useDebounce } from '@/composables/useDebounce'
import { currencyService } from '@/services'
import type { Currency, CurrencyFilters, CurrencyFormData } from '@/types'
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
  CurrencyDollarIcon,
  StarIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()

// ── State ──
const loading = ref(false)
const saving = ref(false)
const settingDefault = ref<number | null>(null)
const currencies = ref<Currency[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = ref(50)

// Filters
const searchQuery = ref('')
const statusFilter = ref<'' | '1' | '0'>('')

// Modal
const showModal = ref(false)
const editingCurrency = ref<Currency | null>(null)

// Form
const form = ref<CurrencyFormData>({
  code: '',
  name: '',
  symbol: '',
  exchange_rate: 1,
  is_default: false,
  is_active: true,
})
const formErrors = ref<Record<string, string>>({})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'symbol', label: 'Symbol' },
  { key: 'exchange_rate', label: 'Exchange Rate', align: 'right' as const, sortable: true },
  { key: 'is_default', label: 'Default', align: 'center' as const },
  { key: 'is_active', label: 'Status', align: 'center' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

// ── Lifecycle ──
onMounted(() => {
  breadcrumbStore.setPageInfo('Currencies', [{ label: 'Currencies' }], 'Manage supported currencies and exchange rates')
  fetchCurrencies()
})

// ── API ──
async function fetchCurrencies() {
  loading.value = true
  try {
    const params: CurrencyFilters = { page: currentPage.value, per_page: perPage.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value !== '') params.is_active = statusFilter.value === '1'
    const res = await currencyService.getAll(params)
    currencies.value = Array.isArray(res?.data) ? res.data : []
    totalItems.value = res?.meta?.total ?? currencies.value.length
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to load currencies')
  } finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounce(fetchCurrencies, 350)
watch([searchQuery, statusFilter], () => { currentPage.value = 1; debouncedFetch() })
watch(currentPage, fetchCurrencies)

// ── CRUD ──
function openCreate() {
  editingCurrency.value = null
  form.value = { code: '', name: '', symbol: '', exchange_rate: 1, is_default: false, is_active: true }
  formErrors.value = {}
  showModal.value = true
}

function openEdit(currency: Currency) {
  editingCurrency.value = currency
  form.value = {
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    exchange_rate: parseFloat(currency.exchange_rate),
    is_default: currency.is_default,
    is_active: currency.is_active,
  }
  formErrors.value = {}
  showModal.value = true
}

async function saveForm() {
  formErrors.value = {}
  if (!form.value.code.trim() || form.value.code.length !== 3) { formErrors.value.code = 'Currency code must be exactly 3 characters (ISO 4217)'; return }
  if (!form.value.name.trim()) { formErrors.value.name = 'Name is required'; return }
  if (!form.value.symbol.trim()) { formErrors.value.symbol = 'Symbol is required'; return }
  if (form.value.exchange_rate <= 0) { formErrors.value.exchange_rate = 'Exchange rate must be greater than 0'; return }

  saving.value = true
  try {
    const payload: CurrencyFormData = { ...form.value, code: form.value.code.toUpperCase() }
    if (editingCurrency.value) {
      await currencyService.update(editingCurrency.value.id, payload)
      toast.success('Currency updated')
    } else {
      await currencyService.create(payload)
      toast.success('Currency created')
    }
    showModal.value = false
    fetchCurrencies()
  } catch (e: any) {
    const errs = e?.response?.data?.errors
    if (errs) Object.keys(errs).forEach(k => { formErrors.value[k] = Array.isArray(errs[k]) ? errs[k][0] : errs[k] })
    else toast.error(e?.response?.data?.message || 'Failed to save currency')
  } finally {
    saving.value = false
  }
}

async function deleteCurrency(currency: Currency) {
  if (currency.is_default) {
    toast.error('Cannot delete the default currency. Set another as default first.')
    return
  }
  const ok = await confirm.show({
    title: 'Delete Currency',
    message: `Delete ${currency.code} — ${currency.name}?`,
    confirmText: 'Delete',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await currencyService.delete(currency.id)
    toast.success('Currency deleted')
    fetchCurrencies()
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to delete')
  }
}

async function setDefault(currency: Currency) {
  if (currency.is_default) return
  if (!currency.is_active) { toast.error('Cannot set an inactive currency as default'); return }
  settingDefault.value = currency.id
  try {
    await currencyService.setDefault(currency.id)
    toast.success(`${currency.code} set as default currency`)
    // Update local state
    currencies.value.forEach(c => { c.is_default = c.id === currency.id })
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to set default')
  } finally {
    settingDefault.value = null
  }
}

async function toggleStatus(currency: Currency) {
  if (currency.is_default && currency.is_active) {
    toast.error('Cannot deactivate the default currency')
    return
  }
  try {
    const res = await currencyService.toggleStatus(currency.id)
    currency.is_active = res.is_active
    toast.success(res.is_active ? 'Currency activated' : 'Currency deactivated')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to toggle status')
  }
}

const modalTitle = computed(() => editingCurrency.value ? 'Edit Currency' : 'Add Currency')
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Currencies</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ totalItems }} currenc{{ totalItems !== 1 ? 'ies' : 'y' }}</p>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="mr-2 h-4 w-4" />
        Add Currency
      </BaseButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-md">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or code..."
          class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <FormSelect v-model="statusFilter" name="status" :options="statusOptions" class="w-36" />
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        @click="fetchCurrencies"
      >
        <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="currencies"
        :loading="loading"
        :total="totalItems"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="p => { currentPage = p; fetchCurrencies() }"
        @per-page-change="pp => { perPage = pp; currentPage = 1; fetchCurrencies() }"
      >
        <!-- Code -->
        <template #cell-code="{ row }">
          <span class="font-mono font-bold text-gray-900 dark:text-white">{{ row.code }}</span>
        </template>

        <!-- Symbol -->
        <template #cell-symbol="{ row }">
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ row.symbol }}</span>
        </template>

        <!-- Exchange rate -->
        <template #cell-exchange_rate="{ row }">
          <span class="font-mono text-gray-700 dark:text-gray-300">{{ parseFloat(row.exchange_rate).toFixed(4) }}</span>
        </template>

        <!-- Default star -->
        <template #cell-is_default="{ row }">
          <div class="flex items-center justify-center">
            <button
              :disabled="row.is_default || settingDefault === row.id"
              :title="row.is_default ? 'Default currency' : 'Set as default'"
              class="rounded p-1 transition-colors"
              :class="row.is_default ? 'text-warning-500 cursor-default' : 'text-gray-300 hover:text-warning-400 dark:text-gray-600 dark:hover:text-warning-400'"
              @click="setDefault(row)"
            >
              <component
                :is="row.is_default ? StarSolidIcon : StarIcon"
                class="h-5 w-5"
                :class="{ 'animate-spin': settingDefault === row.id }"
              />
            </button>
          </div>
        </template>

        <!-- Status toggle -->
        <template #cell-is_active="{ row }">
          <button @click="toggleStatus(row)">
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
              :class="{ 'opacity-40 cursor-not-allowed': row.is_default }"
              :title="row.is_default ? 'Cannot delete the default currency' : 'Delete'"
              @click="deleteCurrency(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="CurrencyDollarIcon"
            title="No currencies found"
            :description="searchQuery ? 'Try adjusting your search' : 'Add your first currency'"
          >
            <BaseButton size="sm" @click="openCreate">
              <PlusIcon class="mr-2 h-4 w-4" />
              Add Currency
            </BaseButton>
          </EmptyState>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Create / Edit Modal -->
    <BaseModal v-model="showModal" :title="modalTitle" max-width="md">
      <div class="grid gap-4 sm:grid-cols-2">
        <FormInput
          v-model="form.code"
          name="code"
          label="Code (ISO 4217)"
          placeholder="BDT"
          required
          :disabled="!!editingCurrency"
          :error="formErrors.code"
          @input="form.code = form.code.toUpperCase()"
        />
        <FormInput
          v-model="form.symbol"
          name="symbol"
          label="Symbol"
          placeholder="৳"
          required
          :error="formErrors.symbol"
        />
        <div class="sm:col-span-2">
          <FormInput
            v-model="form.name"
            name="name"
            label="Name"
            placeholder="Bangladeshi Taka"
            required
            :error="formErrors.name"
          />
        </div>
        <div class="sm:col-span-2">
          <FormInput
            v-model.number="form.exchange_rate"
            name="exchange_rate"
            label="Exchange Rate (relative to base)"
            type="number"
            :step="0.000001"
            placeholder="1.000000"
            required
            :error="formErrors.exchange_rate"
          />
          <p class="form-hint">1.000000 means this IS the base currency</p>
        </div>

        <!-- Toggles -->
        <div class="sm:col-span-2 flex flex-wrap gap-6">
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
          <label v-if="!editingCurrency" class="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="switch"
              :aria-checked="form.is_default"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors"
              :class="form.is_default ? 'bg-warning-500' : 'bg-gray-300 dark:bg-gray-600'"
              @click="form.is_default = !form.is_default"
            >
              <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition" :class="form.is_default ? 'translate-x-5' : 'translate-x-0'" />
            </button>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Set as Default</span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showModal = false">Cancel</BaseButton>
          <BaseButton :loading="saving" @click="saveForm">
            {{ editingCurrency ? 'Update' : 'Create' }} Currency
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
