# Attribute Template API — সম্পূর্ণ ডকুমেন্টেশন

> **Base URL:** `/api/v1`
> **Authentication:** Bearer Token (Sanctum)
> **Role Required:** Admin / Super Admin (template CRUD), Vendor (read-only via category)
> **Content-Type:** `application/json`

---

## 📋 সূচিপত্র

1. [Database Schema & Relations](#1-database-schema--relations)
2. [Data Types & Enum Reference](#2-data-types--enum-reference)
3. [Admin APIs](#3-admin-apis)
   - [List Templates](#31-list-all-templates)
   - [Show Template](#32-show-template-details)
   - [Create Template](#33-create-template)
   - [Update Template](#34-update-template)
   - [Delete Template](#35-delete-template)
   - [Toggle Active](#36-toggle-active-status)
   - [Active Templates](#37-get-active-templates)
   - [Variant-Defining](#38-get-variant-defining-templates)
   - [Filterable](#39-get-filterable-templates)
   - [Data Types List](#310-get-data-types)
   - [Templates by Category](#311-get-templates-by-category)
   - [Variant Combinations](#312-generate-variant-combinations)
4. [Option Management APIs](#4-option-management-apis)
   - [Add Option](#41-add-option)
   - [Update Option](#42-update-option)
   - [Remove Option](#43-remove-option)
   - [Deprecate Option](#44-deprecate-option)
   - [Reorder Options](#45-reorder-options)
5. [Category ↔ Template Sync (Admin)](#5-category--template-sync-admin)
6. [Vendor APIs (Read Only)](#6-vendor-apis-read-only)
   - [Get Category Templates](#61-get-category-templates-vendor)
   - [Generate Variant Combinations](#62-generate-variant-combinations-vendor)
7. [Error Reference](#7-error-reference)
8. [Frontend Integration Guide](#8-frontend-integration-guide)
9. [Route Summary](#সংক্ষেপে-route-summary)
10. [Documentation Changelog](#-documentation-changelog)

---

## 1. Database Schema & Relations

### `attribute_templates` table

| Column              | Type                  | Nullable | Default | Note                                         |
|---------------------|-----------------------|----------|---------|----------------------------------------------|
| id                  | bigint (PK)           | No       | auto    |                                              |
| name                | string(255)           | No       | —       | Template name (e.g., "Color", "Size")        |
| slug                | string(255)           | No       | —       | Unique, auto-generated from name             |
| description         | text                  | Yes      | null    | Template description                         |
| data_type           | enum                  | No       | text    | `text`, `number`, `select`, `multiselect`, `boolean` |
| is_required         | boolean               | No       | false   | Required when filling product attributes     |
| is_filterable       | boolean               | No       | false   | Shows in customer filter sidebar             |
| is_variant_defining | boolean               | No       | false   | Used to create product variants (SKU)        |
| is_active           | boolean               | No       | true    | Active/Inactive status                       |
| validation_rules    | json                  | Yes      | null    | `{"min": 0, "max": 100, "regex": "...", "unit": "cm"}` |
| display_order       | unsigned int          | No       | 0       | Sort order                                   |
| unit                | string(50)            | Yes      | null    | For number type: cm, kg, ml, etc.            |
| placeholder         | string(255)           | Yes      | null    | Input placeholder text                       |
| help_text           | text                  | Yes      | null    | Help text shown below input                  |
| created_by          | bigint (FK)           | Yes      | null    | → `users.id`                                 |
| created_at          | timestamp             | No       | auto    |                                              |
| updated_at          | timestamp             | No       | auto    |                                              |

### `attribute_template_options` table

| Column                 | Type         | Nullable | Default | Note                                    |
|------------------------|--------------|----------|---------|-----------------------------------------|
| id                     | bigint (PK)  | No       | auto    |                                         |
| attribute_template_id  | bigint (FK)  | No       | —       | → `attribute_templates.id` (cascade)    |
| value                  | string(255)  | No       | —       | Stored value (e.g., "red")              |
| label                  | string(255)  | No       | —       | Display label (e.g., "Red", "লাল")     |
| color_code             | string(7)    | Yes      | null    | Hex code: `#FF0000`                     |
| image_url              | string       | Yes      | null    | Image URL for option swatch             |
| is_active              | boolean      | No       | true    |                                         |
| is_deprecated          | boolean      | No       | false   | Old option, hidden from new products    |
| display_order          | unsigned int | No       | 0       |                                         |
| created_at             | timestamp    | No       | auto    |                                         |
| updated_at             | timestamp    | No       | auto    |                                         |

**Unique Constraint:** `(attribute_template_id, value)` — একই template এ duplicate value থাকবে না।

#### Option Response Computed Fields

API responses এ option এর সাথে কিছু computed fields আসে যা database table এ নেই:

| Field      | Type    | Condition                                  | Description                        |
|------------|---------|--------------------------------------------|-------------------------------------|
| `is_color` | boolean | `color_code IS NOT NULL`                   | Has hex color code defined          |
| `has_image`| boolean | `image_url IS NOT NULL AND image_url != ''`| Has swatch image URL                |

এই fields automatic calculate হয় resource transform করার সময়।

### `category_attribute_templates` (Pivot Table)

| Column                 | Type         | Nullable | Default   | Note                                  |
|------------------------|--------------|----------|-----------|---------------------------------------|
| id                     | bigint (PK)  | No       | auto      |                                       |
| category_id            | bigint (FK)  | No       | —         | → `categories.id`                     |
| attribute_template_id  | bigint (FK)  | No       | —         | → `attribute_templates.id`            |
| is_required_override   | boolean      | Yes      | null      | NULL = template default, true/false = override |
| display_order          | unsigned int | No       | 0         |                                       |
| inheritance_mode       | enum         | No       | inherit   | `inherit` or `replace`                |
| is_inherited           | boolean      | No       | false     | Inherited from parent category?       |

**Unique Constraint:** `(category_id, attribute_template_id)`

### Relations Diagram

```
attribute_templates ──┐
   │                  │  (M:N via category_attribute_templates)
   │ hasMany          │
   ▼                  ▼
attribute_template_options    categories
```

---

## 2. Data Types & Enum Reference

### AttributeDataType Enum

| Value         | Label          | Input Type   | Requires Options | Can Define Variants |
|---------------|----------------|--------------|------------------|---------------------|
| `text`        | Text           | text         | No               | No                  |
| `number`      | Number         | number       | No               | No                  |
| `select`      | Single Select  | select       | **Yes**          | **Yes**             |
| `multiselect` | Multi Select   | multiselect  | **Yes**          | **Yes**             |
| `boolean`     | Yes/No         | checkbox     | No               | No                  |

### Variant-Defining Rules
- শুধুমাত্র `select` এবং `multiselect` type variant define করতে পারে
- `is_variant_defining: true` set করলে, সেই template এর options দিয়ে product variants (SKU) generate হবে
- Example: Color (Red, Blue) × Size (M, L) = 4 variants

### Inheritance Modes
- **`inherit`**: Parent category এর templates ও include হবে
- **`replace`**: শুধু নিজের templates, parent ignored

---

## 3. Admin APIs

> **Prefix:** `/api/v1/admin/attribute-templates`
> **Auth:** Bearer Token + Role: `admin` or `super_admin`
> **Headers:** `Authorization: Bearer {token}`, `Accept: application/json`

> ⚠️ **Reserved Slugs:** The following slugs are reserved for meta endpoints and cannot be used as template names:
> - `active`, `variant-defining`, `filterable`, `data-types`, `by-category`, `variant-combinations`
> 
> **Route Order:** In `routes/api.php`, static routes MUST be defined before the dynamic `{template}` route to avoid conflicts.

---

### 3.1 List All Templates

**`GET /api/v1/admin/attribute-templates`**

> ℹ️ **All list responses are paginated.** Default: `per_page=15`, Maximum: `per_page=100`

#### Query Parameters

| Param    | Type   | Required | Default | Description                                  |
|----------|--------|----------|---------|----------------------------------------------|
| search   | string | No       | —       | Search by name, slug, description            |
| type     | string | No       | —       | Filter by data_type: `text`, `number`, `select`, `multiselect`, `boolean` |
| per_page | int    | No       | 15      | Pagination size (max: 100)                   |

#### Request Example

```bash
GET /api/v1/admin/attribute-templates?search=color&type=select&per_page=10
Authorization: Bearer {token}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Attribute templates retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Color",
      "slug": "color",
      "description": "Product color",
      "data_type": "select",
      "data_type_label": "Single Select",
      "input_type": "select",
      "requires_options": true,
      "is_required": false,
      "is_filterable": true,
      "is_variant_defining": true,
      "is_active": true,
      "can_define_variants": true,
      "validation_rules": null,
      "display_order": 0,
      "unit": null,
      "placeholder": null,
      "help_text": null,
      "options": [
        {
          "id": 1,
          "value": "red",
          "label": "Red",
          "color_code": "#FF0000",
          "image_url": null,
          "is_active": true,
          "is_deprecated": false,
          "is_color": true,
          "has_image": false,
          "display_order": 0,
          "created_at": "2026-02-20T12:00:00+00:00"
        },
        {
          "id": 2,
          "value": "blue",
          "label": "Blue",
          "color_code": "#0000FF",
          "image_url": null,
          "is_active": true,
          "is_deprecated": false,
          "is_color": true,
          "has_image": false,
          "display_order": 1,
          "created_at": "2026-02-20T12:00:00+00:00"
        }
      ],
      "created_by": 1,
      "creator": {
        "id": 1,
        "name": "Admin User"
      },
      "created_at": "2026-02-20T12:00:00+00:00",
      "updated_at": "2026-02-20T12:00:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 1,
    "last_page": 1
  }
}
```

> **Note:** সব list response সবসময় paginated। Response এ `meta` object এ pagination info থাকে।

---

### 3.2 Show Template Details

**`GET /api/v1/admin/attribute-templates/{template}`**

> `{template}` = slug (e.g., `color`) অথবা ID (e.g., `1`) — দুইটাই কাজ করে।

#### Request Example

```bash
GET /api/v1/admin/attribute-templates/color
Authorization: Bearer {token}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Attribute template retrieved successfully",
  "data": {
    "id": 1,
    "name": "Color",
    "slug": "color",
    "description": "Product color",
    "data_type": "select",
    "data_type_label": "Single Select",
    "input_type": "select",
    "requires_options": true,
    "is_required": false,
    "is_filterable": true,
    "is_variant_defining": true,
    "is_active": true,
    "can_define_variants": true,
    "validation_rules": null,
    "display_order": 0,
    "unit": null,
    "placeholder": null,
    "help_text": null,
    "options": [
      {
        "id": 1,
        "value": "red",
        "label": "Red",
        "color_code": "#FF0000",
        "image_url": null,
        "is_active": true,
        "is_deprecated": false,
        "is_color": true,
        "has_image": false,
        "display_order": 0,
        "created_at": "2026-02-20T12:00:00+00:00"
      }
    ],
    "created_by": 1,
    "creator": {
      "id": 1,
      "name": "Admin User"
    },
    "categories_count": 3,
    "created_at": "2026-02-20T12:00:00+00:00",
    "updated_at": "2026-02-20T12:00:00+00:00"
  }
}
```

#### Error Response — `404 Not Found`

```json
{
  "success": false,
  "message": "Attribute template 'nonexistent' not found."
}
```

---

### 3.3 Create Template

**`POST /api/v1/admin/attribute-templates`**

> ⚠️ **Slug Reservation:** Template name will be converted to slug. Avoid names that convert to reserved slugs: `active`, `variant-defining`, `filterable`, `data-types`, `by-category`, `variant-combinations`.

#### Request Body (JSON)

| Field               | Type    | Required                | Validation                           |
|---------------------|---------|-------------------------|--------------------------------------|
| name                | string  | **Yes**                 | max:255                              |
| description         | string  | No                      | max:2000                             |
| data_type           | string  | **Yes**                 | `text`, `number`, `select`, `multiselect`, `boolean` |
| is_required         | boolean | No                      | default: false                       |
| is_filterable       | boolean | No                      | default: false                       |
| is_variant_defining | boolean | No                      | default: false                       |
| is_active           | boolean | No                      | default: true                        |
| validation_rules    | object  | No                      | See [Validation Rules Schema](#validation-rules-schema) below |
| display_order       | integer | No                      | min:0, default: 0                    |
| unit                | string  | No                      | max:50 (for number type)             |
| placeholder         | string  | No                      | max:255                              |
| help_text           | string  | No                      | max:500                              |
| options             | array   | **Yes** if select/multiselect | Required for select/multiselect  |
| options.*.value     | string  | Yes (with options)      | max:255                              |
| options.*.label     | string  | Yes (with options)      | max:255                              |
| options.*.color_code| string  | No                      | Hex: `#FF0000` (regex: `/^#[0-9A-Fa-f]{6}$/`) |
| options.*.image_url | string  | No                      | max:500                              |
| options.*.display_order | int | No                      | min:0                                |

#### Validation Rules Schema

| Data Type    | Supported Rules | Example                                      |
|--------------|-----------------|----------------------------------------------|
| `text`       | `regex`, `min_length`, `max_length` | `{"regex": "^[A-Z]", "max_length": 100}` |
| `number`     | `min`, `max`    | `{"min": 0, "max": 1000}`                  |
| `select`     | N/A             | null (validation via options)                |
| `multiselect`| N/A             | null (validation via options)                |
| `boolean`    | N/A             | null                                         |

> **Note:** `unit` field হলো আলাদা field, `validation_rules` এর part নয়।

#### Example 1: Select Type (Color with options)

```json
{
  "name": "Color",
  "description": "Product color attribute",
  "data_type": "select",
  "is_required": false,
  "is_filterable": true,
  "is_variant_defining": true,
  "options": [
    {
      "value": "red",
      "label": "Red",
      "color_code": "#FF0000"
    },
    {
      "value": "blue",
      "label": "Blue",
      "color_code": "#0000FF"
    },
    {
      "value": "green",
      "label": "Green",
      "color_code": "#00FF00"
    }
  ]
}
```

#### Example 2: Number Type (Weight)

```json
{
  "name": "Weight",
  "description": "Product weight",
  "data_type": "number",
  "unit": "kg",
  "placeholder": "Enter weight in kg",
  "validation_rules": {
    "min": 0,
    "max": 1000
  }
}
```

#### Example 3: Text Type (Brand)

```json
{
  "name": "Brand",
  "description": "Product brand name",
  "data_type": "text",
  "is_required": true,
  "is_filterable": true
}
```

#### Example 4: Boolean Type (Waterproof)

```json
{
  "name": "Waterproof",
  "data_type": "boolean",
  "is_filterable": true,
  "help_text": "Is this product waterproof?"
}
```

#### Example 5: Multiselect Type (Features)

```json
{
  "name": "Features",
  "description": "Product features",
  "data_type": "multiselect",
  "is_filterable": true,
  "options": [
    { "value": "bluetooth", "label": "Bluetooth" },
    { "value": "wifi", "label": "WiFi" },
    { "value": "nfc", "label": "NFC" },
    { "value": "gps", "label": "GPS" }
  ]
}
```

#### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Attribute template created successfully",
  "data": {
    "id": 10,
    "name": "Color",
    "slug": "color",
    "description": "Product color attribute",
    "data_type": "select",
    "data_type_label": "Single Select",
    "input_type": "select",
    "requires_options": true,
    "is_required": false,
    "is_filterable": true,
    "is_variant_defining": true,
    "is_active": true,
    "can_define_variants": true,
    "validation_rules": null,
    "display_order": 0,
    "unit": null,
    "placeholder": null,
    "help_text": null,
    "options": [
      {
        "id": 1,
        "value": "red",
        "label": "Red",
        "color_code": "#FF0000",
        "image_url": null,
        "is_active": true,
        "is_deprecated": false,
        "is_color": true,
        "has_image": false,
        "display_order": 0,
        "created_at": "2026-02-25T12:00:00+00:00"
      },
      {
        "id": 2,
        "value": "blue",
        "label": "Blue",
        "color_code": "#0000FF",
        "image_url": null,
        "is_active": true,
        "is_deprecated": false,
        "is_color": true,
        "has_image": false,
        "display_order": 1,
        "created_at": "2026-02-25T12:00:00+00:00"
      }
    ],
    "created_by": 1,
    "creator": {
      "id": 1,
      "name": "Admin User"
    },
    "created_at": "2026-02-25T12:00:00+00:00",
    "updated_at": "2026-02-25T12:00:00+00:00"
  }
}
```

#### Validation Error — `422 Unprocessable Entity`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["Template name is required."],
    "data_type": ["Data type is required."],
    "options": ["Options are required for select and multiselect types."],
    "options.0.value": ["The options.0.value field is required when options is present."],
    "options.0.color_code": ["The options.0.color_code format is invalid."]
  }
}
```

---

### 3.4 Update Template

**`PUT /api/v1/admin/attribute-templates/{template}`**

> Only send fields you want to update (partial update supported).

#### Request Body (JSON)

| Field               | Type    | Required | Note                            |
|---------------------|---------|----------|---------------------------------|
| name                | string  | No       | `sometimes|required`, max:255   |
| description         | string  | No       | max:2000                        |
| data_type           | string  | No       | `sometimes`, enum               |
| is_required         | boolean | No       |                                 |
| is_filterable       | boolean | No       |                                 |
| is_variant_defining | boolean | No       |                                 |
| is_active           | boolean | No       |                                 |
| validation_rules    | object  | No       | `{min, max, regex, unit}`       |
| display_order       | integer | No       | min:0                           |
| unit                | string  | No       | max:50                          |
| placeholder         | string  | No       | max:255                         |
| help_text           | string  | No       | max:500                         |
| options             | array   | No       | Full sync — see note below      |
| options.*.id        | int     | No       | Existing option ID to update    |
| options.*.value     | string  | Yes*     | Required when options present   |
| options.*.label     | string  | Yes*     | Required when options present   |
| options.*.color_code| string  | No       | Hex: `#FF0000`                  |
| options.*.image_url | string  | No       | max:500                         |
| options.*.display_order | int | No       | min:0                           |
| options.*.is_active | boolean | No       |                                 |

> ⚠️ **Data Type Change Warning:**
> - `data_type` পরিবর্তন করলে:
>   - `select`/`multiselect` → অন্য type: সব existing options delete হবে (product এ used থাকলে request fail হবে)
>   - অন্য type → `select`/`multiselect`: `options` array required হবে
>   - `is_variant_defining` auto-reset হবে যদি নতুন type variant support না করে
> - Production এ data_type change করা বিপজ্জনক — নতুন template তৈরি করা recommended

> **Options Sync Behavior:**
> - `options` array পাঠালে full sync হবে
> - `id` থাকলে existing option update হবে
> - `id` নেই নতুন option তৈরি হবে
> - Array তে missing options:
>   - ✅ **Product এ ব্যবহৃত নয়**: Delete হবে
>   - ⚠️ **Product এ ব্যবহৃত আছে**: Auto-deprecated হবে (safety measure)
> - `options` field না পাঠালে existing options unchanged থাকবে

#### Request Example

```json
{
  "name": "Color Updated",
  "is_filterable": true,
  "options": [
    { "id": 1, "value": "red", "label": "Red", "color_code": "#FF0000" },
    { "id": 2, "value": "blue", "label": "Blue", "color_code": "#0000FF" },
    { "value": "purple", "label": "Purple", "color_code": "#800080" }
  ]
}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Attribute template updated successfully",
  "data": {
    "id": 1,
    "name": "Color Updated",
    "slug": "color",
    "...": "... (same structure as show)"
  }
}
```

#### Error Response — `404 Not Found`

```json
{
  "success": false,
  "message": "Attribute template 'nonexistent' not found."
}
```

#### Warning Response — Options Auto-Deprecated — `200 OK`

```json
{
  "success": true,
  "message": "Attribute template updated successfully. Some options were auto-deprecated as they are in use.",
  "data": { "...": "..." },
  "warnings": [
    "Option 'Red' (ID: 1) was auto-deprecated because it is used in products"
  ]
}
```

---

### 3.5 Delete Template

**`DELETE /api/v1/admin/attribute-templates/{template}`**

> Template delete হবে **শুধুমাত্র** যদি কোনো product এ ব্যবহার না হয়ে থাকে। Product এ ব্যবহৃত template delete করলে error আসবে।

#### Request Example

```bash
DELETE /api/v1/admin/attribute-templates/color
Authorization: Bearer {token}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Attribute template deleted successfully",
  "data": null
}
```

#### Error — Template In Use — `409 Conflict`

```json
{
  "success": false,
  "message": "Template 'Color' is in use by products and cannot be deleted.",
  "error_code": "TEMPLATE_IN_USE",
  "meta": {
    "products_count": 42
  }
}
```

#### Error — Not Found — `404`

```json
{
  "success": false,
  "message": "Attribute template 'color' not found."
}
```

---

### 3.6 Toggle Active Status

**`PUT /api/v1/admin/attribute-templates/{template}/toggle-active`**

> Active ↔ Inactive toggle। No request body needed.

#### Request Example

```bash
PUT /api/v1/admin/attribute-templates/color/toggle-active
Authorization: Bearer {token}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Template status toggled successfully",
  "data": {
    "id": 1,
    "name": "Color",
    "is_active": false,
    "...": "..."
  }
}
```

---

### 3.7 Get Active Templates

**`GET /api/v1/admin/attribute-templates/active`**

> ⚠️ **Route Order:** This static route must be defined before `GET /attribute-templates/{template}` in routes file.

> শুধুমাত্র active templates। Dropdown/selector এ ব্যবহার করার জন্য।

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Active templates retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Color",
      "slug": "color",
      "data_type": "select",
      "is_active": true,
      "options": [
        { "id": 1, "value": "red", "label": "Red", "color_code": "#FF0000", "is_active": true, "is_deprecated": false, "...": "..." }
      ],
      "...": "..."
    }
  ]
}
```

---

### 3.8 Get Variant-Defining Templates

**`GET /api/v1/admin/attribute-templates/variant-defining`**

> ⚠️ **Route Order:** This static route must be defined before `GET /attribute-templates/{template}` in routes file.

> শুধুমাত্র variant-defining (active) templates — product variant generation এ ব্যবহার হয়।

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Variant-defining templates retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Color",
      "is_variant_defining": true,
      "can_define_variants": true,
      "options": [
        { "id": 1, "value": "red", "label": "Red" },
        { "id": 2, "value": "blue", "label": "Blue" }
      ],
      "...": "..."
    },
    {
      "id": 2,
      "name": "Size",
      "is_variant_defining": true,
      "can_define_variants": true,
      "options": [
        { "id": 10, "value": "m", "label": "M" },
        { "id": 11, "value": "l", "label": "L" }
      ],
      "...": "..."
    }
  ]
}
```

---

### 3.9 Get Filterable Templates

**`GET /api/v1/admin/attribute-templates/filterable`**

> ⚠️ **Route Order:** This static route must be defined before `GET /attribute-templates/{template}` in routes file.

> শুধুমাত্র filterable (active) templates — customer filter UI তে দেখানো হয়।

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Filterable templates retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Color",
      "is_filterable": true,
      "options": [ "..." ],
      "...": "..."
    }
  ]
}
```

---

### 3.10 Get Data Types

**`GET /api/v1/admin/attribute-templates/data-types`**

> ⚠️ **Route Order:** This static route must be defined before `GET /attribute-templates/{template}` in routes file.

> Template create form এর data_type dropdown এ ব্যবহার।

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Data types retrieved successfully",
  "data": [
    {
      "value": "text",
      "label": "Text",
      "input_type": "text",
      "requires_options": false
    },
    {
      "value": "number",
      "label": "Number",
      "input_type": "number",
      "requires_options": false
    },
    {
      "value": "select",
      "label": "Single Select",
      "input_type": "select",
      "requires_options": true
    },
    {
      "value": "multiselect",
      "label": "Multi Select",
      "input_type": "multiselect",
      "requires_options": true
    },
    {
      "value": "boolean",
      "label": "Yes/No",
      "input_type": "checkbox",
      "requires_options": false
    }
  ]
}
```

---

### 3.11 Get Templates by Category

**`GET /api/v1/admin/attribute-templates/by-category/{category}`**

> ⚠️ **Route Order:** This static route must be defined before `GET /attribute-templates/{template}` in routes file.

> **Difference from Section 5.1:** এই endpoint attribute templates controller থেকে serve হয় এবং template-centric view দেয়। Section 5.1 (`/admin/categories/{category}/templates`) category controller থেকে serve হয় এবং category-centric view দেয়। Response structure same but context আলাদা।

#### Query Parameters

| Param             | Type    | Default | Description                         |
|-------------------|---------|---------|-------------------------------------|
| include_inherited | boolean | true    | Parent category এর templates include করবে? |

#### Request Example

```bash
GET /api/v1/admin/attribute-templates/by-category/electronics?include_inherited=true
Authorization: Bearer {token}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Category templates retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Color",
      "slug": "color",
      "data_type": "select",
      "options": [ "..." ],
      "pivot": {
        "is_required_override": null,
        "display_order": 0,
        "inheritance_mode": "inherit",
        "is_inherited": false
      },
      "...": "..."
    },
    {
      "id": 6,
      "name": "Storage",
      "slug": "storage",
      "data_type": "select",
      "options": [ "..." ],
      "pivot": {
        "is_required_override": true,
        "display_order": 1,
        "inheritance_mode": "inherit",
        "is_inherited": true
      },
      "...": "..."
    }
  ]
}
```

---

### 3.12 Generate Variant Combinations

**`GET /api/v1/admin/attribute-templates/variant-combinations/{category}`**

> ⚠️ **Route Order:** This static route must be defined before `GET /attribute-templates/{template}` in routes file.

> Category এর variant-defining templates থেকে সব সম্ভব variant combination generate করবে।
> Product তৈরি করার সময় কোন variants possible সেটা দেখানোর জন্য।

#### Request Example

```bash
GET /api/v1/admin/attribute-templates/variant-combinations/t-shirts
Authorization: Bearer {token}
```

#### Success Response — `200 OK`

> Example: Color (Red, Blue) × Size (M, L) = 4 combinations

```json
{
  "success": true,
  "message": "Variant combinations generated successfully",
  "data": [
    {
      "1": {
        "template_name": "Color",
        "option_value": "red",
        "option_label": "Red"
      },
      "2": {
        "template_name": "Size",
        "option_value": "m",
        "option_label": "M"
      }
    },
    {
      "1": {
        "template_name": "Color",
        "option_value": "red",
        "option_label": "Red"
      },
      "2": {
        "template_name": "Size",
        "option_value": "l",
        "option_label": "L"
      }
    },
    {
      "1": {
        "template_name": "Color",
        "option_value": "blue",
        "option_label": "Blue"
      },
      "2": {
        "template_name": "Size",
        "option_value": "m",
        "option_label": "M"
      }
    },
    {
      "1": {
        "template_name": "Color",
        "option_value": "blue",
        "option_label": "Blue"
      },
      "2": {
        "template_name": "Size",
        "option_value": "l",
        "option_label": "L"
      }
    }
  ]
}
```

> **Key:** template ID → `{ template_name, option_value, option_label }`

---

## 4. Option Management APIs

> Options শুধুমাত্র `select` এবং `multiselect` type templates এ add করা যায়।

---

### 4.1 Add Option

**`POST /api/v1/admin/attribute-templates/{template}/options`**

#### Request Body

| Field         | Type   | Required | Validation                         |
|---------------|--------|----------|------------------------------------|
| value         | string | **Yes**  | max:255                            |
| label         | string | **Yes**  | max:255                            |
| color_code    | string | No       | Hex format: `#FF0000`              |
| image_url     | string | No       | max:500                            |
| display_order | int    | No       | min:0                              |

#### Request Example

```json
{
  "value": "purple",
  "label": "Purple",
  "color_code": "#800080"
}
```

#### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Option added successfully",
  "data": {
    "id": 15,
    "value": "purple",
    "label": "Purple",
    "color_code": "#800080",
    "image_url": null,
    "is_active": true,
    "is_deprecated": false,
    "is_color": true,
    "has_image": false,
    "display_order": 0,
    "created_at": "2026-02-25T14:00:00+00:00"
  }
}
```

#### Error — Wrong Type — `422 Unprocessable Entity`

```json
{
  "success": false,
  "message": "Template 'Brand' (type: text) does not support options.",
  "error_code": "INVALID_DATA_TYPE_FOR_OPTIONS"
}
```

#### Validation Error — `422`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "value": ["The value field is required."],
    "label": ["The label field is required."],
    "color_code": ["The color code format is invalid."]
  }
}
```

---

### 4.2 Update Option

**`PUT /api/v1/admin/attribute-templates/options/{option}`**

> `{option}` = Option ID (integer)

#### Request Body

| Field         | Type    | Required | Note                    |
|---------------|---------|----------|-------------------------|
| value         | string  | No       | max:255                 |
| label         | string  | No       | max:255                 |
| color_code    | string  | No       | Hex: `#FF0000`          |
| image_url     | string  | No       | max:500                 |
| is_active     | boolean | No       |                         |
| display_order | int     | No       | min:0                   |

#### Request Example

```json
{
  "label": "Dark Red",
  "color_code": "#8B0000"
}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Option updated successfully",
  "data": {
    "id": 1,
    "value": "red",
    "label": "Dark Red",
    "color_code": "#8B0000",
    "...": "..."
  }
}
```

---

### 4.3 Remove Option

**`DELETE /api/v1/admin/attribute-templates/options/{option}`**

> Option delete হবে **শুধুমাত্র** যদি কোনো product এ ব্যবহার না হয়ে থাকে। ব্যবহৃত option delete না করে deprecate করুন।

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Option removed successfully",
  "data": null
}
```

#### Error — Option In Use — `409 Conflict`

```json
{
  "success": false,
  "message": "Option 'Red' is in use by products and cannot be deleted. Consider deprecating instead.",
  "error_code": "OPTION_IN_USE",
  "meta": {
    "products_count": 15,
    "suggestion": "Use PUT /options/{id}/deprecate instead"
  }
}
```

---

### 4.4 Deprecate Option

**`PUT /api/v1/admin/attribute-templates/options/{option}/deprecate`**

> Deprecate করলে option existing products এ থেকে যাবে, কিন্তু নতুন product creation এ দেখাবে না। No request body needed.

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Option deprecated successfully",
  "data": {
    "id": 1,
    "value": "red",
    "label": "Red",
    "is_active": true,
    "is_deprecated": true,
    "...": "..."
  }
}
```

---

### 4.5 Reorder Options

**`PUT /api/v1/admin/attribute-templates/{template}/options/reorder`**

#### Request Body

| Field   | Type       | Required | Description                         |
|---------|------------|----------|-------------------------------------|
| order   | int[]      | **Yes**  | Option IDs in desired display order |

#### Validation Rules

- সব option IDs এই template এর হতে হবে (অন্য template এর ID দিলে validation error)
- সব existing active options অবশ্যই `order` array তে থাকতে হবে
- Deprecated options skip করা যাবে
- যেসব options `order` এ নেই তারা শেষে display_order অনুযায়ী থাকবে

#### Request Example

```json
{
  "order": [3, 1, 2, 5, 4]
}
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Options reordered successfully",
  "data": null
}
```

#### Validation Error — `422`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "order": ["The order field is required."],
    "order.0": ["The selected order.0 is invalid."]
  }
}
```

---

## 5. Category ↔ Template Sync (Admin)

> Category controller থেকে template assign/sync করা হয়।

### 5.1 Get Category Templates

**`GET /api/v1/admin/categories/{category}/templates`**

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Category templates retrieved",
  "data": [
    {
      "id": 1,
      "name": "Color",
      "slug": "color",
      "data_type": "select",
      "pivot": {
        "is_required_override": null,
        "display_order": 0,
        "inheritance_mode": "inherit",
        "is_inherited": false
      },
      "...": "..."
    }
  ]
}
```

### 5.2 Sync Templates to Category

**`PUT /api/v1/admin/categories/{category}/templates`**

#### Request Body

```json
{
  "templates": [
    {
      "id": 1,
      "is_required_override": true,
      "display_order": 0,
      "inheritance_mode": "inherit"
    },
    {
      "id": 2,
      "is_required_override": null,
      "display_order": 1,
      "inheritance_mode": "inherit"
    }
  ]
}
```

---

## 6. Vendor APIs (Read Only)

Vendors can view templates assigned to a category when creating products.

### 6.1 Get Category Templates (Vendor)

**`GET /api/v1/vendor/categories/{category}/templates`**

> Vendor তাদের product creation form এ category select করার পর এই API call করবে।
> 
> ℹ️ **Creator Info:** Vendor response এ `created_by` এবং `creator` field include করা হয় না (security/privacy)।

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Color",
      "slug": "color",
      "data_type": "select",
      "input_type": "select",
      "is_required": false,
      "is_variant_defining": true,
      "placeholder": null,
      "help_text": null,
      "options": [
        { "id": 1, "value": "red", "label": "Red", "color_code": "#FF0000", "is_color": true },
        { "id": 2, "value": "blue", "label": "Blue", "color_code": "#0000FF", "is_color": true }
      ]
    },
    {
      "id": 5,
      "name": "Weight",
      "slug": "weight",
      "data_type": "number",
      "input_type": "number",
      "is_required": true,
      "is_variant_defining": false,
      "unit": "kg",
      "placeholder": "Enter weight in kg",
      "help_text": null,
      "options": []
    }
  ]
}
```

---

### 6.2 Generate Variant Combinations (Vendor)

**`GET /api/v1/vendor/categories/{category}/variant-combinations`**

> Product তৈরি করার সময় vendor কে possible variants preview দেখানোর জন্য।
> Admin endpoint (3.12) এর মতোই response structure।

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Variant combinations generated successfully",
  "data": [
    {
      "1": {
        "template_name": "Color",
        "option_value": "red",
        "option_label": "Red"
      },
      "2": {
        "template_name": "Size",
        "option_value": "m",
        "option_label": "M"
      }
    }
  ]
}
```

> **Frontend Alternative:** যদি এই endpoint implement না করা হয় তাহলে frontend এ নিচের function দিয়ে calculate করুন:

```javascript
/**
 * Generate variant combinations from variant-defining templates
 * @param {Array} templates - Templates with is_variant_defining: true
 * @returns {Array} - Cartesian product of all options
 */
function generateVariantCombinations(templates) {
  const variantTemplates = templates.filter(t => 
    t.is_variant_defining && 
    (t.data_type === 'select' || t.data_type === 'multiselect')
  )
  
  if (variantTemplates.length === 0) return []
  
  // Filter active, non-deprecated options
  const optionSets = variantTemplates.map(template => {
    const activeOptions = template.options.filter(
      opt => opt.is_active && !opt.is_deprecated
    )
    return activeOptions.map(option => ({
      template_id: template.id,
      template_name: template.name,
      option_id: option.id,
      option_value: option.value,
      option_label: option.label,
    }))
  })
  
  // Cartesian product
  return optionSets.reduce((acc, options) => {
    if (acc.length === 0) {
      return options.map(opt => ({ [opt.template_id]: opt }))
    }
    return acc.flatMap(combo => 
      options.map(opt => ({ ...combo, [opt.template_id]: opt }))
    )
  }, [])
}
```

---

## 7. Error Reference

### HTTP Status Codes

| Code | Meaning                 | কখন হয়                                    |
|------|-------------------------|--------------------------------------------|
| 200  | OK                      | Successful GET, PUT, DELETE                 |
| 201  | Created                 | Successful POST (template/option created)   |
| 401  | Unauthorized            | Missing/invalid Bearer token                |
| 403  | Forbidden               | User doesn't have admin role                |
| 404  | Not Found               | Template/option slug/ID not found           |
| 409  | Conflict                | Template/option in use, cannot delete       |
| 422  | Unprocessable Entity    | Validation errors                           |
| 429  | Too Many Requests       | Rate limit exceeded                         |
| 500  | Server Error            | Unexpected server error (actual crashes)    |

### Common Error Responses

#### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Attribute template '{identifier}' not found."
}
```

#### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

#### 409 Conflict — Template In Use
```json
{
  "success": false,
  "message": "Template 'Color' is in use by products and cannot be deleted.",
  "error_code": "TEMPLATE_IN_USE",
  "meta": {
    "products_count": 42
  }
}
```

#### 409 Conflict — Option In Use
```json
{
  "success": false,
  "message": "Option 'Red' is in use by products and cannot be deleted. Consider deprecating instead.",
  "error_code": "OPTION_IN_USE",
  "meta": {
    "products_count": 15,
    "suggestion": "Use PUT /options/{id}/deprecate instead"
  }
}
```

#### 422 Unprocessable — Type Mismatch
```json
{
  "success": false,
  "message": "Template 'Brand' (type: text) does not support options.",
  "error_code": "INVALID_DATA_TYPE_FOR_OPTIONS"
}
```

#### 422 Unprocessable — Reserved Slug
```json
{
  "success": false,
  "message": "The name 'active' converts to a reserved slug. Please choose a different name.",
  "error_code": "RESERVED_SLUG",
  "errors": {
    "name": ["This name is reserved. Reserved names: active, variant-defining, filterable, data-types, by-category, variant-combinations"]
  }
}
```

---

## 8. Frontend Integration Guide

### কোন Page এ কী API ব্যবহার হবে

### 8.1 Admin Panel — Attribute Templates Page

> **Page:** `/admin/attribute-templates`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                         |
|-------------------------|----------------------------------------------------|--------|--------------------------------------|
| Template list load      | `/admin/attribute-templates`                        | GET    | Page load, search, filter change     |
| Search templates        | `/admin/attribute-templates?search=xxx`             | GET    | Search input onChange (debounced)     |
| Filter by type          | `/admin/attribute-templates?type=select`            | GET    | Type dropdown change                 |
| View template details   | `/admin/attribute-templates/{slug}`                 | GET    | Table row click / eye icon           |
| Delete template         | `/admin/attribute-templates/{slug}`                 | DELETE | Delete button click + confirm dialog |
| Toggle active           | `/admin/attribute-templates/{slug}/toggle-active`   | PUT    | Toggle switch click                  |

### 8.2 Admin Panel — Create Template Page

> **Page:** `/admin/attribute-templates/create`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                         |
|-------------------------|----------------------------------------------------|--------|--------------------------------------|
| Load data types         | `/admin/attribute-templates/data-types`             | GET    | Page load (data_type dropdown fill)  |
| Create template         | `/admin/attribute-templates`                        | POST   | Form submit                          |

### 8.3 Admin Panel — Edit Template Page

> **Page:** `/admin/attribute-templates/{slug}/edit`

| Action                  | API Endpoint                                       | Method | কখন Call হবে                         |
|-------------------------|----------------------------------------------------|--------|--------------------------------------|
| Load template data      | `/admin/attribute-templates/{slug}`                 | GET    | Page load (form prefill)             |
| Load data types         | `/admin/attribute-templates/data-types`             | GET    | Page load (data_type dropdown fill)  |
| Update template         | `/admin/attribute-templates/{slug}`                 | PUT    | Form submit                          |
| Add new option          | `/admin/attribute-templates/{slug}/options`         | POST   | "Add Option" button                  |
| Update option           | `/admin/attribute-templates/options/{id}`           | PUT    | Option inline edit save              |
| Remove option           | `/admin/attribute-templates/options/{id}`           | DELETE | Option delete button + confirm       |
| Deprecate option        | `/admin/attribute-templates/options/{id}/deprecate` | PUT    | Deprecate button click               |
| Reorder options         | `/admin/attribute-templates/{slug}/options/reorder` | PUT    | Drag & drop reorder                  |

### 8.4 Admin Panel — Category Edit Page (Template Assignment)

> **Page:** `/admin/categories/{slug}/edit` (Templates tab)

| Action                  | API Endpoint                                                  | Method | কখন Call হবে                    |
|-------------------------|--------------------------------------------------------------|--------|----------------------------------|
| Load active templates   | `/admin/attribute-templates/active`                           | GET    | Template selector dropdown load  |
| Load assigned templates | `/admin/categories/{slug}/templates`                          | GET    | Page load (current assignments)  |
| Sync templates          | `/admin/categories/{slug}/templates`                          | PUT    | Save assignments button          |
| Preview variants        | `/admin/attribute-templates/variant-combinations/{slug}`      | GET    | "Preview Variants" button click  |

### 8.5 Vendor Panel — Product Create/Edit Page

> **Page:** `/vendor/products/create` বা `/vendor/products/{slug}/edit`

| Action                  | API Endpoint                                                   | Method | কখন Call হবে                        |
|-------------------------|---------------------------------------------------------------|--------|---------------------------------------|
| Load category templates | `/vendor/categories/{category-slug}/templates`                 | GET    | Category dropdown select change       |
| Load variant combos     | `/vendor/categories/{category-slug}/variant-combinations`      | GET    | Variant-defining templates load হলে  |

---

## সংক্ষেপে Route Summary

> ⚠️ **Important:** Static routes (2-7) MUST be defined before dynamic route (8) in `routes/api.php`

| # | Method   | Endpoint                                              | Purpose                       | Status Code      |
|---|----------|-------------------------------------------------------|-------------------------------|------------------|
| 1 | GET      | `/admin/attribute-templates`                           | List templates (paginated)    | 200              |
| 2 | GET      | `/admin/attribute-templates/active`                    | Active templates only         | 200              |
| 3 | GET      | `/admin/attribute-templates/variant-defining`          | Variant-defining templates    | 200              |
| 4 | GET      | `/admin/attribute-templates/filterable`                | Filterable templates          | 200              |
| 5 | GET      | `/admin/attribute-templates/data-types`                | Data type enum list           | 200              |
| 6 | GET      | `/admin/attribute-templates/by-category/{category}`    | Templates for a category      | 200              |
| 7 | GET      | `/admin/attribute-templates/variant-combinations/{cat}`| Generate variant combos       | 200              |
| 8 | GET      | `/admin/attribute-templates/{template}`                | Show template details         | 200 / 404        |
| 9 | POST     | `/admin/attribute-templates`                           | Create template               | 201 / 422        |
| 10| PUT      | `/admin/attribute-templates/{template}`                | Update template               | 200 / 404 / 422* |
| 11| DELETE   | `/admin/attribute-templates/{template}`                | Delete template               | 200 / 404 / 409  |
| 12| PUT      | `/admin/attribute-templates/{template}/toggle-active`  | Toggle active status          | 200              |
| 13| POST     | `/admin/attribute-templates/{template}/options`        | Add option                    | 201 / 422        |
| 14| PUT      | `/admin/attribute-templates/options/{option}`          | Update option                 | 200              |
| 15| DELETE   | `/admin/attribute-templates/options/{option}`          | Remove option                 | 200 / 409        |
| 16| PUT      | `/admin/attribute-templates/options/{option}/deprecate`| Deprecate option              | 200              |
| 17| PUT      | `/admin/attribute-templates/{template}/options/reorder`| Reorder options               | 200 / 422        |
| 18| GET      | `/admin/categories/{category}/templates`               | Category's templates          | 200              |
| 19| PUT      | `/admin/categories/{category}/templates`               | Sync templates to category    | 200              |
| 20| GET      | `/vendor/categories/{category}/templates`              | Vendor: category templates    | 200              |
| 21| GET      | `/vendor/categories/{category}/variant-combinations`   | Vendor: variant combos        | 200              |

> **Note:** 
> - সব admin routes এ `{template}` parameter slug (e.g., `color`) অথবা ID (e.g., `1`) দুইটাই accept করে
> - Options routes এ `{option}` শুধু numeric ID
> - `*` মার্ক করা routes এ data_type change করলে additional validation errors আসতে পারে

---

## 📝 Documentation Changelog

### v2.0 — February 26, 2026 — Critical Issues Fixed

#### 🔴 Critical Fixes

1. **Route Conflict Resolution**
   - Added route ordering documentation
   - Reserved slugs: `active`, `variant-defining`, `filterable`, `data-types`, `by-category`, `variant-combinations`
   - Route order warnings added to all static routes
   - Validation for reserved slugs in create/update

2. **HTTP Status Code Corrections**
   - `DELETE` template/option in-use: `500` → `409 Conflict`
   - Added `error_code` field to all error responses
   - Added `meta` field with context information

3. **Update Template Options Sync Clarified**
   - Used options: auto-deprecated (not deleted)
   - Unused options: deleted
   - Warning response added with deprecation details

#### 🟡 Moderate Improvements

4. **Vendor API Expanded**
   - Added `GET /vendor/categories/{category}/variant-combinations`
   - JavaScript variant combination function documented
   - Frontend calculation logic included

5. **Pagination Standardized**
   - All list endpoints always paginated
   - Default: 15, Maximum: 100
   - `meta` object structure documented

6. **Validation Rules Schema**
   - Complete table by data type
   - Examples for each type
   - Clarified `unit` is separate field

7. **Reorder Options Edge Cases**
   - Cross-template validation
   - Incomplete order handling
   - Deprecated options skip behavior

#### 🟢 Minor Enhancements

8. **Computed Fields Documented**
   - `is_color`: Present when `color_code` exists
   - `has_image`: Present when `image_url` exists
   - Added to schema documentation

9. **Creator Object Behavior**
   - Admin responses: include `creator`
   - Vendor responses: exclude `creator` (security)

10. **Endpoint Clarification**
    - `/admin/attribute-templates/by-category/{category}`: Template-centric view
    - `/admin/categories/{category}/templates`: Category-centric view
    - Both serve different controller contexts

---

### v1.0 — February 20, 2026 — Initial Documentation

#### Initial Release

- Complete API documentation for Attribute Template CRUD
- Database schema and relations
- Data types and enum reference
- Admin APIs (12 endpoints)
- Option Management APIs (5 endpoints)
- Category template sync
- Vendor read-only APIs
- Error reference
- Frontend integration guide with Vue.js examples
- Route summary table
