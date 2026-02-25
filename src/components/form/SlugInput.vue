<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Slug Input — Auto-generated slug from title -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useField } from 'vee-validate'
import { LinkIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  sourceField?: string // Field name to watch for auto-generation
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
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

const isAutoMode = ref(true)

const inputClasses = computed(() => {
  const base = 'form-input w-full pl-10'
  if (errorMessage.value && meta.touched) {
    return `${base} border-danger-500 focus:border-danger-500 focus:ring-danger-500`
  }
  return base
})

// Watch source field for auto-generation
if (props.sourceField) {
  const sourceFieldRef = useField(props.sourceField)
  
  watch(() => sourceFieldRef.value.value, (newValue) => {
    if (isAutoMode.value && newValue) {
      value.value = generateSlug(String(newValue))
      emit('update:modelValue', value.value)
    }
  })
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  
  // Disable auto mode when user manually edits
  isAutoMode.value = false
  
  // Auto-format the slug as user types
  value.value = generateSlug(target.value)
  emit('update:modelValue', value.value)
}

function regenerateSlug() {
  if (props.sourceField) {
    const sourceFieldRef = useField(props.sourceField)
    if (sourceFieldRef.value.value) {
      isAutoMode.value = true
      value.value = generateSlug(String(sourceFieldRef.value.value))
      emit('update:modelValue', value.value)
    }
  }
}
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <div class="flex items-center justify-between">
      <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-danger-500">*</span>
      </label>
      
      <button
        v-if="sourceField && !isAutoMode"
        type="button"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        @click="regenerateSlug"
      >
        Auto-generate
      </button>
    </div>

    <!-- Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <LinkIcon class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        :value="value"
        placeholder="auto-generated-slug"
        :disabled="disabled"
        :readonly="readonly"
        :class="inputClasses"
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
        @input="handleInput"
        @blur="handleBlur"
      />
    </div>

    <!-- Preview URL -->
    <p v-if="value && !errorMessage" class="text-sm text-gray-600 dark:text-gray-400">
      Preview: <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">/{{ value }}</code>
    </p>

    <!-- Hint -->
    <p v-if="hint && !errorMessage && !value" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Auto Mode Indicator -->
    <p v-if="isAutoMode && sourceField" class="text-sm text-primary-600 dark:text-primary-400">
      Auto-generating from {{ sourceField }}
    </p>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
