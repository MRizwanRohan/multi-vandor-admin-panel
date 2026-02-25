<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Checkbox — Checkbox input component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { useField } from 'vee-validate'

interface Props {
  name: string
  label?: string
  description?: string
  disabled?: boolean
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// Use vee-validate field
const { value, handleChange, meta, errorMessage } = useField<boolean>(
  () => props.name,
  undefined,
  {
    type: 'checkbox',
    checkedValue: true,
    uncheckedValue: false,
    syncVModel: true,
  }
)
</script>

<template>
  <div class="relative flex items-start">
    <div class="flex h-6 items-center">
      <input
        :id="name"
        :name="name"
        type="checkbox"
        :disabled="disabled"
        :checked="value"
        class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
        @change="handleChange"
      />
    </div>
    <div class="ml-3 text-sm leading-6">
      <label
        :for="name"
        :class="[
          'font-medium',
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-900 dark:text-white',
        ]"
      >
        {{ label }}
      </label>
      <p
        v-if="description"
        class="text-gray-500 dark:text-gray-400"
      >
        {{ description }}
      </p>
    </div>
  </div>

  <!-- Error message -->
  <p
    v-if="errorMessage && meta.touched"
    class="mt-1 text-sm text-danger-500"
  >
    {{ errorMessage }}
  </p>
</template>
