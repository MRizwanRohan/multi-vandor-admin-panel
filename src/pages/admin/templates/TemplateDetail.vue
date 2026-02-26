<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Attribute Template Detail — View template details -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { attributeTemplateService } from '@/services'
import { useToast, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { AttributeTemplate } from '@/types'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  SwatchIcon,
  FunnelIcon,
  CubeIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()

// Data
const template = ref<AttributeTemplate | null>(null)
const isLoading = ref(true)

// Get slug from route
const slug = computed(() => route.params.slug as string)

// Set page info
onMounted(async () => {
  await fetchTemplate()
})

// Fetch template details
async function fetchTemplate() {
  if (!slug.value) {
    router.push('/admin/attribute-templates')
    return
  }
  
  isLoading.value = true
  try {
    template.value = await attributeTemplateService.getBySlug(slug.value)
    
    breadcrumbStore.setPageInfo(template.value.name, [
      { label: 'Attribute Templates', to: '/admin/attribute-templates' },
      { label: template.value.name },
    ], `View details for "${template.value.name}" attribute template`)
  } catch (error) {
    toast.error('Failed to load template')
    router.push('/admin/attribute-templates')
  } finally {
    isLoading.value = false
  }
}

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

// Navigation
function goBack() {
  router.push('/admin/attribute-templates')
}

function editTemplate() {
  if (!template.value) return
  router.push(`/admin/attribute-templates/${template.value.slug}/edit`)
}

// Actions
async function toggleActive() {
  if (!template.value) return
  
  try {
    const updated = await attributeTemplateService.toggleActive(template.value.slug)
    template.value.is_active = updated.is_active
    toast.success(`Template ${updated.is_active ? 'activated' : 'deactivated'}`)
  } catch (error) {
    toast.error('Failed to update template status')
  }
}

async function deleteTemplate() {
  if (!template.value) return
  
  const confirmed = await confirm.confirm({
    title: 'Delete Template',
    message: `Are you sure you want to delete "${template.value.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  
  if (!confirmed) return
  
  try {
    await attributeTemplateService.delete(template.value.slug)
    toast.success('Template deleted successfully')
    router.push('/admin/attribute-templates')
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error(error.response.data.message || 'Template is in use and cannot be deleted')
    } else {
      toast.error('Failed to delete template')
    }
  }
}

// Computed
const activeOptions = computed(() => 
  template.value?.options?.filter(o => o.is_active && !o.is_deprecated) || []
)

const deprecatedOptions = computed(() => 
  template.value?.options?.filter(o => o.is_deprecated) || []
)

const inactiveOptions = computed(() => 
  template.value?.options?.filter(o => !o.is_active && !o.is_deprecated) || []
)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <template v-if="isLoading">
      <div class="flex items-center justify-center py-24">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    </template>

    <template v-else-if="template">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <BaseButton variant="ghost" size="sm" @click="goBack">
            <ArrowLeftIcon class="h-5 w-5" />
          </BaseButton>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ template.name }}</h1>
              <BaseBadge :color="template.is_active ? 'green' : 'gray'">
                {{ template.is_active ? 'Active' : 'Inactive' }}
              </BaseBadge>
            </div>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ template.slug }} · Created {{ new Date(template.created_at).toLocaleDateString() }}
            </p>
          </div>
        </div>
        <div class="flex gap-3">
          <BaseButton variant="secondary" @click="toggleActive">
            {{ template.is_active ? 'Deactivate' : 'Activate' }}
          </BaseButton>
          <BaseButton variant="secondary" @click="editTemplate">
            <PencilIcon class="h-4 w-4 mr-2" />
            Edit
          </BaseButton>
          <BaseButton variant="danger" @click="deleteTemplate">
            <TrashIcon class="h-4 w-4 mr-2" />
            Delete
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Information -->
          <BaseCard title="Basic Information">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.name }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white font-mono">{{ template.slug }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Data Type</dt>
                <dd class="mt-1">
                  <BaseBadge :color="getTypeBadgeColor(template.data_type)">
                    {{ getTypeLabel(template.data_type) }}
                  </BaseBadge>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Display Order</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.display_order }}</dd>
              </div>
              <div class="sm:col-span-2" v-if="template.description">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.description }}</dd>
              </div>
              <div v-if="template.unit">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Unit</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.unit }}</dd>
              </div>
              <div v-if="template.placeholder">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Placeholder</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.placeholder }}</dd>
              </div>
              <div v-if="template.help_text" class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Help Text</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.help_text }}</dd>
              </div>
            </dl>
          </BaseCard>

          <!-- Validation Rules (for number type) -->
          <BaseCard v-if="template.data_type === 'number' && template.validation_rules" title="Validation Rules">
            <dl class="grid grid-cols-2 gap-4">
              <div v-if="template.validation_rules.min !== undefined">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Minimum Value</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.validation_rules.min }}</dd>
              </div>
              <div v-if="template.validation_rules.max !== undefined">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Maximum Value</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.validation_rules.max }}</dd>
              </div>
            </dl>
          </BaseCard>

          <!-- Options (for select/multiselect) -->
          <BaseCard 
            v-if="['select', 'multiselect'].includes(template.data_type)" 
            title="Options"
          >
            <template v-if="!template.options || template.options.length === 0">
              <EmptyState
                :icon="SwatchIcon"
                title="No options"
                description="This template has no options defined."
              />
            </template>

            <template v-else>
              <div class="space-y-4">
                <!-- Active Options -->
                <div v-if="activeOptions.length > 0">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Active Options ({{ activeOptions.length }})
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="option in activeOptions"
                      :key="option.id"
                      class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          v-if="option.color_code"
                          class="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                          :style="{ backgroundColor: option.color_code }"
                        ></div>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-white">{{ option.label }}</div>
                          <div class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ option.value }}</div>
                        </div>
                      </div>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        #{{ option.display_order }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Deprecated Options -->
                <div v-if="deprecatedOptions.length > 0">
                  <h4 class="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                    Deprecated Options ({{ deprecatedOptions.length }})
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="option in deprecatedOptions"
                      :key="option.id"
                      class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg opacity-75"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          v-if="option.color_code"
                          class="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                          :style="{ backgroundColor: option.color_code }"
                        ></div>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-white">{{ option.label }}</div>
                          <div class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ option.value }}</div>
                        </div>
                        <BaseBadge color="orange">Deprecated</BaseBadge>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Inactive Options -->
                <div v-if="inactiveOptions.length > 0">
                  <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Inactive Options ({{ inactiveOptions.length }})
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="option in inactiveOptions"
                      :key="option.id"
                      class="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          v-if="option.color_code"
                          class="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                          :style="{ backgroundColor: option.color_code }"
                        ></div>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-white">{{ option.label }}</div>
                          <div class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ option.value }}</div>
                        </div>
                        <BaseBadge color="gray">Inactive</BaseBadge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Behavior Flags -->
          <BaseCard title="Behavior">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <CheckCircleIcon v-if="template.is_required" class="h-5 w-5 text-green-500" />
                  <XCircleIcon v-else class="h-5 w-5 text-gray-400" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Required</span>
                </div>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <FunnelIcon v-if="template.is_filterable" class="h-5 w-5 text-green-500" />
                  <FunnelIcon v-else class="h-5 w-5 text-gray-400" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Filterable</span>
                </div>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <CubeIcon v-if="template.is_variant_defining" class="h-5 w-5 text-green-500" />
                  <CubeIcon v-else class="h-5 w-5 text-gray-400" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Variant Defining</span>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Usage Stats -->
          <BaseCard title="Usage">
            <dl class="space-y-4">
              <div class="flex items-center justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Categories</dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ template.categories_count ?? template.category_count ?? 0 }}
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Products</dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ template.product_count ?? 0 }}
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Options</dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ template.options?.length ?? 0 }}
                </dd>
              </div>
            </dl>
          </BaseCard>

          <!-- Metadata -->
          <BaseCard title="Metadata">
            <dl class="space-y-4">
              <div v-if="template.creator">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Created By</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ template.creator.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500 dark:text-gray-400">Created At</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ new Date(template.created_at).toLocaleString() }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500 dark:text-gray-400">Updated At</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ new Date(template.updated_at).toLocaleString() }}
                </dd>
              </div>
            </dl>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>
