-- Active: 1752732495489@@127.0.0.1@5432
# MVE Dashboard — Blueprint vs Project Gap Analysis Report

> **Generated:** February 24, 2026  
> **Project:** Multi-Vendor E-commerce Admin + Vendor Dashboard  
> **Stack:** Vue 3.5 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4

---

## 🔢 Executive Summary

| Layer | Exists | Stubs | Missing | Coverage |
|---|---|---|---|---|
| **Dependencies** | 17 | — | 4 | ~81% |
| **Components** | 21 | 0 | **51** | **29%** |
| **Services** | 7 | 0 | **8 files** + methods | ~50% |
| **Composables** | 11 | 0 | **9** | 55% |
| **Stores** | 4 | 0 | ~1–2 | 90% |
| **Types** | 14 | 0 | **0** | ✅ 100% |
| **Utils** | 5 | 0 | 0 | ✅ 100% |
| **Pages** | 51 files | **17 stubs** | **~12 pages** | ~55% |
| **i18n** | 2 locales | — | — | ✅ Present |
| **Assets** | 3 | — | Fonts, images | ⚠️ Minimal |

**Overall Project Completion: ~40–45%**

---

## 1️⃣ Missing Dependencies (package.json)

| Package | Purpose | Priority |
|---|---|---|
| `vue-draggable-plus` | Drag & drop reorder (categories, images) | 🔴 High |
| `@tiptap/vue-3` + extensions | Rich Text Editor (product descriptions) | 🔴 High |
| `vitest` + `@vue/test-utils` | Unit/component testing | 🟡 Medium |
| `msw` | API mocking for development | 🟢 Low |

---

## 2️⃣ Components — 51 Missing (71%)

### ✅ Existing (21 files — all fully implemented, no stubs)

| Category | Files | Notes |
|---|---|---|
| **UI** (8) | BaseButton, BaseBadge, BaseCard, BaseModal, ConfirmDialog, EmptyState, PageLoader, StatCard | All production-quality with dark mode |
| **Form** (5) | FormInput, FormSelect, FormCheckbox, FormSwitch, FormTextarea | All have vee-validate integration |
| **Data** (1) | DataTable | @tanstack/vue-table, sorting, selection, pagination |
| **Charts** (3) | LineChart, BarChart, DoughnutChart | Chart.js + dark mode |
| **Layout** (4) | AppSidebar, AppHeader, AppBreadcrumb, LanguageSwitcher | Full admin+vendor nav |

### ❌ Missing UI Components (11)

| Component | Purpose |
|---|---|
| **AppRadio / FormRadio** | Radio button group |
| **AppAlert** | Alert/notification banner |
| **AppTooltip** | Tooltip wrapper (floating-vue installed but no component) |
| **AppDropdown** | Dropdown menu |
| **AppTabs** | Tab navigation component |
| **AppAccordion** | Collapsible sections |
| **AppAvatar** | User/vendor avatar with fallback |
| **AppSpinner** | Standalone loading spinner |
| **AppSkeleton** | Skeleton loading placeholders |
| **AppProgressBar** | Progress indicator |
| **AppPagination** | Standalone pagination (currently embedded in DataTable) |

### ❌ Missing Form Components (14) — *Biggest Gap*

| Component | Purpose |
|---|---|
| **FormField** | Label + input + error wrapper |
| **FormGroup** | Fieldset with title |
| **ImageUploader** | Drag-drop, preview, reorder, progress bar |
| **FileUploader** | Generic file upload |
| **RichTextEditor** | Tiptap WYSIWYG editor |
| **DatePicker** | Date selection |
| **DateRangePicker** | Date range for reports/filters |
| **ColorPicker** | Color selection |
| **TagInput** | Tag/keyword input |
| **SearchableSelect** | Searchable dropdown |
| **MultiSelect** | Multi-option selection |
| **MoneyInput** | Currency input with ৳ prefix |
| **PhoneInput** | +880 Bangladesh phone format |
| **SlugInput** | Auto-generated slug from title |

### ❌ Missing Data Components (7)

| Component | Purpose |
|---|---|
| **DataGrid** | Card-based grid view (alternative to table) |
| **StatusBadge** | Auto-maps status enums → badge variant+color |
| **PriceDisplay** | Formatted ৳ price display |
| **DateDisplay** | Formatted date with tooltip |
| **UserAvatar** | User avatar with name/status |
| **ImageGallery** | Product image gallery with zoom |
| **StatsCard** | Alternate to StatCard? |

### ❌ Missing Chart Components (3)

PieChart, AreaChart, SparklineChart

### ❌ Missing Layout Components (7)

| Component | Purpose |
|---|---|
| **AppFooter** | Footer bar |
| **SidebarItem** | Extracted nav item (inline in AppSidebar now) |
| **SidebarGroup** | Grouped nav items |
| **NotificationDropdown** | Extracted from AppHeader |
| **UserMenu** | Extracted from AppHeader |
| **SearchCommand** | ⌘K command palette |
| **MobileNav** | Bottom navigation for mobile |

### ❌ Missing Shared Domain Components (9) — *Entire folder doesn't exist*

ProductStatusFlow, CategoryTreeView, CategoryBreadcrumb, AttributeValueInput, **VariantMatrix** (Daraz-style), OrderTimeline, ActivityFeed, ApprovalWorkflow, ExportButton

---

## 3️⃣ Services — 8 Missing Files + Method Gaps

### ✅ Existing (7 files)

| Service | Methods | Missing Methods |
|---|---|---|
| api.ts | Full | — |
| auth.service.ts | 11 methods | — (exceeds blueprint) |
| product.service.ts | 15 methods | ❌ **4 variant CRUD methods**, `bulkUpdateStatus` |
| category.service.ts | 8 methods | ❌ `toggleActive`, `suggestCategory`, `getPendingSuggestions` |
| order.service.ts | 12 methods | ❌ `confirmOrder`, `markShipped`, `markDelivered`, `cancelOrder` |
| vendor.service.ts | 16 methods | ❌ Dedicated `approve/reject/suspend/reactivate`, `getProducts`, `getOrders`, `setCommissionOverride` |
| settings.service.ts | 8 methods | ❌ `updateByGroup`, `testEmail`, `clearCache`, `getSystemHealth` |

### ❌ Missing Service Files (8)

| File | Purpose | Priority |
|---|---|---|
| `attribute-template.service.ts` | Attribute template CRUD | 🔴 High |
| `review.service.ts` | Review moderation, vendor responses | 🔴 High |
| `coupon.service.ts` | Coupon CRUD, validation | 🔴 High |
| `analytics.service.ts` | Dashboard stats, reports, charts | 🔴 High |
| `payout.service.ts` | Payout management | 🔴 High |
| `upload.service.ts` | Generic file/image upload | 🔴 High |
| `notification.service.ts` | Notification CRUD (inlined in store now) | 🟡 Medium |
| `shipping.service.ts` | Shipping zones, methods, rates | 🟡 Medium |

---

## 4️⃣ Composables — 9 Missing

### ✅ Existing (11) — All fully implemented
`useApi`, `useAuth`, `useConfirm`, `useCurrency`, `useDate`, `useLocale`, `useModal`, `usePagination`, `useTable`, `useTheme`, `useToast`

### ❌ Missing (9)

| Composable | Purpose | Priority |
|---|---|---|
| **useForm** | vee-validate form wrapper with dirty state, reset | 🔴 High |
| **useFileUpload** | Drag-drop upload, preview, progress | 🔴 High |
| **useDragDrop** | vue-draggable-plus wrapper | 🟡 Medium |
| **useDebounce** | Debounced ref for search (partially in `@vueuse/core`) | 🟡 Medium |
| **useExport** | CSV/Excel export utility | 🟡 Medium |
| **useBreadcrumb** | Breadcrumb composable wrapper over store | 🟡 Medium |
| **usePermission** | Permission checking per route/action | 🟡 Medium |
| **useClipboard** | Copy to clipboard (exists in helpers.ts) | 🟢 Low |
| **useBreakpoint** | Responsive breakpoint detection (exists in helpers.ts) | 🟢 Low |

---

## 5️⃣ Pages — 17 Stubs + 12 Missing

### 🟢 Fully Implemented Pages (34)

| Section | Pages | Lines |
|---|---|---|
| **Auth** (4) | Login (144), Register (170), ForgotPassword (128), ResetPassword (178) | ✅ All complete |
| **Admin** (15) | Dashboard (214), ProductList (412), ProductDetail (404), ProductForm (457), CategoryList (309), OrderList (271), OrderDetail (407), VendorList (366), VendorDetail (329), CustomerList (214), CouponList (416), PayoutList (391), ReviewList (368), Settings (354) | ✅ All have API calls, tables, forms |
| **Vendor** (12) | Dashboard (254), ProductList (311), ProductForm (449), OrderList (251), OrderDetail (361), CouponList (380), Analytics (237), Earnings (228), Inventory (297), PayoutList (318), ReviewList (298), ShopSettings (238), BankDetails (199) | ✅ All complete |
| **Shared** (1) | Profile (366) | ✅ |
| **Errors** (3) | 403 (46), 404 (46), 500 (50) | ✅ |

### 🟡 Stub Pages — "Under Construction" (12 — ✅ ALL IMPLEMENTED)

All 12 functional stub pages have been fully implemented with production-quality code:

| # | Page | Blueprint Requirement | Status |
|---|---|---|---|
| 1 | `admin/categories/CategoryForm.vue` | Name/slug/description/image/parent/status/attributes form | ✅ Complete |
| 2 | `admin/commissions/CommissionList.vue` | Default rate, category overrides, vendor overrides | ✅ Complete |
| 3 | `admin/coupons/CouponForm.vue` | Type/value/conditions/products/categories/vendors | ✅ Complete |
| 4 | `admin/customers/CustomerDetail.vue` | Customer info, order history, addresses | ✅ Complete |
| 5 | `admin/templates/TemplateList.vue` | Attribute templates list with CRUD | ✅ Complete |
| 6 | `admin/templates/TemplateForm.vue` | Template name, attributes config | ✅ Complete |
| 7 | `admin/vendors/VendorForm.vue` | Edit vendor info, commission override | ✅ Complete |
| 8 | `vendor/coupons/CouponForm.vue` | Create/edit coupon (vendor scope) | ✅ Complete |
| 9 | `vendor/products/ProductDetail.vue` | Product detail (vendor view) | ✅ Complete |
| 10 | `vendor/payouts/PayoutRequest.vue` | New payout request form | ✅ Complete |
| 11 | `vendor/status/PendingApproval.vue` | Vendor pending approval screen | ✅ Complete |
| 12 | `vendor/status/Suspended.vue` | Vendor suspended notice | ✅ Complete |

### ✅ Settings Pages — Router-Based (5 — FIXED)

**Issue Resolved:** Settings.vue was using internal `v-show` tabs, making 5 child route files dead code. Now refactored to use `<router-view>` with proper child routes:

| # | Page | Purpose | Status |
|---|---|---|---|
| 1 | `admin/settings/GeneralSettings.vue` | Site name, logo, currency, timezone, features | ✅ Complete |
| 2 | `admin/settings/PaymentSettings.vue` | COD, Stripe, SSLCommerz, bKash configuration | ✅ Complete |
| 3 | `admin/settings/ShippingSettings.vue` | Shipping zones, methods, rates, weight-based | ✅ Complete |
| 4 | `admin/settings/EmailSettings.vue` | SMTP config, notification toggles | ✅ Complete |
| 5 | `admin/settings/CommissionSettings.vue` | Commission defaults, payout schedule | ✅ Complete |

### ❌ Missing Pages (Not Yet Created — 13)

| # | Page | Purpose |
|---|---|---|
| 1 | `admin/categories/PendingCategories.vue` | Vendor category suggestions, approve/reject |
| 2 | `admin/reports/SalesReport.vue` | Sales analytics report |
| 3 | `admin/reports/VendorReport.vue` | Per-vendor performance |
| 4 | `admin/reports/ProductReport.vue` | Product performance |
| 5 | `admin/system/ActivityLog.vue` | System activity log |
| 6 | `admin/system/SystemHealth.vue` | Server health dashboard |
| 7 | `vendor/categories/BrowseCategories.vue` | Browse available categories |
| 8 | `vendor/categories/SuggestCategory.vue` | Suggest new category |
| 9 | `vendor/shipping/ShippingSettings.vue` | Vendor shipping config |
| 10 | `vendor/promotions/MyPromotions.vue` | Vendor promotions list |
| 11 | `vendor/promotions/CreatePromotion.vue` | Create promotion |
| 12 | `vendor/reports/VendorReports.vue` | Vendor self-service reports |
| 13 | `vendor/support/HelpCenter.vue` | Help center page |

---

## 6️⃣ Architecture / Config Issues

| Issue | Status |
|---|---|
| **Settings Dead Code** | ✅ **FIXED** — Settings.vue refactored to use `<router-view>` with proper child routes. All 5 settings pages now fully functional. |
| **Missing `env.d.ts`** | ⚠️ No TypeScript declaration for `import.meta.env` VITE variables |
| **No Testing Setup** | ⚠️ No `vitest.config.ts`, no test files, no `__tests__/` folders |
| **No Storybook** | ⚠️ No component documentation/playground |
| **Minimal Assets** | ⚠️ Only `vue.svg` + `tailwind.css`. Missing: logo.svg, favicon, Inter/Noto Sans Bengali fonts, placeholder images |
| **No CSS Variables** | ⚠️ Blueprint specifies `variables.css` + `transitions.css` — not present |
| **No Plugins Directory** | ⚠️ Blueprint specifies `src/plugins/` for toast/i18n/floating-vue setup — all inlined in main.ts |
| **DataTable Missing Features** | ⚠️ No built-in search bar, no skeleton loading, no responsive card view on mobile, no bulk-action events |
| **BaseBadge** | ⚠️ No auto status-mapping (must pass variant manually, not auto from status enum) |
| **Notification Store** | ⚠️ API calls inlined, no separate `notification.service.ts` |

---

## 7️⃣ Priority Roadmap

### ✅ P0 — Critical (COMPLETED)

1. ✅ **8 missing services** — attribute-template, review, coupon, analytics, payout, upload, notification, shipping
2. ✅ **ImageUploader component** — Drag-drop image upload with preview
3. ✅ **17 stub pages** — All 12 functional + 5 settings pages now fully implemented
4. ✅ **useForm composable** — Form state management with vee-validate
5. ✅ **useFileUpload composable** — File upload with progress tracking
6. ✅ **Product variant CRUD** in product.service
7. ✅ **Settings dead code fix** — Router-based architecture implemented

### 🟡 P1 — Important (Major Feature Gaps) — NEXT PRIORITY

1. **14 missing form components** (DatePicker, RichTextEditor, TagInput, ColorPicker, etc.)
2. **9 shared domain components** (VariantMatrix, OrderTimeline, CategoryTreeView)
3. **7 missing composables** (useDragDrop, useDebounce, useExport, useBreadcrumb, etc.)
4. **Missing vendor order actions** (confirm/ship/deliver/cancel in order.service)
5. **13 completely missing pages** (reports, system, vendor categories/promotions/support)

### 🟢 P2 — Enhancement

1. **11 missing UI components** (Alert, Tabs, Skeleton, Avatar, Tooltip, etc.)
2. **7 missing layout components** (SearchCommand, MobileNav, Footer)
3. **DataTable enhancements** (search bar, skeleton loading, mobile card view, bulk actions)
4. **StatusBadge auto-mapping** (auto-detect status type and apply color)
5. **Testing setup** (Vitest config, unit tests, E2E with Cypress)
6. **Assets** (fonts, images, CSS variables, logo, favicon)
7. **env.d.ts** for TypeScript environment variable declarations

---

## 📁 Implementation Checklist

### ✅ Services Created (8/8)
- [x] `src/services/attribute-template.service.ts`
- [x] `src/services/review.service.ts`
- [x] `src/services/coupon.service.ts`
- [x] `src/services/analytics.service.ts`
- [x] `src/services/payout.service.ts`
- [x] `src/services/upload.service.ts`
- [x] `src/services/notification.service.ts`
- [x] `src/services/shipping.service.ts`

### ✅ Methods Added (Existing Services) (1/5)
### Methods Still Needed (4/5)
- [ ] `category.service.ts` — toggleActive, suggestCategory, getPendingSuggestions
- [ ] `order.service.ts` — confirmOrder, markShipped, markDelivered, cancelOrder
- [ ] `vendor.service.ts` — approve, reject, suspend, reactivate, getProducts, getOrders, setCommissionOverride
- [ ] `settings.service.ts` — updateByGroup, testEmail, clearCache, getSystemHealth

### ✅ Composables Created (2/9)
- [x] `src/composables/useForm.ts`
- [x] `src/composables/useForm.ts`
### Composables Still Needed (7/9)
- [ ] `src/composables/useDragDrop.ts`
- [ ] `src/composables/useDebounce.ts`
- [ ] `src/composables/useExport.ts`
- [ ] `src/composables/useBreadcrumb.ts`
- [ ] `src/composables/usePermission.ts`
- [ ] `src/composables/useClipboard.ts`
- [ ] `src/composables/useBreakpoint.ts`

### ✅ Components Created (1/51)
- [xComponents to Create
### Components Still Needed (50/51)
- [ ] `src/components/form/FileUploader.vue`
- [ ] `src/components/form/FormRadio.vue`
- [ ] `src/components/form/DatePicker.vue`
- [ ] `src/components/form/DateRangePicker.vue`
- [ ] `src/components/form/TagInput.vue`
- [ ] `src/components/form/SearchableSelect.vue`
- [ ] `src/components/form/MultiSelect.vue`
- [ ] `src/components/form/MoneyInput.vue`
- [ ] `src/components/form/SlugInput.vue`
- [ ] `src/components/ui/AppAlert.vue`
- [ ] `src/components/ui/AppTabs.vue`
- [ ] `src/components/ui/AppSkeleton.vue`
- [ ] `src/components/ui/AppAvatar.vue`
- [ ] `src/components/ui/AppSpinner.vue`
- [ ] `src/components/ui/AppProgressBar.vue`
- [ ] `src/components/data/StatusBadge.vue`
- [ ] `src/components/data/PriceDisplay.vue`
- [ ] `src/components/data/DateDisplay.vue`
- [ ] `src/components/shared/VariantMatrix.vue`
- [ ] `src/components/shared/OrderTimeline.vue`
- [ ] `src/components/shared/CategoryTreeView.vue`

### ✅ Stub Pages Implemented (17/17)
- [x] `admin/categories/CategoryForm.vue`
- [x] `admin/commissions/CommissionList.vue`
- [x] `admin/coupons/CouponForm.vue`
- [x] `admin/customers/CustomerDetail.vue`
- [x] `admin/settings/GeneralSettings.vue`
- [x] `admin/settings/PaymentSettings.vue`
- [x] `admin/settings/ShippingSettings.vue`
- [x] `admin/settings/EmailSettings.vue`
- [x] `admin/settings/CommissionSettings.vue`
- [x] `admin/templates/TemplateList.vue`
- [x] `admin/templates/TemplateForm.vue`
- [x] `admin/vendors/VendorForm.vue`
- [x] `vendor/coupons/CouponForm.vue`
- [x] `vendor/products/ProductDetail.vue`
- [x] `vendor/payouts/PayoutRequest.vue`
- [x] `vendor/status/PendingApproval.vue`
- [x] `vendor/status/Suspended.vue`

### Missing Pages to Create (13)
### Missing Pages to Create
- [ ] `admin/categories/PendingCategories.vue`
- [ ] `admin/reports/SalesReport.vue`
- [ ] `admin/reports/VendorReport.vue`
- [ ] `admin/reports/ProductReport.vue`
- [ ] `admin/system/ActivityLog.vue`
- [ ] `admin/system/SystemHealth.vue`
- [ ] `vendor/categories/BrowseCategories.vue`
- [ ] `vendor/categories/SuggestCategory.vue`
- [ ] `vendor/shipping/ShippingSettings.vue`
**Summary:** 

✅ **Phase 1 Complete (P0 Critical)**
- 8 services created
- Product variant CRUD implemented
- ImageUploader component created
- useForm + useFileUpload composables implemented
- 17 stub pages fully implemented (12 functional + 5 settings)
- Settings architecture fixed (dead code eliminated)

📊 **Updated Progress:**
- **Services:** 15/15 files (100%) — All 8 new files created ✅
- **Components:** 22/72 (31%) — ImageUploader added, 50 still needed
- **Composables:** 13/20 (65%) — useForm + useFileUpload added
- **Pages:** 68 functional pages (51 complete + 17 fully implemented) — 13 still missing
- **TypeScript:** 0 errors ✅

**Next Phase:** P1 Important — Focus on form components (DatePicker, RichTextEditor, TagInput), shared domain components (VariantMatrix, OrderTimeline), and missing pages (reports, vendor features).
- [ ] `vendor/promotions/CreatePromotion.vue`
- [ ] `vendor/reports/VendorReports.vue`
- [ ] `vendor/support/HelpCenter.vue`

---

**Summary:** The foundation is solid — types (100%), utils (100%), stores (90%), composables (55%), and core UI components are all production-quality code. The main gaps are in **form/data/shared components (51 missing)**, **service files (8 missing)**, and **page implementations (17 stubs + 12 missing)**. The project needs approximately **80–90 new files** to match the blueprint.
