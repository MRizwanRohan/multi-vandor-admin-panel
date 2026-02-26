<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Attribute Template List — Manage attribute templates -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { attributeTemplateService } from '@/services'
import { usePagination, useConfirm, useToast, useDebounce } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { AttributeTemplate, TableColumn } from '@/types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  SwatchIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const confirm = useConfirm()
const toast = useToast()
const pagination = usePagination()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Attribute Templates', [
    { label: 'Templates' },
  ], 'Manage product attribute templates')
  fetchTemplates()
})

// Data
const templates = ref<AttributeTemplate[]>([])
const isLoading = ref(true)

// Filters
const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)
const typeFilter = ref('')

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Single Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'boolean', label: 'Yes/No' },
]

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Template Name', sortable: true },
  { key: 'type', label: 'Data Type', sortable: true },
  { key: 'options', label: 'Options', align: 'center' },
  { key: 'categories', label: 'Categories', sortable: true, align: 'center' },
  { key: 'products', label: 'Products', sortable: true, align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch templates
async function fetchTemplates() {
  isLoading.value = true
  try {
    const response = await attributeTemplateService.getAll({
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      search: debouncedSearch.value || undefined,
      type: typeFilter.value || undefined,
    })
    templates.value = response.data || []
    pagination.totalItems.value = response.meta?.total || 0
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to load templates'
    toast.error(message)
    templates.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes (search is debounced)
watch([debouncedSearch, typeFilter], () => {
  pagination.goToPage(1)
  fetchTemplates()
})

watch(() => pagination.currentPage.value, fetchTemplates)

// Get type badge color
function getTypeBadgeColor(type: string): 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'gray' {
  const colors: Record<string, 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'gray'> = {
    text: 'blue',
    number: 'green',
    select: 'purple',
    multiselect: 'orange',
    boolean: 'pink',
  }
  return colors[type] || 'gray'
}

// Get type label
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: 'Text',
    number: 'Number',
    select: 'Single Select',
    multiselect: 'Multi Select',
    boolean: 'Yes/No',
  }
  return labels[type] || type
}

// Actions
function createTemplate() {
  router.push('/admin/attribute-templates/create')
}

function editTemplate(template: AttributeTemplate) {
  router.push(`/admin/attribute-templates/${template.slug}/edit`)
}

function viewTemplate(template: AttributeTemplate) {
  router.push(`/admin/attribute-templates/${template.slug}`)
}

async function deleteTemplate(template: AttributeTemplate) {
  const confirmed = await confirm.confirm({
    title: 'Delete Template',
    message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  
  if (!confirmed) return
  
  try {
    await attributeTemplateService.delete(template.id)
    toast.success('Template deleted successfully')
    fetchTemplates()
  } catch (error) {
    toast.error('Failed to delete template')
  }
}

async function toggleActive(template: AttributeTemplate) {
  try {
    await attributeTemplateService.toggleActive(template.id)
    template.is_active = !template.is_active
    toast.success(`Template ${template.is_active ? 'activated' : 'deactivated'}`)
  } catch (error) {
    toast.error('Failed to update template status')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Attribute Templates</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage reusable attribute templates for products
        </p>
      </div>
      <BaseButton @click="createTemplate">
        <PlusIcon class="h-5 w-5 mr-2" />
        Add Template
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <FormInput
            v-model="searchQuery"
            placeholder="Search templates..."
            :icon="MagnifyingGlassIcon"
          />
        </div>
        <div class="w-full sm:w-48">
          <FormSelect
            v-model="typeFilter"
            :options="typeOptions"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Templates Table -->
    <BaseCard>
      <template v-if="isLoading">
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </template>

      <template v-else-if="templates.length === 0">
        <EmptyState
          :icon="TagIcon"
          title="No templates found"
          description="Create your first attribute template to define product attributes."
        >
          <BaseButton @click="createTemplate">
            <PlusIcon class="h-5 w-5 mr-2" />
            Add Template
          </BaseButton>
        </EmptyState>
      </template>

      <template v-else>
        <DataTable
          :columns="columns"
          :data="templates"
          :pagination="pagination"
        >
          <template #cell-name="{ row }">
            <div class="flex items-center gap-3">
              <div class="shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <SwatchIcon v-if="row.data_type === 'color'" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <TagIcon v-else class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">{{ row.name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ row.slug }}</div>
              </div>
            </div>
          </template>

          <template #cell-type="{ row }">
            <BaseBadge :color="getTypeBadgeColor(row.data_type)">
              {{ getTypeLabel(row.data_type) }}
            </BaseBadge>
          </template>

          <template #cell-options="{ row }">
            <span class="text-gray-900 dark:text-white">
              {{ row.options?.length || 0 }}
            </span>
          </template>

          <template #cell-categories="{ row }">
            <span class="text-gray-900 dark:text-white">
              {{ row.categoriesCount ?? row.categories_count ?? 0 }}
            </span>
          </template>

          <template #cell-products="{ row }">
            <span class="text-gray-900 dark:text-white">
              {{ row.productsCount ?? row.products_count ?? '-' }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <button
              @click="toggleActive(row)"
              class="inline-flex"
            >
              <BaseBadge :color="row.is_active ? 'green' : 'gray'">
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </BaseBadge>
            </button>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center justify-end gap-2">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="viewTemplate(row)"
                title="View Details"
              >
                <EyeIcon class="h-4 w-4" />
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="editTemplate(row)"
                title="Edit"
              >
                <PencilIcon class="h-4 w-4" />
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="deleteTemplate(row)"
                title="Delete"
              >
                <TrashIcon class="h-4 w-4 text-red-500" />
              </BaseButton>
            </div>
          </template>
        </DataTable>
      </template>
    </BaseCard>
  </div>
</template>
