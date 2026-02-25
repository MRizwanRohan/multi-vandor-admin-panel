<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Radio — Radio button group with validation -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { useField } from 'vee-validate'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Option {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
}

interface Props {
  name: string
  label?: string
  options: Option[]
  hint?: string
  required?: boolean
  inline?: boolean
  modelValue?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  inline: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

// Use vee-validate field
const { value, errorMessage, handleBlur, meta } = useField<string | number>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
  }
)

function handleChange(optionValue: string | number) {
  value.value = optionValue
  emit('update:modelValue', optionValue)
}
</script>

<template>
  <div class="space-y-2">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Radio Options -->
    <div :class="inline ? 'flex flex-wrap gap-4' : 'space-y-3'">
      <label
        v-for="option in options"
        :key="option.value"
        :class="[
          'relative flex items-start cursor-pointer',
          option.disabled ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        <div class="flex items-center h-5">
          <input
            :id="`${name}-${option.value}`"
            type="radio"
            :name="name"
            :value="option.value"
            :checked="value === option.value"
            :disabled="option.disabled"
            class="form-radio h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
            @change="handleChange(option.value)"
            @blur="handleBlur"
          />
        </div>
        <div class="ml-3 text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ option.label }}
          </span>
          <p v-if="option.description" class="text-gray-500 dark:text-gray-400">
            {{ option.description }}
          </p>
        </div>
      </label>
    </div>

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
