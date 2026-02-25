<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Money Input — Currency input with ৳ prefix -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useField } from 'vee-validate'
import { useCurrency } from '@/composables'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  min?: number
  max?: number
  step?: number
  modelValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0.00',
  required: false,
  disabled: false,
  readonly: false,
  min: 0,
  step: 1,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const currency = useCurrency()

// Use vee-validate field
const { value, errorMessage, handleBlur, meta } = useField<number>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
  }
)

const inputClasses = computed(() => {
  const base = 'form-input w-full pl-8'
  if (errorMessage.value && meta.touched) {
    return `${base} border-danger-500 focus:border-danger-500 focus:ring-danger-500`
  }
  return base
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const numValue = parseFloat(target.value)
  value.value = isNaN(numValue) ? 0 : numValue
  emit('update:modelValue', value.value)
}
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Input with Currency Symbol -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span class="text-gray-500 sm:text-sm">৳</span>
      </div>
      <input
        type="number"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
      />
    </div>

    <!-- Hint -->
    <p v-if="hint && !errorMessage" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Formatted Value Display -->
    <p v-if="value && !errorMessage" class="text-sm text-gray-600 dark:text-gray-400">
      {{ currency.formatCurrency(value) }}
    </p>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
