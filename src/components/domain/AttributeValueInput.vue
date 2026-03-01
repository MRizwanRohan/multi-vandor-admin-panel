<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Attribute Value Input — Dynamic input by data_type -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number | boolean | string[]
  dataType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'date'
  label?: string
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  error?: string
  /** Show color swatches for color-type attributes */
  showColorSwatch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  required: false,
  showColorSwatch: false,
})

// ══════════════════════════════════════════════════════════════════════
// Color Swatch Support
// ══════════════════════════════════════════════════════════════════════
const colorNameToHex: Record<string, string> = {
  // Basic colors
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  purple: '#A855F7',
  pink: '#EC4899',
  black: '#1F2937',
  white: '#F9FAFB',
  gray: '#6B7280',
  grey: '#6B7280',
  brown: '#92400E',
  
  // Extended colors
  navy: '#1E3A5F',
  beige: '#D4C4A8',
  maroon: '#7F1D1D',
  olive: '#556B2F',
  teal: '#0D9488',
  cyan: '#06B6D4',
  coral: '#FF7F50',
  salmon: '#FA8072',
  khaki: '#C3B091',
  indigo: '#4F46E5',
  violet: '#8B5CF6',
  magenta: '#D946EF',
  gold: '#D97706',
  silver: '#9CA3AF',
  cream: '#FFFDD0',
  ivory: '#FFFFF0',
  tan: '#D2B48C',
  turquoise: '#40E0D0',
  lavender: '#E9D5FF',
  mint: '#A7F3D0',
  peach: '#FFDAB9',
  rose: '#FB7185',
  sky: '#38BDF8',
  lime: '#84CC16',
  aqua: '#00FFFF',
  sand: '#C2B280',
  wine: '#722F37',
  mustard: '#FFDB58',
  
  // Bangla to English mappings
  'লাল': '#EF4444',
  'নীল': '#3B82F6',
  'সবুজ': '#22C55E',
  'হলুদ': '#EAB308',
  'কমলা': '#F97316',
  'বেগুনি': '#A855F7',
  'গোলাপি': '#EC4899',
  'কালো': '#1F2937',
  'সাদা': '#F9FAFB',
  'ধূসর': '#6B7280',
  'বাদামি': '#92400E',
}

const getColorHex = (colorName: string): string | null => {
  const normalized = colorName.toLowerCase().trim()
  return colorNameToHex[normalized] || null
}

const isColorAttribute = computed(() => {
  const label = props.label?.toLowerCase() || ''
  return props.showColorSwatch || label.includes('color') || label.includes('রং') || label.includes('কালার')
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean | string[]): void
}>()

const inputId = computed(() =>
  `attr-${props.label?.toLowerCase().replace(/\s+/g, '-') || 'input'}-${Math.random().toString(36).slice(2, 7)}`
)

function updateValue(val: string | number | boolean | string[]) {
  emit('update:modelValue', val)
}

function handleTextInput(e: Event) {
  updateValue((e.target as HTMLInputElement).value)
}

function handleNumberInput(e: Event) {
  updateValue(Number((e.target as HTMLInputElement).value))
}

function handleBooleanChange(e: Event) {
  updateValue((e.target as HTMLInputElement).checked)
}

function handleSelectChange(e: Event) {
  updateValue((e.target as HTMLSelectElement).value)
}

function handleMultiselectChange(e: Event) {
  const options = (e.target as HTMLSelectElement).selectedOptions
  const values = Array.from(options).map(o => o.value)
  updateValue(values)
}

// Multi-select helper functions
function isOptionSelected(optionValue: string): boolean {
  if (!Array.isArray(props.modelValue)) return false
  return (props.modelValue as string[]).includes(optionValue)
}

function toggleOption(optionValue: string) {
  const currentValues = Array.isArray(props.modelValue) ? (props.modelValue as string[]) : []
  
  if (currentValues.includes(optionValue)) {
    // Remove option
    updateValue(currentValues.filter(v => v !== optionValue))
  } else {
    // Add option
    updateValue([...currentValues, optionValue])
  }
}

const inputClasses =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-400'

const errorInputClasses =
  'border-danger-500 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400'
</script>

<template>
  <div>
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Text input -->
    <input
      v-if="dataType === 'text'"
      :id="inputId"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :class="[inputClasses, error ? errorInputClasses : '']"
      @input="handleTextInput"
    />

    <!-- Number input -->
    <input
      v-else-if="dataType === 'number'"
      :id="inputId"
      type="number"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :class="[inputClasses, error ? errorInputClasses : '']"
      @input="handleNumberInput"
    />

    <!-- Boolean toggle -->
    <div v-else-if="dataType === 'boolean'" class="flex items-center gap-2">
      <button
        type="button"
        :class="[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          modelValue ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700',
        ]"
        role="switch"
        :aria-checked="Boolean(modelValue)"
        @click="updateValue(!modelValue)"
      >
        <span
          :class="[
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            modelValue ? 'translate-x-5' : 'translate-x-0',
          ]"
        />
      </button>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {{ modelValue ? 'Yes' : 'No' }}
      </span>
    </div>

    <!-- Select -->
    <select
      v-else-if="dataType === 'select'"
      :id="inputId"
      :value="modelValue"
      :required="required"
      :class="[inputClasses, error ? errorInputClasses : '']"
      @change="handleSelectChange"
    >
      <option value="" disabled>{{ placeholder || 'Select...' }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>

    <!-- Multi-select (checkbox style) -->
    <div
      v-else-if="dataType === 'multiselect'"
      class="rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800"
      :class="[error ? errorInputClasses : '']"
    >
      <div class="flex flex-wrap gap-2">
        <label
          v-for="opt in options"
          :key="opt.value"
          :class="[
            'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all select-none',
            isOptionSelected(opt.value)
              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/40 dark:text-primary-300'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:border-gray-500'
          ]"
        >
          <input
            type="checkbox"
            :value="opt.value"
            :checked="isOptionSelected(opt.value)"
            class="sr-only"
            @change="toggleOption(opt.value)"
          />
          <!-- Color Swatch -->
          <span
            v-if="isColorAttribute && getColorHex(opt.label)"
            class="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-500 shadow-inner flex-shrink-0"
            :style="{ backgroundColor: getColorHex(opt.label) }"
            :title="opt.label"
          />
          <span v-if="isOptionSelected(opt.value)" class="text-primary-500 dark:text-primary-400">✓</span>
          {{ opt.label }}
        </label>
      </div>
      
      <!-- Selected colors preview -->
      <div v-if="isColorAttribute && Array.isArray(modelValue) && (modelValue as string[]).length > 0" class="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
        <span class="text-xs text-gray-500 dark:text-gray-400">Selected:</span>
        <div class="flex gap-1">
          <span
            v-for="selectedValue in (modelValue as string[])"
            :key="selectedValue"
            class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700"
          >
            <span
              v-if="getColorHex(options?.find(o => o.value === selectedValue)?.label || '')"
              class="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-500"
              :style="{ backgroundColor: getColorHex(options?.find(o => o.value === selectedValue)?.label || '') }"
            />
            {{ options?.find(o => o.value === selectedValue)?.label || selectedValue }}
          </span>
        </div>
      </div>
      
      <p v-else-if="Array.isArray(modelValue) && (modelValue as string[]).length > 0" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ (modelValue as string[]).length }} selected
      </p>
    </div>

    <!-- Color picker -->
    <div v-else-if="dataType === 'color'" class="flex items-center gap-3">
      <input
        :id="inputId"
        type="color"
        :value="modelValue"
        class="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 p-1 dark:border-gray-600"
        @input="handleTextInput"
      />
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {{ modelValue }}
      </span>
    </div>

    <!-- Date -->
    <input
      v-else-if="dataType === 'date'"
      :id="inputId"
      type="date"
      :value="modelValue"
      :required="required"
      :class="[inputClasses, error ? errorInputClasses : '']"
      @input="handleTextInput"
    />

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
      {{ error }}
    </p>
  </div>
</template>
