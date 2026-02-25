# 🔥 DYNAMIC API INTEGRATION PLAN

> **Critical Issue Identified:** Only Login works with real API. All other features use mock data fallbacks.

## 🚨 Current Problem

```javascript
// Pattern found in ALL components:
try {
  const response = await categoryService.getAll()
  categories.value = response.data
} catch (error) {
  // ❌ MOCK DATA FALLBACK - This is the problem!
  categories.value = [
    { id: 1, name: 'Clothing', ... },
    { id: 2, name: 'Shoes', ... },
  ]
}
```

**Result:** When API fails, apps shows mock data → User thinks it works, but it doesn't!

---

## 🎯 Solution Strategy

### Phase 0: Fix Foundation (TODAY - 2-3 hours)

**Goal:** Remove mock fallbacks and expose real errors

#### Step 1: Verify API Connection (30 min)
- [ ] Check `.env` file has correct `VITE_API_URL`
- [ ] Test backend is running: `curl http://localhost:8000/api/v1/health`
- [ ] Test auth token is valid
- [ ] Check CORS configuration

#### Step 2: Remove Mock Data Fallbacks (1-2 hours)
- [ ] **Priority 1 - Categories** (Admin & Vendor)
  - `src/pages/admin/categories/CategoryList.vue`
  - `src/pages/admin/categories/PendingCategories.vue`
  - Remove mock data in catch blocks
  - Show proper error messages instead

- [ ] **Priority 2 - Products** (Admin & Vendor)
  - `src/pages/admin/products/ProductList.vue`
  - `src/pages/admin/products/ProductDetail.vue`
  - `src/pages/admin/products/ProductForm.vue`
  - `src/pages/vendor/products/ProductList.vue`
  - `src/pages/vendor/products/ProductForm.vue`

- [ ] **Priority 3 - Attribute Templates** (Admin)
  - `src/pages/admin/templates/TemplateList.vue`

#### Step 3: Implement Proper Error Handling (30 min)
```typescript
// ✅ GOOD - Show real error, no fallback
try {
  const response = await categoryService.getAll()
  categories.value = response.data
} catch (error) {
  toast.error('Failed to load categories from API')
  console.error('API Error:', error)
  categories.value = [] // Empty, not mock
  // Optionally show error state in UI
}
```

---

## 📋 Component-by-Component Plan

### 🟥 CRITICAL - Must Work First (Week 1)

| Page | Mock Data Location | Service Used | Status |
|------|-------------------|--------------|--------|
| **Admin Categories** | CategoryList.vue:76 | categoryService.getAll() | ❌ Mock fallback |
| **Vendor Categories** | ProductForm.vue:110 | categoryService.getAll() | ❌ Mock fallback |
| **Admin Products** | ProductList.vue:88 | productService.getAll() | ❌ Mock fallback |
| **Vendor Products** | ProductList.vue:80 | productService.getAll() | ❌ Mock fallback |
| **Attribute Templates** | TemplateList.vue:85 | attributeTemplateService.getAll() | ❌ Mock fallback |

### 🟨 HIGH PRIORITY (Week 1-2)

| Page | Mock Data Location | Service Used | Status |
|------|-------------------|--------------|--------|
| **Admin Dashboard** | Dashboard.vue:31,43,52 | Multiple services | ❌ All mock |
| **Vendor Dashboard** | Dashboard.vue:34,47,56 | Multiple services | ❌ All mock |
| **Admin Orders** | OrderList.vue:80 | orderService.getAll() | ❌ Mock fallback |
| **Vendor Orders** | OrderList.vue:79 | orderService.getAll() | ❌ Mock fallback |
| **Order Details** | OrderDetail.vue:65,76 | orderService.getById() | ❌ Mock fallback |

### 🟩 MEDIUM PRIORITY (Week 2)

| Page | Mock Data Location | Service Used | Status |
|------|-------------------|--------------|--------|
| **Vendors List** | VendorList.vue:90 | vendorService.getAll() | ❌ Mock fallback |
| **Vendor Detail** | VendorDetail.vue:65 | vendorService.getById() | ❌ Mock fallback |
| **Customers List** | CustomerList.vue:46 | No service yet | ❌ Mock only |
| **Customer Detail** | CustomerDetail.vue:80 | No service yet | ❌ Mock only |
| **Inventory** | Inventory.vue:69 | No service yet | ❌ Mock only |

### 🟦 LOW PRIORITY (Week 3)

| Page | Mock Data Location | Service Used | Status |
|------|-------------------|--------------|--------|
| **Coupons** | CouponList.vue:59 | couponService.getAll() | ❌ Mock fallback |
| **Payouts** | PayoutList.vue:93 | payoutService.getAll() | ❌ Mock fallback |
| **Reviews** | ReviewList.vue:59,75 | reviewService.getAll() | ❌ Mock fallback |
| **Commissions** | CommissionList.vue:124 | No service yet | ❌ Mock only |
| **Earnings** | Earnings.vue:45 | No service yet | ❌ Mock only |

---

## 🔧 Implementation Steps

### 🚀 TODAY (Phase 0): Remove Mock Fallbacks

#### Task 1: Fix CategoryList.vue (Admin)

**File:** `src/pages/admin/categories/CategoryList.vue`

**Current (Lines 75-82):**
```typescript
catch (error) {
  // Mock data for demo
  categories.value = [
    { id: 1, name: 'Clothing', ... },
    // ... more mock data
  ]
}
```

**Replace with:**
```typescript
catch (error: any) {
  const message = error.response?.data?.message || 'Failed to load categories'
  toast.error(message)
  console.error('Category API Error:', error)
  categories.value = []
}
```

#### Task 2: Fix ProductList.vue (Admin)

**File:** `src/pages/admin/products/ProductList.vue`

**Current (Lines 88-120):**
```typescript
catch (error) {
  toast.error('Failed to fetch products')
  // Mock data for demo
  products.value = [...]
}
```

**Replace with:**
```typescript
catch (error: any) {
  const message = error.response?.data?.message || 'Failed to load products'
  toast.error(message)
  console.error('Product API Error:', error)
  products.value = []
  pagination.totalItems.value = 0
}
```

#### Task 3: Fix ProductForm.vue (Vendor) - Categories

**File:** `src/pages/vendor/products/ProductForm.vue`

**Current (Line 110):**
```typescript
// Mock categories
categories.value = [
  { id: 1, name: 'Clothing' },
  { id: 2, name: 'Shoes' },
  ...
]
```

**Replace with API call:**
```typescript
async function loadCategories() {
  try {
    const response = await categoryService.getAll()
    categories.value = response.data
  } catch (error: any) {
    toast.error('Failed to load categories')
    console.error('Category API Error:', error)
    categories.value = []
  }
}

onMounted(() => {
  loadCategories()
})
```

#### Task 4: Fix TemplateList.vue (Admin)

**File:** `src/pages/admin/templates/TemplateList.vue`

Remove mock data at line 85, use proper error handling

---

### 📊 WEEK 1: Critical Features

#### Day 1-2: Categories & Attributes
- [ ] Remove all category mock data
- [ ] Test category CRUD operations
- [ ] Remove attribute template mock data
- [ ] Test attribute template CRUD

#### Day 3-4: Products
- [ ] Remove product mock data (admin)
- [ ] Remove product mock data (vendor)
- [ ] Test product list, create, edit, delete
- [ ] Fix product form to load real categories

#### Day 5: Dashboard Stats
- [ ] Create/verify dashboard service
- [ ] Remove dashboard mock data
- [ ] Implement real stats API calls

---

### 📊 WEEK 2: Orders & Vendors

#### Day 1-2: Orders
- [ ] Remove order mock data
- [ ] Test order list (admin & vendor)
- [ ] Test order details
- [ ] Test order status updates

#### Day 3-4: Vendors
- [ ] Remove vendor mock data
- [ ] Test vendor list
- [ ] Test vendor details
- [ ] Test vendor approval/suspension

#### Day 5: Inventory (if service exists)
- [ ] Create inventory service if missing
- [ ] Remove inventory mock data
- [ ] Test inventory operations

---

### 📊 WEEK 3: Secondary Features

- [ ] Customers (create service if missing)
- [ ] Coupons
- [ ] Payouts
- [ ] Reviews
- [ ] Commissions (create service if missing)

---

## 🧪 Testing Strategy

### For Each Component:

1. **Before Changes:**
   ```bash
   # Note what mock data is shown
   # Take screenshot
   ```

2. **After Removing Mock:**
   ```bash
   # With backend OFF - should show error
   # With backend ON - should show real data
   ```

3. **Verify:**
   - [ ] Error messages are clear
   - [ ] No console errors except expected API errors
   - [ ] UI handles empty state gracefully
   - [ ] Real data displays correctly when API works

---

## 🔍 Debug Checklist

If API calls fail, check:

1. **Backend Running?**
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. **Auth Token Valid?**
   ```javascript
   // Check in browser console
   localStorage.getItem('mve_auth_token')
   ```

3. **CORS Enabled?**
   - Backend must allow frontend origin
   - Check backend CORS config

4. **API Base URL Correct?**
   ```bash
   # .env file
   VITE_API_URL=http://localhost:8000/api/v1
   ```

5. **Network Tab?**
   - Open DevTools → Network
   - Look for failed requests
   - Check request/response details

---

## 📝 Code Patterns

### ✅ GOOD: Proper Error Handling

```typescript
async function fetchData() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await someService.getAll()
    items.value = response.data
    meta.value = response.meta
  } catch (err: any) {
    // Show user-friendly error
    const message = err.response?.data?.message || 'Failed to load data'
    toast.error(message)
    
    // Log for debugging
    console.error('API Error:', {
      endpoint: err.config?.url,
      status: err.response?.status,
      data: err.response?.data
    })
    
    // Set empty state
    items.value = []
    error.value = message
  } finally {
    isLoading.value = false
  }
}
```

### ❌ BAD: Mock Data Fallback

```typescript
try {
  const response = await someService.getAll()
  items.value = response.data
} catch (error) {
  // ❌ DON'T DO THIS!
  items.value = [
    { id: 1, name: 'Mock Item' },
    { id: 2, name: 'Mock Item 2' },
  ]
}
```

### ✅ GOOD: Empty State UI

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">
    <p>{{ error }}</p>
    <button @click="fetchData">Retry</button>
  </div>
  <div v-else-if="items.length === 0">
    <p>No items found</p>
  </div>
  <div v-else>
    <!-- Show items -->
  </div>
</template>
```

---

## 🎯 Success Criteria

### Phase 0 (TODAY):
- [ ] All mock data fallbacks removed from critical pages
- [ ] Proper error messages shown when API fails
- [ ] Console shows clear API error logs
- [ ] Empty states display correctly

### Week 1:
- [ ] Categories work with real API
- [ ] Products work with real API
- [ ] Attribute templates work with real API
- [ ] Dashboards show real stats

### Week 2:
- [ ] Orders work with real API
- [ ] Vendors work with real API
- [ ] Inventory works with real API

### Week 3:
- [ ] All remaining features use real API
- [ ] Zero mock data in production code
- [ ] All components handle errors gracefully

---

## 📦 Files to Modify (Priority Order)

### 🔴 IMMEDIATE (Today)

1. `src/pages/admin/categories/CategoryList.vue` - Remove mock at line 76
2. `src/pages/admin/products/ProductList.vue` - Remove mock at line 88
3. `src/pages/vendor/products/ProductList.vue` - Remove mock at line 80
4. `src/pages/vendor/products/ProductForm.vue` - Replace mock at line 110
5. `src/pages/admin/templates/TemplateList.vue` - Remove mock at line 85

### 🟠 HIGH (This Week)

6. `src/pages/admin/Dashboard.vue` - Remove mocks at lines 31, 43, 52
7. `src/pages/vendor/Dashboard.vue` - Remove mocks at lines 34, 47, 56
8. `src/pages/admin/orders/OrderList.vue` - Remove mock at line 80
9. `src/pages/vendor/orders/OrderList.vue` - Remove mock at line 79
10. `src/pages/admin/orders/OrderDetail.vue` - Remove mock at line 65

### 🟡 MEDIUM (Next Week)

11-20. Vendors, Customers, Inventory pages

### 🟢 LOW (Week 3)

21+. Coupons, Payouts, Reviews, etc.

---

## 🚀 Quick Start Commands

```bash
# 1. Check backend is running
curl http://localhost:8000/api/v1/health

# 2. Check current env
cat .env | grep VITE_API_URL

# 3. Start frontend
npm run dev

# 4. Open browser and check:
# - Categories page (should show error or real data, not mock)
# - Products page (same)
# - Network tab (check API calls)
```

---

## 📞 Need Help?

**API Not Found (404)?**
- Backend endpoint might not exist yet
- Check API documentation
- Ask backend team

**Unauthorized (401)?**
- Token might be expired
- Try logging out and back in
- Check token in localStorage

**CORS Error?**
- Backend needs to allow your origin
- Check backend CORS config

**Empty Response?**
- Database might be empty
- Seed some test data
- Check backend logs

---

**Last Updated:** February 25, 2026  
**Next Review:** After Phase 0 completion (today)
