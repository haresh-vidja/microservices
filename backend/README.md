# E-Commerce Microservices Backend

A comprehensive microservices architecture for an e-commerce platform, featuring customer management, seller operations, product catalog, order processing, media handling, notifications, and administrative functions.

## Architecture Overview

This backend consists of 8 microservices that work together to provide a complete e-commerce solution:

```
┌─────────────────┐    ┌──────────────────────────────────────────┐
│   Frontend      │────│             API Gateway                  │
│   (React)       │    │           (Port 8000)                   │
└─────────────────┘    └──────────────┬───────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
            │   Customer   │ │   Sellers   │ │   Products  │
            │ Service:3001 │ │ Service:3002│ │ Service:3004│
            └──────────────┘ └─────────────┘ └─────────────┘
                    │                │                │
            ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
            │    Orders    │ │    Admin    │ │    Media    │
            │ Service:3005 │ │ Service:3006│ │ Service:3003│
            └──────────────┘ └─────────────┘ └─────────────┘
                    │
            ┌───────▼──────┐
            │Notifications │
            │ Service:3007 │
            └──────────────┘
```

## Services Overview

| Service | Port | Technology | Database | Purpose |
|---------|------|------------|----------|---------|
| **API Gateway** | 8000 | Node.js/Express | - | Request routing, load balancing, security |
| **Customer Service** | 3001 | Node.js/Express | MongoDB | Customer registration, authentication, profiles |
| **Sellers Service** | 3002 | Node.js/Express | MongoDB | Seller management, business profiles |
| **Media Service** | 3003 | PHP | SQLite | File upload, image processing, storage |
| **Products Service** | 3004 | Node.js/Express | MongoDB | Product catalog, inventory management |
| **Orders Service** | 3005 | Node.js/Express | MongoDB | Cart management, order processing |
| **Admin Service** | 3006 | Node.js/Express | MongoDB | Admin panel, statistics, service management |
| **Notifications Service** | 3007 | PHP | SQLite | Email templates, SMTP, notification history |

## API Documentation

Each service has comprehensive API documentation:

- [**API Gateway Documentation**](./api-gateway/API.md) - Central routing and media serving
- [**Customer Service API**](./customer/API.md) - Customer management and authentication
- [**Sellers Service API**](./sellers/API.md) - Seller registration and profiles
- [**Products Service API**](./products/API.md) - Product catalog and inventory
- [**Orders Service API**](./orders/API.md) - Cart and order management
- [**Admin Service API**](./admin/API.md) - Administrative operations
- [**Media Service API**](./media/API.md) - File upload and media handling
- [**Notifications Service API**](./notifications/API.md) - Email templates and sending

## Prerequisites

- **Node.js** (v18+)
- **PHP** (v8.0+)
- **MongoDB** (v6.0+)
- **PM2** (for process management)
- **Composer** (for PHP dependencies)

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd services/backend
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies for all services
./install-dependencies.sh

# Or manually for each service:
cd customer && npm install && cd ..
cd sellers && npm install && cd ..
cd products && npm install && cd ..
cd orders && npm install && cd ..
cd admin && npm install && cd ..
cd api-gateway && npm install && cd ..

# Install PHP dependencies (if using Composer)
cd media && composer install && cd ..
cd notifications && composer install && cd ..
```

### 3. Environment Configuration
Create `.env` files in each service directory:

```bash
# Example for Node.js services
cp customer/.env.example customer/.env
cp sellers/.env.example sellers/.env
# ... repeat for other services
```

### 4. Database Setup
```bash
# Start MongoDB (if not running)
mongod --config /usr/local/etc/mongod.conf

# PHP services create SQLite databases automatically
```

### 5. Start All Services
```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js

# Or start individually
npm run start:all

# Or manual startup:
cd api-gateway && npm start &
cd customer && npm start &
cd sellers && npm start &
cd products && npm start &
cd orders && npm start &
cd admin && npm start &
php -S localhost:3003 -t media/ &
php -S localhost:3007 -t notifications/ &
```

### 6. Verify Services
```bash
# Check all services are running
curl http://localhost:8000/api/status

# Check individual service health
curl http://localhost:3001/health  # Customer
curl http://localhost:3002/health  # Sellers
curl http://localhost:3003/health  # Media
curl http://localhost:3004/health  # Products
curl http://localhost:3005/health  # Orders
curl http://localhost:3006/health  # Admin
curl http://localhost:3007/health  # Notifications
```

## Development

### Running Individual Services
```bash
# Node.js services
cd customer && npm run dev
cd sellers && npm run dev
cd products && npm run dev
cd orders && npm run dev
cd admin && npm run dev
cd api-gateway && npm run dev

# PHP services
php -S localhost:3003 -t media/
php -S localhost:3007 -t notifications/
```

### Environment Variables

#### Common Node.js Environment Variables
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/customer_db
JWT_SECRET=your-jwt-secret-key
SERVICE_KEY=your-service-key
```

#### API Gateway Environment Variables
```env
PORT=8000
CORS_ORIGIN=*
RATE_LIMIT_MAX=1000
CUSTOMER_SERVICE_URL=http://localhost:3001
SELLERS_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
PRODUCTS_SERVICE_URL=http://localhost:3004
ORDERS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006
NOTIFICATIONS_SERVICE_URL=http://localhost:3007
```

### Database Configuration

#### MongoDB Services
- **Customer Service**: `customer_db`
- **Sellers Service**: `sellers_db`
- **Products Service**: `products_db`
- **Orders Service**: `orders_db`
- **Admin Service**: `admin_db`

#### SQLite Services
- **Media Service**: `media/database/media.db`
- **Notifications Service**: `notifications/database/notifications.db`

## Authentication and Security

### JWT Authentication
- **Customer Authentication**: Customer Service issues JWT tokens
- **Seller Authentication**: Sellers Service issues JWT tokens
- **Admin Authentication**: Admin Service issues JWT tokens

### Service-to-Service Communication
- **Service Keys**: Inter-service communication secured with service keys
- **API Gateway**: Routes requests with proper authentication headers
- **Rate Limiting**: 1000 requests per 15 minutes per IP (configurable)

### Security Headers
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers for all Node.js services
- **Content Security**: File upload validation and security

## Monitoring and Health

### Health Checks
Each service provides a health check endpoint:
```bash
GET /health
```

Response format:
```json
{
  "success": true,
  "service": "service-name",
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Service Status Dashboard
```bash
# Check all services through API Gateway
GET http://localhost:8000/api/status
```

### Logging
- **Development**: Console logging with detailed information
- **Production**: File-based logging (configure log paths)
- **Error Tracking**: Comprehensive error logging across all services

## Key Features

### Customer Management
- User registration and authentication
- Profile management with image uploads
- Address management
- JWT-based session management

### Seller Operations
- Business registration and verification
- Product management
- Order fulfillment
- Sales analytics

### Product Catalog
- Product CRUD operations
- Image galleries and media management
- Inventory tracking
- Category and tag management

### Order Processing
- Shopping cart management
- Order placement and tracking
- Inventory reservations
- Multi-seller order support

### Media Handling
- Secure file uploads
- Image processing and thumbnails
- UUID-based file access
- Automatic cleanup of unused files

### Notifications
- Template-based email system
- SMTP configuration
- Email history and tracking
- Variable substitution

### Administration
- Service monitoring dashboard
- User and seller management
- Order oversight
- System statistics

## Inter-Service Communication

### Service Dependencies
```
API Gateway
├── Customer Service
├── Sellers Service  
├── Products Service
├── Orders Service
│   ├── Customer Service (verification)
│   └── Products Service (inventory)
├── Admin Service
│   ├── All Services (management)
├── Media Service
└── Notifications Service
```

### Communication Patterns
- **Synchronous**: HTTP REST APIs for real-time operations
- **Authentication**: Service keys for secure inter-service calls
- **Validation**: Cross-service data validation and verification
- **Error Handling**: Graceful degradation when services are unavailable

## Testing

### API Testing
```bash
# Test customer registration
curl -X POST http://localhost:8000/api/customer/customers/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123","phone":"1234567890"}'

# Test product creation (requires seller authentication)
curl -X POST http://localhost:8000/api/products/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seller-token>" \
  -d '{"name":"Test Product","price":99.99,"description":"Test product"}'

# Test file upload
curl -X POST http://localhost:8000/api/media/media/upload \
  -F "file=@test-image.jpg" \
  -F "type=profile"
```

### Service Health Testing
```bash
# Test all services are responsive
curl http://localhost:8000/api/status
```

## PM2 Management

```bash
# Start all services
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Monitor
pm2 monit
```

## Security Considerations

### Production Security Checklist
- [ ] Change all default JWT secrets
- [ ] Configure proper CORS origins
- [ ] Set up HTTPS/TLS termination
- [ ] Implement request rate limiting
- [ ] Configure secure headers
- [ ] Set up database authentication
- [ ] Implement API key management
- [ ] Configure file upload restrictions
- [ ] Set up monitoring and alerting
- [ ] Implement backup strategies

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comprehensive API documentation
- Include error handling and validation
- Write meaningful commit messages
- Test your changes thoroughly

## Service Endpoints Summary

### API Gateway (8000)
- `GET /health` - Gateway health check
- `GET /api/status` - All services health
- `GET /api/docs` - API documentation
- `GET /media/{id}` - Serve media files
- `GET /thumb/{id}` - Serve thumbnails

### Customer Service (3001)
- `POST /api/v1/customers/register` - Customer registration
- `POST /api/v1/customers/login` - Customer login
- `GET /api/v1/customers/profile` - Get profile
- `PUT /api/v1/customers/profile` - Update profile

### Sellers Service (3002)
- `POST /api/v1/sellers/signup` - Seller registration
- `POST /api/v1/sellers/signin` - Seller login
- `GET /api/v1/sellers/profile` - Get seller profile
- `POST /api/v1/sellers/service/bulk` - Bulk seller retrieval

### Products Service (3004)
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products/:id` - Get product
- `PUT /api/v1/products/:id` - Update product

### Orders Service (3005)
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/add` - Add to cart
- `POST /api/v1/orders/place` - Place order
- `GET /api/v1/orders` - Get orders

### Admin Service (3006)
- `POST /api/v1/login` - Admin login
- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/services/health` - Service health monitoring
- `ALL /api/v1/proxy/:service/*` - Service proxy

### Media Service (3003)
- `POST /api/v1/media/upload` - Upload file
- `GET /api/v1/media/serve/:id` - Serve file
- `GET /api/v1/media/serve-thumb/:id` - Serve thumbnail
- `POST /api/v1/media/validate` - Validate files

### Notifications Service (3007)
- `POST /api/v1/send` - Send email
- `GET /api/v1/templates` - List templates
- `POST /api/v1/templates` - Create template
- `GET /api/v1/history` - Email history

## Author

Haresh Vidja  
Email: hareshvidja@gmail.com

## License

ISC

---

**Built with love for modern e-commerce solutions**