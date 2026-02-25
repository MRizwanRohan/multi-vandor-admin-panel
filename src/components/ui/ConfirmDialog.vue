<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Confirm Dialog — Confirmation modal component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

// Icon and colors based on variant
const variantConfig = computed(() => {
  const configs = {
    danger: {
      icon: XCircleIcon,
      iconBg: 'bg-danger-100 dark:bg-danger-900/50',
      iconColor: 'text-danger-600 dark:text-danger-400',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-warning-100 dark:bg-warning-900/50',
      iconColor: 'text-warning-600 dark:text-warning-400',
      buttonVariant: 'warning' as const,
    },
    info: {
      icon: InformationCircleIcon,
      iconBg: 'bg-info-100 dark:bg-info-900/50',
      iconColor: 'text-info-600 dark:text-info-400',
      buttonVariant: 'primary' as const,
    },
    success: {
      icon: CheckCircleIcon,
      iconBg: 'bg-success-100 dark:bg-success-900/50',
      iconColor: 'text-success-600 dark:text-success-400',
      buttonVariant: 'success' as const,
    },
  }
  return configs[props.variant]
})

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
  close()
}
</script>

<template>
  <TransitionRoot :show="modelValue" as="template">
    <Dialog as="div" class="relative z-50" @close="cancel">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
      </TransitionChild>

      <!-- Dialog container -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800"
            >
              <div class="flex items-start">
                <!-- Icon -->
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  :class="variantConfig.iconBg"
                >
                  <component
                    :is="variantConfig.icon"
                    class="h-6 w-6"
                    :class="variantConfig.iconColor"
                  />
                </div>

                <!-- Content -->
                <div class="ml-4">
                  <DialogTitle
                    as="h3"
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {{ title }}
                  </DialogTitle>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {{ message }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-6 flex justify-end gap-3">
                <BaseButton
                  variant="secondary"
                  :disabled="loading"
                  @click="cancel"
                >
                  {{ cancelText }}
                </BaseButton>
                <BaseButton
                  :variant="variantConfig.buttonVariant"
                  :loading="loading"
                  @click="confirm"
                >
                  {{ confirmText }}
                </BaseButton>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
