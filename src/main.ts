// ═══════════════════════════════════════════════════════════════════
// Main Entry Point — Application bootstrap
// ═══════════════════════════════════════════════════════════════════

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { POSITION, type PluginOptions } from 'vue-toastification'
import FloatingVue from 'floating-vue'

// Import styles
import '@/assets/css/tailwind.css'
import 'vue-toastification/dist/index.css'
import 'floating-vue/dist/style.css'

// Import app, router and i18n
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Import stores
import { useUIStore } from '@/stores/ui.store'

// Create Vue app
const app = createApp(App)

// Global error handler — shows errors in console and on screen
app.config.errorHandler = (err, instance, info) => {
  console.error('🔴 Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
  
  // Show error on screen in development
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:20px;background:#fee2e2;color:#dc2626;font-family:monospace;z-index:99999;white-space:pre-wrap;'
    errorDiv.innerHTML = `<strong>Vue Error:</strong> ${err}\n<small>${info}</small>`
    document.body.prepend(errorDiv)
  }
}

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Unhandled Promise Rejection:', event.reason)
})

// Create Pinia store
const pinia = createPinia()

// Toast configuration
const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT as PluginOptions['position'],
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
  transition: 'Vue-Toastification__fade',
  maxToasts: 5,
  newestOnTop: true,
}

// Use plugins
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Toast, toastOptions)
app.use(FloatingVue)

// Initialize UI store (theme, locale)
const uiStore = useUIStore()
uiStore.initUI()

// Mount app
app.mount('#app')
