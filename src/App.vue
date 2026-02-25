<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App.vue — Root application component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { onMounted, computed, type Component } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore, useUIStore, useNotificationStore } from '@/stores'
import { useConfirm } from '@/composables'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

// Import layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()
const notificationStore = useNotificationStore()
const { state: confirmState, handleConfirm, handleCancel } = useConfirm()

// Layout mapping (only for routes that use meta.layout)
const layouts: Record<string, Component> = {
  auth: AuthLayout,
  blank: BlankLayout,
}

// Check if current route uses layout meta (auth/blank pages)
// Dashboard layout is handled by nested routes directly
const useLayoutWrapper = computed(() => {
  const layoutName = route.meta.layout as string | undefined
  return layoutName && layouts[layoutName]
})

// Get current layout component
const currentLayout = computed(() => {
  const layoutName = route.meta.layout as string || 'blank'
  return layouts[layoutName] || BlankLayout
})

// Initialize app on mount
onMounted(async () => {
  // Initialize UI (theme)
  uiStore.initUI()

  // Initialize auth if token exists
  await authStore.initAuth()

  // Fetch notifications if authenticated
  if (authStore.isAuthenticated) {
    notificationStore.fetchNotifications()
  }
})
</script>

<template>
  <!-- Routes with meta.layout use wrapper, others (dashboard) use nested routing -->
  <component v-if="useLayoutWrapper" :is="currentLayout">
    <RouterView />
  </component>
  <RouterView v-else />

  <!-- Global Confirm Dialog -->
  <ConfirmDialog
    v-model="confirmState.isOpen"
    :title="confirmState.title"
    :message="confirmState.message"
    :confirm-text="confirmState.confirmText"
    :cancel-text="confirmState.cancelText"
    :variant="confirmState.variant"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>
