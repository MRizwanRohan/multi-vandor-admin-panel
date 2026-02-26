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
  AttributeDataTypeInfo,
} from '@/types'
import type { PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/attribute-templates`

export const attributeTemplateService = {
  // ─────────────────────────────────────────────────────────────────
  // Template CRUD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get paginated attribute templates
   * GET /admin/attribute-templates
   */
  async getAll(params?: AttributeTemplateListParams): Promise<PaginatedResponse<AttributeTemplate>> {
    const response = await api.get<PaginatedResponse<AttributeTemplate>>(prefix(), { params })
    return response.data
  },

  /**
   * Get single attribute template by slug or ID
   * GET /admin/attribute-templates/{template}
   */
  async getBySlug(slugOrId: string | number): Promise<AttributeTemplate> {
    const response = await api.get<{ data: AttributeTemplate }>(`${prefix()}/${slugOrId}`)
    return response.data.data
  },

  /**
   * Alias for getBySlug for backwards compatibility
   */
  async getById(id: number): Promise<AttributeTemplate> {
    return this.getBySlug(id)
  },

  /**
   * Create attribute template
   * POST /admin/attribute-templates
   */
  async create(data: CreateAttributeTemplateRequest): Promise<AttributeTemplate> {
    const response = await api.post<{ data: AttributeTemplate }>(prefix(), data)
    return response.data.data
  },

  /**
   * Update attribute template
   * PUT /admin/attribute-templates/{template}
   */
  async update(slugOrId: string | number, data: Partial<UpdateAttributeTemplateRequest>): Promise<AttributeTemplate> {
    const response = await api.put<{ data: AttributeTemplate }>(`${prefix()}/${slugOrId}`, data)
    return response.data.data
  },

  /**
   * Delete attribute template
   * DELETE /admin/attribute-templates/{template}
   */
  async delete(slugOrId: string | number): Promise<void> {
    await api.delete(`${prefix()}/${slugOrId}`)
  },

  /**
   * Toggle active status
   * PUT /admin/attribute-templates/{template}/toggle-active
   */
  async toggleActive(slugOrId: string | number): Promise<AttributeTemplate> {
    const response = await api.put<{ data: AttributeTemplate }>(`${prefix()}/${slugOrId}/toggle-active`)
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Filtered Lists (Static Routes)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get active templates only (for dropdowns)
   * GET /admin/attribute-templates/active
   */
  async getActive(): Promise<AttributeTemplate[]> {
    const response = await api.get<{ data: AttributeTemplate[] }>(`${prefix()}/active`)
    return response.data.data
  },

  /**
   * Alias for getActive for backwards compatibility
   */
  async getAllForSelect(): Promise<AttributeTemplate[]> {
    return this.getActive()
  },

  /**
   * Get variant-defining templates
   * GET /admin/attribute-templates/variant-defining
   */
  async getVariantDefining(): Promise<AttributeTemplate[]> {
    const response = await api.get<{ data: AttributeTemplate[] }>(`${prefix()}/variant-defining`)
    return response.data.data
  },

  /**
   * Get filterable templates
   * GET /admin/attribute-templates/filterable
   */
  async getFilterable(): Promise<AttributeTemplate[]> {
    const response = await api.get<{ data: AttributeTemplate[] }>(`${prefix()}/filterable`)
    return response.data.data
  },

  /**
   * Get data types for dropdown
   * GET /admin/attribute-templates/data-types
   */
  async getDataTypes(): Promise<AttributeDataTypeInfo[]> {
    const response = await api.get<{ data: AttributeDataTypeInfo[] }>(`${prefix()}/data-types`)
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Category-Related
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get templates by category
   * GET /admin/attribute-templates/by-category/{category}
   */
  async getByCategory(categorySlug: string, includeInherited = true): Promise<AttributeTemplate[]> {
    const response = await api.get<{ data: AttributeTemplate[] }>(
      `${prefix()}/by-category/${categorySlug}`,
      { params: { include_inherited: includeInherited } }
    )
    return response.data.data
  },

  /**
   * Generate variant combinations for a category
   * GET /admin/attribute-templates/variant-combinations/{category}
   */
  async getVariantCombinations(categorySlug: string): Promise<Record<string, { template_name: string; option_value: string; option_label: string }>[]> {
    const response = await api.get<{ data: Record<string, { template_name: string; option_value: string; option_label: string }>[] }>(
      `${prefix()}/variant-combinations/${categorySlug}`
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Option Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Add option to template
   * POST /admin/attribute-templates/{template}/options
   */
  async addOption(templateSlug: string | number, data: CreateAttributeOptionRequest): Promise<AttributeTemplateOption> {
    const response = await api.post<{ data: AttributeTemplateOption }>(
      `${prefix()}/${templateSlug}/options`,
      data
    )
    return response.data.data
  },

  /**
   * Update option
   * PUT /admin/attribute-templates/options/{option}
   */
  async updateOption(optionId: number, data: Partial<UpdateAttributeOptionRequest>): Promise<AttributeTemplateOption> {
    const response = await api.put<{ data: AttributeTemplateOption }>(
      `${prefix()}/options/${optionId}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete option
   * DELETE /admin/attribute-templates/options/{option}
   */
  async deleteOption(optionId: number): Promise<void> {
    await api.delete(`${prefix()}/options/${optionId}`)
  },

  /**
   * Deprecate option (instead of delete when in use)
   * PUT /admin/attribute-templates/options/{option}/deprecate
   */
  async deprecateOption(optionId: number): Promise<AttributeTemplateOption> {
    const response = await api.put<{ data: AttributeTemplateOption }>(
      `${prefix()}/options/${optionId}/deprecate`
    )
    return response.data.data
  },

  /**
   * Reorder options
   * PUT /admin/attribute-templates/{template}/options/reorder
   */
  async reorderOptions(templateSlug: string | number, order: number[]): Promise<void> {
    await api.put(`${prefix()}/${templateSlug}/options/reorder`, { order })
  },
}
