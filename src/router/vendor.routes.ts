// ═══════════════════════════════════════════════════════════════════
// Vendor Routes — Vendor dashboard routes
// ═══════════════════════════════════════════════════════════════════

import type { RouteRecordRaw } from 'vue-router'
import { requireVendor } from './guards'

const vendorRoutes: RouteRecordRaw[] = [
  {
    path: '/vendor',
    component: () => import('@/layouts/DashboardLayout.vue'),
    beforeEnter: requireVendor,
    meta: { requiresAuth: true, role: 'vendor' },
    children: [
      {
        path: '',
        redirect: '/vendor/dashboard',
      },
      {
        path: 'dashboard',
        name: 'vendor-dashboard',
        component: () => import('@/pages/vendor/Dashboard.vue'),
        meta: { title: 'Dashboard' },
      },
      // Products
      {
        path: 'products',
        name: 'vendor-products',
        component: () => import('@/pages/vendor/products/ProductList.vue'),
        meta: { title: 'My Products' },
      },
      {
        path: 'products/create',
        name: 'vendor-product-create',
        component: () => import('@/pages/vendor/products/ProductForm.vue'),
        meta: { title: 'Add Product' },
      },
      {
        path: 'products/:id/edit',
        name: 'vendor-product-edit',
        component: () => import('@/pages/vendor/products/ProductForm.vue'),
        meta: { title: 'Edit Product' },
      },
      {
        path: 'products/:id',
        name: 'vendor-product-detail',
        component: () => import('@/pages/vendor/products/ProductDetail.vue'),
        meta: { title: 'Product Details' },
      },
      // Orders
      {
        path: 'orders',
        name: 'vendor-orders',
        component: () => import('@/pages/vendor/orders/OrderList.vue'),
        meta: { title: 'My Orders' },
      },
      {
        path: 'orders/:id',
        name: 'vendor-order-detail',
        component: () => import('@/pages/vendor/orders/OrderDetail.vue'),
        meta: { title: 'Order Details' },
      },
      // Inventory
      {
        path: 'inventory',
        name: 'vendor-inventory',
        component: () => import('@/pages/vendor/inventory/Inventory.vue'),
        meta: { title: 'Inventory' },
      },
      // Analytics
      {
        path: 'analytics',
        name: 'vendor-analytics',
        component: () => import('@/pages/vendor/analytics/Analytics.vue'),
        meta: { title: 'Analytics' },
      },
      // Categories
      {
        path: 'categories',
        name: 'vendor-categories',
        component: () => import('@/pages/vendor/categories/BrowseCategories.vue'),
        meta: { title: 'Browse Categories' },
      },
      {
        path: 'categories/suggest',
        name: 'vendor-suggest-category',
        component: () => import('@/pages/vendor/categories/SuggestCategory.vue'),
        meta: { title: 'Suggest Category' },
      },
      {
        path: 'categories/my',
        name: 'vendor-my-categories',
        component: () => import('@/pages/vendor/categories/MyCategories.vue'),
        meta: { title: 'My Categories' },
      },
      {
        path: 'categories/:slug',
        name: 'vendor-category-detail',
        component: () => import('@/pages/vendor/categories/CategoryDetail.vue'),
        meta: { title: 'Category Details' },
      },
      {
        path: 'categories/:slug/edit',
        name: 'vendor-category-edit',
        component: () => import('@/pages/vendor/categories/EditCategory.vue'),
        meta: { title: 'Edit Category' },
      },
      // Shipping
      {
        path: 'shipping',
        name: 'vendor-shipping',
        component: () => import('@/pages/vendor/shipping/ShippingSettings.vue'),
        meta: { title: 'Shipping Settings' },
      },
      // Shipments
      {
        path: 'shipments',
        name: 'vendor-shipments',
        component: () => import('@/pages/vendor/shipments/ShipmentList.vue'),
        meta: { title: 'Shipments' },
      },
      {
        path: 'shipments/:id',
        name: 'vendor-shipment-detail',
        component: () => import('@/pages/vendor/shipments/ShipmentDetail.vue'),
        meta: { title: 'Shipment Details' },
      },
      {
        path: 'orders/:orderId/ship',
        name: 'vendor-create-shipment',
        component: () => import('@/pages/vendor/shipments/ShipmentForm.vue'),
        meta: { title: 'Create Shipment' },
      },
      // Earnings
      {
        path: 'earnings',
        name: 'vendor-earnings',
        component: () => import('@/pages/vendor/earnings/Earnings.vue'),
        meta: { title: 'Earnings' },
      },
      // Payouts
      {
        path: 'payouts',
        name: 'vendor-payouts',
        component: () => import('@/pages/vendor/payouts/PayoutList.vue'),
        meta: { title: 'Payouts' },
      },
      {
        path: 'payouts/request',
        name: 'vendor-payout-request',
        component: () => import('@/pages/vendor/payouts/PayoutRequest.vue'),
        meta: { title: 'Request Payout' },
      },
      // Reviews
      {
        path: 'reviews',
        name: 'vendor-reviews',
        component: () => import('@/pages/vendor/reviews/ReviewList.vue'),
        meta: { title: 'Reviews' },
      },
      {
        path: 'reviews/needs-response',
        name: 'vendor-reviews-needs-response',
        component: () => import('@/pages/vendor/reviews/NeedsResponse.vue'),
        meta: { title: 'Needs Response' },
      },
      // Coupons
      {
        path: 'coupons',
        name: 'vendor-coupons',
        component: () => import('@/pages/vendor/coupons/CouponList.vue'),
        meta: { title: 'My Coupons' },
      },
      {
        path: 'coupons/create',
        name: 'vendor-coupon-create',
        component: () => import('@/pages/vendor/coupons/CouponForm.vue'),
        meta: { title: 'Create Coupon' },
      },
      {
        path: 'coupons/:id/edit',
        name: 'vendor-coupon-edit',
        component: () => import('@/pages/vendor/coupons/CouponForm.vue'),
        meta: { title: 'Edit Coupon' },
      },
      // Promotions
      {
        path: 'promotions',
        name: 'vendor-promotions',
        component: () => import('@/pages/vendor/promotions/MyPromotions.vue'),
        meta: { title: 'My Promotions' },
      },
      {
        path: 'promotions/create',
        name: 'vendor-promotion-create',
        component: () => import('@/pages/vendor/promotions/CreatePromotion.vue'),
        meta: { title: 'Create Promotion' },
      },
      // Reports
      {
        path: 'reports',
        name: 'vendor-reports',
        component: () => import('@/pages/vendor/reports/VendorReports.vue'),
        meta: { title: 'Reports' },
      },
      // Help & Support
      {
        path: 'support',
        name: 'vendor-support',
        component: () => import('@/pages/vendor/support/HelpCenter.vue'),
        meta: { title: 'Help Center' },
      },
      // Shop Settings
      {
        path: 'settings',
        name: 'vendor-settings',
        redirect: '/vendor/settings/shop',
      },
      {
        path: 'settings/shop',
        name: 'vendor-shop-settings',
        component: () => import('@/pages/vendor/settings/ShopSettings.vue'),
        meta: { title: 'Shop Settings' },
      },
      // Bank Details
      {
        path: 'settings/bank-details',
        name: 'vendor-bank-details',
        component: () => import('@/pages/vendor/settings/BankDetails.vue'),
        meta: { title: 'Bank Details' },
      },
      // NID Verification
      {
        path: 'settings/nid',
        name: 'vendor-nid-verification',
        component: () => import('@/pages/vendor/settings/NidVerification.vue'),
        meta: { title: 'NID Verification' },
      },
      // Profile
      {
        path: 'profile',
        name: 'vendor-profile',
        component: () => import('@/pages/shared/Profile.vue'),
        meta: { title: 'Profile' },
      },
      // Notifications
      {
        path: 'notifications',
        name: 'vendor-notifications',
        component: () => import('@/pages/shared/notifications/NotificationList.vue'),
        meta: { title: 'Notifications' },
      },
      {
        path: 'notifications/preferences',
        name: 'vendor-notification-preferences',
        component: () => import('@/pages/shared/notifications/NotificationPreferences.vue'),
        meta: { title: 'Notification Preferences' },
      },
    ],
  },
  // Vendor status pages (outside main layout)
  {
    path: '/vendor/pending',
    name: 'vendor-pending',
    component: () => import('@/pages/vendor/status/PendingApproval.vue'),
    meta: { title: 'Pending Approval', requiresAuth: true },
  },
  {
    path: '/vendor/suspended',
    name: 'vendor-suspended',
    component: () => import('@/pages/vendor/status/Suspended.vue'),
    meta: { title: 'Account Suspended', requiresAuth: true },
  },
]

export default vendorRoutes
