// ═══════════════════════════════════════════════════════════════════
// useModal Composable — Modal open/close state management
// ═══════════════════════════════════════════════════════════════════

import { ref, watch } from 'vue'

export function useModal(initialOpen = false) {
  const isOpen = ref(initialOpen)
  const data = ref<unknown>(null)

  function open(modalData?: unknown) {
    data.value = modalData ?? null
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  // Clear data when modal closes
  watch(isOpen, (value) => {
    if (!value) {
      // Delay clearing data to allow close animation
      setTimeout(() => {
        data.value = null
      }, 200)
    }
  })

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  }
}

/**
 * Create multiple modals
 */
export function useModals<T extends string>(modalNames: T[]) {
  const modals = {} as Record<T, ReturnType<typeof useModal>>

  modalNames.forEach((name) => {
    modals[name] = useModal()
  })

  return modals
}
