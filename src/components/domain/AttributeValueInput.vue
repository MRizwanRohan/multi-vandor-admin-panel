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
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  required: false,
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

    <!-- Multi-select -->
    <select
      v-else-if="dataType === 'multiselect'"
      :id="inputId"
      :value="modelValue"
      :required="required"
      multiple
      :class="[inputClasses, 'min-h-[80px]', error ? errorInputClasses : '']"
      @change="handleMultiselectChange"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>

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
