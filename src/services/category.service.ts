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
   * Show category details
   */
  async getById(id: number): Promise<Category> {
    const response = await api.get<ApiItemResponse>(`${adminPrefix()}/${id}`)
    return response.data.data
  },

  /**
   * PUT /v1/admin/categories/{category}
   * Update a category
   */
  async update(id: number, data: Partial<CategoryFormData>): Promise<Category> {
    const formData = buildFormData(data)
    formData.append('_method', 'PUT')
    const response = await api.post<ApiItemResponse>(`${adminPrefix()}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  /**
   * DELETE /v1/admin/categories/{category}
   * Delete a category
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${adminPrefix()}/${id}`)
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
  async approve(id: number, payload?: CategoryApprovePayload): Promise<Category> {
    const response = await api.put<ApiItemResponse>(
      `${adminPrefix()}/${id}/approve`,
      payload ?? {},
    )
    return response.data.data
  },

  /**
   * PUT /v1/admin/categories/{category}/reject
   * Reject a pending category — with reason, optional suggested alternative & admin notes
   */
  async reject(id: number, payload: CategoryRejectPayload): Promise<Category> {
    const response = await api.put<ApiItemResponse>(`${adminPrefix()}/${id}/reject`, payload)
    return response.data.data
  },

  /**
   * PUT /v1/admin/categories/{category}/toggle-active
   * Toggle category active status
   */
  async toggleActive(id: number): Promise<Category> {
    const response = await api.put<ApiItemResponse>(`${adminPrefix()}/${id}/toggle-active`)
    return response.data.data
  },

  /**
   * GET /v1/admin/categories/{category}/children
   * Get children of a category
   */
  async getChildren(id: number, status?: string): Promise<Category[]> {
    const response = await api.get<ApiListResponse>(`${adminPrefix()}/${id}/children`, {
      params: status ? { status } : undefined,
    })
    return response.data.data
  },

  /**
   * GET /v1/admin/categories/{category}/templates
   * Get attribute templates for a category
   */
  async getTemplates(id: number, includeInherited?: boolean): Promise<CategoryTemplateAssignment[]> {
    const response = await api.get(`${adminPrefix()}/${id}/templates`, {
      params: includeInherited !== undefined ? { include_inherited: includeInherited } : undefined,
    })
    return response.data.data
  },

  /**
   * PUT /v1/admin/categories/{category}/templates
   * Sync attribute templates for a category
   */
  async syncTemplates(
    id: number,
    templates: {
      attribute_template_id: number
      is_required_override?: boolean | null
      display_order?: number
      inheritance_mode?: 'inherit' | 'replace' | null
    }[]
  ): Promise<void> {
    await api.put(`${adminPrefix()}/${id}/templates`, { templates })
  },

  /**
   * GET /v1/admin/categories/{category}/requests
   * Get category request history (approval/rejection audit trail)
   */
  async getRequestHistory(id: number): Promise<CategoryRequest[]> {
    const response = await api.get(`${adminPrefix()}/${id}/requests`)
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
    display_order?: number
    metadata?: {
      seo_title?: string
      seo_description?: string
      keywords?: string[]
    }
  }): Promise<Category> {
    const response = await api.post<ApiItemResponse>(vendorPrefix(), data)
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
   * Show category details (vendor)
   */
  async getVendorCategoryDetail(id: number): Promise<Category> {
    const response = await api.get<ApiItemResponse>(`${vendorPrefix()}/${id}`)
    return response.data.data
  },

  /**
   * PUT /v1/vendor/categories/{category}
   * Update own pending category (limited fields: name, description, display_order, metadata)
   */
  async updatePendingCategory(
    id: number,
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
    const response = await api.put<ApiItemResponse>(`${vendorPrefix()}/${id}`, data)
    return response.data.data
  },

  /**
   * GET /v1/vendor/categories/{category}/templates
   * Get attribute templates for a category (vendor)
   */
  async getVendorCategoryTemplates(id: number): Promise<CategoryTemplateAssignment[]> {
    const response = await api.get(`${vendorPrefix()}/${id}/templates`)
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
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  })
  
  return formData
}
