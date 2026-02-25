<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Base Modal — Reusable modal dialog component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  modelValue?: boolean
  show?: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  closable?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  show: undefined,
  size: 'md',
  closable: true,
  persistent: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

// Computed to support both modelValue and show props
const isOpen = computed(() => props.modelValue ?? props.show ?? false)

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
  }
  return sizes[props.size]
})

// Close modal
function close() {
  if (!props.persistent) {
    emit('update:modelValue', false)
    emit('close')
  }
}

// Handle backdrop click
function handleBackdropClick() {
  if (!props.persistent) {
    close()
  }
}

// Lock body scroll when modal is open
watch(
  isOpen,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog
      as="div"
      class="relative z-50"
      @close="handleBackdropClick"
    >
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

      <!-- Modal container -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
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
              :class="[
                'w-full transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all dark:bg-gray-800',
                sizeClasses,
              ]"
            >
              <!-- Header -->
              <div
                v-if="title || closable"
                class="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700"
              >
                <div>
                  <DialogTitle
                    v-if="title"
                    as="h3"
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {{ title }}
                  </DialogTitle>
                  <p
                    v-if="description"
                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {{ description }}
                  </p>
                </div>

                <button
                  v-if="closable"
                  type="button"
                  class="ml-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  @click="close"
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>

              <!-- Body -->
              <div class="px-6 py-4">
                <slot />
              </div>

              <!-- Footer -->
              <div
                v-if="$slots.footer"
                class="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
