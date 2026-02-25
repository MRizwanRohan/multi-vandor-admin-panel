<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Category Tree Row — Recursive row for category tree display -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/types'

defineOptions({ name: 'CategoryTreeRow' })

const props = defineProps<{
  category: Category
  depth: number
  expandedIds: Set<number>
}>()

const emit = defineEmits<{
  (e: 'toggle', id: number): void
  (e: 'edit', cat: Category): void
  (e: 'delete', cat: Category): void
}>()

const hasChildren = computed(() => props.category.children && props.category.children.length > 0)
const isOpen = computed(() => props.expandedIds.has(props.category.id))
const indent = computed(() => `${16 + props.depth * 28}px`)
</script>

<template>
  <div>
    <!-- Row -->
    <div
      class="flex items-center justify-between py-3 pr-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      :style="{ paddingLeft: indent }"
    >
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Expand/collapse toggle -->
        <button
          v-if="hasChildren"
          type="button"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
          @click="emit('toggle', category.id)"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200"
            :class="{ 'rotate-90': isOpen }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div v-else class="w-6 shrink-0" />

        <!-- Folder icon -->
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          :class="depth === 0 ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-700'"
        >
          <svg
            class="h-4 w-4"
            :class="depth === 0 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>

        <!-- Name + description -->
        <div class="min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ category.name }}
          </p>
          <p v-if="category.description" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
            {{ category.description }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4 shrink-0 ml-4">
        <!-- Children count -->
        <span
          v-if="hasChildren"
          class="text-xs text-gray-400 dark:text-gray-500"
        >
          {{ category.children.length }} sub
        </span>

        <!-- Product count -->
        <div class="text-right w-16 hidden sm:block">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ category.product_count || 0 }}
          </p>
          <p class="text-[10px] text-gray-400">products</p>
        </div>

        <!-- Status -->
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          :class="{
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': category.status === 'active',
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': category.status === 'inactive',
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': category.status === 'pending',
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': category.status === 'rejected',
          }"
        >
          {{ category.status }}
        </span>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="Edit"
            @click="emit('edit', category)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            v-if="category.can_be_deleted"
            type="button"
            class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
            title="Delete"
            @click="emit('delete', category)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Children (recursive) -->
    <template v-if="hasChildren && isOpen">
      <CategoryTreeRow
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :depth="depth + 1"
        :expanded-ids="expandedIds"
        @toggle="(id: number) => emit('toggle', id)"
        @edit="(cat: Category) => emit('edit', cat)"
        @delete="(cat: Category) => emit('delete', cat)"
      />
    </template>
  </div>
</template>
