<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Dynamic Settings Form — Renders form fields based on Setting model -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Setting } from '@/types'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'

const props = defineProps<{
  settings: Setting[]
  modelValue: Record<string, unknown>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void
}>()

// Local values for form binding
const localValues = ref<Record<string, unknown>>({})

// Sync local values with modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    localValues.value = { ...newVal }
  },
  { immediate: true, deep: true }
)

// Update parent on change
function updateValue(key: string, value: unknown) {
  localValues.value[key] = value
  emit('update:modelValue', { ...localValues.value })
}

// Get typed value for a setting
function getValue(setting: Setting): unknown {
  const val = localValues.value[setting.key]
  if (val !== undefined) return val
  // Fallback to setting value or default
  return setting.value ?? setting.default_value ?? getDefaultByType(setting.type)
}

function getDefaultByType(type: string): unknown {
  switch (type) {
    case 'boolean':
      return false
    case 'integer':
    case 'float':
      return 0
    case 'array':
    case 'json':
      return []
    default:
      return ''
  }
}

// Convert options to select format
function getSelectOptions(setting: Setting): { value: string; label: string }[] {
  if (!setting.options) return []
  return setting.options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return { value: String(opt.value), label: opt.label }
  })
}

// Group settings by sort_order for layout
const sortedSettings = computed(() => {
  return [...props.settings].sort((a, b) => a.sort_order - b.sort_order)
})
</script>

<template>
  <div class="space-y-4">
    <div v-for="setting in sortedSettings" :key="setting.id" class="setting-field">
      <!-- Text Input -->
      <FormInput
        v-if="setting.input_type === 'text' || setting.input_type === 'email' || setting.input_type === 'url' || setting.input_type === 'password'"
        :model-value="String(getValue(setting) ?? '')"
        :label="setting.display_name"
        :name="setting.key"
        :type="setting.input_type"
        :placeholder="setting.description || undefined"
        :disabled="disabled || !setting.is_active"
        @update:model-value="updateValue(setting.key, $event)"
      />

      <!-- Number Input -->
      <FormInput
        v-else-if="setting.input_type === 'number' || setting.type === 'integer' || setting.type === 'float'"
        :model-value="Number(getValue(setting) ?? 0)"
        :label="setting.display_name"
        :name="setting.key"
        type="number"
        :placeholder="setting.description || undefined"
        :disabled="disabled || !setting.is_active"
        @update:model-value="updateValue(setting.key, Number($event))"
      />

      <!-- Textarea -->
      <FormTextarea
        v-else-if="setting.input_type === 'textarea'"
        :model-value="String(getValue(setting) ?? '')"
        :label="setting.display_name"
        :name="setting.key"
        :rows="3"
        :placeholder="setting.description || undefined"
        :disabled="disabled || !setting.is_active"
        @update:model-value="updateValue(setting.key, $event)"
      />

      <!-- Select -->
      <FormSelect
        v-else-if="setting.input_type === 'select'"
        :model-value="String(getValue(setting) ?? '')"
        :label="setting.display_name"
        :name="setting.key"
        :options="getSelectOptions(setting)"
        :disabled="disabled || !setting.is_active"
        @update:model-value="updateValue(setting.key, $event)"
      />

      <!-- Switch / Checkbox / Toggle -->
      <FormSwitch
        v-else-if="setting.input_type === 'switch' || setting.input_type === 'checkbox' || setting.input_type === 'toggle' || setting.type === 'boolean'"
        :model-value="Boolean(getValue(setting))"
        :label="setting.display_name"
        :description="setting.description || undefined"
        :name="setting.key"
        :disabled="disabled || !setting.is_active"
        @update:model-value="updateValue(setting.key, $event)"
      />

      <!-- File / Image (display only for now) -->
      <div v-else-if="setting.input_type === 'file' || setting.input_type === 'image'" class="space-y-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ setting.display_name }}
        </label>
        <div class="flex items-center gap-4">
          <img
            v-if="setting.input_type === 'image' && getValue(setting)"
            :src="String(getValue(setting))"
            :alt="setting.display_name"
            class="h-12 w-12 rounded object-cover"
          />
          <FormInput
            :model-value="String(getValue(setting) ?? '')"
            :name="setting.key"
            type="text"
            placeholder="File URL"
            :disabled="disabled || !setting.is_active"
            class="flex-1"
            @update:model-value="updateValue(setting.key, $event)"
          />
        </div>
        <p v-if="setting.description" class="text-xs text-gray-500 dark:text-gray-400">
          {{ setting.description }}
        </p>
      </div>

      <!-- Color Picker -->
      <div v-else-if="setting.input_type === 'color'" class="space-y-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ setting.display_name }}
        </label>
        <div class="flex items-center gap-3">
          <input
            type="color"
            :value="String(getValue(setting) ?? '#000000')"
            :disabled="disabled || !setting.is_active"
            class="h-10 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
            @input="updateValue(setting.key, ($event.target as HTMLInputElement).value)"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ getValue(setting) }}
          </span>
        </div>
      </div>

      <!-- Fallback: Text input -->
      <FormInput
        v-else
        :model-value="String(getValue(setting) ?? '')"
        :label="setting.display_name"
        :name="setting.key"
        type="text"
        :placeholder="setting.description || undefined"
        :disabled="disabled || !setting.is_active"
        @update:model-value="updateValue(setting.key, $event)"
      />
    </div>
  </div>
</template>
