<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- ImageUploader — Drag-drop image upload with preview, reorder, progress -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGalleryUpload, type FileWithPreview } from '@/composables'
import type { UploadedFile } from '@/services'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  PhotoIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/vue/24/outline'
import { CloudArrowUpIcon } from '@heroicons/vue/24/solid'

// ── Props ──
interface Props {
  modelValue?: (UploadedFile | string)[]
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string
  folder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  sortable?: boolean
  showPreview?: boolean
  previewSize?: 'sm' | 'md' | 'lg'
  uploadOnSelect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxFiles: 10,
  maxSize: 5,
  accept: 'image/jpeg,image/png,image/gif,image/webp',
  folder: 'images',
  label: 'Images',
  disabled: false,
  required: false,
  sortable: true,
  showPreview: true,
  previewSize: 'md',
  uploadOnSelect: true,
})

// ── Emits ──
const emit = defineEmits<{
  (e: 'update:modelValue', value: (UploadedFile | string)[]): void
  (e: 'upload', files: UploadedFile[]): void
  (e: 'remove', file: UploadedFile | string, index: number): void
  (e: 'error', message: string): void
}>()

// ── File Input Ref ──
const fileInputRef = ref<HTMLInputElement>()

// ── File Upload Composable ──
const {
  files,
  isDragging,
  isUploading,
  uploadProgress,
  hasFiles,
  addFiles,
  removeFile,
  clearFiles,
  uploadAll,
  retryUpload,
  reorderFiles,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleInputChange,
} = useGalleryUpload({
  maxFiles: props.maxFiles,
  maxSize: props.maxSize * 1024 * 1024,
  allowedTypes: props.accept.split(',').map((t) => t.trim()),
  folder: props.folder,
  autoUpload: props.uploadOnSelect,
  onUploadSuccess: (file, result) => {
    updateModelValue()
  },
  onUploadError: (file, error) => {
    emit('error', `Failed to upload ${file.file.name}: ${error}`)
  },
  onAllUploadsComplete: (results) => {
    emit('upload', results)
  },
})

// ── Existing Files (from modelValue) ──
const existingFiles = computed(() => {
  return props.modelValue.map((item, index) => {
    if (typeof item === 'string') {
      return { id: `existing-${index}`, url: item, isExisting: true }
    }
    return { ...item, isExisting: true }
  })
})

// ── Combined Preview List ──
const allPreviews = computed(() => {
  const existing = existingFiles.value.map((f) => ({
    id: f.id?.toString() || `existing-${Math.random()}`,
    preview: typeof f === 'object' && 'url' in f ? f.url : '',
    status: 'success' as const,
    isExisting: true,
    data: f,
  }))

  const newFiles = files.value.map((f) => ({
    id: f.id,
    preview: f.preview,
    status: f.status,
    progress: f.progress,
    error: f.error,
    isExisting: false,
    data: f,
  }))

  return [...existing, ...newFiles]
})

// ── Can Add More ──
const canAddMore = computed(() => {
  return allPreviews.value.length < props.maxFiles && !props.disabled
})

// ── Preview Sizes ──
const previewSizeClasses = computed(() => {
  switch (props.previewSize) {
    case 'sm':
      return 'w-20 h-20'
    case 'lg':
      return 'w-40 h-40'
    default:
      return 'w-28 h-28'
  }
})

// ── Update Model Value ──
const updateModelValue = () => {
  const uploaded = files.value
    .filter((f) => f.status === 'success' && f.uploaded)
    .map((f) => f.uploaded!)

  emit('update:modelValue', [...props.modelValue, ...uploaded])
}

// ── Handle Remove ──
const handleRemove = (preview: (typeof allPreviews.value)[0], index: number) => {
  if (preview.isExisting) {
    // Remove from modelValue
    const newValue = [...props.modelValue]
    const existingIndex = existingFiles.value.findIndex(
      (f) => f.id?.toString() === preview.id
    )
    if (existingIndex !== -1) {
      newValue.splice(existingIndex, 1)
      emit('update:modelValue', newValue)
      emit('remove', props.modelValue[existingIndex], existingIndex)
    }
  } else {
    // Remove from pending files
    removeFile(preview.id)
  }
}

// ── Handle Retry ──
const handleRetry = async (id: string) => {
  await retryUpload(id)
}

// ── Trigger File Input ──
const triggerFileInput = () => {
  if (!props.disabled) {
    fileInputRef.value?.click()
  }
}

// ── Drag Reorder ──
const draggedIndex = ref<number | null>(null)

const handleDragStart = (index: number) => {
  if (!props.sortable) return
  draggedIndex.value = index
}

const handleDragEnd = () => {
  draggedIndex.value = null
}

const handleDropReorder = (targetIndex: number) => {
  if (!props.sortable || draggedIndex.value === null) return
  if (draggedIndex.value !== targetIndex) {
    // Handle reorder logic
    const preview = allPreviews.value[draggedIndex.value]
    if (!preview.isExisting) {
      // Reorder pending files
      const fromIdx = files.value.findIndex((f) => f.id === preview.id)
      const toIdx = targetIndex - existingFiles.value.length
      if (fromIdx !== -1 && toIdx >= 0) {
        reorderFiles(fromIdx, toIdx)
      }
    } else {
      // Reorder existing files
      const newValue = [...props.modelValue]
      const [moved] = newValue.splice(draggedIndex.value, 1)
      newValue.splice(targetIndex, 0, moved)
      emit('update:modelValue', newValue)
    }
  }
  draggedIndex.value = null
}
</script>

<template>
  <div class="space-y-2">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Drop Zone -->
    <div
      class="relative rounded-lg border-2 border-dashed transition-colors"
      :class="[
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : error
            ? 'border-red-300 dark:border-red-700'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="triggerFileInput"
    >
      <!-- Hidden File Input -->
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        :multiple="maxFiles > 1"
        :disabled="disabled"
        class="hidden"
        @change="handleInputChange"
      />

      <!-- Empty State / Drop Area -->
      <div
        v-if="!hasFiles && existingFiles.length === 0"
        class="flex flex-col items-center justify-center py-8 px-4"
      >
        <CloudArrowUpIcon
          class="h-12 w-12 mb-3"
          :class="isDragging ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'"
        />
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
          <span class="font-medium text-primary-600 dark:text-primary-400">
            Click to upload
          </span>
          or drag and drop
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {{ accept.replace(/image\//g, '').toUpperCase() }} up to {{ maxSize }}MB
        </p>
        <p v-if="maxFiles > 1" class="text-xs text-gray-500 dark:text-gray-500">
          Maximum {{ maxFiles }} files
        </p>
      </div>

      <!-- Preview Grid -->
      <div
        v-else
        class="p-4 grid gap-3"
        :class="[
          previewSize === 'sm' ? 'grid-cols-6' : previewSize === 'lg' ? 'grid-cols-3' : 'grid-cols-4',
        ]"
        @click.stop
      >
        <!-- Preview Items -->
        <div
          v-for="(preview, index) in allPreviews"
          :key="preview.id"
          class="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
          :class="[
            previewSizeClasses,
            sortable && !disabled ? 'cursor-move' : '',
            draggedIndex === index ? 'opacity-50' : '',
          ]"
          :draggable="sortable && !disabled"
          @dragstart="handleDragStart(index)"
          @dragend="handleDragEnd"
          @dragover.prevent
          @drop.prevent="handleDropReorder(index)"
        >
          <!-- Image Preview -->
          <img
            v-if="preview.preview"
            :src="preview.preview"
            :alt="`Preview ${index + 1}`"
            class="w-full h-full object-cover"
          />

          <!-- Placeholder for non-images -->
          <div
            v-else
            class="w-full h-full flex items-center justify-center"
          >
            <PhotoIcon class="h-8 w-8 text-gray-400" />
          </div>

          <!-- Upload Progress Overlay -->
          <div
            v-if="preview.status === 'uploading'"
            class="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <div class="text-center">
              <div class="w-12 h-12 rounded-full border-4 border-white/30 border-t-white animate-spin" />
              <span class="text-white text-xs mt-1">{{ preview.progress }}%</span>
            </div>
          </div>

          <!-- Error Overlay -->
          <div
            v-if="preview.status === 'error'"
            class="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2"
          >
            <ExclamationCircleIcon class="h-6 w-6 text-white mb-1" />
            <span class="text-white text-xs text-center line-clamp-2">{{ preview.error }}</span>
            <button
              type="button"
              class="mt-1 text-xs text-white underline hover:no-underline"
              @click.stop="handleRetry(preview.id)"
            >
              Retry
            </button>
          </div>

          <!-- Success Indicator -->
          <div
            v-if="preview.status === 'success' && !preview.isExisting"
            class="absolute top-1 left-1"
          >
            <CheckCircleIcon class="h-5 w-5 text-green-500 drop-shadow" />
          </div>

          <!-- Hover Actions -->
          <div
            v-if="!disabled"
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          >
            <!-- Remove Button -->
            <button
              type="button"
              class="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Remove"
              @click.stop="handleRemove(preview, index)"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>

            <!-- Reorder Handle (optional visual) -->
            <div
              v-if="sortable"
              class="p-1.5 rounded-full bg-white/20 text-white"
              title="Drag to reorder"
            >
              <ArrowsPointingOutIcon class="h-4 w-4" />
            </div>
          </div>

          <!-- Order Number -->
          <div
            v-if="maxFiles > 1"
            class="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
          >
            {{ index + 1 }}
          </div>
        </div>

        <!-- Add More Button -->
        <div
          v-if="canAddMore"
          class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors flex items-center justify-center cursor-pointer"
          :class="previewSizeClasses"
          @click="triggerFileInput"
        >
          <div class="text-center">
            <CloudArrowUpIcon class="h-6 w-6 mx-auto text-gray-400 dark:text-gray-500" />
            <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">Add</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Overall Progress Bar -->
    <div v-if="isUploading" class="mt-2">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Uploading...</span>
        <span>{{ uploadProgress }}%</span>
      </div>
      <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 transition-all duration-300"
          :style="{ width: `${uploadProgress}%` }"
        />
      </div>
    </div>

    <!-- Actions -->
    <div v-if="hasFiles && !uploadOnSelect" class="flex items-center gap-2 mt-2">
      <BaseButton
        size="sm"
        :loading="isUploading"
        @click="uploadAll"
      >
        Upload All
      </BaseButton>
      <BaseButton
        variant="ghost"
        size="sm"
        :disabled="isUploading"
        @click="clearFiles"
      >
        Clear
      </BaseButton>
    </div>

    <!-- Hint -->
    <p v-if="hint && !error" class="text-xs text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Error Message -->
    <p v-if="error" class="text-xs text-red-500 flex items-center gap-1">
      <ExclamationCircleIcon class="h-4 w-4" />
      {{ error }}
    </p>
  </div>
</template>
