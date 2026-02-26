<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Attribute Template Form — Create/Edit attribute template -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { attributeTemplateService } from '@/services'
import { useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import type { AttributeTemplate, AttributeTemplateOption } from '@/types'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Mode detection
const templateSlug = computed(() => {
  const raw = route.params.slug as string | undefined
  if (!raw || raw === 'create') return undefined
  return raw
})
const isEditMode = computed(() => templateSlug.value !== undefined)
const pageTitle = computed(() => isEditMode.value ? 'Edit Template' : 'Add Template')

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Attribute Templates', to: '/admin/attribute-templates' },
    { label: pageTitle.value },
  ])
  
  if (isEditMode.value) {
    fetchTemplate()
  }
})

// Data
const isLoading = ref(false)
const options = ref<Array<{
  id?: number
  value: string
  label: string
  color_code: string
  image_url: string
  is_active: boolean
  is_deprecated: boolean
  display_order: number
}>>([]) 

// Form validation
const templateSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  data_type: z.enum(['text', 'number', 'select', 'multiselect', 'boolean']),
  is_required: z.boolean(),
  is_filterable: z.boolean(),
  is_variant_defining: z.boolean(),
  is_active: z.boolean(),
  display_order: z.coerce.number().int().min(0),
  unit: z.string().optional(),
  placeholder: z.string().optional(),
  help_text: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: templateSchema,
  initialValues: {
    name: '',
    description: '',
    data_type: 'text' as const,
    is_required: false,
    is_filterable: false,
    is_variant_defining: false,
    is_active: true,
    display_order: 0,
    unit: '',
    placeholder: '',
    help_text: '',
    min: undefined as number | undefined,
    max: undefined as number | undefined,
  },
})

const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')
const [dataType, dataTypeAttrs] = defineField('data_type')
const [isRequired, isRequiredAttrs] = defineField('is_required')
const [isFilterable, isFilterableAttrs] = defineField('is_filterable')
const [isVariantDefining, isVariantDefiningAttrs] = defineField('is_variant_defining')
const [isActive, isActiveAttrs] = defineField('is_active')
const [displayOrder, displayOrderAttrs] = defineField('display_order')
const [unit, unitAttrs] = defineField('unit')
const [placeholder, placeholderAttrs] = defineField('placeholder')
const [helpText, helpTextAttrs] = defineField('help_text')
const [min, minAttrs] = defineField('min')
const [max, maxAttrs] = defineField('max')

// Data type options (per API)
const dataTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Single Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'boolean', label: 'Yes/No' },
]

// Show options editor for select types only
const showOptionsEditor = computed(() =>
  ['select', 'multiselect'].includes(dataType.value)
)

// Show number validation for number type
const showNumberValidation = computed(() => dataType.value === 'number')

// Fetch template for editing
async function fetchTemplate() {
  if (!templateSlug.value) return
  
  isLoading.value = true
  try {
    const template = await attributeTemplateService.getBySlug(templateSlug.value)
    setValues({
      name: template.name,
      description: template.description || '',
      data_type: template.data_type as 'text',
      is_required: template.is_required,
      is_filterable: template.is_filterable,
      is_variant_defining: template.is_variant_defining,
      is_active: template.is_active,
      display_order: template.display_order,
      unit: template.unit || '',
      placeholder: template.placeholder || '',
      help_text: template.help_text || '',
      min: template.validation_rules?.min,
      max: template.validation_rules?.max,
    })
    options.value = template.options?.map((opt, index) => ({
      id: opt.id,
      value: opt.value,
      label: opt.label,
      color_code: opt.color_code || '',
      image_url: opt.image_url || '',
      is_active: opt.is_active,
      is_deprecated: opt.is_deprecated || false,
      display_order: opt.display_order || index,
    })) || []
  } catch (error) {
    toast.error('Failed to fetch template')
    router.push('/admin/attribute-templates')
  } finally {
    isLoading.value = false
  }
}

// Option management
function addOption() {
  options.value.push({
    value: '',
    label: '',
    color_code: '',
    image_url: '',
    is_active: true,
    is_deprecated: false,
    display_order: options.value.length,
  })
}

function removeOption(index: number) {
  options.value.splice(index, 1)
  // Reorder
  options.value.forEach((opt, i) => {
    opt.display_order = i
  })
}

function moveOption(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= options.value.length) return
  
  const temp = options.value[index]
  options.value[index] = options.value[newIndex]
  options.value[newIndex] = temp
  
  // Update display order
  options.value.forEach((opt, i) => {
    opt.display_order = i
  })
}

// Auto-generate value from label
function updateValue(index: number, label: string) {
  options.value[index].label = label
  if (!options.value[index].value || options.value[index].value === '') {
    options.value[index].value = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }
}

// Submit form
const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      name: values.name,
      description: values.description,
      data_type: values.data_type as 'text',
      is_required: values.is_required,
      is_filterable: values.is_filterable,
      is_variant_defining: values.is_variant_defining,
      is_active: values.is_active,
      display_order: values.display_order,
      unit: values.unit || undefined,
      placeholder: values.placeholder || undefined,
      help_text: values.help_text || undefined,
      validation_rules: showNumberValidation.value
        ? { min: values.min, max: values.max }
        : undefined,
      options: showOptionsEditor.value
        ? options.value.map(opt => ({
            id: opt.id,
            value: opt.value,
            label: opt.label,
            color_code: opt.color_code || undefined,
            is_active: opt.is_active,
            display_order: opt.display_order,
          }))
        : undefined,
    }
    
    if (isEditMode.value && templateSlug.value) {
      await attributeTemplateService.update(templateSlug.value, payload)
      toast.success('Template updated successfully')
    } else {
      await attributeTemplateService.create(payload)
      toast.success('Template created successfully')
    }
    
    router.push('/admin/attribute-templates')
  } catch (error) {
    toast.error(isEditMode.value ? 'Failed to update template' : 'Failed to create template')
  }
})

// Navigation
function goBack() {
  router.push('/admin/attribute-templates')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" @click="goBack">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
      </div>
      <div class="flex gap-3">
        <BaseButton variant="secondary" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">
          {{ isEditMode ? 'Update Template' : 'Create Template' }}
        </BaseButton>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Information -->
        <BaseCard title="Basic Information">
          <div class="space-y-4">
            <FormInput
              v-model="name"
              v-bind="nameAttrs"
              label="Template Name"
              placeholder="e.g., Color, Size, Material"
              :error="errors.name"
              required
            />
            
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
              label="Description"
              placeholder="Describe what this attribute represents"
              :rows="3"
              :error="errors.description"
            />
            
            <FormSelect
              v-model="dataType"
              v-bind="dataTypeAttrs"
              label="Data Type"
              :options="dataTypeOptions"
              :error="errors.data_type"
              required
            />
          </div>
        </BaseCard>

        <!-- Options (for select types) -->
        <BaseCard v-if="showOptionsEditor" title="Attribute Options">
          <div class="space-y-4">
            <div v-if="options.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No options added yet. Click the button below to add options.
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="(option, index) in options"
                :key="index"
                class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                :class="{ 'opacity-60': option.is_deprecated }"
              >
                <button
                  type="button"
                  class="text-gray-400 cursor-grab mt-2"
                >
                  <Bars3Icon class="h-5 w-5" />
                </button>
                
                <div class="flex-1 space-y-2">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormInput
                      v-model="option.label"
                      placeholder="Label (e.g., Red)"
                      @update:model-value="(val) => updateValue(index, val)"
                    />
                    <FormInput
                      v-model="option.value"
                      placeholder="Value (e.g., red)"
                    />
                    <div class="flex items-center gap-2">
                      <input
                        v-model="option.color_code"
                        type="color"
                        class="h-10 w-12 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                        title="Color code (optional)"
                      />
                      <FormInput
                        v-model="option.color_code"
                        placeholder="#FF0000"
                        class="flex-1"
                      />
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <BaseBadge :color="option.is_active ? 'green' : 'gray'" class="whitespace-nowrap">
                      {{ option.is_active ? 'Active' : 'Inactive' }}
                    </BaseBadge>
                    <BaseBadge v-if="option.is_deprecated" color="orange" class="whitespace-nowrap">
                      Deprecated
                    </BaseBadge>
                  </div>
                </div>
                
                <div class="flex items-center gap-1">
                  <BaseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    :disabled="index === 0"
                    @click="moveOption(index, 'up')"
                    title="Move up"
                  >
                    ↑
                  </BaseButton>
                  <BaseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    :disabled="index === options.length - 1"
                    @click="moveOption(index, 'down')"
                    title="Move down"
                  >
                    ↓
                  </BaseButton>
                  <BaseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="removeOption(index)"
                    title="Remove option"
                  >
                    <TrashIcon class="h-4 w-4 text-red-500" />
                  </BaseButton>
                </div>
              </div>
            </div>
            
            <BaseButton type="button" variant="secondary" @click="addOption">
              <PlusIcon class="h-4 w-4 mr-2" />
              Add Option
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Number Validation -->
        <BaseCard v-if="showNumberValidation" title="Number Validation">
          <div class="grid grid-cols-2 gap-4">
            <FormInput
              v-model="min"
              v-bind="minAttrs"
              label="Minimum Value"
              type="number"
              placeholder="0"
              :error="errors.min"
            />
            <FormInput
              v-model="max"
              v-bind="maxAttrs"
              label="Maximum Value"
              type="number"
              placeholder="100"
              :error="errors.max"
            />
            <FormInput
              v-model="unit"
              v-bind="unitAttrs"
              label="Unit"
              placeholder="e.g., kg, cm, ml"
              :error="errors.unit"
            />
          </div>
        </BaseCard>

        <!-- Display Settings -->
        <BaseCard title="Display Settings">
          <div class="space-y-4">
            <FormInput
              v-model="placeholder"
              v-bind="placeholderAttrs"
              label="Placeholder Text"
              placeholder="e.g., Select an option..."
              :error="errors.placeholder"
            />
            
            <FormTextarea
              v-model="helpText"
              v-bind="helpTextAttrs"
              label="Help Text"
              placeholder="Additional instructions for users"
              :rows="2"
              :error="errors.help_text"
            />
            
            <FormInput
              v-model="displayOrder"
              v-bind="displayOrderAttrs"
              label="Display Order"
              type="number"
              :min="0"
              :error="errors.display_order"
            />
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status -->
        <BaseCard title="Status">
          <div class="space-y-4">
            <FormSwitch
              v-model="isActive"
              v-bind="isActiveAttrs"
              label="Active"
            />
          </div>
        </BaseCard>

        <!-- Behavior -->
        <BaseCard title="Behavior">
          <div class="space-y-4">
            <FormSwitch
              v-model="isRequired"
              v-bind="isRequiredAttrs"
              label="Required"
            />
            
            <FormSwitch
              v-model="isFilterable"
              v-bind="isFilterableAttrs"
              label="Filterable"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              Show in product filters on storefront
            </p>
            
            <FormSwitch
              v-model="isVariantDefining"
              v-bind="isVariantDefiningAttrs"
              label="Variant Defining"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              Different values create separate product variants
            </p>
          </div>
        </BaseCard>
      </div>
    </form>
  </div>
</template>
