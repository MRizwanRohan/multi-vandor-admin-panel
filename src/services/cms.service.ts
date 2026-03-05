// ═══════════════════════════════════════════════════════════════════
// CMS Service — Pages, FAQs, Blog, Contact Messages
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  Page,
  PageFormData,
  PageFilters,
  FaqCategory,
  FaqCategoryFormData,
  Faq,
  FaqFormData,
  FaqFilters,
  BlogCategory,
  BlogCategoryFormData,
  BlogPost,
  BlogPostFormData,
  BlogFilters,
  ContactMessage,
  ContactMessageFilters,
  ContactStats,
  PaginatedResponse,
} from '@/types'

const adminPrefix = () => `${getRolePrefix()}`

// ─────────────────────────────────────────────────────────────────────
// Page Service
// ─────────────────────────────────────────────────────────────────────

export const pageService = {
  async getAll(filters?: PageFilters): Promise<PaginatedResponse<Page>> {
    const response = await api.get<any>(`${adminPrefix()}/pages`, { params: filters })
    const data = response.data?.data || response.data
    return {
      data: data?.data || data || [],
      meta: data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: 20 },
    }
  },

  async getById(id: number): Promise<Page> {
    const response = await api.get<{ data: Page }>(`${adminPrefix()}/pages/${id}`)
    return response.data.data
  },

  async create(data: PageFormData): Promise<Page> {
    const response = await api.post<{ data: Page }>(`${adminPrefix()}/pages`, data)
    return response.data.data
  },

  async update(id: number, data: Partial<PageFormData>): Promise<Page> {
    const response = await api.put<{ data: Page }>(`${adminPrefix()}/pages/${id}`, data)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${adminPrefix()}/pages/${id}`)
  },

  async toggle(id: number): Promise<Page> {
    const response = await api.put<{ data: Page }>(`${adminPrefix()}/pages/${id}/toggle`)
    return response.data.data
  },
}

// ─────────────────────────────────────────────────────────────────────
// FAQ Service
// ─────────────────────────────────────────────────────────────────────

export const faqService = {
  // Categories
  async getCategories(): Promise<FaqCategory[]> {
    const response = await api.get<any>(`${adminPrefix()}/faq-categories`)
    const data = response.data?.data || response.data
    return Array.isArray(data) ? data : data?.data || []
  },

  async getCategoryById(id: number): Promise<FaqCategory> {
    const response = await api.get<{ data: FaqCategory }>(`${adminPrefix()}/faq-categories/${id}`)
    return response.data.data
  },

  async createCategory(data: FaqCategoryFormData): Promise<FaqCategory> {
    const response = await api.post<{ data: FaqCategory }>(`${adminPrefix()}/faq-categories`, data)
    return response.data.data
  },

  async updateCategory(id: number, data: Partial<FaqCategoryFormData>): Promise<FaqCategory> {
    const response = await api.put<{ data: FaqCategory }>(`${adminPrefix()}/faq-categories/${id}`, data)
    return response.data.data
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`${adminPrefix()}/faq-categories/${id}`)
  },

  async toggleCategory(id: number): Promise<FaqCategory> {
    const response = await api.put<{ data: FaqCategory }>(`${adminPrefix()}/faq-categories/${id}/toggle`)
    return response.data.data
  },

  async reorderCategories(orderedIds: number[]): Promise<void> {
    await api.put(`${adminPrefix()}/faq-categories/reorder`, { ids: orderedIds })
  },

  // FAQs
  async getAll(filters?: FaqFilters): Promise<PaginatedResponse<Faq>> {
    const response = await api.get<any>(`${adminPrefix()}/faqs`, { params: filters })
    const data = response.data?.data || response.data
    return {
      data: data?.data || data || [],
      meta: data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: 20 },
    }
  },

  async getById(id: number): Promise<Faq> {
    const response = await api.get<{ data: Faq }>(`${adminPrefix()}/faqs/${id}`)
    return response.data.data
  },

  async create(data: FaqFormData): Promise<Faq> {
    const response = await api.post<{ data: Faq }>(`${adminPrefix()}/faqs`, data)
    return response.data.data
  },

  async update(id: number, data: Partial<FaqFormData>): Promise<Faq> {
    const response = await api.put<{ data: Faq }>(`${adminPrefix()}/faqs/${id}`, data)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${adminPrefix()}/faqs/${id}`)
  },

  async toggle(id: number): Promise<Faq> {
    const response = await api.put<{ data: Faq }>(`${adminPrefix()}/faqs/${id}/toggle`)
    return response.data.data
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await api.put(`${adminPrefix()}/faqs/reorder`, { ids: orderedIds })
  },
}

// ─────────────────────────────────────────────────────────────────────
// Blog Service
// ─────────────────────────────────────────────────────────────────────

export const blogService = {
  // Categories
  async getCategories(): Promise<BlogCategory[]> {
    const response = await api.get<any>(`${adminPrefix()}/blog-categories`)
    const data = response.data?.data || response.data
    return Array.isArray(data) ? data : data?.data || []
  },

  async getCategoryById(id: number): Promise<BlogCategory> {
    const response = await api.get<{ data: BlogCategory }>(`${adminPrefix()}/blog-categories/${id}`)
    return response.data.data
  },

  async createCategory(data: BlogCategoryFormData): Promise<BlogCategory> {
    const formData = buildFormData(data)
    const response = await api.post<{ data: BlogCategory }>(`${adminPrefix()}/blog-categories`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async updateCategory(id: number, data: Partial<BlogCategoryFormData>): Promise<BlogCategory> {
    const formData = buildFormData(data)
    formData.append('_method', 'PUT')
    const response = await api.post<{ data: BlogCategory }>(`${adminPrefix()}/blog-categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`${adminPrefix()}/blog-categories/${id}`)
  },

  async toggleCategory(id: number): Promise<BlogCategory> {
    const response = await api.put<{ data: BlogCategory }>(`${adminPrefix()}/blog-categories/${id}/toggle`)
    return response.data.data
  },

  // Posts
  async getAll(filters?: BlogFilters): Promise<PaginatedResponse<BlogPost>> {
    const response = await api.get<any>(`${adminPrefix()}/blog-posts`, { params: filters })
    const data = response.data?.data || response.data
    return {
      data: data?.data || data || [],
      meta: data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: 20 },
    }
  },

  async getById(id: number): Promise<BlogPost> {
    const response = await api.get<{ data: BlogPost }>(`${adminPrefix()}/blog-posts/${id}`)
    return response.data.data
  },

  async create(data: BlogPostFormData): Promise<BlogPost> {
    const formData = buildFormData(data)
    const response = await api.post<{ data: BlogPost }>(`${adminPrefix()}/blog-posts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async update(id: number, data: Partial<BlogPostFormData>): Promise<BlogPost> {
    const formData = buildFormData(data)
    formData.append('_method', 'PUT')
    const response = await api.post<{ data: BlogPost }>(`${adminPrefix()}/blog-posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${adminPrefix()}/blog-posts/${id}`)
  },

  async publish(id: number): Promise<BlogPost> {
    const response = await api.put<{ data: BlogPost }>(`${adminPrefix()}/blog-posts/${id}/publish`)
    return response.data.data
  },

  async unpublish(id: number): Promise<BlogPost> {
    const response = await api.put<{ data: BlogPost }>(`${adminPrefix()}/blog-posts/${id}/unpublish`)
    return response.data.data
  },
}

// ─────────────────────────────────────────────────────────────────────
// Contact Service
// ─────────────────────────────────────────────────────────────────────

export const contactService = {
  async getAll(filters?: ContactMessageFilters): Promise<PaginatedResponse<ContactMessage>> {
    const response = await api.get<any>(`${adminPrefix()}/contact-messages`, { params: filters })
    const data = response.data?.data || response.data
    return {
      data: data?.data || data || [],
      meta: data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: 20 },
    }
  },

  async getById(id: number): Promise<ContactMessage> {
    const response = await api.get<{ data: ContactMessage }>(`${adminPrefix()}/contact-messages/${id}`)
    return response.data.data
  },

  async getStats(): Promise<ContactStats> {
    const response = await api.get<{ data: ContactStats }>(`${adminPrefix()}/contact-messages/stats`)
    return response.data.data
  },

  async markAsRead(id: number): Promise<ContactMessage> {
    const response = await api.put<{ data: ContactMessage }>(`${adminPrefix()}/contact-messages/${id}/read`)
    return response.data.data
  },

  async updateStatus(id: number, status: string): Promise<ContactMessage> {
    const response = await api.put<{ data: ContactMessage }>(`${adminPrefix()}/contact-messages/${id}/status`, { status })
    return response.data.data
  },

  async addNotes(id: number, notes: string): Promise<ContactMessage> {
    const response = await api.put<{ data: ContactMessage }>(`${adminPrefix()}/contact-messages/${id}/notes`, { admin_notes: notes })
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${adminPrefix()}/contact-messages/${id}`)
  },

  async bulkMarkAsRead(ids: number[]): Promise<void> {
    await api.put(`${adminPrefix()}/contact-messages/bulk-read`, { ids })
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await api.delete(`${adminPrefix()}/contact-messages/bulk`, { data: { ids } })
  },
}

// ─────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────

function buildFormData(data: Record<string, any>): FormData {
  const formData = new FormData()
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    
    if (value instanceof File) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item)
      })
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  }
  
  return formData
}
