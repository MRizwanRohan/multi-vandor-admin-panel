// ═══════════════════════════════════════════════════════════════════
// useConfirm Composable — Confirmation dialog state
// ═══════════════════════════════════════════════════════════════════

import { ref, reactive } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  icon?: string
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  icon: undefined,
  resolve: null,
})

export function useConfirm() {
  const loading = ref(false)

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      state.isOpen = true
      state.title = options.title || 'Confirm Action'
      state.message = options.message
      state.confirmText = options.confirmText || 'Confirm'
      state.cancelText = options.cancelText || 'Cancel'
      state.variant = options.variant || 'danger'
      state.icon = options.icon
      state.resolve = resolve
    })
  }

  function handleConfirm() {
    if (state.resolve) {
      state.resolve(true)
    }
    close()
  }

  function handleCancel() {
    if (state.resolve) {
      state.resolve(false)
    }
    close()
  }

  function close() {
    state.isOpen = false
    state.resolve = null
    loading.value = false
  }

  return {
    state,
    loading,
    confirm,
    show: confirm, // alias for backward compatibility
    handleConfirm,
    handleCancel,
    close,
  }
}

// Shorthand confirmations
export function useConfirmDelete() {
  const { confirm } = useConfirm()

  return (itemName: string = 'this item') =>
    confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'TrashIcon',
    })
}

export function useConfirmAction() {
  const { confirm } = useConfirm()

  return (action: string, itemName: string = 'this item') =>
    confirm({
      title: `${action} Confirmation`,
      message: `Are you sure you want to ${action.toLowerCase()} ${itemName}?`,
      confirmText: action,
      cancelText: 'Cancel',
      variant: 'warning',
    })
}
