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
        path: 'categories/:slug/edit',
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
        path: 'categories/:slug',
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
        path: 'attribute-templates/:slug/edit',
        name: 'admin-template-edit',
        component: () => import('@/pages/admin/templates/TemplateForm.vue'),
        meta: { title: 'Edit Template' },
      },
      {
        path: 'attribute-templates/:slug',
        name: 'admin-template-detail',
        component: () => import('@/pages/admin/templates/TemplateDetail.vue'),
        meta: { title: 'Template Details' },
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
      // Inventory
      {
        path: 'inventory',
        name: 'admin-inventory',
        component: () => import('@/pages/admin/inventory/InventoryOverview.vue'),
        meta: { title: 'Inventory' },
      },
      {
        path: 'inventory/alerts',
        name: 'admin-inventory-alerts',
        component: () => import('@/pages/admin/inventory/StockAlerts.vue'),
        meta: { title: 'Stock Alerts' },
      },
      {
        path: 'inventory/movements',
        name: 'admin-inventory-movements',
        component: () => import('@/pages/admin/inventory/StockMovements.vue'),
        meta: { title: 'Stock Movements' },
      },
      {
        path: 'inventory/reservations',
        name: 'admin-inventory-reservations',
        component: () => import('@/pages/admin/inventory/StockReservations.vue'),
        meta: { title: 'Stock Reservations' },
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
      // Flash Sales
      {
        path: 'flash-sales',
        name: 'admin-flash-sales',
        component: () => import('@/pages/admin/flash-sales/FlashSaleList.vue'),
        meta: { title: 'Flash Sales' },
      },
      {
        path: 'flash-sales/create',
        name: 'admin-flash-sale-create',
        component: () => import('@/pages/admin/flash-sales/FlashSaleForm.vue'),
        meta: { title: 'Create Flash Sale' },
      },
      {
        path: 'flash-sales/:id/edit',
        name: 'admin-flash-sale-edit',
        component: () => import('@/pages/admin/flash-sales/FlashSaleForm.vue'),
        meta: { title: 'Edit Flash Sale' },
      },
      // Banners
      {
        path: 'banners',
        name: 'admin-banners',
        component: () => import('@/pages/admin/banners/BannerList.vue'),
        meta: { title: 'Banners' },
      },
      {
        path: 'banners/create',
        name: 'admin-banner-create',
        component: () => import('@/pages/admin/banners/BannerForm.vue'),
        meta: { title: 'Create Banner' },
      },
      {
        path: 'banners/:id/edit',
        name: 'admin-banner-edit',
        component: () => import('@/pages/admin/banners/BannerForm.vue'),
        meta: { title: 'Edit Banner' },
      },
      // Newsletter
      {
        path: 'newsletter',
        name: 'admin-newsletter',
        component: () => import('@/pages/admin/newsletter/SubscriberList.vue'),
        meta: { title: 'Newsletter Subscribers' },
      },
      // Payments
      {
        path: 'payments',
        name: 'admin-payments',
        component: () => import('@/pages/admin/payments/PaymentList.vue'),
        meta: { title: 'Payments' },
      },
      {
        path: 'payments/refunds',
        name: 'admin-refunds',
        component: () => import('@/pages/admin/payments/RefundList.vue'),
        meta: { title: 'Refunds' },
      },
      {
        path: 'payments/webhooks',
        name: 'admin-webhooks',
        component: () => import('@/pages/admin/payments/WebhookLogs.vue'),
        meta: { title: 'Webhook Logs' },
      },
      {
        path: 'payments/:id',
        name: 'admin-payment-detail',
        component: () => import('@/pages/admin/payments/PaymentDetail.vue'),
        meta: { title: 'Payment Details' },
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
      {
        path: 'payouts/:id',
        name: 'admin-payout-detail',
        component: () => import('@/pages/admin/payouts/PayoutDetail.vue'),
        meta: { title: 'Payout Details' },
      },
      // Shipping Zones & Methods
      {
        path: 'shipping/zones',
        name: 'admin-shipping-zones',
        component: () => import('@/pages/admin/shipping/ShippingZoneList.vue'),
        meta: { title: 'Shipping Zones' },
      },
      {
        path: 'shipping/zones/new',
        name: 'admin-shipping-zone-create',
        component: () => import('@/pages/admin/shipping/ShippingZoneForm.vue'),
        meta: { title: 'Create Shipping Zone' },
      },
      {
        path: 'shipping/zones/:id',
        name: 'admin-shipping-zone-edit',
        component: () => import('@/pages/admin/shipping/ShippingZoneForm.vue'),
        meta: { title: 'Edit Shipping Zone' },
      },
      {
        path: 'shipping/methods',
        name: 'admin-shipping-methods',
        component: () => import('@/pages/admin/shipping/ShippingMethodList.vue'),
        meta: { title: 'Shipping Methods' },
      },
      {
        path: 'shipping/methods/new',
        name: 'admin-shipping-method-create',
        component: () => import('@/pages/admin/shipping/ShippingMethodForm.vue'),
        meta: { title: 'Create Shipping Method' },
      },
      {
        path: 'shipping/methods/:id',
        name: 'admin-shipping-method-edit',
        component: () => import('@/pages/admin/shipping/ShippingMethodForm.vue'),
        meta: { title: 'Edit Shipping Method' },
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
      {
        path: 'reports/orders',
        name: 'admin-report-orders',
        component: () => import('@/pages/admin/reports/OrderReport.vue'),
        meta: { title: 'Order Report' },
      },
      // Analytics
      {
        path: 'analytics/sales',
        name: 'admin-analytics-sales',
        component: () => import('@/pages/admin/analytics/SalesAnalytics.vue'),
        meta: { title: 'Sales Analytics' },
      },
      {
        path: 'analytics/top-products',
        name: 'admin-analytics-top-products',
        component: () => import('@/pages/admin/analytics/TopProducts.vue'),
        meta: { title: 'Top Products' },
      },
      {
        path: 'analytics/top-vendors',
        name: 'admin-analytics-top-vendors',
        component: () => import('@/pages/admin/analytics/TopVendors.vue'),
        meta: { title: 'Top Vendors' },
      },
      {
        path: 'analytics/categories',
        name: 'admin-analytics-categories',
        component: () => import('@/pages/admin/analytics/CategoryRevenue.vue'),
        meta: { title: 'Revenue by Category' },
      },
      {
        path: 'analytics/customers',
        name: 'admin-analytics-customers',
        component: () => import('@/pages/admin/analytics/CustomerInsights.vue'),
        meta: { title: 'Customer Insights' },
      },
      {
        path: 'analytics/inventory',
        name: 'admin-analytics-inventory',
        component: () => import('@/pages/admin/analytics/InventoryAnalytics.vue'),
        meta: { title: 'Inventory Analytics' },
      },
      {
        path: 'analytics/platform',
        name: 'admin-analytics-platform',
        component: () => import('@/pages/admin/analytics/PlatformSummary.vue'),
        meta: { title: 'Platform Summary' },
      },
      // Export / Import
      {
        path: 'export',
        name: 'admin-export',
        component: () => import('@/pages/admin/export-import/ExportCenter.vue'),
        meta: { title: 'Export Center' },
      },
      {
        path: 'import/products',
        name: 'admin-import-products',
        component: () => import('@/pages/admin/export-import/ProductImport.vue'),
        meta: { title: 'Import Products' },
      },
      // CMS - Static Pages
      {
        path: 'cms/pages',
        name: 'admin-cms-pages',
        component: () => import('@/pages/admin/cms/pages/PageList.vue'),
        meta: { title: 'Static Pages' },
      },
      {
        path: 'cms/pages/create',
        name: 'admin-cms-page-create',
        component: () => import('@/pages/admin/cms/pages/PageForm.vue'),
        meta: { title: 'Create Page' },
      },
      {
        path: 'cms/pages/:id/edit',
        name: 'admin-cms-page-edit',
        component: () => import('@/pages/admin/cms/pages/PageForm.vue'),
        meta: { title: 'Edit Page' },
      },
      // CMS - FAQs
      {
        path: 'cms/faqs',
        name: 'admin-cms-faqs',
        component: () => import('@/pages/admin/cms/faqs/FaqList.vue'),
        meta: { title: 'FAQs' },
      },
      {
        path: 'cms/faqs/create',
        name: 'admin-cms-faq-create',
        component: () => import('@/pages/admin/cms/faqs/FaqForm.vue'),
        meta: { title: 'Create FAQ' },
      },
      {
        path: 'cms/faqs/:id/edit',
        name: 'admin-cms-faq-edit',
        component: () => import('@/pages/admin/cms/faqs/FaqForm.vue'),
        meta: { title: 'Edit FAQ' },
      },
      {
        path: 'cms/faqs/categories/create',
        name: 'admin-cms-faq-category-create',
        component: () => import('@/pages/admin/cms/faqs/FaqCategoryForm.vue'),
        meta: { title: 'Create FAQ Category' },
      },
      {
        path: 'cms/faqs/categories/:id/edit',
        name: 'admin-cms-faq-category-edit',
        component: () => import('@/pages/admin/cms/faqs/FaqCategoryForm.vue'),
        meta: { title: 'Edit FAQ Category' },
      },
      // CMS - Blog
      {
        path: 'cms/blog',
        name: 'admin-cms-blog',
        component: () => import('@/pages/admin/cms/blog/BlogList.vue'),
        meta: { title: 'Blog' },
      },
      {
        path: 'cms/blog/create',
        name: 'admin-cms-blog-create',
        component: () => import('@/pages/admin/cms/blog/BlogForm.vue'),
        meta: { title: 'Create Blog Post' },
      },
      {
        path: 'cms/blog/:id/edit',
        name: 'admin-cms-blog-edit',
        component: () => import('@/pages/admin/cms/blog/BlogForm.vue'),
        meta: { title: 'Edit Blog Post' },
      },
      {
        path: 'cms/blog/categories/create',
        name: 'admin-cms-blog-category-create',
        component: () => import('@/pages/admin/cms/blog/BlogCategoryForm.vue'),
        meta: { title: 'Create Blog Category' },
      },
      {
        path: 'cms/blog/categories/:id/edit',
        name: 'admin-cms-blog-category-edit',
        component: () => import('@/pages/admin/cms/blog/BlogCategoryForm.vue'),
        meta: { title: 'Edit Blog Category' },
      },
      // CMS - Contact Messages
      {
        path: 'cms/contact',
        name: 'admin-cms-contact',
        component: () => import('@/pages/admin/cms/contact/ContactList.vue'),
        meta: { title: 'Contact Messages' },
      },
      {
        path: 'cms/contact/:id',
        name: 'admin-cms-contact-detail',
        component: () => import('@/pages/admin/cms/contact/ContactDetail.vue'),
        meta: { title: 'Message Details' },
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
      // Notifications
      {
        path: 'notifications',
        name: 'admin-notifications',
        component: () => import('@/pages/shared/notifications/NotificationList.vue'),
        meta: { title: 'Notifications' },
      },
      {
        path: 'notifications/preferences',
        name: 'admin-notification-preferences',
        component: () => import('@/pages/shared/notifications/NotificationPreferences.vue'),
        meta: { title: 'Notification Preferences' },
      },
    ],
  },
]

export default adminRoutes
