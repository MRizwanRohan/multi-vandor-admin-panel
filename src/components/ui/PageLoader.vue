<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Page Loader — Full-page loading overlay -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { useUIStore } from '@/stores'

const uiStore = useUIStore()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="uiStore.isPageLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80"
    >
      <div class="text-center">
        <!-- Spinner -->
        <div class="relative mx-auto h-12 w-12">
          <div class="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div class="absolute inset-0 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>

        <!-- Loading message -->
        <p
          v-if="uiStore.loadingMessage"
          class="mt-4 text-sm text-gray-600 dark:text-gray-400"
        >
          {{ uiStore.loadingMessage }}
        </p>
      </div>
    </div>
  </Transition>
</template>
