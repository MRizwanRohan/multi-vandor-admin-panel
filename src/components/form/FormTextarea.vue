<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Textarea — Textarea component with validation -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useField } from 'vee-validate'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name?: string
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  rows?: number
  maxlength?: number
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
  rows: 4,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Use vee-validate field only when name is provided
const field = props.name
  ? useField<string>(() => props.name!, undefined, { syncVModel: true })
  : null

const value = field
  ? field.value
  : computed({
      get: () => props.modelValue ?? '',
      set: (v: string) => emit('update:modelValue', v),
    })

const errorMessage = computed(() => field ? field.errorMessage.value : props.error)
const showError = computed(() => {
  if (!errorMessage.value) return false
  return field ? field.meta.touched : true
})
const handleBlur = field ? field.handleBlur : () => {}

// Character count
const charCount = computed(() => {
  if (!props.maxlength) return null
  const length = (value.value || '').length
  return `${length}/${props.maxlength}`
})

// Input classes based on state
const textareaClasses = computed(() => {
  const base = 'form-input w-full resize-none'
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

    <!-- Textarea -->
    <div class="relative">
      <textarea
        :id="name"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :maxlength="maxlength"
        :class="textareaClasses"
        v-model="value"
        @blur="handleBlur"
      />

      <!-- Error icon -->
      <div
        v-if="showError"
        class="pointer-events-none absolute right-3 top-3"
      >
        <ExclamationCircleIcon class="h-5 w-5 text-danger-500" />
      </div>
    </div>

    <!-- Footer with hint/error and char count -->
    <div class="flex items-center justify-between">
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
      <span v-else />

      <span
        v-if="charCount"
        class="text-sm text-gray-400 dark:text-gray-500"
      >
        {{ charCount }}
      </span>
    </div>
  </div>
</template>
