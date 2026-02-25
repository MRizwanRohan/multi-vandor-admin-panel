<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Date Picker — Date selection with calendar -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField } from 'vee-validate'
import { useDate } from '@/composables'
import { CalendarIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  required?: boolean
  minDate?: string
  maxDate?: string
  disabled?: boolean
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select date',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { formatDate } = useDate()

// Use vee-validate field
const { value, errorMessage, handleBlur, meta } = useField<string>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
  }
)

const inputClasses = computed(() => {
  const base = 'form-input w-full pl-10'
  if (errorMessage.value && meta.touched) {
    return `${base} border-danger-500 focus:border-danger-500 focus:ring-danger-500`
  }
  return base
})

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  value.value = target.value
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <CalendarIcon class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="date"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :min="minDate"
        :max="maxDate"
        :class="inputClasses"
        @input="handleChange"
        @blur="handleBlur"
      />
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
