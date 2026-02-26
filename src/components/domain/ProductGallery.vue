<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════
// ProductGallery Component — Drag-drop image reorder with upload
// ═══════════════════════════════════════════════════════════════════

import { ref, computed, watch } from 'vue'
import { useDragDrop, useFileUpload, useToast } from '@/composables'
import { BaseButton } from '@/components/ui'

interface ProductImage {
  id: number
  url: string
  thumbnail_url?: string
  alt_text?: string
  is_primary: boolean
  sort_order: number
}

interface Props {
  modelValue: ProductImage[]
  maxImages?: number
  disabled?: boolean
  uploadEndpoint?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxImages: 10,
  disabled: false,
  uploadEndpoint: '/vendor/products/images',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProductImage[]): void
  (e: 'upload', files: File[]): void
  (e: 'delete', image: ProductImage): void
  (e: 'setPrimary', image: ProductImage): void
}>()

const toast = useToast()

// File upload
const fileInput = ref<HTMLInputElement | null>(null)
const isDraggingOver = ref(false)

// Drag & Drop for reordering
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const canUpload = computed(() => props.modelValue.length < props.maxImages && !props.disabled)
const remainingSlots = computed(() => props.maxImages - props.modelValue.length)

// File selection
function openFilePicker() {
  if (canUpload.value) {
    fileInput.value?.click()
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files).slice(0, remainingSlots.value)
    emit('upload', files)
    target.value = '' // Reset input
  }
}

// Drag & drop upload
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (canUpload.value) {
    isDraggingOver.value = true
  }
}

function handleDragLeave() {
  isDraggingOver.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDraggingOver.value = false
  
  if (!canUpload.value) return
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const imageFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, remainingSlots.value)
    
    if (imageFiles.length > 0) {
      emit('upload', imageFiles)
    }
  }
}

// Reorder drag & drop
function handleReorderDragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleReorderDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  dragOverIndex.value = index
}

function handleReorderDrop(event: DragEvent, dropIndex: number) {
  event.preventDefault()
  
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    resetDrag()
    return
  }
  
  const images = [...props.modelValue]
  const [draggedItem] = images.splice(draggedIndex.value, 1)
  images.splice(dropIndex, 0, draggedItem)
  
  // Update sort_order
  const reordered = images.map((img, i) => ({
    ...img,
    sort_order: i,
  }))
  
  emit('update:modelValue', reordered)
  resetDrag()
}

function handleReorderDragEnd() {
  resetDrag()
}

function resetDrag() {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Actions
function setPrimary(image: ProductImage) {
  if (props.disabled) return
  
  const updated = props.modelValue.map(img => ({
    ...img,
    is_primary: img.id === image.id,
  }))
  emit('update:modelValue', updated)
  emit('setPrimary', image)
}

function deleteImage(image: ProductImage) {
  if (props.disabled) return
  emit('delete', image)
}
</script>

<template>
  <div class="product-gallery">
    <!-- Upload Zone -->
    <div
      v-if="canUpload"
      class="mb-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
      :class="[
        isDraggingOver
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
      
      <div class="text-gray-500 dark:text-gray-400">
        <svg class="mx-auto mb-2 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="mb-1">
          <button
            type="button"
            class="font-medium text-primary-600 hover:text-primary-500"
            @click="openFilePicker"
          >
            Click to upload
          </button>
          or drag and drop
        </p>
        <p class="text-sm">PNG, JPG, WEBP (max {{ remainingSlots }} more)</p>
      </div>
    </div>

    <!-- Image Grid -->
    <div
      v-if="modelValue.length > 0"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      <div
        v-for="(image, index) in modelValue"
        :key="image.id"
        class="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100 dark:bg-gray-800"
        :class="[
          image.is_primary ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-200 dark:border-gray-700',
          dragOverIndex === index ? 'ring-2 ring-blue-400' : '',
          disabled ? '' : 'cursor-move'
        ]"
        draggable="true"
        @dragstart="handleReorderDragStart($event, index)"
        @dragover="handleReorderDragOver($event, index)"
        @drop="handleReorderDrop($event, index)"
        @dragend="handleReorderDragEnd"
      >
        <!-- Image -->
        <img
          :src="image.thumbnail_url || image.url"
          :alt="image.alt_text || 'Product image'"
          class="h-full w-full object-cover"
        />
        
        <!-- Primary Badge -->
        <div
          v-if="image.is_primary"
          class="absolute left-2 top-2 rounded bg-primary-500 px-2 py-0.5 text-xs font-medium text-white"
        >
          Primary
        </div>

        <!-- Overlay Actions -->
        <div
          v-if="!disabled"
          class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <button
            v-if="!image.is_primary"
            type="button"
            class="rounded-full bg-white p-2 text-gray-700 shadow hover:bg-gray-100"
            title="Set as primary"
            @click="setPrimary(image)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          
          <button
            type="button"
            class="rounded-full bg-red-500 p-2 text-white shadow hover:bg-red-600"
            title="Delete image"
            @click="deleteImage(image)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- Sort Order -->
        <div class="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
          {{ index + 1 }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!canUpload"
      class="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      No images uploaded
    </div>

    <!-- Image Count -->
    <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
      {{ modelValue.length }} / {{ maxImages }} images
    </p>
  </div>
</template>
