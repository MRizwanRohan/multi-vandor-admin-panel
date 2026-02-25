<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Tag Input — Tag/keyword input with add/remove -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField } from 'vee-validate'
import { XMarkIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  required?: boolean
  maxTags?: number
  disabled?: boolean
  modelValue?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type and press Enter',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

// Use vee-validate field
const { value, errorMessage, handleBlur, meta } = useField<string[]>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
    initialValue: [],
  }
)

const inputValue = ref('')

const canAddMore = computed(() => {
  if (!props.maxTags) return true
  return (value.value?.length || 0) < props.maxTags
})

function addTag() {
  const tag = inputValue.value.trim()
  
  if (!tag) return
  
  if (!value.value) {
    value.value = []
  }
  
  // Check if tag already exists
  if (value.value.includes(tag)) {
    inputValue.value = ''
    return
  }
  
  // Check max tags limit
  if (!canAddMore.value) {
    return
  }
  
  value.value = [...value.value, tag]
  emit('update:modelValue', value.value)
  inputValue.value = ''
}

function removeTag(index: number) {
  if (!value.value) return
  
  value.value = value.value.filter((_, i) => i !== index)
  emit('update:modelValue', value.value)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    addTag()
  } else if (event.key === 'Backspace' && !inputValue.value && value.value?.length) {
    removeTag(value.value.length - 1)
  }
}
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Tag Container -->
    <div
      :class="[
        'form-input min-h-[42px] p-2 flex flex-wrap gap-2',
        errorMessage && meta.touched ? 'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500' : ''
      ]"
    >
      <!-- Tags -->
      <span
        v-for="(tag, index) in value"
        :key="index"
        class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-sm"
      >
        {{ tag }}
        <button
          v-if="!disabled"
          type="button"
          class="hover:text-primary-900 dark:hover:text-primary-100"
          @click="removeTag(index)"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </span>

      <!-- Input -->
      <input
        v-model="inputValue"
        type="text"
        :placeholder="value?.length ? '' : placeholder"
        :disabled="disabled || !canAddMore"
        class="flex-1 min-w-[120px] border-0 p-0 focus:ring-0 bg-transparent"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />
    </div>

    <!-- Info -->
    <div class="flex items-center justify-between text-sm">
      <p v-if="hint && !errorMessage" class="text-gray-500 dark:text-gray-400">
        {{ hint }}
      </p>
      <p v-if="maxTags" class="text-gray-500 dark:text-gray-400">
        {{ value?.length || 0 }} / {{ maxTags }}
      </p>
    </div>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
