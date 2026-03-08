// ─────────────────────────────────────────────────────────────────────────────
// Search Service — wraps /api/v1/admin/search and /api/v1/vendor/search
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'
import type { AdminSearchResults, VendorSearchResults, SearchType, SearchMeta } from '@/types/search'

interface SearchApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta: SearchMeta
}

export const searchService = {
  /**
   * Search across all admin-accessible resources.
   * GET /api/v1/admin/search?q=&type=all&limit=5
   */
  async adminSearch(
    q: string,
    type: SearchType = 'all',
    limit = 5,
  ): Promise<{ results: AdminSearchResults; meta: SearchMeta }> {
    const { data } = await api.get<SearchApiResponse<AdminSearchResults>>(
      '/admin/search',
      { params: { q, type, limit } },
    )
    return { results: data.data, meta: data.meta }
  },

  /**
   * Search across vendor-accessible resources (own products + orders).
   * GET /api/v1/vendor/search?q=&type=all&limit=5
   */
  async vendorSearch(
    q: string,
    type: Extract<SearchType, 'all' | 'products' | 'orders'> = 'all',
    limit = 5,
  ): Promise<{ results: VendorSearchResults; meta: SearchMeta }> {
    const { data } = await api.get<SearchApiResponse<VendorSearchResults>>(
      '/vendor/search',
      { params: { q, type, limit } },
    )
    return { results: data.data, meta: data.meta }
  },
}
