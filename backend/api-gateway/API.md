# API Gateway Documentation

## Overview
The API Gateway serves as the single entry point for all client requests to the microservices architecture. It provides request routing, load balancing, security, rate limiting, and centralized logging. Built with Node.js and Express for high-performance request proxying.

## Base URL
```
http://localhost:8000
```

## Architecture
The API Gateway acts as a reverse proxy, routing requests to appropriate microservices based on URL patterns and providing cross-cutting concerns like security, logging, and rate limiting.

```
Client -> API Gateway -> Microservice
  |           |              |
  |           |              v
  |           |         Customer Service
  |           |         Sellers Service  
  |           |         Products Service
  |           |         Orders Service
  |           |         Admin Service
  |           |         Media Service
  |           v         Notifications Service
  |      Rate Limiting
  |      CORS Headers
  |      Request Logging
  v
Response
```

---

## Service Routing

### Route Mapping
The gateway routes requests based on URL prefixes:

| Service | Route Prefix | Target Service | Port |
|---------|-------------|----------------|------|
| Customer | `/api/customer/*` | Customer Service | 3001 |
| Sellers | `/api/sellers/*` | Sellers Service | 3002 |
| Media | `/api/media/*` | Media Service | 3003 |
| Products | `/api/products/*` | Products Service | 3004 |
| Orders | `/api/orders/*` | Orders Service | 3005 |
| Admin | `/api/admin/*` | Admin Service | 3006 |
| Notifications | `/api/notifications/*` | Notifications Service | 3007 |

### Path Rewriting
Requests are rewritten to remove the service prefix:
- `GET /api/customer/customers/profile` → `GET /api/v1/customers/profile`
- `POST /api/products/products` → `POST /api/v1/products`
- `PUT /api/orders/cart/add` → `PUT /api/v1/cart/add`

---

## Gateway Endpoints

### Health Check
Check API Gateway status and service availability.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "service": "api-gateway",
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "uptime": 3600.123,
  "services": [
    "customer",
    "sellers", 
    "media",
    "products",
    "orders",
    "admin",
    "notifications"
  ],
  "version": "1.0.0"
}
```

### Service Status
Get health status of all microservices.

**Endpoint:** `GET /api/status`

**Response:**
```json
{
  "success": true,
  "gateway": "healthy",
  "services": {
    "customer": {
      "status": "healthy",
      "url": "http://localhost:3001",
      "response": {
        "success": true,
        "service": "customer-service",
        "status": "healthy",
        "timestamp": "2023-01-01T00:00:00.000Z"
      }
    },
    "sellers": {
      "status": "healthy", 
      "url": "http://localhost:3002",
      "response": {
        "success": true,
        "service": "sellers-service",
        "status": "healthy"
      }
    },
    "media": {
      "status": "unhealthy",
      "url": "http://localhost:3003",
      "error": "connect ECONNREFUSED 127.0.0.1:3003"
    }
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### API Documentation
Get gateway and service documentation links.

**Endpoint:** `GET /api/docs`

**Response:**
```json
{
  "success": true,
  "message": "API Gateway Documentation",
  "gateway": {
    "version": "1.0.0",
    "port": 8000,
    "endpoints": {
      "health": "GET /health",
      "status": "GET /api/status",
      "docs": "GET /api/docs"
    }
  },
  "services": {
    "customer": {
      "prefix": "/api/customer",
      "target": "http://localhost:3001",
      "description": "Customer management, authentication, and profiles"
    },
    "sellers": {
      "prefix": "/api/sellers", 
      "target": "http://localhost:3002",
      "description": "Seller management, authentication, and business profiles"
    },
    "media": {
      "prefix": "/api/media",
      "target": "http://localhost:3003", 
      "description": "File upload, media management, and storage"
    },
    "products": {
      "prefix": "/api/products",
      "target": "http://localhost:3004",
      "description": "Product catalog, inventory, and management"
    },
    "orders": {
      "prefix": "/api/orders",
      "target": "http://localhost:3005",
      "description": "Order processing, cart management, and inventory"
    },
    "admin": {
      "prefix": "/api/admin",
      "target": "http://localhost:3006",
      "description": "Admin dashboard, statistics, and service monitoring"
    },
    "notifications": {
      "prefix": "/api/notifications",
      "target": "http://localhost:3007",
      "description": "Email notifications, templates, and messaging"
    }
  },
  "examples": {
    "customer_signup": "POST /api/customer/customers/signup",
    "seller_signin": "POST /api/sellers/sellers/signin", 
    "upload_media": "POST /api/media/media/upload",
    "list_products": "GET /api/products/products",
    "place_order": "POST /api/orders/orders/place",
    "dashboard_stats": "GET /api/admin/dashboard/stats",
    "send_email": "POST /api/notifications/send"
  }
}
```

---

## Media Serving Endpoints

### Direct Media Access
Serve media files directly through the gateway.

**Endpoint:** `GET /media/{media_id}`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `media_id` | string | Yes | Media file UUID |

**Response:**
- **Success**: Media file binary data with appropriate headers
- **Error**: JSON error response

**Example:**
```
GET /media/550e8400-e29b-41d4-a716-446655440001
```

### Thumbnail Access
Serve media thumbnails directly through the gateway.

**Endpoint:** `GET /thumb/{media_id}`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `media_id` | string | Yes | Media file UUID |

**Response:**
- **Success**: Thumbnail binary data
- **Error**: JSON error response

**Example:**
```
GET /thumb/550e8400-e29b-41d4-a716-446655440001
```

---

## Request/Response Handling

### Request Headers
The gateway automatically adds service identification headers:
- `X-Service-Name`: Identifies which service handled the request
- `X-Gateway`: Always set to "api-gateway"

### Request Logging (Development)
In development mode, all proxy requests are logged:
```
[2023-01-01T00:00:00.000Z] GET /api/customer/customers/profile -> http://localhost:3001/api/v1/customers/profile
```

### Content-Type Handling
- **JSON Requests**: Automatically parsed and forwarded
- **Multipart Uploads**: Raw stream forwarded to media service
- **File Downloads**: Stream responses back to client

### Timeout Configuration
- **Request Timeout**: 30 seconds
- **Proxy Timeout**: 30 seconds
- **Service Health Check**: 3 seconds

---

## Error Handling

### Gateway Error Responses
```json
{
  "success": false,
  "message": "customer service unavailable",
  "error": "Bad Gateway", 
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Service Unavailable
```json
{
  "success": false,
  "message": "Media service unavailable",
  "media_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Route Not Found
```json
{
  "success": false,
  "message": "Route not found",
  "availableServices": [
    "/api/customer",
    "/api/sellers", 
    "/api/media",
    "/api/products",
    "/api/orders",
    "/api/admin",
    "/api/notifications"
  ],
  "documentation": "/api/docs",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Rate Limiting
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later"
}
```

---

## Security Features

### CORS Configuration
```javascript
{
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key', 'X-Requested-With']
}
```

### Security Headers
- **Helmet.js**: Comprehensive security headers
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **Content Security Policy**: Default policy applied

### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 1000 per IP (configurable via `RATE_LIMIT_MAX`)
- **Headers**: Standard rate limit headers included
- **Response**: JSON error message when exceeded

---

## Performance Features

### Request Processing
- **Compression**: Gzip compression for all responses
- **JSON Parsing**: 10MB limit for request bodies
- **Streaming**: Efficient file upload/download streaming
- **Connection Reuse**: HTTP keep-alive enabled

### Caching
- **Static Files**: Cache headers for media files (24 hours)
- **API Responses**: No caching (real-time data)
- **Service Discovery**: Cached service configurations

### Load Balancing
- **Round Robin**: Single instance per service (can be extended)
- **Health Checks**: Automatic service health monitoring
- **Failover**: Error responses when services unavailable

---

## Configuration

### Environment Variables
```env
PORT=8000
CORS_ORIGIN=*
RATE_LIMIT_MAX=1000
NODE_ENV=production

# Service URLs
CUSTOMER_SERVICE_URL=http://localhost:3001
SELLERS_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
PRODUCTS_SERVICE_URL=http://localhost:3004
ORDERS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006
NOTIFICATIONS_SERVICE_URL=http://localhost:3007
```

### Service Configuration
Services are configured with target URLs and path rewrite rules:
```javascript
const services = {
  customer: {
    target: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3001',
    pathRewrite: { '^/api/customer': '/api/v1' }
  }
  // ... other services
};
```

---

## Monitoring and Logging

### Request Logging
- **Development**: Detailed request/response logging
- **Production**: Error logging only
- **Format**: Timestamp, method, URL, target service
- **Errors**: Full error stack traces logged

### Health Monitoring
- **Gateway Health**: `/health` endpoint
- **Service Health**: `/api/status` endpoint  
- **Uptime Tracking**: Process uptime monitoring
- **Service Availability**: Real-time service status

### Metrics (Future Enhancement)
- Request count per service
- Response time tracking
- Error rate monitoring
- Service availability metrics

---

## Deployment Considerations

### Production Setup
- **Process Manager**: Use PM2 or similar for process management
- **Load Balancer**: Place behind nginx or AWS ALB
- **SSL/TLS**: Terminate SSL at load balancer level
- **Environment**: Set `NODE_ENV=production`

### Scaling
- **Horizontal**: Multiple gateway instances behind load balancer
- **Service Discovery**: Consider service registry for dynamic routing
- **Circuit Breaker**: Implement circuit breaker pattern for service failures
- **Caching**: Add Redis for request caching

### Security
- **API Keys**: Implement API key authentication
- **OAuth2**: Support OAuth2 for client authentication  
- **WAF**: Web Application Firewall for DDoS protection
- **Audit Logging**: Comprehensive audit trail logging

---

## Service Integration Examples

### Customer Registration Flow
```
POST /api/customer/customers/register
↓
API Gateway receives request
↓
Routes to Customer Service: POST /api/v1/customers/register
↓
Customer Service processes registration
↓
Returns response through gateway to client
```

### File Upload Flow  
```
POST /api/media/media/upload
↓
API Gateway receives multipart upload
↓
Streams request to Media Service: POST /api/v1/media/upload
↓
Media Service processes file upload
↓ 
Returns file UUID through gateway to client
```

### Order Placement Flow
```
POST /api/orders/orders/place
↓
API Gateway routes to Orders Service
↓
Orders Service validates with Customer/Products services
↓
Response with order confirmation through gateway
```

---

## Common Usage Patterns

### Frontend Integration
```javascript
// Frontend API configuration
const API_BASE_URL = 'http://localhost:8000';

// Customer authentication
const response = await fetch(`${API_BASE_URL}/api/customer/customers/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});
```

### Admin Dashboard
```javascript
// Get dashboard statistics
const stats = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Check service health
const health = await fetch(`${API_BASE_URL}/api/status`);
```

### Media Handling
```javascript
// Upload file
const formData = new FormData();
formData.append('file', selectedFile);

const upload = await fetch(`${API_BASE_URL}/api/media/media/upload`, {
  method: 'POST',
  body: formData
});

// Display image
const imageUrl = `${API_BASE_URL}/media/${mediaId}`;
```

---

## Development and Testing

### Local Development
1. Start all microservices
2. Start API Gateway: `npm start`
3. Access services through gateway at `http://localhost:8000`

### Testing Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Service status
curl http://localhost:8000/api/status

# API documentation  
curl http://localhost:8000/api/docs

# Test service routing
curl http://localhost:8000/api/customer/customers/profile \
  -H "Authorization: Bearer token"
```

### Error Testing
```bash
# Test rate limiting (send 1000+ requests rapidly)
# Test service failure (stop a service and test routing)
# Test invalid routes
curl http://localhost:8000/api/invalid/endpoint
```

---

## Troubleshooting

### Common Issues

#### Service Connection Errors
- **Symptom**: "Service unavailable" errors
- **Solution**: Check if target service is running and accessible
- **Debug**: Check gateway logs and service health endpoints

#### CORS Issues  
- **Symptom**: Browser CORS errors
- **Solution**: Configure `CORS_ORIGIN` environment variable
- **Debug**: Check browser network tab for preflight requests

#### Rate Limiting
- **Symptom**: "Too many requests" errors
- **Solution**: Increase `RATE_LIMIT_MAX` or implement IP whitelisting
- **Debug**: Check request patterns and IP addresses

#### File Upload Issues
- **Symptom**: Upload timeouts or errors
- **Solution**: Check file size limits and timeout configuration
- **Debug**: Verify multipart handling and streaming

### Debug Mode
Set `NODE_ENV=development` for detailed logging:
- Request/response logging
- Error stack traces
- Service routing information
- Performance timing data