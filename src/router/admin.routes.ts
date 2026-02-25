// ═══════════════════════════════════════════════════════════════════
// Admin Routes — Admin dashboard routes
// ═══════════════════════════════════════════════════════════════════

import type { RouteRecordRaw } from 'vue-router'
import { requireAdmin } from './guards'

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: () => import('@/layouts/DashboardLayout.vue'),
    beforeEnter: requireAdmin,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/pages/admin/Dashboard.vue'),
        meta: { title: 'Dashboard' },
      },
      // Products
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/pages/admin/products/ProductList.vue'),
        meta: { title: 'Products' },
      },
      {
        path: 'products/create',
        name: 'admin-product-create',
        component: () => import('@/pages/admin/products/ProductForm.vue'),
        meta: { title: 'Create Product' },
      },
      {
        path: 'products/:id/edit',
        name: 'admin-product-edit',
        component: () => import('@/pages/admin/products/ProductForm.vue'),
        meta: { title: 'Edit Product' },
      },
      {
        path: 'products/:id',
        name: 'admin-product-detail',
        component: () => import('@/pages/admin/products/ProductDetail.vue'),
        meta: { title: 'Product Details' },
      },
      // Categories
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('@/pages/admin/categories/CategoryList.vue'),
        meta: { title: 'Categories' },
      },
      {
        path: 'categories/create',
        name: 'admin-category-create',
        component: () => import('@/pages/admin/categories/CategoryForm.vue'),
        meta: { title: 'Create Category' },
      },
      {
        path: 'categories/:id/edit',
        name: 'admin-category-edit',
        component: () => import('@/pages/admin/categories/CategoryForm.vue'),
        meta: { title: 'Edit Category' },
      },
      {
        path: 'categories/pending',
        name: 'admin-pending-categories',
        component: () => import('@/pages/admin/categories/PendingCategories.vue'),
        meta: { title: 'Pending Categories' },
      },
      {
        path: 'categories/:id',
        name: 'admin-category-detail',
        component: () => import('@/pages/admin/categories/CategoryDetail.vue'),
        meta: { title: 'Category Details' },
      },
      // Attribute Templates
      {
        path: 'attribute-templates',
        name: 'admin-attribute-templates',
        component: () => import('@/pages/admin/templates/TemplateList.vue'),
        meta: { title: 'Attribute Templates' },
      },
      {
        path: 'attribute-templates/create',
        name: 'admin-template-create',
        component: () => import('@/pages/admin/templates/TemplateForm.vue'),
        meta: { title: 'Create Template' },
      },
      {
        path: 'attribute-templates/:id/edit',
        name: 'admin-template-edit',
        component: () => import('@/pages/admin/templates/TemplateForm.vue'),
        meta: { title: 'Edit Template' },
      },
      // Vendors
      {
        path: 'vendors',
        name: 'admin-vendors',
        component: () => import('@/pages/admin/vendors/VendorList.vue'),
        meta: { title: 'Vendors' },
      },
      {
        path: 'vendors/:id',
        name: 'admin-vendor-detail',
        component: () => import('@/pages/admin/vendors/VendorDetail.vue'),
        meta: { title: 'Vendor Details' },
      },
      {
        path: 'vendors/:id/edit',
        name: 'admin-vendor-edit',
        component: () => import('@/pages/admin/vendors/VendorForm.vue'),
        meta: { title: 'Edit Vendor' },
      },
      // Orders
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/pages/admin/orders/OrderList.vue'),
        meta: { title: 'Orders' },
      },
      {
        path: 'orders/:id',
        name: 'admin-order-detail',
        component: () => import('@/pages/admin/orders/OrderDetail.vue'),
        meta: { title: 'Order Details' },
      },
      // Customers
      {
        path: 'customers',
        name: 'admin-customers',
        component: () => import('@/pages/admin/customers/CustomerList.vue'),
        meta: { title: 'Customers' },
      },
      {
        path: 'customers/:id',
        name: 'admin-customer-detail',
        component: () => import('@/pages/admin/customers/CustomerDetail.vue'),
        meta: { title: 'Customer Details' },
      },
      // Reviews
      {
        path: 'reviews',
        name: 'admin-reviews',
        component: () => import('@/pages/admin/reviews/ReviewList.vue'),
        meta: { title: 'Reviews' },
      },
      // Coupons
      {
        path: 'coupons',
        name: 'admin-coupons',
        component: () => import('@/pages/admin/coupons/CouponList.vue'),
        meta: { title: 'Coupons' },
      },
      {
        path: 'coupons/create',
        name: 'admin-coupon-create',
        component: () => import('@/pages/admin/coupons/CouponForm.vue'),
        meta: { title: 'Create Coupon' },
      },
      {
        path: 'coupons/:id/edit',
        name: 'admin-coupon-edit',
        component: () => import('@/pages/admin/coupons/CouponForm.vue'),
        meta: { title: 'Edit Coupon' },
      },
      // Commissions & Payouts
      {
        path: 'commissions',
        name: 'admin-commissions',
        component: () => import('@/pages/admin/commissions/CommissionList.vue'),
        meta: { title: 'Commissions' },
      },
      {
        path: 'payouts',
        name: 'admin-payouts',
        component: () => import('@/pages/admin/payouts/PayoutList.vue'),
        meta: { title: 'Payouts' },
      },
      // Reports
      {
        path: 'reports/sales',
        name: 'admin-report-sales',
        component: () => import('@/pages/admin/reports/SalesReport.vue'),
        meta: { title: 'Sales Report' },
      },
      {
        path: 'reports/vendors',
        name: 'admin-report-vendors',
        component: () => import('@/pages/admin/reports/VendorReport.vue'),
        meta: { title: 'Vendor Report' },
      },
      {
        path: 'reports/products',
        name: 'admin-report-products',
        component: () => import('@/pages/admin/reports/ProductReport.vue'),
        meta: { title: 'Product Report' },
      },
      // System
      {
        path: 'system/activity',
        name: 'admin-activity-log',
        component: () => import('@/pages/admin/system/ActivityLog.vue'),
        meta: { title: 'Activity Log' },
      },
      {
        path: 'system/health',
        name: 'admin-system-health',
        component: () => import('@/pages/admin/system/SystemHealth.vue'),
        meta: { title: 'System Health' },
      },
      // Settings
      {
        path: 'settings',
        component: () => import('@/pages/admin/settings/Settings.vue'),
        meta: { title: 'Settings' },
        redirect: { name: 'admin-settings-general' },
        children: [
          {
            path: 'general',
            name: 'admin-settings-general',
            component: () => import('@/pages/admin/settings/GeneralSettings.vue'),
            meta: { title: 'General Settings' },
          },
          {
            path: 'payment',
            name: 'admin-settings-payment',
            component: () => import('@/pages/admin/settings/PaymentSettings.vue'),
            meta: { title: 'Payment Settings' },
          },
          {
            path: 'shipping',
            name: 'admin-settings-shipping',
            component: () => import('@/pages/admin/settings/ShippingSettings.vue'),
            meta: { title: 'Shipping Settings' },
          },
          {
            path: 'email',
            name: 'admin-settings-email',
            component: () => import('@/pages/admin/settings/EmailSettings.vue'),
            meta: { title: 'Email Settings' },
          },
          {
            path: 'commission',
            name: 'admin-settings-commission',
            component: () => import('@/pages/admin/settings/CommissionSettings.vue'),
            meta: { title: 'Commission Settings' },
          },
        ],
      },
      // Profile
      {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('@/pages/shared/Profile.vue'),
        meta: { title: 'Profile' },
      },
    ],
  },
]

export default adminRoutes
