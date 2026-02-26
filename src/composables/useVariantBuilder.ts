// ═══════════════════════════════════════════════════════════════════
// useVariantBuilder Composable — Product variant matrix generator
// ═══════════════════════════════════════════════════════════════════

import { ref, computed, watch, type Ref } from 'vue'
import type {
  AttributeTemplate,
  ProductVariant,
  ProductVariantInput,
  VariantMatrixAttribute,
  VariantMatrixOption,
} from '@/types'

interface VariantConfigItem {
  templateId: number
  name: string
  options: string[]
  optionIds: number[]
}

interface GeneratedVariant {
  sku: string
  name: string
  price: number
  salePrice: number | null
  stockQuantity: number
  weight: number | null
  isActive: boolean
  barcode: string | null
  options: {
    templateId: number
    template: string
    optionId: number
    value: string
  }[]
}

export function useVariantBuilder(templates: Ref<AttributeTemplate[]>) {
  // State
  const variantConfig = ref<VariantConfigItem[]>([])
  const variants = ref<ProductVariant[]>([])
  const basePrice = ref(0)
  const baseSalePrice = ref<number | null>(null)
  const baseSku = ref('')

  // ─────────────────────────────────────────────────────────────────
  // Computed
  // ─────────────────────────────────────────────────────────────────

  /** Get only variant-defining templates */
  const variantDefiningTemplates = computed(() =>
    templates.value.filter((t) => t.is_variant_defining && t.is_active)
  )

  /** Get total possible combinations */
  const totalCombinations = computed(() => {
    if (variantConfig.value.length === 0) return 0
    return variantConfig.value.reduce(
      (total, config) => total * config.optionIds.length,
      1
    )
  })

  /** Check if variants can be generated */
  const canGenerate = computed(() => {
    return (
      variantConfig.value.length > 0 &&
      variantConfig.value.every((c) => c.optionIds.length > 0)
    )
  })

  /** Get variant matrix attributes for API */
  const variantMatrixAttributes = computed<VariantMatrixAttribute[]>(() => {
    return variantConfig.value.map((config) => {
      const template = templates.value.find((t) => t.id === config.templateId)
      const options: VariantMatrixOption[] = config.optionIds.map((optId) => {
        const opt = template?.options?.find((o) => o.id === optId)
        return {
          id: optId,
          value: opt?.value || '',
          label: opt?.label || '',
        }
      })
      return {
        id: config.templateId,
        name: config.name,
        options,
      }
    })
  })

  /** Variant stats */
  const stats = computed(() => ({
    total: variants.value.length,
    active: variants.value.filter((v) => v.is_active).length,
    inStock: variants.value.filter((v) => v.stock_quantity > 0).length,
    totalStock: variants.value.reduce((sum, v) => sum + v.stock_quantity, 0),
  }))

  // ─────────────────────────────────────────────────────────────────
  // Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Add or update variant config for a template
   */
  function setVariantConfig(templateId: number, optionIds: number[]) {
    const template = templates.value.find((t) => t.id === templateId)
    if (!template) return

    const existingIndex = variantConfig.value.findIndex(
      (c) => c.templateId === templateId
    )

    const options = optionIds
      .map((id) => template.options?.find((o) => o.id === id)?.label || '')
      .filter(Boolean)

    const configItem: VariantConfigItem = {
      templateId,
      name: template.name,
      options,
      optionIds,
    }

    if (existingIndex >= 0) {
      variantConfig.value[existingIndex] = configItem
    } else {
      variantConfig.value.push(configItem)
    }
  }

  /**
   * Remove variant config for a template
   */
  function removeVariantConfig(templateId: number) {
    const index = variantConfig.value.findIndex((c) => c.templateId === templateId)
    if (index >= 0) {
      variantConfig.value.splice(index, 1)
    }
  }

  /**
   * Clear all variant configs
   */
  function clearVariantConfig() {
    variantConfig.value = []
    variants.value = []
  }

  /**
   * Generate all possible variant combinations
   */
  function generateVariants(): ProductVariant[] {
    if (!canGenerate.value) {
      console.warn('Cannot generate variants: invalid config')
      return []
    }

    // Build option arrays for each template
    const optionSets = variantConfig.value.map((config) => {
      const template = templates.value.find((t) => t.id === config.templateId)
      return config.optionIds.map((optionId) => {
        const option = template?.options?.find((o) => o.id === optionId)
        return {
          template_id: config.templateId,
          template: config.name,
          option_id: optionId,
          value: option?.label || option?.value || '',
        }
      })
    })

    // Generate cartesian product
    const combinations = cartesianProduct(optionSets)

    // Create variants
    variants.value = combinations.map((combo, index) => {
      const name = combo.map((o) => o.value).join(' / ')
      const skuSuffix = combo
        .map((o) => o.value.substring(0, 2).toUpperCase())
        .join('-')

      return {
        id: 0, // Will be assigned by backend
        sku: baseSku.value ? `${baseSku.value}-${skuSuffix}` : skuSuffix,
        name,
        price: basePrice.value,
        sale_price: baseSalePrice.value,
        effective_price: baseSalePrice.value || basePrice.value,
        stock_quantity: 0,
        is_in_stock: false,
        is_active: true,
        weight: null,
        image_url: null,
        barcode: null,
        options: combo,
      }
    })

    return variants.value
  }

  /**
   * Update a single variant
   */
  function updateVariant(index: number, data: Partial<ProductVariant>) {
    if (variants.value[index]) {
      variants.value[index] = { ...variants.value[index], ...data }
    }
  }

  /**
   * Delete a variant
   */
  function deleteVariant(index: number) {
    variants.value.splice(index, 1)
  }

  /**
   * Bulk update all variants
   */
  function bulkUpdateVariants(field: keyof ProductVariant, value: unknown) {
    variants.value = variants.value.map((v) => ({
      ...v,
      [field]: value,
    }))
  }

  /**
   * Toggle all variants active/inactive
   */
  function toggleAllActive(active: boolean) {
    bulkUpdateVariants('is_active', active)
  }

  /**
   * Set base price and update all variants
   */
  function setBasePrice(price: number, salePrice?: number | null) {
    basePrice.value = price
    baseSalePrice.value = salePrice ?? null
    variants.value = variants.value.map((v) => ({
      ...v,
      price,
      sale_price: salePrice ?? null,
      effective_price: salePrice || price,
    }))
  }

  /**
   * Get variants as API input format
   */
  function getVariantsForApi(): ProductVariantInput[] {
    return variants.value.map((v) => ({
      sku: v.sku,
      price: v.price,
      sale_price: v.sale_price ?? undefined,
      stock_quantity: v.stock_quantity,
      is_active: v.is_active,
      weight: v.weight ?? undefined,
      barcode: v.barcode ?? undefined,
      options: v.options.map((o) => ({ option_id: o.option_id })),
    }))
  }

  /**
   * Load existing variants (for edit mode)
   */
  function loadVariants(existingVariants: ProductVariant[]) {
    variants.value = existingVariants

    // Reconstruct variant config from variants
    if (existingVariants.length > 0) {
      const configMap = new Map<number, Set<number>>()

      existingVariants.forEach((v) => {
        v.options.forEach((opt) => {
          if (!configMap.has(opt.template_id)) {
            configMap.set(opt.template_id, new Set())
          }
          configMap.get(opt.template_id)!.add(opt.option_id)
        })
      })

      variantConfig.value = Array.from(configMap.entries()).map(
        ([templateId, optionIds]) => {
          const template = templates.value.find((t) => t.id === templateId)
          return {
            templateId,
            name: template?.name || '',
            options: Array.from(optionIds)
              .map(
                (id) => template?.options?.find((o) => o.id === id)?.label || ''
              )
              .filter(Boolean),
            optionIds: Array.from(optionIds),
          }
        }
      )
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Helper Functions
  // ─────────────────────────────────────────────────────────────────

  /**
   * Generate cartesian product of arrays
   */
  function cartesianProduct<T>(arrays: T[][]): T[][] {
    if (arrays.length === 0) return [[]]
    if (arrays.length === 1) return arrays[0].map((item) => [item])

    return arrays.reduce(
      (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
      [[]] as T[][]
    )
  }

  return {
    // State
    variantConfig,
    variants,
    basePrice,
    baseSalePrice,
    baseSku,

    // Computed
    variantDefiningTemplates,
    totalCombinations,
    canGenerate,
    variantMatrixAttributes,
    stats,

    // Methods
    setVariantConfig,
    removeVariantConfig,
    clearVariantConfig,
    generateVariants,
    updateVariant,
    deleteVariant,
    bulkUpdateVariants,
    toggleAllActive,
    setBasePrice,
    getVariantsForApi,
    loadVariants,
  }
}
