<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Date Range Picker — Date range selection -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  label?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  modelValue?: { start: string; end: string }
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: { start: string; end: string }): void
}>()

const startDate = ref(props.modelValue?.start || '')
const endDate = ref(props.modelValue?.end || '')
const error = ref('')

const maxEndDate = computed(() => {
  if (startDate.value) {
    return undefined
  }
  return undefined
})

function handleStartChange(event: Event) {
  const target = event.target as HTMLInputElement
  startDate.value = target.value
  
  // Validate: end date should be after start date
  if (endDate.value && endDate.value < startDate.value) {
    error.value = 'End date must be after start date'
  } else {
    error.value = ''
    emit('update:modelValue', { start: startDate.value, end: endDate.value })
  }
}

function handleEndChange(event: Event) {
  const target = event.target as HTMLInputElement
  endDate.value = target.value
  
  // Validate: end date should be after start date
  if (startDate.value && endDate.value < startDate.value) {
    error.value = 'End date must be after start date'
  } else {
    error.value = ''
    emit('update:modelValue', { start: startDate.value, end: endDate.value })
  }
}

function selectPreset(preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth') {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  switch (preset) {
    case 'today':
      startDate.value = today
      endDate.value = today
      break
    case 'yesterday':
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate.value = yesterday.toISOString().split('T')[0]
      endDate.value = yesterday.toISOString().split('T')[0]
      break
    case 'last7days':
      const last7 = new Date(now)
      last7.setDate(last7.getDate() - 6)
      startDate.value = last7.toISOString().split('T')[0]
      endDate.value = today
      break
    case 'last30days':
      const last30 = new Date(now)
      last30.setDate(last30.getDate() - 29)
      startDate.value = last30.toISOString().split('T')[0]
      endDate.value = today
      break
    case 'thisMonth':
      startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      endDate.value = today
      break
    case 'lastMonth':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      startDate.value = lastMonthStart.toISOString().split('T')[0]
      endDate.value = lastMonthEnd.toISOString().split('T')[0]
      break
  }
  
  error.value = ''
  emit('update:modelValue', { start: startDate.value, end: endDate.value })
}
</script>

<template>
  <div class="space-y-2">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Quick Presets -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="preset in [
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'last7days', label: 'Last 7 Days' },
          { key: 'last30days', label: 'Last 30 Days' },
          { key: 'thisMonth', label: 'This Month' },
          { key: 'lastMonth', label: 'Last Month' },
        ]"
        :key="preset.key"
        type="button"
        class="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        @click="selectPreset(preset.key as any)"
      >
        {{ preset.label }}
      </button>
    </div>

    <!-- Date Inputs -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            :value="startDate"
            :disabled="disabled"
            class="form-input w-full pl-10"
            @input="handleStartChange"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            :value="endDate"
            :disabled="disabled"
            :min="startDate"
            class="form-input w-full pl-10"
            @input="handleEndChange"
          />
        </div>
      </div>
    </div>

    <!-- Hint -->
    <p v-if="hint && !error" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Error -->
    <div v-if="error" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ error }}</span>
    </div>
  </div>
</template>
