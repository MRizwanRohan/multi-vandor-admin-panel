<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Input — Text input component with validation -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useField } from 'vee-validate'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name?: string
  label?: string
  type?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  prefix?: string
  suffix?: string
  modelValue?: string | number
  min?: number | string
  max?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

// Use vee-validate field only when name is provided
const field = props.name
  ? useField<string | number>(() => props.name!, undefined, { syncVModel: true })
  : null

const value = field
  ? field.value
  : computed({
      get: () => props.modelValue ?? '',
      set: (v: string | number) => emit('update:modelValue', v),
    })

const errorMessage = computed(() => field ? field.errorMessage.value : props.error)
const showError = computed(() => {
  if (!errorMessage.value) return false
  return field ? field.meta.touched : true
})
const handleBlur = field ? field.handleBlur : () => {}

// Input classes based on state
const inputClasses = computed(() => {
  const base = 'form-input w-full'
  if (showError.value) {
    return `${base} border-danger-500 focus:border-danger-500 focus:ring-danger-500`
  }
  return base
})
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label
      v-if="label"
      :for="name"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Prefix -->
      <div
        v-if="prefix"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <span class="text-gray-500 dark:text-gray-400 sm:text-sm">{{ prefix }}</span>
      </div>

      <!-- Input -->
      <input
        :id="name"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          inputClasses,
          prefix ? 'pl-10' : '',
          suffix || errorMessage ? 'pr-10' : '',
        ]"
        v-model="value"
        @blur="handleBlur"
      />

      <!-- Suffix or error icon -->
      <div
        v-if="suffix || showError"
        class="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <ExclamationCircleIcon
          v-if="showError"
          class="h-5 w-5 text-danger-500"
        />
        <span
          v-else-if="suffix"
          class="text-gray-500 dark:text-gray-400 sm:text-sm"
        >
          {{ suffix }}
        </span>
      </div>
    </div>

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
