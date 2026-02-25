<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Phone Input — Bangladesh phone number input with +880 prefix -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useField } from 'vee-validate'
import { PhoneIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '1712345678',
  required: false,
  disabled: false,
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Use vee-validate field
const { value, errorMessage, handleBlur, meta } = useField<string>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
  }
)

const inputClasses = computed(() => {
  const base = 'form-input w-full pl-16'
  if (errorMessage.value && meta.touched) {
    return `${base} border-danger-500 focus:border-danger-500 focus:ring-danger-500`
  }
  return base
})

const formattedPhone = computed(() => {
  if (!value.value) return ''
  
  // Remove +880 if present
  let phone = value.value.replace(/^\+880/, '').replace(/\D/g, '')
  
  // Format: 01712-345678
  if (phone.length > 5) {
    return `${phone.slice(0, 5)}-${phone.slice(5)}`
  }
  return phone
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  let phoneValue = target.value.replace(/\D/g, '') // Remove non-digits
  
  // Ensure starts with 01
  if (phoneValue && !phoneValue.startsWith('0')) {
    phoneValue = '0' + phoneValue
  }
  
  // Limit to 11 digits
  phoneValue = phoneValue.slice(0, 11)
  
  value.value = phoneValue
  emit('update:modelValue', phoneValue)
}

const fullPhoneNumber = computed(() => {
  if (!value.value) return ''
  return `+880${value.value}`
})
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Input with Country Code -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none gap-2">
        <PhoneIcon class="h-5 w-5 text-gray-400" />
        <span class="text-gray-500 sm:text-sm border-r border-gray-300 dark:border-gray-600 pr-2">+880</span>
      </div>
      <input
        type="tel"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="inputClasses"
        maxlength="11"
        pattern="^01[0-9]{9}$"
        @input="handleInput"
        @blur="handleBlur"
      />
    </div>

    <!-- Hint -->
    <p v-if="hint && !errorMessage" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Formatted Display -->
    <p v-if="value && value.length === 11 && !errorMessage" class="text-sm text-gray-600 dark:text-gray-400">
      {{ fullPhoneNumber }}
    </p>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
