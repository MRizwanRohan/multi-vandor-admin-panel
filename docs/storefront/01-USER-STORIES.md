# MVE Storefront — User Stories

> **Project:** MVE Multi-Vendor E-commerce — Customer Storefront (Next.js 14)
> **Version:** 1.0
> **Date:** March 5, 2026
> **Prepared by:** MVE Development Team

---

## Table of Contents

1. [Personas](#1-personas)
2. [Epic 1 — Browsing & Discovery](#2-epic-1--browsing--discovery)
3. [Epic 2 — Product Experience](#3-epic-2--product-experience)
4. [Epic 3 — Cart & Checkout](#4-epic-3--cart--checkout)
5. [Epic 4 — Authentication & Account](#5-epic-4--authentication--account)
6. [Epic 5 — Orders & Tracking](#6-epic-5--orders--tracking)
7. [Epic 6 — Reviews & Social Proof](#7-epic-6--reviews--social-proof)
8. [Epic 7 — Promotions & Deals](#8-epic-7--promotions--deals)
9. [Epic 8 — Content & Information](#9-epic-8--content--information)
10. [Epic 9 — Search & Filtering](#10-epic-9--search--filtering)
11. [Epic 10 — Payments & Refunds](#11-epic-10--payments--refunds)
12. [Acceptance Criteria Summary](#12-acceptance-criteria-summary)

---

## 1. Personas

### 👤 Rina (Primary — Casual Shopper)
- **Age:** 24 | **Location:** Dhaka | **Device:** Android phone (4G)
- **Behavior:** Browses during commute, impulse buyer, values visuals & reviews
- **Pain points:** Slow loading on mobile data, confusing checkout, hidden costs

### 👤 Kamal (Secondary — Value-Conscious Buyer)
- **Age:** 35 | **Location:** Chittagong | **Device:** Desktop + phone
- **Behavior:** Compares prices across vendors, hunts coupons, reads reviews carefully
- **Pain points:** No way to compare vendor pricing, hard to find best deals

### 👤 Tasnim (Tertiary — First-Time Online Buyer)
- **Age:** 45 | **Location:** Rajshahi | **Device:** Low-end Android
- **Behavior:** Needs guidance, prefers bKash/Nagad, fear of online fraud
- **Pain points:** Trust signals missing, unfamiliar checkout flow

### 👤 Arif (Guest Buyer)
- **Age:** 28 | **Location:** Sylhet | **Device:** iPhone
- **Behavior:** Quick purchase, doesn't want to create account, one-time buyer
- **Pain points:** Forced registration, cart not persistent

---

## 2. Epic 1 — Browsing & Discovery

### US-1.1 — Homepage Hero Section
**As a** visitor,
**I want to** see a visually compelling hero banner carousel on the homepage,
**so that** I can discover current promotions and featured collections.

**Acceptance Criteria:**
- Hero banners load from `/api/v1/banners/hero` endpoint
- Auto-rotate every 5 seconds with pause on hover
- Each banner has CTA button linking to promotion/category/product
- Mobile: single slide with swipe gesture
- Skeleton loader shows while fetching
- LCP image uses `priority` prop (< 2.5s)

### US-1.2 — Featured Products
**As a** shopper,
**I want to** see featured/trending products on the homepage,
**so that** I can quickly find popular items without browsing.

**Acceptance Criteria:**
- Products fetched from `/api/v1/customer/products/featured`
- Grid layout: 4 columns desktop, 2 columns mobile
- Each card shows: image, name, price (sale price if applicable), vendor name, rating
- "Add to Cart" quick action on hover (desktop) / tap (mobile)
- "View All" link to products listing page

### US-1.3 — Category Navigation
**As a** shopper,
**I want to** browse products by categories from the navigation,
**so that** I can find items in a specific category quickly.

**Acceptance Criteria:**
- Category tree fetched from `/api/v1/customer/categories`
- Desktop: mega menu dropdown showing parent → children → grandchildren
- Mobile: expandable accordion in hamburger drawer
- Category images/icons displayed
- Product count per category shown
- Clicking a category navigates to `/categories/{slug}`

### US-1.4 — Flash Sale Banner
**As a** shopper,
**I want to** see current flash sales prominently on the homepage,
**so that** I don't miss limited-time deals.

**Acceptance Criteria:**
- Active flash sales from `/api/v1/flash-sales`
- Countdown timer showing remaining time
- Products grid with original price vs flash price
- "Hurry! X items left" urgency indicator
- Upcoming flash sales teaser section
- Auto-refresh when sale ends

### US-1.5 — Multi-Vendor Store Browsing
**As a** shopper,
**I want to** see which vendor sells each product,
**so that** I can choose a trusted seller.

**Acceptance Criteria:**
- Vendor name and logo visible on product cards
- Vendor badge (verified / new) shown
- Clicking vendor name → vendor store page (`/vendors/{slug}`)
- Products sorted by vendor rating optionally

### US-1.6 — Vendor Store Page *(P2 — Sprint 6+)*
**As a** shopper,
**I want to** visit a vendor's dedicated store page,
**so that** I can see all products, ratings, and info for a specific seller.

**Acceptance Criteria:**
- Vendor store page at `/vendors/{slug}`
- Vendor info from `GET /api/v1/customer/vendors/{slug}`
- Vendor header: logo, store name, description, rating, total products
- Products grid filtered to this vendor
- "About" tab with vendor policies and contact
- SEO: JSON-LD Organization schema
- Fallback: if vendor endpoint not available, show error with "Browse all products" CTA

---

## 3. Epic 2 — Product Experience

### US-2.1 — Product Detail Page
**As a** shopper,
**I want to** see complete product details including images, description, variants, and pricing,
**so that** I can make an informed purchase decision.

**Acceptance Criteria:**
- Product fetched from `/api/v1/customer/products/{slug}`
- Image gallery with thumbnail strip (desktop) or swipeable carousel (mobile)
- Zoom on hover (desktop) / pinch-to-zoom (mobile)
- Variant selector (color, size, etc.) from attribute templates
- Price updates dynamically when variant selected
- Stock status: In Stock / Low Stock / Out of Stock
- "Add to Cart" with quantity selector
- Breadcrumb: Home → Category → Subcategory → Product
- SEO: unique title, description, OpenGraph, JSON-LD Product schema

### US-2.2 — Product Variants Selection
**As a** shopper,
**I want to** select product variants (size, color, material),
**so that** I can buy the exact configuration I need.

**Acceptance Criteria:**
- Variant options rendered based on `variant_configs` from API
- Unavailable combinations grayed out
- Selected variant updates: price, stock, SKU, image
- Clear "Selected: Size L, Color Red" summary shown
- Add to cart sends `variant_id`

### US-2.3 — Product Reviews Section
**As a** shopper,
**I want to** read reviews from other buyers on the product page,
**so that** I can trust the product quality before buying.

**Acceptance Criteria:**
- Reviews loaded from `/api/v1/customer/products/{id}/reviews`
- Average rating with star visualization (1-5)
- Rating distribution bar chart (5★: 45%, 4★: 30%, etc.)
- Individual review cards: user name, rating, date, text, images
- Vendor response shown under each review (if exists)
- Pagination / "Load more" for reviews
- Most helpful reviews pinned at top (by vote count)
- Review images in lightbox gallery

### US-2.4 — Related Products
**As a** shopper,
**I want to** see related products below the product detail,
**so that** I can discover similar items.

**Acceptance Criteria:**
- Products from same category displayed
- Same card format as featured products
- 4 items on desktop, horizontal scroll on mobile
- "You may also like" section header

### US-2.5 — Products by Category Page
**As a** shopper,
**I want to** see all products under a specific category,
**so that** I can browse within my area of interest.

**Acceptance Criteria:**
- Products from `/api/v1/customer/products/category/{category}`
- Category banner with name and description
- Filters sidebar (price range, rating, vendor, attributes)
- Sort options: Newest, Price Low→High, Price High→Low, Rating, Popularity
- Infinite scroll or pagination
- Subcategory chips for quick navigation

---

## 4. Epic 3 — Cart & Checkout

### US-3.1 — Add to Cart
**As a** shopper,
**I want to** add products to my cart from any product card or detail page,
**so that** I can collect items for purchase.

**Acceptance Criteria:**
- Guest cart: uses `/api/v1/customer/guest/cart/items` (session-based)
- Auth cart: uses `/api/v1/customer/cart/items`
- Success toast: "Added to cart" with product thumbnail
- Cart icon in header updates item count badge
- Duplicate item increases quantity instead of adding new row
- Variant products require variant selection before adding

### US-3.2 — Cart Management
**As a** shopper,
**I want to** view my cart, update quantities, and remove items,
**so that** I can review before checkout.

**Acceptance Criteria:**
- Cart page shows: product image, name, variant, unit price, quantity, subtotal
- Quantity +/- controls with stock limit validation
- Remove item with confirmation
- "Clear Cart" option
- Cart summary: subtotal, shipping estimate, tax, total
- "Continue Shopping" and "Proceed to Checkout" CTAs
- Empty cart → empty state with "Start Shopping" CTA
- Cart persists on page refresh (localStorage for guest, API for auth)

### US-3.3 — Guest Cart Experience
**As a** guest visitor,
**I want to** add items to cart and checkout without creating an account,
**so that** I can make a quick purchase.

**Acceptance Criteria:**
- Guest cart stored via session ID on backend
- Cart data persisted in localStorage as backup
- At checkout, option to "Continue as Guest" or "Login / Register"
- Guest checkout requires: name, email, phone, shipping address
- After order placed, option to create account with order linked

### US-3.4 — Coupon Application
**As a** shopper,
**I want to** apply a coupon code at checkout,
**so that** I can get a discount on my order.

**Acceptance Criteria:**
- Coupon input field in cart summary section
- "Apply" button validates via `/api/v1/customer/coupons/validate`
- Success: shows discount amount, coupon code badge, updated total
- Error: clear message (expired, minimum not met, usage limit exceeded)
- "Available Coupons" expandable section from `/api/v1/customer/coupons/available`
- One coupon per order
- Remove coupon option

### US-3.5 — Checkout Process
**As a** shopper,
**I want to** enter my shipping address and choose payment method,
**so that** I can complete my purchase.

**Acceptance Criteria:**
- Step 1: Shipping Address (name, phone, address line 1 & 2, city, district, postal code, country)
- Step 2: Shipping Method — options loaded from `GET /api/v1/shipping/methods` (per vendor)
- Step 3: Payment Method (Stripe, PayPal, SSLCommerz, COD)
- Step 4: Order Review (items, shipping, payment, total breakdown)
- Mobile: vertical accordion steps | Desktop: horizontal stepper
- Form validation at each step before proceeding
- Shipping cost calculated via `POST /api/v1/shipping/calculate` with cart items + address
- Order placed via `POST /api/v1/customer/orders` (includes `shipping_method_id` per vendor)
- Saved addresses auto-populated for authenticated users (activation: Sprint 3 — see US-4.6)

### US-3.6 — Multi-Vendor Cart Split
**As a** shopper buying from multiple vendors,
**I want to** see my cart items grouped by vendor,
**so that** I understand shipping will come from different sellers.

**Acceptance Criteria:**
- Cart items grouped under vendor name headers
- Shipping calculated per vendor
- Clear indication: "Your order will be shipped in X packages"
- Each vendor group shows subtotal

---

## 5. Epic 4 — Authentication & Account

### US-4.1 — Customer Registration
**As a** new visitor,
**I want to** create an account with my email,
**so that** I can track orders and save preferences.

**Acceptance Criteria:**
- Registration form: first name, last name, email, phone, password, confirm password
- API: `POST /api/v1/auth/register`
- Client-side validation with Zod
- Server-side error mapping (email taken, etc.)
- Email verification sent after registration
- Auto-login after successful registration
- Guest cart merged to authenticated cart

### US-4.2 — Customer Login
**As a** returning customer,
**I want to** log in with my email and password,
**so that** I can access my account and order history.

**Acceptance Criteria:**
- Login form: email, password, "Remember me" checkbox
- API: `POST /api/v1/auth/login`
- Token stored in httpOnly cookie via Next.js API route
- Redirect to original page after login (returnUrl)
- "Forgot password?" link
- Rate limit feedback (too many attempts)

### US-4.3 — Password Recovery
**As a** customer who forgot my password,
**I want to** reset it via email,
**so that** I can regain access to my account.

**Acceptance Criteria:**
- Step 1: Enter email → `POST /api/v1/auth/forgot-password`
- Step 2: Email with reset link received
- Step 3: Reset form (new password, confirm) → `POST /api/v1/auth/reset-password`
- Success redirect to login with message

### US-4.4 — User Profile
**As a** logged-in customer,
**I want to** view and update my profile information,
**so that** I can keep my details current.

**Acceptance Criteria:**
- View: name, email, phone, avatar
- Edit: first name, last name, phone — `PUT /api/v1/auth/profile`
- Change password with current password verification — `PUT /api/v1/auth/change-password`
- Profile accessible from header dropdown
- API: `GET /api/v1/auth/me` returns current user profile

> **Backend Note:** Profile update and address endpoints are defined in the backend but currently commented out in routes. **Activation target: Sprint 3.** Frontend should implement the UI and show a graceful fallback ("Profile update coming soon") until backend routes are uncommented.

### US-4.6 — Address Book *(P2 — Sprint 6+)*
**As a** logged-in customer,
**I want to** save and manage multiple shipping addresses,
**so that** I can quickly select a saved address at checkout.

**Acceptance Criteria:**
- Address list from `GET /api/v1/customer/addresses` (when activated)
- Add new address: `POST /api/v1/customer/addresses`
- Edit address: `PUT /api/v1/customer/addresses/{id}`
- Delete address: `DELETE /api/v1/customer/addresses/{id}`
- Set default address
- Auto-populate default address in checkout Step 1
- Graceful fallback if endpoint returns 404 (backend not yet activated)

> **Backend Dependency:** Address endpoints are defined but commented out. Will be activated in Sprint 3 (backend) → Sprint 6+ for full storefront integration.

### US-4.5 — Session Management
**As a** logged-in customer,
**I want to** stay logged in across browser sessions,
**so that** I don't have to log in every time.

**Acceptance Criteria:**
- httpOnly cookie with 30-day expiry
- Refresh token rotation on each API call
- Auto-logout on 401 with redirect to login
- "Logout All Devices" option → `POST /api/v1/auth/logout-all`

---

## 6. Epic 5 — Orders & Tracking

### US-5.1 — Order Confirmation
**As a** shopper who just placed an order,
**I want to** see an order confirmation page with order details,
**so that** I know my order was placed successfully.

**Acceptance Criteria:**
- Confirmation page shows: order number, items, total, payment status, estimated delivery
- "Continue Shopping" and "View Order" CTAs
- Confirmation email triggered (backend)
- Cart cleared after successful order

### US-5.2 — Order History
**As a** logged-in customer,
**I want to** view all my past orders,
**so that** I can track deliveries and reorder items.

**Acceptance Criteria:**
- Order list from `GET /api/v1/customer/orders`
- Each order shows: order number, date, status, total, item count
- Status badges: Pending, Processing, Shipped, Delivered, Cancelled
- Click to view order detail
- Sortable by date
- Pagination

### US-5.3 — Order Detail
**As a** customer,
**I want to** see the full details of a specific order,
**so that** I can track its progress and review items.

**Acceptance Criteria:**
- Order detail from `GET /api/v1/customer/orders/{orderNumber}`
- Order timeline (status history)
- Items list with product image, name, quantity, price
- Shipping address and billing address
- Payment method and transaction status
- Shipment tracking: `GET /api/v1/customer/orders/{orderNumber}/tracking`
  - Returns: carrier name, tracking number, tracking URL, status updates
  - If no tracking available: show "Tracking will be available once shipped"
- "Cancel Order" button (if `canBeCancelled`)
- "Write Review" button for delivered items

### US-5.4 — Cancel Order
**As a** customer,
**I want to** cancel a pending order,
**so that** I can change my mind before it's processed.

**Acceptance Criteria:**
- Cancel button visible only when order `canBeCancelled`
- Confirmation dialog with reason selection
- API: `POST /api/v1/customer/orders/{id}/cancel`
- Success message and order status updated to "Cancelled"
- Refund initiated if payment was collected

---

## 7. Epic 6 — Reviews & Social Proof

### US-6.1 — Write a Review
**As a** customer who received a product,
**I want to** leave a review with rating and photos,
**so that** I can share my experience with other shoppers.

**Acceptance Criteria:**
- Check eligibility: `GET /api/v1/customer/products/{id}/can-review`
- Review form: 1-5 star rating, text review, upload images (up to 5)
- Submit: `POST /api/v1/customer/reviews`
- Review appears after admin approval
- "Pending review" status shown to author

### US-6.2 — Manage My Reviews
**As a** customer,
**I want to** edit or delete my reviews,
**so that** I can update my feedback.

**Acceptance Criteria:**
- "My Reviews" page: `GET /api/v1/customer/reviews/my`
- Edit: `PUT /api/v1/customer/reviews/{id}`
- Delete: `DELETE /api/v1/customer/reviews/{id}`
- Review status shown (pending / approved / rejected)

### US-6.3 — Vote on Reviews
**As a** shopper,
**I want to** upvote helpful reviews,
**so that** the best reviews surface to the top.

**Acceptance Criteria:**
- "Helpful" button on each review
- Vote: `POST /api/v1/customer/reviews/{id}/vote`
- Remove vote: `DELETE /api/v1/customer/reviews/{id}/vote`
- Helpfulness count displayed
- One vote per user per review

---

## 8. Epic 7 — Promotions & Deals

### US-7.1 — Flash Sales Page
**As a** deal-hunting shopper,
**I want to** see all active and upcoming flash sales,
**so that** I can plan my purchases around deals.

**Acceptance Criteria:**
- Active flash sales with countdown timers
- Upcoming flash sales with "Notify Me" (future)
- Product cards with original vs flash price & discount percentage
- Flash sale detail page with all included products

### US-7.2 — Available Coupons
**As a** shopper,
**I want to** see available coupons before checkout,
**so that** I can save money on my order.

**Acceptance Criteria:**
- Available coupons from `/api/v1/customer/coupons/available`
- Each coupon shows: code, discount description, min order, expiry
- "Copy Code" button
- Auto-apply on click
- Terms/conditions shown

### US-7.3 — Banner Promotions
**As a** shopper,
**I want to** see promotional banners at various positions on the site,
**so that** I stay informed about ongoing deals.

**Acceptance Criteria:**
- Banners fetched by position: `/api/v1/banners/position/{position}`
- Positions: hero, sidebar, category-top, product-bottom, footer-above
- Click tracking (future analytics)
- Responsive images (different sizes for mobile/desktop)

---

## 9. Epic 8 — Content & Information

### US-8.1 — Blog
**As a** visitor,
**I want to** read blog posts about products, guides, and updates,
**so that** I can learn more about the marketplace.

**Acceptance Criteria:**
- Blog listing from `/api/v1/blog`
- Category filter from `/api/v1/blog/categories`
- Popular posts sidebar from `/api/v1/blog/popular`
- Recent posts from `/api/v1/blog/recent`
- Individual post page at `/blog/{slug}`
- SEO: meta tags, OpenGraph, structured data

### US-8.2 — FAQ Page
**As a** visitor,
**I want to** find answers to common questions,
**so that** I can resolve doubts without contacting support.

**Acceptance Criteria:**
- FAQs grouped by category from `/api/v1/faqs`
- Search FAQs from `/api/v1/faqs/search`
- Accordion expand/collapse per question
- "Still have questions? Contact us" CTA

### US-8.3 — Static Pages (About, Privacy, Terms)
**As a** visitor,
**I want to** read about company policies and information,
**so that** I can trust the platform.

**Acceptance Criteria:**
- Pages fetched from `/api/v1/pages/{slug}`
- Rendered as rich text/HTML content
- SEO optimized per page
- Footer links to key pages

### US-8.4 — Contact Us
**As a** visitor,
**I want to** submit a contact form,
**so that** I can reach support for inquiries.

**Acceptance Criteria:**
- Contact form: name, email, subject, message
- Submit: `POST /api/v1/contact`
- Success confirmation message
- Form validation (client + server)

### US-8.5 — Newsletter Subscription
**As a** visitor,
**I want to** subscribe to the newsletter,
**so that** I can receive deals and updates via email.

**Acceptance Criteria:**
- Email input in footer section
- Subscribe: `POST /api/v1/newsletter/subscribe`
- Verification email sent
- Already subscribed handling
- Unsubscribe link in emails

---

## 10. Epic 9 — Search & Filtering

### US-9.1 — Product Search
**As a** shopper,
**I want to** search for products by name or keyword,
**so that** I can quickly find what I'm looking for.

**Acceptance Criteria:**
- Search bar in header (always visible)
- Search API: `GET /api/v1/customer/products/search?q={query}`
- Real-time suggestions as user types (debounced 300ms)
- Search results page with filters
- "No results" state with suggestions
- Search history (localStorage)
- Mobile: full-screen search overlay with keyboard auto-focus

### US-9.2 — Product Filtering
**As a** shopper,
**I want to** filter products by price, rating, category, and attributes,
**so that** I can narrow down to exactly what I want.

**Acceptance Criteria:**
- Filters: price range (slider), rating (stars), category, attributes (color, size, etc.)
- Desktop: sidebar filter panel (sticky)
- Mobile: bottom sheet filter panel
- Active filters shown as chips above results
- "Clear All Filters" option
- URL params updated for shareable filtered results
- Product count updates with applied filters

### US-9.3 — Sort Products
**As a** shopper,
**I want to** sort product listings by various criteria,
**so that** I can find the best option for my needs.

**Acceptance Criteria:**
- Sort options: Relevance, Newest, Price (Low→High), Price (High→Low), Rating, Best Selling
- Selected sort persisted in URL params
- Default: Relevance for search, Newest for category

---

## 11. Epic 10 — Payments & Refunds

### US-10.1 — Payment Processing
**As a** shopper at checkout,
**I want to** pay using my preferred payment method,
**so that** I can complete my purchase conveniently.

**Acceptance Criteria:**
- **Stripe:** Credit/debit card via Stripe Elements
  - `POST /api/v1/payments/stripe` → client secret
  - `POST /api/v1/payments/stripe/confirm` → confirm payment
- **PayPal:** Redirect flow
  - `POST /api/v1/payments/paypal` → approval URL
  - `POST /api/v1/payments/paypal/capture` → capture after return
- **SSLCommerz:** Redirect flow (Bangladesh gateway)
  - `POST /api/v1/payments/sslcommerz` → redirect URL from gateway
  - `GET /api/v1/payments/sslcommerz/success` — success callback (redirects customer to order confirmation)
  - `GET /api/v1/payments/sslcommerz/fail` — failure callback (redirects customer to retry payment page)
  - `GET /api/v1/payments/sslcommerz/cancel` — cancel callback (redirects customer back to checkout)
  - `POST /api/v1/payments/sslcommerz/ipn` — IPN webhook (server-to-server, updates order status)
- **COD (Cash on Delivery):** No payment processing needed
- Available methods from `GET /api/v1/payments/methods`
- Payment status polling: `GET /api/v1/payments/{orderId}/status`

### US-10.2 — Payment Status
**As a** customer who just paid,
**I want to** see the payment status in real-time,
**so that** I know if my payment was successful.

**Acceptance Criteria:**
- After payment redirect, show processing spinner
- Poll payment status every 3 seconds (max 10 retries)
- Success → order confirmation page
- Failed → retry payment option with error message
- Pending → "Payment is being processed" message

### US-10.3 — Refund Request
**As a** customer,
**I want to** request a refund for an order,
**so that** I can get my money back if there's an issue.

**Acceptance Criteria:**
- Check eligibility: `GET /api/v1/payments/{orderId}/refund-eligibility`
- Refund form: reason, amount (partial/full), notes
- Submit: `POST /api/v1/payments/refund`
- Refund status visible in order detail
- Refund timeline shown

---

## 12. Acceptance Criteria Summary

| Category | Total Stories | Priority |
|----------|-------------|----------|
| Browsing & Discovery | 6 | P0 (5) + P2 (1: US-1.6) |
| Product Experience | 5 | P0 (Must Have) |
| Cart & Checkout | 6 | P0 (Must Have) |
| Authentication | 6 | P0 (5) + P2 (1: US-4.6) |
| Orders & Tracking | 4 | P0 (Must Have) |
| Reviews & Social Proof | 3 | P1 (Should Have) |
| Promotions & Deals | 3 | P1 (Should Have) |
| Content & Information | 5 | P1 (Should Have) |
| Search & Filtering | 3 | P0 (Must Have) |
| Payments & Refunds | 3 | P0 (Must Have) |
| **Total** | **44** | |

### Priority Matrix

| Priority | Label | Stories | Sprint Target |
|----------|-------|---------|---------------|
| P0 | Must Have (MVP) | 28 | Sprint 1–3 |
| P1 | Should Have | 11 | Sprint 4–5 |
| P2 | Nice to Have | 5 | Sprint 6+ |

### P2 (Nice to Have) Stories — Explicitly Listed

| Story | Title | Dependency |
|-------|-------|------------|
| US-1.6 | Vendor Store Page | Vendor public API endpoint |
| US-4.6 | Address Book | Backend route activation |
| US-6.3 | Vote on Reviews | Review voting API |
| US-7.2 | Available Coupons Page | Coupons available API |
| US-8.5 | Newsletter Subscription | Newsletter API |

---

*End of User Stories Document*
