# Orders Service API Documentation

## Overview
The Orders Service manages shopping cart operations, order processing, inventory reservations, and order fulfillment in the e-commerce platform. It provides cart management, order placement, status tracking, and integrates with the Products service for inventory management.

## Base URL
```
http://localhost:3005/api/v1
```

## Authentication
- **Public Endpoints**: None (all endpoints require authentication)
- **Protected Endpoints**: Cart and order operations (requires customer authentication)
- **Admin Endpoints**: Order management (requires service key)
- **Service Endpoints**: Inter-service communication (requires service key)

### Headers
```http
Authorization: Bearer <jwt_token>
X-Service-Key: <service_secret_key>
Content-Type: application/json
```

---

## Cart Management Endpoints

### Add Item to Cart
Add a product to the customer's shopping cart.

**Endpoint:** `POST /cart/add`

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "customerId": "507f1f77bcf86cd799439013",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "sellerId": "507f1f77bcf86cd799439014",
        "productName": "Wireless Headphones",
        "productImage": "uuid-media-id",
        "quantity": 2,
        "price": 99.99,
        "totalPrice": 199.98,
        "availableStock": 50,
        "addedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "totalItems": 2,
    "totalAmount": 199.98,
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Cart Contents
Retrieve all items in the customer's cart.

**Endpoint:** `GET /cart`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "customerId": "507f1f77bcf86cd799439013",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "sellerId": "507f1f77bcf86cd799439014",
        "productName": "Wireless Headphones",
        "productImage": "uuid-media-id",
        "quantity": 2,
        "price": 99.99,
        "totalPrice": 199.98,
        "availableStock": 50,
        "addedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "totalItems": 2,
    "totalAmount": 199.98,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update Cart Item Quantity
Update the quantity of an item in the cart.

**Endpoint:** `PUT /cart/update`

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {
    // Updated cart object
  }
}
```

### Remove Item from Cart
Remove a specific item from the cart.

**Endpoint:** `DELETE /cart/remove`

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

### Clear Cart
Remove all items from the cart.

**Endpoint:** `DELETE /cart/clear`

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## Order Management Endpoints

### Place Order
Create a new order from the customer's cart.

**Endpoint:** `POST /orders/place`

**Request Body:**
```json
{
  "shippingAddress": {
    "addressLine1": "123 Main Street",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001",
    "contactName": "Jane Smith",
    "contactPhone": "1234567890"
  },
  "paymentMethod": "COD",
  "notes": "Please deliver between 9 AM - 5 PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "507f1f77bcf86cd799439015",
    "orderNumber": "ORD1701360000001",
    "customerId": "507f1f77bcf86cd799439013",
    "customerName": "Jane Smith",
    "customerEmail": "jane.smith@example.com",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "sellerId": "507f1f77bcf86cd799439014",
        "productName": "Wireless Headphones",
        "productImage": "uuid-media-id",
        "quantity": 2,
        "unitPrice": 99.99,
        "totalPrice": 199.98,
        "status": "reserved"
      }
    ],
    "subtotal": 199.98,
    "tax": 0,
    "shippingFee": 0,
    "totalAmount": 199.98,
    "status": "pending",
    "paymentMethod": "cod",
    "paymentStatus": "pending",
    "shippingAddress": {
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postalCode": "10001",
      "contactName": "Jane Smith",
      "contactPhone": "1234567890"
    },
    "notes": "Please deliver between 9 AM - 5 PM",
    "placedAt": "2023-01-01T00:00:00.000Z",
    "reservationExpiry": "2023-01-01T00:30:00.000Z"
  }
}
```

### Get Customer Orders
Retrieve all orders for the authenticated customer.

**Endpoint:** `GET /orders`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 50) |
| `status` | string | - | Filter by order status |

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "507f1f77bcf86cd799439015",
        "orderNumber": "ORD1701360000001",
        "status": "delivered",
        "totalAmount": 199.98,
        "itemCount": 2,
        "placedAt": "2023-01-01T00:00:00.000Z",
        "deliveredAt": "2023-01-05T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Order by ID
Retrieve detailed information about a specific order.

**Endpoint:** `GET /orders/:id`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Order ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439015",
    "orderNumber": "ORD1701360000001",
    "customerId": "507f1f77bcf86cd799439013",
    "customerName": "Jane Smith",
    "customerEmail": "jane.smith@example.com",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "sellerId": "507f1f77bcf86cd799439014",
        "productName": "Wireless Headphones",
        "productImage": "uuid-media-id",
        "quantity": 2,
        "unitPrice": 99.99,
        "totalPrice": 199.98,
        "status": "delivered"
      }
    ],
    "subtotal": 199.98,
    "tax": 0,
    "shippingFee": 0,
    "totalAmount": 199.98,
    "status": "delivered",
    "paymentMethod": "cod",
    "paymentStatus": "paid",
    "shippingAddress": {
      "addressLine1": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001"
    },
    "placedAt": "2023-01-01T00:00:00.000Z",
    "deliveredAt": "2023-01-05T00:00:00.000Z"
  }
}
```

### Cancel Order
Cancel a pending or confirmed order.

**Endpoint:** `PUT /orders/:id/cancel`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Order ID |

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "id": "507f1f77bcf86cd799439015",
    "orderNumber": "ORD1701360000001",
    "status": "cancelled",
    "cancelledAt": "2023-01-01T00:00:00.000Z",
    "cancelReason": "Customer cancellation"
  }
}
```

---

## Admin Endpoints (Service Key Required)

### Get All Orders (Admin)
Retrieve all orders with filtering options.

**Endpoint:** `GET /admin/orders`
**Authentication:** Service Key Required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `status` | string | - | Filter by order status |
| `sellerId` | string | - | Filter by seller ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "507f1f77bcf86cd799439015",
        "orderNumber": "ORD1701360000001",
        "customerId": "507f1f77bcf86cd799439013",
        "customerName": "Jane Smith",
        "customerEmail": "jane.smith@example.com",
        "totalAmount": 199.98,
        "status": "delivered",
        "paymentStatus": "paid",
        "placedAt": "2023-01-01T00:00:00.000Z",
        "itemCount": 2,
        "sellers": ["507f1f77bcf86cd799439014"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Update Order Status (Admin)
Update the status of an order.

**Endpoint:** `PUT /admin/orders/:id/status`
**Authentication:** Service Key Required

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Order ID |

**Request Body:**
```json
{
  "status": "shipped",
  "notes": "Order shipped via FedEx. Tracking: 1234567890"
}
```

**Valid Status Values:** `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `failed`

**Response:**
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "507f1f77bcf86cd799439015",
    "orderNumber": "ORD1701360000001",
    "status": "shipped",
    "shippedAt": "2023-01-03T00:00:00.000Z",
    "notes": "Order shipped via FedEx. Tracking: 1234567890"
  }
}
```

---

## Inventory Management Endpoints

### Check Inventory Availability
Verify stock availability for a list of products.

**Endpoint:** `POST /inventory/check`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allAvailable": true,
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "requestedQuantity": 2,
        "availableStock": 50,
        "available": true
      },
      {
        "productId": "507f1f77bcf86cd799439012",
        "requestedQuantity": 1,
        "availableStock": 10,
        "available": true
      }
    ]
  }
}
```

### Reserve Inventory
Reserve inventory for a specific order.

**Endpoint:** `POST /inventory/reserve`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439015",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "expirationMinutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory reserved",
  "data": {
    "orderId": "507f1f77bcf86cd799439015",
    "reservationId": "507f1f77bcf86cd799439016",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 2,
        "reservedAt": "2023-01-01T00:00:00.000Z",
        "expiresAt": "2023-01-01T00:30:00.000Z"
      }
    ],
    "status": "reserved"
  }
}
```

### Release Reserved Inventory
Release previously reserved inventory.

**Endpoint:** `POST /inventory/release`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439015"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory released"
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
      "field": "productId",
      "message": "Product not found"
    }
  ]
}
```

### Common Error Scenarios

#### Cart Errors
```json
{
  "success": false,
  "message": "Insufficient stock. Available: 5, Requested: 10"
}
```

#### Order Errors
```json
{
  "success": false,
  "message": "Cart is empty"
}
```

#### Inventory Errors
```json
{
  "success": false,
  "message": "Some items are not available: Wireless Headphones (requested: 10, available: 5)"
}
```

---

## Data Models

### Cart Model
```typescript
interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  productId: string;
  sellerId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  availableStock: number;
  addedAt: Date;
}
```

### Order Model
```typescript
interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  sellerStatuses: SellerStatus[];
  placedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  cancelReason?: string;
  reservationExpiry: Date;
}

interface OrderItem {
  productId: string;
  sellerId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: ItemStatus;
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
type PaymentMethod = 'cod' | 'online' | 'wallet';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type ItemStatus = 'reserved' | 'confirmed' | 'cancelled' | 'fulfilled';
```

### Shipping Address Model
```typescript
interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactName?: string;
  contactPhone?: string;
}
```

---

## Business Rules

### Cart Management
- Items are automatically removed if stock becomes unavailable
- Cart is cleared after successful order placement
- Maximum cart item limit: 50 items per cart
- Cart expires after 30 days of inactivity

### Order Processing
- Orders require customer authentication
- Inventory is reserved for 30 minutes during order processing
- Orders can only be cancelled in 'pending' or 'confirmed' status
- Payment method defaults to 'COD' if not specified

### Inventory Management
- Inventory reservations expire automatically
- Stock checks are performed before cart additions and order placement
- Reserved inventory is released on order cancellation
- Real-time stock validation prevents overselling

### Status Transitions
```
Order Status Flow:
pending → confirmed → processing → shipped → delivered
    ↓
cancelled (from pending/confirmed only)
```

---

## Rate Limiting
- **Protected Endpoints**: 100 requests per 15 minutes per customer
- **Admin Endpoints**: 1000 requests per 15 minutes
- **Service Endpoints**: No rate limiting

## Integration Notes

### Products Service Integration
- Real-time inventory checking and reservation
- Product information fetching for cart items
- Stock level validation and updates

### Customer Service Integration
- Customer profile validation
- Address management for shipping
- Order history tracking

### Notifications Service Integration
- Order confirmation emails to customers
- New order notifications to sellers
- Status update notifications

### Kafka Integration
- Order placement events
- Status change events
- Inventory update events

---

## Webhook Events

### Published Events
```typescript
// Order placed
{
  "event": "order_placed",
  "orderId": "507f1f77bcf86cd799439015",
  "customerId": "507f1f77bcf86cd799439013",
  "totalAmount": 199.98,
  "timestamp": "2023-01-01T00:00:00.000Z"
}

// Order status changed
{
  "event": "order_status_changed",
  "orderId": "507f1f77bcf86cd799439015",
  "oldStatus": "pending",
  "newStatus": "confirmed",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Consumed Events
- Product stock updates
- Customer profile changes
- Payment status updates