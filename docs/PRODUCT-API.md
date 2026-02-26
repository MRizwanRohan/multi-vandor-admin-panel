# Product API — সম্পূর্ণ ডকুমেন্টেশন

> **Version**: 1.0  
> **Base URL**: `/api/v1`  
> **Last Updated**: February 26, 2026  
> **Authentication:** Bearer Token (Sanctum)

---

## 📋 সূচিপত্র

1. [Overview](#1-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Database Schema & Relations](#3-database-schema--relations)
4. [Product Status State Machine](#4-product-status-state-machine)
5. [Customer/Public APIs](#5-customerpublic-apis)
   - [Browse Products](#51-browse-products)
   - [Search Products](#52-search-products)
   - [Get Featured Products](#53-get-featured-products)
   - [Get Products by Category](#54-get-products-by-category)
   - [Get Product Detail](#55-get-product-detail)
6. [Vendor APIs](#6-vendor-apis)
   - [List Own Products](#61-list-vendors-own-products)
   - [Create Product](#62-create-product)
   - [Show Own Product](#63-show-own-product)
   - [Update Product](#64-update-product)
   - [Delete Product](#65-delete-product)
   - [Submit for Review](#66-submit-for-review)
   - [Restore Deleted Product](#67-restore-deleted-product)
   - [Get Product Attributes](#68-get-product-attribute-templates)
   - [Image Management](#69-vendor-product-image-endpoints)
7. [Admin APIs](#7-admin-apis)
   - [List All Products](#71-list-all-products)
   - [Show Product Detail](#72-show-product-detail)
   - [Approve Product](#73-approve-product)
   - [Reject Product](#74-reject-product)
   - [Toggle Featured](#75-toggle-featured-status)
   - [Delete Product](#76-delete-product)
8. [Error Reference](#8-error-reference)
9. [Frontend Integration Guide](#9-frontend-integration-guide)
10. [Route Summary](#সংক্ষেপে-route-summary)
11. [UI Implementation Plan](#10-ui-implementation-plan)

---

## 1. Overview

Product API তিনটি user role এর জন্য আলাদা আলাদা endpoints প্রদান করে:

| Role     | Prefix               | Description                                    |
|----------|----------------------|------------------------------------------------|
| Customer | `/customer/products` | Public browsing, search, product detail        |
| Vendor   | `/vendor/products`   | Own product CRUD, submit for review            |
| Admin    | `/admin/products`    | All products, approve/reject, feature toggle   |

### Product Types

| Type       | Description                     | Stock Management                                    |
|------------|---------------------------------|-----------------------------------------------------|
| `simple`   | Single item, one price          | Product-level stock (`stock_quantity` on product)   |
| `variable` | Has variants (Color × Size)     | Variant-level stock (each variant has own `stock_quantity`) |

### Visibility Options

| Value     | Description                        |
|-----------|------------------------------------|
| `visible` | Shows in catalog + search          |
| `catalog` | Shows in category pages only       |
| `hidden`  | Not visible anywhere (internal)    |

---

## 2. Authentication & Authorization

### Headers
```http
Authorization: Bearer {sanctum_token}
Content-Type: application/json
Accept: application/json
```

### Role Requirements

| Endpoint Group | Required Role        | Additional Middleware                      |
|----------------|----------------------|--------------------------------------------|
| Customer       | None (Public)        | `throttle:public`                          |
| Vendor         | `vendor`             | `vendor.status` (must be approved)         |
| Admin          | `admin` or `super_admin` | `throttle:admin`                       |

### Authorization Matrix

```
┌──────────────┬───────┬───────────────┬───────────────┬──────────┐
│ Action       │ Admin │ Vendor(owner) │ Vendor(other) │ Customer │
├──────────────┼───────┼───────────────┼───────────────┼──────────┤
│ List All     │ ✅    │ ❌             │ ❌             │ ✅ Public│
│ List Own     │ ✅    │ ✅             │ ❌             │ ❌       │
│ View Any     │ ✅    │ ❌             │ ❌             │ ✅ Approved│
│ View Own     │ ✅    │ ✅             │ ❌             │ ❌       │
│ Create       │ ❌    │ ✅             │ ✅             │ ❌       │
│ Update       │ ✅    │ ✅ Own only    │ ❌             │ ❌       │
│ Delete       │ ✅    │ ✅ Draft/Rejected│ ❌           │ ❌       │
│ Approve      │ ✅    │ ❌             │ ❌             │ ❌       │
│ Reject       │ ✅    │ ❌             │ ❌             │ ❌       │
│ Feature      │ ✅    │ ❌             │ ❌             │ ❌       │
│ Submit       │ ❌    │ ✅ Draft only  │ ❌             │ ❌       │
└──────────────┴───────┴───────────────┴───────────────┴──────────┘
```

---

## 3. Database Schema & Relations

### `products` table

| Column               | Type                  | Nullable | Default  | Note                                         |
|----------------------|-----------------------|----------|----------|----------------------------------------------|
| id                   | bigint (PK)           | No       | auto     |                                              |
| vendor_id            | bigint (FK)           | No       | —        | → `vendors.id` (immutable)                   |
| category_id          | bigint (FK)           | No       | —        | → `categories.id`                            |
| brand_id             | bigint (FK)           | Yes      | null     | → `brands.id`                                |
| name                 | string(255)           | No       | —        | Product name                                 |
| slug                 | string(255)           | No       | —        | URL-friendly identifier (auto-generated)     |
| description          | text                  | No       | —        | Full description (max 10000)                 |
| short_description    | string(500)           | Yes      | null     | Brief summary                                |
| sku                  | string(100)           | No       | —        | Stock Keeping Unit (unique)                  |
| price                | decimal(10,2)         | No       | —        | Regular price                                |
| sale_price           | decimal(10,2)         | Yes      | null     | Discounted price (must be < price)           |
| cost_price           | decimal(10,2)         | Yes      | null     | Cost price (vendor/admin only)               |
| type                 | enum                  | No       | simple   | `simple` or `variable`                       |
| status               | enum                  | No       | draft    | Product status (see State Machine)           |
| visibility           | enum                  | No       | visible  | `visible`, `catalog`, `hidden`               |
| weight               | decimal(8,2)          | Yes      | null     | Weight in KG                                 |
| dimensions           | json                  | Yes      | null     | `{length, width, height}`                    |
| stock_quantity       | integer               | No       | 0        | Stock count (simple products only)           |
| low_stock_threshold  | integer               | Yes      | null     | Alert threshold                              |
| is_featured          | boolean               | No       | false    | Featured product flag (admin only)           |
| is_active            | boolean               | No       | true     | Active/inactive toggle                       |
| rating_average       | decimal(2,1)          | No       | 0        | Avg rating (0-5)                             |
| review_count         | integer               | No       | 0        | Total reviews                                |
| sales_count          | integer               | No       | 0        | Total sales                                  |
| meta_title           | string(70)            | Yes      | null     | SEO title                                    |
| meta_description     | string(160)           | Yes      | null     | SEO description                              |
| published_at         | timestamp             | Yes      | null     | First approval timestamp                     |
| deleted_at           | timestamp             | Yes      | null     | Soft delete                                  |
| created_at           | timestamp             | No       | auto     |                                              |
| updated_at           | timestamp             | No       | auto     |                                              |

### `product_variants` table

| Column            | Type                  | Nullable | Default | Note                                    |
|-------------------|-----------------------|----------|---------|-----------------------------------------|
| id                | bigint (PK)           | No       | auto    |                                         |
| product_id        | bigint (FK)           | No       | —       | → `products.id` (cascade)               |
| sku               | string(100)           | No       | —       | Unique variant SKU                      |
| name              | string(255)           | Yes      | null    | Variant name (e.g., "Red / S")          |
| price             | decimal(10,2)         | No       | —       | Variant price                           |
| sale_price        | decimal(10,2)         | Yes      | null    | Variant sale price                      |
| cost_price        | decimal(10,2)         | Yes      | null    | Variant cost price                      |
| stock_quantity    | integer               | No       | 0       | Variant stock                           |
| weight            | decimal(8,2)          | Yes      | null    | Variant weight                          |
| barcode           | string(100)           | Yes      | null    | Barcode (EAN/UPC)                       |
| image_url         | string                | Yes      | null    | Variant-specific image                  |
| is_active         | boolean               | No       | true    |                                         |
| created_at        | timestamp             | No       | auto    |                                         |
| updated_at        | timestamp             | No       | auto    |                                         |

### `product_variant_options` (Pivot)

| Column                      | Type         | Nullable | Note                                    |
|-----------------------------|--------------|----------|-----------------------------------------|
| id                          | bigint (PK)  | No       |                                         |
| product_variant_id          | bigint (FK)  | No       | → `product_variants.id`                 |
| attribute_template_id       | bigint (FK)  | No       | → `attribute_templates.id`              |
| attribute_template_option_id| bigint (FK)  | No       | → `attribute_template_options.id`       |

### `product_images` table

| Column         | Type         | Nullable | Default | Note                                    |
|----------------|--------------|----------|---------|-----------------------------------------|
| id             | bigint (PK)  | No       | auto    |                                         |
| product_id     | bigint (FK)  | No       | —       | → `products.id` (cascade)               |
| url            | string       | No       | —       | Full image URL                          |
| alt_text       | string(255)  | Yes      | null    | Alt text for accessibility              |
| is_primary     | boolean      | No       | false   | Primary/thumbnail image                 |
| display_order  | integer      | No       | 0       | Sort order                              |
| created_at     | timestamp    | No       | auto    |                                         |
| updated_at     | timestamp    | No       | auto    |                                         |

### `product_attribute_values` table

| Column                 | Type         | Nullable | Note                                    |
|------------------------|--------------|----------|-----------------------------------------|
| id                     | bigint (PK)  | No       |                                         |
| product_id             | bigint (FK)  | No       | → `products.id`                         |
| attribute_template_id  | bigint (FK)  | No       | → `attribute_templates.id`              |
| value                  | text         | No       | Stored value                            |

### Computed Fields

| Field            | Formula                        | Description                                    |
|------------------|--------------------------------|------------------------------------------------|
| `effective_price`| `sale_price ?? price`          | Returns sale_price if set and < price          |
| `is_in_stock`    | `stock_quantity > 0`           | For simple products. Variable checks variants. |

### Relations Diagram

```
vendors ──────────────────┐
   │                      │
   │ hasMany              │ belongsTo
   ▼                      │
products ─────────────────┘
   │
   ├─ hasMany ──→ product_variants
   │                 │
   │                 └─ belongsToMany ──→ attribute_template_options
   │                                       (via product_variant_options)
   │
   ├─ hasMany ──→ product_images
   │
   ├─ hasMany ──→ product_attribute_values
   │                 │
   │                 └─ belongsTo ──→ attribute_templates
   │
   ├─ belongsTo ──→ categories
   │
   └─ belongsTo ──→ brands
```

---

## 4. Product Status State Machine

```
┌───────┐  submit   ┌─────────┐  approve  ┌──────────┐
│ DRAFT │─────────→ │ PENDING │─────────→ │ APPROVED │
└───┬───┘           └────┬────┘           └────┬─────┘
    ↑                    │ reject               │ major edit
    │   re-edit          ↓                      │
    │               ┌──────────┐               │
    └────────────── │ REJECTED │ ←─────────────┘
                    └──────────┘
    
    Any status → ARCHIVED (admin only)
```

### Status Details

| Status     | Label          | Color     | Editable | Deletable | Customer Visible |
|------------|----------------|-----------|----------|-----------|------------------|
| `draft`    | Draft          | secondary | ✅       | ✅        | ❌               |
| `pending`  | Pending Review | warning   | ❌       | ❌        | ❌               |
| `approved` | Approved       | success   | ✅*      | ❌        | ✅               |
| `rejected` | Rejected       | danger    | ✅       | ✅        | ❌               |
| `archived` | Archived       | dark      | ❌       | ❌        | ❌               |

> `*` Approved products এ edit করলে major field change হলে status আবার PENDING হয়ে যায়

### Major Edit Fields (triggers re-review on approved products)

```typescript
const MAJOR_EDIT_FIELDS = [
  'price',
  'sale_price', 
  'cost_price',
  'sku',
  'name',
  'category_id',
  'type',
  'weight',
  'dimensions'
]
```

> **⚠️ Major Edit Visibility Rule:**  
> When an APPROVED product is edited with major fields → status changes to PENDING.  
> **Customer Impact:** Product becomes **immediately invisible** to customers.

### Blocked Fields (vendor cannot modify)

```typescript
const BLOCKED_FIELDS = [
  'vendor_id',
  'status',
  'is_featured',
  'rating_average',
  'review_count',
  'sales_count',
  'published_at'
]
```

---

## 5. Customer/Public APIs

> **Prefix:** `/api/v1/customer/products`  
> **Auth:** Not required (Public)  
> **Middleware:** `throttle:public`

---

### 5.1 Browse Products

**`GET /api/v1/customer/products`**

#### Query Parameters

| Param        | Type    | Required | Default | Description                                  |
|--------------|---------|----------|---------|----------------------------------------------|
| category_id  | int     | No       | —       | Filter by category                           |
| brand_id     | int     | No       | —       | Filter by brand                              |
| price_min    | numeric | No       | —       | Minimum price                                |
| price_max    | numeric | No       | —       | Maximum price                                |
| in_stock     | boolean | No       | —       | Only in-stock products                       |
| rating_min   | numeric | No       | —       | Minimum rating (0-5)                         |
| sort         | string  | No       | latest  | Sort order                                   |
| per_page     | int     | No       | 20      | Items per page (1-100)                       |

**Sort Options:** `latest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`, `rating`, `popular`

#### Request Example

```bash
GET /api/v1/customer/products?category_id=5&sort=price_asc&per_page=20
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Premium Cotton T-Shirt",
      "slug": "premium-cotton-t-shirt",
      "short_description": "Soft 100% cotton t-shirt",
      "sku": "TSHIRT-001",
      "price": 1200.00,
      "sale_price": 999.00,
      "effective_price": 999.00,
      "type": "variable",
      "status": "approved",
      "visibility": "visible",
      "is_featured": true,
      "is_active": true,
      "is_in_stock": true,
      "stock_quantity": 150,
      "rating_average": 4.5,
      "review_count": 28,
      "thumbnail": "https://cdn.example.com/products/1/thumb.webp",
      "category": {
        "id": 5,
        "name": "T-Shirts",
        "slug": "t-shirts"
      },
      "vendor": {
        "id": 12,
        "store_name": "Fashion World",
        "slug": "fashion-world"
      },
      "variant_count": 6,
      "price_range": {
        "min": 999.00,
        "max": 1299.00
      },
      "created_at": "2026-01-15T10:30:00+06:00",
      "updated_at": "2026-02-20T14:45:00+06:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 95,
    "from": 1,
    "to": 20
  },
  "links": {
    "first": "https://api.example.com/api/v1/customer/products?page=1",
    "last": "https://api.example.com/api/v1/customer/products?page=5",
    "prev": null,
    "next": "https://api.example.com/api/v1/customer/products?page=2"
  }
}
```

#### Simple vs Variable Product Fields

| Field           | Simple Product              | Variable Product                     |
|-----------------|-----------------------------|------------------------------------- |
| `variant_count` | `0` or field absent         | Number of variants (e.g., `6`)       |
| `price_range`   | `null` or field absent      | `{ "min": 999, "max": 1299 }`        |
| `stock_quantity`| Product's total stock       | Sum of all variant stocks            |

---

### 5.2 Search Products

**`GET /api/v1/customer/products/search`**

#### Query Parameters

| Param       | Type    | Required | Description                     |
|-------------|---------|----------|---------------------------------|
| q           | string  | **Yes**  | Search query (min 2, max 200)   |
| category_id | int     | No       | Filter by category              |
| brand_id    | int     | No       | Filter by brand                 |
| price_min   | numeric | No       | Min price                       |
| price_max   | numeric | No       | Max price                       |
| per_page    | int     | No       | Items per page (1-50)           |

#### Request Example

```bash
GET /api/v1/customer/products/search?q=cotton%20shirt&price_max=2000
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": [...],
  "meta": {...},
  "links": {...},
  "facets": {
    "categories": [
      { "id": 5, "name": "T-Shirts", "count": 23 },
      { "id": 8, "name": "Polo Shirts", "count": 12 }
    ],
    "brands": [
      { "id": 3, "name": "ComfortWear", "count": 15 },
      { "id": 7, "name": "StyleMax", "count": 10 }
    ],
    "price_ranges": [
      { "min": 0, "max": 500, "count": 8 },
      { "min": 500, "max": 1000, "count": 14 },
      { "min": 1000, "max": 2000, "count": 13 }
    ]
  },
  "applied_filters": {
    "q": "cotton shirt",
    "price_max": 2000,
    "category_id": null,
    "brand_id": null
  }
}
```

> **Note:** `facets` may be empty array `[]` if Meilisearch faceting is not configured.

---

### 5.3 Get Featured Products

**`GET /api/v1/customer/products/featured`**

#### Query Parameters

| Param    | Type | Description             | Default |
|----------|------|-------------------------|---------|
| per_page | int  | Items per page (1-50)   | `12`    |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Featured products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Premium Cotton T-Shirt",
      "is_featured": true,
      "...": "..."
    }
  ],
  "meta": {...}
}
```

---

### 5.4 Get Products by Category

**`GET /api/v1/customer/products/category/{category}`**

#### URL Parameters

| Param    | Type   | Description              |
|----------|--------|--------------------------|
| category | string | Category slug or ID      |

#### Query Parameters

| Param    | Type   | Description              |
|----------|--------|--------------------------|
| sort     | string | Sort order               |
| per_page | int    | Items per page (1-100)   |

#### Success Response — `200 OK`

Same structure as Browse Products.

---

### 5.5 Get Product Detail

**`GET /api/v1/customer/products/{slug}`**

#### URL Parameters

| Param | Type   | Description    |
|-------|--------|----------------|
| slug  | string | Product slug   |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": 1,
    "name": "Premium Cotton T-Shirt",
    "slug": "premium-cotton-t-shirt",
    "description": "Full HTML description...",
    "short_description": "Soft 100% cotton t-shirt",
    "sku": "TSHIRT-001",
    "price": 1200.00,
    "sale_price": 999.00,
    "effective_price": 999.00,
    "type": "variable",
    "status": "approved",
    "visibility": "visible",
    "weight": 0.25,
    "dimensions": {
      "length": 30,
      "width": 25,
      "height": 2
    },
    "is_featured": true,
    "is_active": true,
    "is_in_stock": true,
    "rating_average": 4.5,
    "review_count": 28,
    "sales_count": 156,
    "stock_quantity": 150,
    "low_stock_threshold": 10,
    "meta_title": "Premium Cotton T-Shirt | Fashion World",
    "meta_description": "Buy premium 100% cotton t-shirt...",
    "published_at": "2026-01-15T12:00:00+06:00",
    
    "category": {
      "id": 5,
      "name": "T-Shirts",
      "slug": "t-shirts"
    },
    "brand": {
      "id": 3,
      "name": "ComfortWear",
      "slug": "comfortwear"
    },
    "vendor": {
      "id": 12,
      "store_name": "Fashion World",
      "slug": "fashion-world",
      "logo_url": "https://cdn.example.com/vendors/12/logo.webp"
    },
    
    "images": [
      {
        "id": 1,
        "url": "https://cdn.example.com/products/1/main.webp",
        "alt_text": "Premium Cotton T-Shirt Front View",
        "is_primary": true,
        "display_order": 0
      },
      {
        "id": 2,
        "url": "https://cdn.example.com/products/1/back.webp",
        "alt_text": "Premium Cotton T-Shirt Back View",
        "is_primary": false,
        "display_order": 1
      }
    ],
    
    "attributes": [
      {
        "template_id": 10,
        "name": "Material",
        "type": "select",
        "value": "100% Cotton",
        "display": "100% Cotton",
        "unit": null
      },
      {
        "template_id": 11,
        "name": "Care Instructions",
        "type": "text",
        "value": "Machine wash cold",
        "display": "Machine wash cold",
        "unit": null
      }
    ],
    
    "variant_config": [
      {
        "template_id": 1,
        "name": "Color",
        "options": ["Red", "Blue", "Black"]
      },
      {
        "template_id": 2,
        "name": "Size",
        "options": ["S", "M", "L", "XL"]
      }
    ],
    
    "variant_matrix": {
      "axes": [
        {
          "template_id": 1,
          "name": "Color",
          "options": [
            {"option_id": 101, "value": "Red"},
            {"option_id": 102, "value": "Blue"},
            {"option_id": 103, "value": "Black"}
          ]
        },
        {
          "template_id": 2,
          "name": "Size",
          "options": [
            {"option_id": 201, "value": "S"},
            {"option_id": 202, "value": "M"},
            {"option_id": 203, "value": "L"},
            {"option_id": 204, "value": "XL"}
          ]
        }
      ],
      "total_combinations": 12,
      "generated_variants": 12
    },
    
    "variants": [
      {
        "id": 101,
        "sku": "TSHIRT-001-RED-S",
        "name": "Red / S",
        "price": 1200.00,
        "sale_price": 999.00,
        "effective_price": 999.00,
        "stock_quantity": 25,
        "is_in_stock": true,
        "is_active": true,
        "weight": 0.25,
        "image_url": "https://cdn.example.com/products/1/red.webp",
        "barcode": "1234567890123",
        "options": [
          {
            "template": "Color",
            "template_id": 1,
            "value": "Red",
            "option_id": 101
          },
          {
            "template": "Size",
            "template_id": 2,
            "value": "S",
            "option_id": 201
          }
        ]
      }
    ],
    
    "created_at": "2026-01-15T10:30:00+06:00",
    "updated_at": "2026-02-20T14:45:00+06:00"
  }
}
```

#### Error Response — `404 Not Found`

```json
{
  "success": false,
  "message": "Product 'nonexistent-product' not found."
}
```

---

## 6. Vendor APIs

> **Prefix:** `/api/v1/vendor/products`  
> **Auth:** Bearer Token + Role: `vendor`  
> **Middleware:** `auth:sanctum`, `role:vendor`, `vendor.status`, `throttle:vendor`

---

### 6.1 List Vendor's Own Products

**`GET /api/v1/vendor/products`**

#### Query Parameters

| Param       | Type   | Description                                     |
|-------------|--------|-------------------------------------------------|
| status      | string | `draft`, `pending`, `approved`, `rejected`      |
| search      | string | Search by name or SKU                           |
| category_id | int    | Filter by category                              |
| sort        | string | `latest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc` |
| per_page    | int    | Items per page (1-100)                          |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [...],
  "meta": {...}
}
```

---

### 6.2 Create Product

**`POST /api/v1/vendor/products`**

#### Simple Product Request Body

```json
{
  "name": "Premium Cotton T-Shirt",
  "description": "<p>Full HTML description...</p>",
  "short_description": "Soft 100% cotton t-shirt",
  "sku": "TSHIRT-001",
  "price": 1200.00,
  "sale_price": 999.00,
  "cost_price": 600.00,
  "type": "simple",
  "category_id": 5,
  "brand_id": 3,
  "weight": 0.25,
  "dimensions": {
    "length": 30,
    "width": 25,
    "height": 2
  },
  "stock_quantity": 100,
  "low_stock_threshold": 10,
  "meta_title": "Premium Cotton T-Shirt | Fashion World",
  "meta_description": "Buy premium 100% cotton t-shirt...",
  "visibility": "visible",
  "is_active": true,
  "attribute_values": [
    { "template_id": 10, "value": "100% Cotton" },
    { "template_id": 11, "value": "Machine wash cold" }
  ]
}
```

#### Variable Product Request Body

```json
{
  "name": "Premium Cotton T-Shirt (Multiple Colors)",
  "description": "<p>Full HTML description...</p>",
  "short_description": "Soft 100% cotton t-shirt in multiple colors",
  "sku": "TSHIRT-VAR-001",
  "price": 1200.00,
  "sale_price": 999.00,
  "cost_price": 600.00,
  "type": "variable",
  "category_id": 5,
  "brand_id": 3,
  "weight": 0.25,
  "meta_title": "Premium Cotton T-Shirt | Fashion World",
  "meta_description": "Buy premium 100% cotton t-shirt...",
  "visibility": "visible",
  "is_active": true,
  
  "attribute_values": [
    { "template_id": 10, "value": "100% Cotton" }
  ],
  
  "variant_config": [
    {
      "template_id": 1,
      "option_ids": [101, 102, 103]
    },
    {
      "template_id": 2,
      "option_ids": [201, 202, 203, 204]
    }
  ],
  
  "variants": [
    {
      "sku": "TSHIRT-VAR-001-RED-S",
      "price": 1200.00,
      "sale_price": 999.00,
      "stock_quantity": 25,
      "weight": 0.25,
      "is_active": true,
      "option_ids": [101, 201]
    },
    {
      "sku": "TSHIRT-VAR-001-RED-M",
      "price": 1200.00,
      "sale_price": 999.00,
      "stock_quantity": 30,
      "weight": 0.26,
      "is_active": true,
      "option_ids": [101, 202]
    }
  ]
}
```

#### Validation Rules

| Field                               | Rules                                           |
|-------------------------------------|-------------------------------------------------|
| name                                | required, string, max:255                       |
| description                         | required, string, max:10000                     |
| short_description                   | nullable, string, max:500                       |
| sku                                 | required, string, max:100, unique               |
| price                               | required, numeric, min:0, max:9999999.99        |
| sale_price                          | nullable, numeric, min:0, lt:price              |
| cost_price                          | nullable, numeric, min:0                        |
| type                                | required, in:simple,variable                    |
| category_id                         | required, integer, exists:categories            |
| brand_id                            | nullable, integer, exists:brands                |
| weight                              | nullable, numeric, min:0                        |
| dimensions                          | nullable, array                                 |
| dimensions.*                        | nullable, numeric, min:0                        |
| stock_quantity                      | required_if:type,simple, integer, min:0         |
| low_stock_threshold                 | nullable, integer, min:0                        |
| meta_title                          | nullable, string, max:70                        |
| meta_description                    | nullable, string, max:160                       |
| visibility                          | nullable, in:visible,hidden,catalog             |
| is_active                           | nullable, boolean                               |
| images                              | nullable, array, max:10                         |
| images.*                            | image, max:5120                                 |
| attribute_values                    | nullable, array                                 |
| attribute_values.*.template_id      | required_with:attribute_values, exists          |
| attribute_values.*.value            | required_with:attribute_values                  |
| variant_config                      | required_if:type,variable, array                |
| variant_config.*.template_id        | required, exists (variant-defining)             |
| variant_config.*.option_ids         | required, array of existing option IDs          |
| variants                            | nullable, array                                 |
| variants.*.sku                      | required, string, unique                        |
| variants.*.price                    | required, numeric, min:0                        |
| variants.*.sale_price               | nullable, numeric, lt:price                     |
| variants.*.stock_quantity           | required, integer, min:0                        |
| variants.*.weight                   | nullable, numeric, min:0                        |
| variants.*.is_active                | nullable, boolean (default: true)               |
| variants.*.option_ids               | required, array                                 |

#### Attribute Values Transformation

**Input (Create/Update Request):**
```json
"attribute_values": [
  { "template_id": 10, "value": "100% Cotton" },
  { "template_id": 11, "value": "Machine wash cold" }
]
```

**Output (Response `attributes` array):**
```json
"attributes": [
  {
    "template_id": 10,
    "name": "Material",
    "type": "select",
    "value": "100% Cotton",
    "display": "100% Cotton",
    "unit": null
  }
]
```

#### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Premium Cotton T-Shirt",
    "slug": "premium-cotton-t-shirt",
    "status": "draft",
    "...": "..."
  }
}
```

#### Validation Error — `422`

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": ["The name field is required."],
    "price": ["The price must be at least 0."],
    "sale_price": ["Sale price must be less than the regular price."]
  }
}
```

---

### 6.3 Show Own Product

**`GET /api/v1/vendor/products/{product}`**

#### URL Parameters

| Param   | Type   | Description           |
|---------|--------|-----------------------|
| product | string | Product slug or ID    |

#### Success Response — `200 OK`

Full product detail as in Customer endpoint, plus `cost_price` field.

---

### 6.4 Update Product

**`PUT /api/v1/vendor/products/{product}`**

Supports partial update (PATCH style).

#### Request Body

```json
{
  "name": "Updated Product Name",
  "price": 1500.00,
  "description": "Updated description..."
}
```

> **Note:**  
> - Minor edits (description, images, meta, stock) on APPROVED products stay APPROVED  
> - Major edits (price, sku, name, category) on APPROVED products → status becomes PENDING

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {...}
}
```

---

### 6.5 Delete Product

**`DELETE /api/v1/vendor/products/{product}`**

**Constraints:**
- Only `draft` and `rejected` products can be deleted
- Products with active orders cannot be deleted

#### Success Response — `204 No Content`

Empty body

#### Error Response — `400 Bad Request`

```json
{
  "success": false,
  "message": "Product cannot be deleted in 'Approved' status. Only draft and rejected products can be deleted.",
  "errors": {
    "status": "approved"
  }
}
```

#### Error Response — Active Orders — `400`

```json
{
  "success": false,
  "message": "Product cannot be deleted because it has active orders.",
  "errors": {
    "reason": "active_orders"
  }
}
```

---

### 6.6 Submit for Review

**`PUT /api/v1/vendor/products/{product}/submit`**

**Constraints:**
- Product must be in `draft` status

**Simple Product Requirements:**
- ✅ `name` (required)
- ✅ `price` (required)
- ✅ `sku` (required)
- ✅ `category_id` (required)
- ✅ At least 1 image
- ✅ `stock_quantity` ≥ 0

**Variable Product Requirements:**
- ✅ All simple product requirements
- ✅ At least 1 `variant_config`
- ✅ At least 1 active variant with stock > 0
- ✅ All variants must have unique SKUs

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Product submitted for review successfully",
  "data": {
    "status": "pending",
    "...": "..."
  }
}
```

---

### 6.7 Restore Deleted Product

**`PUT /api/v1/vendor/products/{product}/restore`**

**Constraints:**
- Only soft-deleted products can be restored
- Product must belong to the authenticated vendor

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Product restored successfully",
  "data": {
    "id": 1,
    "status": "draft",
    "deleted_at": null,
    "...": "..."
  }
}
```

---

### 6.8 Get Product Attribute Templates

**`GET /api/v1/vendor/products/{product}/attributes`**

Returns available **non-variant** attribute templates inherited from the product's category hierarchy.

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Attribute templates retrieved successfully",
  "data": [
    {
      "id": 10,
      "name": "Material",
      "slug": "material",
      "data_type": "select",
      "is_required": true,
      "is_filterable": true,
      "is_variant_defining": false,
      "unit": null,
      "options": [
        { "id": 1001, "value": "cotton", "label": "100% Cotton" },
        { "id": 1002, "value": "polyester", "label": "100% Polyester" }
      ]
    }
  ]
}
```

---

### 6.9 Vendor Product Image Endpoints

#### Upload Images

**`POST /api/v1/vendor/products/{product}/images`**

**Request:** `multipart/form-data`

| Field       | Type   | Description                         |
|-------------|--------|-------------------------------------|
| images[]    | file   | Image files (max 10, each max 5MB)  |
| alt_texts[] | string | Alt text for each image             |

**Supported Formats:** `jpeg`, `png`, `webp`, `gif`

#### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "id": 1,
      "url": "https://cdn.example.com/...",
      "alt_text": "Product front view",
      "is_primary": true,
      "display_order": 0
    }
  ]
}
```

---

#### Delete Image

**`DELETE /api/v1/vendor/products/{product}/images/{image}`**

#### Success Response — `204 No Content`

---

#### Reorder Images

**`PUT /api/v1/vendor/products/{product}/images/reorder`**

#### Request Body

```json
{
  "image_ids": [3, 1, 2, 5, 4]
}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Image order updated successfully",
  "data": [
    {
      "id": 3,
      "url": "https://cdn.example.com/products/1/back.webp",
      "is_primary": true,
      "display_order": 0
    }
  ]
}
```

> **Note:** First image in the array (display_order: 0) automatically becomes `is_primary: true`.

---

## 7. Admin APIs

> **Prefix:** `/api/v1/admin/products`  
> **Auth:** Bearer Token + Role: `admin` or `super_admin`  
> **Middleware:** `auth:sanctum`, `role:admin,super_admin`, `throttle:admin`

---

### 7.1 List All Products

**`GET /api/v1/admin/products`**

#### Query Parameters

| Param       | Type    | Description                                         |
|-------------|---------|-----------------------------------------------------|
| search      | string  | Search by name, SKU, vendor name                    |
| status      | string  | `draft`, `pending`, `approved`, `rejected`, `archived` |
| category_id | int     | Filter by category                                  |
| vendor_id   | int     | Filter by vendor                                    |
| brand_id    | int     | Filter by brand                                     |
| is_featured | boolean | Filter by featured status                           |
| price_min   | numeric | Minimum price                                       |
| price_max   | numeric | Maximum price                                       |
| in_stock    | boolean | Filter by stock availability                        |
| rating_min  | numeric | Minimum rating                                      |
| sort        | string  | Sort order                                          |
| per_page    | int     | Items per page (1-100)                              |

---

### 7.2 Show Product Detail

**`GET /api/v1/admin/products/{product}`**

**Note:** Admin view includes `cost_price` field.

---

### 7.3 Approve Product

**`PUT /api/v1/admin/products/{product}/approve`**

**Constraints:**
- Product must be in `pending` status
- Sets `published_at` on first approval

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Product approved successfully",
  "data": {
    "status": "approved",
    "published_at": "2026-02-26T10:30:00+06:00",
    "...": "..."
  }
}
```

---

### 7.4 Reject Product

**`PUT /api/v1/admin/products/{product}/reject`**

#### Request Body

```json
{
  "reason": "Product description is insufficient and does not meet our quality standards."
}
```

#### Validation Rules

| Field  | Rules                        |
|--------|------------------------------|
| reason | required, string, min:10, max:2000 |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Product rejected successfully",
  "data": {
    "status": "rejected",
    "...": "..."
  }
}
```

---

### 7.5 Toggle Featured Status

**`PUT /api/v1/admin/products/{product}/feature`**

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Product featured successfully",
  "data": {
    "is_featured": true,
    "...": "..."
  }
}
```

---

### 7.6 Delete Product

**`DELETE /api/v1/admin/products/{product}`**

Admin can delete any product regardless of status. Products with active orders are soft-deleted only.

#### Success Response — `204 No Content`

---

## 8. Error Reference

### HTTP Status Codes

| Code | Meaning             | When                                        |
|------|---------------------|---------------------------------------------|
| 200  | OK                  | Successful GET/PUT                          |
| 201  | Created             | Successful POST                             |
| 204  | No Content          | Successful DELETE                           |
| 400  | Bad Request         | Business logic error                        |
| 401  | Unauthorized        | Missing/invalid token                       |
| 403  | Forbidden           | No permission                               |
| 404  | Not Found           | Product not found                           |
| 422  | Validation Error    | Invalid input                               |
| 429  | Too Many Requests   | Rate limit exceeded                         |
| 500  | Server Error        | Internal error                              |

### Common Error Responses

#### Validation Error — `422`
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": ["The name field is required."],
    "price": ["The price must be at least 0."]
  }
}
```

#### Business Error — `400`
```json
{
  "success": false,
  "message": "Product cannot be edited in 'Pending Review' status.",
  "errors": {
    "status": "pending"
  }
}
```

#### Status Transition Error — `400`
```json
{
  "success": false,
  "message": "Only pending products can be approved. Current: Draft",
  "errors": {
    "current_status": "draft"
  }
}
```

#### Not Found — `404`
```json
{
  "success": false,
  "message": "Product 'my-product' not found."
}
```

#### Forbidden — `403`
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

---

## 9. Frontend Integration Guide

### কোন Page এ কী API ব্যবহার হবে

### 9.1 Customer — Product Listing Page

> **Page:** `/products`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                     |
|-------------------------|----------------------------------------------------|--------|----------------------------------|
| Browse products         | `/customer/products`                                | GET    | Page load, filter change         |
| Search products         | `/customer/products/search?q=xxx`                   | GET    | Search input (debounced)         |
| Filter by category      | `/customer/products?category_id=5`                  | GET    | Category select                  |
| Sort products           | `/customer/products?sort=price_asc`                 | GET    | Sort dropdown change             |
| Load featured           | `/customer/products/featured`                       | GET    | Homepage featured section        |
| Category products       | `/customer/products/category/{slug}`                | GET    | Category page load               |

### 9.2 Customer — Product Detail Page

> **Page:** `/products/{slug}`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                     |
|-------------------------|----------------------------------------------------|--------|----------------------------------|
| Load product detail     | `/customer/products/{slug}`                         | GET    | Page load                        |
| Select variant          | Frontend logic                                      | —      | Variant option click             |

### 9.3 Vendor — Product List Page

> **Page:** `/vendor/products`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                     |
|-------------------------|----------------------------------------------------|--------|----------------------------------|
| List own products       | `/vendor/products`                                  | GET    | Page load                        |
| Search products         | `/vendor/products?search=xxx`                       | GET    | Search input (debounced)         |
| Filter by status        | `/vendor/products?status=draft`                     | GET    | Status tab click                 |
| Delete product          | `/vendor/products/{slug}`                           | DELETE | Delete button + confirm          |
| Submit for review       | `/vendor/products/{slug}/submit`                    | PUT    | "Submit for Review" button       |

### 9.4 Vendor — Product Create Page

> **Page:** `/vendor/products/create`

| Action                  | API Endpoint                                       | Method | কখน Call হবে                     |
|-------------------------|----------------------------------------------------|--------|----------------------------------|
| Load categories         | `/vendor/categories`                                | GET    | Page load (dropdown)             |
| Load brands             | `/vendor/brands`                                    | GET    | Page load (dropdown)             |
| Load category templates | `/vendor/categories/{slug}/templates`               | GET    | Category select change           |
| Create product          | `/vendor/products`                                  | POST   | Form submit                      |
| Upload images           | `/vendor/products/{slug}/images`                    | POST   | Image drop/select                |

### 9.5 Vendor — Product Edit Page

> **Page:** `/vendor/products/{slug}/edit`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                     |
|-------------------------|----------------------------------------------------|--------|----------------------------------|
| Load product data       | `/vendor/products/{slug}`                           | GET    | Page load                        |
| Load attribute templates| `/vendor/products/{slug}/attributes`                | GET    | Page load                        |
| Update product          | `/vendor/products/{slug}`                           | PUT    | Form submit                      |
| Upload images           | `/vendor/products/{slug}/images`                    | POST   | Image upload                     |
| Delete image            | `/vendor/products/{slug}/images/{id}`               | DELETE | Image delete click               |
| Reorder images          | `/vendor/products/{slug}/images/reorder`            | PUT    | Drag & drop reorder              |

### 9.6 Admin — Product List Page

> **Page:** `/admin/products`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                     |
|-------------------------|----------------------------------------------------|--------|----------------------------------|
| List all products       | `/admin/products`                                   | GET    | Page load                        |
| Filter by status        | `/admin/products?status=pending`                    | GET    | Status tab click                 |
| Filter by vendor        | `/admin/products?vendor_id=12`                      | GET    | Vendor select                    |
| Search products         | `/admin/products?search=xxx`                        | GET    | Search input (debounced)         |
| Delete product          | `/admin/products/{slug}`                            | DELETE | Delete button + confirm          |
| Toggle featured         | `/admin/products/{slug}/feature`                    | PUT    | Featured toggle click            |

### 9.7 Admin — Product Detail/Review Page

> **Page:** `/admin/products/{slug}`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                     |
|-------------------------|----------------------------------------------------|--------|----------------------------------|
| Load product detail     | `/admin/products/{slug}`                            | GET    | Page load                        |
| Approve product         | `/admin/products/{slug}/approve`                    | PUT    | "Approve" button click           |
| Reject product          | `/admin/products/{slug}/reject`                     | PUT    | "Reject" button + reason modal   |
| Toggle featured         | `/admin/products/{slug}/feature`                    | PUT    | Featured toggle click            |

---

## সংক্ষেপে Route Summary

### Customer Endpoints

| # | Method | Endpoint                                   | Purpose                    | Status Code |
|---|--------|--------------------------------------------|----------------------------|-------------|
| 1 | GET    | `/customer/products`                        | Browse products            | 200         |
| 2 | GET    | `/customer/products/search`                 | Search products            | 200         |
| 3 | GET    | `/customer/products/featured`               | Featured products          | 200         |
| 4 | GET    | `/customer/products/category/{category}`    | Products by category       | 200         |
| 5 | GET    | `/customer/products/{slug}`                 | Product detail             | 200 / 404   |

### Vendor Endpoints

| #  | Method | Endpoint                                          | Purpose              | Status Code      |
|----|--------|---------------------------------------------------|----------------------|------------------|
| 6  | GET    | `/vendor/products`                                 | List own products    | 200              |
| 7  | POST   | `/vendor/products`                                 | Create product       | 201 / 422        |
| 8  | GET    | `/vendor/products/{product}`                       | Show own product     | 200 / 404        |
| 9  | PUT    | `/vendor/products/{product}`                       | Update product       | 200 / 400 / 422  |
| 10 | DELETE | `/vendor/products/{product}`                       | Delete product       | 204 / 400        |
| 11 | PUT    | `/vendor/products/{product}/submit`                | Submit for review    | 200 / 400        |
| 12 | PUT    | `/vendor/products/{product}/restore`               | Restore deleted      | 200 / 404        |
| 13 | GET    | `/vendor/products/{product}/attributes`            | Get attr templates   | 200              |
| 14 | POST   | `/vendor/products/{product}/images`                | Upload images        | 201 / 422        |
| 15 | DELETE | `/vendor/products/{product}/images/{image}`        | Delete image         | 204              |
| 16 | PUT    | `/vendor/products/{product}/images/reorder`        | Reorder images       | 200              |

### Admin Endpoints

| #  | Method | Endpoint                                   | Purpose              | Status Code      |
|----|--------|--------------------------------------------|----------------------|------------------|
| 17 | GET    | `/admin/products`                           | List all products    | 200              |
| 18 | GET    | `/admin/products/{product}`                 | Show product detail  | 200 / 404        |
| 19 | PUT    | `/admin/products/{product}/approve`         | Approve product      | 200 / 400        |
| 20 | PUT    | `/admin/products/{product}/reject`          | Reject product       | 200 / 400 / 422  |
| 21 | PUT    | `/admin/products/{product}/feature`         | Toggle featured      | 200              |
| 22 | DELETE | `/admin/products/{product}`                 | Delete product       | 204              |

---

## 10. UI Implementation Plan

### 10.1 Required Pages & Components

#### Customer Pages

| Page                | Route                    | Components                                |
|---------------------|--------------------------|-------------------------------------------|
| Product List        | `/products`              | ProductGrid, FilterSidebar, SortDropdown  |
| Product Search      | `/products/search`       | SearchBar, ProductGrid, Facets            |
| Category Products   | `/category/{slug}`       | ProductGrid, CategoryBreadcrumb           |
| Product Detail      | `/product/{slug}`        | ImageGallery, VariantSelector, AddToCart  |

#### Vendor Pages

| Page                | Route                          | Components                                   |
|---------------------|--------------------------------|----------------------------------------------|
| Product List        | `/vendor/products`             | DataTable, StatusBadge, ActionButtons        |
| Product Create      | `/vendor/products/create`      | ProductForm, ImageUploader, VariantBuilder   |
| Product Edit        | `/vendor/products/:slug/edit`  | ProductForm, ImageUploader, VariantBuilder   |
| Product Detail      | `/vendor/products/:slug`       | ProductDetail, StatusTimeline                |

#### Admin Pages

| Page                | Route                          | Components                                   |
|---------------------|--------------------------------|----------------------------------------------|
| Product List        | `/admin/products`              | DataTable, StatusTabs, VendorFilter          |
| Product Review      | `/admin/products/:slug`        | ProductDetail, ApproveRejectBar              |
| Pending Products    | `/admin/products/pending`      | DataTable, QuickActions                      |

---

### 10.2 Required Components

#### Shared Components

```typescript
// ProductCard.vue - Product grid card
interface ProductCardProps {
  product: Product
  showVendor?: boolean
  showStatus?: boolean
}

// StatusBadge.vue - Product status indicator
interface StatusBadgeProps {
  status: ProductStatus
  size?: 'sm' | 'md' | 'lg'
}

// PriceDisplay.vue - Price with sale price
interface PriceDisplayProps {
  price: number
  salePrice?: number
  currency?: string
}

// StockBadge.vue - Stock availability indicator
interface StockBadgeProps {
  quantity: number
  threshold?: number
}
```

#### Vendor Components

```typescript
// VariantBuilder.vue - Build product variants
interface VariantBuilderProps {
  variantConfig: VariantConfig[]
  variants: ProductVariant[]
  templates: AttributeTemplate[]
}

// ImageUploader.vue - Product image management
interface ImageUploaderProps {
  images: ProductImage[]
  maxImages?: number
  maxFileSize?: number
}

// ProductForm.vue - Create/Edit product form
interface ProductFormProps {
  product?: Product
  categories: Category[]
  brands: Brand[]
  templates: AttributeTemplate[]
}
```

#### Admin Components

```typescript
// ProductReviewPanel.vue - Approve/Reject panel
interface ProductReviewPanelProps {
  product: Product
  onApprove: () => void
  onReject: (reason: string) => void
}

// RejectModal.vue - Rejection reason modal
interface RejectModalProps {
  productId: number
  onReject: (reason: string) => void
}
```

---

### 10.3 TypeScript Types

```typescript
// types/product.ts

export type ProductType = 'simple' | 'variable'
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived'
export type ProductVisibility = 'visible' | 'catalog' | 'hidden'

export interface Product {
  id: number
  vendorId: number
  categoryId: number
  brandId?: number
  name: string
  slug: string
  description: string
  shortDescription?: string
  sku: string
  price: number
  salePrice?: number
  costPrice?: number
  effectivePrice: number
  type: ProductType
  status: ProductStatus
  visibility: ProductVisibility
  weight?: number
  dimensions?: ProductDimensions
  stockQuantity: number
  lowStockThreshold?: number
  isFeatured: boolean
  isActive: boolean
  isInStock: boolean
  ratingAverage: number
  reviewCount: number
  salesCount: number
  metaTitle?: string
  metaDescription?: string
  publishedAt?: string
  thumbnail?: string
  
  // Relations
  category?: Category
  brand?: Brand
  vendor?: Vendor
  images?: ProductImage[]
  attributes?: ProductAttribute[]
  variantConfig?: VariantConfig[]
  variantMatrix?: VariantMatrix
  variants?: ProductVariant[]
  
  createdAt: string
  updatedAt: string
}

export interface ProductDimensions {
  length?: number
  width?: number
  height?: number
}

export interface ProductImage {
  id: number
  url: string
  altText?: string
  isPrimary: boolean
  displayOrder: number
}

export interface ProductAttribute {
  templateId: number
  name: string
  type: string
  value: string
  display: string
  unit?: string
}

export interface VariantConfig {
  templateId: number
  name: string
  options: string[]
  optionIds?: number[]
}

export interface VariantMatrix {
  axes: VariantAxis[]
  totalCombinations: number
  generatedVariants: number
}

export interface VariantAxis {
  templateId: number
  name: string
  options: VariantOption[]
}

export interface VariantOption {
  optionId: number
  value: string
}

export interface ProductVariant {
  id: number
  sku: string
  name: string
  price: number
  salePrice?: number
  effectivePrice: number
  stockQuantity: number
  isInStock: boolean
  isActive: boolean
  weight?: number
  imageUrl?: string
  barcode?: string
  options: VariantOptionValue[]
}

export interface VariantOptionValue {
  template: string
  templateId: number
  value: string
  optionId: number
}

// Create/Update DTOs
export interface CreateProductDTO {
  name: string
  description: string
  shortDescription?: string
  sku: string
  price: number
  salePrice?: number
  costPrice?: number
  type: ProductType
  categoryId: number
  brandId?: number
  weight?: number
  dimensions?: ProductDimensions
  stockQuantity?: number
  lowStockThreshold?: number
  metaTitle?: string
  metaDescription?: string
  visibility?: ProductVisibility
  isActive?: boolean
  attributeValues?: AttributeValueInput[]
  variantConfig?: VariantConfigInput[]
  variants?: VariantInput[]
}

export interface AttributeValueInput {
  templateId: number
  value: string
}

export interface VariantConfigInput {
  templateId: number
  optionIds: number[]
}

export interface VariantInput {
  sku: string
  price: number
  salePrice?: number
  stockQuantity: number
  weight?: number
  isActive?: boolean
  optionIds: number[]
}

// Filters
export interface ProductFilters {
  search?: string
  status?: ProductStatus
  categoryId?: number
  vendorId?: number
  brandId?: number
  isFeatured?: boolean
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  ratingMin?: number
  sort?: ProductSort
  perPage?: number
  page?: number
}

export type ProductSort = 
  | 'latest' 
  | 'oldest' 
  | 'price_asc' 
  | 'price_desc' 
  | 'name_asc' 
  | 'name_desc' 
  | 'rating' 
  | 'popular'

// API Responses
export interface ProductListResponse {
  success: boolean
  message: string
  data: Product[]
  meta: PaginationMeta
  links: PaginationLinks
}

export interface ProductDetailResponse {
  success: boolean
  message: string
  data: Product
}

export interface SearchResponse extends ProductListResponse {
  facets?: SearchFacets
  appliedFilters?: Record<string, any>
}

export interface SearchFacets {
  categories: FacetItem[]
  brands: FacetItem[]
  priceRanges: PriceRangeFacet[]
}

export interface FacetItem {
  id: number
  name: string
  count: number
}

export interface PriceRangeFacet {
  min: number
  max: number
  count: number
}
```

---

### 10.4 Service Implementation

```typescript
// services/product.service.ts

import { api } from './api'
import type { 
  Product, 
  ProductFilters, 
  ProductListResponse,
  ProductDetailResponse,
  CreateProductDTO,
  SearchResponse
} from '@/types/product'

const CUSTOMER_BASE = '/customer/products'
const VENDOR_BASE = '/vendor/products'
const ADMIN_BASE = '/admin/products'

export const productService = {
  // ============= Customer APIs =============
  
  browse(filters: ProductFilters = {}) {
    return api.get<ProductListResponse>(CUSTOMER_BASE, { params: filters })
  },
  
  search(query: string, filters: Omit<ProductFilters, 'search'> = {}) {
    return api.get<SearchResponse>(`${CUSTOMER_BASE}/search`, {
      params: { q: query, ...filters }
    })
  },
  
  getFeatured(perPage = 12) {
    return api.get<ProductListResponse>(`${CUSTOMER_BASE}/featured`, {
      params: { per_page: perPage }
    })
  },
  
  getByCategory(category: string, filters: ProductFilters = {}) {
    return api.get<ProductListResponse>(`${CUSTOMER_BASE}/category/${category}`, {
      params: filters
    })
  },
  
  getDetail(slug: string) {
    return api.get<ProductDetailResponse>(`${CUSTOMER_BASE}/${slug}`)
  },
  
  // ============= Vendor APIs =============
  
  vendorList(filters: ProductFilters = {}) {
    return api.get<ProductListResponse>(VENDOR_BASE, { params: filters })
  },
  
  vendorCreate(data: CreateProductDTO) {
    return api.post<ProductDetailResponse>(VENDOR_BASE, data)
  },
  
  vendorShow(productSlug: string) {
    return api.get<ProductDetailResponse>(`${VENDOR_BASE}/${productSlug}`)
  },
  
  vendorUpdate(productSlug: string, data: Partial<CreateProductDTO>) {
    return api.put<ProductDetailResponse>(`${VENDOR_BASE}/${productSlug}`, data)
  },
  
  vendorDelete(productSlug: string) {
    return api.delete<void>(`${VENDOR_BASE}/${productSlug}`)
  },
  
  vendorSubmit(productSlug: string) {
    return api.put<ProductDetailResponse>(`${VENDOR_BASE}/${productSlug}/submit`)
  },
  
  vendorRestore(productSlug: string) {
    return api.put<ProductDetailResponse>(`${VENDOR_BASE}/${productSlug}/restore`)
  },
  
  vendorGetAttributes(productSlug: string) {
    return api.get(`${VENDOR_BASE}/${productSlug}/attributes`)
  },
  
  // Image Management
  vendorUploadImages(productSlug: string, formData: FormData) {
    return api.post(`${VENDOR_BASE}/${productSlug}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  vendorDeleteImage(productSlug: string, imageId: number) {
    return api.delete<void>(`${VENDOR_BASE}/${productSlug}/images/${imageId}`)
  },
  
  vendorReorderImages(productSlug: string, imageIds: number[]) {
    return api.put(`${VENDOR_BASE}/${productSlug}/images/reorder`, {
      image_ids: imageIds
    })
  },
  
  // ============= Admin APIs =============
  
  adminList(filters: ProductFilters = {}) {
    return api.get<ProductListResponse>(ADMIN_BASE, { params: filters })
  },
  
  adminShow(productSlug: string) {
    return api.get<ProductDetailResponse>(`${ADMIN_BASE}/${productSlug}`)
  },
  
  adminApprove(productSlug: string) {
    return api.put<ProductDetailResponse>(`${ADMIN_BASE}/${productSlug}/approve`)
  },
  
  adminReject(productSlug: string, reason: string) {
    return api.put<ProductDetailResponse>(`${ADMIN_BASE}/${productSlug}/reject`, {
      reason
    })
  },
  
  adminToggleFeatured(productSlug: string) {
    return api.put<ProductDetailResponse>(`${ADMIN_BASE}/${productSlug}/feature`)
  },
  
  adminDelete(productSlug: string) {
    return api.delete<void>(`${ADMIN_BASE}/${productSlug}`)
  }
}
```

---

### 10.5 Composables

```typescript
// composables/useProduct.ts

import { ref, computed } from 'vue'
import { productService } from '@/services/product.service'
import type { Product, ProductFilters, ProductStatus } from '@/types/product'
import { useToast } from './useToast'

export function useProduct() {
  const product = ref<Product | null>(null)
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  // Status helpers
  const statusConfig: Record<ProductStatus, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'secondary' },
    pending: { label: 'Pending Review', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'danger' },
    archived: { label: 'Archived', color: 'dark' }
  }

  const canEdit = computed(() => {
    if (!product.value) return false
    return ['draft', 'rejected', 'approved'].includes(product.value.status)
  })

  const canDelete = computed(() => {
    if (!product.value) return false
    return ['draft', 'rejected'].includes(product.value.status)
  })

  const canSubmit = computed(() => {
    if (!product.value) return false
    return product.value.status === 'draft'
  })

  // Fetch methods
  async function fetchProducts(filters: ProductFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await productService.vendorList(filters)
      products.value = response.data.data
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(slug: string) {
    loading.value = true
    error.value = null
    try {
      const response = await productService.vendorShow(slug)
      product.value = response.data.data
      return response.data.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitForReview(slug: string) {
    loading.value = true
    try {
      const response = await productService.vendorSubmit(slug)
      product.value = response.data.data
      toast.success('Product submitted for review')
      return response.data.data
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit product')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(slug: string) {
    loading.value = true
    try {
      await productService.vendorDelete(slug)
      toast.success('Product deleted successfully')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete product')
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    product,
    products,
    loading,
    error,
    statusConfig,
    canEdit,
    canDelete,
    canSubmit,
    fetchProducts,
    fetchProduct,
    submitForReview,
    deleteProduct
  }
}
```

```typescript
// composables/useVariantBuilder.ts

import { ref, computed, watch } from 'vue'
import type { 
  VariantConfig, 
  ProductVariant, 
  AttributeTemplate,
  VariantInput 
} from '@/types'

export function useVariantBuilder(templates: Ref<AttributeTemplate[]>) {
  const variantConfig = ref<VariantConfig[]>([])
  const variants = ref<ProductVariant[]>([])

  // Get variant-defining templates only
  const variantTemplates = computed(() =>
    templates.value.filter(t => t.isVariantDefining)
  )

  // Generate all possible combinations
  function generateCombinations(): VariantInput[] {
    if (variantConfig.value.length === 0) return []

    const optionSets = variantConfig.value.map(config => {
      const template = variantTemplates.value.find(t => t.id === config.templateId)
      if (!template) return []
      
      return config.optionIds.map(optionId => {
        const option = template.options.find(o => o.id === optionId)
        return {
          templateId: config.templateId,
          optionId,
          value: option?.label || ''
        }
      })
    })

    // Cartesian product
    const combinations = optionSets.reduce((acc, set) => {
      if (acc.length === 0) return set.map(o => [o])
      return acc.flatMap(combo => set.map(option => [...combo, option]))
    }, [] as any[])

    return combinations.map(combo => ({
      sku: '',
      price: 0,
      salePrice: undefined,
      stockQuantity: 0,
      weight: undefined,
      isActive: true,
      optionIds: combo.map((o: any) => o.optionId)
    }))
  }

  // Add variant config
  function addVariantConfig(templateId: number, optionIds: number[]) {
    const existing = variantConfig.value.findIndex(c => c.templateId === templateId)
    if (existing >= 0) {
      variantConfig.value[existing].optionIds = optionIds
    } else {
      const template = variantTemplates.value.find(t => t.id === templateId)
      variantConfig.value.push({
        templateId,
        name: template?.name || '',
        options: optionIds.map(id => {
          const opt = template?.options.find(o => o.id === id)
          return opt?.label || ''
        }),
        optionIds
      })
    }
  }

  // Remove variant config
  function removeVariantConfig(templateId: number) {
    const index = variantConfig.value.findIndex(c => c.templateId === templateId)
    if (index >= 0) {
      variantConfig.value.splice(index, 1)
    }
  }

  // Update single variant
  function updateVariant(index: number, data: Partial<VariantInput>) {
    if (variants.value[index]) {
      Object.assign(variants.value[index], data)
    }
  }

  // Bulk update variants
  function bulkUpdateVariants(field: keyof VariantInput, value: any) {
    variants.value.forEach(variant => {
      (variant as any)[field] = value
    })
  }

  return {
    variantConfig,
    variants,
    variantTemplates,
    generateCombinations,
    addVariantConfig,
    removeVariantConfig,
    updateVariant,
    bulkUpdateVariants
  }
}
```

---

### 10.6 Status Color Helper

```typescript
// utils/product.ts

export const PRODUCT_STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'secondary',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700'
  },
  pending: {
    label: 'Pending Review',
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700'
  },
  approved: {
    label: 'Approved',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700'
  },
  rejected: {
    label: 'Rejected',
    color: 'danger',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700'
  },
  archived: {
    label: 'Archived',
    color: 'dark',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-600'
  }
} as const

export function getStatusConfig(status: string) {
  return PRODUCT_STATUS_CONFIG[status as keyof typeof PRODUCT_STATUS_CONFIG] 
    || PRODUCT_STATUS_CONFIG.draft
}

export const MAJOR_EDIT_FIELDS = [
  'price',
  'sale_price',
  'cost_price',
  'sku',
  'name',
  'category_id',
  'type',
  'weight',
  'dimensions'
]

export function isMajorEdit(changedFields: string[]): boolean {
  return changedFields.some(field => MAJOR_EDIT_FIELDS.includes(field))
}
```

---

### 10.7 Rate Limits

| Endpoint Group      | Limit        | Endpoints                                              |
|---------------------|--------------|--------------------------------------------------------|
| Public (Customer)   | 60/minute    | `/customer/*` — browsing, search, product detail       |
| Auth                | 10/minute    | `/auth/login`, `/auth/register`, etc.                  |
| Vendor              | 120/minute   | `/vendor/*` — product CRUD, order management           |
| Admin               | 300/minute   | `/admin/*` — all admin operations                      |
| Uploads             | 20/minute    | Image upload endpoints                                 |

---

### 10.8 Events Dispatched

| Event            | When                          | Listeners                              |
|------------------|-------------------------------|----------------------------------------|
| `ProductCreated` | Product submitted for review  | Notify admin                           |
| `ProductApproved`| Admin approves product        | Notify vendor, sync search index       |
| `ProductRejected`| Admin rejects product         | Notify vendor with reason              |

---

### 10.9 Caching

| Cache Target         | TTL         | Tags                                    |
|----------------------|-------------|----------------------------------------|
| Featured products    | 1 hour      | `products`, `featured`                 |
| Category products    | 30 minutes  | `products:category:{id}`               |
| Vendor products      | 30 minutes  | `products:vendor:{id}`                 |
| Product detail       | 15 minutes  | `products:{slug}`                      |

---

### 10.10 Search (Meilisearch)

**Indexed fields:**
- `id`, `name`, `description`, `short_description`
- `sku`, `price`, `category`, `vendor`

**Searchable only for:** APPROVED + is_active products

**Fallback:** Database ILIKE search if Meilisearch unavailable

---

## 📝 Documentation Changelog

### v1.0 — February 26, 2026 — Initial Release

- Complete API documentation for Product CRUD
- Customer, Vendor, Admin endpoint separation
- Database schema and relations
- Product status state machine
- Variable product with variants support
- Image management endpoints
- Error reference
- Frontend integration guide with service & composables
- TypeScript types
- UI implementation plan
- Route summary table
