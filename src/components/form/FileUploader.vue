<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- File Uploader — Generic file upload with drag & drop -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField } from 'vee-validate'
import { useFileUpload } from '@/composables'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  hint?: string
  required?: boolean
  accept?: string
  maxSize?: number // MB
  multiple?: boolean
  modelValue?: File | File[] | null
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  accept: '*/*',
  maxSize: 10,
  multiple: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | File[] | null): void
}>()

// Use vee-validate field
const { errorMessage, meta } = useField<File | File[] | null>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
  }
)

const { 
  files,
  isDragging,
  progress,
  isUploading,
  selectFiles,
  removeFile,
  startUpload,
} = useFileUpload({
  accept: props.accept,
  maxSize: props.maxSize,
  multiple: props.multiple,
})

const fileInput = ref<HTMLInputElement>()

function handleFileSelect() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    selectFiles(Array.from(target.files))
    emit('update:modelValue', props.multiple ? Array.from(target.files) : target.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files?.length) {
    selectFiles(Array.from(event.dataTransfer.files))
    emit('update:modelValue', props.multiple ? Array.from(event.dataTransfer.files) : event.dataTransfer.files[0])
  }
}

function handleRemove(index: number) {
  removeFile(index)
  if (props.multiple) {
    emit('update:modelValue', files.value.length ? files.value : null)
  } else {
    emit('update:modelValue', null)
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="space-y-2">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Drop Zone -->
    <div
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
          : errorMessage && meta.touched
            ? 'border-danger-300 bg-danger-50 dark:border-danger-700 dark:bg-danger-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <CloudArrowUpIcon class="mx-auto h-12 w-12 text-gray-400" />
      <div class="mt-4">
        <button
          type="button"
          class="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          @click="handleFileSelect"
        >
          Choose {{ multiple ? 'files' : 'a file' }}
        </button>
        <span class="text-gray-500"> or drag and drop</span>
      </div>
      <p v-if="hint" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ hint }}
      </p>
      <p v-else class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ accept !== '*/*' ? accept : 'Any file type' }} up to {{ maxSize }}MB
      </p>

      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <!-- Selected Files -->
    <div v-if="files.length" class="space-y-2">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <DocumentIcon class="h-8 w-8 text-gray-400 flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ file.name }}
            </p>
            <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
          </div>
        </div>

        <button
          type="button"
          class="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          @click="handleRemove(index)"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Upload Progress -->
      <div v-if="isUploading" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-primary-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
