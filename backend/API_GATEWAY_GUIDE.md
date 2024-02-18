# API Gateway - Single Entry Point Guide

## Overview

The API Gateway provides a unified entry point for all microservices, running on **port 8000**. Instead of connecting to each service individually, all API requests go through the gateway.

## Quick Start

```bash
# Start all services including the gateway
./start-all.sh

# Or manually start the gateway
cd api-gateway
npm install
npm start
```

## Gateway Benefits

✅ **Single Entry Point** - One URL for all APIs  
✅ **Service Discovery** - Automatic routing to microservices  
✅ **Rate Limiting** - Protect services from overload  
✅ **Health Monitoring** - Monitor all services from one place  
✅ **CORS Support** - Handle cross-origin requests  
✅ **Error Handling** - Graceful error responses  
✅ **Load Balancing Ready** - Easy to scale horizontally  

## API Gateway Endpoints

### Gateway Management
```
GET  /health       - Gateway health check
GET  /api/status   - All services status
GET  /api/docs     - API documentation
```

### Service Routes (All HTTP methods supported)
```
/api/customer/*      → Customer Service (port 3001)
/api/sellers/*       → Sellers Service (port 3002) 
/api/media/*         → Media Service (port 3003)
/api/products/*      → Products Service (port 3004)
/api/orders/*        → Orders Service (port 3005)
/api/admin/*         → Admin Service (port 3006)
/api/notifications/* → Notifications Service (port 3007)
```

## Usage Examples

### Before Gateway (Multiple Ports)
```bash
# Customer signup
curl -X POST http://localhost:3001/api/v1/customers/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'

# Get products  
curl http://localhost:3004/api/v1/products

# Upload media
curl -X POST http://localhost:3003/api/v1/media/upload \
  -F "file=@image.jpg"
```

### After Gateway (Single Port 8000)
```bash
# Customer signup
curl -X POST http://localhost:8000/api/customer/customers/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'

# Get products
curl http://localhost:8000/api/products/products

# Upload media
curl -X POST http://localhost:8000/api/media/media/upload \
  -F "file=@image.jpg"
```

## Path Rewriting

The gateway automatically converts paths:

| Gateway Request | Service Request |
|----------------|----------------|
| `/api/customer/customers/signup` | `/api/v1/customers/signup` |
| `/api/products/products/123` | `/api/v1/products/123` |
| `/api/orders/cart/add` | `/api/v1/cart/add` |
| `/api/media/media/upload` | `/api/v1/media/upload` |

## Authentication

Authentication tokens are passed through to services:

```bash
# JWT tokens work seamlessly
curl -X GET http://localhost:8000/api/orders/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Service keys for inter-service calls
curl -X POST http://localhost:8000/api/customer/service/bulk \
  -H "X-Service-Key: order-secret-key-2024"
```

## Error Handling

The gateway provides consistent error responses:

```json
{
  "success": false,
  "message": "customer service unavailable",
  "error": "Bad Gateway",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

Common status codes:
- **502** - Service unavailable
- **404** - Route not found  
- **429** - Rate limit exceeded
- **500** - Gateway error

## Health Monitoring

Check gateway health:
```bash
curl http://localhost:8000/health
```

Check all services status:
```bash
curl http://localhost:8000/api/status
```

## Configuration

Environment variables in `api-gateway/.env`:

```env
PORT=8000
CORS_ORIGIN=*
RATE_LIMIT_MAX=1000

# Service URLs
CUSTOMER_SERVICE_URL=http://localhost:3001
SELLERS_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
PRODUCTS_SERVICE_URL=http://localhost:3004
ORDERS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006
NOTIFICATIONS_SERVICE_URL=http://localhost:3007
```

## Frontend Integration

Update your frontend to use the gateway:

```javascript
// Before (Multiple URLs)
const CUSTOMER_API = 'http://localhost:3001/api/v1';
const PRODUCTS_API = 'http://localhost:3004/api/v1';
const ORDERS_API = 'http://localhost:3005/api/v1';

// After (Single Gateway URL)
const API_GATEWAY = 'http://localhost:8000/api';

// API calls
fetch(`${API_GATEWAY}/customer/customers/signup`, { ... })
fetch(`${API_GATEWAY}/products/products`, { ... })
fetch(`${API_GATEWAY}/orders/cart/add`, { ... })
```

## Development vs Production

### Development
```bash
npm run dev  # Start gateway with nodemon
```

### Production  
```bash
npm start    # Start gateway in production mode
```

## PM2 Integration

The gateway is included in the PM2 ecosystem:

```bash
pm2 start ecosystem.config.js  # Start all services + gateway
pm2 logs api-gateway          # View gateway logs
pm2 restart api-gateway       # Restart gateway only
```

## Testing

Use the provided test file:
```bash
# Install REST client extension in VS Code
# Open api-gateway/test-requests.http
# Click "Send Request" on any endpoint
```

## Performance

- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **Timeout**: 30 seconds per request
- **Compression**: Gzip enabled
- **CORS**: Configurable origins
- **Security**: Helmet.js headers

## Deployment Ready

The gateway is ready for:
- ✅ Docker containers
- ✅ Kubernetes pods  
- ✅ Load balancers
- ✅ Reverse proxies (Nginx)
- ✅ SSL termination
- ✅ Service mesh integration

## Summary

🎯 **Single URL**: `http://localhost:8000`  
📚 **Documentation**: `http://localhost:8000/api/docs`  
🏥 **Health Check**: `http://localhost:8000/health`  
📊 **Service Status**: `http://localhost:8000/api/status`  

**All your microservices are now accessible through one unified API Gateway!** 🚀