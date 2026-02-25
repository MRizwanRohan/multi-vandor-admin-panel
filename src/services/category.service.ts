// ═══════════════════════════════════════════════════════════════════
// Category Service — Category API calls
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import { getRolePrefix } from './api'
import type { Category, PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/categories`

export interface CategoryFilters {
  search?: string
  parent_id?: number | null
  status?: string
  is_featured?: boolean
  page?: number
  per_page?: number
}

export interface CategoryFormData {
  name: string
  slug?: string
  description?: string
  parent_id?: number | null
  image?: string | File
  icon?: string
  status: 'active' | 'inactive'
  is_featured?: boolean
  sort_order?: number
  meta_title?: string
  meta_description?: string
  attribute_template_id?: number | null
}

export const categoryService = {
  /**
   * Get paginated categories
   */
  async getAll(filters?: CategoryFilters): Promise<PaginatedResponse<Category>> {
    const response = await api.get<PaginatedResponse<Category>>(prefix(), { params: filters })
    return response.data
  },

  /**
   * Get categories tree (nested structure)
   */
  async getTree(): Promise<Category[]> {
    const response = await api.get<{ data: Category[] }>(`${prefix()}/tree`)
    return response.data.data
  },

  /**
   * Get single category
   */
  async getById(id: number): Promise<Category> {
    const response = await api.get<{ data: Category }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Create category
   */
  async create(data: CategoryFormData): Promise<Category> {
    const formData = buildFormData(data)
    const response = await api.post<{ data: Category }>(prefix(), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Update category
   */
  async update(id: number, data: Partial<CategoryFormData>): Promise<Category> {
    const formData = buildFormData(data)
    formData.append('_method', 'PUT')
    const response = await api.post<{ data: Category }>(`${prefix()}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * Delete category
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Reorder categories
   */
  async reorder(items: { id: number; sort_order: number; parent_id?: number | null }[]): Promise<void> {
    await api.post(`${prefix()}/reorder`, { items })
  },

  /**
   * Get category attributes
   */
  async getAttributes(id: number): Promise<{ id: number; name: string; values: string[] }[]> {
    const response = await api.get(`${prefix()}/${id}/attributes`)
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Toggle & Status Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Toggle category active status
   */
  async toggleActive(id: number): Promise<Category> {
    const response = await api.patch<{ data: Category }>(`${prefix()}/${id}/toggle-active`)
    return response.data.data
  },

  /**
   * Bulk toggle active status
   */
  async bulkToggleActive(ids: number[], isActive: boolean): Promise<{ success: number; failed: number }> {
    const response = await api.patch<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-toggle-active`,
      { ids, is_active: isActive }
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Category Suggestion (Vendor Feature)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Submit category suggestion (vendor)
   */
  async suggestCategory(data: CategorySuggestionData): Promise<CategorySuggestion> {
    const response = await api.post<{ data: CategorySuggestion }>(`${prefix()}/suggestions`, data)
    return response.data.data
  },

  /**
   * Get pending category suggestions (admin)
   */
  async getPendingSuggestions(
    filters?: { page?: number; per_page?: number; status?: string }
  ): Promise<PaginatedResponse<CategorySuggestion>> {
    const response = await api.get<PaginatedResponse<CategorySuggestion>>(
      `${prefix()}/suggestions`,
      { params: filters }
    )
    return response.data
  },

  /**
   * Approve category suggestion (admin)
   */
  async approveSuggestion(id: number, categoryData?: Partial<CategoryFormData>): Promise<Category> {
    const response = await api.post<{ data: Category }>(
      `${prefix()}/suggestions/${id}/approve`,
      categoryData || {}
    )
    return response.data.data
  },

  /**
   * Reject category suggestion (admin)
   */
  async rejectSuggestion(id: number, reason: string): Promise<void> {
    await api.post(`${prefix()}/suggestions/${id}/reject`, { reason })
  },
}

// ─────────────────────────────────────────────────────────────────
// Category Suggestion Types
// ─────────────────────────────────────────────────────────────────

export interface CategorySuggestionData {
  name: string
  parent_id?: number | null
  description?: string
  reason?: string
}

export interface CategorySuggestion {
  id: number
  name: string
  parent_id: number | null
  parent_name: string | null
  description: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  vendor_id: number
  vendor_name: string
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

// Helper to build FormData
function buildFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData()
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    
    if (value instanceof File) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, String(item))
      })
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  })
  
  return formData
}
