# MVE Storefront — Component Development Guide

> **Project:** MVE Multi-Vendor E-commerce — Customer Storefront
> **Version:** 1.1 (Updated March 8, 2026 — Critical fixes applied)
> **Stack:** Next.js 14 · React 18 · TypeScript 5 · Tailwind CSS 3.4
> **Team:** MVE Dev Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Core Principles](#2-core-principles)
3. [File Structure](#3-file-structure)
4. [Naming Conventions](#4-naming-conventions)
5. [Server vs Client Components](#5-server-vs-client-components)
6. [TypeScript Rules](#6-typescript-rules)
7. [Styling — Tailwind Rules](#7-styling--tailwind-rules)
8. [State Management](#8-state-management)
9. [API Integration & Hooks](#9-api-integration--hooks)
10. [Error & Loading States](#10-error--loading-states)
11. [Authentication Pattern](#11-authentication-pattern)
12. [Image Optimization](#12-image-optimization)
13. [Search & Filter Pattern](#13-search--filter-pattern)
14. [Component Reference — Layout](#14-component-reference--layout)
15. [Component Reference — Product](#15-component-reference--product)
16. [Component Reference — Cart](#16-component-reference--cart)
17. [Component Reference — Checkout](#17-component-reference--checkout)
18. [Component Reference — Content](#18-component-reference--content)
19. [UI Primitives](#19-ui-primitives)
20. [Hooks Reference](#20-hooks-reference)
21. [Optimistic Updates Pattern](#21-optimistic-updates-pattern)
22. [Form Pattern](#22-form-pattern)
23. [Mobile-Specific Patterns](#23-mobile-specific-patterns)
24. [SEO Pattern](#24-seo-pattern)
25. [Internationalization (i18n)](#25-internationalization-i18n)
26. [Accessibility Rules](#26-accessibility-rules)
27. [Environment Variables](#27-environment-variables)
28. [Developer Checklist](#28-developer-checklist)

---

## 1. Introduction

এই document MVE Storefront-এর সকল developer-এর জন্য। নতুন component বানানো থেকে শুরু করে existing component edit করা — সব কিছুর জন্য এটাই reference। **এখানে যা আছে তার বাইরে যাওয়া যাবে না।**

> ⚠️ **এই guide follow না করলে:** Code review-এ reject হবে। Team-এ inconsistency তৈরি হবে। Production bug বাড়বে।

**Scope:**
- **Project:** `mve-storefront/` — Next.js 14 App Router
- **Backend:** Laravel API at `/api/v1/` (already built)
- **Frontend focus:** Components, hooks, stores, API integration

---

## 2. Core Principles

| ✅ Always | ❌ Never |
|-----------|---------|
| Server Component by default | `useState` for server data |
| TypeScript strict mode | `any` type in TypeScript |
| Zod for form + API validation | Inline styles (use Tailwind) |
| React Query for server state | Direct API call in component body |
| Zustand for UI/cart state | Token in `localStorage` / `sessionStorage` |
| Skeleton loader on every fetch | Hard-coded Bengali/English strings (use i18n) |
| Mobile-first CSS | Import entire icon libraries |
| Auth via service layer, not store | `authStore.login()` directly |
| `cn()` for conditional classes | String concatenation for Tailwind classes |
| `typeof window !== 'undefined'` guard | Bare `localStorage` call at module level |

---

## 3. File Structure

```
# একটা component folder-এর anatomy
components/
  product/
    ProductCard.tsx          # Main component
    ProductCard.test.tsx     # Unit tests
    index.ts                 # Re-export (optional)

# একটা page-এর anatomy
app/
  (shop)/
    products/
      page.tsx               # Server Component (data fetch)
      loading.tsx            # Skeleton (auto-used by Next.js)
      error.tsx              # Error boundary
      _components/           # Page-specific components (underscore prefix)
        ProductFilters.tsx
```

**Folder Rules:**

| Location | What goes here |
|----------|---------------|
| `components/` | Shared, reusable components |
| `app/.../_components/` | Page-only components (underscore prefix) |
| `hooks/` | Custom hooks, always with `use` prefix |
| `lib/api/` | API functions, one file per feature |
| `lib/stores/` | Zustand stores |
| `lib/validators/` | Zod schemas |
| `types/` | TypeScript interfaces, one file per feature |

---

## 4. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component file | PascalCase | `ProductCard.tsx` |
| Component function | PascalCase | `function ProductCard()` |
| Hook file | camelCase + `use` prefix | `useCart.ts` |
| Hook function | camelCase + `use` prefix | `function useCart()` |
| API function | camelCase | `getProductBySlug()` |
| Store file | camelCase + `.store` suffix | `cart.store.ts` |
| Type / Interface | PascalCase | `interface CartItem {}` |
| Zod Schema | PascalCase + `Schema` suffix | `const CheckoutSchema` |
| CSS class (custom) | kebab-case | `product-card-hover` |
| Env variable | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |
| Query key | array, kebab-case string | `['product', slug]` |

**Props Naming Rules:**

```typescript
// ✅ সঠিক prop naming
interface ProductCardProps {
  product: Product              // noun
  onAddToCart: () => void       // event handler: on + PascalCase
  isLoading: boolean            // boolean: is/has/can prefix
  variant?: 'default' | 'compact'  // union type for variants
  className?: string            // always add className for overrides
}

// ❌ ভুল prop naming
interface ProductCardProps {
  data: any                     // ❌ 'data' too generic
  click: () => void             // ❌ missing 'on' prefix
  loading: boolean              // ❌ missing 'is' prefix
  type: string                  // ❌ string too loose, use union
}
```

---

## 5. Server vs Client Components

এটা সবচেয়ে গুরুত্বপূর্ণ rule।

| Feature | Server Component | Client Component |
|---------|-----------------|-----------------|
| Default | ✅ YES | Opt-in with `'use client'` |
| Direct API fetch | ✅ Yes (via `serverFetch`) | ❌ No (use React Query) |
| `useState` / `useEffect` | ❌ No | ✅ Yes |
| Browser APIs (`window`, `localStorage`) | ❌ No | ✅ Yes |
| Event handlers (`onClick`, `onChange`) | ❌ No | ✅ Yes |
| Framer Motion animations | ❌ No | ✅ Yes |
| Zustand store access | ❌ No | ✅ Yes |
| SEO / meta tags (`generateMetadata`) | ✅ Yes | ❌ No |
| Bundle size impact | Zero | Added to JS bundle |

**Pattern: Server fetches, Client renders interactivity**

```typescript
// ✅ app/(shop)/products/[slug]/page.tsx — SERVER COMPONENT
import { serverFetch } from '@/lib/api/server'
import ProductDetail from './_components/ProductDetail'

export default async function ProductPage({ params }) {
  const product = await serverFetch<Product>(`/customer/products/${params.slug}`)
  return <ProductDetail product={product} />
}

// ✅ _components/ProductDetail.tsx — CLIENT COMPONENT
'use client'

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCartStore()
  const [selectedVariant, setSelectedVariant] = useState(null)
  return ( ... )
}
```

> 🚫 **Critical:** `motion.div`, `AnimatePresence` এবং সব animated component-এ `'use client'` লাগবেই। Framer Motion-কে সবসময় dynamic import করো — initial bundle-এ load নেবে না।

```typescript
// ✅ Framer Motion — সবসময় dynamic import
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false }
)
```

---

## 6. TypeScript Rules

```typescript
// ✅ types/product.ts — সবসময় types/ folder-এ define করো
export interface Product {
  id: number
  name: string
  slug: string
  price: number
  sale_price: number | null   // null use করো, undefined নয়
  images: ProductImage[]
  vendor: Vendor
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

// ✅ Component props-এ সবসময় interface use করো
interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'horizontal'
  onAddToCart?: (product: Product) => void
  className?: string   // সব component-এ className pass করার option রাখো
}

// ❌ কখনো any use করবে না
const product: any = ...           // ❌
function doSomething(data: any) {} // ❌

// ✅ unknown use করো, তারপর type guard
function parseResponse(data: unknown): Product {
  return ProductSchema.parse(data) // Zod validates and types
}
```

**Generic API Response Types:**

```typescript
// types/api.ts
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
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

---

## 7. Styling — Tailwind Rules

**Class Organization Order:**

```typescript
// ✅ সঠিক order
className="
  flex items-center gap-3          // Layout
  w-full max-w-sm                  // Sizing
  p-4 m-2                          // Spacing
  bg-white border border-gray-200 rounded-xl  // Visual
  text-sm font-medium text-gray-700           // Typography
  shadow-md                                   // Effects
  transition-all duration-200                 // Animation
  hover:shadow-lg hover:border-primary-300    // States
  md:flex-row                                 // Responsive
"
```

**`cn()` Utility — সবসময় use করো:**

```typescript
// lib/utils/cn.ts
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Component-এ use করার উপায়
function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all',
        variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
        variant === 'ghost'   && 'bg-transparent text-gray-600 hover:bg-gray-100',
        className   // external className always last
      )}
      {...props}
    />
  )
}
```

**Responsive Rules (Mobile-First):**

| Breakpoint | Tailwind Prefix | Target |
|-----------|----------------|--------|
| Default (no prefix) | — | Mobile first (< 640px) |
| 640px+ | `sm:` | Large phones |
| 768px+ | `md:` | Tablet |
| 1024px+ | `lg:` | Laptop/Desktop |
| 1280px+ | `xl:` | Large desktop |

> 📱 সবসময় mobile layout দিয়ে শুরু করো। `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` — এই pattern follow করো।

---

## 8. State Management

**কোন state কোথায় রাখবে:**

| State Type | Tool | Example |
|-----------|------|---------|
| Server data (API response) | React Query | Products, orders, reviews |
| Cart items | Zustand (`cartStore`) | items, coupon, totals |
| Auth user | Zustand (`authStore`) | user, isAuthenticated |
| UI state | Zustand (`uiStore`) | isCartOpen, isMobileNavOpen |
| Form state | react-hook-form | Checkout, login, review forms |
| Local component state | `useState` | Selected variant, tab index |
| URL state | `useSearchParams` | Filters, sort, page number |

**Zustand Store Access Pattern:**

```typescript
'use client'

// ✅ Selector দিয়ে subscribe করো — unnecessary re-render বাঁচে
function CartIcon() {
  const totalItems = useCartStore(state => state.totalItems())
  return <span>{totalItems}</span>
}

// ❌ পুরো store subscribe করলে সব update-এ re-render হয়
const store = useCartStore()  // ❌ avoid

// ✅ Multiple values নিতে হলে — shallow compare
import { useShallow } from 'zustand/react/shallow'

const { items, clearCart } = useCartStore(useShallow(state => ({
  items: state.items,
  clearCart: state.clearCart,
})))
```

**Cart Store — `skipHydration` Pattern (SSR Fix):**

> ⚠️ **Critical:** Zustand `persist` middleware localStorage use করে যা SSR-এ নেই। `skipHydration: true` ছাড়া hydration mismatch error আসবে।

```typescript
// lib/stores/cart.store.ts
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'mve-cart',
      skipHydration: true,  // ← MANDATORY for SSR
    }
  )
)
```

```typescript
// ✅ providers/CartProvider.tsx — root layout-এ wrap করো
'use client'
import { useEffect } from 'react'

export function CartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // localStorage is only available client-side — rehydrate after mount
    useCartStore.persist.rehydrate()
  }, [])
  return <>{children}</>
}

// app/layout.tsx — CartProvider দিয়ে wrap করো
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            {children}
          </CartProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

**ISR + React Query `initialData` Pattern (Duplicate Fetch বাঁচাও):**

```typescript
// ✅ Server Component — ISR data fetch করে pass করে
export default async function ProductsPage() {
  const initialProducts = await serverFetch('/customer/products')
  return <ProductList initialData={initialProducts} />
}

// ✅ Client Component — ISR data as initialData (no duplicate fetch, no loading flash)
'use client'
function ProductList({ initialData }: { initialData: PaginatedResponse<Product> }) {
  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: productApi.getAll,
    initialData,       // SSR data use করবে, fresh fetch-এর আগে
    staleTime: 60_000, // 1 minute
  })
}
```

**Real-time Stock — ISR Conflict Fix:**

> ⚠️ Product detail page ISR revalidate: 60s। Flash sale বা limited stock-এ 60s অনেক বেশি — user out-of-stock product রাখতে পারবে। Stock/price আলাদাভাবে client-side fresh fetch করো।

```typescript
// ✅ Product detail page-এ stock সবসময় fresh fetch
function AddToCartSection({ product }: { product: Product }) {
  const { data: stock } = useQuery({
    queryKey: ['stock', product.id],
    queryFn: () => productApi.getStock(product.id),
    staleTime: 0,              // Always fresh
    refetchInterval: 30_000,   // Poll every 30s
  })

  const isOutOfStock = stock?.status === 'out_of_stock'

  return (
    <Button disabled={isOutOfStock} onClick={handleAddToCart}>
      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
    </Button>
  )
}
```

---

## 9. API Integration & Hooks

**API Layer Structure:**

```typescript
// lib/api/products.ts
import { apiClient } from './client'
import { ProductSchema } from '@/lib/validators/product'

export const productApi = {
  getBySlug: async (slug: string): Promise<Product> => {
    const res = await apiClient.get(`/customer/products/${slug}`)
    return ProductSchema.parse(res.data.data)
  },

  getAll: async (filters?: ProductFilters) => {
    const res = await apiClient.get('/customer/products', { params: filters })
    return ProductListSchema.parse(res.data)
  },

  // ✅ Real-time stock endpoint
  getStock: async (productId: number) => {
    const res = await apiClient.get(`/customer/products/${productId}/stock`)
    return res.data.data as { status: 'in_stock' | 'low_stock' | 'out_of_stock'; count: number }
  },
}
```

**React Query Hook Pattern:**

```typescript
// hooks/useProduct.ts
import { useQuery } from '@tanstack/react-query'

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getBySlug(slug),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    enabled: !!slug,
  })
}

// hooks/useInfiniteProducts.ts — TanStack Query v5 pattern
export function useInfiniteProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: ['infinite-products', filters],
    queryFn: ({ pageParam }) =>
      productApi.getAll({ ...filters, page: pageParam }),
    initialPageParam: 1,            // ← v5 breaking change: required
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    staleTime: 5 * 60 * 1000,
  })
}
```

**Search Debounce — Correct Pattern:**

```typescript
// ✅ useDebounce hook দিয়ে করো (stale closure avoid হয়)
// hooks/useSearch.ts
export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300)  // hooks/useDebounce.ts

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => productApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
    staleTime: 60_000,
  })
}

// ❌ useEffect-এ debounce করলে stale closure হয়
useEffect(() => {
  const timer = setTimeout(() => fetchResults(query), 300) // ❌
  return () => clearTimeout(timer)
}, [query])
```

**Mutation Pattern (optimistic সহ):**

```typescript
// hooks/useCart.ts
export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cartApi.addItem,

    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previous = queryClient.getQueryData(['cart'])
      queryClient.setQueryData(['cart'], (old: any) => ({
        ...old,
        items: [...(old?.items ?? []), { ...newItem, id: Date.now() }],
      }))
      return { previous }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart!')
    },

    onError: (err, _, context) => {
      queryClient.setQueryData(['cart'], context?.previous)
      toast.error('Failed to add to cart')
    },
  })
}
```

**SSLCommerz Payment Status — Polling Pattern:**

```typescript
// Payment করে return করার পর order status poll করো
// app/(account)/account/orders/[orderNumber]/confirmation/_components/PaymentStatus.tsx
'use client'

export function PaymentStatus({ orderId }: { orderId: number }) {
  const [retries, setRetries] = useState(0)
  const MAX_RETRIES = 10

  const { data: status } = useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () => paymentApi.getStatus(orderId),
    // Poll every 3s, stop after 10 retries (30s total)
    refetchInterval: retries < MAX_RETRIES ? 3_000 : false,
    onSuccess: (data) => {
      if (data.status === 'paid' || data.status === 'failed') {
        setRetries(MAX_RETRIES) // Stop polling
      } else {
        setRetries(r => r + 1)
      }
    },
  })

  if (status?.status === 'paid') return <OrderConfirmation />
  if (status?.status === 'failed') return <PaymentRetry orderId={orderId} />
  return <PaymentPending retriesLeft={MAX_RETRIES - retries} />
}
```

---

## 10. Error & Loading States

> ⚠️ **Rule:** প্রতিটা async component-এ ৩টা state থাকতে হবে — Loading (skeleton), Error (user-friendly), Empty (no results)।

**Loading — Skeleton Pattern:**

```typescript
// ✅ loading.tsx — Next.js automatically uses this
export default function Loading() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

// ✅ Skeleton dimensions MUST match real component dimensions
```

**Granular Error Boundary — Per Section:**

> ⚠️ Global `app/error.tsx` থাকলেও, payment form বা product grid-এর জন্য granular error boundary রাখতে হবে। একটা payment form error পুরো page crash করবে না।

```typescript
// ✅ Section-level error boundary
'use client'
import { ErrorBoundary } from 'react-error-boundary'

function CheckoutPage() {
  return (
    <div>
      <OrderSummary /> {/* safe section */}

      <ErrorBoundary
        fallback={
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-red-700">Payment form failed to load.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        }
      >
        <StripePaymentForm />  {/* isolated — crash এখানেই থামবে */}
      </ErrorBoundary>
    </div>
  )
}

// ✅ Product grid-এর জন্যও আলাদা boundary
<ErrorBoundary fallback={<ProductGridError />}>
  <ProductGrid filters={filters} />
</ErrorBoundary>
```

**React Query Error Handling:**

```typescript
const { data, isLoading, error, isError } = useProduct(slug)

if (isLoading) return <ProductSkeleton />
if (isError)   return <ErrorState message={error.message} />
if (!data)     return <EmptyState title="Product not found" />

return <ProductDetail product={data} />
```

---

## 11. Authentication Pattern

> ⚠️ **Critical:** Auth API call সরাসরি store থেকে করবে না। আলাদা service layer ব্যবহার করো — error handling, token rotation, interceptor সব clean থাকে।

```typescript
// ❌ Store-এ directly call নয়
await authStore.login(email, password)

// ✅ Service layer → store update
const { user } = await authService.login(email, password)
authStore.setUser(user)
```

**Login Flow:**

```typescript
// lib/api/auth.ts
export const authService = {
  login: async (email: string, password: string) => {
    // Next.js API route-এ POST — httpOnly cookie set করে
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new ValidationError(err.errors ?? {})
    }
    return res.json() as Promise<{ user: User }>
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    useAuthStore.getState().clearUser()
    broadcastAuthEvent('logout')
  },
}

// ✅ Login form-এ service layer use
const onSubmit = async (data: LoginFormData) => {
  try {
    const { user } = await authService.login(data.email, data.password)
    useAuthStore.getState().setUser(user)
    router.push(returnUrl || '/')
  } catch (error) {
    if (error instanceof ValidationError) {
      Object.entries(error.errors).forEach(([field, messages]) => {
        setError(field as keyof LoginFormData, { message: messages[0] })
      })
    }
  }
}
```

**Auth Store — শুধু state রাখে, API call নয়:**

```typescript
// lib/stores/auth.store.ts
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  clearUser: () => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  refreshUser: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const { user } = await res.json()
        set({ user, isAuthenticated: true })
      }
    } catch { set({ user: null, isAuthenticated: false }) }
  },
}))
```

**Protected Routes — Middleware:**

```typescript
// middleware.ts
const protectedPaths = ['/account', '/checkout']
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  if (authPaths.some(p => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  if (protectedPaths.some(p => pathname.startsWith(p)) && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}
```

---

## 12. Image Optimization

**`next.config.ts` Configuration:**

```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.mve.com' },
    { protocol: 'http',  hostname: 'localhost', port: '8000' },
  ],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [64, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
}
```

**Image Size Standards:**

| Context | Dimensions | `sizes` Prop | `priority` |
|---------|-----------|-------------|-----------|
| Product card thumbnail | 400×400 | `(max-width: 768px) 50vw, 25vw` | `index < 4` |
| Product gallery main | 800×800 | `(max-width: 768px) 100vw, 50vw` | `true` |
| Product gallery thumb | 150×150 | `80px` | `false` |
| Hero banner | 1920×600 | `100vw` | `true` |
| Category image | 400×300 | `(max-width: 768px) 50vw, 25vw` | `false` |
| Blog image | 800×450 | `(max-width: 768px) 100vw, 66vw` | `false` |
| Avatar | 80×80 | `40px` | `false` |

**Usage Pattern:**

```typescript
// ✅ Product card — correct image setup
<Image
  src={product.images[0]?.url ?? '/images/placeholder.png'}
  alt={product.name}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={product.images[0]?.blur_data_url ?? FALLBACK_BLUR}
  priority={index < 4}   // First row gets priority (LCP)
  sizes="(max-width: 768px) 50vw, 25vw"
  className="object-cover w-full h-full"
/>

// Fallback blur — 10×10 gray placeholder
const FALLBACK_BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8/OBvPQMRgHFgYGAA+A8A3gAI/gAAAABJRU5ErkJggg=='

// ❌ কখনো width/height ছাড়া Image use করবে না (CLS হবে)
<Image src={url} alt="..." />  // ❌
```

---

## 13. Search & Filter Pattern

```typescript
// URL state দিয়ে filter manage করো — shareable, bookmarkable
'use client'

export function useProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const filters: ProductFilters = {
    q:        searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    min:      Number(searchParams.get('min') ?? 0),
    max:      Number(searchParams.get('max') ?? Infinity),
    sort:     (searchParams.get('sort') ?? 'newest') as SortOption,
    page:     Number(searchParams.get('page') ?? 1),
  }

  function updateFilter(key: keyof ProductFilters, value: string | number) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, String(value))
    else params.delete(key)
    params.delete('page') // Reset page on filter change
    router.push(`${pathname}?${params.toString()}`)
  }

  return { filters, updateFilter }
}

// ✅ Search input — debounce দিয়ে URL update
function SearchInput() {
  const { filters, updateFilter } = useProductFilters()
  const [localQuery, setLocalQuery] = useState(filters.q)
  const debouncedQuery = useDebounce(localQuery, 300)

  useEffect(() => {
    updateFilter('q', debouncedQuery)
  }, [debouncedQuery])

  return <Input value={localQuery} onChange={e => setLocalQuery(e.target.value)} />
}
```

---

## 14. Component Reference — Layout

### `<Header />`

**Path:** `components/layout/Header.tsx`
**Type:** Server + Client (hybrid)

Sticky header — logo, search bar, category mega menu, cart icon, user menu।

```typescript
// Cart badge — Cart count-এর জন্য Client Component wrapper
'use client'
function CartBadge() {
  const count = useCartStore(s => s.totalItems())
  return <span className="...">{count}</span>
}
```

---

### `<Footer />`

**Path:** `components/layout/Footer.tsx`
**Type:** Server Component

| Prop | Type | Default |
|------|------|---------|
| — | — | No props |

- Mobile: accordion sections (expandable)
- Desktop: 4-column grid (links, social, newsletter, payment icons)
- Always server component — no interactivity

---

### `<MobileNav />`

**Path:** `components/layout/MobileNav.tsx`
**Type:** Client

Full-screen drawer — mobile-এ hamburger button থেকে open হয়।

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `isOpen` | `boolean` | ✅ | `uiStore.isMobileNavOpen` |
| `onClose` | `() => void` | ✅ | — |

---

### `<MegaMenu />`

**Path:** `components/layout/MegaMenu.tsx`
**Type:** Client

Desktop navigation — hover-এ category mega menu dropdown। Mobile-এ `MobileNav`-এর ভেতরে।

| Prop | Type | Required |
|------|------|---------|
| `categories` | `Category[]` | ✅ |

- Categories server-এ fetch হয়, `Header`-এ pass হয়, `MegaMenu` client component

---

### `<SearchOverlay />`

**Path:** `components/layout/SearchOverlay.tsx`
**Type:** Client

- Mobile: full-screen overlay with keyboard
- Desktop: modal overlay with search input
- `useSearch()` hook দিয়ে debounced results দেখাবে

| Prop | Type | Required |
|------|------|---------|
| `isOpen` | `boolean` | ✅ |
| `onClose` | `() => void` | ✅ |

---

### `<Container />`

**Path:** `components/layout/Container.tsx`
**Type:** Server

Max-width wrapper — সব page-এ use করতে হবে।

| Prop | Type | Default |
|------|------|---------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` |
| `className` | `string` | optional |

```typescript
// xl = 1280px, lg = 1024px, md = 768px, sm = 640px
```

### `<Breadcrumb />`

**Path:** `components/ui/Breadcrumb.tsx` (shared UI)
**Type:** Server / Client

- Mobile: horizontally scrollable (overflow-x: auto)
- Desktop: full trail

| Prop | Type | Required |
|------|------|---------|
| `items` | `{ label: string; href?: string }[]` | ✅ |

```typescript
// ✅ JSON-LD BreadcrumbList সহ use করো
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Electronics', href: '/categories/electronics' },
    { label: 'Phones' },
  ]}
/>
```

---

## 15. Component Reference — Product

### `<ProductCard />`

**Path:** `components/product/ProductCard.tsx`
**Type:** Client

সবচেয়ে বেশি ব্যবহৃত component। Homepage, category page, search — সব জায়গায়।

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `product` | `Product` | ✅ | — |
| `variant` | `'default' \| 'compact' \| 'horizontal'` | optional | default: `'default'` |
| `priority` | `boolean` | optional | First 4 cards: `true` (LCP) |
| `className` | `string` | optional | — |

```typescript
// ✅ Usage
<ProductCard product={product} priority={index < 4} />

// ✅ Quick add to cart: hover-এ desktop, always visible on mobile
// ✅ image-এ priority first row-এ (LCP optimization)
// ✅ PriceDisplay, StockBadge, RatingStars সব ভেতরে compose করা
```

---

### `<ProductGrid />`

**Path:** `components/product/ProductGrid.tsx`
**Type:** Client

Product list render করে। Infinite scroll বা pagination দুটোই support করে।

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `products` | `Product[]` | ✅ | — |
| `isLoading` | `boolean` | optional | Skeleton দেখায় |
| `variant` | `'grid' \| 'list'` | optional | default: `'grid'` |
| `columns` | `2 \| 3 \| 4` | optional | default: `4` |
| `className` | `string` | optional | — |

```typescript
// Mobile: 2 columns, Desktop: columns prop অনুযায়ী
<ProductGrid
  products={data?.pages.flatMap(p => p.data) ?? []}
  isLoading={isLoading}
  columns={4}
/>
```

---

### `<ProductGallery />`

**Path:** `components/product/ProductGallery.tsx`
**Type:** Client

Dynamic import করতে হবে — heavy Swiper dependency।

```typescript
const ProductGallery = dynamic(
  () => import('@/components/product/ProductGallery'),
  { loading: () => <Skeleton variant="image" className="aspect-square" /> }
)
```

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `images` | `ProductImage[]` | ✅ | — |
| `productName` | `string` | ✅ | alt text generation |

- Mobile: Swiper swipe gesture + pinch-to-zoom
- Desktop: thumbnail strip (left/bottom) + hover zoom on main image

---

### `<VariantSelector />`

**Path:** `components/product/VariantSelector.tsx`
**Type:** Client

Color, size, material selector।

| Prop | Type | Required |
|------|------|---------|
| `variants` | `VariantConfig[]` | ✅ |
| `selected` | `SelectedVariants` | ✅ |
| `onChange` | `(variants: SelectedVariants) => void` | ✅ |

> 📌 Unavailable combinations গ্রে করো। Selected variant-এর summary দেখাও: `"Selected: Size L, Color Red"`

---

### `<PriceDisplay />`

**Path:** `components/product/PriceDisplay.tsx`
**Type:** Server/Client

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `price` | `number` | ✅ | Original price |
| `salePrice` | `number \| null` | optional | Shows discount badge |
| `size` | `'sm' \| 'md' \| 'lg'` | optional | default: `'md'` |

```typescript
// Output example: ৳2,450  ~~৳3,200~~  (-23%)
// Currency: always BDT, use Intl.NumberFormat
const formatted = new Intl.NumberFormat('bn-BD', {
  style: 'currency', currency: 'BDT', maximumFractionDigits: 0
}).format(price)
```

---

### `<StockBadge />`

**Path:** `components/product/StockBadge.tsx`
**Type:** Server/Client

| Prop | Type | Notes |
|------|------|-------|
| `status` | `'in_stock' \| 'low_stock' \| 'out_of_stock'` | Color: green/yellow/red |
| `count` | `number \| null` | low_stock: "Only 3 left!" |

---

### `<RatingStars />`

**Path:** `components/product/RatingStars.tsx`
**Type:** Server/Client

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `rating` | `number` | ✅ | 0–5, supports decimal |
| `reviewCount` | `number` | optional | Shows `(124)` beside stars |
| `size` | `'sm' \| 'md' \| 'lg'` | optional | default: `'sm'` |
| `interactive` | `boolean` | optional | Review form-এ clickable |
| `onChange` | `(rating: number) => void` | optional | `interactive: true` হলে |

---

### `<QuickAddToCart />`

**Path:** `components/product/QuickAddToCart.tsx`
**Type:** Client

ProductCard-এর ভেতরে hover/bottom button।

| Prop | Type | Required |
|------|------|---------|
| `product` | `Product` | ✅ |
| `className` | `string` | optional |

- Variant নেই: directly cart-এ add করো
- Variant আছে: mini modal open করো variant select করতে
- `useAddToCart()` mutation use করো (optimistic update সহ)

---

## 16. Component Reference — Cart

### `<CartDrawer />`

**Path:** `components/cart/CartDrawer.tsx`
**Type:** Client

Desktop: right side slide-out। Mobile: bottom sheet।

| Prop | Type | Notes |
|------|------|-------|
| `isOpen` | `boolean` | `uiStore.isCartDrawerOpen` |
| `onClose` | `() => void` | `uiStore.closeCartDrawer` |

---

### `<CartItem />`

**Path:** `components/cart/CartItem.tsx`
**Type:** Client

Cart-এর একটা item row।

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `item` | `CartItem` | ✅ | — |
| `onQuantityChange` | `(id: number, qty: number) => void` | ✅ | — |
| `onRemove` | `(id: number) => void` | ✅ | — |

- Quantity stepper — `max_quantity` exceed করতে দেবে না
- Remove button-এ confirm নেই (undo toast দেখাবে)
- Vendor name show করবে (multi-vendor grouping-এর জন্য)

---

### `<CartSummary />`

**Path:** `components/cart/CartSummary.tsx`
**Type:** Client

Order summary sidebar — cart page ও checkout page-এ।

| Prop | Type | Required |
|------|------|---------|
| `showCheckoutButton` | `boolean` | optional |
| `showCoupon` | `boolean` | optional |

Displays: subtotal, shipping estimate, discount, tax, total।

---

### `<CartIcon />`

**Path:** `components/cart/CartIcon.tsx`
**Type:** Client

Header-এ cart icon + item count badge।

```typescript
'use client'
export function CartIcon() {
  const totalItems = useCartStore(s => s.totalItems())
  const { openCartDrawer } = useUIStore()

  return (
    <button onClick={openCartDrawer} className="relative">
      <ShoppingCartIcon className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary-600 text-[10px] font-bold text-white flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  )
}
```

---

### `<CouponInput />`

**Path:** `components/cart/CouponInput.tsx`
**Type:** Client

`POST /customer/coupons/validate` — success/error message inline।

| Prop | Type | Notes |
|------|------|-------|
| `appliedCoupon` | `AppliedCoupon \| null` | Applied coupon info |
| `onApply` | `(coupon: AppliedCoupon) => void` | — |
| `onRemove` | `() => void` | — |

---

## 17. Component Reference — Checkout

> 📋 **Checkout Flow:** Step 1: Shipping Address → Step 2: Shipping Method → Step 3: Payment → Step 4: Review & Confirm

### `<CheckoutStepper />`

**Path:** `components/checkout/CheckoutStepper.tsx`
**Type:** Client

| Prop | Type | Notes |
|------|------|-------|
| `currentStep` | `1 \| 2 \| 3 \| 4` | — |
| `steps` | `{ label: string; isCompleted: boolean }[]` | — |

- Mobile: vertical accordion
- Desktop: horizontal stepper

---

### `<AddressForm />`

**Path:** `components/checkout/AddressForm.tsx`
**Type:** Client

Zod schema দিয়ে validate। Auth user-এর saved address auto-populate।

| Prop | Type | Notes |
|------|------|-------|
| `onSubmit` | `(address: Address) => void` | — |
| `initialValues` | `Partial<Address>` | Saved address pre-fill |

---

### `<ShippingMethodPicker />`

**Path:** `components/checkout/ShippingMethodPicker.tsx`
**Type:** Client

`GET /customer/shipping/methods` — address এবং vendor অনুযায়ী available methods।

| Prop | Type | Required |
|------|------|---------|
| `vendorId` | `number` | ✅ |
| `addressId` | `number` | ✅ |
| `selected` | `ShippingMethod \| null` | ✅ |
| `onSelect` | `(method: ShippingMethod) => void` | ✅ |

> Multi-vendor cart-এ প্রতি vendor-এর জন্য আলাদা shipping method picker।

---

### `<PaymentMethodPicker />`

**Path:** `components/checkout/PaymentMethodPicker.tsx`
**Type:** Client

Available payment methods — Stripe, PayPal, SSLCommerz, COD।

| Prop | Type | Required |
|------|------|---------|
| `selected` | `PaymentMethod` | ✅ |
| `onSelect` | `(method: PaymentMethod) => void` | ✅ |

- COD: always show
- Stripe/PayPal/SSLCommerz: config থেকে enabled check করো

---

### `<StripePaymentForm />`

**Path:** `components/checkout/StripePaymentForm.tsx`
**Type:** Client (`ssr: false`)

> ⚠️ **Important:** সবসময় `dynamic(() => import(...), { ssr: false })` দিয়ে load করতে হবে। Stripe SDK browser-only।

```typescript
const StripePaymentForm = dynamic(
  () => import('@/components/checkout/StripePaymentForm'),
  { ssr: false }
)
```

---

### `<OrderReview />`

**Path:** `components/checkout/OrderReview.tsx`
**Type:** Client

Checkout final step — সব details review করে confirm।

| Prop | Type | Required |
|------|------|---------|
| `address` | `Address` | ✅ |
| `shippingMethod` | `ShippingMethod` | ✅ |
| `paymentMethod` | `PaymentMethod` | ✅ |
| `onConfirm` | `() => Promise<void>` | ✅ |
| `isSubmitting` | `boolean` | ✅ |

---

## 18. Component Reference — Content

### `<CountdownTimer />`

**Path:** `components/content/CountdownTimer.tsx`
**Type:** Client

Flash sale countdown।

| Prop | Type | Notes |
|------|------|-------|
| `endTime` | `string \| Date` | ISO 8601 |
| `onExpire` | `() => void` | Auto-refresh sale list |

---

### `<FlashSaleCard />`

**Path:** `components/content/FlashSaleCard.tsx`
**Type:** Client (contains `CountdownTimer`)

| Prop | Type | Required |
|------|------|---------|
| `sale` | `FlashSale` | ✅ |
| `priority` | `boolean` | optional |

- Countdown timer show করবে
- Stock progress bar দেখাবে (`sold / total`)
- Timer expire হলে card disabled হবে

---

### `<BannerSlot />`

**Path:** `components/content/BannerSlot.tsx`
**Type:** Server

`GET /banners/position/{position}` থেকে fetch।

| Prop | Type | Valid Values |
|------|------|-------------|
| `position` | `BannerPosition` | `hero \| sidebar \| category-top \| product-bottom \| footer-above` |

---

### `<BlogCard />`

**Path:** `components/content/BlogCard.tsx`
**Type:** Server / Client

| Prop | Type | Required | Notes |
|------|------|---------|-------|
| `post` | `BlogPost` | ✅ | — |
| `variant` | `'default' \| 'horizontal' \| 'featured'` | optional | default: `'default'` |

---

### `<FaqAccordion />`

**Path:** `components/content/FaqAccordion.tsx`
**Type:** Client

`@headlessui/react` Disclosure component ব্যবহার করো।

| Prop | Type | Required |
|------|------|---------|
| `faqs` | `{ question: string; answer: string }[]` | ✅ |

- JSON-LD `FAQPage` structured data সহ render করো

---

### `<NewsletterForm />`

**Path:** `components/content/NewsletterForm.tsx`
**Type:** Client

`POST /customer/newsletter/subscribe`

| Prop | Type | Notes |
|------|------|-------|
| `variant` | `'inline' \| 'card'` | default: `'inline'` |

- Zod email validation
- Success state after subscribe
- Re-subscribe check

---

## 19. UI Primitives

> এই components গুলো project-wide shared। নতুন করে বানাবে না — এগুলোই use করবো।

| Component | Key Props | Notes |
|-----------|----------|-------|
| `<Button />` | `variant`, `size`, `loading`, `disabled` | variant: primary/secondary/ghost/danger/outline |
| `<Badge />` | `variant`, `size` | variant: success/warning/danger/info/gray |
| `<Modal />` | `isOpen`, `title`, `size`, `onClose` | Mobile: bottom sheet। Desktop: centered |
| `<Skeleton />` | `variant`, `className` | variant: text/image/card/circle |
| `<EmptyState />` | `icon`, `title`, `description`, `action` | Empty cart, no results, no orders |
| `<Input />` | `label`, `error`, `hint`, `leftIcon` | Always use with react-hook-form register |
| `<Select />` | `label`, `options`, `error` | Use `@headlessui/react` Listbox |
| `<Tabs />` | `tabs`, `activeTab`, `onChange` | Use `@headlessui/react` Tab |
| `<Spinner />` | `size`, `className` | Inline loading indicator |
| `<Pagination />` | `currentPage`, `totalPages`, `onPageChange` | URL params-এ page sync করবে |

**Button Usage:**

```typescript
// ✅ সঠিক usage
<Button variant="primary" size="lg">Add to Cart</Button>
<Button variant="ghost" loading={isPending}>Processing...</Button>
<Button variant="danger" onClick={handleDelete}>Cancel Order</Button>

// ❌ কখনো bare <button> use করবে না
<button className="bg-indigo-600 px-4...">...</button>  // ❌
```

---

## 20. Hooks Reference

| Hook | File | Purpose |
|------|------|---------|
| `useCart()` | `hooks/useCart.ts` | Cart mutations (add, update, remove) |
| `useAuth()` | `hooks/useAuth.ts` | Auth state, login, logout |
| `useProducts()` | `hooks/useProducts.ts` | Product list with filters |
| `useProduct()` | `hooks/useProduct.ts` | Single product by slug |
| `useInfiniteProducts()` | `hooks/useInfiniteProducts.ts` | Infinite scroll product list |
| `useCategories()` | `hooks/useCategories.ts` | Category tree |
| `useOrders()` | `hooks/useOrders.ts` | Order list (auth required) |
| `useReviews()` | `hooks/useReviews.ts` | Product reviews |
| `useCoupons()` | `hooks/useCoupons.ts` | Coupon validate & apply |
| `useSearch()` | `hooks/useSearch.ts` | Debounced search |
| `useShipping()` | `hooks/useShipping.ts` | Shipping methods |
| `useMediaQuery()` | `hooks/useMediaQuery.ts` | Responsive breakpoint detection |
| `useDebounce()` | `hooks/useDebounce.ts` | Value debouncing |

**`useMediaQuery` Implementation:**

```typescript
// hooks/useMediaQuery.ts
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Usage
const isMobile = useMediaQuery('(max-width: 767px)')
```

**`useDebounce` Implementation:**

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

---

## 21. Optimistic Updates Pattern

Cart add/remove, review vote — এগুলোতে optimistic update mandatory।

```typescript
// Pattern: onMutate → optimistic → onError rollback → onSettled sync
const mutation = useMutation({
  mutationFn: api.doSomething,

  onMutate: async (variables) => {
    // 1. Cancel in-flight refetches
    await queryClient.cancelQueries({ queryKey: ['target-key'] })
    // 2. Snapshot previous value
    const previous = queryClient.getQueryData(['target-key'])
    // 3. Optimistically update
    queryClient.setQueryData(['target-key'], (old) => ({
      ...old,
      // your optimistic change
    }))
    return { previous }  // must return for rollback
  },

  onError: (err, variables, context) => {
    // Rollback to previous value
    queryClient.setQueryData(['target-key'], context?.previous)
    toast.error('Something went wrong')
  },

  onSettled: () => {
    // Always sync with server after success or error
    queryClient.invalidateQueries({ queryKey: ['target-key'] })
  },
})
```

---

## 22. Form Pattern

সব form-এ **react-hook-form + Zod** use করতে হবে।

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Step 1: Schema define করো (lib/validators/ এ)
const CheckoutSchema = z.object({
  name:     z.string().min(2, 'Name is required'),
  phone:    z.string().regex(/^01[3-9]\d{8}$/, 'Invalid BD phone number'),
  address:  z.string().min(10, 'Address too short'),
  district: z.string().min(2, 'Select district'),
})
type CheckoutFormData = z.infer<typeof CheckoutSchema>

// Step 2: useForm hook
const {
  register,
  handleSubmit,
  setError,
  formState: { errors, isSubmitting }
} = useForm<CheckoutFormData>({
  resolver: zodResolver(CheckoutSchema),
})

// Step 3: onSubmit — Laravel 422 errors form fields-এ map করো
const onSubmit = async (data: CheckoutFormData) => {
  try {
    await api.placeOrder(data)
    router.push('/orders/confirmation')
  } catch (error) {
    if (error instanceof ValidationError) {
      Object.entries(error.errors).forEach(([field, messages]) => {
        setError(field as keyof CheckoutFormData, { message: messages[0] })
      })
    }
  }
}

// Step 4: JSX
<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register('name')} error={errors.name?.message} label="Full Name" />
  <Button type="submit" loading={isSubmitting}>Place Order</Button>
</form>
```

---

## 23. Mobile-Specific Patterns

**Component Behavior by Breakpoint:**

| Element | Mobile (< 768px) | Desktop (≥ 1024px) |
|---------|-----------------|-------------------|
| Navigation | Hamburger → full-screen drawer | Horizontal navbar + mega menu |
| Search | Full-screen overlay | Inline input in header |
| Filter sidebar | Bottom sheet (overlay) | Fixed 260px left panel |
| Product grid | 2 columns | 4 columns |
| Product images | Swipeable carousel (Swiper) | Thumbnail strip + hover zoom |
| Cart preview | Full-page slide-up | Slide-out drawer (right) |
| Checkout steps | Vertical accordion | Horizontal stepper |
| CTA buttons | Fixed bottom bar (z-30) | Inline in content |
| Data tables | Card layout (stacked) | Full columns |
| Modals | Bottom sheet (slide up) | Centered with backdrop |
| Footer | Accordion sections | 4-column grid |
| Breadcrumb | Scrollable horizontal | Full trail |

**Fixed Bottom Bar (Mobile shop pages):**

```
┌──────────────────────────────────────────┐
│  [🏠 Home] [📂 Categories] [🔍 Search]  │
│  [❤️ Wishlist] [🛒 Cart (3)]            │
└──────────────────────────────────────────┘
```

- Visible on all shop pages (**not** checkout/auth pages)
- Cart badge shows item count
- Active tab highlighted with primary color
- `z-30` — modals/drawers-এর নিচে

**Guest Session ID — SSR Safe:**

```typescript
// ✅ typeof window check — MANDATORY
function getGuestSessionId(): string | null {
  if (typeof window === 'undefined') return null  // SSR safe
  let id = localStorage.getItem('mve_guest_session')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('mve_guest_session', id)
  }
  return id
}

// ❌ Guard ছাড়া localStorage use করলে SSR crash হবে
const id = localStorage.getItem('mve_guest_session')  // ❌
```

---

## 24. SEO Pattern

```typescript
// ✅ app/products/[slug]/page.tsx — generateMetadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await serverFetch<Product>(`/customer/products/${params.slug}`)

  return {
    title: `${product.name} - ৳${product.price} | MVE`,
    description: product.short_description,
    alternates: { canonical: `https://www.mve.com/products/${params.slug}` },
    openGraph: {
      title: product.name,
      images: [{ url: product.images[0]?.url }],
    },
  }
}

// ✅ JSON-LD — Product page
function ProductJsonLd({ product }: { product: Product }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    offers: {
      '@type': 'Offer',
      price: product.sale_price ?? product.price,
      priceCurrency: 'BDT',
      availability: product.stock_status === 'out_of_stock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ✅ JSON-LD — BreadcrumbList
function BreadcrumbJsonLd({ items }: { items: { label: string; href: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: `https://www.mve.com${item.href}`,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

---

## 25. Internationalization (i18n)

> Hard-coded string কোনো component-এ রাখা যাবে না। সব user-facing text translation key দিয়ে হবে।

**Setup:**

```typescript
// next.config.ts
const nextConfig = {
  i18n: {
    locales: ['en', 'bn'],
    defaultLocale: 'en',
  },
}
```

**Usage Pattern:**

```typescript
// ✅ next-intl বা next-i18next use করো
import { useTranslations } from 'next-intl'

function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('product')

  return (
    <div>
      <span>{t('addToCart')}</span>         {/* "Add to Cart" / "কার্টে যোগ করুন" */}
      <span>{t('outOfStock')}</span>        {/* "Out of Stock" / "স্টক নেই" */}
      <span>{t('onlyLeft', { count: 3 })}</span>  {/* "Only 3 left!" */}
    </div>
  )
}

// messages/en.json
{
  "product": {
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock",
    "onlyLeft": "Only {count} left!"
  }
}

// messages/bn.json
{
  "product": {
    "addToCart": "কার্টে যোগ করুন",
    "outOfStock": "স্টক নেই",
    "onlyLeft": "মাত্র {count}টি বাকি!"
  }
}
```

**Bengali Font — Async Load:**

```typescript
// app/layout.tsx
const notoBengali = localFont({
  src: '../public/fonts/NotoSansBengali-Variable.woff2',
  display: 'swap',
  variable: '--font-bengali',
  preload: false, // Async load — initial bundle-এ নেবে না
})
```

---

## 26. Accessibility Rules

| Rule | Implementation |
|------|---------------|
| Contrast ratio | WCAG 2.1 AA minimum (4.5:1 for text) |
| Keyboard navigation | সব interactive element Tab দিয়ে reachable |
| Focus indicator | `focus:ring-2 focus:ring-primary-500` সব interactive element-এ |
| Screen reader | `aria-label`, `aria-expanded`, `aria-live` correct use |
| Image alt text | সব `<Image>` component-এ descriptive `alt` — empty string only for decorative |
| Language | `<html lang="en">` default, Bengali content-এ `lang="bn"` attribute |
| Skip navigation | `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` |
| Modal focus trap | `@headlessui/react` Dialog use করো — focus trap built-in |
| Form labels | সব input-এ visible `<label>` বা `aria-label` |
| Error messages | `aria-describedby` দিয়ে input-এর সাথে link করো |

```typescript
// ✅ Accessible button
<button
  aria-label={`Add ${product.name} to cart`}
  aria-pressed={isAdded}
  className="... focus:ring-2 focus:ring-primary-500 focus:outline-none"
  onClick={handleAdd}
>
  <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
</button>

// ✅ Loading state — screen reader announcement
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <ProductGrid products={data} />}
</div>
```

---

## 27. Environment Variables

```bash
# .env.local

# ─── Public (browser-এ exposed — NEXT_PUBLIC_ prefix) ───
NEXT_PUBLIC_API_URL=https://api.mve.com/api/v1
NEXT_PUBLIC_CDN_URL=https://cdn.mve.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxx
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ─── Server-only (NEVER NEXT_PUBLIC_) ───────────────────
BACKEND_URL=https://api.mve.com/api/v1   # SSR/RSC direct backend call
REVALIDATION_SECRET=your-secret-key      # ISR webhook secret
STRIPE_SECRET_KEY=sk_live_xxx            # Payment processing
```

| Variable | Exposed to Browser | Description |
|----------|-------------------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Client-side Axios base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes | Stripe Elements |
| `BACKEND_URL` | ❌ No | Server-side direct API call |
| `REVALIDATION_SECRET` | ❌ No | ISR webhook auth |
| `STRIPE_SECRET_KEY` | ❌ No | Never expose to client |

> 🚫 **Rule:** `NEXT_PUBLIC_` prefix যে variable-এ আছে সেটা bundle-এ visible। Secret key কখনো `NEXT_PUBLIC_` দিয়ে শুরু করবে না।

---

## 28. Developer Checklist

প্রতিটা component বানানোর পর এই checklist follow করবে:

### Before PR Submit

| Check | Rule |
|-------|------|
| ☐ TypeScript | No `any` type। Strict mode pass। |
| ☐ Props interface | সব props-এ TypeScript type আছে। |
| ☐ Loading state | Skeleton আছে এবং dimension match করে। |
| ☐ Error state | Granular error boundary আছে সহ fallback UI। |
| ☐ Empty state | No data হলে `EmptyState` দেখায়। |
| ☐ Mobile responsive | 640px, 768px, 1024px-এ test করা। |
| ☐ `className` prop | Externally overridable। |
| ☐ Zod validation | Form ও API response-এ Zod schema আছে। |
| ☐ API error handle | 422 errors form fields-এ map করা। |
| ☐ `'use client'` correct | Unnecessarily client করা হয়নি। |
| ☐ Image alt text | সব Image-এ descriptive `alt` আছে। |
| ☐ SSR safe | `window`/`localStorage` access `typeof` check দিয়ে। |
| ☐ `cn()` used | Tailwind class conflict নেই। |
| ☐ Query key descriptive | `['product', slug]` format। |
| ☐ No inline styles | সব styling Tailwind দিয়ে। |
| ☐ Auth via service layer | `authStore.login()` directly কল নেই। |
| ☐ Stock fresh fetch | Add-to-cart-এ stock `staleTime: 0` দিয়ে fresh। |
| ☐ `initialData` from ISR | Server fetch → Client Query duplicate নেই। |
| ☐ Framer Motion dynamic | `dynamic(() => import('framer-motion'), { ssr: false })` |
| ☐ i18n keys | Hard-coded user-facing string নেই। |
| ☐ Accessibility | `aria-*`, focus ring, keyboard nav tested। |
| ☐ `initialPageParam` | `useInfiniteQuery`-এ v5 required param আছে। |

> 🎯 **Golden Rule:** যেকোনো component দেখলে আরেকজন developer যেন বুঝতে পারে — কোনো context ছাড়াই। Props clear, naming obvious, loading/error/empty state সবসময় present।

---

*MVE Development Team · Component Development Guide v1.1 · March 2026*
*Internal document — do not share externally*
