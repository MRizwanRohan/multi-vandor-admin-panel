<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Form Switch — Toggle switch component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useField } from 'vee-validate'
import { Switch } from '@headlessui/vue'

defineOptions({ inheritAttrs: false })

interface Props {
  name?: string
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

// Use vee-validate field only when name is provided
const field = props.name
  ? useField<boolean>(() => props.name!, undefined, {
      type: 'checkbox',
      checkedValue: true,
      uncheckedValue: false,
      syncVModel: true,
    })
  : null

const value = field
  ? field.value
  : computed({
      get: () => props.modelValue ?? false,
      set: (v: boolean) => emit('update:modelValue', v),
    })

const errorMessage = computed(() => field ? field.errorMessage.value : undefined)
const showError = computed(() => {
  if (!errorMessage.value) return false
  return field ? field.meta.touched : true
})

function handleChange(val: boolean) {
  if (field) {
    field.setValue(val)
  } else {
    emit('update:modelValue', val)
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <label
        v-if="label"
        :for="name"
        :class="[
          'block text-sm font-medium',
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-900 dark:text-white',
        ]"
      >
        {{ label }}
      </label>
      <p
        v-if="description"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        {{ description }}
      </p>
    </div>

    <Switch
      :id="name"
      :model-value="value"
      :disabled="disabled"
      :class="[
        value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      ]"
      @update:model-value="handleChange"
    >
      <span
        :class="[
          value ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        ]"
      >
        <span
          :class="[
            value
              ? 'opacity-0 duration-100 ease-out'
              : 'opacity-100 duration-200 ease-in',
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          ]"
        >
          <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
            <path
              d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span
          :class="[
            value
              ? 'opacity-100 duration-200 ease-in'
              : 'opacity-0 duration-100 ease-out',
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          ]"
        >
          <svg class="h-3 w-3 text-primary-600" fill="currentColor" viewBox="0 0 12 12">
            <path
              d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z"
            />
          </svg>
        </span>
      </span>
    </Switch>
  </div>

  <!-- Error message -->
  <p
    v-if="showError"
    class="mt-1 text-sm text-danger-500"
  >
    {{ errorMessage }}
  </p>
</template>
