<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Searchable Select — Dropdown with search functionality -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField } from 'vee-validate'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Option {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
}

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  options: Option[]
  required?: boolean
  disabled?: boolean
  clearable?: boolean
  modelValue?: string | number | null
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search or select...',
  required: false,
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

// Use vee-validate field
const { value, errorMessage, handleBlur, meta } = useField<string | number | null>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
  }
)

const query = ref('')

const selectedOption = computed(() => 
  props.options.find(opt => opt.value === value.value)
)

const filteredOptions = computed(() => {
  if (!query.value) return props.options
  
  const lowerQuery = query.value.toLowerCase()
  return props.options.filter(opt => 
    opt.label.toLowerCase().includes(lowerQuery) ||
    opt.description?.toLowerCase().includes(lowerQuery)
  )
})

function handleChange(val: string | number | null) {
  value.value = val
  emit('update:modelValue', val)
  query.value = ''
}

function clear() {
  value.value = null
  emit('update:modelValue', null)
  query.value = ''
}
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Combobox -->
    <Combobox
      :model-value="value"
      :disabled="disabled"
      @update:model-value="handleChange"
    >
      <div class="relative">
        <ComboboxInput
          :display-value="(val: any) => selectedOption?.label || ''"
          :placeholder="placeholder"
          :class="[
            'form-input w-full pr-10',
            errorMessage && meta.touched ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''
          ]"
          @change="query = $event.target.value"
          @blur="handleBlur"
        />
        
        <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon class="h-5 w-5 text-gray-400" />
        </ComboboxButton>

        <!-- Clear Button -->
        <button
          v-if="clearable && value"
          type="button"
          class="absolute inset-y-0 right-8 flex items-center"
          @click="clear"
        >
          <XMarkIcon class="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>

        <!-- Options Dropdown -->
        <ComboboxOptions
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div v-if="filteredOptions.length === 0" class="px-4 py-2 text-sm text-gray-500">
            No results found
          </div>

          <ComboboxOption
            v-for="option in filteredOptions"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
            v-slot="{ active, selected }"
          >
            <li
              :class="[
                'relative cursor-pointer select-none py-2 pl-10 pr-4',
                active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-gray-100',
                option.disabled ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span :class="['block truncate', selected ? 'font-semibold' : 'font-normal']">
                {{ option.label }}
              </span>
              <span v-if="option.description" :class="['block text-sm', active ? 'text-primary-200' : 'text-gray-500']">
                {{ option.description }}
              </span>
              
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="active ? 'text-white' : 'text-primary-600'"
              >
                <CheckIcon class="h-5 w-5" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </div>
    </Combobox>

    <!-- Hint -->
    <p v-if="hint && !errorMessage" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
