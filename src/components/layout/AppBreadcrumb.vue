<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Breadcrumb — Navigation breadcrumb component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { ChevronRightIcon, HomeIcon } from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()

const items = computed(() => breadcrumbStore.items)
</script>

<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <!-- Home link -->
      <li>
        <RouterLink
          to="/"
          class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        >
          <HomeIcon class="h-4 w-4" />
          <span class="sr-only">Home</span>
        </RouterLink>
      </li>

      <!-- Breadcrumb items -->
      <li v-for="(item, index) in items" :key="index" class="flex items-center">
        <ChevronRightIcon class="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
        
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {{ item.label }}
        </RouterLink>
        
        <span
          v-else
          class="ml-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
