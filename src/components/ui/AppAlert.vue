<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Alert — Alert/notification banners -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  dismissible?: boolean
  icon?: boolean
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  dismissible: false,
  icon: true,
  border: true,
})

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const isVisible = ref(true)

function dismiss() {
  isVisible.value = false
  emit('dismiss')
}

// Variant-based config
const config = computed(() => {
  const variants = {
    info: {
      bg: 'bg-info-50 dark:bg-info-900/20',
      border: 'border-info-200 dark:border-info-800',
      text: 'text-info-800 dark:text-info-300',
      desc: 'text-info-700 dark:text-info-400',
      icon: InformationCircleIcon,
      iconColor: 'text-info-500 dark:text-info-400',
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-200 dark:border-success-800',
      text: 'text-success-800 dark:text-success-300',
      desc: 'text-success-700 dark:text-success-400',
      icon: CheckCircleIcon,
      iconColor: 'text-success-500 dark:text-success-400',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-200 dark:border-warning-800',
      text: 'text-warning-800 dark:text-warning-300',
      desc: 'text-warning-700 dark:text-warning-400',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-warning-500 dark:text-warning-400',
    },
    danger: {
      bg: 'bg-danger-50 dark:bg-danger-900/20',
      border: 'border-danger-200 dark:border-danger-800',
      text: 'text-danger-800 dark:text-danger-300',
      desc: 'text-danger-700 dark:text-danger-400',
      icon: XCircleIcon,
      iconColor: 'text-danger-500 dark:text-danger-400',
    },
  }
  return variants[props.variant]
})

const containerClasses = computed(() => [
  'rounded-lg p-4',
  config.value.bg,
  props.border ? `border ${config.value.border}` : '',
])
</script>

<template>
  <Transition name="fade">
    <div v-if="isVisible" :class="containerClasses" role="alert">
      <div class="flex">
        <!-- Icon -->
        <div v-if="icon" class="shrink-0">
          <component
            :is="config.icon"
            class="h-5 w-5"
            :class="config.iconColor"
          />
        </div>

        <!-- Content -->
        <div :class="icon ? 'ml-3' : ''" class="flex-1">
          <h3 v-if="title" class="text-sm font-medium" :class="config.text">
            {{ title }}
          </h3>
          <div
            :class="[title ? 'mt-1' : '', 'text-sm', config.desc]"
          >
            <slot />
          </div>
        </div>

        <!-- Dismiss button -->
        <div v-if="dismissible" class="ml-auto shrink-0 pl-3">
          <button
            type="button"
            class="-m-1.5 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="[config.text, config.bg]"
            @click="dismiss"
          >
            <span class="sr-only">Dismiss</span>
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
