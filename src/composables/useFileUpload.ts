// ═══════════════════════════════════════════════════════════════════
// useFileUpload Composable — File upload with drag-drop, preview, progress
// ═══════════════════════════════════════════════════════════════════

import { ref, computed, type Ref } from 'vue'
import { uploadService, type UploadedFile, type UploadProgress } from '@/services'

export interface FileWithPreview {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  uploaded?: UploadedFile
}

export interface UseFileUploadOptions {
  maxFiles?: number
  maxSize?: number // in bytes
  allowedTypes?: string[] // e.g., ['image/jpeg', 'image/png']
  allowedExtensions?: string[] // e.g., ['jpg', 'png', 'pdf']
  folder?: string
  autoUpload?: boolean
  onUploadSuccess?: (file: FileWithPreview, result: UploadedFile) => void
  onUploadError?: (file: FileWithPreview, error: string) => void
  onAllUploadsComplete?: (results: UploadedFile[]) => void
}

export interface UseFileUploadReturn {
  // State
  files: Ref<FileWithPreview[]>
  isDragging: Ref<boolean>
  isUploading: Ref<boolean>
  uploadProgress: Ref<number>

  // Computed
  hasFiles: Ref<boolean>
  totalSize: Ref<number>
  uploadedFiles: Ref<UploadedFile[]>
  pendingFiles: Ref<FileWithPreview[]>
  hasErrors: Ref<boolean>

  // Actions
  addFiles: (fileList: FileList | File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  uploadAll: () => Promise<UploadedFile[]>
  uploadFile: (id: string) => Promise<UploadedFile | null>
  retryUpload: (id: string) => Promise<UploadedFile | null>
  reorderFiles: (fromIndex: number, toIndex: number) => void

  // Drag & Drop handlers
  handleDragEnter: (e: DragEvent) => void
  handleDragLeave: (e: DragEvent) => void
  handleDragOver: (e: DragEvent) => void
  handleDrop: (e: DragEvent) => void

  // Input handler
  handleInputChange: (e: Event) => void

  // Validation
  validateFile: (file: File) => { valid: boolean; error?: string }
}

/**
 * File upload composable with drag-drop, preview, and progress tracking
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes,
    allowedExtensions,
    folder,
    autoUpload = false,
    onUploadSuccess,
    onUploadError,
    onAllUploadsComplete,
  } = options

  // State
  const files = ref<FileWithPreview[]>([])
  const isDragging = ref(false)
  const isUploading = ref(false)
  const uploadProgress = ref(0)

  // Computed
  const hasFiles = computed(() => files.value.length > 0)
  const totalSize = computed(() => files.value.reduce((sum, f) => sum + f.file.size, 0))
  const uploadedFiles = computed(() =>
    files.value.filter((f) => f.status === 'success' && f.uploaded).map((f) => f.uploaded!)
  )
  const pendingFiles = computed(() =>
    files.value.filter((f) => f.status === 'pending' || f.status === 'error')
  )
  const hasErrors = computed(() => files.value.some((f) => f.status === 'error'))

  // Generate unique ID
  const generateId = (): string => {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Create preview URL for images
  const createPreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    // Return icon placeholder for non-images
    return ''
  }

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check max files
    if (files.value.length >= maxFiles) {
      return { valid: false, error: `Maximum ${maxFiles} files allowed` }
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
    }

    // Check allowed types
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` }
    }

    // Check allowed extensions
    if (allowedExtensions) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !allowedExtensions.includes(ext)) {
        return { valid: false, error: `File extension .${ext} is not allowed` }
      }
    }

    // Check for duplicates
    const isDuplicate = files.value.some(
      (f) => f.file.name === file.name && f.file.size === file.size
    )
    if (isDuplicate) {
      return { valid: false, error: 'File already added' }
    }

    return { valid: true }
  }

  // Add files
  const addFiles = (fileList: FileList | File[]): void => {
    const newFiles = Array.from(fileList)

    for (const file of newFiles) {
      const validation = validateFile(file)
      if (!validation.valid) {
        console.warn(`File validation failed: ${file.name} - ${validation.error}`)
        continue
      }

      const fileWithPreview: FileWithPreview = {
        id: generateId(),
        file,
        preview: createPreview(file),
        progress: 0,
        status: 'pending',
      }

      files.value.push(fileWithPreview)

      // Auto upload if enabled
      if (autoUpload) {
        uploadFile(fileWithPreview.id)
      }
    }
  }

  // Remove file
  const removeFile = (id: string): void => {
    const index = files.value.findIndex((f) => f.id === id)
    if (index !== -1) {
      const file = files.value[index]
      // Revoke preview URL to free memory
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      files.value.splice(index, 1)
    }
  }

  // Clear all files
  const clearFiles = (): void => {
    // Revoke all preview URLs
    files.value.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview)
      }
    })
    files.value = []
    uploadProgress.value = 0
  }

  // Upload single file
  const uploadFile = async (id: string): Promise<UploadedFile | null> => {
    const fileItem = files.value.find((f) => f.id === id)
    if (!fileItem || fileItem.status === 'uploading') return null

    fileItem.status = 'uploading'
    fileItem.progress = 0
    fileItem.error = undefined

    try {
      const isImage = fileItem.file.type.startsWith('image/')
      const uploadFn = isImage ? uploadService.uploadImage : uploadService.uploadFile

      const result = await uploadFn(fileItem.file, {
        folder,
        onProgress: (progress: UploadProgress) => {
          fileItem.progress = progress.percentage
          updateOverallProgress()
        },
      })

      fileItem.status = 'success'
      fileItem.progress = 100
      fileItem.uploaded = result
      onUploadSuccess?.(fileItem, result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      fileItem.status = 'error'
      fileItem.error = errorMessage
      onUploadError?.(fileItem, errorMessage)
      return null
    }
  }

  // Retry failed upload
  const retryUpload = async (id: string): Promise<UploadedFile | null> => {
    const fileItem = files.value.find((f) => f.id === id)
    if (!fileItem || fileItem.status !== 'error') return null
    return uploadFile(id)
  }

  // Upload all pending files
  const uploadAll = async (): Promise<UploadedFile[]> => {
    const pending = files.value.filter((f) => f.status === 'pending' || f.status === 'error')
    if (pending.length === 0) return uploadedFiles.value

    isUploading.value = true
    uploadProgress.value = 0

    const results: UploadedFile[] = []

    for (const fileItem of pending) {
      const result = await uploadFile(fileItem.id)
      if (result) {
        results.push(result)
      }
    }

    isUploading.value = false
    onAllUploadsComplete?.(results)
    return results
  }

  // Update overall progress
  const updateOverallProgress = (): void => {
    const total = files.value.length
    if (total === 0) {
      uploadProgress.value = 0
      return
    }
    const sum = files.value.reduce((acc, f) => acc + f.progress, 0)
    uploadProgress.value = Math.round(sum / total)
  }

  // Reorder files
  const reorderFiles = (fromIndex: number, toIndex: number): void => {
    const item = files.value.splice(fromIndex, 1)[0]
    files.value.splice(toIndex, 0, item)
  }

  // Drag & Drop handlers
  const handleDragEnter = (e: DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = true
  }

  const handleDragLeave = (e: DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = false
  }

  const handleDragOver = (e: DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (e: DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = false

    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files)
    }
  }

  // Input change handler
  const handleInputChange = (e: Event): void => {
    const input = e.target as HTMLInputElement
    if (input.files) {
      addFiles(input.files)
      // Reset input to allow selecting same file again
      input.value = ''
    }
  }

  return {
    // State
    files,
    isDragging,
    isUploading,
    uploadProgress,

    // Computed
    hasFiles,
    totalSize,
    uploadedFiles,
    pendingFiles,
    hasErrors,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    uploadAll,
    uploadFile,
    retryUpload,
    reorderFiles,

    // Drag & Drop handlers
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,

    // Input handler
    handleInputChange,

    // Validation
    validateFile,
  }
}

/**
 * Simple image upload composable for single image fields
 */
export function useImageUpload(options: Omit<UseFileUploadOptions, 'maxFiles'> = {}) {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return useFileUpload({
    ...options,
    maxFiles: 1,
    allowedTypes: options.allowedTypes || imageTypes,
  })
}

/**
 * Multiple images upload composable for galleries
 */
export function useGalleryUpload(options: UseFileUploadOptions = {}) {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return useFileUpload({
    ...options,
    allowedTypes: options.allowedTypes || imageTypes,
  })
}
