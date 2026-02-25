<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- 404 Not Found — Page not found -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/50">
        <MagnifyingGlassIcon class="h-12 w-12 text-warning-600 dark:text-warning-400" />
      </div>

      <h1 class="mt-6 text-4xl font-bold text-gray-900 dark:text-white">
        404
      </h1>

      <p class="mt-2 text-lg font-medium text-gray-600 dark:text-gray-400">
        Page Not Found
      </p>

      <p class="mt-4 max-w-md text-gray-500 dark:text-gray-400">
        The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back.
      </p>

      <div class="mt-8 flex items-center justify-center gap-4">
        <BaseButton variant="secondary" @click="goBack">
          Go back
        </BaseButton>
        <BaseButton variant="primary" to="/">
          Go home
        </BaseButton>
      </div>
    </div>
  </div>
</template>
