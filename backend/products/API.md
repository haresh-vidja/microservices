# Products Service API Documentation

## Overview
The Products Service manages product information, inventory, and product-related operations in the e-commerce platform. It provides CRUD operations for products, inventory management, and inter-service communication endpoints.

## Base URL
```
http://localhost:3004/api/v1
```

## Authentication
- **Public Endpoints**: Product listing and details
- **Protected Endpoints**: Product management (requires seller authentication)
- **Admin Endpoints**: Product administration (requires admin service key)
- **Service Endpoints**: Inter-service communication (requires service key)

### Headers
```http
Authorization: Bearer <jwt_token>
X-Service-Key: <service_secret_key>
Content-Type: application/json
```

---

## Public Endpoints

### Get Products
Retrieve products with filtering and pagination.

**Endpoint:** `GET /products`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Number of items per page |
| `category` | string | - | Filter by category |
| `sellerId` | string | - | Filter by seller ID |
| `search` | string | - | Search in name, description, tags |
| `status` | string | active | Product status (active/inactive/all) |
| `sortBy` | string | createdAt | Field to sort by |
| `sortOrder` | string | desc | Sort order (asc/desc) |

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "comparePrice": 129.99,
        "stock": 50,
        "category": "electronics",
        "subcategory": "smartphones",
        "sellerId": "507f1f77bcf86cd799439012",
        "images": [
          {
            "media_id": "uuid-string",
            "isPrimary": true
          }
        ],
        "specifications": {
          "Brand": "Example",
          "Model": "X1"
        },
        "tags": ["smartphone", "android"],
        "isActive": true,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### Get Single Product
Retrieve detailed information about a specific product.

**Endpoint:** `GET /products/:id`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 99.99,
    "comparePrice": 129.99,
    "stock": 50,
    "lowStockAlert": 10,
    "category": "electronics",
    "subcategory": "smartphones",
    "sellerId": "507f1f77bcf86cd799439012",
    "images": [
      {
        "media_id": "uuid-string",
        "isPrimary": true
      }
    ],
    "specifications": {
      "Brand": "Example",
      "Model": "X1",
      "Color": "Black"
    },
    "tags": ["smartphone", "android"],
    "isActive": true,
    "totalSold": 25,
    "revenue": 2499.75,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

---

## Seller Endpoints

### Create Product
Create a new product (requires seller authentication).

**Endpoint:** `POST /products`

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "comparePrice": 129.99,
  "stock": 100,
  "lowStockAlert": 10,
  "category": "electronics",
  "subcategory": "smartphones",
  "images": [
    {
      "media_id": "uuid-string",
      "isPrimary": true
    }
  ],
  "specifications": {
    "Brand": "Example",
    "Model": "X1"
  },
  "tags": ["smartphone", "android"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "New Product",
    "sellerId": "507f1f77bcf86cd799439012",
    // ... full product object
  }
}
```

### Update Product
Update an existing product (requires seller authentication).

**Endpoint:** `PUT /products/:id`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

**Request Body:** Same as Create Product (all fields optional)

### Delete Product
Soft delete a product (requires seller authentication).

**Endpoint:** `DELETE /products/:id`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Get Seller Products
Get all products for a specific seller.

**Endpoint:** `GET /products/seller/:sellerId`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sellerId` | string | Yes | Seller ID |

**Query Parameters:** Same as Get Products endpoint

### Update Product Stock
Update product inventory.

**Endpoint:** `PUT /products/:id/stock`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

**Request Body:**
```json
{
  "stock": 50,
  "notes": "Inventory update reason"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "productId": "507f1f77bcf86cd799439011",
    "previousStock": 25,
    "newStock": 50,
    "notes": "Inventory update reason"
  }
}
```

### Get Product History
Get change history for a product.

**Endpoint:** `GET /products/:id/history`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page |
| `type` | string | all | History type (price_change, stock_update, status_change, sale) |

---

## Admin Endpoints

### Get All Products (Admin)
Get all products with admin privileges.

**Endpoint:** `GET /products/admin`
**Authentication:** Service Key Required

**Query Parameters:** Same as Get Products endpoint

### Update Product Status (Admin)
Update product status as admin.

**Endpoint:** `PATCH /products/admin/:id/status`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "status": "active"
}
```

**Valid Status Values:** `active`, `inactive`, `draft`

---

## Service-to-Service Endpoints

### Bulk Product Retrieval
Get multiple products by IDs (for order service).

**Endpoint:** `POST /service/products/bulk`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "productIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Product Name",
      "price": 99.99,
      "stock": 50,
      "sellerId": "507f1f77bcf86cd799439012",
      "primaryImageId": "uuid-string",
      "category": "electronics"
    }
  ]
}
```

### Validate Seller Ownership
Verify if a seller owns a specific product.

**Endpoint:** `POST /service/products/validate-seller`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "sellerId": "507f1f77bcf86cd799439012"
}
```

### Record Product Sale
Record a sale for inventory and analytics.

**Endpoint:** `POST /service/products/record-sale`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439013",
  "customerId": "507f1f77bcf86cd799439014",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2,
      "unitPrice": 99.99,
      "totalPrice": 199.98
    }
  ]
}
```

### Bulk Stock Update
Update stock for multiple products.

**Endpoint:** `PUT /service/products/stock`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "updates": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "stockChange": -2
    }
  ]
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Models

### Product Model
```typescript
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  lowStockAlert: number;
  category: string;
  subcategory?: string;
  sellerId: string;
  images: ProductImage[];
  specifications: Record<string, any>;
  tags: string[];
  isActive: boolean;
  totalSold: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductImage {
  media_id: string;
  isPrimary: boolean;
}
```

### Product History Model
```typescript
interface ProductHistory {
  _id: string;
  productId: string;
  type: 'price_change' | 'stock_update' | 'status_change' | 'sale';
  previousValue?: any;
  newValue?: any;
  quantity?: number;
  orderId?: string;
  customerId?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

## Rate Limiting
- **Public Endpoints**: 100 requests per 15 minutes per IP
- **Authenticated Endpoints**: 1000 requests per 15 minutes per user
- **Service Endpoints**: No rate limiting

## Pagination
All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```