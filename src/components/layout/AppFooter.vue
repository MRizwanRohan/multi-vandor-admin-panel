<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Footer — Dashboard footer -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
    <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        &copy; {{ currentYear }}
        <span class="font-medium text-gray-700 dark:text-gray-300">MVE Dashboard</span>.
        All rights reserved.
      </p>
      <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <slot name="links">
          <a
            href="#"
            class="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            class="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Terms of Service
          </a>
          <a
            href="#"
            class="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Support
          </a>
        </slot>
      </div>
    </div>
  </footer>
</template>
