// ═══════════════════════════════════════════════════════════════════
// Shipping Service — Shipping Zones, Methods, Rates API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type { PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/shipping`

export interface ShippingZone {
  id: number
  name: string
  regions: ShippingRegion[]
  methods: ShippingMethod[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShippingRegion {
  id: number
  zone_id: number
  type: 'country' | 'state' | 'city' | 'postcode'
  code: string
  name: string
}

export interface ShippingMethod {
  id: number
  zone_id: number
  name: string
  description: string | null
  type: 'flat_rate' | 'free_shipping' | 'local_pickup' | 'weight_based' | 'price_based'
  cost: number
  min_order_amount: number | null
  max_order_amount: number | null
  min_weight: number | null
  max_weight: number | null
  estimated_days_min: number | null
  estimated_days_max: number | null
  is_active: boolean
  sort_order: number
}

export interface ShippingRate {
  id: number
  method_id: number
  min_value: number
  max_value: number | null
  cost: number
}

export interface ShippingClass {
  id: number
  name: string
  slug: string
  description: string | null
  product_count: number
}

// ── DTOs ──
export interface CreateShippingZoneRequest {
  name: string
  regions: { type: string; code: string; name: string }[]
  is_active?: boolean
}

export interface CreateShippingMethodRequest {
  zone_id: number
  name: string
  description?: string
  type: ShippingMethod['type']
  cost: number
  min_order_amount?: number
  max_order_amount?: number
  min_weight?: number
  max_weight?: number
  estimated_days_min?: number
  estimated_days_max?: number
  is_active?: boolean
  rates?: { min_value: number; max_value?: number; cost: number }[]
}

export interface ShippingCalculation {
  zone: ShippingZone | null
  available_methods: {
    method: ShippingMethod
    cost: number
    estimated_delivery: string
  }[]
}

export const shippingService = {
  // ─────────────────────────────────────────────────────────────────
  // Shipping Zones
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get all shipping zones
   */
  async getZones(): Promise<ShippingZone[]> {
    const response = await api.get<{ data: ShippingZone[] }>(`${prefix()}/zones`)
    return response.data.data
  },

  /**
   * Get single shipping zone
   */
  async getZoneById(id: number): Promise<ShippingZone> {
    const response = await api.get<{ data: ShippingZone }>(`${prefix()}/zones/${id}`)
    return response.data.data
  },

  /**
   * Create shipping zone
   */
  async createZone(data: CreateShippingZoneRequest): Promise<ShippingZone> {
    const response = await api.post<{ data: ShippingZone }>(`${prefix()}/zones`, data)
    return response.data.data
  },

  /**
   * Update shipping zone
   */
  async updateZone(id: number, data: Partial<CreateShippingZoneRequest>): Promise<ShippingZone> {
    const response = await api.put<{ data: ShippingZone }>(`${prefix()}/zones/${id}`, data)
    return response.data.data
  },

  /**
   * Delete shipping zone
   */
  async deleteZone(id: number): Promise<void> {
    await api.delete(`${prefix()}/zones/${id}`)
  },

  /**
   * Toggle zone active status
   */
  async toggleZoneActive(id: number): Promise<ShippingZone> {
    const response = await api.patch<{ data: ShippingZone }>(`${prefix()}/zones/${id}/toggle`)
    return response.data.data
  },

  /**
   * Reorder zones
   */
  async reorderZones(zoneIds: number[]): Promise<void> {
    await api.post(`${prefix()}/zones/reorder`, { ids: zoneIds })
  },

  // ─────────────────────────────────────────────────────────────────
  // Shipping Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get methods for a zone
   */
  async getMethods(zoneId: number): Promise<ShippingMethod[]> {
    const response = await api.get<{ data: ShippingMethod[] }>(
      `${prefix()}/zones/${zoneId}/methods`
    )
    return response.data.data
  },

  /**
   * Get single method
   */
  async getMethodById(id: number): Promise<ShippingMethod> {
    const response = await api.get<{ data: ShippingMethod }>(`${prefix()}/methods/${id}`)
    return response.data.data
  },

  /**
   * Create shipping method
   */
  async createMethod(data: CreateShippingMethodRequest): Promise<ShippingMethod> {
    const response = await api.post<{ data: ShippingMethod }>(`${prefix()}/methods`, data)
    return response.data.data
  },

  /**
   * Update shipping method
   */
  async updateMethod(id: number, data: Partial<CreateShippingMethodRequest>): Promise<ShippingMethod> {
    const response = await api.put<{ data: ShippingMethod }>(`${prefix()}/methods/${id}`, data)
    return response.data.data
  },

  /**
   * Delete shipping method
   */
  async deleteMethod(id: number): Promise<void> {
    await api.delete(`${prefix()}/methods/${id}`)
  },

  /**
   * Toggle method active status
   */
  async toggleMethodActive(id: number): Promise<ShippingMethod> {
    const response = await api.patch<{ data: ShippingMethod }>(`${prefix()}/methods/${id}/toggle`)
    return response.data.data
  },

  /**
   * Reorder methods
   */
  async reorderMethods(zoneId: number, methodIds: number[]): Promise<void> {
    await api.post(`${prefix()}/zones/${zoneId}/methods/reorder`, { ids: methodIds })
  },

  // ─────────────────────────────────────────────────────────────────
  // Shipping Classes
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get all shipping classes
   */
  async getClasses(): Promise<ShippingClass[]> {
    const response = await api.get<{ data: ShippingClass[] }>(`${prefix()}/classes`)
    return response.data.data
  },

  /**
   * Create shipping class
   */
  async createClass(data: { name: string; slug?: string; description?: string }): Promise<ShippingClass> {
    const response = await api.post<{ data: ShippingClass }>(`${prefix()}/classes`, data)
    return response.data.data
  },

  /**
   * Update shipping class
   */
  async updateClass(
    id: number,
    data: { name?: string; slug?: string; description?: string }
  ): Promise<ShippingClass> {
    const response = await api.put<{ data: ShippingClass }>(`${prefix()}/classes/${id}`, data)
    return response.data.data
  },

  /**
   * Delete shipping class
   */
  async deleteClass(id: number): Promise<void> {
    await api.delete(`${prefix()}/classes/${id}`)
  },

  // ─────────────────────────────────────────────────────────────────
  // Shipping Calculation
  // ─────────────────────────────────────────────────────────────────

  /**
   * Calculate shipping for an order
   */
  async calculate(data: {
    country_code: string
    state_code?: string
    city?: string
    postcode?: string
    items: { product_id: number; quantity: number; weight?: number }[]
    order_total: number
  }): Promise<ShippingCalculation> {
    const response = await api.post<{ data: ShippingCalculation }>(`${prefix()}/calculate`, data)
    return response.data.data
  },

  /**
   * Get available regions (countries, states)
   */
  async getAvailableRegions(parentCode?: string): Promise<
    { code: string; name: string; type: string }[]
  > {
    const response = await api.get<{ data: { code: string; name: string; type: string }[] }>(
      `${prefix()}/regions`,
      { params: { parent: parentCode } }
    )
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Vendor Shipping Settings
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get vendor shipping settings
   */
  async getVendorSettings(): Promise<{
    shipping_enabled: boolean
    default_zone_id: number | null
    handling_time_days: number
    free_shipping_threshold: number | null
  }> {
    const response = await api.get<{
      data: {
        shipping_enabled: boolean
        default_zone_id: number | null
        handling_time_days: number
        free_shipping_threshold: number | null
      }
    }>(`${prefix()}/vendor-settings`)
    return response.data.data
  },

  /**
   * Update vendor shipping settings
   */
  async updateVendorSettings(data: {
    shipping_enabled?: boolean
    default_zone_id?: number
    handling_time_days?: number
    free_shipping_threshold?: number | null
  }): Promise<void> {
    await api.put(`${prefix()}/vendor-settings`, data)
  },
}
