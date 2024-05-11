# Admin Service API Documentation

## Overview
The Admin Service provides administrative panel functionality including authentication, dashboard statistics, service health monitoring, and proxying requests to other microservices. It serves as the central management interface for the e-commerce platform.

## Base URL
```
http://localhost:3006/api/v1
```

## Authentication
- **Public Endpoints**: Admin login
- **Protected Endpoints**: All admin operations (requires admin authentication)
- **Proxy Endpoints**: Service-to-service communication via proxy

### Headers
```http
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

---

## Public Endpoints

### Admin Login
Authenticate admin user and receive access token.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Admin",
      "email": "admin@example.com",
      "role": "super_admin",
      "permissions": [
        "manage_users",
        "manage_sellers",
        "manage_products",
        "manage_orders",
        "view_analytics",
        "manage_settings",
        "send_notifications",
        "moderate_content"
      ]
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Protected Endpoints (Admin Authentication Required)

### Dashboard Statistics
Get comprehensive statistics for the admin dashboard.

**Endpoint:** `GET /dashboard/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "customers": {
        "total": 1250,
        "active": 1180
      },
      "sellers": {
        "total": 85,
        "active": 78
      },
      "products": {
        "total": 3420
      },
      "orders": {
        "total": 2840
      }
    },
    "lastUpdated": "2023-01-01T00:00:00.000Z"
  }
}
```

**Error Response (Service Unavailable):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "customers": {
        "total": 0,
        "active": 0,
        "error": "Service unavailable"
      },
      "sellers": {
        "total": 0,
        "active": 0,
        "error": "Service unavailable"
      },
      "products": {
        "total": 0,
        "error": "Service unavailable"
      },
      "orders": {
        "total": 0,
        "error": "Service unavailable"
      }
    },
    "lastUpdated": "2023-01-01T00:00:00.000Z"
  }
}
```

### Service Health Check
Monitor the health status of all microservices.

**Endpoint:** `GET /services/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "services": {
      "customer": {
        "status": "healthy",
        "response": {
          "success": true,
          "service": "customer-service",
          "status": "healthy",
          "timestamp": "2023-01-01T00:00:00.000Z"
        },
        "responseTime": "45ms"
      },
      "sellers": {
        "status": "healthy",
        "response": {
          "success": true,
          "service": "sellers-service",
          "status": "healthy",
          "timestamp": "2023-01-01T00:00:00.000Z"
        },
        "responseTime": "32ms"
      },
      "media": {
        "status": "unhealthy",
        "error": "connect ECONNREFUSED 127.0.0.1:3003",
        "url": "http://localhost:3003"
      },
      "products": {
        "status": "healthy",
        "response": {
          "success": true,
          "service": "products-service",
          "status": "healthy"
        },
        "responseTime": "28ms"
      },
      "orders": {
        "status": "healthy",
        "response": {
          "success": true,
          "service": "orders-service",
          "status": "healthy"
        },
        "responseTime": "52ms"
      },
      "notifications": {
        "status": "healthy",
        "response": {
          "success": true,
          "service": "notifications-service",
          "status": "healthy"
        },
        "responseTime": "41ms"
      }
    },
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

---

## Proxy Endpoints

The Admin Service acts as a proxy to other microservices, allowing the admin panel to communicate with all services through a single endpoint with proper authentication.

### Proxy Request Format
**Endpoint:** `ALL /proxy/:service/*`

**URL Structure:**
```
/api/v1/proxy/{service_name}/{service_endpoint_path}
```

### Available Services
| Service | Proxy Path | Target |
|---------|------------|--------|
| Customer | `/proxy/customer/*` | http://localhost:3001 |
| Sellers | `/proxy/sellers/*` | http://localhost:3002 |
| Media | `/proxy/media/*` | http://localhost:3003 |
| Products | `/proxy/products/*` | http://localhost:3004 |
| Orders | `/proxy/orders/*` | http://localhost:3005 |
| Notifications | `/proxy/notifications/*` | http://localhost:3007 |

### Proxy Examples

#### Get All Customers
**Request:** `GET /proxy/customer/api/v1/customers`

**Equivalent to:** `GET http://localhost:3001/api/v1/customers` with service key

#### Get All Sellers
**Request:** `GET /proxy/sellers/api/v1/sellers/admin`

**Equivalent to:** `GET http://localhost:3002/api/v1/sellers/admin` with service key

#### Get All Products
**Request:** `GET /proxy/products/api/v1/products/admin`

**Equivalent to:** `GET http://localhost:3004/api/v1/products/admin` with service key

#### Get All Orders
**Request:** `GET /proxy/orders/api/v1/admin/orders`

**Equivalent to:** `GET http://localhost:3005/api/v1/admin/orders` with service key

#### Update Order Status
**Request:** `PUT /proxy/orders/api/v1/admin/orders/507f1f77bcf86cd799439015/status`

**Request Body:**
```json
{
  "status": "shipped",
  "notes": "Order shipped via FedEx"
}
```

#### Bulk Seller Retrieval
**Request:** `POST /proxy/sellers/api/v1/sellers/service/bulk`

**Request Body:**
```json
{
  "sellerIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

#### Send Notification
**Request:** `POST /proxy/notifications/api/v1/send`

**Request Body:**
```json
{
  "templateCode": "welcome_seller",
  "recipientEmail": "seller@example.com",
  "data": {
    "sellerName": "John Doe",
    "businessName": "John's Electronics"
  }
}
```

### Proxy Response Handling
The proxy forwards responses directly from the target service, maintaining the original status codes and response formats.

**Success Response Example:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [...],
    "pagination": {...}
  }
}
```

**Error Response Example:**
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Access token required"
}
```

```json
{
  "success": false,
  "message": "Token expired"
}
```

```json
{
  "success": false,
  "message": "Invalid token"
}
```

### Account Status Errors
```json
{
  "success": false,
  "message": "Account is deactivated"
}
```

### Proxy Errors
```json
{
  "success": false,
  "message": "Service not found"
}
```

```json
{
  "success": false,
  "message": "Proxy error: connect ECONNREFUSED 127.0.0.1:3003"
}
```

---

## Data Models

### Admin Model
```typescript
interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type AdminRole = 'super_admin' | 'admin' | 'moderator';

type Permission = 
  | 'manage_users' 
  | 'manage_sellers' 
  | 'manage_products' 
  | 'manage_orders' 
  | 'view_analytics' 
  | 'manage_settings'
  | 'send_notifications' 
  | 'moderate_content';
```

### Dashboard Statistics Model
```typescript
interface DashboardStats {
  overview: {
    customers: {
      total: number;
      active: number;
      error?: string;
    };
    sellers: {
      total: number;
      active: number;
      error?: string;
    };
    products: {
      total: number;
      error?: string;
    };
    orders: {
      total: number;
      error?: string;
    };
  };
  lastUpdated: string;
}
```

### Service Health Model
```typescript
interface ServiceHealth {
  services: Record<string, {
    status: 'healthy' | 'unhealthy';
    response?: any;
    responseTime?: string;
    error?: string;
    url?: string;
  }>;
  timestamp: string;
}
```

---

## Security Features

### JWT Authentication
- **Token Expiry**: 24 hours
- **Token Payload**: Admin ID, email, role, and type
- **Secret Key**: Environment-configurable

### Password Security
- Passwords are hashed using bcrypt
- Plain text passwords are never stored
- Login attempts are logged for security monitoring

### Service-to-Service Authentication
- Uses service keys for inter-service communication
- Automatically injects service key headers in proxy requests
- Removes admin authorization headers for service calls

### Role-Based Access Control
```typescript
// Admin Roles (in hierarchy order)
'super_admin'  // Full system access
'admin'        // Most administrative functions
'moderator'    // Limited moderation capabilities
```

### Permission-Based Operations
Each admin can have specific permissions:
- `manage_users`: Customer account management
- `manage_sellers`: Seller account management
- `manage_products`: Product catalog management
- `manage_orders`: Order processing and status updates
- `view_analytics`: Dashboard and reporting access
- `manage_settings`: System configuration access
- `send_notifications`: Email and notification management
- `moderate_content`: Content moderation capabilities

---

## Rate Limiting
- **Admin Endpoints**: 1000 requests per 15 minutes per admin
- **Proxy Endpoints**: 500 requests per 15 minutes per admin
- **Login Endpoint**: 20 attempts per 15 minutes per IP

## Service Integration

### Microservice Communication
The Admin Service communicates with all other services:
- **Customer Service**: User management and statistics
- **Sellers Service**: Seller management and statistics  
- **Products Service**: Product catalog management
- **Orders Service**: Order management and tracking
- **Media Service**: File and media management
- **Notifications Service**: Email and notification management

### Health Monitoring
- Real-time health checks for all services
- Timeout handling (5 seconds per service)
- Error reporting and service status tracking
- Response time monitoring

### Statistics Aggregation
- Pulls data from multiple services
- Graceful degradation when services are unavailable
- Caching consideration for performance (future enhancement)

---

## Business Rules

### Admin Account Management
- Email addresses must be unique
- Accounts can be activated/deactivated
- Last login timestamps are tracked
- Role and permission changes require super_admin access

### Dashboard Access
- Statistics are aggregated from all services
- Services that are unavailable show error status
- Real-time health monitoring prevents stale data

### Proxy Security
- All proxy requests require admin authentication
- Service keys are automatically injected
- Original admin tokens are stripped for security
- Request/response logging for audit trails

---

## Common Use Cases

### Admin Panel Dashboard
1. Admin logs in with credentials
2. Dashboard loads statistics from all services
3. Health status shows service availability
4. Real-time monitoring of system status

### User Management
1. Admin accesses customer list via proxy
2. Views customer details and activity
3. Can activate/deactivate customer accounts
4. Manages customer disputes and issues

### Seller Management
1. Admin reviews seller applications
2. Approves/rejects seller accounts
3. Monitors seller performance metrics
4. Manages seller disputes and violations

### Order Management
1. Admin views all orders across platform
2. Updates order statuses when needed
3. Handles customer service issues
4. Processes refunds and cancellations

### Content Moderation
1. Admin reviews reported content
2. Manages product listings and descriptions
3. Handles inappropriate content reports
4. Enforces platform policies

---

## Monitoring and Logging

### Health Check Endpoint
```
GET /health
```

**Response:**
```json
{
  "success": true,
  "service": "admin-service",
  "status": "healthy", 
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Service Logs
- Authentication attempts and failures
- Proxy request logging
- Service health check results
- Error tracking and debugging information