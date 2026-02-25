<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Select — Select dropdown component with validation -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useField } from 'vee-validate'
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/24/outline'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  name?: string
  label?: string
  options: Option[]
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  modelValue?: string | number | null
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

// Use vee-validate field only when name is provided
const field = props.name
  ? useField<string | number | null>(() => props.name!, undefined, { syncVModel: true })
  : null

const value = field
  ? field.value
  : computed({
      get: () => props.modelValue ?? null,
      set: (v: string | number | null) => emit('update:modelValue', v),
    })

const errorMessage = computed(() => field ? field.errorMessage.value : props.error)
const showError = computed(() => {
  if (!errorMessage.value) return false
  return field ? field.meta.touched : true
})

// Selected option
const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === value.value) || null
})

// Handle selection change
function handleChange(val: string | number) {
  if (field) {
    field.setValue(val)
  } else {
    emit('update:modelValue', val)
  }
}
</script>

<template>
  <div class="space-y-1">
    <Listbox
      :model-value="value"
      :disabled="disabled"
      @update:model-value="handleChange"
    >
      <div class="relative">
        <!-- Label -->
        <ListboxLabel
          v-if="label"
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ label }}
          <span v-if="required" class="text-danger-500">*</span>
        </ListboxLabel>

        <!-- Button -->
        <ListboxButton
          :class="[
            'form-input relative w-full cursor-pointer pr-10 text-left',
            showError
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
              : '',
            disabled ? 'cursor-not-allowed opacity-50' : '',
          ]"
        >
          <span
            :class="[
              'block truncate',
              selectedOption ? '' : 'text-gray-400',
            ]"
          >
            {{ selectedOption?.label || placeholder }}
          </span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon class="h-5 w-5 text-gray-400" />
          </span>
        </ListboxButton>

        <!-- Options -->
        <Transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
          >
            <ListboxOption
              v-for="option in options"
              :key="option.value"
              v-slot="{ active, selected }"
              :value="option.value"
              :disabled="option.disabled"
              as="template"
            >
              <li
                :class="[
                  'relative cursor-pointer select-none py-2 pl-10 pr-4',
                  active
                    ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/50 dark:text-primary-100'
                    : 'text-gray-900 dark:text-gray-100',
                  option.disabled ? 'cursor-not-allowed opacity-50' : '',
                ]"
              >
                <span
                  :class="[
                    'block truncate',
                    selected ? 'font-medium' : 'font-normal',
                  ]"
                >
                  {{ option.label }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400"
                >
                  <CheckIcon class="h-5 w-5" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>

    <!-- Hint or error message -->
    <p
      v-if="showError"
      class="text-sm text-danger-500"
    >
      {{ errorMessage }}
    </p>
    <p
      v-else-if="hint"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ hint }}
    </p>
  </div>
</template>
