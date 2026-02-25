# MVE Dashboard — Blueprint vs Project Gap Analysis v2

> **Generated:** February 24, 2026  
> **Previous Analysis:** GAP-ANALYSIS.md (v1) — Now outdated  
> **Stack:** Vue 3.5 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4

---

## 🔢 Executive Summary (UPDATED)

| Layer | Blueprint | Exists | Missing | Coverage |
|---|---|---|---|---|
| **Dependencies** | 21 | 17 | **4** | 81% |
| **Components** | 72 | 46 | **26** | **64%** ↑ |
| **Services** | 15 files | 15 files | **0 files** | ✅ 100% |
| **Service Methods** | All | All | **0** | ✅ 100% |
| **Composables** | 20 | 13 | **7** | 65% |
| **Stores** | 4 | 4 | **0** | ✅ 100% |
| **Types** | 14 | 14 | **0** | ✅ 100% |
| **Utils** | 5 | 5 (4+1 bonus) | **1 missing** | 90% |
| **Pages** | 68+ | 52 | **~16** | ~76% |
| **Routes** | All | Most | **~13 missing** | ~81% |
| **i18n** | 2 locales | 2 locales | — | ✅ 100% |
| **Layouts** | 3 | 3 | **0** | ✅ 100% |
| **Config** | Full | Partial | **env.d.ts, vitest** | ⚠️ |
| **Assets** | Full | Minimal | **Fonts, images** | ⚠️ |

**Overall Project Completion: ~65% ↑ (was ~40-45%)**

### What Improved Since v1
- ✅ All 8 missing services created (attribute-template, review, coupon, analytics, payout, upload, notification, shipping)
- ✅ All service method gaps filled (category +6, order +8, vendor +13, settings +14)
- ✅ All 14 missing form components created (DatePicker, RichTextEditor, TagInput, etc.)
- ✅ All 9 domain components created (VariantMatrix, OrderTimeline, CategoryTreeView, etc.)
- ✅ All 17 stub pages fully implemented (12 functional + 5 settings)
- ✅ Settings architecture fixed (dead code → router-based)
- ✅ Product variant CRUD in product.service
- ✅ useForm + useFileUpload composables

---

## 1️⃣ Missing Dependencies (4 packages)

| Package | Purpose | Priority | Notes |
|---|---|---|---|
| `vue-draggable-plus` | Drag & drop reorder (images, categories, options) | 🔴 High | Needed for ImageUploader reorder, CategoryTree drag, TemplateForm option reorder |
| `@tiptap/vue-3` + `@tiptap/starter-kit` + `@tiptap/extension-*` | Rich Text Editor | 🟡 Medium | RichTextEditor.vue exists but uses a **fallback textarea** — no actual Tiptap rendering |
| `vitest` + `@vue/test-utils` | Unit/component testing | 🟡 Medium | No test infrastructure at all |
| `msw` (Mock Service Worker) | API mocking for development | 🟢 Low | Nice-to-have for dev without backend |

### ⚠️ Dependency Quality Issues
- **RichTextEditor.vue** — File exists (194 lines) but since `@tiptap/vue-3` is NOT installed, it likely uses a degraded textarea fallback, not actual rich text editing
- **ImageUploader.vue** — Drag reorder requires `vue-draggable-plus` which is NOT installed. Drag-to-reorder feature is non-functional

---

## 2️⃣ Components — 26 Still Missing (36%)

### ✅ Existing Components (46 files)

| Category | Count | Files |
|---|---|---|
| **UI** (8) | 8 | BaseButton, BaseBadge, BaseCard, BaseModal, ConfirmDialog, EmptyState, PageLoader, StatCard |
| **Form** (20) | 20 | FormInput, FormSelect, FormCheckbox, FormSwitch, FormTextarea, FormField, FormGroup, FormRadio, ImageUploader, FileUploader, RichTextEditor, DatePicker, DateRangePicker, ColorPicker, TagInput, SearchableSelect, MultiSelect, MoneyInput, PhoneInput, SlugInput |
| **Data** (1) | 1 | DataTable |
| **Charts** (3) | 3 | LineChart, BarChart, DoughnutChart |
| **Layout** (4) | 4 | AppSidebar, AppHeader, AppBreadcrumb, LanguageSwitcher |
| **Domain** (9) | 9 | VariantMatrix, OrderTimeline, CategoryTreeView, ProductQuickView, VendorCard, CustomerCard, OrderSummary, ReviewCard, StatsWidget |
| **Other** (1) | 1 | HelloWorld.vue (Vite default — should be deleted) |

### ❌ Missing UI Components (11)

| # | Component | Blueprint Location | Purpose | Priority |
|---|---|---|---|---|
| 1 | **AppAlert** | `components/ui/` | Alert/notification banners (info, warning, error, success) | 🔴 High |
| 2 | **AppTooltip** | `components/ui/` | Tooltip wrapper (floating-vue is installed but no component) | 🟡 Medium |
| 3 | **AppDropdown** | `components/ui/` | General dropdown menu component | 🟡 Medium |
| 4 | **AppTabs** | `components/ui/` | Reusable tab navigation (used heavily in detail pages) | 🔴 High |
| 5 | **AppAccordion** | `components/ui/` | Collapsible sections | 🟡 Medium |
| 6 | **AppAvatar** | `components/ui/` | User/vendor avatar with fallback initials | 🟡 Medium |
| 7 | **AppSpinner** | `components/ui/` | Standalone loading spinner | 🟢 Low |
| 8 | **AppSkeleton** | `components/ui/` | Skeleton loading placeholders | 🟡 Medium |
| 9 | **AppProgressBar** | `components/ui/` | Progress indicator | 🟢 Low |
| 10 | **AppPagination** | `components/ui/` | Standalone pagination (currently only inside DataTable) | 🟡 Medium |

> **Note:** AppRadio was listed as missing in v1 but FormRadio.vue now exists ✅

### ❌ Missing Data Components (6)

| # | Component | Purpose | Priority |
|---|---|---|---|
| 1 | **DataGrid** | Card-based grid view (alternative to DataTable for mobile) | 🟡 Medium |
| 2 | **StatusBadge** | Auto-maps status enums → badge variant+color (vs BaseBadge which is manual) | 🔴 High |
| 3 | **PriceDisplay** | Formatted ৳ price with sale price crossout | 🟡 Medium |
| 4 | **DateDisplay** | Formatted date with relative time tooltip | 🟡 Medium |
| 5 | **UserAvatar** | User avatar with name, status, fallback | 🟡 Medium |
| 6 | **ImageGallery** | Product image gallery with zoom/lightbox | 🟡 Medium |

> **Note:** StatsCard listed as missing in v1 is effectively covered by StatsWidget in domain ✅

### ❌ Missing Chart Components (3)

| # | Component | Purpose | Priority |
|---|---|---|---|
| 1 | **PieChart** | Pie chart (for category breakdown, etc.) | 🟡 Medium |
| 2 | **AreaChart** | Area chart (for revenue over time) | 🟡 Medium |
| 3 | **SparklineChart** | Inline mini chart for stats cards | 🟢 Low |

### ❌ Missing Layout Components (6)

| # | Component | Purpose | Priority |
|---|---|---|---|
| 1 | **AppFooter** | Dashboard footer | 🟢 Low |
| 2 | **NotificationDropdown** | Bell icon dropdown (extracted from AppHeader) | 🟡 Medium |
| 3 | **UserMenu** | Profile dropdown (extracted from AppHeader) | 🟡 Medium |
| 4 | **SearchCommand** | ⌘K command palette for quick navigation | 🟡 Medium |
| 5 | **MobileNav** | Bottom navigation bar for mobile | 🔴 High |
| 6 | **SidebarItem/SidebarGroup** | Extracted nav components | 🟢 Low |

### ❌ Missing Shared/Domain Components (missing from blueprint `components/shared/`)

| # | Component | Purpose | Priority |
|---|---|---|---|
| 1 | **ProductStatusFlow** | Visual pipeline showing product status progression | 🟡 Medium |
| 2 | **CategoryBreadcrumb** | Category path display (e.g., Electronics > Phones > Smartphones) | 🟡 Medium |
| 3 | **AttributeValueInput** | Dynamic input based on data_type (text/number/select/boolean) | 🔴 High |
| 4 | **ActivityFeed** | Recent activity stream (for dashboards) | 🟡 Medium |
| 5 | **ApprovalWorkflow** | Generic approve/reject UI component | 🟡 Medium |
| 6 | **ExportButton** | CSV/PDF export button with format selection | 🟡 Medium |

> **Note:** Domain components exist at `components/domain/` instead of blueprint's `components/shared/` — this is fine, just different directory naming

---

## 3️⃣ Services — ✅ COMPLETE

All 15 service files exist with all methods:

| Service | File | Status |
|---|---|---|
| api.ts | Base Axios + interceptors | ✅ |
| auth.service.ts | 11 methods | ✅ |
| product.service.ts | 25+ methods (inc. variant CRUD) | ✅ |
| category.service.ts | 14 methods (inc. suggestions) | ✅ |
| order.service.ts | 20 methods (inc. confirm/ship/deliver/cancel) | ✅ |
| vendor.service.ts | 29 methods (inc. approve/reject/suspend) | ✅ |
| settings.service.ts | 22 methods (inc. email, cache, backup) | ✅ |
| attribute-template.service.ts | Full CRUD + options | ✅ |
| review.service.ts | Full CRUD + moderation | ✅ |
| coupon.service.ts | Full CRUD | ✅ |
| analytics.service.ts | Dashboard stats | ✅ |
| payout.service.ts | Full CRUD | ✅ |
| upload.service.ts | File/image upload | ✅ |
| notification.service.ts | Full CRUD | ✅ |
| shipping.service.ts | Shipping management | ✅ |

---

## 4️⃣ Composables — 7 Still Missing (35%)

### ✅ Existing (13)

`useApi`, `useAuth`, `useConfirm`, `useCurrency`, `useDate`, `useFileUpload`, `useForm`, `useLocale`, `useModal`, `usePagination`, `useTable`, `useTheme`, `useToast`

### ❌ Missing (7)

| # | Composable | Purpose | Priority | Notes |
|---|---|---|---|---|
| 1 | **useDragDrop** | vue-draggable-plus wrapper | 🟡 Medium | Blocked until vue-draggable-plus installed |
| 2 | **useDebounce** | Debounced ref for search inputs | 🟡 Medium | Can use @vueuse/core's `useDebounceFn` instead |
| 3 | **useExport** | CSV/PDF export utility | 🟡 Medium | For report pages |
| 4 | **useBreadcrumb** | Breadcrumb management composable | 🟡 Medium | breadcrumb.store.ts exists, needs composable wrapper |
| 5 | **usePermission** | Role/permission checking helper | 🟡 Medium | Guards exist, but no composable for template usage |
| 6 | **useClipboard** | Copy to clipboard | 🟢 Low | Can use @vueuse/core's `useClipboard` |
| 7 | **useBreakpoint** | Responsive breakpoint detection | 🟢 Low | Can use @vueuse/core's `useBreakpoints` |

---

## 5️⃣ Pages — ~16 Still Missing (24%)

### ✅ Existing Pages Summary: 52 files

| Section | Count | Status |
|---|---|---|
| **Auth** | 4 | ✅ All complete (Login, Register, ForgotPassword, ResetPassword) |
| **Admin** | 26 | ✅ Dashboard, Products (3), Categories (2), Templates (2), Vendors (3), Orders (2), Customers (2), Reviews (1), Coupons (2), Commissions (1), Payouts (1), Settings (6) |
| **Vendor** | 16 | ✅ Dashboard, Products (3), Orders (2), Inventory, Analytics, Earnings, Payouts (2), Reviews, Coupons (2), ShopSettings, BankDetails |
| **Vendor Status** | 2 | ✅ PendingApproval, Suspended |
| **Shared** | 1 | ✅ Profile |
| **Errors** | 3 | ✅ 403, 404, 500 |

### ❌ Missing Pages (16 — NO file exists)

#### Admin Missing (6):

| # | Page | Blueprint Path | Route Name | Purpose |
|---|---|---|---|---|
| 1 | **PendingCategories** | `admin/categories/PendingCategories.vue` | `admin.categories.pending` | Vendor category suggestions list, approve/reject |
| 2 | **SalesReport** | `admin/reports/SalesReport.vue` | `admin.reports.sales` | Revenue over time, top products, category breakdown |
| 3 | **VendorReport** | `admin/reports/VendorReport.vue` | `admin.reports.vendors` | Per-vendor performance metrics |
| 4 | **ProductReport** | `admin/reports/ProductReport.vue` | `admin.reports.products` | Product performance, low stock, top rated |
| 5 | **ActivityLog** | `admin/system/ActivityLog.vue` | `admin.activity` | System activity log viewer |
| 6 | **SystemHealth** | `admin/system/SystemHealth.vue` | `admin.health` | Server health dashboard |

#### Vendor Missing (10):

| # | Page | Blueprint Path | Route Name | Purpose |
|---|---|---|---|---|
| 7 | **BrowseCategories** | `vendor/categories/BrowseCategories.vue` | `vendor.categories` | Browse active categories, view templates |
| 8 | **SuggestCategory** | `vendor/categories/SuggestCategory.vue` | `vendor.category.suggest` | Suggest new category form |
| 9 | **ShippingSettings** | `vendor/shipping/ShippingSettings.vue` | `vendor.shipping` | Vendor shipping zones/methods config |
| 10 | **MyPromotions** | `vendor/promotions/MyPromotions.vue` | `vendor.promotions` | Vendor promotions list |
| 11 | **CreatePromotion** | `vendor/promotions/CreatePromotion.vue` | `vendor.promotion.create` | Create promotion form |
| 12 | **VendorReports** | `vendor/reports/VendorReports.vue` | `vendor.reports` | Vendor self-service reports |
| 13 | **HelpCenter** | `vendor/support/HelpCenter.vue` | `vendor.support` | Help articles, support tickets, contact |

> **Note:** Blueprint also mentions `StoreSettings.vue` at `/vendor/settings` — the project has `ShopSettings.vue` + `BankDetails.vue` instead (functionally equivalent, split into 2 pages) ✅

### ❌ Missing Routes (not registered in router files)

These routes are in the blueprint but **NOT in `admin.routes.ts` or `vendor.routes.ts`**:

| Route | File | Status |
|---|---|---|
| `/admin/categories/pending` | admin.routes.ts | ❌ Missing |
| `/admin/reports/sales` | admin.routes.ts | ❌ Missing |
| `/admin/reports/vendors` | admin.routes.ts | ❌ Missing |
| `/admin/reports/products` | admin.routes.ts | ❌ Missing |
| `/admin/system/activity` | admin.routes.ts | ❌ Missing |
| `/admin/system/health` | admin.routes.ts | ❌ Missing |
| `/vendor/categories` | vendor.routes.ts | ❌ Missing |
| `/vendor/categories/suggest` | vendor.routes.ts | ❌ Missing |
| `/vendor/shipping` | vendor.routes.ts | ❌ Missing |
| `/vendor/promotions` | vendor.routes.ts | ❌ Missing |
| `/vendor/promotions/create` | vendor.routes.ts | ❌ Missing |
| `/vendor/reports` | vendor.routes.ts | ❌ Missing |
| `/vendor/support` | vendor.routes.ts | ❌ Missing |

### ⚠️ Route Naming Discrepancies

| Blueprint Name | Current Name | Issue |
|---|---|---|
| `admin.dashboard` | `admin-dashboard` | Different convention (dots vs dashes) |
| `admin.products` | `admin-products` | Same pattern throughout |
| Blueprint uses `/products/:slug` | Project uses `/products/:id` | **Slug vs ID mismatch** |

> The project uses `id`-based params everywhere while the blueprint specifies `slug`-based for products and categories. This will need to match the backend API.

---

## 6️⃣ Types — ✅ COMPLETE (but 1 missing)

### ✅ All 14 type files exist:
`common.ts`, `auth.ts`, `product.ts`, `category.ts`, `attribute-template.ts`, `order.ts`, `vendor.ts`, `customer.ts`, `review.ts`, `coupon.ts`, `setting.ts`, `commission.ts`, `analytics.ts`, `notification.ts`

### ❌ Missing Type File:

| File | Purpose | Priority |
|---|---|---|
| **shipping.ts** | ShippingZone, ShippingMethod, Shipment types | 🟡 Medium |

> `shipping.service.ts` exists but no `types/shipping.ts` — the service likely uses inline types or imports from elsewhere

---

## 7️⃣ Utils — 90% Complete

### ✅ Existing (5 files):
`constants.ts`, `format.ts`, `helpers.ts`, `storage.ts`, `caseTransform.ts` (bonus)

### ❌ Missing:

| File | Purpose | Priority |
|---|---|---|
| **validation.ts** | Zod schemas for forms (login, product, category, etc.) | 🔴 High |

> Blueprint specifies `utils/validation.ts` with Zod schemas. This is critical for form validation. Currently, each page/form may define schemas inline or not use them at all.

---

## 8️⃣ Architecture & Config Issues

### 🔴 Critical Issues

| # | Issue | Impact | Details |
|---|---|---|---|
| 1 | **No `env.d.ts`** | TS warnings on `import.meta.env` | No TypeScript declarations for VITE_ environment variables |
| 2 | **No `validation.ts`** | Forms lack centralized validation | Each page does its own validation; no shared Zod schemas |
| 3 | **No `types/shipping.ts`** | shipping.service.ts types missing | Service exists but dedicated type file doesn't |
| 4 | **Route param mismatch (`:id` vs `:slug`)** | May break when connected to real API | Blueprint uses `:slug` for products/categories; code uses `:id` |
| 5 | **Route name convention** | Minor inconsistency | Blueprint uses `admin.products` (dots); project uses `admin-products` (dashes) |

### 🟡 Medium Issues

| # | Issue | Impact | Details |
|---|---|---|---|
| 6 | **No testing setup** | 0% test coverage | No vitest.config.ts, no __tests__ folders, no test files at all |
| 7 | **No Storybook** | No component docs/playground | Blueprint mentions it; nothing set up |
| 8 | **HelloWorld.vue** still exists | Dead code | Vite default component — should be deleted |
| 9 | **RichTextEditor degraded** | Textarea fallback only | @tiptap/vue-3 not installed — likely renders a plain textarea |
| 10 | **ImageUploader drag broken** | Drag-to-reorder non-functional | vue-draggable-plus not installed |
| 11 | **Minimal assets** | No brand identity | Only `vue.svg` in assets, `vite.svg` in public. No logo.svg, no favicon, no Inter/Noto Sans Bengali font files |
| 12 | **Missing `variables.css` + `transitions.css`** | ⚠️ ACTUALLY FINE | These are now baked into `tailwind.css` — the CSS variables and transitions ARE defined there. Blueprint's separate files were consolidated. **Not a real gap.** |
| 13 | **Sidebar navigation incomplete** | Missing nav items for new routes | AppSidebar doesn't have nav items for Reports, System, Vendor Categories, Shipping, Promotions, Support |

### 🟢 Low Priority Issues

| # | Issue | Details |
|---|---|---|
| 14 | **No plugins directory** | All plugin setup inlined in main.ts (fine for now) |
| 15 | **DataTable missing features** | No built-in search bar, no skeleton loading rows, no mobile card view |
| 16 | **BaseBadge no auto-mapping** | Must pass variant manually, doesn't auto-detect from status enum |
| 17 | **No v-permission directive** | Blueprint shows `v-permission`, `v-role` directives — not implemented |
| 18 | **No ⌘K shortcut** | SearchCommand component not built |
| 19 | **No WebSocket/Pusher integration** | VITE_PUSHER_KEY exists in .env but no actual real-time code |

---

## 9️⃣ Sidebar Navigation Gaps

The current AppSidebar has navigation items, but these routes/sections are **missing from the sidebar menus**:

### Admin Sidebar Missing:
- 📁 Categories > **Pending Approval** (`/admin/categories/pending`)
- 📊 **Reports** group (`/admin/reports/sales`, `/vendors`, `/products`)
- 🔧 **System** group (`/admin/system/activity`, `/admin/system/health`)

### Vendor Sidebar Missing:
- 📁 **Categories** group (`/vendor/categories`, `/vendor/categories/suggest`)
- 🚚 **Shipping** (`/vendor/shipping`)
- 🎫 **Promotions** group (`/vendor/promotions`, `/vendor/promotions/create`)
- 📊 **Reports** (`/vendor/reports`)
- ❓ **Help & Support** (`/vendor/support`)

---

## 🔟 Priority Roadmap v2

### ✅ COMPLETED (P0 + P1 Partial)

| Item | Status |
|---|---|
| 8 missing service files | ✅ |
| All service method gaps (41 methods) | ✅ |
| 14 form components | ✅ |
| 9 domain components | ✅ |
| useForm + useFileUpload composables | ✅ |
| ImageUploader component | ✅ |
| 17 stub pages implemented | ✅ |
| Settings architecture fix | ✅ |
| Product variant CRUD | ✅ |

### 🔴 P1 — High Priority (Next)

| # | Task | Files | Effort |
|---|---|---|---|
| 1 | **Missing UI components** (11) | AppAlert, AppTabs, AppSkeleton, AppAvatar, AppDropdown, AppTooltip, AppAccordion, AppSpinner, AppProgressBar, AppPagination | ~2-3 hours |
| 2 | **Missing data components** (6) | StatusBadge, PriceDisplay, DateDisplay, UserAvatar, ImageGallery, DataGrid | ~2 hours |
| 3 | **Missing shared/domain components** (6) | AttributeValueInput, ProductStatusFlow, CategoryBreadcrumb, ActivityFeed, ApprovalWorkflow, ExportButton | ~3 hours |
| 4 | **env.d.ts** | 1 file | ~5 min |
| 5 | **validation.ts** (Zod schemas) | 1 file | ~1 hour |
| 6 | **types/shipping.ts** | 1 file | ~15 min |
| 7 | **Delete HelloWorld.vue** | Remove 1 file | ~1 min |

### 🟡 P2 — Medium Priority

| # | Task | Files | Effort |
|---|---|---|---|
| 8 | **7 missing composables** | useDragDrop, useDebounce, useExport, useBreadcrumb, usePermission, useClipboard, useBreakpoint | ~2 hours |
| 9 | **3 missing chart components** | PieChart, AreaChart, SparklineChart | ~1 hour |
| 10 | **6 missing layout components** | AppFooter, NotificationDropdown, UserMenu, SearchCommand, MobileNav | ~3 hours |
| 11 | **6 missing admin pages** | PendingCategories, SalesReport, VendorReport, ProductReport, ActivityLog, SystemHealth | ~6 hours |
| 12 | **10 missing vendor pages** | BrowseCategories, SuggestCategory, ShippingSettings, MyPromotions, CreatePromotion, VendorReports, HelpCenter | ~7 hours |
| 13 | **13 missing routes** | Register all missing routes in admin.routes.ts + vendor.routes.ts | ~30 min |
| 14 | **Sidebar nav items** | Add missing nav links for reports, system, categories, shipping, etc. | ~30 min |
| 15 | **Install vue-draggable-plus** | npm install + integrate | ~30 min |

### 🟢 P3 — Enhancement

| # | Task | Effort |
|---|---|---|
| 16 | Install @tiptap/vue-3 + fix RichTextEditor | ~1 hour |
| 17 | Testing setup (vitest + vue/test-utils) | ~2 hours |
| 18 | v-permission / v-role directives | ~30 min |
| 19 | WebSocket/Pusher integration | ~2 hours |
| 20 | Font files (Inter, Noto Sans Bengali) | ~15 min |
| 21 | Logo, favicon, placeholder images | ~15 min |
| 22 | Storybook setup | ~2 hours |
| 23 | Route param `:id` → `:slug` migration | ~1 hour |
| 24 | Route name convention standardization | ~30 min |

---

## 📊 Progress Visualization

```
Services         ████████████████████ 100% (15/15 files, all methods)
Types            ████████████████████ 100% (14/14)
Stores           ████████████████████ 100% (4/4)
Layouts          ████████████████████ 100% (3/3)
i18n             ████████████████████ 100% (2/2 locales)
Utils            ██████████████████░░  90% (5/5 files, validation.ts missing)
Pages            ███████████████░░░░░  76% (52/68)
Composables      █████████████░░░░░░░  65% (13/20)
Components       ████████████░░░░░░░░  64% (46/72)
Config/Assets    ██████░░░░░░░░░░░░░░  30% (no env.d.ts, no tests, minimal assets)
```

---

## 📁 Complete File-by-File Checklist

### Components To Create (26):

**UI (11):**
- [ ] `src/components/ui/AppAlert.vue`
- [ ] `src/components/ui/AppTooltip.vue`
- [ ] `src/components/ui/AppDropdown.vue`
- [ ] `src/components/ui/AppTabs.vue`
- [ ] `src/components/ui/AppAccordion.vue`
- [ ] `src/components/ui/AppAvatar.vue`
- [ ] `src/components/ui/AppSpinner.vue`
- [ ] `src/components/ui/AppSkeleton.vue`
- [ ] `src/components/ui/AppProgressBar.vue`
- [ ] `src/components/ui/AppPagination.vue`

**Data (6):**
- [ ] `src/components/data/StatusBadge.vue`
- [ ] `src/components/data/PriceDisplay.vue`
- [ ] `src/components/data/DateDisplay.vue`
- [ ] `src/components/data/UserAvatar.vue`
- [ ] `src/components/data/ImageGallery.vue`
- [ ] `src/components/data/DataGrid.vue`

**Charts (3):**
- [ ] `src/components/charts/PieChart.vue`
- [ ] `src/components/charts/AreaChart.vue`
- [ ] `src/components/charts/SparklineChart.vue`

**Layout (6):**
- [ ] `src/components/layout/AppFooter.vue`
- [ ] `src/components/layout/NotificationDropdown.vue`
- [ ] `src/components/layout/UserMenu.vue`
- [ ] `src/components/layout/SearchCommand.vue`
- [ ] `src/components/layout/MobileNav.vue`
- [ ] `src/components/layout/SidebarGroup.vue`

### Domain/Shared Components To Create (6):
- [ ] `src/components/domain/ProductStatusFlow.vue`
- [ ] `src/components/domain/CategoryBreadcrumb.vue`
- [ ] `src/components/domain/AttributeValueInput.vue`
- [ ] `src/components/domain/ActivityFeed.vue`
- [ ] `src/components/domain/ApprovalWorkflow.vue`
- [ ] `src/components/domain/ExportButton.vue`

### Composables To Create (7):
- [ ] `src/composables/useDragDrop.ts`
- [ ] `src/composables/useDebounce.ts`
- [ ] `src/composables/useExport.ts`
- [ ] `src/composables/useBreadcrumb.ts`
- [ ] `src/composables/usePermission.ts`
- [ ] `src/composables/useClipboard.ts`
- [ ] `src/composables/useBreakpoint.ts`

### Pages To Create (16):
- [ ] `src/pages/admin/categories/PendingCategories.vue`
- [ ] `src/pages/admin/reports/SalesReport.vue`
- [ ] `src/pages/admin/reports/VendorReport.vue`
- [ ] `src/pages/admin/reports/ProductReport.vue`
- [ ] `src/pages/admin/system/ActivityLog.vue`
- [ ] `src/pages/admin/system/SystemHealth.vue`
- [ ] `src/pages/vendor/categories/BrowseCategories.vue`
- [ ] `src/pages/vendor/categories/SuggestCategory.vue`
- [ ] `src/pages/vendor/shipping/ShippingSettings.vue`
- [ ] `src/pages/vendor/promotions/MyPromotions.vue`
- [ ] `src/pages/vendor/promotions/CreatePromotion.vue`
- [ ] `src/pages/vendor/reports/VendorReports.vue`
- [ ] `src/pages/vendor/support/HelpCenter.vue`

### Config/Infra To Create:
- [ ] `src/env.d.ts` — Vite env type declarations
- [ ] `src/utils/validation.ts` — Centralized Zod schemas
- [ ] `src/types/shipping.ts` — Shipping types
- [ ] Delete `src/components/HelloWorld.vue`

### Routes To Add:
- [ ] 6 admin routes (admin.routes.ts)
- [ ] 7 vendor routes (vendor.routes.ts)

### Sidebar Navigation To Update:
- [ ] Admin sidebar: Add Reports group, System group, Pending Categories link
- [ ] Vendor sidebar: Add Categories group, Shipping, Promotions, Reports, Support

---

## 📈 Estimated Effort to 100%

| Task Group | Files | Estimated Hours |
|---|---|---|
| UI + Data + Chart components (20) | 20 | ~6 hours |
| Layout components (6) | 6 | ~3 hours |
| Domain/shared components (6) | 6 | ~3 hours |
| Composables (7) | 7 | ~2 hours |
| Admin pages (6) | 6 | ~6 hours |
| Vendor pages (10) | 10 | ~7 hours |
| Config/types/utils (4) | 4 | ~2 hours |
| Routes + sidebar updates | 2 | ~1 hour |
| Dependencies + integration | — | ~2 hours |
| **Total** | **~61 files** | **~32 hours** |

---

> **Document Version:** 2.0  
> **Status:** Gap Analysis — Updated with all completed work  
> **TypeScript Status:** ✅ 0 errors (verified)  
> **Dev Server:** ✅ Running on port 3000
