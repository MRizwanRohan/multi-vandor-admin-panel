<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Searchable Select Simple — Dropdown with search (no vee-validate) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Option {
  value: string | number | null
  label: string
  description?: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  name?: string
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  options: Option[]
  required?: boolean
  disabled?: boolean
  clearable?: boolean
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

const query = ref('')

const selectedOption = computed(() => 
  props.options.find(opt => opt.value === props.modelValue)
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
  emit('update:modelValue', val)
  query.value = ''
}

function clear() {
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
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="handleChange"
    >
      <div class="relative">
        <ComboboxInput
          :display-value="(val: any) => selectedOption?.label || ''"
          :placeholder="placeholder"
          :class="[
            'form-input w-full pr-16',
            error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''
          ]"
          @change="query = $event.target.value"
        />
        
        <div class="absolute inset-y-0 right-0 flex items-center">
          <!-- Clear Button -->
          <button
            v-if="clearable && modelValue"
            type="button"
            class="flex h-full items-center px-2 text-gray-400 hover:text-gray-600"
            @click="clear"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
          
          <ComboboxButton class="flex h-full items-center pr-2">
            <ChevronUpDownIcon class="h-5 w-5 text-gray-400" />
          </ComboboxButton>
        </div>

        <!-- Options Dropdown -->
        <ComboboxOptions
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
        >
          <div v-if="filteredOptions.length === 0" class="px-4 py-3 text-sm text-gray-500">
            No results found
          </div>

          <ComboboxOption
            v-for="option in filteredOptions"
            :key="String(option.value)"
            :value="option.value"
            :disabled="option.disabled"
            v-slot="{ active, selected }"
          >
            <li
              :class="[
                'relative cursor-pointer select-none py-2 pl-10 pr-4',
                active ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/50 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100',
                option.disabled ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span :class="['block truncate', selected ? 'font-semibold' : 'font-normal']">
                {{ option.label }}
              </span>
              <span v-if="option.description" :class="['block text-sm', active ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500']">
                {{ option.description }}
              </span>
              
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400"
              >
                <CheckIcon class="h-5 w-5" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </div>
    </Combobox>

    <!-- Hint -->
    <p v-if="hint && !error" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Error -->
    <p v-if="error" class="text-sm text-danger-600 dark:text-danger-400">
      {{ error }}
    </p>
  </div>
</template>
