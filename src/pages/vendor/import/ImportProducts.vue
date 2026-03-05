<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Import Products — Bulk import products from file (API)    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useNotification } from '@/composables'
import api from '@/services/api'
import type { ImportResult } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { showSuccess, showError } = useNotification()

// State
const isImporting = ref(false)
const isDownloadingTemplate = ref(false)
const selectedFile = ref<File | null>(null)
const dragOver = ref(false)
const importResult = ref<ImportResult | null>(null)

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null)

// Handle file selection
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    selectedFile.value = input.files[0]
    importResult.value = null
  }
}

// Handle drag and drop
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  dragOver.value = true
}

function handleDragLeave() {
  dragOver.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  dragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files?.length) {
    const file = files[0]
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ]
    if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
      selectedFile.value = file
      importResult.value = null
    } else {
      showError('Invalid file', 'Please upload an Excel (.xlsx) or CSV file')
    }
  }
}

// Download template
async function downloadTemplate() {
  isDownloadingTemplate.value = true
  try {
    const response = await api.get('/vendor/products/import/template', {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-import-template.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
    showSuccess('Download started', 'Template file download initiated')
  } catch (e: any) {
    showError('Download failed', e.response?.data?.message || 'Failed to download template')
  } finally {
    isDownloadingTemplate.value = false
  }
}

// Import products
async function importProducts() {
  if (!selectedFile.value) {
    showError('No file selected', 'Please select a file to import')
    return
  }

  isImporting.value = true
  importResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await api.post<{ data: ImportResult }>('/vendor/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    importResult.value = response.data.data
    
    if (response.data.data.failure_count === 0) {
      showSuccess('Import complete', `Successfully imported ${response.data.data.success_count} products`)
    } else {
      showError('Import completed with errors', `${response.data.data.success_count} succeeded, ${response.data.data.failure_count} failed`)
    }
  } catch (e: any) {
    showError('Import failed', e.response?.data?.message || 'Failed to import products')
  } finally {
    isImporting.value = false
  }
}

// Clear selection
function clearFile() {
  selectedFile.value = null
  importResult.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Import Products', [
    { label: 'Export / Import' },
    { label: 'Import Products' },
  ], 'Bulk import products from file')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Import Products</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Bulk import products from Excel or CSV file</p>
    </div>

    <!-- Instructions -->
    <BaseCard title="Instructions">
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            1
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Download the template</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Get the import template with all required columns and formatting
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            2
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Fill in your products</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Add your product data following the template format
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            3
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Upload and import</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Upload your filled file to import all products at once
            </p>
          </div>
        </div>

        <BaseButton
          variant="secondary"
          :loading="isDownloadingTemplate"
          @click="downloadTemplate"
        >
          <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
          Download Template
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Upload Area -->
    <BaseCard title="Upload File">
      <div
        class="relative rounded-lg border-2 border-dashed p-8 text-center transition-colors"
        :class="[
          dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600',
        ]"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="absolute inset-0 cursor-pointer opacity-0"
          @change="handleFileSelect"
        />

        <template v-if="!selectedFile">
          <ArrowUpTrayIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Drag and drop your file here, or click to browse
          </p>
          <p class="mt-2 text-xs text-gray-500">
            Supports Excel (.xlsx) and CSV files
          </p>
        </template>

        <template v-else>
          <DocumentTextIcon class="mx-auto h-12 w-12 text-primary-500" />
          <p class="mt-4 font-medium text-gray-900 dark:text-white">
            {{ selectedFile.name }}
          </p>
          <p class="mt-1 text-sm text-gray-500">
            {{ (selectedFile.size / 1024).toFixed(1) }} KB
          </p>
          <div class="mt-4 flex items-center justify-center gap-3">
            <BaseButton variant="secondary" size="sm" @click.stop="clearFile">
              Remove
            </BaseButton>
            <BaseButton :loading="isImporting" @click.stop="importProducts">
              <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
              Import Products
            </BaseButton>
          </div>
        </template>
      </div>
    </BaseCard>

    <!-- Import Results -->
    <BaseCard v-if="importResult" title="Import Results">
      <!-- Summary -->
      <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <div class="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <CheckCircleIcon class="h-8 w-8 text-green-500" />
          <div>
            <p class="text-2xl font-bold text-green-600">{{ importResult.success_count }}</p>
            <p class="text-sm text-green-700 dark:text-green-400">Products imported</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <XCircleIcon class="h-8 w-8 text-red-500" />
          <div>
            <p class="text-2xl font-bold text-red-600">{{ importResult.failure_count }}</p>
            <p class="text-sm text-red-700 dark:text-red-400">Failed rows</p>
          </div>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="importResult.errors?.length" class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Errors</h4>
        <div class="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Field</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Error</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(err, idx) in importResult.errors" :key="idx">
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {{ err.row }}
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {{ err.field }}
                </td>
                <td class="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                  {{ err.message }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
