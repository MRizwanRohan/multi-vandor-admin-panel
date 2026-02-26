// ═══════════════════════════════════════════════════════════════════
// useProduct Composable — Product state management & helpers
// ═══════════════════════════════════════════════════════════════════

import { ref, computed } from 'vue'
import { productService } from '@/services'
import { useToast } from './useToast'
import { getProductStatusConfig } from '@/types'
import type {
  Product,
  ProductDetail,
  ProductStatus,
  ProductListParams,
  CreateProductRequest,
} from '@/types'

export function useProduct() {
  // State
  const product = ref<ProductDetail | null>(null)
  const products = ref<Product[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const currentPage = ref(1)
  const lastPage = ref(1)
  const perPage = ref(20)
  const total = ref(0)

  const toast = useToast()

  // ─────────────────────────────────────────────────────────────────
  // Computed Helpers
  // ─────────────────────────────────────────────────────────────────

  /** Check if product can be edited */
  const canEdit = computed(() => {
    if (!product.value) return false
    return ['draft', 'rejected', 'approved'].includes(product.value.status)
  })

  /** Check if product can be deleted */
  const canDelete = computed(() => {
    if (!product.value) return false
    return ['draft', 'rejected'].includes(product.value.status)
  })

  /** Check if product can be submitted for review */
  const canSubmit = computed(() => {
    if (!product.value) return false
    return product.value.status === 'draft'
  })

  /** Check if product is visible to customers */
  const isCustomerVisible = computed(() => {
    if (!product.value) return false
    return product.value.status === 'approved' && product.value.is_active
  })

  /** Get status configuration */
  const statusConfig = computed(() => {
    if (!product.value) return null
    return getProductStatusConfig(product.value.status)
  })

  // ─────────────────────────────────────────────────────────────────
  // Vendor Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Fetch vendor's products
   */
  async function fetchProducts(params: ProductListParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await productService.vendorList(params)
      products.value = response.data
      currentPage.value = response.meta?.current_page ?? 1
      lastPage.value = response.meta?.last_page ?? 1
      perPage.value = response.meta?.per_page ?? 20
      total.value = response.meta?.total ?? 0
      return response
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to fetch products'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single product by slug/id
   */
  async function fetchProduct(slugOrId: string | number) {
    loading.value = true
    error.value = null
    try {
      const data = await productService.vendorShow(slugOrId)
      product.value = data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to fetch product'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new product
   */
  async function createProduct(data: CreateProductRequest) {
    submitting.value = true
    error.value = null
    try {
      const created = await productService.vendorCreate(data)
      toast.success('Product created successfully')
      return created
    } catch (e: any) {
      const message = e.response?.data?.message || 'Failed to create product'
      error.value = message
      toast.error(message)
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Update existing product
   */
  async function updateProduct(slugOrId: string | number, data: Partial<CreateProductRequest>) {
    submitting.value = true
    error.value = null
    try {
      const updated = await productService.vendorUpdate(slugOrId, data)
      product.value = updated
      toast.success('Product updated successfully')
      return updated
    } catch (e: any) {
      const message = e.response?.data?.message || 'Failed to update product'
      error.value = message
      toast.error(message)
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Delete product
   */
  async function deleteProduct(slugOrId: string | number) {
    submitting.value = true
    error.value = null
    try {
      await productService.vendorDelete(slugOrId)
      toast.success('Product deleted successfully')
      // Remove from list if exists
      products.value = products.value.filter(
        (p) => p.slug !== slugOrId && p.id !== slugOrId
      )
    } catch (e: any) {
      const message = e.response?.data?.message || 'Failed to delete product'
      error.value = message
      toast.error(message)
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Submit product for review
   */
  async function submitForReview(slugOrId: string | number) {
    submitting.value = true
    error.value = null
    try {
      const updated = await productService.vendorSubmit(slugOrId)
      product.value = updated
      toast.success('Product submitted for review')
      return updated
    } catch (e: any) {
      const message = e.response?.data?.message || 'Failed to submit product'
      error.value = message
      toast.error(message)
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Restore deleted product
   */
  async function restoreProduct(slugOrId: string | number) {
    submitting.value = true
    error.value = null
    try {
      const restored = await productService.vendorRestore(slugOrId)
      product.value = restored
      toast.success('Product restored successfully')
      return restored
    } catch (e: any) {
      const message = e.response?.data?.message || 'Failed to restore product'
      error.value = message
      toast.error(message)
      throw e
    } finally {
      submitting.value = false
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Image Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Upload images to product
   */
  async function uploadImages(slugOrId: string | number, files: File[], altTexts?: string[]) {
    submitting.value = true
    try {
      const images = await productService.vendorUploadImages(slugOrId, files, altTexts)
      toast.success('Images uploaded successfully')
      // Refresh product to get updated images
      if (product.value) {
        await fetchProduct(slugOrId)
      }
      return images
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload images')
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Delete image from product
   */
  async function deleteImage(slugOrId: string | number, imageId: number) {
    submitting.value = true
    try {
      await productService.vendorDeleteImage(slugOrId, imageId)
      toast.success('Image deleted')
      // Update local state
      if (product.value) {
        product.value.images = product.value.images.filter((img) => img.id !== imageId)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete image')
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Reorder images
   */
  async function reorderImages(slugOrId: string | number, imageIds: number[]) {
    submitting.value = true
    try {
      const images = await productService.vendorReorderImages(slugOrId, imageIds)
      toast.success('Image order updated')
      if (product.value) {
        product.value.images = images
      }
      return images
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to reorder images')
      throw e
    } finally {
      submitting.value = false
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Admin Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Fetch all products (admin)
   */
  async function adminFetchProducts(params: ProductListParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await productService.adminList(params)
      products.value = response.data
      currentPage.value = response.meta?.current_page ?? 1
      lastPage.value = response.meta?.last_page ?? 1
      perPage.value = response.meta?.per_page ?? 20
      total.value = response.meta?.total ?? 0
      return response
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch products'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Approve product (admin)
   */
  async function approveProduct(slugOrId: string | number) {
    submitting.value = true
    error.value = null
    try {
      const approved = await productService.adminApprove(slugOrId)
      product.value = approved
      toast.success('Product approved')
      return approved
    } catch (e: any) {
      const message = e.response?.data?.message || 'Failed to approve product'
      error.value = message
      toast.error(message)
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Reject product (admin)
   */
  async function rejectProduct(slugOrId: string | number, reason: string) {
    submitting.value = true
    error.value = null
    try {
      const rejected = await productService.adminReject(slugOrId, reason)
      product.value = rejected
      toast.success('Product rejected')
      return rejected
    } catch (e: any) {
      const message = e.response?.data?.message || 'Failed to reject product'
      error.value = message
      toast.error(message)
      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Toggle featured status (admin)
   */
  async function toggleFeatured(slugOrId: string | number) {
    submitting.value = true
    try {
      const updated = await productService.adminToggleFeatured(slugOrId)
      if (product.value) {
        product.value.is_featured = updated.is_featured
      }
      toast.success(updated.is_featured ? 'Product featured' : 'Product unfeatured')
      return updated
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to toggle featured')
      throw e
    } finally {
      submitting.value = false
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Customer/Public Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Browse products (public)
   */
  async function browseProducts(params: ProductListParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await productService.browse(params)
      products.value = response.data
      currentPage.value = response.meta?.current_page ?? 1
      lastPage.value = response.meta?.last_page ?? 1
      total.value = response.meta?.total ?? 0
      return response
    } catch (e: any) {
      error.value = e.message || 'Failed to load products'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Search products (public)
   */
  async function searchProducts(query: string, params: ProductListParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await productService.search(query, params)
      products.value = response.data
      currentPage.value = response.meta?.current_page ?? 1
      lastPage.value = response.meta?.last_page ?? 1
      total.value = response.meta?.total ?? 0
      return response
    } catch (e: any) {
      error.value = e.message || 'Search failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get product detail (public)
   */
  async function getProductDetail(slug: string) {
    loading.value = true
    error.value = null
    try {
      const data = await productService.getDetail(slug)
      product.value = data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Product not found'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────

  function reset() {
    product.value = null
    products.value = []
    error.value = null
    loading.value = false
    submitting.value = false
    currentPage.value = 1
    lastPage.value = 1
    total.value = 0
  }

  return {
    // State
    product,
    products,
    loading,
    submitting,
    error,

    // Pagination
    currentPage,
    lastPage,
    perPage,
    total,

    // Computed
    canEdit,
    canDelete,
    canSubmit,
    isCustomerVisible,
    statusConfig,

    // Vendor Methods
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    submitForReview,
    restoreProduct,

    // Image Methods
    uploadImages,
    deleteImage,
    reorderImages,

    // Admin Methods
    adminFetchProducts,
    approveProduct,
    rejectProduct,
    toggleFeatured,

    // Customer Methods
    browseProducts,
    searchProducts,
    getProductDetail,

    // Reset
    reset,
  }
}
