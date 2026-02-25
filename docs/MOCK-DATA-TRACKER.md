# 🎯 Mock Data Removal Tracker

> Complete list of all files with mock data that need to be replaced with real API calls

## 📊 Status Legend
- 🔴 **Critical** - Must fix immediately
- 🟡 **High** - Fix this week
- 🟢 **Medium** - Fix next week
- 🔵 **Low** - Fix when time allows

---

## 🔴 CRITICAL - Fix TODAY (Phase 0)

### Admin Pages

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/categories/CategoryList.vue` | 76 | Category list | Mock fallback in catch | Remove mock, show error |
| `admin/products/ProductList.vue` | 88 | Product list | Mock fallback in catch | Remove mock, show error |
| `admin/products/ProductDetail.vue` | 55 | Product details | Mock data | Use productService.getById() |
| `admin/products/ProductForm.vue` | 162 | Product form | Mock categories | Use categoryService.getAll() |
| `admin/templates/TemplateList.vue` | 85 | Template list | Mock fallback | Remove mock, show error |
| `admin/categories/PendingCategories.vue` | 44 | Pending categories | Mock data | Use categoryService.getPending() |

**Estimated Time:** 2-3 hours

---

### Vendor Pages

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `vendor/products/ProductList.vue` | 80 | Product list | Mock fallback in catch | Remove mock, show error |
| `vendor/products/ProductForm.vue` | 110, 142 | Categories & editing | Mock data | Load from API |

**Estimated Time:** 1 hour

---

## 🟡 HIGH PRIORITY - Fix This Week

### Dashboard Pages

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/Dashboard.vue` | 31 | Stats | Mock stats data | Create/use analyticsService |
| `admin/Dashboard.vue` | 43 | Recent orders | Mock order data | Use orderService.getRecent() |
| `admin/Dashboard.vue` | 52 | Top products | Mock product data | Use productService.getTop() |
| `vendor/Dashboard.vue` | 34 | Stats | Mock stats data | Use vendorService.getStats() |
| `vendor/Dashboard.vue` | 47 | Recent orders | Mock order data | Use orderService.getAll() |
| `vendor/Dashboard.vue` | 56 | Low stock | Mock inventory | Use inventoryService.getLowStock() |

**Estimated Time:** 3-4 hours (need to create some service methods)

---

### Order Pages

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/orders/OrderList.vue` | 80 | Order list | Mock fallback | Remove mock, show error |
| `admin/orders/OrderDetail.vue` | 65 | Order details | Mock data | Use orderService.getById() |
| `vendor/orders/OrderList.vue` | 79 | Order list | Mock fallback | Remove mock, show error |
| `vendor/orders/OrderDetail.vue` | 76 | Order details | Mock data | Use orderService.getById() |

**Estimated Time:** 2 hours

---

## 🟢 MEDIUM PRIORITY - Fix Next Week

### Vendor Management

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/vendors/VendorList.vue` | 90 | Vendor list | Mock data | Use vendorService.getAll() |
| `admin/vendors/VendorDetail.vue` | 65 | Vendor details | Mock data | Use vendorService.getById() |
| `vendor/status/PendingApproval.vue` | 22 | Vendor status | Mock data | Use authStore.user.vendor |
| `vendor/status/Suspended.vue` | 24 | Suspension info | Mock data | Use vendorService.getSuspension() |

**Estimated Time:** 2 hours

---

### Customer Management

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/customers/CustomerList.vue` | 46 | Customer list | Mock data | **Create customerService** |
| `admin/customers/CustomerDetail.vue` | 80, 83 | Customer details | Mock data | **Create customerService** |

**Estimated Time:** 3 hours (need to create service)

---

### Inventory

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `vendor/inventory/Inventory.vue` | 69 | Inventory list | Mock data | **Create inventoryService** |

**Estimated Time:** 2 hours (need to create service)

---

## 🔵 LOW PRIORITY - Fix When Time Allows

### Coupons

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/coupons/CouponList.vue` | 59 | Coupon list | Mock data | Use couponService.getAll() |
| `admin/coupons/CouponForm.vue` | 189 | Coupon form | Mock data | Already has service |
| `vendor/coupons/CouponList.vue` | 50 | Vendor coupons | Mock data | Use couponService.getAll() |

**Estimated Time:** 1.5 hours

---

### Payouts

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/payouts/PayoutList.vue` | 93 | Payout list | Mock data | Use payoutService.getAll() |
| `vendor/payouts/PayoutList.vue` | 76 | Vendor payouts | Mock data | Use payoutService.getAll() |
| `vendor/payouts/PayoutRequest.vue` | 119, 145 | Request form | Mock data | Use payoutService methods |
| `vendor/earnings/Earnings.vue` | 45, 54 | Earnings stats | Mock data | **Create earningsService** |

**Estimated Time:** 2-3 hours

---

### Reviews

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/reviews/ReviewList.vue` | 59 | Review list | Mock data | Use reviewService.getAll() |
| `vendor/reviews/ReviewList.vue` | 75 | Vendor reviews | Mock data | Use reviewService.getAll() |

**Estimated Time:** 1 hour

---

### Commissions

| File | Line | Type | Current Issue | Fix Action |
|------|------|------|---------------|------------|
| `admin/commissions/CommissionList.vue` | 124, 139 | Commission list | Mock data | **Create commissionService** |

**Estimated Time:** 2 hours (need to create service)

---

## 📋 Summary by Service

### ✅ Services Already Exist (Just remove mock)

| Service | Files Using It | Status |
|---------|---------------|--------|
| `categoryService` | 3 files | ✅ Service exists, remove fallbacks |
| `productService` | 5 files | ✅ Service exists, remove fallbacks |
| `orderService` | 4 files | ✅ Service exists, remove fallbacks |
| `attributeTemplateService` | 1 file | ✅ Service exists, remove fallback |
| `vendorService` | 2 files | ✅ Service exists, remove fallbacks |
| `couponService` | 3 files | ✅ Service exists, remove fallbacks |
| `payoutService` | 3 files | ✅ Service exists, remove fallbacks |
| `reviewService` | 2 files | ✅ Service exists, remove fallbacks |

**Total time to fix:** ~8-10 hours

---

### ❌ Services Need to be Created

| Service | Files Affected | Priority | Estimated Time |
|---------|---------------|----------|----------------|
| `customerService` | 2 files | 🟡 High | 2-3 hours |
| `inventoryService` | 1 file | 🟡 High | 2 hours |
| `analyticsService` (Dashboard) | 2 files | 🟡 High | 2-3 hours |
| `earningsService` | 1 file | 🔵 Low | 1-2 hours |
| `commissionService` | 1 file | 🔵 Low | 2 hours |

**Total time to create:** ~9-12 hours

---

## 🎯 Action Plan

### TODAY (2-3 hours)
Focus on removing mock fallbacks where services already exist:

```bash
# Fix these 5 files first:
1. admin/categories/CategoryList.vue (Line 76)
2. admin/products/ProductList.vue (Line 88)
3. vendor/products/ProductList.vue (Line 80)
4. vendor/products/ProductForm.vue (Lines 110, 142)
5. admin/templates/TemplateList.vue (Line 85)
```

### THIS WEEK (8-10 hours)
- Finish removing all mock fallbacks from existing services
- Create customer, inventory, analytics services
- Fix dashboard pages

### NEXT WEEK (5-7 hours)
- Create earnings, commission services
- Fix remaining low-priority pages
- Test all integrations

---

## 🔧 Standard Fix Pattern

### For Files with Service + Mock Fallback:

**Before:**
```typescript
async function fetchData() {
  try {
    const response = await someService.getAll()
    items.value = response.data
  } catch (error) {
    // ❌ REMOVE THIS BLOCK
    items.value = [
      { id: 1, name: 'Mock Item 1' },
      { id: 2, name: 'Mock Item 2' },
    ]
  }
}
```

**After:**
```typescript
async function fetchData() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await someService.getAll()
    items.value = response.data
    meta.value = response.meta
  } catch (err: any) {
    // ✅ PROPER ERROR HANDLING
    const message = err.response?.data?.message || 'Failed to load data'
    toast.error(message)
    console.error('API Error:', {
      endpoint: err.config?.url,
      status: err.response?.status,
      data: err.response?.data,
    })
    items.value = []
    error.value = message
  } finally {
    isLoading.value = false
  }
}
```

### For Files with Only Mock Data (No Service):

**Before:**
```typescript
const items = ref([
  { id: 1, name: 'Mock' },
  { id: 2, name: 'Mock' },
])
```

**After:**
```typescript
const items = ref([])

async function fetchItems() {
  isLoading.value = true
  try {
    const response = await newlyCreatedService.getAll()
    items.value = response.data
  } catch (err: any) {
    toast.error('Failed to load items')
    console.error('API Error:', err)
    items.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchItems()
})
```

---

## 🧪 Testing After Each Fix

1. **With Backend OFF:**
   - Should show error toast
   - Should show empty state in UI
   - Should log error in console
   - Should NOT show mock data

2. **With Backend ON:**
   - Should show loading state
   - Should fetch real data
   - Should display in table/list
   - Should show correct counts

3. **Check Network Tab:**
   - Request sent to correct endpoint
   - Auth header included
   - Response status code
   - Response data structure

---

## 📊 Progress Tracking

Mark ✅ when completed:

### Phase 0 (Critical)
- [ ] admin/categories/CategoryList.vue
- [ ] admin/products/ProductList.vue
- [ ] admin/products/ProductDetail.vue
- [ ] admin/products/ProductForm.vue
- [ ] admin/templates/TemplateList.vue
- [ ] vendor/products/ProductList.vue
- [ ] vendor/products/ProductForm.vue

### Phase 1 (High - Dashboards)
- [ ] admin/Dashboard.vue (stats)
- [ ] admin/Dashboard.vue (orders)
- [ ] admin/Dashboard.vue (products)
- [ ] vendor/Dashboard.vue (stats)
- [ ] vendor/Dashboard.vue (orders)
- [ ] vendor/Dashboard.vue (inventory)

### Phase 2 (High - Orders)
- [ ] admin/orders/OrderList.vue
- [ ] admin/orders/OrderDetail.vue
- [ ] vendor/orders/OrderList.vue
- [ ] vendor/orders/OrderDetail.vue

### Phase 3 (Medium - Vendors/Customers)
- [ ] admin/vendors/VendorList.vue
- [ ] admin/vendors/VendorDetail.vue
- [ ] admin/customers/CustomerList.vue (create service)
- [ ] admin/customers/CustomerDetail.vue (create service)
- [ ] vendor/inventory/Inventory.vue (create service)

### Phase 4 (Low - Everything else)
- [ ] Coupons (3 files)
- [ ] Payouts (3 files)
- [ ] Reviews (2 files)
- [ ] Commissions (1 file)
- [ ] Earnings (1 file)

---

## 🎓 Tips

1. **Start with easiest** - Files that already have services
2. **Test immediately** after each fix
3. **Commit often** - One file or feature at a time
4. **Keep backend running** while testing
5. **Use browser DevTools** Network tab to debug
6. **Check console** for errors and API responses

---

**Last Updated:** February 25, 2026  
**Total Files to Fix:** 35+  
**Estimated Total Time:** 25-30 hours
