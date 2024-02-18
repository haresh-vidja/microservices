# API Gateway

Single entry point for all microservices. Routes requests to appropriate services using HTTP proxy middleware.

## Quick Start

```bash
cd api-gateway
npm install
npm start
```

The gateway will be available at `http://localhost:8000`

## Features

- ✅ **Single Entry Point** - All API requests go through port 8000
- ✅ **Service Discovery** - Automatic routing to microservices
- ✅ **Health Monitoring** - Check status of all services
- ✅ **Rate Limiting** - Protect services from overload
- ✅ **CORS Support** - Cross-origin resource sharing
- ✅ **Security Headers** - Helmet.js security middleware
- ✅ **Error Handling** - Graceful error responses
- ✅ **Request Logging** - Development request tracking

## API Endpoints

### Gateway Endpoints
- `GET /health` - Gateway health check
- `GET /api/status` - All services status
- `GET /api/docs` - API documentation

### Service Proxies
- `ALL /api/customer/*` → Customer Service (3001)
- `ALL /api/sellers/*` → Sellers Service (3002)
- `ALL /api/media/*` → Media Service (3003)
- `ALL /api/products/*` → Products Service (3004)
- `ALL /api/orders/*` → Orders Service (3005)
- `ALL /api/admin/*` → Admin Service (3006)
- `ALL /api/notifications/*` → Notifications Service (3007)

## Usage Examples

### Before (Direct Service Call)
```bash
curl http://localhost:3001/api/v1/customers/signup
curl http://localhost:3002/api/v1/sellers/signin
curl http://localhost:3004/api/v1/products
```

### After (Through Gateway)
```bash
curl http://localhost:8000/api/customer/customers/signup
curl http://localhost:8000/api/sellers/sellers/signin
curl http://localhost:8000/api/products/products
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=8000
CUSTOMER_SERVICE_URL=http://localhost:3001
SELLERS_SERVICE_URL=http://localhost:3002
# ... other services
```

## Path Rewriting

The gateway automatically rewrites paths:
- `/api/customer/customers/signup` → `/api/v1/customers/signup`
- `/api/products/products/123` → `/api/v1/products/123`

## Error Handling

- **502 Bad Gateway** - Service unavailable
- **404 Not Found** - Route not found
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Error** - Gateway error

## Development

```bash
npm run dev  # Start with nodemon
```

## Production

```bash
npm start
```

## Health Checks

Check gateway health:
```bash
curl http://localhost:8000/health
```

Check all services status:
```bash
curl http://localhost:8000/api/status
```