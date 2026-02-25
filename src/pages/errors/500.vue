<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- 500 Server Error — Internal server error page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()

function goBack() {
  router.back()
}

function refresh() {
  window.location.reload()
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/50">
        <ExclamationTriangleIcon class="h-12 w-12 text-danger-600 dark:text-danger-400" />
      </div>

      <h1 class="mt-6 text-4xl font-bold text-gray-900 dark:text-white">
        500
      </h1>

      <p class="mt-2 text-lg font-medium text-gray-600 dark:text-gray-400">
        Server Error
      </p>

      <p class="mt-4 max-w-md text-gray-500 dark:text-gray-400">
        Something went wrong on our end. Please try again later or contact support if the problem persists.
      </p>

      <div class="mt-8 flex items-center justify-center gap-4">
        <BaseButton variant="secondary" @click="goBack">
          Go back
        </BaseButton>
        <BaseButton variant="primary" @click="refresh">
          Refresh page
        </BaseButton>
      </div>
    </div>
  </div>
</template>
