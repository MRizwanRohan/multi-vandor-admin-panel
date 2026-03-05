// ═══════════════════════════════════════════════════════════════════
// CMS Types — Page, FAQ, Blog, Contact
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// Static Pages
// ─────────────────────────────────────────────────────────────────────

export interface Page {
  id: number
  title: string
  slug: string
  content: string
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PageFormData {
  title: string
  slug?: string
  content: string
  meta_title?: string
  meta_description?: string
  is_active?: boolean
}

export interface PageFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

// ─────────────────────────────────────────────────────────────────────
// FAQ System
// ─────────────────────────────────────────────────────────────────────

export interface FaqCategory {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  faqs_count?: number
  faqs?: Faq[]
  created_at: string
  updated_at: string
}

export interface Faq {
  id: number
  category_id: number
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  views_count?: number
  category?: FaqCategory
  created_at: string
  updated_at: string
}

export interface FaqCategoryFormData {
  name: string
  slug?: string
  description?: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

export interface FaqFormData {
  category_id: number
  question: string
  answer: string
  sort_order?: number
  is_active?: boolean
}

export interface FaqFilters {
  page?: number
  per_page?: number
  search?: string
  category_id?: number
  is_active?: boolean
}

// ─────────────────────────────────────────────────────────────────────
// Blog System
// ─────────────────────────────────────────────────────────────────────

export type BlogPostStatus = 'draft' | 'published' | 'scheduled' | 'archived'

export interface BlogCategory {
  id: number
  name: string
  slug: string
  description: string | null
  image: string | null
  is_active: boolean
  posts_count?: number
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: number
  category_id: number | null
  author_id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  status: BlogPostStatus
  is_featured: boolean
  views_count: number
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
  tags: string[]
  category?: BlogCategory
  author?: {
    id: number
    name: string
    avatar: string | null
  }
  created_at: string
  updated_at: string
}

export interface BlogCategoryFormData {
  name: string
  slug?: string
  description?: string
  image?: string | File
  is_active?: boolean
}

export interface BlogPostFormData {
  category_id?: number | null
  title: string
  slug?: string
  excerpt?: string
  content: string
  featured_image?: string | File
  status?: BlogPostStatus
  is_featured?: boolean
  published_at?: string
  meta_title?: string
  meta_description?: string
  tags?: string[]
}

export interface BlogFilters {
  page?: number
  per_page?: number
  search?: string
  category_id?: number
  status?: BlogPostStatus
  is_featured?: boolean
  author_id?: number
}

// ─────────────────────────────────────────────────────────────────────
// Contact Messages
// ─────────────────────────────────────────────────────────────────────

export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'resolved' | 'spam'

export interface ContactMessage {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: ContactMessageStatus
  is_read: boolean
  admin_notes: string | null
  replied_at: string | null
  replied_by: number | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}

export interface ContactMessageFilters {
  page?: number
  per_page?: number
  search?: string
  status?: ContactMessageStatus
  is_read?: boolean
  date_from?: string
  date_to?: string
}

export interface ContactStats {
  total: number
  new_count: number
  unread_count: number
  replied_count: number
  resolved_count: number
  spam_count: number
  today_count: number
  this_week_count: number
}
