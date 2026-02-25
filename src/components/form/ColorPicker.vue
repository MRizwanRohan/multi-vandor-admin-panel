<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Color Picker — Color selection input -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField } from 'vee-validate'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  presetColors?: string[]
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  presetColors: () => [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#64748b', // slate
    '#6b7280', // gray
    '#000000', // black
  ],
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

// Default color if none set
if (!value.value) {
  value.value = '#3b82f6'
}

const showPicker = ref(false)

function selectColor(color: string) {
  value.value = color
  emit('update:modelValue', color)
  showPicker.value = false
}

function handleInputChange(event: Event) {
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

    <!-- Color Input -->
    <div class="flex items-center gap-3">
      <!-- Color Preview -->
      <button
        type="button"
        class="relative w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
        :style="{ backgroundColor: value }"
        :disabled="disabled"
        @click="showPicker = !showPicker"
      >
        <span class="sr-only">Pick color</span>
      </button>

      <!-- Text Input -->
      <input
        type="text"
        :value="value"
        :disabled="disabled"
        class="form-input flex-1"
        placeholder="#000000"
        maxlength="7"
        pattern="^#[0-9A-Fa-f]{6}$"
        @input="handleInputChange"
        @blur="handleBlur"
      />

      <!-- Native Color Input (hidden) -->
      <input
        type="color"
        :value="value"
        :disabled="disabled"
        class="form-input w-20"
        @input="handleInputChange"
        @blur="handleBlur"
      />
    </div>

    <!-- Preset Colors -->
    <div v-if="showPicker && presetColors.length" class="grid grid-cols-10 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <button
        v-for="color in presetColors"
        :key="color"
        type="button"
        class="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-500"
        :style="{ backgroundColor: color }"
        :title="color"
        @click="selectColor(color)"
      >
        <span class="sr-only">{{ color }}</span>
      </button>
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
