# MVE Storefront — Software Requirements Specification (SRS)

> **Project:** MVE Multi-Vendor E-commerce — Customer Storefront
> **Version:** 1.0
> **Date:** March 5, 2026
> **Prepared by:** MVE Development Team
> **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Design System — Colors, Fonts, Spacing](#3-design-system--colors-fonts-spacing)
4. [Page Specifications](#4-page-specifications)
5. [Component Library](#5-component-library)
6. [API Integration Map](#6-api-integration-map)
7. [State Management](#7-state-management)
8. [SEO Requirements](#8-seo-requirements)
9. [Performance Requirements](#9-performance-requirements)
10. [Responsive Breakpoints](#10-responsive-breakpoints)
11. [Accessibility Requirements](#11-accessibility-requirements)
12. [Error Handling](#12-error-handling)
13. [Internationalization](#13-internationalization)
14. [Non-Functional Requirements](#14-non-functional-requirements)

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional and non-functional requirements for the MVE Customer Storefront — the public-facing Next.js 14 application where end customers browse products, place orders, and manage their accounts in a multi-vendor marketplace.

### 1.2 Scope
The storefront consumes the existing Laravel backend API (`/api/v1/`) that already serves the Admin and Vendor dashboards. No backend changes are required unless specified. The storefront is a separate Next.js project communicating with the same backend.

### 1.3 Target Users
- **Primary:** Bangladeshi online shoppers (mobile-first, 4G connection)
- **Secondary:** Desktop shoppers
- **Tertiary:** International buyers (future)

### 1.4 Assumptions
- Backend API at `/api/v1/` is production-ready and stable
- Payment gateways (Stripe, PayPal, SSLCommerz, COD) are active
- CDN configured for product images
- Bengali (বাংলা) is secondary language, English is primary

---

## 2. System Overview

### 2.1 Architecture

```
┌─────────────────────────────────────────────────┐
│            Vercel / Node.js Server              │
│  ┌─────────────────────────────────────────┐    │
│  │         Next.js 14 (App Router)         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌───────┐ │    │
│  │  │  Server   │  │  Client  │  │  API  │ │    │
│  │  │Components │  │Components│  │Routes │ │    │
│  │  └──────────┘  └──────────┘  └───────┘ │    │
│  └─────────────────────────────────────────┘    │
│              │                    │              │
│      ┌───────▼───────┐   ┌──────▼──────┐       │
│      │  React Query  │   │   Zustand   │       │
│      │  (API Cache)  │   │  (UI State) │       │
│      └───────────────┘   └─────────────┘       │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS
        ┌─────────▼─────────┐
        │  Laravel Backend  │
        │   /api/v1/        │
        │  (Sanctum Auth)   │
        └───────────────────┘
```

### 2.2 Integration Points
| System | Integration | Protocol |
|--------|------------|----------|
| Laravel Backend | REST API | HTTPS + Sanctum token |
| Stripe | Payment Elements SDK | Client-side JS |
| PayPal | PayPal JS SDK | Client-side JS |
| SSLCommerz | Redirect flow | Server-side redirect |
| CDN (images) | Static assets | HTTPS |

---

## 3. Design System — Colors, Fonts, Spacing

### 3.1 Color Palette

#### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#EEF2FF` | Background tints, hover states |
| `primary-100` | `#E0E7FF` | Light backgrounds |
| `primary-200` | `#C7D2FE` | Borders, dividers |
| `primary-300` | `#A5B4FC` | Inactive elements |
| `primary-400` | `#818CF8` | Secondary buttons |
| `primary-500` | `#6366F1` | **Primary brand color** — buttons, links, accents |
| `primary-600` | `#4F46E5` | **Primary hover** — CTA buttons |
| `primary-700` | `#4338CA` | Active/pressed states |
| `primary-800` | `#3730A3` | Header backgrounds |
| `primary-900` | `#312E81` | Dark accents |
| `primary-950` | `#1E1B4B` | Darkest backgrounds |

#### Neutral / Gray
| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#F9FAFB` | Page backgrounds |
| `gray-100` | `#F3F4F6` | Card backgrounds, alternating rows |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-300` | `#D1D5DB` | Disabled state borders |
| `gray-400` | `#9CA3AF` | Placeholder text |
| `gray-500` | `#6B7280` | Secondary text, captions |
| `gray-600` | `#4B5563` | Body text (secondary) |
| `gray-700` | `#374151` | Body text (primary) |
| `gray-800` | `#1F2937` | Headings |
| `gray-900` | `#111827` | Headings (strong), dark mode bg |
| `gray-950` | `#030712` | True dark |

#### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success-500` | `#22C55E` | In stock, success alerts, verified badges |
| `success-50` | `#F0FDF4` | Success backgrounds |
| `warning-500` | `#F59E0B` | Low stock, pending status, star ratings ⭐ |
| `warning-50` | `#FFFBEB` | Warning backgrounds |
| `danger-500` | `#EF4444` | Out of stock, errors, sale prices, delete |
| `danger-50` | `#FEF2F2` | Error backgrounds |
| `info-500` | `#3B82F6` | Informational alerts, links |
| `info-50` | `#EFF6FF` | Info backgrounds |

#### Commerce-Specific Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `sale` | `#EF4444` | Sale price, discount badge |
| `original-price` | `#9CA3AF` | Strikethrough original price |
| `flash-sale` | `#F97316` | Flash sale countdown, urgency |
| `rating-star` | `#FBBF24` | Star ratings |
| `verified-badge` | `#22C55E` | Verified vendor badge |
| `cod-badge` | `#8B5CF6` | Cash on delivery indicator |

#### Dark Mode Colors

> **Scope:** Dark mode is a P1 feature (Sprint 4–5). Color tokens are defined below for reference. Implementation requires: (1) `next-themes` provider in root layout, (2) all Tailwind classes to use `dark:` variant, (3) dark mode toggle in header/account settings, (4) persisted preference via localStorage. A dedicated dark mode testing pass is included in the Pre-Launch Checklist.

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FFFFFF` | `#0F172A` (slate-900) |
| Surface | `#F9FAFB` | `#1E293B` (slate-800) |
| Card | `#FFFFFF` | `#1E293B` |
| Text Primary | `#111827` | `#F1F5F9` |
| Text Secondary | `#6B7280` | `#94A3B8` |
| Border | `#E5E7EB` | `#334155` |

### 3.2 Typography

#### Font Family
```css
/* Primary — Headings + Body */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Bengali Text */
--font-bengali: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;

/* Monospace — Prices, Order Numbers, Codes */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### Font Loading Strategy
```
Inter:      Google Fonts — preload woff2, display: swap
Noto Sans Bengali: Google Fonts — async load, display: swap
JetBrains Mono: Google Fonts — async load, display: swap
```

#### Type Scale
| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display-xl` | 48px / 3rem | 800 (ExtraBold) | 1.1 | Hero headlines |
| `display-lg` | 36px / 2.25rem | 700 (Bold) | 1.2 | Page titles |
| `heading-xl` | 30px / 1.875rem | 700 | 1.25 | Section headers |
| `heading-lg` | 24px / 1.5rem | 600 (Semibold) | 1.3 | Card titles, modal headers |
| `heading-md` | 20px / 1.25rem | 600 | 1.35 | Subsection headers |
| `heading-sm` | 18px / 1.125rem | 600 | 1.4 | Widget titles |
| `body-lg` | 18px / 1.125rem | 400 (Regular) | 1.6 | Lead paragraphs |
| `body-md` | 16px / 1rem | 400 | 1.6 | Default body text |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | Secondary text, descriptions |
| `caption` | 12px / 0.75rem | 500 (Medium) | 1.4 | Captions, labels, badges |
| `overline` | 11px / 0.6875rem | 600 | 1.2 | Category labels, uppercase tags |
| `price-lg` | 28px / 1.75rem | 700 | 1.1 | Product detail price |
| `price-md` | 20px / 1.25rem | 700 | 1.2 | Cart item price |
| `price-sm` | 16px / 1rem | 600 | 1.3 | Product card price |
| `price-sale` | inherit | 700 | inherit | Sale price (color: danger-500) |
| `price-original` | inherit | 400 | inherit | Strikethrough price (color: gray-400) |

### 3.3 Spacing System (8px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0 | — |
| `space-1` | 4px | Tight inner padding |
| `space-2` | 8px | Icon gaps, badge padding |
| `space-3` | 12px | Compact element spacing |
| `space-4` | 16px | Default element spacing, card padding |
| `space-5` | 20px | Form field gaps |
| `space-6` | 24px | Section inner padding |
| `space-8` | 32px | Section spacing |
| `space-10` | 40px | Large section spacing |
| `space-12` | 48px | Page section gaps |
| `space-16` | 64px | Hero padding, major sections |
| `space-20` | 80px | Page top/bottom padding |
| `space-24` | 96px | Hero vertical padding |

### 3.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Badges, tags |
| `rounded-md` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Cards, modals |
| `rounded-xl` | 12px | Large cards, product images |
| `rounded-2xl` | 16px | Hero sections, promotional cards |
| `rounded-full` | 9999px | Avatars, circular buttons, pills |

### 3.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle card elevation |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Default card shadow |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Dropdown menus, modals |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Floating elements |
| `shadow-product` | `0 2px 8px rgba(0,0,0,0.08)` | Product card hover |
| `shadow-header` | `0 1px 3px rgba(0,0,0,0.1)` | Sticky header |

### 3.6 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-dropdown` | 10 | Dropdown menus |
| `z-sticky` | 20 | Sticky header, sticky sidebar |
| `z-drawer` | 30 | Mobile nav drawer |
| `z-modal-backdrop` | 40 | Modal backdrop |
| `z-modal` | 50 | Modal content |
| `z-toast` | 60 | Toast notifications |
| `z-tooltip` | 70 | Tooltips |

### 3.7 Transition / Animation

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Hover states, toggles |
| `duration-normal` | 250ms | Default transitions |
| `duration-slow` | 350ms | Modal open/close, drawer |
| `easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General ease |
| `easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements entering |
| `easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements leaving |
| `easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy interactions |

---

## 4. Page Specifications

### 4.1 Homepage (`/`)

**Route:** `/` (App Router: `app/page.tsx`)
**Rendering:** ISR (revalidate: 3600s)
**API Calls (server-side):**
- `GET /api/v1/banners/hero` — Hero banners
- `GET /api/v1/customer/products/featured` — Featured products
- `GET /api/v1/customer/categories` — Categories for navigation
- `GET /api/v1/flash-sales` — Active flash sales
- `GET /api/v1/banners/position/homepage-mid` — Mid-page banners

**Sections (top to bottom):**

| # | Section | Content | Mobile Behavior |
|---|---------|---------|-----------------|
| 1 | **Navigation Bar** | Logo, search, category dropdown, cart icon, user menu | Hamburger → full-screen drawer |
| 2 | **Hero Carousel** | 3-5 promotional banners with CTA | Swipeable, auto-rotate |
| 3 | **Category Strip** | Horizontal scrollable category icons/pills | Horizontal scroll |
| 4 | **Flash Sale** | Active deals with countdown timer | Horizontal scroll cards |
| 5 | **Featured Products** | 8-12 products in grid | 2-col grid |
| 6 | **Mid Banner** | Promotional banner (text + image) | Full-width |
| 7 | **New Arrivals** | Latest 8 products | 2-col grid |
| 8 | **Popular Categories** | 4-6 category cards with images | 2-col grid |
| 9 | **Newsletter** | Email subscription form | Full-width |
| 10 | **Footer** | Links, social, payment icons, copyright | Accordion sections |

### 4.2 Product Listing Page (`/products`)

**Route:** `/products` + `/products?category=x&sort=y&price_min=z`
**Rendering:** ISR (revalidate: 60s) + client-side filters
**API Calls:**
- `GET /api/v1/customer/products?page=1&per_page=20&sort=newest&...`

**Layout:**

| Desktop | Mobile |
|---------|--------|
| `[Filters Sidebar 260px] [Product Grid 4-col]` | `[Filter button → bottom sheet] [Product Grid 2-col]` |

**Filter Options:**
- Category (checkbox tree)
- Price Range (dual-handle slider)
- Rating (star checkboxes: 4★ & up, 3★ & up)
- Vendor (searchable checkbox list)
- Attributes (dynamic from category templates: color, size, etc.)
- Availability (In Stock / Includes Out of Stock)

**Sort Options:** Newest, Price ↑, Price ↓, Rating, Best Selling, Relevance

### 4.3 Product Detail Page (`/products/[slug]`)

**Route:** `/products/[slug]` (App Router: `app/products/[slug]/page.tsx`)
**Rendering:** ISR (revalidate: 60s)
**API Calls:**
- `GET /api/v1/customer/products/{slug}` — Product data
- `GET /api/v1/customer/products/{id}/reviews?page=1` — Reviews (client-side)

**Layout Structure:**
```
┌──────────────────────────────────────────────┐
│ Breadcrumb: Home > Category > Product Name   │
├──────────────────┬───────────────────────────┤
│                  │  Product Name             │
│   Image Gallery  │  ★★★★☆ (4.2) · 128 reviews│
│   [Main Image]   │  ৳2,450  ৳3,200 (-23%)   │
│   [Thumbnails]   │  Vendor: Fashion Store ✓  │
│                  │  [Color] [Size] selectors  │
│                  │  Quantity: [-] 1 [+]       │
│                  │  [🛒 Add to Cart] [♡]     │
│                  │  ✓ In Stock · Free Ship 3k+│
├──────────────────┴───────────────────────────┤
│  [Description] [Specifications] [Reviews]    │
│  ─────── Tab Content ───────                 │
│  Product description with rich text...       │
├──────────────────────────────────────────────┤
│  Customer Reviews                            │
│  ★★★★☆ 4.2 out of 5  |  Rating bars         │
│  [Review 1] [Review 2] [Review 3]            │
├──────────────────────────────────────────────┤
│  You May Also Like                           │
│  [Product] [Product] [Product] [Product]     │
└──────────────────────────────────────────────┘
```

### 4.4 Category Page (`/categories/[slug]`)

**Route:** `/categories/[slug]`
**Rendering:** ISR (revalidate: 300s)
**API Calls:**
- `GET /api/v1/customer/categories/{slug}` — Category info
- `GET /api/v1/customer/products/category/{category}` — Products

**Layout:** Same as Product Listing with category header banner

### 4.5 Cart Page (`/cart`)

**Route:** `/cart`
**Rendering:** Client-side only (no SSR for cart)
**API Calls:**
- `GET /api/v1/customer/cart` (auth) or `GET /api/v1/customer/guest/cart` (guest)
- `GET /api/v1/customer/cart/summary`

**Layout:**
```
┌────────────────────────────────┬──────────────┐
│  Cart Items (grouped by vendor)│ Order Summary│
│  ┌──────────────────────┐     │              │
│  │ 📦 Vendor: Store A   │     │ Subtotal: ৳X │
│  │ [Img] Product 1  ৳X  │     │ Shipping: ৳Y │
│  │      Qty: [-] 2 [+]  │     │ Tax: ৳Z      │
│  │ [Img] Product 2  ৳X  │     │ ────────     │
│  │      Qty: [-] 1 [+]  │     │ Total: ৳T    │
│  └──────────────────────┘     │              │
│  ┌──────────────────────┐     │ [Coupon Code] │
│  │ 📦 Vendor: Store B   │     │ [Apply]       │
│  │ [Img] Product 3  ৳X  │     │              │
│  └──────────────────────┘     │ [Checkout →]  │
└────────────────────────────────┴──────────────┘
```

### 4.6 Checkout Page (`/checkout`)

**Route:** `/checkout`
**Rendering:** Client-side only
**Auth:** Required (redirect to login with returnUrl) or Guest checkout (continue without account — see US-3.3)
**API Calls:**
- `POST /api/v1/customer/orders`
- `GET /api/v1/payments/methods`
- `GET /api/v1/shipping/methods` — available shipping methods
- `POST /api/v1/shipping/calculate` — calculate shipping cost per vendor
- Payment gateway specific calls

**Steps:**
1. **Shipping Address** — Form with validation
2. **Shipping Method** — Per-vendor method selection
3. **Payment** — Gateway selection + payment form
4. **Review & Confirm** — Order summary + place order

### 4.7 Order Confirmation (`/orders/[orderNumber]/confirmation`)

**Route:** `/orders/[orderNumber]/confirmation`
**Rendering:** SSR (auth required)
**API:** `GET /api/v1/customer/orders/{orderNumber}`

### 4.8 My Orders (`/account/orders`)

**Route:** `/account/orders`
**Rendering:** Client-side (auth required)
**API:** `GET /api/v1/customer/orders`

### 4.9 Order Detail (`/account/orders/[orderNumber]`)

**Route:** `/account/orders/[orderNumber]`
**Rendering:** SSR with client-side updates
**API:** `GET /api/v1/customer/orders/{orderNumber}`

### 4.10 Auth Pages

| Route | Page | Rendering |
|-------|------|-----------|
| `/login` | Login form | Client-side |
| `/register` | Registration form | Client-side |
| `/forgot-password` | Email input | Client-side |
| `/reset-password?token=x` | New password form | Client-side |

### 4.11 Static / Content Pages

| Route | API | Rendering |
|-------|-----|-----------|
| `/blog` | `GET /api/v1/blog` | ISR 300s |
| `/blog/[slug]` | `GET /api/v1/blog/{slug}` | ISR 60s |
| `/faq` | `GET /api/v1/faqs` | ISR 3600s |
| `/contact` | `POST /api/v1/contact` | Client-side |
| `/pages/[slug]` | `GET /api/v1/pages/{slug}` | ISR 3600s |
| `/flash-sales` | `GET /api/v1/flash-sales` | ISR 60s |

### 4.12 Account Pages

| Route | API | Purpose |
|-------|-----|---------|
| `/account` | `/auth/me` | Profile overview |
| `/account/orders` | `/customer/orders` | Order history |
| `/account/orders/[id]` | `/customer/orders/{id}` | Order detail |
| `/account/reviews` | `/customer/reviews/my` | My reviews |
| `/account/addresses` | `/customer/addresses` | Address book *(P2 — Sprint 6+; backend routes exist but commented out, activation target: Sprint 3 backend)* |
| `/account/wishlist` | (future) | Saved items |

---

## 5. Component Library

### 5.1 Layout Components

| Component | Props | Notes |
|-----------|-------|-------|
| `<Header />` | — | Sticky, contains: logo, search, nav, cart, user |
| `<MobileNav />` | `isOpen` | Full-screen drawer with menu + categories |
| `<Footer />` | — | Links, newsletter, payment icons, social |
| `<Container />` | `size: 'sm' | 'md' | 'lg' | 'xl'` | Max-width wrapper |
| `<AppBreadcrumb />` | `items: {label, href}[]` | JSON-LD breadcrumb |
| `<MegaMenu />` | `categories` | Desktop category dropdown |

### 5.2 Product Components

| Component | Props | Notes |
|-----------|-------|-------|
| `<ProductCard />` | `product, variant?: 'default' | 'compact' | 'horizontal'` | Reusable product card |
| `<ProductGrid />` | `products, columns, loading` | Responsive grid |
| `<ProductGallery />` | `images` | Zoom, thumbnails, swipe |
| `<VariantSelector />` | `variants, selected, onChange` | Color/size/etc. picker |
| `<PriceDisplay />` | `price, salePrice?, currency` | Formatted with sale badge |
| `<StockBadge />` | `status: 'in_stock' | 'low_stock' | 'out_of_stock'` | Colored status |
| `<RatingStars />` | `rating, count, size` | Star visualization |
| `<QuickAddToCart />` | `product` | Add to cart button with qty |

### 5.3 Cart Components

| Component | Props | Notes |
|-----------|-------|-------|
| `<CartDrawer />` | `isOpen` | Slide-out cart preview |
| `<CartItem />` | `item, onUpdate, onRemove` | Editable cart row |
| `<CartSummary />` | `subtotal, shipping, tax, total, coupon?` | Summary box |
| `<CouponInput />` | `onApply, appliedCoupon?` | Coupon input + validate |
| `<CartIcon />` | — | Header icon with badge count |

### 5.4 Checkout Components

| Component | Props | Notes |
|-----------|-------|-------|
| `<CheckoutStepper />` | `currentStep, steps` | Progress indicator |
| `<AddressForm />` | `onSubmit, initialValues?` | Shipping/billing form |
| `<ShippingMethodPicker />` | `methods, selected, onChange` | Per-vendor method radio |
| `<PaymentMethodPicker />` | `methods, selected, onChange` | Gateway selection |
| `<StripePaymentForm />` | `clientSecret` | Stripe Elements |
| `<OrderReview />` | `order` | Final confirmation view |

### 5.5 UI Primitives

| Component | Props | Notes |
|-----------|-------|-------|
| `<Button />` | `variant, size, loading, disabled` | Primary, secondary, ghost, danger |
| `<Badge />` | `variant, size` | Success, warning, danger, info |
| `<Modal />` | `isOpen, title, size, onClose` | Centered (desktop) / Bottom sheet (mobile) |
| `<Skeleton />` | `variant: 'text' | 'image' | 'card'` | Loading placeholder |
| `<Toast />` | `type, message, duration` | Notification toast |
| `<EmptyState />` | `icon, title, description, action` | Empty results |
| `<Spinner />` | `size` | Loading spinner |
| `<Input />` | `type, label, error, hint` | Form input |
| `<Select />` | `options, label, error` | Dropdown select |
| `<Tabs />` | `items, activeTab, onChange` | Tab navigation |

### 5.6 Content Components

| Component | Props | Notes |
|-----------|-------|-------|
| `<BlogCard />` | `post` | Blog listing card |
| `<FaqAccordion />` | `items` | Expandable FAQ |
| `<NewsletterForm />` | — | Email subscription |
| `<BannerSlot />` | `position` | Dynamic banner by position |
| `<FlashSaleCard />` | `sale, products` | With countdown timer |
| `<CountdownTimer />` | `endTime` | Days/hours/minutes/seconds |

---

## 6. API Integration Map

### 6.1 Public Endpoints (No Auth)

| Feature | Endpoint | Cache Strategy |
|---------|----------|---------------|
| Hero banners | `GET /banners/hero` | ISR 3600s |
| Banners by position | `GET /banners/position/{pos}` | ISR 3600s |
| Categories | `GET /customer/categories` | ISR 3600s |
| Category detail | `GET /customer/categories/{slug}` | ISR 300s |
| Product list | `GET /customer/products` | React Query 5min |
| Product search | `GET /customer/products/search?q={query}` | React Query 1min |
| Featured products | `GET /customer/products/featured` | ISR 3600s |
| Products by category | `GET /customer/products/category/{slug}` | ISR 300s |
| Product detail | `GET /customer/products/{slug}` | ISR 60s |
| Product reviews | `GET /customer/products/{id}/reviews` | React Query 5min |
| Review eligibility | `GET /customer/products/{id}/can-review` | React Query 1min |
| Flash sales | `GET /flash-sales` | ISR 60s |
| Blog posts | `GET /blog` | ISR 300s |
| Blog post detail | `GET /blog/{slug}` | ISR 60s |
| FAQs | `GET /faqs` | ISR 3600s |
| Static pages | `GET /pages/{slug}` | ISR 3600s |
| Payment methods | `GET /payments/methods` | React Query 30min |
| Shipping methods | `GET /shipping/methods` | React Query 30min |
| Shipping cost calc | `POST /shipping/calculate` | No cache (dynamic) |

### 6.2 Guest Endpoints (Session-based)

> **Session ID Generation:** The guest session ID is generated **client-side** using `crypto.randomUUID()` on first cart interaction and stored in `localStorage` under key `mve_guest_session`. It is sent to the backend via `X-Guest-Session` header on every guest cart request. The backend creates/retrieves the guest cart based on this session ID. On login, the session ID is sent to merge the guest cart into the authenticated cart.

| Feature | Endpoint | State |
|---------|----------|-------|
| View guest cart | `GET /customer/guest/cart` | Zustand + localStorage |
| Add to guest cart | `POST /customer/guest/cart/items` | Mutation + invalidate |
| Update cart item | `PUT /customer/guest/cart/items/{id}` | Mutation |
| Remove cart item | `DELETE /customer/guest/cart/items/{id}` | Mutation |
| Clear cart | `DELETE /customer/guest/cart` | Mutation |

### 6.3 Authenticated Endpoints

| Feature | Endpoint | State |
|---------|----------|-------|
| Login | `POST /auth/login` | authStore |
| Register | `POST /auth/register` | authStore |
| Logout | `POST /auth/logout` | authStore clear |
| Current user | `GET /auth/me` | authStore |
| Cart (CRUD) | `/customer/cart/*` | React Query |
| Cart summary | `GET /customer/cart/summary` | React Query |
| Place order | `POST /customer/orders` | Mutation |
| My orders | `GET /customer/orders` | React Query |
| Order detail | `GET /customer/orders/{orderNumber}` | React Query |
| Cancel order | `POST /customer/orders/{id}/cancel` | Mutation |
| Order tracking | `GET /customer/orders/{orderNumber}/tracking` | React Query 1min |
| My reviews | `GET /customer/reviews/my` | React Query |
| Create review | `POST /customer/reviews` | Mutation |
| Validate coupon | `POST /customer/coupons/validate` | Mutation |
| Apply coupon | `POST /customer/coupons/apply` | Mutation |
| Available coupons | `GET /customer/coupons/available` | React Query |
| Payment initiate | `POST /payments/{gateway}` | Mutation |
| Payment status | `GET /payments/{orderId}/status` | Polling |
| Refund request | `POST /payments/refund` | Mutation |
| Review eligibility | `GET /customer/products/{id}/can-review` | React Query |
| Shipping methods | `GET /shipping/methods` | React Query |
| Shipping cost | `POST /shipping/calculate` | Mutation |

### 6.4 SSLCommerz Payment Flow (Callback URLs)

| Callback | Endpoint | Purpose |
|----------|----------|--------|
| Success | `GET /payments/sslcommerz/success` | Customer redirect on successful payment → order confirmation page |
| Fail | `GET /payments/sslcommerz/fail` | Customer redirect on failed payment → retry payment page |
| Cancel | `GET /payments/sslcommerz/cancel` | Customer redirect on cancelled payment → back to checkout |
| IPN | `POST /payments/sslcommerz/ipn` | Server-to-server webhook — updates order/payment status |

> **Note:** Success/Fail/Cancel are **frontend redirect URLs** where the customer lands after the SSLCommerz gateway page. The frontend reads the query params (e.g., `?tran_id=xxx&status=VALID`) and shows appropriate UI. The IPN webhook is server-side only and is handled by the Laravel backend directly.

---

## 7. State Management

### 7.1 Zustand Stores

#### `cartStore`
```
{
  items: CartItem[]
  coupon: AppliedCoupon | null
  sessionId: string | null  // for guest cart

  // Actions
  addItem(product, variant?, quantity)
  updateQuantity(itemId, quantity)
  removeItem(itemId)
  clearCart()
  applyCoupon(code)
  removeCoupon()
  syncWithServer()  // merge guest → auth on login

  // Computed
  totalItems: number
  subtotal: number
  discount: number
  total: number
}
```

#### `authStore`
```
{
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login(email, password)
  register(data)
  logout()
  refreshUser()
  setUser(user)
}
```

#### `uiStore`
```
{
  isCartDrawerOpen: boolean
  isMobileNavOpen: boolean
  isSearchOpen: boolean
  toasts: Toast[]

  // Actions
  openCartDrawer()
  closeCartDrawer()
  toggleMobileNav()
  openSearch()
  closeSearch()
  addToast(toast)
  removeToast(id)
}
```

### 7.2 React Query Configuration

```
QueryClient {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000     // 5 minutes
      gcTime: 30 * 60 * 1000       // 30 minutes
      retry: 2
      refetchOnWindowFocus: false
    }
  }
}
```

### 7.3 Key Query Keys

| Key | Endpoint | StaleTime |
|-----|----------|-----------|
| `['products', filters]` | Products list | 5min |
| `['product', slug]` | Product detail | 5min |
| `['categories']` | Category tree | 30min |
| `['cart']` | Cart data | 0 (always fresh) |
| `['orders', page]` | Order list | 2min |
| `['order', id]` | Order detail | 1min |
| `['order-tracking', orderNumber]` | Order tracking | 1min |
| `['reviews', productId, page]` | Reviews | 5min |
| `['search', query, filters]` | Search results | 1min |
| `['flash-sales']` | Flash sales | 1min |
| `['banners', position]` | Banners | 30min |
| `['shipping-methods']` | Shipping methods | 30min |

---

## 8. SEO Requirements

### 8.1 Meta Tags Per Page

| Page | Title Pattern | Description |
|------|--------------|-------------|
| Homepage | `MVE — Online Marketplace Bangladesh` | Platform description |
| Product | `{productName} - ৳{price} | MVE` | Product summary (150 chars) |
| Category | `{categoryName} — Buy Online | MVE` | Category description |
| Blog Post | `{postTitle} | MVE Blog` | Post excerpt (150 chars) |
| Search | `Search: "{query}" | MVE` | Search results description |

### 8.2 Structured Data (JSON-LD)

| Page | Schema Type |
|------|-------------|
| Homepage | `WebSite` + `SearchAction` |
| Product | `Product` with `offers`, `aggregateRating`, `review` |
| Category | `CollectionPage` + `BreadcrumbList` |
| Blog Post | `BlogPosting` with `author`, `datePublished` |
| FAQ | `FAQPage` + `Question/Answer` |
| Breadcrumbs | `BreadcrumbList` (all pages) |

### 8.3 Technical SEO

- `sitemap.xml` — auto-generated at build time (products, categories, pages, blog)
- `robots.txt` — disallow: /cart, /checkout, /account, /api
- Canonical URLs on all pages
- OpenGraph + Twitter Card meta on all pages
- `alternate` hreflang tags (en, bn)
- Image alt tags on all `<img>` / `next/image`

---

## 9. Performance Requirements

### 9.1 Core Web Vitals Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 2.5s | `priority` on hero, preload fonts, ISR |
| FID / INP | < 200ms | Code splitting, minimal client JS |
| CLS | < 0.1 | `aspect-ratio` on images, skeleton dimensions |
| TTFB | < 600ms | Edge caching (Vercel), ISR |
| FCP | < 1.8s | Critical CSS, font `display: swap` |

### 9.2 Bundle Size Budgets

| Chunk | Budget (gzipped) |
|-------|-------------------|
| Initial JS | < 150KB |
| Per-page JS | < 50KB |
| CSS | < 30KB |
| Hero image | < 80KB (WebP) |
| Product thumbnail | < 15KB (WebP) |

### 9.3 Image Optimization

```
next/image config:
  formats: ['image/avif', 'image/webp']
  domains: ['cdn.mve.com', 'localhost']
  deviceSizes: [640, 750, 828, 1080, 1200, 1920]
  imageSizes: [64, 128, 256, 384]

Size Standards:
  thumbnail:  150 × 150
  card:       400 × 400
  detail:     800 × 800
  hero:       1920 × 600
  blog:       800 × 450
  avatar:     80 × 80
```

---

## 10. Responsive Breakpoints

| Breakpoint | Value | Target |
|------------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Layout Behavior

| Element | < 768px (Mobile) | 768px-1024px (Tablet) | > 1024px (Desktop) |
|---------|-------------------|------|---------|
| Navigation | Hamburger → drawer | Hamburger → drawer | Horizontal navbar + mega menu |
| Product grid | 2 columns | 3 columns | 4 columns |
| Filter sidebar | Bottom sheet overlay | Collapsible sidebar | Fixed 260px left |
| Cart page | Single column | Two columns | Two columns (70/30) |
| Checkout | Vertical steps | Vertical steps | Horizontal stepper |
| Product images | Swipeable carousel | Swipeable + thumbnails | Gallery + zoom |
| Search | Full-screen overlay | Expanded input | Inline in header |
| Footer | Accordion sections | 2-col grid | 4-col grid |
| CTA buttons | Fixed bottom bar | Fixed bottom bar | Inline |
| Modals | Bottom sheet | Centered | Centered with backdrop |

---

## 11. Accessibility Requirements

### 11.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|---------------|
| Color Contrast | Minimum 4.5:1 for text, 3:1 for large text |
| Keyboard Navigation | All interactive elements focusable via Tab |
| Focus Indicators | Visible focus ring (2px primary-500 outline) |
| Screen Readers | ARIA labels on all interactive elements |
| Alt Text | All images have descriptive alt text |
| Form Labels | All inputs have associated labels |
| Error Announcements | `aria-live="polite"` for form errors |
| Skip Navigation | "Skip to content" link |
| Reduced Motion | `prefers-reduced-motion` media query |
| Touch Targets | Minimum 44×44px on mobile |

---

## 12. Error Handling

### 12.1 Error States

| Scenario | User Experience |
|----------|----------------|
| API 401 | Redirect to `/login?returnUrl=current` |
| API 422 | Map errors to form fields |
| API 404 | Show custom 404 page |
| API 500+ | Show error toast + "Try again" |
| Network offline | Show offline banner + cached content |
| Empty search results | Show "No results" with suggestions |
| Empty cart | Show empty state with "Start Shopping" |
| Payment failed | Show error + retry option |
| Out of stock at checkout | Alert + remove item from cart |

### 12.2 Loading States

| Component | Loading State |
|-----------|--------------|
| Product grid | Skeleton cards (match card dimensions) |
| Product detail | Skeleton with image placeholder |
| Cart items | Spinner on quantity update |
| Checkout steps | Button spinner on submit |
| Search results | Skeleton list |
| Page transitions | Top progress bar (NProgress) |

---

## 13. Internationalization

### 13.1 Language Support

| Language | Code | Status |
|----------|------|--------|
| English | `en` | Primary (default) |
| Bengali (বাংলা) | `bn` | Secondary |

### 13.2 Currency

| Currency | Code | Symbol | Format |
|----------|------|--------|--------|
| Bangladeshi Taka | BDT | ৳ | `৳1,234.56` |
| US Dollar | USD | $ | `$1,234.56` (future) |

### 13.3 Date Formats

| Context | Format | Example |
|---------|--------|---------|
| Order date | `MMM D, YYYY` | `Mar 5, 2026` |
| Review date | `MMM D, YYYY` | `Mar 5, 2026` |
| Flash sale countdown | `DD:HH:MM:SS` | `02:14:30:15` |
| Blog post | `MMMM D, YYYY` | `March 5, 2026` |

---

## 14. Non-Functional Requirements

### 14.1 Performance
- Lighthouse score > 90 on all pages
- First page load < 3 seconds on 4G
- Subsequent navigations < 500ms (client-side routing)
- API response timeout: 15 seconds

### 14.2 Scalability
- Support 10,000+ concurrent users
- Support 100,000+ products in catalog
- CDN for all static assets and product images

### 14.3 Security
- All communication over HTTPS
- httpOnly cookies for auth tokens (XSS safe)
- CSRF protection on mutation endpoints
- Input sanitization (DOMPurify for UGC)
- CSP headers configured
- No secrets in client bundle
- Rate limiting feedback in UI

### 14.4 Browser Support
| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
| Samsung Internet | Last 2 versions |
| iOS Safari | 15+ |

### 14.5 Monitoring
- Error tracking: Sentry
- Analytics: Google Analytics 4
- Performance: Vercel Analytics + Web Vitals
- Uptime: Health check endpoint

---

*End of SRS Document*
