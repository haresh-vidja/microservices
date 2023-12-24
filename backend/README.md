# Backend Microservices

This project contains microservices built with Express.js and MongoDB, providing a complete backend solution for an e-commerce platform.

## Services

### 1. Customer Service (Port: 3001)
- Customer registration and authentication
- Profile management
- Address management
- JWT-based authentication with refresh tokens

### 2. Sellers Service (Port: 3002)
- Seller registration and authentication
- Role-based access control
- Business profile management
- Comprehensive permission system

### 3. Media Service (Port: 3003)
- File upload handling
- Image processing with thumbnails
- Support for images, PDFs, and CSV files
- Static file serving

### 4. Products Service (Port: 3004)
- Product catalog management
- CRUD operations for products
- Search and filtering capabilities
- Category-based organization

## Technology Stack

- **Runtime**: Node.js 14+
- **Framework**: Express.js 4.17.1
- **Database**: MongoDB with Mongoose 5.13.14
- **Authentication**: JWT tokens
- **File Processing**: Multer + Sharp
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI 3.0
- **Process Management**: PM2

## Getting Started

### Prerequisites

- Node.js 14 or higher
- MongoDB running on localhost:27017
- PM2 installed globally (`npm install -g pm2`)

### Installation

1. Install dependencies for all services:
```bash
npm run install-all
```

2. Copy environment files:
```bash
cp customer/.env.example customer/.env
cp sellers/.env.example sellers/.env
```

3. Start all services with PM2:
```bash
pm2 start ecosystem.config.js
```

### Individual Service Management

Start individual services:
```bash
# Customer service
npm run customer:dev

# Sellers service  
npm run sellers:dev

# Media service
npm run media:dev

# Products service
npm run products:dev
```

## API Endpoints

### Customer Service (http://localhost:3001)
- `POST /api/v1/customers/signup` - Register customer
- `POST /api/v1/customers/signin` - Login customer
- `GET /api/v1/customers/profile` - Get profile
- `PUT /api/v1/customers/profile` - Update profile
- `POST /api/v1/addresses` - Create address
- `GET /api/v1/addresses` - Get addresses

### Sellers Service (http://localhost:3002)
- `POST /api/v1/sellers/signup` - Register seller
- `POST /api/v1/sellers/signin` - Login seller
- `GET /api/v1/sellers/profile` - Get profile
- `POST /api/v1/sellers/create` - Create seller (admin)
- `GET /api/v1/sellers/list` - Get sellers list

### Media Service (http://localhost:3003)
- `POST /api/v1/media/upload/:type` - Upload file
- `DELETE /api/v1/media/delete` - Delete file
- `GET /uploads/*` - Serve static files

### Products Service (http://localhost:3004)
- `GET /api/v1/products` - Get products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products/:id` - Get product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

## API Documentation

Each service provides Swagger documentation:
- Customer: http://localhost:3001/api-docs
- Sellers: http://localhost:3002/api-docs
- Media: http://localhost:3003/api-docs
- Products: http://localhost:3004/api-docs

## Database Configuration

Each service uses its own MongoDB database:
- Customer Service: `customer_db`
- Sellers Service: `sellers_db`
- Media Service: File-based (no database)
- Products Service: `products_db`

## Features

### Security
- Helmet.js for security headers
- CORS configuration
- Rate limiting on API endpoints
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Input validation with Joi

### Logging
- Structured logging with Winston
- Daily log rotation
- Separate error logs
- Request logging middleware

### File Handling
- Multi-format file support
- Image resizing and thumbnails
- Secure file validation
- Organized upload directories

### Role-Based Access Control (Sellers Service)
- Hierarchical role system
- Granular permissions
- Default roles: super-admin, admin, manager, seller
- Permission checking middleware

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

## Environment Variables

### Customer Service (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/customer_db
JWT_SECRET=customer-secret-key
```

### Sellers Service (.env)
```
PORT=3002
MONGODB_URI=mongodb://localhost:27017/sellers_db
JWT_SECRET=sellers-secret-key
```

## Author

Haresh Vidja  
Email: hareshvidja@gmail.com

## License

ISC