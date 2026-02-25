# 🚀 MVE Platform — Frontend API Integration Implementation Plan

> **Project:** MVE Dashboard (Vue 3 + TypeScript + Pinia)  
> **API Version:** v1  
> **Plan Version:** 1.0  
> **Created:** February 25, 2026

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Task Breakdown](#detailed-task-breakdown)
5. [File Structure](#file-structure)
6. [Testing Strategy](#testing-strategy)
7. [Timeline & Estimates](#timeline--estimates)

---

## Executive Summary

### Objectives
- Complete integration of 70+ API endpoints from the backend specification
- Enhance type safety with TypeScript types matching exact API responses
- Implement missing features: Cart, Inventory, Advanced Search, Rate Limiting
- Add validation schemas and error handling utilities
- Create reusable composables for common patterns

### Current Progress
- ✅ **60% Complete**: Core infrastructure (Axios, Auth, Base Types, Pagination)
- 🟡 **40% To Do**: Cart/Inventory, Enhanced Types, Advanced Features, Services

---

## Current State Analysis

### ✅ Already Implemented

| Component | Status | Files |
|-----------|--------|-------|
| **Axios Client** | ✅ Complete | `src/services/api.ts` |
| **Auth Service** | ✅ Complete | `src/services/auth.service.ts` |
| **Auth Store** | ✅ Complete | `src/stores/auth.store.ts` |
| **Base Types** | ✅ Partial | `src/types/common.ts`, `auth.ts`, `product.ts`, `order.ts`, `category.ts` |
| **Pagination** | ✅ Complete | `src/composables/usePagination.ts` |
| **Storage Utils** | ✅ Complete | `src/utils/storage.ts` |
| **Case Transform** | ✅ Complete | `src/utils/caseTransform.ts` |
| **Product Service** | ✅ Partial | `src/services/product.service.ts` |
| **Category Service** | ✅ Partial | `src/services/category.service.ts` |
| **Order Service** | ✅ Partial | `src/services/order.service.ts` |

### ❌ Missing / To Be Enhanced

| Component | Priority | Reason |
|-----------|----------|--------|
| **Cart Types & Service** | 🔴 High | Customer journey critical |
| **Cart Store** | 🔴 High | State management needed |
| **Inventory Types & Service** | 🔴 High | Vendor core feature |
| **Search Response Types** | 🟡 Medium | Faceted search missing |
| **Rate Limit Handler** | 🟡 Medium | User experience protection |
| **Enhanced Error Handler** | 🟡 Medium | Better UX for errors |
| **Validation Schemas (Zod)** | 🟡 Medium | Form validation |
| **Address Types** | 🔴 High | Order flow required |
| **Shipping Types** | 🟡 Medium | Order completion |
| **Review Enhancement** | 🟢 Low | Already exists partially |
| **Settings Service Update** | 🟢 Low | Admin feature |
| **Vendor Stats Types** | 🟡 Medium | Dashboard widgets |
| **Public API Endpoints** | 🔴 High | Customer-facing |

---

## Implementation Phases

### 📦 Phase 1: Core Foundation (Week 1)
**Goal:** Complete missing types and enhance existing ones

- [x] **Task 1.1**: Update Environment Variables
- [ ] **Task 1.2**: Create Missing Base Types
  - Cart types (`src/types/cart.ts`)
  - Inventory types (`src/types/inventory.ts`)
  - Address types (`src/types/address.ts`)
  - Shipping types (`src/types/shipping.ts`)
- [ ] **Task 1.3**: Enhance Existing Types
  - Update Product types (add `digital`, `service` types)
  - Update API response types (add `ApiSearchResponse`)
  - Add Vendor Stats types to `vendor.ts`
- [ ] **Task 1.4**: Create API Config File
  - `src/config/api.config.ts`
  - Centralized API configuration

### 🛠️ Phase 2: Services Layer (Week 2)
**Goal:** Implement all missing services

- [ ] **Task 2.1**: Cart Service
  - `src/services/cart.service.ts`
  - Customer cart operations (7 endpoints)
- [ ] **Task 2.2**: Inventory Service
  - `src/services/inventory.service.ts`
  - Vendor & Admin inventory management (12 endpoints)
- [ ] **Task 2.3**: Public Service
  - `src/services/public.service.ts`
  - Public-facing endpoints (products, categories, search)
- [ ] **Task 2.4**: Update Existing Services
  - Enhance `product.service.ts` (add missing endpoints)
  - Enhance `category.service.ts` (add admin operations)
  - Enhance `order.service.ts` (add cancel, stats)
  - Update `settings.service.ts` (bulk operations, import/export)
  - Update `attribute-template.service.ts` (options CRUD)

### 🏪 Phase 3: State Management (Week 2-3)
**Goal:** Add Pinia stores for new features

- [ ] **Task 3.1**: Cart Store
  - `src/stores/cart.store.ts`
  - Add to cart, update quantity, remove, clear
  - Sync with backend
  - Guest cart support
- [ ] **Task 3.2**: Inventory Store (Optional)
  - `src/stores/inventory.store.ts`
  - Alert management
  - Stock tracking
- [ ] **Task 3.3**: Settings Store
  - `src/stores/settings.store.ts`
  - Global settings cache

### 🧩 Phase 4: Utilities & Helpers (Week 3)
**Goal:** Create reusable utilities

- [ ] **Task 4.1**: Error Handler Utility
  - `src/utils/errorHandler.ts`
  - Handle all HTTP status codes
  - Toast notifications
  - Logging
- [ ] **Task 4.2**: Rate Limit Handler
  - `src/utils/rateLimitHandler.ts`
  - Auto-retry logic
  - User notifications
- [ ] **Task 4.3**: API Helper Functions
  - `src/utils/apiHelpers.ts`
  - Query param builders
  - URL helpers

### ✅ Phase 5: Validation & Forms (Week 3-4)
**Goal:** Type-safe form validation

- [ ] **Task 5.1**: Validation Schemas
  - `src/validation/product.schema.ts`
  - `src/validation/category.schema.ts`
  - `src/validation/order.schema.ts`
  - `src/validation/cart.schema.ts`
  - `src/validation/auth.schema.ts`
  - Using Zod library
- [ ] **Task 5.2**: Form Composables
  - `src/composables/useProductForm.ts`
  - `src/composables/useCheckoutForm.ts`

### 🔌 Phase 6: Composables (Week 4)
**Goal:** Reusable hooks for API operations

- [ ] **Task 6.1**: Data Fetching Composables
  - `src/composables/useProducts.ts`
  - `src/composables/useCart.ts`
  - `src/composables/useOrders.ts`
  - `src/composables/useInventory.ts`
- [ ] **Task 6.2**: Search Composable
  - `src/composables/useSearch.ts`
  - Faceted search support
- [ ] **Task 6.3**: Rate Limit Composable
  - `src/composables/useRateLimit.ts`

### 🧪 Phase 7: Testing & Documentation (Week 5)
**Goal:** Ensure reliability

- [ ] **Task 7.1**: Unit Tests
  - Services (jest/vitest)
  - Stores (pinia testing)
  - Utilities
- [ ] **Task 7.2**: Integration Tests
  - API mocking (MSW)
  - E2E key flows
- [ ] **Task 7.3**: Documentation
  - Service usage examples
  - Type documentation
  - Troubleshooting guide

---

## Detailed Task Breakdown

### 🎯 Phase 1, Task 1.2: Create Missing Base Types

#### File: `src/types/cart.ts`
```typescript
// New file - Complete cart types from API spec
- CartItem
- Cart
- CartSummary
- AddToCartRequest
- UpdateCartItemRequest
- VariantAttribute (if not in product.ts)
```

**Estimated Time:** 1 hour  
**Dependencies:** None  
**Tests:** Type checking

---

#### File: `src/types/inventory.ts`
```typescript
// New file - Complete inventory types
- StockOverview
- StockAlert
- InventoryLog
- InventoryStats
- UpdateStockRequest
- AlertType
- InventoryLogType
```

**Estimated Time:** 1 hour  
**Dependencies:** None

---

#### File: `src/types/address.ts`
```typescript
// New file - Shipping/billing addresses
- Address
- AddressInput
- CreateAddressRequest
- UpdateAddressRequest
```

**Estimated Time:** 30 minutes  
**Dependencies:** None

---

#### File: `src/types/shipping.ts`
```typescript
// New file - Shipping methods
- ShippingMethod
- ShippingRate
- ShippingZone
```

**Estimated Time:** 45 minutes  
**Dependencies:** None

---

### 🎯 Phase 1, Task 1.3: Enhance Existing Types

#### File: `src/types/common.ts` (Update)
```typescript
// Add missing types from API spec
- ApiSearchResponse<T> (with facets)
- FacetItem
- ApiError (enhance with retry_after)
```

**Changes:**
- Add `ApiSearchResponse` interface extending `ApiPaginatedResponse`
- Add `facets` and `applied_filters` properties
- Update `ApiError` to match spec

**Estimated Time:** 30 minutes  
**Dependencies:** None

---

#### File: `src/types/product.ts` (Update)
```typescript
// Updates needed:
- ProductType: add 'digital' | 'service'
- ProductStatus: already has needed statuses
- ProductVisibility: add 'search' option
- Add PriceRange interface
- Add missing Product fields (effective_price, thumbnail, variant_count, price_range)
```

**Estimated Time:** 45 minutes  
**Dependencies:** None

---

#### File: `src/types/vendor.ts` (Update)
```typescript
// Add VendorDashboardStats
- total_products
- active_products
- pending_products
- total_orders
- pending_orders
- etc.
```

**Estimated Time:** 30 minutes  
**Dependencies:** None

---

### 🎯 Phase 2, Task 2.1: Cart Service

#### File: `src/services/cart.service.ts` (New)
```typescript
// Customer cart endpoints
- getCart()
- addItem(request: AddToCartRequest)
- updateItem(id: number, request: UpdateCartItemRequest)
- removeItem(id: number)
- clearCart()
- getSummary()
```

**API Endpoints:**
- GET `/customer/cart`
- POST `/customer/cart/items`
- PUT `/customer/cart/items/{id}`
- DELETE `/customer/cart/items/{id}`
- DELETE `/customer/cart`
- GET `/customer/cart/summary`

**Estimated Time:** 2-3 hours  
**Dependencies:** Cart types  
**Tests:** API mocking

---

### 🎯 Phase 2, Task 2.2: Inventory Service

#### File: `src/services/inventory.service.ts` (New)
```typescript
// Vendor endpoints
- getInventory(filters?)
- updateStock(request: UpdateStockRequest)
- getAlerts(filters?)
- resolveAlert(id: number)
- getMovements(filters?)

// Admin-only endpoints
- getStats()
- getLowStock(filters?)
- getAllAlerts(filters?)
- bulkResolveAlerts(ids: number[])
- manualAdjustment(request)
- scanAlerts()
- getAllMovements(filters?)
```

**Estimated Time:** 3-4 hours  
**Dependencies:** Inventory types  
**Tests:** Unit tests for both vendor and admin functions

---

### 🎯 Phase 2, Task 2.3: Public Service

#### File: `src/services/public.service.ts` (New)
```typescript
// Public endpoints (no auth required)
- getProducts(filters?)
- getProductBySlug(slug: string)
- getFeaturedProducts()
- searchProducts(query: string, filters?)
- getProductsByCategory(slug: string, filters?)
- getCategories(filters?)
- getCategoryBySlug(slug: string)
```

**API Endpoints:**
- All `/customer/products/*` endpoints
- All `/customer/categories/*` endpoints

**Estimated Time:** 2-3 hours  
**Dependencies:** Product, Category types  
**Note:** These are unauthenticated endpoints

---

### 🎯 Phase 2, Task 2.4: Update Existing Services

#### File: `src/services/product.service.ts` (Update)
**Add missing endpoints:**
- Image management (upload, reorder, delete)
- Variant operations
- Submit for approval endpoint
- Restore deleted product

**Estimated Time:** 2 hours  
**Dependencies:** Updated Product types

---

#### File: `src/services/category.service.ts` (Update)
**Add admin operations:**
- Create/Update/Delete categories
- Reorder categories
- Toggle active status
- Approve/Reject category requests
- Template management (sync templates)

**Estimated Time:** 2 hours  
**Dependencies:** Updated Category types

---

#### File: `src/services/order.service.ts` (Update)
**Add:**
- Cancel order endpoint
- Order statistics endpoint
- Place order endpoint (customer)
- Update order status (vendor/admin)

**Estimated Time:** 1.5 hours  
**Dependencies:** Order types, Address types

---

#### File: `src/services/settings.service.ts` (Update)
**Add:**
- Bulk update settings
- Export settings (JSON)
- Import settings
- Get audit trail

**Estimated Time:** 1.5 hours  
**Dependencies:** Settings types

---

#### File: `src/services/attribute-template.service.ts` (Update)
**Add option management:**
- Add option to template
- Update option
- Delete option
- Reorder options
- Get templates by category
- Get filterable/variant-defining templates

**Estimated Time:** 2 hours  
**Dependencies:** Attribute template types

---

### 🎯 Phase 3, Task 3.1: Cart Store

#### File: `src/stores/cart.store.ts` (New)
```typescript
// Pinia store for cart management
State:
- cart: Cart | null
- loading: boolean
- error: string | null

Getters:
- itemsCount
- subtotal
- total
- isEmpty
- itemById(id)

Actions:
- fetchCart()
- addToCart(product, variant?, quantity)
- updateQuantity(itemId, quantity)
- removeItem(itemId)
- clearCart()
- applyCoupon(code)
- removeCoupon()
```

**Features:**
- Optimistic updates
- Guest cart support (session-based)
- Persist to localStorage
- Auto-sync with backend

**Estimated Time:** 4-5 hours  
**Dependencies:** Cart service, Cart types  
**Tests:** Pinia store testing

---

### 🎯 Phase 4, Task 4.1: Error Handler Utility

#### File: `src/utils/errorHandler.ts` (New)
```typescript
// Comprehensive error handling
- handleApiError(error: AxiosError<ApiError>): void
- getErrorMessage(error: unknown): string
- isValidationError(error: unknown): boolean
- extractValidationErrors(error: AxiosError): Record<string, string[]>
```

**Features:**
- Handle all HTTP status codes (400-500)
- Toast notifications based on error type
- Log errors to console (dev) / Sentry (prod)
- Extract validation errors for forms
- Special handling for rate limiting

**Estimated Time:** 2-3 hours  
**Dependencies:** Toast library  
**Tests:** Unit tests for each error type

---

### 🎯 Phase 4, Task 4.2: Rate Limit Handler

#### File: `src/utils/rateLimitHandler.ts` (New)
```typescript
// Rate limiting detection and handling
- handleRateLimit(error: AxiosError): boolean
- getRateLimitInfo(headers: AxiosResponseHeaders): RateLimitInfo
- canRetry(error: AxiosError): boolean
- scheduleRetry(fn: Function, retryAfter: number): Promise<any>

interface RateLimitInfo {
  limit: number
  remaining: number
  retryAfter?: number
}
```

**Features:**
- Parse rate limit headers
- Auto-retry with exponential backoff
- User notifications
- Request queue management

**Estimated Time:** 2-3 hours  
**Dependencies:** None  
**Tests:** Mock rate limit responses

---

### 🎯 Phase 5, Task 5.1: Validation Schemas

#### File: `src/validation/product.schema.ts` (New)
```typescript
// Zod schemas matching backend validation
- createProductSchema
- updateProductSchema
- productImageSchema
- productVariantSchema
```

**Example:**
```typescript
export const createProductSchema = z.object({
  name: z.string().min(3).max(255),
  category_id: z.number().int().positive(),
  price: z.number().positive(),
  // ... all fields matching API spec
})
```

**Estimated Time:** 3-4 hours (all schemas)  
**Dependencies:** Zod library  
**Files to Create:**
- `product.schema.ts`
- `category.schema.ts`
- `order.schema.ts`
- `cart.schema.ts`
- `auth.schema.ts`

---

### 🎯 Phase 6, Task 6.1: Data Fetching Composables

#### File: `src/composables/useProducts.ts` (New)
```typescript
// Vue composable for product operations
- useProducts(filters?) - List with pagination
- useProduct(id/slug) - Single product
- useFeaturedProducts() - Featured products
- useCreateProduct() - Mutation
- useUpdateProduct() - Mutation
- useDeleteProduct() - Mutation
```

**Pattern:**
```typescript
export function useProducts(filters?: ProductFilters) {
  const { data, loading, error, execute } = useApi(
    () => productService.getAll(filters)
  )
  
  // Auto-execute on mount
  onMounted(() => execute())
  
  return { products: data, loading, error, refresh: execute }
}
```

**Estimated Time:** 2 hours per composable  
**Dependencies:** Services, Types  
**Files:**
- `useProducts.ts`
- `useCart.ts`
- `useOrders.ts`
- `useInventory.ts`
- `useCategories.ts`

---

### 🎯 Phase 6, Task 6.2: Search Composable

#### File: `src/composables/useSearch.ts` (New)
```typescript
// Advanced search with facets
export function useSearch() {
  const query = ref('')
  const filters = ref({})
  const results = ref([])
  const facets = ref({})
  const loading = ref(false)
  
  const search = async () => {
    // Call search API
    // Parse facets
    // Update results
  }
  
  const applyFilter = (key: string, value: any) => {
    // Update filters
    // Re-search
  }
  
  return { query, filters, results, facets, search, applyFilter }
}
```

**Estimated Time:** 3-4 hours  
**Dependencies:** Public service, Search types  
**Features:**
- Debounced search
- Faceted filtering
- URL sync (query params)
- History management

---

## File Structure

### New Files to Create

```
src/
├── config/
│   └── api.config.ts                    # ✨ New - API configuration
│
├── types/
│   ├── cart.ts                          # ✨ New - Cart types
│   ├── inventory.ts                     # ✨ New - Inventory types
│   ├── address.ts                       # ✨ New - Address types
│   ├── shipping.ts                      # ✨ New - Shipping types
│   ├── common.ts                        # 🔧 Update - Add search types
│   ├── product.ts                       # 🔧 Update - Add digital/service
│   └── vendor.ts                        # 🔧 Update - Add stats
│
├── services/
│   ├── cart.service.ts                  # ✨ New - Cart operations
│   ├── inventory.service.ts             # ✨ New - Inventory management
│   ├── public.service.ts                # ✨ New - Public endpoints
│   ├── product.service.ts               # 🔧 Update - Add endpoints
│   ├── category.service.ts              # 🔧 Update - Admin operations
│   ├── order.service.ts                 # 🔧 Update - Cancel, stats
│   ├── settings.service.ts              # 🔧 Update - Bulk operations
│   └── attribute-template.service.ts    # 🔧 Update - Options CRUD
│
├── stores/
│   ├── cart.store.ts                    # ✨ New - Cart state
│   ├── inventory.store.ts               # ✨ New - Inventory state (optional)
│   └── settings.store.ts                # ✨ New - Settings cache
│
├── composables/
│   ├── useProducts.ts                   # ✨ New - Product operations
│   ├── useCart.ts                       # ✨ New - Cart operations
│   ├── useOrders.ts                     # ✨ New - Order operations
│   ├── useInventory.ts                  # ✨ New - Inventory operations
│   ├── useCategories.ts                 # ✨ New - Category operations
│   ├── useSearch.ts                     # ✨ New - Search with facets
│   └── useRateLimit.ts                  # ✨ New - Rate limit handling
│
├── utils/
│   ├── errorHandler.ts                  # ✨ New - Centralized errors
│   ├── rateLimitHandler.ts              # ✨ New - Rate limit logic
│   └── apiHelpers.ts                    # ✨ New - Helper functions
│
└── validation/
    ├── product.schema.ts                # ✨ New - Product validation
    ├── category.schema.ts               # ✨ New - Category validation
    ├── order.schema.ts                  # ✨ New - Order validation
    ├── cart.schema.ts                   # ✨ New - Cart validation
    └── auth.schema.ts                   # ✨ New - Auth validation
```

**Legend:**
- ✨ New file to create
- 🔧 Existing file to update

---

## Testing Strategy

### Unit Tests
- **Services**: Mock axios responses, test request/response transformation
- **Stores**: Test state mutations, actions, getters
- **Utilities**: Test error handling, rate limiting logic
- **Composables**: Test reactive behavior, API calls

### Integration Tests
- **API Integration**: Use MSW (Mock Service Worker) to mock API
- **Form Flows**: Test form submission with validation
- **Cart Flow**: Add to cart → Update → Checkout
- **Order Flow**: Place order → Track status

### E2E Tests (Optional)
- Customer: Browse → Add to cart → Checkout
- Vendor: Create product → Submit for approval
- Admin: Approve product → Manage inventory

---

## Timeline & Estimates

| Phase | Duration | Effort (Hours) | Priority |
|-------|----------|----------------|----------|
| **Phase 1: Types** | Week 1 | 8-10h | 🔴 Critical |
| **Phase 2: Services** | Week 2 | 16-20h | 🔴 Critical |
| **Phase 3: Stores** | Week 2-3 | 8-12h | 🔴 Critical |
| **Phase 4: Utilities** | Week 3 | 6-8h | 🟡 High |
| **Phase 5: Validation** | Week 3-4 | 8-10h | 🟡 High |
| **Phase 6: Composables** | Week 4 | 12-16h | 🟡 High |
| **Phase 7: Testing** | Week 5 | 16-20h | 🟢 Medium |
| **Total** | **5 weeks** | **74-96 hours** | |

### Parallel Work Opportunities
- Phase 1 → Phase 2 (some services can start after types are ready)
- Phase 4 & 5 can run in parallel
- Phase 6 can start after Phase 2 services are complete

---

## Dependencies & Prerequisites

### Required Packages (Already Installed)
- ✅ `axios` - HTTP client
- ✅ `pinia` - State management
- ✅ `vue-router` - Routing
- ✅ `zod` - Validation
- ✅ `vee-validate` - Form validation
- ✅ `@vee-validate/zod` - Zod integration
- ✅ `vue-toastification` - Toast notifications
- ✅ `dayjs` - Date formatting

### No Additional Packages Needed!
All required dependencies are already in `package.json`.

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| API changes during development | High | Use TypeScript strictly; version API with `/v1` prefix |
| Type mismatches with backend | Medium | Auto-generate types from OpenAPI spec (future) |
| Performance issues with large datasets | Medium | Implement pagination, virtual scrolling |
| Rate limiting affecting UX | Low | Implement auto-retry, queue management |
| Guest cart persistence | Medium | Use localStorage + session sync |

### Timeline Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Underestimated complexity | Medium | Add 20% buffer time |
| Backend API delays | High | Mock APIs for frontend development |
| Scope creep | Medium | Strict phase boundaries, prioritization |

---

## Success Criteria

### Phase Completion Checklist

Each phase is considered complete when:
- [ ] All files created/updated
- [ ] TypeScript compiles without errors
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Code reviewed by team
- [ ] Documentation updated
- [ ] No console errors in development

### Overall Project Success
- [ ] All 70+ API endpoints integrated
- [ ] Type-safe requests and responses
- [ ] Cart flow working end-to-end
- [ ] Inventory management functional
- [ ] Search with facets working
- [ ] Error handling consistent across app
- [ ] Rate limiting handled gracefully
- [ ] Forms validated with Zod schemas
- [ ] All composables tested
- [ ] Zero TypeScript errors
- [ ] Performance: <200ms API response handling

---

## Next Steps

### Immediate Actions (This Week)

1. **Review This Plan** ✅
   - Team review and approval
   - Adjust timelines if needed
   - Assign tasks to developers

2. **Setup Development Environment**
   - Ensure `.env` is configured
   - Backend API accessible
   - Postman collection for testing

3. **Start Phase 1**
   - Create missing type files
   - Update environment variables
   - Update existing types

### Communication Plan
- **Daily Standups**: Progress updates
- **Weekly Reviews**: Phase completion
- **Blockers Channel**: Immediate issues
- **Documentation**: Update as we build

---

## Appendix

### A. Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `cart.service.ts`)
- **Types/Interfaces**: `PascalCase` (e.g., `CartItem`)
- **Functions/Variables**: `camelCase` (e.g., `getCart`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Composables**: `use` prefix (e.g., `useCart`)

### B. Code Style Guide
- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Export types and functions explicitly
- Document complex functions with JSDoc
- Use `async/await` over `.then()`
- Handle errors explicitly, never silently

### C. Git Workflow
- Branch naming: `feature/phase-X-task-Y` (e.g., `feature/phase-1-cart-types`)
- Commit messages: Conventional commits (e.g., `feat: add cart types`)
- PR template: Include checklist from phase completion
- Code review: At least 1 approval required

### D. API Documentation Links
- API Spec: `https://api.mve.com/api/v1/docs`
- OpenAPI JSON: `https://api.mve.com/api/v1/docs/api.json`
- Postman Collection: Contact backend team

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-25 | AI Assistant | Initial comprehensive plan |

---

**Questions or Issues?**  
Contact: [Your Team Lead] | Slack: #mve-frontend
