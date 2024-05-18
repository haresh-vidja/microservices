# 🚀 Microservices E-commerce Platform

A comprehensive, distributed microservices architecture built with Node.js, PHP, and React, designed for scalability, maintainability, and high performance.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

This project implements a modern e-commerce platform using microservices architecture, featuring separate services for customers, sellers, products, orders, media management, and notifications. The system is designed to handle high traffic loads while maintaining code quality and developer experience.

## ✨ Features

### 🛍️ E-commerce Features
- **Product Management**: Full CRUD operations for products with inventory tracking
- **Customer Management**: User registration, authentication, and profile management
- **Seller Management**: Multi-seller support with business profiles and role management
- **Order Processing**: Complete order lifecycle with cart management
- **Media Management**: File uploads, image processing, and storage optimization

### 🔐 Security & Authentication
- JWT-based authentication across all services
- Role-based access control (RBAC)
- Secure password handling and validation
- API Gateway with request validation and rate limiting

### 📱 User Experience
- Responsive React frontend with modern UI/UX
- Real-time notifications and updates
- Mobile-first design approach
- Progressive Web App (PWA) capabilities

### 🏗️ Architecture Features
- **Service Discovery**: Automatic service registration and health monitoring
- **Load Balancing**: Distributed request handling across service instances
- **Event-Driven Communication**: Kafka-based messaging for asynchronous operations
- **Database Per Service**: Isolated data storage for better scalability
- **API Gateway**: Single entry point with unified authentication and routing

## 🏛️ Architecture

The system follows a **microservices architecture pattern** with the following key components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │   Admin Panel   │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │   Customer   │ │   Seller    │ │  Product   │
        │   Service    │ │   Service   │ │  Service   │
        │  (Node.js)   │ │  (Node.js)  │ │ (Node.js)  │
        └──────────────┘ └──────────────┘ └───────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │    Order     │ │   Media     │ │Notification│
        │   Service    │ │   Service   │ │  Service   │
        │  (Node.js)   │ │   (PHP)     │ │   (PHP)   │
        └──────────────┘ └──────────────┘ └───────────┘
```

## 🔧 Services

### Core Services

| Service | Technology | Purpose | Port |
|---------|------------|---------|------|
| **API Gateway** | Node.js | Request routing, authentication, rate limiting | 3000 |
| **Customer Service** | Node.js | User management, authentication, profiles | 3001 |
| **Seller Service** | Node.js | Seller management, business profiles | 3002 |
| **Product Service** | Node.js | Product catalog, inventory management | 3003 |
| **Order Service** | Node.js | Order processing, cart management | 3004 |
| **Media Service** | PHP | File uploads, image processing | 3005 |
| **Notification Service** | PHP | Email, SMS, push notifications | 3006 |
| **Admin Service** | Node.js | System administration, analytics | 3007 |

### Frontend Applications

| Application | Technology | Purpose | Port |
|-------------|------------|---------|------|
| **Customer Frontend** | React | E-commerce shopping experience | 3008 |
| **Seller Dashboard** | React | Seller management interface | 3009 |
| **Admin Panel** | React | System administration | 3010 |

## 🛠️ Tech Stack

### Backend Technologies
- **Node.js** - Runtime environment for JavaScript services
- **Express.js** - Web framework for Node.js
- **PHP** - Server-side scripting for specific services
- **MongoDB** - NoSQL database for flexible data storage
- **PostgreSQL** - Relational database for structured data
- **Redis** - In-memory data structure store for caching
- **Kafka** - Distributed streaming platform for messaging

### Frontend Technologies
- **React** - JavaScript library for building user interfaces
- **Redux** - State management for React applications
- **Material-UI** - React component library for design consistency
- **Axios** - HTTP client for API communication

### DevOps & Infrastructure
- **Docker** - Containerization for consistent deployment
- **PM2** - Process manager for Node.js applications
- **Nginx** - Web server and reverse proxy
- **Git** - Version control system

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- PHP 8.0+
- MongoDB 5.0+
- PostgreSQL 13+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/haresh-vidja/microswervices.git
   cd microswervices
   ```

2. **Install dependencies for all services**
   ```bash
   # Install backend dependencies
   cd backend/customer && npm install
   cd ../seller && npm install
   cd ../products && npm install
   cd ../orders && npm install
   cd ../api-gateway && npm install
   cd ../admin && npm install
   
   # Install frontend dependencies
   cd ../../frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp backend/customer/.env.example backend/customer/.env
   cp backend/seller/.env.example backend/seller/.env
   # ... repeat for other services
   ```

4. **Start the services**
   ```bash
   # Using PM2 ecosystem
   pm2 start ecosystem.config.js
   
   # Or start individually
   cd backend/customer && npm start
   cd ../seller && npm start
   # ... repeat for other services
   ```

5. **Access the application**
   - Customer Frontend: http://localhost:3008
   - Seller Dashboard: http://localhost:3009
   - Admin Panel: http://localhost:3010
   - API Gateway: http://localhost:3000

## 📚 API Documentation

Each service provides comprehensive API documentation:

- **Customer Service**: [API Documentation](backend/customer/API.md)
- **Seller Service**: [API Documentation](backend/seller/API.md)
- **Product Service**: [API Documentation](backend/products/API.md)
- **Order Service**: [API Documentation](backend/orders/API.md)
- **Media Service**: [API Documentation](backend/media/API.md)
- **Notification Service**: [API Documentation](backend/notifications/API.md)
- **Admin Service**: [API Documentation](backend/admin/API.md)

## 🧪 Development

### Development Workflow
1. Create feature branch from `main`
2. Implement changes following coding standards
3. Write tests for new functionality
4. Submit pull request with detailed description
5. Code review and approval process
6. Merge to main branch

### Coding Standards
- **JavaScript/Node.js**: ESLint + Prettier configuration
- **PHP**: PSR-12 coding standards
- **React**: Component-based architecture with hooks
- **Database**: Consistent naming conventions and migrations

### Testing
```bash
# Run tests for all services
npm run test:all

# Run tests for specific service
cd backend/customer && npm test
cd backend/seller && npm test
```

## 🚀 Deployment

### Production Deployment
```bash
# Build production assets
npm run build:all

# Deploy using PM2
pm2 start ecosystem.config.js --env production

# Or use Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration
- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/haresh-vidja/microswervices/issues)
- **Discussions**: [GitHub Discussions](https://github.com/haresh-vidja/microswervices/discussions)
- **Email**: hareshvidja@gmail.com

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by microservices architecture patterns
- Community-driven development approach

---

**Made with ❤️ by Haresh Vidja**

*Last updated: December 2024* 