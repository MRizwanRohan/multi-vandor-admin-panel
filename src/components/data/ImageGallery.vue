<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Image Gallery — Product image gallery with zoom/lightbox -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/vue/24/outline'

export interface GalleryImage {
  id?: string | number
  url: string
  alt?: string
  thumbnail?: string
}

interface Props {
  images: GalleryImage[]
  aspectRatio?: 'square' | 'video' | 'auto'
  showThumbnails?: boolean
  zoomable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 'square',
  showThumbnails: true,
  zoomable: true,
})

const selectedIndex = ref(0)
const lightboxOpen = ref(false)

const currentImage = computed(() => props.images[selectedIndex.value])

const aspectClasses = computed(() => {
  const aspects = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }
  return aspects[props.aspectRatio]
})

function selectImage(index: number) {
  selectedIndex.value = index
}

function openLightbox() {
  if (props.zoomable) {
    lightboxOpen.value = true
  }
}

function closeLightbox() {
  lightboxOpen.value = false
}

function nextImage() {
  selectedIndex.value = (selectedIndex.value + 1) % props.images.length
}

function prevImage() {
  selectedIndex.value =
    (selectedIndex.value - 1 + props.images.length) % props.images.length
}

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}
</script>

<template>
  <div @keydown="handleKeydown">
    <!-- Main image -->
    <div
      :class="[
        'relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800',
        aspectClasses,
      ]"
    >
      <img
        v-if="currentImage"
        :src="currentImage.url"
        :alt="currentImage.alt || 'Product image'"
        class="h-full w-full object-contain"
      />
      <div
        v-else
        class="flex h-full min-h-[200px] items-center justify-center text-gray-400"
      >
        No image
      </div>

      <!-- Zoom button -->
      <button
        v-if="zoomable && currentImage"
        type="button"
        class="absolute bottom-3 right-3 rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        @click="openLightbox"
      >
        <MagnifyingGlassPlusIcon class="h-5 w-5" />
      </button>

      <!-- Navigation arrows (when multiple images) -->
      <template v-if="images.length > 1">
        <button
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          @click="prevImage"
        >
          <ChevronLeftIcon class="h-5 w-5" />
        </button>
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          @click="nextImage"
        >
          <ChevronRightIcon class="h-5 w-5" />
        </button>
      </template>
    </div>

    <!-- Thumbnails -->
    <div
      v-if="showThumbnails && images.length > 1"
      class="mt-3 flex gap-2 overflow-x-auto"
    >
      <button
        v-for="(image, index) in images"
        :key="image.id || index"
        type="button"
        :class="[
          'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
          index === selectedIndex
            ? 'border-primary-600 ring-2 ring-primary-600/20 dark:border-primary-400'
            : 'border-transparent opacity-60 hover:opacity-100',
        ]"
        @click="selectImage(index)"
      >
        <img
          :src="image.thumbnail || image.url"
          :alt="image.alt || `Thumbnail ${index + 1}`"
          class="h-full w-full object-cover"
        />
      </button>
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          @click.self="closeLightbox"
        >
          <!-- Close button -->
          <button
            type="button"
            class="absolute right-4 top-4 rounded-full p-2 text-white/80 transition-colors hover:text-white"
            @click="closeLightbox"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>

          <!-- Navigation -->
          <button
            v-if="images.length > 1"
            type="button"
            class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            @click="prevImage"
          >
            <ChevronLeftIcon class="h-6 w-6" />
          </button>

          <!-- Image -->
          <img
            v-if="currentImage"
            :src="currentImage.url"
            :alt="currentImage.alt || 'Product image'"
            class="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
          />

          <button
            v-if="images.length > 1"
            type="button"
            class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            @click="nextImage"
          >
            <ChevronRightIcon class="h-6 w-6" />
          </button>

          <!-- Counter -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {{ selectedIndex + 1 }} / {{ images.length }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
