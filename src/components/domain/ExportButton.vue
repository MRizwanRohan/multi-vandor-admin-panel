<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Export Button — CSV/PDF export button with dropdown -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref } from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentIcon,
} from '@heroicons/vue/24/outline'
import BaseButton from '../ui/BaseButton.vue'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json'

interface Props {
  formats?: ExportFormat[]
  loading?: boolean
  disabled?: boolean
  label?: string
  size?: 'xs' | 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  formats: () => ['csv', 'xlsx', 'pdf'],
  loading: false,
  disabled: false,
  label: 'Export',
  size: 'sm',
})

const emit = defineEmits<{
  (e: 'export', format: ExportFormat): void
}>()

const isExporting = ref(false)

const formatConfig: Record<ExportFormat, { label: string; icon: typeof DocumentTextIcon; description: string }> = {
  csv: { label: 'CSV', icon: TableCellsIcon, description: 'Comma-separated values' },
  xlsx: { label: 'Excel', icon: TableCellsIcon, description: 'Microsoft Excel format' },
  pdf: { label: 'PDF', icon: DocumentTextIcon, description: 'Portable document format' },
  json: { label: 'JSON', icon: DocumentIcon, description: 'JavaScript Object Notation' },
}

async function handleExport(format: ExportFormat) {
  isExporting.value = true
  emit('export', format)
  // Reset after short delay (parent should handle actual loading state)
  setTimeout(() => {
    isExporting.value = false
  }, 500)
}
</script>

<template>
  <!-- Single format: plain button -->
  <BaseButton
    v-if="formats.length === 1"
    :size="size"
    variant="outline"
    :icon="ArrowDownTrayIcon"
    :loading="loading || isExporting"
    :disabled="disabled"
    @click="handleExport(formats[0]!)"
  >
    {{ label }}
  </BaseButton>

  <!-- Multiple formats: dropdown -->
  <Menu v-else as="div" class="relative inline-block">
    <MenuButton as="template">
      <BaseButton
        :size="size"
        variant="outline"
        :icon="ArrowDownTrayIcon"
        :loading="loading || isExporting"
        :disabled="disabled"
      >
        {{ label }}
      </BaseButton>
    </MenuButton>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems
        class="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
      >
        <MenuItem
          v-for="format in formats"
          :key="format"
          v-slot="{ active }"
        >
          <button
            type="button"
            :class="[
              'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
              active ? 'bg-gray-100 dark:bg-gray-700' : '',
              'text-gray-700 dark:text-gray-200',
            ]"
            @click="handleExport(format)"
          >
            <component
              :is="formatConfig[format].icon"
              class="h-4 w-4 shrink-0 text-gray-400"
            />
            <div class="text-left">
              <p class="font-medium">{{ formatConfig[format].label }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatConfig[format].description }}
              </p>
            </div>
          </button>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>
