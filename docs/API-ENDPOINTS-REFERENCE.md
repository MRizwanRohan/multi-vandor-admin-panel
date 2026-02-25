# 🗺️ API Endpoints Quick Reference

> Quick lookup for all API endpoints organized by feature and role

## 📑 Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [Public Endpoints (No Auth)](#public-endpoints-no-auth)
- [Customer Endpoints](#customer-endpoints)
- [Vendor Endpoints](#vendor-endpoints)
- [Admin Endpoints](#admin-endpoints)

---

## Authentication Endpoints

**Base:** `/auth`

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `POST` | `/auth/register` | Register new user | `authService.register()` |
| `POST` | `/auth/login` | User login | `authService.login()` |
| `GET` | `/auth/me` | Get current user | `authService.me()` |
| `POST` | `/auth/logout` | Logout (current device) | `authService.logout()` |
| `POST` | `/auth/logout-all` | Logout all devices | `authService.logoutAll()` |
| `POST` | `/auth/forgot-password` | Request password reset | `authService.forgotPassword()` |
| `POST` | `/auth/reset-password` | Reset password | `authService.resetPassword()` |

---

## Public Endpoints (No Auth)

**Base:** `/customer` (but don't require authentication)

### Products

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/customer/products` | List all products | `publicService.getProducts()` |
| `GET` | `/customer/products/{slug}` | Get product by slug | `publicService.getProductBySlug()` |
| `GET` | `/customer/products/featured` | Get featured products | `publicService.getFeaturedProducts()` |
| `GET` | `/customer/products/search` | Search products | `publicService.searchProducts()` |
| `GET` | `/customer/products/category/{slug}` | Products by category | `publicService.getProductsByCategory()` |

### Categories

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/customer/categories` | List all categories | `publicService.getCategories()` |
| `GET` | `/customer/categories/{slug}` | Get category by slug | `publicService.getCategoryBySlug()` |

---

## Customer Endpoints

**Base:** `/customer`  
**Auth Required:** ✅ Customer role

### Cart

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/customer/cart` | Get cart | `cartService.getCart()` |
| `POST` | `/customer/cart/items` | Add item to cart | `cartService.addItem()` |
| `PUT` | `/customer/cart/items/{id}` | Update cart item | `cartService.updateItem()` |
| `DELETE` | `/customer/cart/items/{id}` | Remove item from cart | `cartService.removeItem()` |
| `DELETE` | `/customer/cart` | Clear entire cart | `cartService.clearCart()` |
| `GET` | `/customer/cart/summary` | Get cart summary | `cartService.getSummary()` |

### Orders

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/customer/orders` | List customer orders | `orderService.getOrders()` |
| `POST` | `/customer/orders` | Place new order | `orderService.placeOrder()` |
| `GET` | `/customer/orders/{orderNumber}` | Get order details | `orderService.getByOrderNumber()` |
| `POST` | `/customer/orders/{id}/cancel` | Cancel order | `orderService.cancelOrder()` |

---

## Vendor Endpoints

**Base:** `/vendor`  
**Auth Required:** ✅ Vendor role

### Products

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/vendor/products` | List vendor products | `productService.getAll()` |
| `POST` | `/vendor/products` | Create product | `productService.create()` |
| `GET` | `/vendor/products/{id}` | Get product | `productService.getById()` |
| `PUT` | `/vendor/products/{id}` | Update product | `productService.update()` |
| `DELETE` | `/vendor/products/{id}` | Delete product | `productService.delete()` |
| `PUT` | `/vendor/products/{id}/submit` | Submit for approval | `productService.submitForApproval()` |
| `PUT` | `/vendor/products/{id}/restore` | Restore deleted product | `productService.restoreProduct()` |
| `GET` | `/vendor/products/{id}/attributes` | Get product attributes | `productService.getAttributes()` |

### Product Images

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `POST` | `/vendor/products/{id}/images` | Upload image | `productService.uploadImage()` |
| `PUT` | `/vendor/products/{id}/images/reorder` | Reorder images | `productService.reorderImages()` |
| `DELETE` | `/vendor/products/{id}/images/{imageId}` | Delete image | `productService.deleteImage()` |

### Categories

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/vendor/categories` | List available categories | `categoryService.getAll()` |
| `GET` | `/vendor/categories/my` | My used categories | `categoryService.getMyCategories()` |
| `GET` | `/vendor/categories/{id}` | Get category | `categoryService.getById()` |
| `GET` | `/vendor/categories/{id}/templates` | Get attribute templates | `categoryService.getTemplates()` |
| `POST` | `/vendor/categories` | Request new category | `categoryService.requestCategory()` |

### Orders

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/vendor/orders` | List vendor orders | `orderService.getAll()` |
| `GET` | `/vendor/orders/{id}` | Get order details | `orderService.getById()` |
| `PUT` | `/vendor/orders/{id}/status` | Update order status | `orderService.updateStatus()` |
| `GET` | `/vendor/orders/stats` | Get order statistics | `orderService.getStats()` |

### Inventory

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/vendor/inventory` | List inventory | `inventoryService.getInventory()` |
| `PUT` | `/vendor/inventory/{id}` | Update stock | `inventoryService.updateStock()` |
| `GET` | `/vendor/inventory/alerts` | Get stock alerts | `inventoryService.getAlerts()` |
| `PUT` | `/vendor/inventory/alerts/{id}/resolve` | Resolve alert | `inventoryService.resolveAlert()` |
| `GET` | `/vendor/inventory/movements` | Stock movement history | `inventoryService.getMovements()` |

---

## Admin Endpoints

**Base:** `/admin`  
**Auth Required:** ✅ Admin/Super Admin role

### Products

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/admin/products` | List all products | `productService.getAll()` |
| `GET` | `/admin/products/{id}` | Get product | `productService.getById()` |
| `DELETE` | `/admin/products/{id}` | Delete product | `productService.delete()` |
| `PUT` | `/admin/products/{id}/approve` | Approve product | `productService.approve()` |
| `PUT` | `/admin/products/{id}/reject` | Reject product | `productService.reject()` |
| `PUT` | `/admin/products/{id}/feature` | Toggle featured | `productService.toggleFeatured()` |

### Categories

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/admin/categories` | List categories | `categoryService.getAll()` |
| `POST` | `/admin/categories` | Create category | `categoryService.create()` |
| `GET` | `/admin/categories/{id}` | Get category | `categoryService.getById()` |
| `PUT` | `/admin/categories/{id}` | Update category | `categoryService.update()` |
| `DELETE` | `/admin/categories/{id}` | Delete category | `categoryService.delete()` |
| `PUT` | `/admin/categories/reorder` | Reorder categories | `categoryService.reorder()` |
| `PUT` | `/admin/categories/{id}/toggle-active` | Toggle active | `categoryService.toggleActive()` |
| `PUT` | `/admin/categories/{id}/approve` | Approve request | `categoryService.approveRequest()` |
| `PUT` | `/admin/categories/{id}/reject` | Reject request | `categoryService.rejectRequest()` |
| `GET` | `/admin/categories/{id}/templates` | Get templates | `categoryService.getTemplates()` |
| `PUT` | `/admin/categories/{id}/templates` | Sync templates | `categoryService.syncTemplates()` |

### Attribute Templates

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/admin/attribute-templates` | List all templates | `attributeTemplateService.getAll()` |
| `POST` | `/admin/attribute-templates` | Create template | `attributeTemplateService.create()` |
| `GET` | `/admin/attribute-templates/{id}` | Get template | `attributeTemplateService.getById()` |
| `PUT` | `/admin/attribute-templates/{id}` | Update template | `attributeTemplateService.update()` |
| `DELETE` | `/admin/attribute-templates/{id}` | Delete template | `attributeTemplateService.delete()` |
| `PUT` | `/admin/attribute-templates/{id}/toggle-active` | Toggle active | `attributeTemplateService.toggleActive()` |
| `GET` | `/admin/attribute-templates/active` | Active only | `attributeTemplateService.getActive()` |
| `GET` | `/admin/attribute-templates/filterable` | Filterable templates | `attributeTemplateService.getFilterable()` |
| `GET` | `/admin/attribute-templates/variant-defining` | Variant-defining | `attributeTemplateService.getVariantDefining()` |
| `GET` | `/admin/attribute-templates/data-types` | Get data types | `attributeTemplateService.getDataTypes()` |
| `GET` | `/admin/attribute-templates/by-category/{id}` | By category | `attributeTemplateService.getByCategory()` |

### Attribute Options

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `POST` | `/admin/attribute-templates/{id}/options` | Add option | `attributeTemplateService.addOption()` |
| `PUT` | `/admin/attribute-templates/options/{id}` | Update option | `attributeTemplateService.updateOption()` |
| `DELETE` | `/admin/attribute-templates/options/{id}` | Delete option | `attributeTemplateService.deleteOption()` |
| `PUT` | `/admin/attribute-templates/{id}/options/reorder` | Reorder options | `attributeTemplateService.reorderOptions()` |

### Orders

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/admin/orders` | List all orders | `orderService.getAll()` |
| `GET` | `/admin/orders/{id}` | Get order | `orderService.getById()` |
| `PUT` | `/admin/orders/{id}/status` | Update status | `orderService.updateStatus()` |

### Inventory

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/admin/inventory/stats` | Get statistics | `inventoryService.getStats()` |
| `GET` | `/admin/inventory/low-stock` | Low stock products | `inventoryService.getLowStock()` |
| `GET` | `/admin/inventory/alerts` | All alerts | `inventoryService.getAllAlerts()` |
| `PUT` | `/admin/inventory/alerts/{id}/resolve` | Resolve alert | `inventoryService.resolveAlert()` |
| `PUT` | `/admin/inventory/alerts/bulk-resolve` | Bulk resolve | `inventoryService.bulkResolveAlerts()` |
| `POST` | `/admin/inventory/adjust` | Manual adjustment | `inventoryService.manualAdjustment()` |
| `POST` | `/admin/inventory/scan-alerts` | Scan all products | `inventoryService.scanAlerts()` |
| `GET` | `/admin/inventory/movements` | All movements | `inventoryService.getAllMovements()` |

### Settings

| Method | Endpoint | Description | Service Function |
|--------|----------|-------------|------------------|
| `GET` | `/admin/settings` | List all settings | `settingsService.getAll()` |
| `GET` | `/admin/settings/groups` | Get groups | `settingsService.getGroups()` |
| `GET` | `/admin/settings/{id}` | Get setting | `settingsService.getById()` |
| `POST` | `/admin/settings` | Create setting | `settingsService.create()` |
| `PUT` | `/admin/settings/{id}` | Update setting | `settingsService.update()` |
| `DELETE` | `/admin/settings/{id}` | Delete setting | `settingsService.delete()` |
| `PUT` | `/admin/settings/{group}/{key}` | Update by key | `settingsService.updateByKey()` |
| `PUT` | `/admin/settings/bulk` | Bulk update | `settingsService.bulkUpdate()` |
| `GET` | `/admin/settings/export` | Export settings | `settingsService.exportSettings()` |
| `POST` | `/admin/settings/import` | Import settings | `settingsService.importSettings()` |
| `GET` | `/admin/settings/{id}/audits` | Audit trail | `settingsService.getAudits()` |

---

## 📊 Endpoint Summary

| Role | Endpoints | Status |
|------|-----------|--------|
| **Auth** | 7 | ✅ Implemented |
| **Public** | 7 | ❌ To Implement |
| **Customer** | 10 | ❌ To Implement |
| **Vendor** | 24 | 🟡 Partial |
| **Admin** | 52 | 🟡 Partial |
| **TOTAL** | **70+** | **~40% Complete** |

---

## 🔍 Search & Filter Parameters

### Common Query Parameters

All list endpoints support these parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | integer | Page number | `?page=2` |
| `per_page` | integer | Items per page (max: 100) | `?per_page=20` |
| `sort_by` | string | Sort field | `?sort_by=created_at` |
| `sort_dir` | string | Sort direction: `asc` or `desc` | `?sort_dir=desc` |
| `search` | string | Search query | `?search=laptop` |

### Product-Specific Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category_id` | integer | Filter by category |
| `vendor_id` | integer | Filter by vendor |
| `status` | string | Filter by status |
| `min_price` | number | Minimum price |
| `max_price` | number | Maximum price |
| `is_featured` | boolean | Featured products only |
| `has_variants` | boolean | Products with variants |
| `in_stock` | boolean | In stock only |

### Order-Specific Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Order status |
| `payment_status` | string | Payment status |
| `date_from` | string | Start date (YYYY-MM-DD) |
| `date_to` | string | End date (YYYY-MM-DD) |
| `customer_id` | integer | Filter by customer |
| `vendor_id` | integer | Filter by vendor |

### Inventory-Specific Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `product_id` | integer | Filter by product |
| `is_low_stock` | boolean | Low stock items |
| `is_out_of_stock` | boolean | Out of stock items |
| `alert_type` | string | Alert type |
| `is_resolved` | boolean | Resolved alerts |

---

## 🎯 Request/Response Examples

### Example: Get Products

**Request:**
```http
GET /customer/products?page=1&per_page=15&category_id=5&min_price=100&max_price=500&sort_by=price&sort_dir=asc
```

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "slug": "product-name",
      "price": 199.99,
      "effective_price": 179.99,
      "thumbnail": "https://...",
      // ... other fields
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "https://api.mve.com/api/v1/customer/products?page=1",
    "last": "https://api.mve.com/api/v1/customer/products?page=10",
    "prev": null,
    "next": "https://api.mve.com/api/v1/customer/products?page=2"
  }
}
```

### Example: Add to Cart

**Request:**
```http
POST /customer/cart/items
Content-Type: application/json
Authorization: Bearer {token}

{
  "product_id": 123,
  "variant_id": 456,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": 789,
    "product_id": 123,
    "variant_id": 456,
    "quantity": 2,
    "unit_price": 99.99,
    "total_price": 199.98,
    "product": {
      "id": 123,
      "name": "Product Name",
      "slug": "product-name",
      "thumbnail": "https://..."
    },
    "is_available": true,
    "max_quantity": 10
  }
}
```

### Example: Search Products (with Facets)

**Request:**
```http
GET /customer/products/search?q=laptop&category_id=1&min_price=500
```

**Response:**
```json
{
  "success": true,
  "message": "Search results",
  "data": [ /* products */ ],
  "meta": { /* pagination */ },
  "links": { /* pagination links */ },
  "facets": {
    "categories": [
      { "id": 1, "name": "Electronics", "count": 45 },
      { "id": 2, "name": "Computers", "count": 32 }
    ],
    "price_ranges": [
      { "min": 0, "max": 500, "count": 10 },
      { "min": 500, "max": 1000, "count": 25 },
      { "min": 1000, "max": 2000, "count": 15 }
    ],
    "brands": [
      { "id": 1, "name": "Dell", "count": 20 },
      { "id": 2, "name": "HP", "count": 15 }
    ]
  },
  "applied_filters": {
    "category_id": 1,
    "min_price": 500
  }
}
```

---

## 🔐 Authentication

All authenticated endpoints require the `Authorization` header:

```http
Authorization: Bearer {your-access-token}
```

### Getting a Token

```typescript
// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password123'
})

// Token is automatically stored in localStorage
// and added to all subsequent requests via interceptor
```

---

## ⚠️ Error Responses

### Validation Error (422)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

### Forbidden (403)

```json
{
  "success": false,
  "message": "You do not have permission to access this resource."
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Product not found"
}
```

### Rate Limited (429)

```json
{
  "success": false,
  "message": "Too many requests",
  "retry_after": 60
}
```

**Headers:**
```
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

---

## 📝 Notes

### Case Conversion
- **Request**: Frontend sends `camelCase` → Interceptor converts to `snake_case`
- **Response**: Backend sends `snake_case` → Interceptor converts to `camelCase`

### Role-Based Routing
The API client automatically detects role from URL:
- `/admin/*` → Uses `/admin` prefix
- `/vendor/*` → Uses `/vendor` prefix
- Otherwise → No prefix (customer/public endpoints)

### Pagination Defaults
- Default page: `1`
- Default per_page: `15`
- Max per_page: `100`

### Rate Limits
- Auth endpoints: 5 req/min
- General API: 60 req/min
- Public endpoints: 120 req/min
- Admin endpoints: 120 req/min

---

**Last Updated:** February 25, 2026  
**API Version:** v1  
**Base URL:** `https://api.mve.com/api/v1`
