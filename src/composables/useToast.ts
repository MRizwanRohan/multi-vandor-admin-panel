// ═══════════════════════════════════════════════════════════════════
// useToast Composable — Toast notification system
// ═══════════════════════════════════════════════════════════════════

import { useToast as useVueToastification, TYPE } from 'vue-toastification'

interface ToastOptions {
  timeout?: number
  closeOnClick?: boolean
  pauseOnFocusLoss?: boolean
  pauseOnHover?: boolean
  draggable?: boolean
  showCloseButtonOnHover?: boolean
}

export function useToast() {
  const toast = useVueToastification()

  const defaultOptions: ToastOptions = {
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    showCloseButtonOnHover: false,
  }

  function success(message: string, options?: ToastOptions) {
    toast(message, {
      type: TYPE.SUCCESS,
      ...defaultOptions,
      ...options,
    })
  }

  function error(message: string, options?: ToastOptions) {
    toast(message, {
      type: TYPE.ERROR,
      ...defaultOptions,
      timeout: 7000, // Errors stay longer
      ...options,
    })
  }

  function warning(message: string, options?: ToastOptions) {
    toast(message, {
      type: TYPE.WARNING,
      ...defaultOptions,
      ...options,
    })
  }

  function info(message: string, options?: ToastOptions) {
    toast(message, {
      type: TYPE.INFO,
      ...defaultOptions,
      ...options,
    })
  }

  function promiseToast<T>(
    promiseAction: Promise<T>,
    messages: {
      pending: string
      success: string
      error: string
    }
  ): Promise<T> {
    // Show pending toast
    const toastId = toast(messages.pending, {
      type: TYPE.INFO,
      ...defaultOptions,
      timeout: false,
    })

    return promiseAction
      .then((result) => {
        toast.dismiss(toastId)
        toast(messages.success, {
          type: TYPE.SUCCESS,
          ...defaultOptions,
        })
        return result
      })
      .catch((err) => {
        toast.dismiss(toastId)
        toast(messages.error, {
          type: TYPE.ERROR,
          ...defaultOptions,
          timeout: 7000,
        })
        throw err
      })
  }

  function clear() {
    toast.clear()
  }

  return {
    success,
    error,
    warning,
    info,
    promise: promiseToast,
    clear,
  }
}
