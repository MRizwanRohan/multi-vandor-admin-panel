# MVE Storefront — Technical Architecture Document

> **Project:** MVE Multi-Vendor E-commerce — Customer Storefront
> **Version:** 1.0
> **Date:** March 5, 2026
> **Prepared by:** MVE Development Team
> **Stack:** Next.js 14 · React 18.3 · TypeScript 5.x · Tailwind CSS 3.4

---

## Table of Contents

1. [Tech Stack & Dependencies](#1-tech-stack--dependencies)
2. [Project Structure](#2-project-structure)
3. [Rendering Strategy](#3-rendering-strategy)
4. [Axios Instance & Interceptors](#4-axios-instance--interceptors)
5. [Authentication Architecture](#5-authentication-architecture)
6. [State Management (Zustand + React Query)](#6-state-management-zustand--react-query)
7. [Image Optimization Pipeline](#7-image-optimization-pipeline)
8. [Core Web Vitals Strategy](#8-core-web-vitals-strategy)
9. [Bundle Optimization](#9-bundle-optimization)
10. [Caching Strategy Table](#10-caching-strategy-table)
11. [Error Handling Standards](#11-error-handling-standards)
12. [Security Configuration](#12-security-configuration)
13. [Mobile-Specific Architecture](#13-mobile-specific-architecture)
14. [Testing Strategy](#14-testing-strategy)
15. [CI/CD & Deployment](#15-cicd--deployment)
16. [Pre-Launch Checklist](#16-pre-launch-checklist)

---

## 1. Tech Stack & Dependencies

### 1.1 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.x | Framework (App Router, ISR, API Routes) |
| `react` | 18.3.x | UI library |
| `react-dom` | 18.3.x | React DOM renderer |
| `typescript` | 5.x | Type safety |

### 1.2 State & Data

| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | 4.5.x | Client-side state (cart, auth, UI) |
| `@tanstack/react-query` | 5.0.x | Server state, caching, mutations |
| `axios` | 1.7.x | HTTP client |
| `zod` | 3.23.x | Schema validation (forms, API responses) |

### 1.3 UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 3.4.x | Utility-first CSS |
| `@headlessui/react` | 2.x | Accessible dropdown, modal, tabs |
| `framer-motion` | 11.0.x | Animations (page transitions, micro-interactions) |

> **Framer Motion + Server Components:** Framer Motion 11 supports Server Components for static elements, but all animated components (`motion.div`, `AnimatePresence`, `useAnimation`) require `"use client"` directive. Define a clear boundary: layout wrappers and data-fetching components are Server Components; interactive/animated children are Client Components. Use a `MotionDiv` wrapper component with `"use client"` to keep the boundary clean.

| `next-themes` | 0.3.x | Dark mode |
| `@heroicons/react` | 2.x | Icon set (consistent with dashboard) |
| `react-hot-toast` | 2.4.x | Toast notifications |
| `swiper` | 11.x | Carousel/slider (hero, product gallery) |

### 1.4 Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | 7.x | Form management |
| `@hookform/resolvers` | 3.x | Zod resolver for react-hook-form |

### 1.5 Payment SDKs

| Package | Version | Purpose |
|---------|---------|---------|
| `@stripe/stripe-js` | 4.x | Stripe Elements |
| `@stripe/react-stripe-js` | 2.x | Stripe React components |
| `@paypal/react-paypal-js` | 8.x | PayPal buttons |

### 1.6 SEO & Analytics

| Package | Version | Purpose |
|---------|---------|---------|
| `next-sitemap` | 4.x | Auto-generate sitemap.xml |
| `schema-dts` | 1.x | JSON-LD structured data types |

### 1.7 Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@next/bundle-analyzer` | 14.x | Bundle size analysis |
| `sharp` | 0.33.x | Image optimization (server-side) |
| `eslint` | 8.x | Linting |
| `prettier` | 3.x | Code formatting |
| `@testing-library/react` | 14.x | Component testing |
| `vitest` | 1.x | Test runner |
| `playwright` | 1.x | E2E testing |
| `dompurify` | 3.x | Sanitize HTML (reviews, blog content) |
| `isomorphic-dompurify` | 2.x | SSR-safe DOMPurify wrapper (works in Node.js + browser) |

---

## 2. Project Structure

```
mve-storefront/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, header, footer)
│   ├── page.tsx                  # Homepage
│   ├── loading.tsx               # Global loading fallback
│   ├── error.tsx                 # Global error boundary
│   ├── not-found.tsx             # Custom 404
│   ├── globals.css               # Tailwind imports + custom properties
│   │
│   ├── (shop)/                   # Public shop pages (shared layout)
│   │   ├── layout.tsx            # Shop layout (header + footer)
│   │   ├── products/
│   │   │   ├── page.tsx          # Product listing    (ISR)
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Product detail     (ISR)
│   │   ├── categories/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Category page      (ISR)
│   │   ├── flash-sales/
│   │   │   ├── page.tsx          # Flash sales listing
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Flash sale detail
│   │   ├── search/
│   │   │   └── page.tsx          # Search results
│   │   ├── blog/
│   │   │   ├── page.tsx          # Blog listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Blog post detail
│   │   ├── faq/
│   │   │   └── page.tsx          # FAQ page
│   │   ├── contact/
│   │   │   └── page.tsx          # Contact form
│   │   ├── vendors/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Vendor store page  (ISR, P2)
│   │   └── pages/
│   │       └── [slug]/
│   │           └── page.tsx      # Static CMS pages
│   │
│   ├── (auth)/                   # Auth pages (minimal layout)
│   │   ├── layout.tsx            # Auth layout (centered card)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   │
│   ├── (account)/                # Authenticated user pages
│   │   ├── layout.tsx            # Account layout (sidebar + content)
│   │   └── account/
│   │       ├── page.tsx          # Profile overview
│   │       ├── orders/
│   │       │   ├── page.tsx      # Order history
│   │       │   └── [orderNumber]/
│   │       │       ├── page.tsx  # Order detail
│   │       │       └── confirmation/
│   │       │           └── page.tsx # Order confirmation
│   │       └── reviews/
│   │           └── page.tsx      # My reviews
│   │
│   ├── cart/
│   │   └── page.tsx              # Cart page
│   │
│   ├── checkout/
│   │   └── page.tsx              # Checkout flow
│   │
│   └── api/                      # Next.js API routes
│       ├── auth/
│       │   ├── login/route.ts    # Set httpOnly cookie
│       │   ├── logout/route.ts   # Clear cookie
│       │   └── refresh/route.ts  # Refresh token
│       └── revalidate/
│           └── route.ts          # On-demand ISR revalidation
│
├── components/                   # Shared components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   ├── MegaMenu.tsx
│   │   ├── SearchOverlay.tsx
│   │   └── Container.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── VariantSelector.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── StockBadge.tsx
│   │   ├── RatingStars.tsx
│   │   └── QuickAddToCart.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   ├── CouponInput.tsx
│   │   └── CartIcon.tsx
│   ├── checkout/
│   │   ├── CheckoutStepper.tsx
│   │   ├── AddressForm.tsx
│   │   ├── ShippingMethodPicker.tsx
│   │   ├── PaymentMethodPicker.tsx
│   │   ├── StripePaymentForm.tsx
│   │   └── OrderReview.tsx
│   ├── content/
│   │   ├── BlogCard.tsx
│   │   ├── FaqAccordion.tsx
│   │   ├── NewsletterForm.tsx
│   │   ├── BannerSlot.tsx
│   │   ├── FlashSaleCard.tsx
│   │   └── CountdownTimer.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Modal.tsx
│       ├── Skeleton.tsx
│       ├── Toast.tsx
│       ├── EmptyState.tsx
│       ├── Spinner.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Tabs.tsx
│       ├── Breadcrumb.tsx
│       └── Pagination.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useCart.ts
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useProduct.ts
│   ├── useCategories.ts
│   ├── useOrders.ts
│   ├── useReviews.ts
│   ├── useCoupons.ts
│   ├── useSearch.ts
│   ├── useShipping.ts
│   ├── useInfiniteProducts.ts
│   ├── useMediaQuery.ts
│   └── useDebounce.ts
│
├── lib/                          # Core utilities
│   ├── api/
│   │   ├── client.ts             # Axios instance + interceptors
│   │   ├── products.ts           # Product API functions
│   │   ├── cart.ts               # Cart API functions
│   │   ├── orders.ts             # Order API functions
│   │   ├── auth.ts               # Auth API functions
│   │   ├── reviews.ts            # Review API functions
│   │   ├── payments.ts           # Payment API functions
│   │   ├── shipping.ts           # Shipping methods & calculation
│   │   ├── content.ts            # Blog, FAQ, Pages API
│   │   ├── marketing.ts          # Banners, Flash Sales, Coupons
│   │   ├── server.ts             # Server-side fetch wrapper (SSR/RSC only)
│   │   ├── auth-events.ts        # Auth event bus (avoids circular deps)
│   │   └── auth-sync.ts          # BroadcastChannel cross-tab auth sync
│   ├── stores/
│   │   ├── cart.store.ts         # Zustand cart store (skipHydration)
│   │   ├── auth.store.ts         # Zustand auth store
│   │   └── ui.store.ts           # Zustand UI store
│   ├── utils/
│   │   ├── format.ts             # Currency, date formatting
│   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   ├── seo.ts                # Meta tag builders
│   │   └── constants.ts          # App constants
│   └── validators/
│       ├── auth.schema.ts        # Login, register schemas
│       ├── checkout.schema.ts    # Address, payment schemas
│       └── review.schema.ts      # Review form schema
│
├── types/                        # TypeScript types
│   ├── product.ts
│   ├── cart.ts
│   ├── order.ts
│   ├── auth.ts
│   ├── review.ts
│   ├── category.ts
│   ├── payment.ts
│   ├── coupon.ts
│   ├── content.ts                # Blog, FAQ, Page, Banner
│   └── api.ts                    # API response wrappers
│
├── public/
│   ├── icons/                    # Favicons, PWA icons
│   ├── images/                   # Static images
│   └── fonts/                    # Self-hosted fonts (optional)
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local
├── .env.example
└── package.json
```

---

## 3. Rendering Strategy

### 3.1 Strategy Per Route

| Route | Strategy | Revalidate | Reason |
|-------|----------|------------|--------|
| `/` (Homepage) | ISR | 3600s (1hr) | Content changes infrequently, SEO critical |
| `/products` | ISR + Client | 60s | Filters are client-side, base page ISR |
| `/products/[slug]` | ISR | 60s | Price/stock may change, SEO critical |
| `/categories/[slug]` | ISR | 300s (5min) | Category structure stable |
| `/search` | CSR | — | Dynamic query, no SEO needed |
| `/cart` | CSR | — | User-specific, real-time |
| `/checkout` | CSR | — | User-specific, payment flows |
| `/account/*` | SSR | — | Auth required, personalized |
| `/login`, `/register` | CSR | — | Interactive forms |
| `/blog` | ISR | 300s | Content stable |
| `/blog/[slug]` | ISR | 60s | Individual posts |
| `/faq` | ISR | 3600s | Rarely changes |
| `/pages/[slug]` | ISR | 3600s | Static content |
| `/flash-sales` | ISR | 60s | Time-sensitive |
| `/vendors/[slug]` | ISR | 300s (5min) | Vendor info stable, P2 feature |
| `/contact` | CSR | — | Form submission |

### 3.2 ISR Implementation Pattern

```typescript
// app/products/[slug]/page.tsx

export const revalidate = 60 // ISR: Revalidate every 60 seconds

// Only pre-generate top 200 popular products at build time.
// All other slugs will be generated on-demand (dynamicParams = true by default).
export const dynamicParams = true // Allow on-demand ISR for unknown slugs

export async function generateStaticParams() {
  // Limit to top 200 to keep build time < 5 minutes
  // Products not in this list will be SSR'd on first request, then cached via ISR
  const products = await getPopularProductSlugs({ limit: 200 })
  return products.map(slug => ({ slug }))
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug)
  return {
    title: `${product.name} - ৳${product.price} | MVE`,
    description: product.short_description,
    openGraph: {
      images: [product.images[0]?.url],
    },
  }
}
```

### 3.3 On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
// Called by backend webhook when product/category/page updated

export async function POST(request: Request) {
  const { secret, path, tag } = await request.json()

  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (tag) {
    revalidateTag(tag)  // e.g., 'products', 'categories'
  } else if (path) {
    revalidatePath(path) // e.g., '/products/blue-shirt'
  }

  return Response.json({ revalidated: true })
}
```

---

## 4. Axios Instance & Interceptors

### 4.1 Base Client Configuration

```typescript
// lib/api/client.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const TIMEOUT = 15_000 // 15 seconds

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Send cookies for Sanctum
})
```

### 4.2 Request Interceptor

```typescript
// CLIENT-SIDE ONLY — Attach guest session for cart
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token is in httpOnly cookie — browser sends automatically via withCredentials
    // No need to manually attach token on client side

    // Add guest session ID for guest cart
    const sessionId = getGuestSessionId()
    if (sessionId) {
      config.headers['X-Guest-Session'] = sessionId
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Guest session ID management
function getGuestSessionId(): string | null {
  if (typeof window === 'undefined') return null
  let sessionId = localStorage.getItem('mve_guest_session')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('mve_guest_session', sessionId)
  }
  return sessionId
}
```

### 4.2.1 Server-Side Fetch Wrapper (for SSR/RSC)

> **IMPORTANT:** `next/headers` can only be used inside Server Components, Route Handlers, and Server Actions. It CANNOT be used inside Axios interceptors or any client-side code. For server-side data fetching, use this dedicated wrapper instead of the Axios client.

```typescript
// lib/api/server.ts
// This file is ONLY imported in Server Components and Route Handlers

import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api/v1'

export async function serverFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    // ISR: use next.revalidate for caching
    next: { revalidate: (options as any)?.revalidate ?? 60 },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data as T
}

// Usage in Server Components:
// const products = await serverFetch<Product[]>('/customer/products/featured')
// const product = await serverFetch<Product>(`/customer/products/${slug}`)
```
```

### 4.3 Response Interceptor

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status
    const originalRequest = error.config

    // 401 — Token expired → Refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await refreshAuthToken()
        return apiClient(originalRequest) // Retry original request
      } catch {
        // Refresh failed → logout via event (avoids circular dependency with Zustand)
        authEventBus.emit('force-logout')
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session_expired=true'
        }
        return Promise.reject(error)
      }
    }

    // 422 — Validation errors → parse and throw structured
    if (status === 422) {
      const validationErrors = error.response?.data?.errors || {}
      throw new ValidationError(validationErrors)
    }

    // 429 — Rate limited
    if (status === 429) {
      toast.error('Too many requests. Please wait a moment.')
    }

    // 500+ — Server error
    if (status && status >= 500) {
      toast.error('Something went wrong. Please try again.')
    }

    // Network error
    if (!error.response) {
      toast.error('Network error. Check your connection.')
    }

    return Promise.reject(error)
  }
)
```

### 4.4 API Error Response Type

```typescript
// types/api.ts

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}
```

### 4.5 Auth Event Bus (Avoiding Circular Dependencies)

> **Why:** Directly calling `useAuthStore.getState().logout()` inside Axios interceptors creates a circular dependency (client.ts → auth.store.ts → client.ts) and makes testing difficult. Instead, use a lightweight event bus.

```typescript
// lib/api/auth-events.ts

type AuthEvent = 'force-logout'
type Listener = () => void

class AuthEventBus {
  private listeners = new Map<AuthEvent, Set<Listener>>()

  on(event: AuthEvent, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener)
    return () => this.listeners.get(event)?.delete(listener)
  }

  emit(event: AuthEvent) {
    this.listeners.get(event)?.forEach(fn => fn())
  }
}

export const authEventBus = new AuthEventBus()

// In auth.store.ts:
// authEventBus.on('force-logout', () => useAuthStore.getState().logout())
```
```

---

## 5. Authentication Architecture

### 5.1 Token Flow

```
                         ┌──────────────────┐
                         │   Next.js API     │
  Browser ──── POST ────▶│  /api/auth/login  │
  (credentials)          │                   │
                         │  1. Call Laravel   │
                         │     /auth/login    │
                         │                   │
                         │  2. Get token      │
                         │                   │
                         │  3. Set httpOnly   │
                         │     cookie         │
                         │                   │
                         │  4. Return user    │
  Browser ◀── 200 ──────│     data           │
  (cookie set            └──────────────────┘
   automatically)
```

### 5.2 Next.js API Route (Cookie Proxy)

```typescript
// app/api/auth/login/route.ts

export async function POST(request: Request) {
  const body = await request.json() // { email, password }

  // Forward to Laravel
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    return Response.json(data, { status: response.status })
  }

  // Set httpOnly cookie with token
  const res = Response.json({ user: data.data.user })
  res.headers.set('Set-Cookie', serialize('auth_token', data.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  }))

  return res
}
```

### 5.3 Auth Middleware

```typescript
// middleware.ts

import { NextResponse, NextRequest } from 'next/server'

const protectedPaths = ['/account', '/checkout']
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Redirect logged-in users away from auth pages
  if (authPaths.some(p => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect unauthenticated users to login
  if (protectedPaths.some(p => pathname.startsWith(p)) && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/checkout', '/login', '/register'],
}
```

### 5.4 Refresh Token Rotation

```typescript
// lib/api/auth.ts

import { broadcastAuthEvent } from './auth-sync'

let refreshPromise: Promise<void> | null = null

export async function refreshAuthToken(): Promise<void> {
  // Deduplicate concurrent refresh calls (same tab)
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
    .then(res => {
      if (!res.ok) throw new Error('Refresh failed')
      // Notify other tabs about the token refresh
      broadcastAuthEvent('token-refreshed')
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}
```

### 5.5 Cross-Tab Auth Sync (BroadcastChannel)

> **Problem:** When a user has multiple tabs open and the token expires, only one tab should refresh the token. Other tabs should pick up the new token. Also, logging out in one tab should log out all tabs.

```typescript
// lib/api/auth-sync.ts

type AuthMessageType = 'login' | 'logout' | 'token-refreshed'
let authChannel: BroadcastChannel | null = null
let useFallback = false

export function initAuthSync() {
  if (typeof window === 'undefined') return

  // Primary: BroadcastChannel (Chrome, Firefox, Safari 15.4+)
  if (typeof BroadcastChannel !== 'undefined') {
    authChannel = new BroadcastChannel('mve-auth')
    authChannel.onmessage = (event) => handleAuthMessage(event.data.type)
  } else {
    // Fallback: localStorage 'storage' event (Safari < 15.4, older iOS)
    useFallback = true
    window.addEventListener('storage', (event) => {
      if (event.key === 'mve-auth-event' && event.newValue) {
        try {
          const { type } = JSON.parse(event.newValue)
          handleAuthMessage(type)
        } catch { /* ignore malformed */ }
      }
    })
  }
}

function handleAuthMessage(type: AuthMessageType) {
  switch (type) {
    case 'logout':
      // Another tab logged out → clear local state and redirect
      useAuthStore.getState().clearUser()
      window.location.href = '/login?session_expired=true'
      break

    case 'login':
      // Another tab logged in → refresh current user
      useAuthStore.getState().refreshUser()
      break

    case 'token-refreshed':
      // Another tab refreshed the token → our next request will use the new cookie
      // No action needed since token is in httpOnly cookie
      break
  }
}

export function broadcastAuthEvent(type: AuthMessageType) {
  if (authChannel) {
    authChannel.postMessage({ type })
  } else if (useFallback && typeof window !== 'undefined') {
    // localStorage fallback: write → triggers 'storage' event in OTHER tabs
    localStorage.setItem('mve-auth-event', JSON.stringify({ type, ts: Date.now() }))
    // Clean up immediately (the event fires on write, value not needed after)
    localStorage.removeItem('mve-auth-event')
  }
}

// Initialize in app/layout.tsx (client component wrapper):
// useEffect(() => { initAuthSync() }, [])
```
```

---

## 6. State Management (Zustand + React Query)

### 6.1 Zustand Cart Store

```typescript
// lib/stores/cart.store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: number
  product_id: number
  variant_id?: number
  name: string
  image: string
  price: number
  quantity: number
  max_quantity: number
  vendor_id: number
  vendor_name: string
}

interface CartStore {
  items: CartItem[]
  coupon: { code: string; discount: number; type: string } | null

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  updateQuantity: (itemId: number, quantity: number) => void
  removeItem: (itemId: number) => void
  clearCart: () => void
  setCoupon: (coupon: CartStore['coupon']) => void
  removeCoupon: () => void

  // Computed-like
  totalItems: () => number
  subtotal: () => number
  vendorGroups: () => Map<number, CartItem[]>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (newItem) => set((state) => {
        const existing = state.items.find(
          i => i.product_id === newItem.product_id && i.variant_id === newItem.variant_id
        )
        if (existing) {
          return {
            items: state.items.map(i =>
              i === existing
                ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.max_quantity) }
                : i
            ),
          }
        }
        return { items: [...state.items, { ...newItem, id: Date.now() }] }
      }),

      updateQuantity: (itemId, quantity) => set((state) => ({
        items: state.items.map(i =>
          i.id === itemId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.max_quantity)) } : i
        ),
      })),

      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(i => i.id !== itemId),
      })),

      clearCart: () => set({ items: [], coupon: null }),

      setCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      vendorGroups: () => {
        const groups = new Map<number, CartItem[]>()
        get().items.forEach(item => {
          const existing = groups.get(item.vendor_id) || []
          groups.set(item.vendor_id, [...existing, item])
        })
        return groups
      },
    }),
    {
      name: 'mve-cart',
      // Fix SSR hydration mismatch: skip hydration on server,
      // rehydrate only on client after mount
      skipHydration: true,
    }
  )
)

// Usage: Rehydrate in a client component (e.g., CartProvider)
// useEffect(() => { useCartStore.persist.rehydrate() }, [])
```

> **SSR Hydration Note:** Zustand's `persist` middleware uses `localStorage` which is not available during SSR. Without `skipHydration: true`, the server renders with the initial state (empty cart) while the client immediately reads localStorage and gets a different state — causing a React hydration mismatch error. The `skipHydration` pattern defers localStorage reading until after the component mounts on the client.
```

### 6.2 React Query Hooks

```typescript
// hooks/useProducts.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { productApi } from '@/lib/api/products'

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getAll(filters),
    staleTime: 5 * 60 * 1000,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getBySlug(slug),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  })
}

export function useInfiniteProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: ['infinite-products', filters],
    queryFn: ({ pageParam = 1 }) =>
      productApi.getAll({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    staleTime: 5 * 60 * 1000,
  })
}
```

```typescript
// hooks/useCart.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/lib/api/cart'

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add to cart')
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
```

### 6.3 Cache Invalidation Patterns

| Event | Invalidations |
|-------|---------------|
| Add to cart | `['cart']` |
| Place order | `['cart']`, `['orders']` |
| Write review | `['reviews', productId]`, `['product', slug]` |
| Apply coupon | `['cart']` |
| Login | `['cart']` (merge guest), `['orders']` |
| Logout | Clear all queries |
| Cancel order | `['order', id]`, `['orders']` |
| Search | `['search', query, filters]` |
| Change shipping address | `['shipping-cost']` (recalculate per vendor) |
| Select shipping method | `['cart']` (update total with shipping cost) |

---

## 7. Image Optimization Pipeline

### 7.1 next.config.ts Image Configuration

```typescript
// next.config.ts

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.mve.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
}
```

### 7.2 Image Size Standards

| Context | Dimensions | Max File Size | `sizes` Prop |
|---------|-----------|---------------|--------------|
| Product thumbnail (card) | 400×400 | 15KB WebP | `(max-width: 768px) 50vw, 25vw` |
| Product gallery main | 800×800 | 60KB WebP | `(max-width: 768px) 100vw, 50vw` |
| Product gallery thumb | 150×150 | 5KB WebP | `80px` |
| Hero banner | 1920×600 | 80KB WebP | `100vw` |
| Category image | 400×300 | 20KB WebP | `(max-width: 768px) 50vw, 25vw` |
| Blog post image | 800×450 | 40KB WebP | `(max-width: 768px) 100vw, 66vw` |
| Avatar | 80×80 | 5KB WebP | `40px` |
| Banner (mid-page) | 1200×300 | 50KB WebP | `100vw` |

### 7.3 Blur Placeholder Strategy

```typescript
// For LCP images (hero, first product row):
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={product.blur_data_url || FALLBACK_BLUR}
  priority={index < 4}  // First row gets priority
  sizes="(max-width: 768px) 50vw, 25vw"
/>

// Fallback blur (10x10 gray placeholder)
const FALLBACK_BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAK...'
```

---

## 8. Core Web Vitals Strategy

### 8.1 LCP Optimization (< 2.5s)

| Strategy | Implementation |
|----------|---------------|
| Priority images | `priority` prop on hero + first 4 product cards |
| Font preload | `<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>` |
| ISR | Pre-rendered HTML served from CDN edge |
| Critical CSS | Tailwind purge + inline critical styles |
| Minimal JS on first load | Server Components by default |
| Image format | AVIF > WebP > JPEG fallback chain |

### 8.2 INP / FID Optimization (< 200ms)

| Strategy | Implementation |
|----------|---------------|
| Code splitting | Dynamic imports for modals, payment forms, galleries |
| Minimal hydration | Server Components for static sections |
| Web Workers | Heavy computations off main thread (future) |
| Debounced inputs | 300ms debounce on search, filter changes |
| Optimistic updates | Zustand updates before API confirms |

### 8.3 CLS Optimization (< 0.1)

| Strategy | Implementation |
|----------|---------------|
| Image aspect ratios | `aspect-ratio: 1/1` for products, `aspect-ratio: 16/9` for banners |
| Skeleton dimensions | Match exact component dimensions |
| Font `display: swap` | All fonts use display swap |
| Fixed header height | 64px desktop, 56px mobile |
| No dynamically injected ads | N/A |
| Reserved space for badges | Min-height on badge containers |

### 8.4 Font Loading

```typescript
// app/layout.tsx

import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

// Bengali font loaded async (only when needed)
const notoBengali = localFont({
  src: '../public/fonts/NotoSansBengali-Variable.woff2',
  display: 'swap',
  variable: '--font-bengali',
  preload: false, // async load
})
```

---

## 9. Bundle Optimization

### 9.1 Dynamic Imports

```typescript
// Heavy components loaded on demand
const ProductGallery = dynamic(() => import('@/components/product/ProductGallery'), {
  loading: () => <Skeleton variant="image" className="aspect-square" />,
})

const StripePaymentForm = dynamic(() => import('@/components/checkout/StripePaymentForm'), {
  ssr: false,
})

const RichTextContent = dynamic(() => import('@/components/content/RichTextContent'))

const ReviewForm = dynamic(() => import('@/components/product/ReviewForm'))
```

### 9.2 Tree Shaking

```typescript
// ✅ Good — only imports used icons
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline'

// ❌ Bad — imports entire library
import * as Icons from '@heroicons/react/24/outline'
```

### 9.3 Bundle Analysis

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

// Run: ANALYZE=true npm run build
```

### 9.4 Bundle Budgets

| Chunk | Budget (gzipped) | Monitoring |
|-------|-------------------|------------|
| `app/layout` (framework) | < 85KB | Bundle analyzer |
| `app/page` (homepage) | < 30KB | Bundle analyzer |
| `app/products/[slug]` | < 45KB | Bundle analyzer |
| Total initial JS | < 150KB | Lighthouse CI |
| CSS total | < 30KB | Build output |

---

## 10. Caching Strategy Table

| Resource | Strategy | TTL | Invalidation |
|----------|----------|-----|--------------|
| Homepage | ISR | 3600s (1hr) | On-demand via webhook |
| Product detail | ISR | 60s | On-demand on update |
| Product listing | ISR + React Query | 60s / 5min | URL change + stale refetch |
| Category page | ISR | 300s (5min) | On-demand on update |
| Search results | React Query | 1min stale | Query key change |
| Cart data | Zustand (persist) | 24hr localStorage | API sync on mount |
| User session | httpOnly cookie | 30 days | Refresh rotation |
| Product images | CDN + Cache-Control | 1 year | URL versioning |
| Static assets (JS/CSS) | Immutable | ∞ | Content hash in filename |
| Blog posts | ISR | 300s | On-demand on publish |
| FAQs | ISR | 3600s | On-demand on update |
| Flash sales | ISR | 60s | Time-sensitive, short TTL |
| Banners | React Query | 30min | Position-based key |
| Reviews | React Query | 5min | Invalidate on write |
| Orders | React Query | 2min | Invalidate on place/cancel |
| Order tracking | React Query | 1min | Invalidate on status change |
| Payment methods | React Query | 30min | Rarely changes |
| Shipping methods | React Query | 30min | Region/vendor based |

---

## 11. Error Handling Standards

### 11.1 Laravel Error Format

```typescript
// All errors follow this structure from the backend:
{
  success: false,
  message: "Human-readable error message",
  errors: {                          // Only on 422
    "email": ["The email is required."],
    "password": ["Must be at least 8 characters."]
  }
}
```

### 11.2 Client-Side Error Handling

```typescript
// Global error boundary
// app/error.tsx

'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-gray-600">{error.message}</p>
      <Button onClick={reset} className="mt-4">Try Again</Button>
    </div>
  )
}
```

### 11.3 Zod Response Validation

```typescript
// Validate API responses to catch data shape issues early
import { z } from 'zod'

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  sale_price: z.number().nullable(),
  images: z.array(z.object({
    id: z.number(),
    url: z.string(),
    alt: z.string().nullable(),
  })),
  vendor: z.object({
    id: z.number(),
    store_name: z.string(),
  }),
  // ... other fields
})

export async function getProduct(slug: string): Promise<Product> {
  const response = await apiClient.get(`/customer/products/${slug}`)
  return ProductSchema.parse(response.data.data)
}
```

### 11.4 Error Type Matrix

| Status | Error Type | User Action | UI Treatment |
|--------|-----------|-------------|-------------|
| 400 | Bad Request | Show message | Toast error |
| 401 | Unauthorized | Redirect to login | Auto-redirect |
| 403 | Forbidden | Show denied page | Error page |
| 404 | Not Found | Show 404 page | Custom 404 |
| 422 | Validation | Highlight fields | Inline errors |
| 429 | Rate Limited | Wait and retry | Toast with countdown |
| 500 | Server Error | Retry or report | Toast + retry button |
| Network | Offline | Check connection | Offline banner |

---

## 12. Security Configuration

### 12.1 Security Headers (next.config.ts)

```typescript
// next.config.ts

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' https://cdn.mve.com https://*.stripe.com data: blob:",
      "connect-src 'self' https://api.stripe.com https://www.paypal.com",
      "frame-src https://js.stripe.com https://www.paypal.com https://sandbox.sslcommerz.com",
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

### 12.2 Auth Token Security

| Aspect | Implementation |
|--------|---------------|
| Storage | httpOnly cookie (not accessible via JS → XSS safe) |
| Transmission | HTTPS only, SameSite=Lax |
| Expiry | 30 days with refresh rotation |
| CSRF | Sanctum CSRF cookie on mutations |
| Logout | Cookie cleared server-side |

### 12.3 Input Sanitization

```typescript
// For user-generated content (reviews, blog comments)
// Use isomorphic-dompurify instead of dompurify for SSR compatibility
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  })
}

// NOTE: isomorphic-dompurify works in both Node.js (SSR/RSC) and browser.
// Regular dompurify relies on window.document and crashes in Server Components.
```

### 12.4 Environment Variables

```bash
# .env.local

# Public (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.mve.com/api/v1
NEXT_PUBLIC_CDN_URL=https://cdn.mve.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxx
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Server-only (NEVER exposed to browser)
BACKEND_URL=https://api.mve.com/api/v1
REVALIDATION_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_live_xxx
```

---

## 13. Mobile-Specific Architecture

### 13.1 Component Behavior by Breakpoint

| Element | Mobile (< 768px) | Desktop (≥ 1024px) |
|---------|-------------------|---------------------|
| Navigation | Hamburger → full-screen drawer | Horizontal navbar + mega menu |
| Search | Full-screen overlay with keyboard | Inline input in header bar |
| Filter sidebar | Bottom sheet (overlay) | Fixed 260px left panel |
| Product grid | 2 columns | 4 columns |
| Product images | Swipeable carousel (Swiper) | Thumbnail strip + zoom on hover |
| Cart preview | Full-page slide-up | Slide-out drawer (right) |
| Checkout steps | Vertical accordion | Horizontal stepper |
| CTA buttons | Fixed bottom bar (z-30) | Inline in content area |
| Data tables | Card layout (stacked) | Full columns |
| Modals | Bottom sheet (slide up) | Centered with backdrop |
| Footer | Accordion sections | 4-column grid |
| Breadcrumb | Scrollable horizontal | Full breadcrumb trail |

### 13.2 Touch Interactions

| Gesture | Component | Action |
|---------|-----------|--------|
| Swipe left/right | Hero carousel | Navigate slides |
| Swipe left/right | Product gallery | Navigate images |
| Swipe down | Bottom sheet | Close sheet |
| Pull down | Product list | Refresh (future) |
| Long press | Product card | Quick preview (future) |
| Pinch | Product image | Zoom in/out |

### 13.3 Fixed Bottom Bar (Mobile)

```
┌──────────────────────────────────────────┐
│  [🏠 Home] [📂 Categories] [🔍 Search]  │
│  [❤️ Wishlist] [🛒 Cart (3)]            │
└──────────────────────────────────────────┘
```
- Visible on all shop pages (not checkout/auth)
- Cart badge shows item count
- Active tab highlighted with primary color

---

## 14. Testing Strategy

### 14.1 Test Pyramid

| Level | Tool | Coverage Target | Focus Areas |
|-------|------|-----------------|-------------|
| Unit | Vitest | 80% | Zustand stores, utils, formatters |
| Component | Testing Library | 70% | ProductCard, CartItem, AddressForm |
| Integration | Testing Library | 60% | Cart flows, checkout steps |
| E2E | Playwright | Critical paths | Homepage → Product → Cart → Checkout |
| Visual | Chromatic (future) | Key pages | Screenshot regression |

### 14.2 Critical E2E Paths

1. **Happy Path:** Homepage → Browse → Product → Add to Cart → Checkout → Payment → Confirmation
2. **Guest Cart:** Add items as guest → Login → Cart merged → Checkout
3. **Search Flow:** Search → Filter → Sort → Product detail
4. **Auth Flow:** Register → Verify → Login → Profile
5. **Order Flow:** My Orders → Order Detail → Cancel Order
6. **Review Flow:** Order Detail → Write Review → Submit

---

## 15. CI/CD & Deployment

### 15.1 Pipeline

```
Push to main
  │
  ├── Lint (eslint)
  ├── Type check (tsc --noEmit)
  ├── Unit tests (vitest)
  ├── Build (next build)
  ├── Bundle size check (budget enforcement)
  ├── E2E tests (playwright, against staging)
  │
  └── Deploy to Vercel (production)
       ├── Edge Functions (middleware)
       ├── ISR (revalidation)
       └── CDN (static assets)
```

### 15.2 Environment Matrix

| Environment | URL | Backend | ISR |
|-------------|-----|---------|-----|
| Development | `localhost:3000` | `localhost:8000` | Disabled |
| Staging | `staging.mve.com` | `api-staging.mve.com` | Enabled |
| Production | `www.mve.com` | `api.mve.com` | Enabled |

---

## 16. Pre-Launch Checklist

### Performance
- [ ] Lighthouse score 90+ all pages (mobile + desktop)
- [ ] Core Web Vitals green in CrUX (after 28 days of real data)
- [ ] All images in WebP/AVIF format
- [ ] Fonts preloaded with `display: swap`
- [ ] No render-blocking resources
- [ ] Bundle budgets enforced in CI
- [ ] ISR working on all static pages

### SEO
- [ ] Unique `<title>` + `<meta description>` per page
- [ ] OpenGraph tags on all pages
- [ ] JSON-LD structured data (Product, BreadcrumbList, FAQPage, BlogPosting)
- [ ] `sitemap.xml` auto-generated and submitted to Google Search Console
- [ ] `robots.txt` configured (disallow cart, checkout, account)
- [ ] Canonical URLs on all pages
- [ ] `alt` text on all images

### Security
- [ ] HTTPS only (HSTS header)
- [ ] All security headers configured
- [ ] No secrets in client-side bundle (check `NEXT_PUBLIC_` vars)
- [ ] XSS prevention verified (DOMPurify on UGC)
- [ ] CSRF token on mutations
- [ ] httpOnly cookie for auth token
- [ ] CSP header with Stripe/PayPal whitelisted

### Accessibility
- [ ] WCAG 2.1 AA contrast ratios
- [ ] Full keyboard navigation
- [ ] Screen reader tested (NVDA/VoiceOver)
- [ ] Focus indicators visible on all interactive elements
- [ ] `<html lang="en">` set
- [ ] Skip navigation link

### UX Completeness
- [ ] All loading states (skeletons matching real layout)
- [ ] All empty states (empty cart, no results, no orders)
- [ ] All error states (network, 404, 500, validation)
- [ ] Custom 404 and 500 pages
- [ ] Cart persists on page refresh
- [ ] Mobile tested on real Android + iOS devices
- [ ] Dark mode functional (all pages)
- [ ] Bengali language strings added

### Payment
- [ ] Stripe test mode → live keys switched
- [ ] PayPal sandbox → live credentials
- [ ] SSLCommerz test → live mode
- [ ] COD flow tested end-to-end
- [ ] Refund request flow tested
- [ ] Webhook endpoints verified

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Google Analytics 4 events firing
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring active
- [ ] On-demand revalidation webhook connected to backend

---

*End of Technical Architecture Document*
