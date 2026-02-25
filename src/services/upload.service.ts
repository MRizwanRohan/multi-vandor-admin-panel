// ═══════════════════════════════════════════════════════════════════
// Upload Service — File/Image Upload API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'

const prefix = () => `${getRolePrefix()}/uploads`

export interface UploadedFile {
  id: number
  name: string
  original_name: string
  path: string
  url: string
  mime_type: string
  size: number
  type: 'image' | 'document' | 'video' | 'other'
  width?: number
  height?: number
  uploaded_at: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadOptions {
  folder?: string
  resize?: { width: number; height: number; fit?: 'cover' | 'contain' | 'fill' }
  optimize?: boolean
  maxSize?: number
  onProgress?: (progress: UploadProgress) => void
}

export interface ChunkedUploadSession {
  session_id: string
  filename: string
  total_chunks: number
  uploaded_chunks: number
  expires_at: string
}

export const uploadService = {
  // ─────────────────────────────────────────────────────────────────
  // Single File Upload
  // ─────────────────────────────────────────────────────────────────

  /**
   * Upload single file
   */
  async uploadFile(file: File, options?: UploadOptions): Promise<UploadedFile> {
    const formData = new FormData()
    formData.append('file', file)

    if (options?.folder) formData.append('folder', options.folder)
    if (options?.resize) formData.append('resize', JSON.stringify(options.resize))
    if (options?.optimize !== undefined) formData.append('optimize', String(options.optimize))

    const response = await api.post<{ data: UploadedFile }>(`${prefix()}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          options.onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          })
        }
      },
    })
    return response.data.data
  },

  /**
   * Upload single image
   */
  async uploadImage(file: File, options?: UploadOptions): Promise<UploadedFile> {
    const formData = new FormData()
    formData.append('image', file)

    if (options?.folder) formData.append('folder', options.folder)
    if (options?.resize) formData.append('resize', JSON.stringify(options.resize))
    if (options?.optimize !== undefined) formData.append('optimize', String(options.optimize))

    const response = await api.post<{ data: UploadedFile }>(`${prefix()}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          options.onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          })
        }
      },
    })
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Multiple Files Upload
  // ─────────────────────────────────────────────────────────────────

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options?: Omit<UploadOptions, 'onProgress'> & {
      onProgress?: (fileIndex: number, progress: UploadProgress) => void
      onFileComplete?: (fileIndex: number, result: UploadedFile) => void
    }
  ): Promise<UploadedFile[]> {
    const results: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(files[i], {
        ...options,
        onProgress: (progress) => options?.onProgress?.(i, progress),
      })
      results.push(result)
      options?.onFileComplete?.(i, result)
    }

    return results
  },

  /**
   * Upload multiple images
   */
  async uploadImages(
    files: File[],
    options?: Omit<UploadOptions, 'onProgress'> & {
      onProgress?: (fileIndex: number, progress: UploadProgress) => void
      onFileComplete?: (fileIndex: number, result: UploadedFile) => void
    }
  ): Promise<UploadedFile[]> {
    const results: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadImage(files[i], {
        ...options,
        onProgress: (progress) => options?.onProgress?.(i, progress),
      })
      results.push(result)
      options?.onFileComplete?.(i, result)
    }

    return results
  },

  /**
   * Batch upload (server-side handling)
   */
  async batchUpload(
    files: File[],
    folder?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files[]', file))
    if (folder) formData.append('folder', folder)

    const response = await api.post<{ data: UploadedFile[] }>(`${prefix()}/batch`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          })
        }
      },
    })
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Chunked Upload (for large files)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Initialize chunked upload session
   */
  async initChunkedUpload(
    filename: string,
    fileSize: number,
    mimeType: string,
    chunkSize: number = 5 * 1024 * 1024 // 5MB default
  ): Promise<ChunkedUploadSession> {
    const response = await api.post<{ data: ChunkedUploadSession }>(
      `${prefix()}/chunked/init`,
      {
        filename,
        file_size: fileSize,
        mime_type: mimeType,
        chunk_size: chunkSize,
      }
    )
    return response.data.data
  },

  /**
   * Upload chunk
   */
  async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunk: Blob,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ uploaded: number; total: number }> {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('chunk_index', String(chunkIndex))

    const response = await api.post<{ data: { uploaded: number; total: number } }>(
      `${prefix()}/chunked/${sessionId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
            })
          }
        },
      }
    )
    return response.data.data
  },

  /**
   * Complete chunked upload
   */
  async completeChunkedUpload(sessionId: string, folder?: string): Promise<UploadedFile> {
    const response = await api.post<{ data: UploadedFile }>(
      `${prefix()}/chunked/${sessionId}/complete`,
      { folder }
    )
    return response.data.data
  },

  /**
   * Cancel chunked upload
   */
  async cancelChunkedUpload(sessionId: string): Promise<void> {
    await api.delete(`${prefix()}/chunked/${sessionId}`)
  },

  // ─────────────────────────────────────────────────────────────────
  // File Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Delete uploaded file
   */
  async deleteFile(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Delete multiple files
   */
  async deleteFiles(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-delete`,
      { ids }
    )
    return response.data.data
  },

  /**
   * Get file info
   */
  async getFileInfo(id: number): Promise<UploadedFile> {
    const response = await api.get<{ data: UploadedFile }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Get signed URL for private file
   */
  async getSignedUrl(id: number, expiresInMinutes: number = 60): Promise<string> {
    const response = await api.get<{ data: { url: string } }>(`${prefix()}/${id}/signed-url`, {
      params: { expires: expiresInMinutes },
    })
    return response.data.data.url
  },

  // ─────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number // in bytes
      allowedTypes?: string[]
      allowedExtensions?: string[]
    }
  ): { valid: boolean; error?: string } {
    const { maxSize, allowedTypes, allowedExtensions } = options

    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` }
    }

    if (allowedExtensions) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !allowedExtensions.includes(ext)) {
        return { valid: false, error: `File extension .${ext} is not allowed` }
      }
    }

    return { valid: true }
  },

  /**
   * Create object URL for preview
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  },

  /**
   * Revoke object URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  },
}
