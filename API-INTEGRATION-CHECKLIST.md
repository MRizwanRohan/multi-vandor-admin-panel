# 📋 API Integration Implementation Checklist

> Quick reference checklist for tracking implementation progress

---

## 🚨 CRITICAL DISCOVERY

**Current State:** Only login works with real API. All other features use **mock data fallbacks**.

**Problem:** Components call services, but catch blocks have mock data → When API fails, app shows fake data!

**Solution:** See **[DYNAMIC-API-PLAN.md](./DYNAMIC-API-PLAN.md)** for urgent fixes.

---

## 🔥 Phase 0: Remove Mock Data (TODAY - 2-3 hours) **← START HERE!**

**Goal:** Expose real API errors instead of hiding them with mock data

### Step 1: Verify Connection (30 min)
- [ ] Check `.env` has `VITE_API_URL=http://localhost:8000/api/v1`
- [ ] Test backend: `curl http://localhost:8000/api/v1/health`
- [ ] Verify auth token in localStorage
- [ ] Check browser Network tab for API calls

### Step 2: Remove Mock Fallbacks (2 hours)

#### 🔴 CRITICAL Pages (Must fix first)
- [ ] **Admin Categories** (CategoryList.vue line 76)
  ```typescript
  // Remove: categories.value = [mock data]
  // Add: categories.value = [] with proper error
  ```
- [ ] **Admin Products** (ProductList.vue line 88)
- [ ] **Vendor Products** (ProductList.vue line 80)
- [ ] **Vendor Product Form** (ProductForm.vue line 110) - Load categories from API
- [ ] **Admin Templates** (TemplateList.vue line 85)

#### Pattern to Replace:
```typescript
// ❌ BAD (current)
catch (error) {
  categories.value = [{ id: 1, name: 'Mock' }] // REMOVE THIS!
}

// ✅ GOOD (new)
catch (error: any) {
  toast.error(error.response?.data?.message || 'Failed to load')
  console.error('API Error:', error)
  categories.value = [] // Empty, not mock
}
```

---

## 🎯 Phase 1: Core Foundation — Types (Week 1)

### Environment & Config
- [ ] Update `.env` file with correct API base URL
- [ ] Create `src/config/api.config.ts`
  - API base URL
  - Timeout settings
  - Default headers

### New Type Files
- [ ] **`src/types/cart.ts`** (1h)
  ```typescript
  - Cart
  - CartItem  
  - CartSummary
  - AddToCartRequest
  - UpdateCartItemRequest
  ```

- [ ] **`src/types/inventory.ts`** (1h)
  ```typescript
  - StockOverview
  - StockAlert
  - InventoryLog
  - InventoryStats
  - UpdateStockRequest
  - AlertType
  - InventoryLogType
  ```

- [ ] **`src/types/address.ts`** (30min)
  ```typescript
  - Address
  - AddressInput
  - CreateAddressRequest
  - UpdateAddressRequest
  ```

- [ ] **`src/types/shipping.ts`** (45min)
  ```typescript
  - ShippingMethod
  - ShippingRate
  - ShippingZone
  ```

### Type Updates
- [ ] **Update `src/types/common.ts`** (30min)
  - Add `ApiSearchResponse<T>` with facets
  - Add `FacetItem` interface
  - Update `ApiError` with `retry_after`

- [ ] **Update `src/types/product.ts`** (45min)
  - ProductType: add `'digital' | 'service'`
  - ProductVisibility: add `'search'`
  - Add `PriceRange` interface
  - Add missing Product fields:
    - `effective_price`
    - `thumbnail`
    - `variant_count`
    - `price_range`

- [ ] **Update `src/types/vendor.ts`** (30min)
  - Add `VendorDashboardStats` interface

**Total Phase 1:** ~8-10 hours

---

## 🛠️ Phase 2: Services Layer (Week 2)

### New Services

- [ ] **`src/services/cart.service.ts`** (2-3h)
  - `getCart()` - GET `/customer/cart`
  - `addItem(request)` - POST `/customer/cart/items`
  - `updateItem(id, request)` - PUT `/customer/cart/items/{id}`
  - `removeItem(id)` - DELETE `/customer/cart/items/{id}`
  - `clearCart()` - DELETE `/customer/cart`
  - `getSummary()` - GET `/customer/cart/summary`

- [ ] **`src/services/inventory.service.ts`** (3-4h)
  - **Vendor endpoints:**
    - `getInventory(filters)`
    - `updateStock(request)`
    - `getAlerts(filters)`
    - `resolveAlert(id)`
    - `getMovements(filters)`
  - **Admin endpoints:**
    - `getStats()`
    - `getLowStock(filters)`
    - `getAllAlerts(filters)`
    - `bulkResolveAlerts(ids)`
    - `manualAdjustment(request)`
    - `scanAlerts()`
    - `getAllMovements(filters)`

- [ ] **`src/services/public.service.ts`** (2-3h)
  - `getProducts(filters)` - GET `/customer/products`
  - `getProductBySlug(slug)` - GET `/customer/products/{slug}`
  - `getFeaturedProducts()` - GET `/customer/products/featured`
  - `searchProducts(query, filters)` - GET `/customer/products/search`
  - `getProductsByCategory(slug, filters)` - GET `/customer/products/category/{slug}`
  - `getCategories(filters)` - GET `/customer/categories`
  - `getCategoryBySlug(slug)` - GET `/customer/categories/{slug}`

### Service Updates

- [ ] **Update `src/services/product.service.ts`** (2h)
  - `uploadImage(productId, file)` - POST `/vendor/products/{id}/images`
  - `reorderImages(productId, order)` - PUT `/vendor/products/{id}/images/reorder`
  - `deleteImage(productId, imageId)` - DELETE `/vendor/products/{id}/images/{imageId}`
  - `submitForApproval(id)` - PUT `/vendor/products/{id}/submit`
  - `restoreProduct(id)` - PUT `/vendor/products/{id}/restore`
  - `getAttributes(id)` - GET `/vendor/products/{id}/attributes`

- [ ] **Update `src/services/category.service.ts`** (2h)
  - **Admin operations:**
    - `createCategory(data)` - POST `/admin/categories`
    - `updateCategory(id, data)` - PUT `/admin/categories/{id}`
    - `deleteCategory(id)` - DELETE `/admin/categories/{id}`
    - `reorderCategories(order)` - PUT `/admin/categories/reorder`
    - `toggleActive(id)` - PUT `/admin/categories/{id}/toggle-active`
    - `approveRequest(id)` - PUT `/admin/categories/{id}/approve`
    - `rejectRequest(id)` - PUT `/admin/categories/{id}/reject`
    - `syncTemplates(id, templates)` - PUT `/admin/categories/{id}/templates`

- [ ] **Update `src/services/order.service.ts`** (1.5h)
  - `placeOrder(request)` - POST `/customer/orders`
  - `cancelOrder(id)` - POST `/customer/orders/{id}/cancel`
  - `getOrderStats()` - GET `/vendor/orders/stats`
  - `updateOrderStatus(id, status)` - PUT `/vendor/orders/{id}/status`

- [ ] **Update `src/services/settings.service.ts`** (1.5h)
  - `bulkUpdate(settings)` - PUT `/admin/settings/bulk`
  - `exportSettings()` - GET `/admin/settings/export`
  - `importSettings(file)` - POST `/admin/settings/import`
  - `getAudits(id)` - GET `/admin/settings/{id}/audits`

- [ ] **Update `src/services/attribute-template.service.ts`** (2h)
  - `addOption(templateId, data)` - POST `/admin/attribute-templates/{id}/options`
  - `updateOption(optionId, data)` - PUT `/admin/attribute-templates/options/{id}`
  - `deleteOption(optionId)` - DELETE `/admin/attribute-templates/options/{id}`
  - `reorderOptions(templateId, order)` - PUT `/admin/attribute-templates/{id}/options/reorder`
  - `getByCategory(categoryId)` - GET `/admin/attribute-templates/by-category/{id}`
  - `getFilterable()` - GET `/admin/attribute-templates/filterable`
  - `getVariantDefining()` - GET `/admin/attribute-templates/variant-defining`

**Total Phase 2:** ~16-20 hours

---

## 🏪 Phase 3: State Management (Week 2-3)

- [ ] **`src/stores/cart.store.ts`** (4-5h)
  - State: `cart`, `loading`, `error`
  - Getters: `itemsCount`, `subtotal`, `total`, `isEmpty`
  - Actions:
    - `fetchCart()`
    - `addToCart(product, variant, quantity)`
    - `updateQuantity(itemId, quantity)`
    - `removeItem(itemId)`
    - `clearCart()`
    - `applyCoupon(code)`
    - `removeCoupon()`
  - Features:
    - Optimistic updates
    - Guest cart (localStorage)
    - Auto-sync with backend
    - Debounced updates

- [ ] **`src/stores/inventory.store.ts`** (Optional, 2-3h)
  - State: `alerts`, `stats`, `movements`
  - Actions:
    - `fetchAlerts()`
    - `resolveAlert(id)`
    - `fetchStats()`

- [ ] **`src/stores/settings.store.ts`** (2h)
  - State: `settings` (cached)
  - Actions:
    - `fetchSettings()`
    - `updateSetting(key, value)`
    - `bulkUpdate(settings)`

**Total Phase 3:** ~8-12 hours

---

## 🧩 Phase 4: Utilities & Helpers (Week 3)

- [ ] **`src/utils/errorHandler.ts`** (2-3h)
  ```typescript
  - handleApiError(error: AxiosError<ApiError>): void
  - getErrorMessage(error: unknown): string
  - isValidationError(error: unknown): boolean
  - extractValidationErrors(error): Record<string, string[]>
  ```
  - Handle all HTTP codes: 400, 401, 403, 404, 409, 422, 429, 500
  - Toast notifications
  - Logging (console/Sentry)

- [ ] **`src/utils/rateLimitHandler.ts`** (2-3h)
  ```typescript
  - handleRateLimit(error: AxiosError): boolean
  - getRateLimitInfo(headers): RateLimitInfo
  - canRetry(error): boolean
  - scheduleRetry(fn, retryAfter): Promise<any>
  ```
  - Parse `X-RateLimit-*` and `Retry-After` headers
  - Auto-retry logic
  - User notifications

- [ ] **`src/utils/apiHelpers.ts`** (1-2h)
  ```typescript
  - buildQueryParams(filters): URLSearchParams
  - buildUrl(path, params): string
  - parseApiDate(dateString): Date
  - formatApiDate(date): string
  ```

**Total Phase 4:** ~6-8 hours

---

## ✅ Phase 5: Validation & Forms (Week 3-4)

### Validation Schemas (Zod)

- [ ] **`src/validation/auth.schema.ts`** (1h)
  - `loginSchema`
  - `registerSchema`
  - `forgotPasswordSchema`
  - `resetPasswordSchema`

- [ ] **`src/validation/product.schema.ts`** (1.5h)
  - `createProductSchema`
  - `updateProductSchema`
  - `productImageSchema`
  - `productVariantSchema`

- [ ] **`src/validation/category.schema.ts`** (1h)
  - `createCategorySchema`
  - `updateCategorySchema`

- [ ] **`src/validation/cart.schema.ts`** (45min)
  - `addToCartSchema`
  - `updateCartItemSchema`

- [ ] **`src/validation/order.schema.ts`** (1.5h)
  - `addressSchema`
  - `placeOrderSchema`

### Form Composables (Optional)

- [ ] **`src/composables/useProductForm.ts`** (2h)
  - Integrate vee-validate + Zod
  - Handle product creation/update
  - Image upload handling

- [ ] **`src/composables/useCheckoutForm.ts`** (2h)
  - Address validation
  - Payment method selection
  - Order summary

**Total Phase 5:** ~8-10 hours

---

## 🔌 Phase 6: Composables (Week 4)

### Data Fetching Composables

- [ ] **`src/composables/useProducts.ts`** (2h)
  ```typescript
  - useProducts(filters?) - List products
  - useProduct(slug) - Single product
  - useFeaturedProducts() - Featured
  - useCreateProduct() - Mutation
  - useUpdateProduct(id) - Mutation
  - useDeleteProduct(id) - Mutation
  ```

- [ ] **`src/composables/useCart.ts`** (2h)
  ```typescript
  - useCart() - Get cart
  - useAddToCart() - Add item
  - useUpdateCart() - Update item
  - useRemoveFromCart() - Remove item
  ```

- [ ] **`src/composables/useOrders.ts`** (2h)
  ```typescript
  - useOrders(filters?) - List orders
  - useOrder(orderNumber) - Single order
  - usePlaceOrder() - Place order
  - useCancelOrder(id) - Cancel
  ```

- [ ] **`src/composables/useInventory.ts`** (2h)
  ```typescript
  - useInventory(filters?) - Stock overview
  - useStockAlerts() - Alerts
  - useInventoryStats() - Statistics
  - useUpdateStock(id) - Update stock
  ```

- [ ] **`src/composables/useCategories.ts`** (1.5h)
  ```typescript
  - useCategories(filters?) - List
  - useCategory(slug) - Single
  - useCategoryTree() - Tree structure
  ```

### Advanced Composables

- [ ] **`src/composables/useSearch.ts`** (3-4h)
  ```typescript
  - query, filters, results, facets
  - search(query, filters)
  - applyFilter(key, value)
  - clearFilters()
  ```
  - Debounced search
  - Faceted filtering
  - URL sync
  - History management

- [ ] **`src/composables/useRateLimit.ts`** (1.5h)
  ```typescript
  - isRateLimited
  - rateLimitInfo
  - retryAfter
  - reset()
  ```

**Total Phase 6:** ~12-16 hours

---

## 🧪 Phase 7: Testing & Documentation (Week 5)

### Unit Tests

- [ ] **Service Tests** (4-6h)
  - Cart service
  - Inventory service
  - Public service
  - Updated services

- [ ] **Store Tests** (3-4h)
  - Cart store
  - Settings store
  - Inventory store

- [ ] **Utility Tests** (2-3h)
  - Error handler
  - Rate limit handler
  - API helpers

- [ ] **Composable Tests** (4-5h)
  - All data fetching composables
  - Search composable

### Integration Tests

- [ ] **Cart Flow** (2-3h)
  - Add to cart → Update → Remove → Checkout

- [ ] **Product Management** (2-3h)
  - Create product → Upload images → Submit → Approve

- [ ] **Order Flow** (2h)
  - Place order → Track status → Cancel

### Documentation

- [ ] **Service Documentation** (2h)
  - Usage examples for each service
  - Parameter descriptions
  - Return types

- [ ] **Composable Documentation** (2h)
  - Usage examples
  - Best practices

- [ ] **Troubleshooting Guide** (1h)
  - Common errors
  - Solutions

**Total Phase 7:** ~16-20 hours

---

## 📊 Progress Tracking

### Overall Progress

| Phase | Tasks | Completed | Progress | Status |
|-------|-------|-----------|----------|--------|
| **Phase 0** | **5** | **0** | **0%** | 🔴 **URGENT - START HERE** |
| Phase 1 | 7 | 0 | 0% | ⚪ Not Started |
| Phase 2 | 6 | 0 | 0% | ⚪ Not Started |
| Phase 3 | 3 | 0 | 0% | ⚪ Not Started |
| Phase 4 | 3 | 0 | 0% | ⚪ Not Started |
| Phase 5 | 7 | 0 | 0% | ⚪ Not Started |
| Phase 6 | 7 | 0 | 0% | ⚪ Not Started |
| Phase 7 | 6 | 0 | 0% | ⚪ Not Started |
| **Total** | **44** | **0** | **0%** | ⚪ Not Started |

### Time Tracking

| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 | 8-10h | - | - |
| Phase 2 | 16-20h | - | - |
| Phase 3 | 8-12h | - | - |
| Phase 4 | 6-8h | - | - |
| Phase 5 | 8-10h | - | - |
| Phase 6 | 12-16h | - | - |
| Phase 7 | 16-20h | - | - |
| **Total** | **74-96h** | **-** | **-** |

---

## 🚀 Quick Start Guide

### 🔥 URGENT - Today: Remove Mock Data
1. **Read [DYNAMIC-API-PLAN.md](./DYNAMIC-API-PLAN.md)** first!
2. Check backend is running
3. Verify `.env` API URL is correct
4. Remove mock data from CategoryList.vue, ProductList.vue
5. Test with real API - should see errors or real data (not mock!)

### Day 1: Setup & Types (After Phase 0)
1. Review API documentation
2. Update `.env` with correct API URL
3. Create `api.config.ts`
4. Create cart, inventory, address, shipping types
5. Update common, product, vendor types

### Day 2-3: Cart & Public Services
1. Implement `cart.service.ts`
2. Implement `public.service.ts`
3. Create cart store
4. Test cart flow

### Day 4-5: Inventory & Service Updates
1. Implement `inventory.service.ts`
2. Update product, category, order services
3. Update attribute-template, settings services

### Day 6-7: Utilities & Validation
1. Create error handler
2. Create rate limit handler
3. Create validation schemas
4. Test error scenarios

### Week 2: Composables & Polish
1. Create data fetching composables
2. Create search composable
3. Write tests
4. Documentation

---

## 📌 Priority Labels

- 🔴 **Critical**: Blocking for customer/vendor flows
- 🟡 **High**: Important for UX, not blocking
- 🟢 **Medium**: Nice to have, can defer

### Critical Path (Must Do First)
1. ✅ Phase 1: All types (cart, inventory, address)
2. ✅ Phase 2.1: Cart service
3. ✅ Phase 2.3: Public service
4. ✅ Phase 3.1: Cart store
5. ✅ Phase 4.1: Error handler

---

## 🎯 Definition of Done

A task is complete when:
- [ ] Code written and follows style guide
- [ ] TypeScript compiles with no errors
- [ ] Types match API specification exactly
- [ ] Service functions handle errors properly
- [ ] Unit tests written (if applicable)
- [ ] Tested manually with real API
- [ ] Code reviewed
- [ ] Merged to main branch
- [ ] Documentation updated

---

## 📞 Support

- **Questions?** Check main [API-INTEGRATION-PLAN.md](./API-INTEGRATION-PLAN.md)
- **Issues?** Create GitHub issue with `api-integration` label
- **Blockers?** Ping #mve-frontend in Slack

---

**Last Updated:** February 25, 2026
