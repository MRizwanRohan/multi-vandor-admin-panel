// ═══════════════════════════════════════════════════════════════════
// Attribute Template Service — Attribute Template API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  AttributeTemplate,
  AttributeTemplateOption,
  CreateAttributeTemplateRequest,
  UpdateAttributeTemplateRequest,
  CreateAttributeOptionRequest,
  UpdateAttributeOptionRequest,
  AttributeTemplateListParams,
} from '@/types'
import type { PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/attribute-templates`

export const attributeTemplateService = {
  /**
   * Get paginated attribute templates
   */
  async getAll(params?: AttributeTemplateListParams): Promise<PaginatedResponse<AttributeTemplate>> {
    const response = await api.get<PaginatedResponse<AttributeTemplate>>(prefix(), { params })
    return response.data
  },

  /**
   * Get all templates (no pagination) for dropdowns
   */
  async getAllForSelect(): Promise<AttributeTemplate[]> {
    const response = await api.get<{ data: AttributeTemplate[] }>(`${prefix()}/all`)
    return response.data.data
  },

  /**
   * Get single attribute template
   */
  async getById(id: number): Promise<AttributeTemplate> {
    const response = await api.get<{ data: AttributeTemplate }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Create attribute template
   */
  async create(data: CreateAttributeTemplateRequest): Promise<AttributeTemplate> {
    const response = await api.post<{ data: AttributeTemplate }>(prefix(), data)
    return response.data.data
  },

  /**
   * Update attribute template
   */
  async update(id: number, data: Partial<UpdateAttributeTemplateRequest>): Promise<AttributeTemplate> {
    const response = await api.put<{ data: AttributeTemplate }>(`${prefix()}/${id}`, data)
    return response.data.data
  },

  /**
   * Delete attribute template
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${prefix()}/${id}`)
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: number): Promise<AttributeTemplate> {
    const response = await api.patch<{ data: AttributeTemplate }>(`${prefix()}/${id}/toggle-active`)
    return response.data.data
  },

  /**
   * Reorder templates
   */
  async reorder(templateIds: number[]): Promise<void> {
    await api.post(`${prefix()}/reorder`, { ids: templateIds })
  },

  /**
   * Get templates by category
   */
  async getByCategory(categoryId: number): Promise<AttributeTemplate[]> {
    const response = await api.get<{ data: AttributeTemplate[] }>(`${prefix()}/category/${categoryId}`)
    return response.data.data
  },

  /**
   * Assign templates to category
   */
  async assignToCategory(categoryId: number, templateIds: number[]): Promise<void> {
    await api.post(`${prefix()}/assign-category`, {
      category_id: categoryId,
      template_ids: templateIds,
    })
  },

  // ─────────────────────────────────────────────────────────────────
  // Option Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get template options
   */
  async getOptions(templateId: number): Promise<AttributeTemplateOption[]> {
    const response = await api.get<{ data: AttributeTemplateOption[] }>(
      `${prefix()}/${templateId}/options`
    )
    return response.data.data
  },

  /**
   * Create option
   */
  async createOption(templateId: number, data: CreateAttributeOptionRequest): Promise<AttributeTemplateOption> {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value)
        } else {
          formData.append(key, String(value))
        }
      }
    })
    const response = await api.post<{ data: AttributeTemplateOption }>(
      `${prefix()}/${templateId}/options`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  /**
   * Update option
   */
  async updateOption(
    templateId: number,
    optionId: number,
    data: Partial<UpdateAttributeOptionRequest>
  ): Promise<AttributeTemplateOption> {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value)
        } else {
          formData.append(key, String(value))
        }
      }
    })
    const response = await api.post<{ data: AttributeTemplateOption }>(
      `${prefix()}/${templateId}/options/${optionId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  /**
   * Delete option
   */
  async deleteOption(templateId: number, optionId: number): Promise<void> {
    await api.delete(`${prefix()}/${templateId}/options/${optionId}`)
  },

  /**
   * Reorder options
   */
  async reorderOptions(templateId: number, optionIds: number[]): Promise<void> {
    await api.post(`${prefix()}/${templateId}/options/reorder`, { ids: optionIds })
  },

  /**
   * Toggle option active status
   */
  async toggleOptionActive(templateId: number, optionId: number): Promise<AttributeTemplateOption> {
    const response = await api.patch<{ data: AttributeTemplateOption }>(
      `${prefix()}/${templateId}/options/${optionId}/toggle-active`
    )
    return response.data.data
  },
}
