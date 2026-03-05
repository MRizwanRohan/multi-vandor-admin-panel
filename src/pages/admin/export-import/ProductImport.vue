<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Product Import — Upload CSV/XLSX to bulk import products        -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { analyticsService } from '@/services'
import type { ImportResult } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()

onMounted(() => {
  breadcrumbStore.setPageInfo('Product Import', [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Export / Import' },
    { label: 'Import Products' },
  ], 'Bulk import products from CSV/Excel file')
})

const file = ref<File | null>(null)
const vendorId = ref<string>('')
const importing = ref(false)
const downloadingTemplate = ref(false)
const result = ref<ImportResult | null>(null)
const error = ref<string | null>(null)

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    file.value = target.files[0]
    result.value = null
    error.value = null
  }
}

function removeFile() {
  file.value = null
  result.value = null
  error.value = null
}

async function handleImport() {
  if (!file.value) return
  importing.value = true
  error.value = null
  result.value = null
  try {
    const vid = vendorId.value ? Number(vendorId.value) : undefined
    result.value = await analyticsService.importProducts(file.value, vid)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Import failed. Check file format and try again.'
  } finally {
    importing.value = false
  }
}

async function downloadTemplate() {
  downloadingTemplate.value = true
  try {
    const blob = await analyticsService.downloadImportTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e: any) {
    error.value = 'Failed to download template'
  } finally {
    downloadingTemplate.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Instructions -->
    <BaseCard>
      <template #header>
        <div class="flex items-center gap-2">
          <DocumentTextIcon class="h-5 w-5 text-gray-500" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Import Instructions</h3>
        </div>
      </template>
      <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>1. Download the CSV template using the button below.</p>
        <p>2. Fill in the product data following the template format.</p>
        <p>3. Save as <strong>.csv</strong> or <strong>.xlsx</strong> (max 10MB).</p>
        <p>4. Upload the file and click <strong>Import</strong>.</p>
        <p>5. Review the results — failed rows will show error details.</p>
      </div>
      <div class="mt-4">
        <BaseButton variant="secondary" :loading="downloadingTemplate" @click="downloadTemplate">
          <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
          Download Template
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Error alert -->
    <div v-if="error" class="rounded-lg border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <div class="flex items-center gap-2">
        <ExclamationCircleIcon class="h-5 w-5 text-danger-600" />
        <p class="text-sm text-danger-700 dark:text-danger-400">{{ error }}</p>
      </div>
    </div>

    <!-- Upload form -->
    <BaseCard>
      <template #header>
        <div class="flex items-center gap-2">
          <ArrowUpTrayIcon class="h-5 w-5 text-gray-500" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Upload File</h3>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Drop zone -->
        <div
          class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 dark:border-gray-600"
          :class="file ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/10' : ''"
        >
          <template v-if="!file">
            <ArrowUpTrayIcon class="mb-3 h-10 w-10 text-gray-400" />
            <p class="mb-2 text-sm text-gray-600 dark:text-gray-400">
              Choose a CSV or Excel file
            </p>
            <label class="cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Browse Files
              <input type="file" accept=".csv,.xlsx,.xls" class="hidden" @change="onFileChange" />
            </label>
          </template>
          <template v-else>
            <div class="flex items-center gap-3">
              <DocumentTextIcon class="h-8 w-8 text-primary-500" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ file.name }}</p>
                <p class="text-sm text-gray-500">{{ (file.size / 1024).toFixed(1) }} KB</p>
              </div>
              <button @click="removeFile" class="ml-4 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
                <XMarkIcon class="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </template>
        </div>

        <!-- Vendor ID (optional) -->
        <div class="max-w-xs">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Vendor ID <span class="text-gray-400">(optional)</span>
          </label>
          <FormInput v-model="vendorId" type="number" placeholder="Leave empty for all vendors" />
        </div>

        <!-- Import button -->
        <BaseButton :loading="importing" :disabled="!file" @click="handleImport">
          <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
          Import Products
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Results -->
    <BaseCard v-if="result">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Import Results</h3>
      </template>

      <div class="space-y-4">
        <!-- Summary -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex items-center gap-3 rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
            <CheckCircleIcon class="h-8 w-8 text-success-500" />
            <div>
              <p class="text-2xl font-bold text-success-700 dark:text-success-400">{{ result.success_count }}</p>
              <p class="text-sm text-success-600 dark:text-success-500">Successfully imported</p>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-lg bg-danger-50 p-4 dark:bg-danger-900/20">
            <ExclamationCircleIcon class="h-8 w-8 text-danger-500" />
            <div>
              <p class="text-2xl font-bold text-danger-700 dark:text-danger-400">{{ result.failure_count }}</p>
              <p class="text-sm text-danger-600 dark:text-danger-500">Failed rows</p>
            </div>
          </div>
        </div>

        <!-- Error details table -->
        <div v-if="result.errors && result.errors.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Row</th>
                <th class="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Field</th>
                <th class="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Error</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(err, idx) in result.errors" :key="idx">
                <td class="px-4 py-2 text-gray-900 dark:text-white">{{ err.row }}</td>
                <td class="px-4 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{{ err.field }}</td>
                <td class="px-4 py-2 text-danger-600 dark:text-danger-400">{{ err.message }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
