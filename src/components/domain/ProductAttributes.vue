<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Product Attributes — Dynamic attribute form for product creation -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { AttributeTemplate } from '@/types'
import type { ProductAttributeInput, VariantMatrixAttribute } from '@/types'
import AttributeValueInput from './AttributeValueInput.vue'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  /** Attribute templates from category */
  templates: AttributeTemplate[]
  /** Current attribute values */
  modelValue: ProductAttributeInput[]
  /** Product type - used to highlight variant-defining attrs */
  productType?: 'simple' | 'variable'
  /** Show only variant-defining attributes */
  variantOnly?: boolean
  /** Show only non-variant attributes */
  nonVariantOnly?: boolean
  /** Validation errors keyed by template_id */
  errors?: Record<number, string>
}

const props = withDefaults(defineProps<Props>(), {
  productType: 'simple',
  variantOnly: false,
  nonVariantOnly: false,
  errors: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProductAttributeInput[]): void
  /** Emits variant-defining attributes with their selected options */
  (e: 'variantAttributes', attrs: VariantMatrixAttribute[]): void
}>()

// Filter templates based on props
const filteredTemplates = computed(() => {
  return props.templates.filter((t) => {
    if (props.variantOnly) return t.is_variant_defining
    if (props.nonVariantOnly) return !t.is_variant_defining
    return true
  })
})

// Separate templates into groups
const variantDefiningTemplates = computed(() =>
  filteredTemplates.value.filter((t) => t.is_variant_defining)
)

const regularTemplates = computed(() =>
  filteredTemplates.value.filter((t) => !t.is_variant_defining)
)

// Check if a template should use multiselect (variant-defining in variable product)
const shouldUseMultiselect = (template: AttributeTemplate): boolean => {
  return props.productType === 'variable' && !!(template.is_variant_defining || (template as any).isVariantDefining)
    && (template.data_type === 'select' || template.data_type === 'multiselect')
}

// Get effective data_type (override select → multiselect for variant attrs in variable products)
const getEffectiveDataType = (template: AttributeTemplate): string => {
  if (shouldUseMultiselect(template)) return 'multiselect'
  return template.data_type
}

// Get value for a template
const getValue = (templateId: number): string | number | boolean | string[] => {
  const attr = props.modelValue.find((a) => a.template_id === templateId)
  const template = props.templates.find((t) => t.id === templateId)
  const val = attr?.value ?? getDefaultValue(templateId)
  // Ensure array for multiselect variant attrs
  if (template && shouldUseMultiselect(template) && !Array.isArray(val)) {
    return val ? [val as string] : []
  }
  return val
}

// Get default value based on data type
const getDefaultValue = (templateId: number): string | number | boolean | string[] => {
  const template = props.templates.find((t) => t.id === templateId)
  if (!template) return ''

  if (shouldUseMultiselect(template)) return []

  switch (template.data_type) {
    case 'boolean':
      return false
    case 'number':
      return 0
    case 'multiselect':
      return []
    default:
      return ''
  }
}

// Update value for a template
const updateValue = (templateId: number, value: string | number | boolean | string[]) => {
  const existing = props.modelValue.filter((a) => a.template_id !== templateId)
  emit('update:modelValue', [...existing, { template_id: templateId, value }])
}

// Convert template options to input format
const getSelectOptions = (template: AttributeTemplate) => {
  return (
    template.options?.map((opt) => ({
      label: opt.label,
      value: opt.value,
    })) ?? []
  )
}

// Watch for variant-defining attribute changes and emit
watch(
  () => props.modelValue,
  () => {
    if (props.productType === 'variable') {
      const variantAttrs: VariantMatrixAttribute[] = variantDefiningTemplates.value
        .map((template) => {
          const value = getValue(template.id)
          // For select/multiselect, get selected options
          const selectedValues = Array.isArray(value) ? value : value ? [value] : []

          const selectedOptions = template.options
            ?.filter((opt) => selectedValues.includes(opt.value))
            .map((opt) => ({
              id: opt.id,
              value: opt.value,
              label: opt.label,
            })) ?? []

          return {
            id: template.id,
            name: template.name,
            options: selectedOptions,
          }
        })
        .filter((attr) => attr.options.length > 0)

      emit('variantAttributes', variantAttrs)
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="space-y-6">
    <!-- Empty state -->
    <div
      v-if="filteredTemplates.length === 0"
      class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600"
    >
      <InformationCircleIcon class="mx-auto h-10 w-10 text-gray-400" />
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        এই ক্যাটাগরির জন্য কোনো অ্যাট্রিবিউট টেমপ্লেট নেই।
      </p>
    </div>

    <!-- Variant-Defining Attributes Section -->
    <div
      v-if="variantDefiningTemplates.length > 0 && !nonVariantOnly"
      class="space-y-4"
    >
      <div class="flex items-center gap-2">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
          ভেরিয়েন্ট নির্ধারণকারী অ্যাট্রিবিউট
        </h4>
        <span
          v-if="productType === 'variable'"
          class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
        >
          ভেরিয়েন্ট তৈরিতে ব্যবহৃত হবে
        </span>
      </div>

      <p
        v-if="productType === 'variable'"
        class="text-xs text-gray-500 dark:text-gray-400"
      >
        নির্বাচিত অপশনগুলো দিয়ে প্রোডাক্ট ভেরিয়েন্ট তৈরি হবে। যেমন: সাইজ (S, M, L) × কালার (Red, Blue) = ৬টি ভেরিয়েন্ট
      </p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          v-for="template in variantDefiningTemplates"
          :key="template.id"
          class="rounded-lg border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-900/20"
        >
          <AttributeValueInput
            :model-value="getValue(template.id)"
            :data-type="getEffectiveDataType(template)"
            :label="template.name"
            :placeholder="template.placeholder || `${template.name} নির্বাচন করুন`"
            :options="getSelectOptions(template)"
            :required="template.is_required"
            :error="errors[template.id]"
            @update:model-value="updateValue(template.id, $event)"
          />
          <!-- Selected options preview for multiselect -->
          <div v-if="shouldUseMultiselect(template) && Array.isArray(getValue(template.id)) && (getValue(template.id) as string[]).length > 0" class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="val in (getValue(template.id) as string[])"
              :key="val"
              class="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
            >
              {{ getSelectOptions(template).find(o => o.value === val)?.label || val }}
            </span>
          </div>
          <p
            v-if="template.help_text"
            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {{ template.help_text }}
          </p>
          <p
            v-if="template.unit"
            class="mt-1 text-xs text-gray-400"
          >
            একক: {{ template.unit }}
          </p>
        </div>
      </div>
    </div>

    <!-- Regular Attributes Section -->
    <div v-if="regularTemplates.length > 0 && !variantOnly" class="space-y-4">
      <h4
        v-if="variantDefiningTemplates.length > 0"
        class="text-sm font-semibold text-gray-900 dark:text-white"
      >
        অন্যান্য অ্যাট্রিবিউট
      </h4>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          v-for="template in regularTemplates"
          :key="template.id"
          class="space-y-1"
        >
          <AttributeValueInput
            :model-value="getValue(template.id)"
            :data-type="template.data_type"
            :label="template.name"
            :placeholder="template.placeholder || `${template.name} লিখুন`"
            :options="getSelectOptions(template)"
            :required="template.is_required"
            :error="errors[template.id]"
            @update:model-value="updateValue(template.id, $event)"
          />
          <p
            v-if="template.help_text"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ template.help_text }}
          </p>
          <p
            v-if="template.unit"
            class="text-xs text-gray-400"
          >
            একক: {{ template.unit }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
