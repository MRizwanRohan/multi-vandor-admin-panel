// ═══════════════════════════════════════════════════════════════════
// Category Service — Category API calls
// ═══════════════════════════════════════════════════════════════════

import api from './api'
import { getRolePrefix } from './api'
import type {
  Category,
  CategoryStatus,
  CategoryTemplateAssignment,
  CategoryApprovePayload,
  CategoryRejectPayload,
  CategoryRequest,
} from '@/types'

const adminPrefix = () => `/admin/categories`
const vendorPrefix = () => `/vendor/categories`
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
  status?: CategoryStatus
  is_active?: boolean
  display_order?: number
  metadata?: {
    seo_title?: string
    seo_description?: string
    keywords?: string[]
  }
}

// ─────────────────────────────────────────────────────────────────
// Response types matching real API
// ─────────────────────────────────────────────────────────────────
interface ApiListResponse {
  data: Category[]
  success: boolean
  message: string
}

interface ApiItemResponse {
  data: Category
  success: boolean
  message: string
}

export const categoryService = {
  // ═════════════════════════════════════════════════════════════════
  // Admin Category Endpoints
  // ═════════════════════════════════════════════════════════════════

  /**
   * GET /v1/admin/categories
   * List all categories (tree structure)
   */
  async getAll(filters?: CategoryFilters): Promise<{ data: Category[] }> {
    const response = await api.get<ApiListResponse>(adminPrefix(), { params: filters })
    return { data: response.data.data }
  },

  /**
   * POST /v1/admin/categories
   * Create a new category
   */
  async create(data: CategoryFormData): Promise<Category> {
    const formData = buildFormData(data)
    const response = await api.post<ApiItemResponse>(adminPrefix(), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * GET /v1/admin/categories/{category}
   * Show category details (accepts both ID and slug)
   */
  async get(idOrSlug: number | string): Promise<Category> {
    const response = await api.get<ApiItemResponse>(`${adminPrefix()}/${idOrSlug}`)
    return response.data.data
  },

  /**
   * GET /v1/admin/categories/{category}
   * Show category details by ID (legacy method)
   */
  async getById(id: number): Promise<Category> {
    return this.get(id)
  },

  /**
   * PUT /v1/admin/categories/{category}
   * Update a category (accepts both ID and slug)
   */
  async update(idOrSlug: number | string, data: Partial<CategoryFormData>): Promise<Category> {
    const formData = buildFormData(data)
    formData.append('_method', 'PUT')
    const response = await api.post<ApiItemResponse>(`${adminPrefix()}/${idOrSlug}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * DELETE /v1/admin/categories/{category}
   * Delete a category (accepts both ID and slug)
   */
  async delete(idOrSlug: number | string): Promise<void> {
    await api.delete(`${adminPrefix()}/${idOrSlug}`)
  },

  /**
   * GET /v1/admin/categories/pending
   * List pending categories
   */
  async getPending(): Promise<{ data: Category[] }> {
    const response = await api.get<ApiListResponse>(`${adminPrefix()}/pending`)
    return { data: response.data.data }
  },

  /**
   * PUT /v1/admin/categories/reorder
   * Reorder categories — sends ordered array of IDs
   */
  async reorder(order: number[]): Promise<void> {
    await api.put(`${adminPrefix()}/reorder`, { order })
  },

  /**
   * PUT /v1/admin/categories/{category}/approve
   * Approve a pending category — optionally with modifications
   */
  async approve(idOrSlug: number | string, payload?: CategoryApprovePayload): Promise<Category> {
    const response = await api.put<ApiItemResponse>(
      `${adminPrefix()}/${idOrSlug}/approve`,
      payload ?? {},
    )
    return response.data.data
  },

  /**
   * PUT /v1/admin/categories/{category}/reject
   * Reject a pending category — with reason, optional suggested alternative & admin notes
   */
  async reject(idOrSlug: number | string, payload: CategoryRejectPayload): Promise<Category> {
    const response = await api.put<ApiItemResponse>(`${adminPrefix()}/${idOrSlug}/reject`, payload)
    return response.data.data
  },

  /**
   * PUT /v1/admin/categories/{category}/toggle-active
   * Toggle category active status
   */
  async toggleActive(idOrSlug: number | string): Promise<Category> {
    const response = await api.put<ApiItemResponse>(`${adminPrefix()}/${idOrSlug}/toggle-active`)
    return response.data.data
  },

  /**
   * GET /v1/admin/categories/{category}/children
   * Get children of a category
   */
  async getChildren(idOrSlug: number | string, status?: string): Promise<Category[]> {
    const response = await api.get<ApiListResponse>(`${adminPrefix()}/${idOrSlug}/children`, {
      params: status ? { status } : undefined,
    })
    return response.data.data
  },

  /**
   * GET /v1/admin/categories/{category}/templates
   * Get attribute templates for a category
   */
  async getCategoryTemplates(idOrSlug: number | string, includeInherited?: boolean): Promise<CategoryTemplateAssignment[]> {
    const response = await api.get(`${adminPrefix()}/${idOrSlug}/templates`, {
      params: includeInherited !== undefined ? { include_inherited: includeInherited } : undefined,
    })
    return response.data.data
  },

  /**
   * GET /v1/admin/categories/{category}/templates (legacy alias)
   */
  async getTemplates(idOrSlug: number | string, includeInherited?: boolean): Promise<CategoryTemplateAssignment[]> {
    return this.getCategoryTemplates(idOrSlug, includeInherited)
  },

  /**
   * PUT /v1/admin/categories/{category}/templates
   * Sync attribute templates for a category
   */
  async syncTemplates(
    idOrSlug: number | string,
    templates: {
      attribute_template_id: number
      is_required_override?: boolean | null
      display_order?: number
      inheritance_mode?: 'inherit' | 'replace' | null
    }[]
  ): Promise<void> {
    await api.put(`${adminPrefix()}/${idOrSlug}/templates`, { templates })
  },

  /**
   * GET /v1/admin/categories/{category}/requests
   * Get category request history (approval/rejection audit trail)
   */
  async getRequestHistory(idOrSlug: number | string): Promise<CategoryRequest[]> {
    const response = await api.get(`${adminPrefix()}/${idOrSlug}/requests`)
    return response.data.data
  },

  // ═════════════════════════════════════════════════════════════════
  // Vendor Category Endpoints
  // ═════════════════════════════════════════════════════════════════

  /**
   * GET /v1/vendor/categories
   * List visible categories (all active + vendor's own pending)
   */
  async getVisibleCategories(): Promise<{ data: Category[] }> {
    const response = await api.get<ApiListResponse>(vendorPrefix())
    return { data: response.data.data }
  },

  /**
   * POST /v1/vendor/categories
   * Suggest a new category (pending admin approval)
   */
  async suggestCategory(data: {
    name: string
    description?: string
    parent_id?: number | null
    image?: File
    display_order?: number
    metadata?: {
      seo_title?: string
      seo_description?: string
      keywords?: string[]
    }
  }): Promise<Category> {
    const formData = buildFormData(data)
    const response = await api.post<ApiItemResponse>(vendorPrefix(), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * GET /v1/vendor/categories/my
   * List vendor's own categories
   */
  async getMyCategories(perPage?: number): Promise<{ data: Category[] }> {
    const response = await api.get<ApiListResponse>(`${vendorPrefix()}/my`, {
      params: perPage ? { per_page: perPage } : undefined,
    })
    return { data: response.data.data }
  },

  /**
   * GET /v1/vendor/categories/{category}
   * View category details (accepts both ID and slug)
   */
  async getVendorCategory(idOrSlug: number | string): Promise<Category> {
    const response = await api.get<ApiItemResponse>(`${vendorPrefix()}/${idOrSlug}`)
    return response.data.data
  },

  /**
   * GET /v1/vendor/categories/{category}
   * Show category details (vendor) - legacy alias
   */
  async getVendorCategoryDetail(idOrSlug: number | string): Promise<Category> {
    return this.getVendorCategory(idOrSlug)
  },

  /**
   * PUT /v1/vendor/categories/{category}
   * Update own pending category (limited fields: name, description, display_order, metadata)
   */
  async updatePendingCategory(
    idOrSlug: number | string,
    data: {
      name?: string
      description?: string
      display_order?: number
      metadata?: {
        seo_title?: string
        seo_description?: string
        keywords?: string[]
      }
    },
  ): Promise<Category> {
    const response = await api.put<ApiItemResponse>(`${vendorPrefix()}/${idOrSlug}`, data)
    return response.data.data
  },

  /**
   * GET /v1/vendor/categories/{category}/templates
   * Get attribute templates for a category (vendor)
   */
  async getVendorCategoryTemplates(idOrSlug: number | string): Promise<CategoryTemplateAssignment[]> {
    const response = await api.get(`${vendorPrefix()}/${idOrSlug}/templates`)
    return response.data.data
  },
}

// Helper to build FormData
function buildFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData()
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    
    if (value instanceof File) {
      formData.append(key, value)
    } else if (typeof value === 'boolean') {
      // Laravel expects '1' or '0' for boolean fields in FormData
      formData.append(key, value ? '1' : '0')
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, String(item))
      })
    } else if (typeof value === 'object') {
      // For nested objects like metadata, use Laravel's array notation
      Object.entries(value as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== null && nestedValue !== undefined) {
          if (Array.isArray(nestedValue)) {
            nestedValue.forEach((item, index) => {
              formData.append(`${key}[${nestedKey}][${index}]`, String(item))
            })
          } else {
            formData.append(`${key}[${nestedKey}]`, String(nestedValue))
          }
        }
      })
    } else {
      formData.append(key, String(value))
    }
  })
  
  return formData
}
