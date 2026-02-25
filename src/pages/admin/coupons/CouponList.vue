<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Coupons — Coupon management page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/data/DataTable.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
  ClipboardDocumentIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDate } = useDate()
const { formatCurrency } = useCurrency()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Coupons', [
    { label: 'Coupons' },
  ], 'Manage discount coupons')
})

// Search and filters
const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
]

// Table columns
const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'discount', label: 'Discount', sortable: true },
  { key: 'usage', label: 'Usage' },
  { key: 'minOrder', label: 'Min Order', sortable: true },
  { key: 'validity', label: 'Validity' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// Mock data
const coupons = ref([
  {
    id: '1',
    code: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscount: 500,
    usageLimit: 100,
    usedCount: 45,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    status: 'active',
  },
  {
    id: '2',
    code: 'FLAT500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 2500,
    maxDiscount: null,
    usageLimit: 50,
    usedCount: 50,
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    status: 'expired',
  },
  {
    id: '3',
    code: 'SAVE15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 500,
    maxDiscount: 300,
    usageLimit: null,
    usedCount: 120,
    startDate: '2024-12-10',
    endDate: '2025-01-10',
    status: 'active',
  },
])

// Modal
const showModal = ref(false)
const isEditing = ref(false)
const editingCoupon = ref<typeof coupons.value[0] | null>(null)

// Form data
const formData = ref({
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscount: null as number | null,
  usageLimit: null as number | null,
  startDate: '',
  endDate: '',
})

const discountTypeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (৳)' },
]

// Open modal
function openCreateModal() {
  isEditing.value = false
  editingCoupon.value = null
  formData.value = {
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: null,
    usageLimit: null,
    startDate: '',
    endDate: '',
  }
  showModal.value = true
}

function openEditModal(coupon: typeof coupons.value[0]) {
  isEditing.value = true
  editingCoupon.value = coupon
  formData.value = {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderAmount: coupon.minOrderAmount,
    maxDiscount: coupon.maxDiscount,
    usageLimit: coupon.usageLimit,
    startDate: coupon.startDate,
    endDate: coupon.endDate,
  }
  showModal.value = true
}

// Save coupon
function saveCoupon() {
  if (isEditing.value && editingCoupon.value) {
    Object.assign(editingCoupon.value, formData.value)
    toast.success('Coupon updated successfully')
  } else {
    coupons.value.push({
      ...formData.value,
      id: Date.now().toString(),
      usedCount: 0,
      status: 'active',
    })
    toast.success('Coupon created successfully')
  }
  showModal.value = false
}

// Delete coupon
function deleteCoupon(coupon: typeof coupons.value[0]) {
  coupons.value = coupons.value.filter(c => c.id !== coupon.id)
  toast.success('Coupon deleted')
}

// Copy code
function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  toast.success('Code copied to clipboard')
}

// Get status variant
function getStatusVariant(status: string) {
  switch (status) {
    case 'active': return 'success'
    case 'expired': return 'danger'
    case 'disabled': return 'secondary'
    default: return 'secondary'
  }
}

// Format discount
function formatDiscount(coupon: typeof coupons.value[0]) {
  if (coupon.discountType === 'percentage') {
    return `${coupon.discountValue}%`
  }
  return formatCurrency(coupon.discountValue)
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
              placeholder="Search coupons..."
              class="pl-10"
            />
          </div>
          <FormSelect
            v-model="statusFilter"
            name="status"
            :options="statusOptions"
            class="w-40"
          />
        </div>
        <BaseButton variant="primary" @click="openCreateModal">
          <PlusIcon class="mr-2 h-4 w-4" />
          Create Coupon
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Coupons table -->
    <BaseCard>
      <DataTable
        :columns="columns"
        :data="coupons"
        :loading="false"
        :total="coupons.length"
        :current-page="1"
        :per-page="20"
      >
        <template #cell-code="{ item }">
          <div class="flex items-center gap-2">
            <TicketIcon class="h-5 w-5 text-primary-500" />
            <span class="font-mono font-semibold text-gray-900 dark:text-white">
              {{ item.code }}
            </span>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy code"
              @click="copyCode(item.code)"
            >
              <ClipboardDocumentIcon class="h-4 w-4" />
            </button>
          </div>
        </template>

        <template #cell-discount="{ item }">
          <div>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatDiscount(item) }}
            </span>
            <span
              v-if="item.maxDiscount"
              class="block text-xs text-gray-500 dark:text-gray-400"
            >
              Max: {{ formatCurrency(item.maxDiscount) }}
            </span>
          </div>
        </template>

        <template #cell-usage="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ item.usedCount }} / {{ item.usageLimit || '∞' }}
          </span>
        </template>

        <template #cell-minOrder="{ item }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatCurrency(item.minOrderAmount) }}
          </span>
        </template>

        <template #cell-validity="{ item }">
          <div class="text-sm">
            <span class="text-gray-600 dark:text-gray-400">
              {{ formatDate(item.startDate) }}
            </span>
            <span class="text-gray-400 dark:text-gray-500"> - </span>
            <span class="text-gray-600 dark:text-gray-400">
              {{ formatDate(item.endDate) }}
            </span>
          </div>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)">
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Edit"
              @click="openEditModal(item)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete"
              @click="deleteCoupon(item)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Create/Edit modal -->
    <BaseModal
      v-model="showModal"
      :title="isEditing ? 'Edit Coupon' : 'Create Coupon'"
      size="lg"
      @close="showModal = false"
    >
      <div class="space-y-4">
        <FormInput
          v-model="formData.code"
          label="Coupon Code"
          name="code"
          placeholder="e.g., SAVE20"
          :disabled="isEditing"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="formData.discountType"
            label="Discount Type"
            name="discountType"
            :options="discountTypeOptions"
          />

          <FormInput
            v-model.number="formData.discountValue"
            label="Discount Value"
            name="discountValue"
            type="number"
            :min="0"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model.number="formData.minOrderAmount"
            label="Minimum Order Amount"
            name="minOrderAmount"
            type="number"
            :min="0"
          />

          <FormInput
            v-model.number="formData.maxDiscount"
            label="Maximum Discount (optional)"
            name="maxDiscount"
            type="number"
            :min="0"
          />
        </div>

        <FormInput
          v-model.number="formData.usageLimit"
          label="Usage Limit (leave empty for unlimited)"
          name="usageLimit"
          type="number"
          :min="1"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="formData.startDate"
            label="Start Date"
            name="startDate"
            type="date"
          />

          <FormInput
            v-model="formData.endDate"
            label="End Date"
            name="endDate"
            type="date"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showModal = false">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" @click="saveCoupon">
            {{ isEditing ? 'Save Changes' : 'Create Coupon' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
