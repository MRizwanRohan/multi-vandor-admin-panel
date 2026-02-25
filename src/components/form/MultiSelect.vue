<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Multi Select — Multiple selection dropdown -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField } from 'vee-validate'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
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
  maxSelections?: number
  modelValue?: (string | number)[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select options',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: (string | number)[]): void
}>()

// Use vee-validate field
const { value, errorMessage, handleBlur, meta } = useField<(string | number)[]>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
    initialValue: [],
  }
)

const selectedOptions = computed(() => 
  props.options.filter(opt => value.value?.includes(opt.value))
)

const canAddMore = computed(() => {
  if (!props.maxSelections) return true
  return (value.value?.length || 0) < props.maxSelections
})

function handleChange(val: (string | number)[]) {
  value.value = val
  emit('update:modelValue', val)
}

function removeOption(optValue: string | number) {
  if (!value.value) return
  value.value = value.value.filter(v => v !== optValue)
  emit('update:modelValue', value.value)
}

function clearAll() {
  value.value = []
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Listbox -->
    <Listbox
      :model-value="value"
      :disabled="disabled"
      multiple
      @update:model-value="handleChange"
    >
      <div class="relative">
        <!-- Selected Values Display -->
        <ListboxButton
          :class="[
            'form-input w-full min-h-[42px] flex items-center justify-between gap-2',
            errorMessage && meta.touched ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''
          ]"
          @blur="handleBlur"
        >
          <div class="flex flex-wrap gap-1 flex-1">
            <span
              v-for="option in selectedOptions"
              :key="option.value"
              class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-sm"
            >
              {{ option.label }}
              <button
                type="button"
                class="hover:text-primary-900 dark:hover:text-primary-100"
                @click.stop="removeOption(option.value)"
              >
                <XMarkIcon class="h-3 w-3" />
              </button>
            </span>
            <span v-if="!selectedOptions.length" class="text-gray-500">
              {{ placeholder }}
            </span>
          </div>
          <ChevronUpDownIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
        </ListboxButton>

        <!-- Options Dropdown -->
        <ListboxOptions
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <ListboxOption
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled || (!value?.includes(option.value) && !canAddMore)"
            v-slot="{ active, selected }"
          >
            <li
              :class="[
                'relative cursor-pointer select-none py-2 pl-10 pr-4',
                active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-gray-100',
                option.disabled || (!value?.includes(option.value) && !canAddMore) ? 'opacity-50 cursor-not-allowed' : ''
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
          </ListboxOption>
        </ListboxOptions>
      </div>
    </Listbox>

    <!-- Info -->
    <div class="flex items-center justify-between">
      <p v-if="hint && !errorMessage" class="text-sm text-gray-500 dark:text-gray-400">
        {{ hint }}
      </p>
      <div class="flex items-center gap-2">
        <p v-if="maxSelections" class="text-sm text-gray-500 dark:text-gray-400">
          {{ value?.length || 0 }} / {{ maxSelections }}
        </p>
        <button
          v-if="selectedOptions.length"
          type="button"
          class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          @click="clearAll"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
