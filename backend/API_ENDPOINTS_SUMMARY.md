# Complete Inter-Service API Endpoints Summary

## Customer Service (Port 3001)
### Public APIs
- `POST /api/v1/customers/signup` - Customer registration
- `POST /api/v1/customers/signin` - Customer login
- `POST /api/v1/customers/refresh-token` - Refresh JWT token
- `GET /api/v1/customers/profile` - Get own profile
- `GET /api/v1/customers/profile/:id` - Get profile by ID
- `PUT /api/v1/customers/profile` - Update profile
- `PUT /api/v1/customers/change-password` - Change password
- `DELETE /api/v1/customers/account` - Delete account
- `GET /api/v1/customers` - List customers (with pagination)

### Address Management
- `POST /api/v1/addresses` - Create address
- `GET /api/v1/addresses` - Get customer addresses
- `GET /api/v1/addresses/:id` - Get specific address
- `PUT /api/v1/addresses/:id` - Update address
- `DELETE /api/v1/addresses/:id` - Delete address
- `PUT /api/v1/addresses/:id/default` - Set default address

### Inter-Service APIs (X-Service-Key required)
- `POST /api/v1/customers/service/bulk` - Get customers by IDs
- `POST /api/v1/customers/service/verify` - Verify customer status

---

## Sellers Service (Port 3002)
### Public APIs
- `POST /api/v1/sellers/signup` - Seller registration
- `POST /api/v1/sellers/signin` - Seller login
- `POST /api/v1/sellers/create` - Create seller profile
- `GET /api/v1/sellers/list` - List sellers
- `GET /api/v1/sellers/profile/:id` - Get seller profile by ID
- `GET /api/v1/sellers/profile` - Get own profile
- `PUT /api/v1/sellers/profile` - Update profile

### Inter-Service APIs (X-Service-Key required)
- `POST /api/v1/sellers/service/bulk` - Get sellers by IDs
- `POST /api/v1/sellers/service/verify` - Verify seller status

---

## Media Service (Port 3003) - PHP
### Public APIs
- `POST /api/v1/media/upload` - Upload file
- `GET /api/v1/media` - List files
- `GET /api/v1/media/{id}` - Get file by ID
- `DELETE /api/v1/media/{id}` - Delete file
- `POST /api/v1/media/mark-used` - Mark file as used
- `POST /api/v1/media/cleanup` - Cleanup temporary files

### Inter-Service APIs (X-Service-Key required)
- `POST /api/v1/media/validate` - Validate multiple files
- `POST /api/v1/media/bulk-mark-used` - Bulk mark files as used

---

## Products Service (Port 3004)
### Public APIs
- `GET /api/v1/products` - List products (with filtering)
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Soft delete product

### Inter-Service APIs (X-Service-Key required)
- `POST /api/v1/service/products/bulk` - Get products by IDs
- `POST /api/v1/service/products/inventory-check` - Check inventory
- `PUT /api/v1/service/products/stock` - Update stock (bulk)
- `POST /api/v1/service/products/validate-seller` - Validate seller ownership

---

## Orders Service (Port 3005)
### Cart Management (JWT required)
- `POST /api/v1/cart/add` - Add item to cart
- `GET /api/v1/cart` - Get cart items
- `PUT /api/v1/cart/update` - Update cart item
- `DELETE /api/v1/cart/remove` - Remove cart item
- `DELETE /api/v1/cart/clear` - Clear entire cart

### Order Management (JWT required)
- `POST /api/v1/orders/place` - Place new order
- `GET /api/v1/orders` - Get customer orders
- `GET /api/v1/orders/:id` - Get order by ID
- `PUT /api/v1/orders/:id/cancel` - Cancel order

### Admin APIs (X-Service-Key required)
- `GET /api/v1/admin/orders` - Get all orders
- `PUT /api/v1/admin/orders/:id/status` - Update order status

### Inventory APIs (X-Service-Key required)
- `POST /api/v1/inventory/check` - Check inventory availability
- `POST /api/v1/inventory/reserve` - Reserve inventory
- `POST /api/v1/inventory/release` - Release inventory

---

## Admin Service (Port 3006)
### Dashboard APIs
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/services/health` - Get all services health status
- `ALL /api/v1/proxy/:service/*` - Proxy requests to other services

---

## Notifications Service (Port 3007) - PHP
### Template Management
- `GET /api/v1/templates` - Get all templates
- `POST /api/v1/templates` - Create template
- `GET /api/v1/templates/{id}` - Get template by ID
- `PUT /api/v1/templates/{id}` - Update template
- `DELETE /api/v1/templates/{id}` - Delete template

### Email Operations
- `POST /api/v1/send` - Send notification email
- `GET /api/v1/history` - Get email history

### Configuration
- `GET /api/v1/smtp` - Get SMTP config
- `POST /api/v1/smtp` - Update SMTP config

---

## Global Health Endpoints
All services expose:
- `GET /health` - Service health check

## Authentication Methods
1. **JWT Tokens** (Bearer) - For customer/seller facing APIs
2. **X-Service-Key Headers** - For inter-service communication
3. **No Auth** - For health checks and public endpoints

## Service Keys Configuration
All services use consistent service keys:
- `admin-secret-key-2024` - Admin service
- `order-secret-key-2024` - Orders service
- `customer-secret-key-2024` - Customer service
- `seller-secret-key-2024` - Sellers service
- `product-secret-key-2024` - Products service
- `media-secret-key-2024` - Media service
- `notification-secret-key-2024` - Notifications service

## Verification Status: ✅ COMPLETE
All inter-service communication endpoints are properly implemented with:
- ✅ Bulk data retrieval APIs
- ✅ Service authentication with shared secrets
- ✅ Comprehensive error handling
- ✅ Health monitoring and statistics
- ✅ Proper request/response formatting
- ✅ Swagger documentation support
- ✅ Complete service integration