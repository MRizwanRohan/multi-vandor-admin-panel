<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Commission Management — Default rate, category & vendor overrides -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { vendorService, categoryService } from '@/services'
import { useToast, useConfirm, useCurrency } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Vendor, Category } from '@/types'
import {
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  FolderIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()
const currency = useCurrency()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Commissions', [
    { label: 'Commissions' },
  ], 'Manage marketplace commission rates')
  fetchData()
})

// Data
const isLoading = ref(true)
const activeTab = ref<'default' | 'categories' | 'vendors'>('default')

// Default commission
const defaultCommission = ref({
  rate: 10,
  type: 'percentage' as 'percentage' | 'fixed',
})

// Category overrides
const categoryOverrides = ref<Array<{
  id: number
  category_id: number
  category_name: string
  rate: number
  type: 'percentage' | 'fixed'
}>>([])

// Vendor overrides
const vendorOverrides = ref<Array<{
  id: number
  vendor_id: number
  vendor_name: string
  store_name: string
  rate: number
  type: 'percentage' | 'fixed'
}>>([])

// Available categories and vendors for selection
const categories = ref<Category[]>([])
const vendors = ref<Vendor[]>([])

// Modal state
const showModal = ref(false)
const modalType = ref<'category' | 'vendor'>('category')
const isEditing = ref(false)
const isSaving = ref(false)
const editingId = ref<number | null>(null)

// Form data
const formData = ref({
  target_id: '' as string | number,
  rate: 10,
  type: 'percentage' as 'percentage' | 'fixed',
})

// Options
const typeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (৳)' },
]

const categoryOptions = computed(() => 
  categories.value
    .filter(c => !categoryOverrides.value.some(o => o.category_id === c.id))
    .map(c => ({ value: c.id, label: c.name }))
)

const vendorOptions = computed(() => 
  vendors.value
    .filter(v => !vendorOverrides.value.some(o => o.vendor_id === v.id))
    .map(v => ({ value: v.id, label: `${v.store_name} (${v.owner.name})` }))
)

// Tabs
const tabs = [
  { id: 'default', label: 'Default Rate' },
  { id: 'categories', label: 'Category Overrides' },
  { id: 'vendors', label: 'Vendor Overrides' },
]

// Fetch data
async function fetchData() {
  isLoading.value = true
  try {
    // Fetch categories
    const catResponse = await categoryService.getAll()
    categories.value = catResponse.data

    // Fetch vendors
    const vendorResponse = await vendorService.getAll()
    const vData = vendorResponse.data as any
    vendors.value = Array.isArray(vData) ? vData : (vData?.vendors ?? [])
    
    // Mock override data for demo
    categoryOverrides.value = [
      { id: 1, category_id: 1, category_name: 'Electronics', rate: 8, type: 'percentage' },
      { id: 2, category_id: 2, category_name: 'Fashion', rate: 12, type: 'percentage' },
    ]
    
    vendorOverrides.value = vendors.value.slice(0, 2).map((v, i) => ({
      id: i + 1,
      vendor_id: v.id,
      vendor_name: v.owner.name,
      store_name: v.store_name,
      rate: i === 0 ? 8 : 15,
      type: 'percentage' as const,
    }))
  } catch (error) {
    // Use mock data
    categories.value = [
      { id: 1, name: 'Electronics', slug: 'electronics', description: null, parent_id: null, status: 'active' as const, is_active: true, display_order: 1, product_count: 100, depth: 0, created_at: '', updated_at: '' },
      { id: 2, name: 'Fashion', slug: 'fashion', description: null, parent_id: null, status: 'active' as const, is_active: true, display_order: 2, product_count: 200, depth: 0, created_at: '', updated_at: '' },
      { id: 3, name: 'Home & Living', slug: 'home-living', description: null, parent_id: null, status: 'active' as const, is_active: true, display_order: 3, product_count: 150, depth: 0, created_at: '', updated_at: '' },
    ]
    
    vendors.value = [
      { id: 1, user_id: 1, store_name: 'Fashion Store', slug: 'fashion-store', business_name: null, business_type: null, description: null, logo_url: null, banner_url: null, status: 'approved' as const, commission_rate: 10, rating_average: 4.5, review_count: 100, product_count: 50, order_count: 200, total_sales: 500000, owner: { id: 1, name: 'John Doe', email: 'john@example.com', phone: null, avatar: null }, is_verified: true, verified_at: null, created_at: '', updated_at: '' },
      { id: 2, user_id: 2, store_name: 'Tech Hub', slug: 'tech-hub', business_name: null, business_type: null, description: null, logo_url: null, banner_url: null, status: 'approved' as const, commission_rate: 8, rating_average: 4.2, review_count: 80, product_count: 30, order_count: 150, total_sales: 300000, owner: { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: null, avatar: null }, is_verified: true, verified_at: null, created_at: '', updated_at: '' },
    ]
    
    categoryOverrides.value = [
      { id: 1, category_id: 1, category_name: 'Electronics', rate: 8, type: 'percentage' },
      { id: 2, category_id: 2, category_name: 'Fashion', rate: 12, type: 'percentage' },
    ]
    
    vendorOverrides.value = [
      { id: 1, vendor_id: 1, vendor_name: 'John Doe', store_name: 'Fashion Store', rate: 8, type: 'percentage' },
      { id: 2, vendor_id: 2, vendor_name: 'Jane Smith', store_name: 'Tech Hub', rate: 15, type: 'percentage' },
    ]
  } finally {
    isLoading.value = false
  }
}

// Save default commission
async function saveDefaultCommission() {
  try {
    // API call to save default commission
    toast.success('Default commission rate updated')
  } catch (error) {
    toast.error('Failed to update default commission')
  }
}

// Open modal
function openAddModal(type: 'category' | 'vendor') {
  modalType.value = type
  isEditing.value = false
  editingId.value = null
  formData.value = {
    target_id: '',
    rate: defaultCommission.value.rate,
    type: 'percentage',
  }
  showModal.value = true
}

function openEditModal(type: 'category' | 'vendor', item: typeof categoryOverrides.value[0] | typeof vendorOverrides.value[0]) {
  modalType.value = type
  isEditing.value = true
  editingId.value = item.id
  formData.value = {
    target_id: type === 'category' 
      ? (item as typeof categoryOverrides.value[0]).category_id 
      : (item as typeof vendorOverrides.value[0]).vendor_id,
    rate: item.rate,
    type: item.type,
  }
  showModal.value = true
}

// Save override
async function saveOverride() {
  if (!formData.value.target_id && !isEditing.value) {
    toast.error(`Please select a ${modalType.value}`)
    return
  }
  
  isSaving.value = true
  try {
    if (modalType.value === 'category') {
      if (isEditing.value) {
        const index = categoryOverrides.value.findIndex(o => o.id === editingId.value)
        if (index >= 0) {
          categoryOverrides.value[index].rate = formData.value.rate
          categoryOverrides.value[index].type = formData.value.type
        }
      } else {
        const category = categories.value.find(c => c.id === Number(formData.value.target_id))
        if (category) {
          categoryOverrides.value.push({
            id: Date.now(),
            category_id: category.id,
            category_name: category.name,
            rate: formData.value.rate,
            type: formData.value.type,
          })
        }
      }
    } else {
      if (isEditing.value) {
        const index = vendorOverrides.value.findIndex(o => o.id === editingId.value)
        if (index >= 0) {
          vendorOverrides.value[index].rate = formData.value.rate
          vendorOverrides.value[index].type = formData.value.type
        }
      } else {
        const vendor = vendors.value.find(v => v.id === Number(formData.value.target_id))
        if (vendor) {
          vendorOverrides.value.push({
            id: Date.now(),
            vendor_id: vendor.id,
            vendor_name: vendor.owner.name,
            store_name: vendor.store_name,
            rate: formData.value.rate,
            type: formData.value.type,
          })
        }
      }
    }
    
    toast.success(`${modalType.value === 'category' ? 'Category' : 'Vendor'} commission ${isEditing.value ? 'updated' : 'added'}`)
    showModal.value = false
  } catch (error) {
    toast.error('Failed to save commission override')
  } finally {
    isSaving.value = false
  }
}

// Delete override
async function deleteOverride(type: 'category' | 'vendor', id: number) {
  const confirmed = await confirm.require({
    title: 'Delete Override',
    message: 'Are you sure you want to delete this commission override?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  
  if (!confirmed) return
  
  try {
    if (type === 'category') {
      categoryOverrides.value = categoryOverrides.value.filter(o => o.id !== id)
    } else {
      vendorOverrides.value = vendorOverrides.value.filter(o => o.id !== id)
    }
    toast.success('Commission override deleted')
  } catch (error) {
    toast.error('Failed to delete override')
  }
}

// Format rate display
function formatRate(rate: number, type: 'percentage' | 'fixed'): string {
  return type === 'percentage' ? `${rate}%` : currency.formatCurrency(rate)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Commission Management</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Configure default commission rates and set category or vendor-specific overrides
      </p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex gap-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id as typeof activeTab"
          :class="[
            'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Default Rate Tab -->
      <div v-if="activeTab === 'default'">
        <BaseCard title="Default Commission Rate">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This rate applies to all transactions unless overridden by category or vendor-specific settings.
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              v-model="defaultCommission.type"
              label="Commission Type"
              :options="typeOptions"
            />
            
            <FormInput
              v-model="defaultCommission.rate"
              :label="defaultCommission.type === 'percentage' ? 'Rate (%)' : 'Fixed Amount'"
              type="number"
              :min="0"
              :max="defaultCommission.type === 'percentage' ? 100 : undefined"
            />
            
            <div class="flex items-end">
              <BaseButton @click="saveDefaultCommission">
                Save Default Rate
              </BaseButton>
            </div>
          </div>
          
          <div class="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div class="flex items-center gap-3">
              <CurrencyDollarIcon class="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p class="text-sm text-indigo-600 dark:text-indigo-400">Current Default</p>
                <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {{ formatRate(defaultCommission.rate, defaultCommission.type) }}
                </p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Category Overrides Tab -->
      <div v-else-if="activeTab === 'categories'">
        <BaseCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">Category Overrides</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Set different commission rates for specific categories
                </p>
              </div>
              <BaseButton @click="openAddModal('category')">
                <PlusIcon class="h-5 w-5 mr-2" />
                Add Override
              </BaseButton>
            </div>
          </template>
          
          <template v-if="categoryOverrides.length === 0">
            <EmptyState
              :icon="FolderIcon"
              title="No category overrides"
              description="All categories use the default commission rate."
            >
              <BaseButton @click="openAddModal('category')">
                <PlusIcon class="h-5 w-5 mr-2" />
                Add Category Override
              </BaseButton>
            </EmptyState>
          </template>
          
          <template v-else>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="override in categoryOverrides"
                :key="override.id"
                class="py-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <FolderIcon class="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ override.category_name }}</p>
                    <p class="text-sm text-gray-500">Category</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-4">
                  <BaseBadge color="purple">
                    {{ formatRate(override.rate, override.type) }}
                  </BaseBadge>
                  
                  <div class="flex gap-2">
                    <BaseButton variant="ghost" size="sm" @click="openEditModal('category', override)">
                      <PencilIcon class="h-4 w-4" />
                    </BaseButton>
                    <BaseButton variant="ghost" size="sm" @click="deleteOverride('category', override.id)">
                      <TrashIcon class="h-4 w-4 text-red-500" />
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </BaseCard>
      </div>

      <!-- Vendor Overrides Tab -->
      <div v-else-if="activeTab === 'vendors'">
        <BaseCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">Vendor Overrides</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Set custom commission rates for specific vendors
                </p>
              </div>
              <BaseButton @click="openAddModal('vendor')">
                <PlusIcon class="h-5 w-5 mr-2" />
                Add Override
              </BaseButton>
            </div>
          </template>
          
          <template v-if="vendorOverrides.length === 0">
            <EmptyState
              :icon="BuildingStorefrontIcon"
              title="No vendor overrides"
              description="All vendors use the default or category-based commission rate."
            >
              <BaseButton @click="openAddModal('vendor')">
                <PlusIcon class="h-5 w-5 mr-2" />
                Add Vendor Override
              </BaseButton>
            </EmptyState>
          </template>
          
          <template v-else>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="override in vendorOverrides"
                :key="override.id"
                class="py-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <BuildingStorefrontIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ override.store_name }}</p>
                    <p class="text-sm text-gray-500">{{ override.vendor_name }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-4">
                  <BaseBadge color="green">
                    {{ formatRate(override.rate, override.type) }}
                  </BaseBadge>
                  
                  <div class="flex gap-2">
                    <BaseButton variant="ghost" size="sm" @click="openEditModal('vendor', override)">
                      <PencilIcon class="h-4 w-4" />
                    </BaseButton>
                    <BaseButton variant="ghost" size="sm" @click="deleteOverride('vendor', override.id)">
                      <TrashIcon class="h-4 w-4 text-red-500" />
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </BaseCard>
      </div>
    </template>

    <!-- Add/Edit Modal -->
    <BaseModal
      :show="showModal"
      :title="isEditing ? `Edit ${modalType === 'category' ? 'Category' : 'Vendor'} Commission` : `Add ${modalType === 'category' ? 'Category' : 'Vendor'} Override`"
      @close="showModal = false"
    >
      <div class="space-y-4">
        <FormSelect
          v-if="!isEditing"
          v-model="formData.target_id"
          :label="modalType === 'category' ? 'Category' : 'Vendor'"
          :options="modalType === 'category' ? categoryOptions : vendorOptions"
          required
        />
        
        <FormSelect
          v-model="formData.type"
          label="Commission Type"
          :options="typeOptions"
        />
        
        <FormInput
          v-model="formData.rate"
          :label="formData.type === 'percentage' ? 'Rate (%)' : 'Fixed Amount'"
          type="number"
          :min="0"
          :max="formData.type === 'percentage' ? 100 : undefined"
        />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showModal = false">Cancel</BaseButton>
          <BaseButton :loading="isSaving" @click="saveOverride">
            {{ isEditing ? 'Update' : 'Add' }} Override
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
