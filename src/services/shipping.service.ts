// ═══════════════════════════════════════════════════════════════════
// Shipping Service — Shipping Zones, Methods, Shipments API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type { PaginatedResponse } from '@/types'
import type {
  ShippingZone,
  ShippingMethod,
  Shipment,
  CreateShippingZoneRequest,
  UpdateShippingZoneRequest,
  CreateShippingMethodRequest,
  UpdateShippingMethodRequest,
  CreateShipmentRequest,
  UpdateShipmentRequest,
  UpdateShipmentStatusRequest,
  ShippingCalculateRequest,
  ShippingCalculateResult,
  ShippingZoneFilters,
  ShippingMethodFilters,
  ShipmentFilters,
} from '@/types'

export const shippingService = {
  // ═══════════════════════════════════════════════════════════════════
  // Admin: Shipping Zones — /admin/shipping-zones
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get all shipping zones (admin)
   */
  async getZones(filters?: ShippingZoneFilters): Promise<PaginatedResponse<ShippingZone>> {
    const response = await api.get<PaginatedResponse<ShippingZone>>(
      '/admin/shipping-zones',
      { params: filters }
    )
    return response.data
  },

  /**
   * Get single shipping zone
   */
  async getZoneById(id: number): Promise<ShippingZone> {
    const response = await api.get<{ data: ShippingZone }>(`/admin/shipping-zones/${id}`)
    return response.data.data
  },

  /**
   * Create shipping zone (admin)
   */
  async createZone(data: CreateShippingZoneRequest): Promise<ShippingZone> {
    const response = await api.post<{ data: ShippingZone }>('/admin/shipping-zones', data)
    return response.data.data
  },

  /**
   * Update shipping zone (admin)
   */
  async updateZone(id: number, data: UpdateShippingZoneRequest): Promise<ShippingZone> {
    const response = await api.put<{ data: ShippingZone }>(`/admin/shipping-zones/${id}`, data)
    return response.data.data
  },

  /**
   * Delete shipping zone (admin)
   */
  async deleteZone(id: number): Promise<void> {
    await api.delete(`/admin/shipping-zones/${id}`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // Admin: Shipping Methods — /admin/shipping-methods
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get all shipping methods (admin)
   */
  async getMethods(filters?: ShippingMethodFilters): Promise<PaginatedResponse<ShippingMethod>> {
    const response = await api.get<PaginatedResponse<ShippingMethod>>(
      '/admin/shipping-methods',
      { params: filters }
    )
    return response.data
  },

  /**
   * Get single shipping method
   */
  async getMethodById(id: number): Promise<ShippingMethod> {
    const response = await api.get<{ data: ShippingMethod }>(`/admin/shipping-methods/${id}`)
    return response.data.data
  },

  /**
   * Create shipping method (admin)
   */
  async createMethod(data: CreateShippingMethodRequest): Promise<ShippingMethod> {
    const response = await api.post<{ data: ShippingMethod }>('/admin/shipping-methods', data)
    return response.data.data
  },

  /**
   * Update shipping method (admin)
   */
  async updateMethod(id: number, data: UpdateShippingMethodRequest): Promise<ShippingMethod> {
    const response = await api.put<{ data: ShippingMethod }>(
      `/admin/shipping-methods/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete shipping method (admin)
   */
  async deleteMethod(id: number): Promise<void> {
    await api.delete(`/admin/shipping-methods/${id}`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // Vendor: Shipping Methods — /vendor/shipping/*
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get available shipping methods (platform-wide, for vendor reference)
   */
  async getAvailableMethods(): Promise<ShippingMethod[]> {
    const response = await api.get<{ data: ShippingMethod[] }>('/vendor/shipping/methods')
    return response.data.data
  },

  /**
   * Get vendor's own shipping methods
   */
  async getMyMethods(): Promise<ShippingMethod[]> {
    const response = await api.get<{ data: ShippingMethod[] }>('/vendor/shipping/my-methods')
    return response.data.data
  },

  /**
   * Create vendor shipping method
   */
  async createMyMethod(data: CreateShippingMethodRequest): Promise<ShippingMethod> {
    const response = await api.post<{ data: ShippingMethod }>('/vendor/shipping/my-methods', data)
    return response.data.data
  },

  /**
   * Update vendor shipping method
   */
  async updateMyMethod(id: number, data: UpdateShippingMethodRequest): Promise<ShippingMethod> {
    const response = await api.put<{ data: ShippingMethod }>(
      `/vendor/shipping/my-methods/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete vendor shipping method
   */
  async deleteMyMethod(id: number): Promise<void> {
    await api.delete(`/vendor/shipping/my-methods/${id}`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // Vendor: Shipments — /vendor/shipping/shipments
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get vendor shipments list
   */
  async getShipments(filters?: ShipmentFilters): Promise<PaginatedResponse<Shipment>> {
    const response = await api.get<PaginatedResponse<Shipment>>(
      '/vendor/shipping/shipments',
      { params: filters }
    )
    return response.data
  },

  /**
   * Get single shipment
   */
  async getShipmentById(id: number): Promise<Shipment> {
    const response = await api.get<{ data: Shipment }>(`/vendor/shipping/shipments/${id}`)
    return response.data.data
  },

  /**
   * Create shipment for an order
   */
  async createShipment(orderId: number, data: CreateShipmentRequest): Promise<Shipment> {
    const response = await api.post<{ data: Shipment }>(
      `/vendor/orders/${orderId}/shipment`,
      data
    )
    return response.data.data
  },

  /**
   * Update shipment details
   */
  async updateShipment(id: number, data: UpdateShipmentRequest): Promise<Shipment> {
    const response = await api.put<{ data: Shipment }>(
      `/vendor/shipping/shipments/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Update shipment status
   */
  async updateShipmentStatus(id: number, status: string): Promise<Shipment> {
    const response = await api.put<{ data: Shipment }>(
      `/vendor/shipping/shipments/${id}/status`,
      { status }
    )
    return response.data.data
  },

  // ═══════════════════════════════════════════════════════════════════
  // Shipping Zones for Vendor (read-only list)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get available shipping zones (vendor read-only)
   */
  async getAvailableZones(): Promise<ShippingZone[]> {
    // Vendors can see zones to select for their methods
    const response = await api.get<{ data: ShippingZone[] }>('/vendor/shipping/zones')
    return response.data.data
  },

  // ═══════════════════════════════════════════════════════════════════
  // Shipping Calculation
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Calculate shipping cost for cart/order
   */
  async calculate(data: ShippingCalculateRequest): Promise<ShippingCalculateResult> {
    const role = getRolePrefix()
    const response = await api.post<{ data: ShippingCalculateResult }>(
      `${role}/shipping/calculate`,
      data
    )
    return response.data.data
  },
}

// Re-export types for convenience
export type {
  ShippingZone,
  ShippingMethod,
  Shipment,
  ShipmentStatus,
  ShippingMethodType,
  ShippingRateType,
  CreateShippingZoneRequest,
  UpdateShippingZoneRequest,
  CreateShippingMethodRequest,
  UpdateShippingMethodRequest,
  CreateShipmentRequest,
  UpdateShipmentRequest,
  UpdateShipmentStatusRequest,
  ShippingCalculateRequest,
  ShippingCalculateResult,
  ShipmentFilters,
  ShippingZoneFilters,
  ShippingMethodFilters,
} from '@/types'
