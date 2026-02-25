# 🎯 MVE Dashboard - Dynamic API Integration

## 🚨 Critical Issue Discovered

**Problem:** আপনার dashboard শুধু login dynamic হচ্ছে। বাকি সব কিছু mock data দেখাচ্ছে। 

**কারণ:** কম্পোনেন্টগুলো API call করছে, কিন্তু error হলে mock data দেখাচ্ছে (fallback)।

**সমাধান:** Mock data remove করে real API errors দেখাতে হবে।

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **[DYNAMIC-API-PLAN.md](./DYNAMIC-API-PLAN.md)** | **আজকে কি করতে হবে** | 🔥 **এটা প্রথমে পড়ুন!** |
| [MOCK-DATA-TRACKER.md](./MOCK-DATA-TRACKER.md) | কোন file এ mock data আছে | সব files list দেখতে |
| [API-INTEGRATION-CHECKLIST.md](./API-INTEGRATION-CHECKLIST.md) | Task checklist | Daily tracking |
| [API-ENDPOINTS-REFERENCE.md](./API-ENDPOINTS-REFERENCE.md) | API endpoints list | Quick reference |
| [API-INTEGRATION-PLAN.md](./API-INTEGRATION-PLAN.md) | Full implementation plan | Long-term planning |

---

## 🔥 আজকে করুন (Phase 0 - 2-3 ঘন্টা)

### Step 1: Backend Check করুন (5 মিনিট)

```bash
# Backend running আছে কিনা check করুন
curl http://localhost:8000/api/v1/health

# .env file check করুন
cat .env | grep VITE_API_URL
# Should be: VITE_API_URL=http://localhost:8000/api/v1
```

### Step 2: এই Files থেকে Mock Data Remove করুন (2 ঘন্টা)

**🔴 Critical - এগুলো প্রথমে fix করুন:**

1. `src/pages/admin/categories/CategoryList.vue` (Line 76)
2. `src/pages/admin/products/ProductList.vue` (Line 88)  
3. `src/pages/vendor/products/ProductList.vue` (Line 80)
4. `src/pages/vendor/products/ProductForm.vue` (Lines 110, 142)
5. `src/pages/admin/templates/TemplateList.vue` (Line 85)

**কি করতে হবে:**

```typescript
// ❌ এই code remove করুন:
catch (error) {
  // Mock data for demo
  categories.value = [
    { id: 1, name: 'Clothing', ... },
  ]
}

// ✅ এভাবে করুন:
catch (error: any) {
  const message = error.response?.data?.message || 'Failed to load'
  toast.error(message)
  console.error('API Error:', error)
  categories.value = [] // Empty array, no mock!
}
```

### Step 3: Test করুন

**Backend OFF থাকলে:**
- Error message দেখাবে ✅
- Empty state UI দেখাবে ✅
- Mock data দেখাবে না ❌

**Backend ON থাকলে:**  
- Real data দেখাবে ✅
- Loading state দেখাবে ✅

---

## 📊 Current Status

| Feature | Status | Next Action |
|---------|--------|-------------|
| Login | ✅ Dynamic (Real API) | Nothing needed |
| Categories | ❌ Mock fallback | Remove mock in catch block |
| Products | ❌ Mock fallback | Remove mock in catch block |
| Orders | ❌ Mock fallback | Remove mock in catch block |
| Dashboard | ❌ All mock | Create analytics service |
| Inventory | ❌ No service | Create inventory service |
| Customers | ❌ No service | Create customer service |

---

## 🎯 Timeline

```
আজ (Phase 0)      এই সপ্তাহ         পরের সপ্তাহ
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Remove   │─────▶│ Fix All  │─────▶│ Create   │
│ Mock     │      │ Existing │      │ Missing  │
│ Data     │      │ Services │      │ Services │
└──────────┘      └──────────┘      └──────────┘
 2-3 hours         8-10 hours        8-10 hours
```

---

## 🔍 কিভাবে check করবেন

### Browser DevTools এ:

1. **Network Tab** খুলুন
   - API calls দেখতে পাবেন
   - Status codes check করুন
   - Response data দেখুন

2. **Console Tab** খুলুন
   - Errors দেখুন
   - API responses log দেখুন

3. **Application Tab → Local Storage**
   - `mve_auth_token` আছে কিনা
   - Token valid কিনা

---

## 🆘 Problems?

### API calls না গেলে:

```bash
# Backend running check
ps aux | grep php

# Port check  
lsof -i :8000

# Laravel logs
tail -f storage/logs/laravel.log
```

### CORS error হলে:

Backend এর config/cors.php check করুন:
```php
'allowed_origins' => ['http://localhost:5173'],
```

### 401 Unauthorized হলে:

```javascript
// Browser console এ
localStorage.getItem('mve_auth_token')
// null হলে আবার login করুন
```

---

## 📁 Files Count

| Category | Files | Status |
|----------|-------|--------|
| Mock data fallbacks | 23 files | ❌ Need to remove |
| No service (only mock) | 8 files | ❌ Need service + integration |
| Services exist | 15 files | ✅ Just remove mock fallback |
| **Total** | **35+ files** | **~25-30 hours work** |

---

## ✅ Success Criteria

### Phase 0 Complete যখন:
- [ ] Top 5 critical files থেকে mock removed
- [ ] Error messages properly দেখাচ্ছে
- [ ] Backend ON হলে real data দেখাচ্ছে
- [ ] Backend OFF হলে error দেখাচ্ছে (not mock!)

### Final Success যখন:
- [ ] সব pages real API use করছে
- [ ] কোন mock data নেই
- [ ] Proper error handling সব জায়গায়
- [ ] Empty states properly দেখাচ্ছে

---

## 🚀 এখনই শুরু করুন!

```bash
# 1. Documentation পড়ুন
cat DYNAMIC-API-PLAN.md

# 2. Backend start করুন
cd ../backend && php artisan serve

# 3. Frontend start করুন  
npm run dev

# 4. First file fix করুন
code src/pages/admin/categories/CategoryList.vue

# 5. Test করুন browser এ
# Categories page এ যান
# Network tab check করুন

# 6. Commit করুন
git add .
git commit -m "fix: remove mock data from CategoryList"
```

---

## 📞 Help Needed?

- **DYNAMIC-API-PLAN.md** - সব details আছে
- **MOCK-DATA-TRACKER.md** - সব files list  
- **Browser DevTools** - Error debugging

---

**Last Updated:** February 25, 2026  
**Priority:** 🔴 **URGENT - Start Phase 0 today!**
