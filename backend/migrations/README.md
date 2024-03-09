# Database Migrations & Seed Data

This directory contains database migrations to populate your microservices with dummy data for testing and development.

## What gets created

### 👥 Customers (5 users)
- **Database**: `customer_db`
- **Password**: `password123` (for all users)
- **Users**: John Doe, Jane Smith, Mike Johnson, Sarah Williams, David Brown

### 🏪 Sellers (5 businesses)
- **Database**: `sellers_db` 
- **Password**: `password123` (for all users)
- **Businesses**: TechGadgets Store, Fashion Forward, BookWorm Paradise, Home & Garden Plus, Athletic Pro Shop

### 👑 Admin (3 roles)
- **Database**: `admin_db`
- **Super Admin**: admin@example.com / admin123
- **Store Manager**: manager@example.com / manager123  
- **Moderator**: moderator@example.com / moderator123

### 📦 Products (10 items)
- **Database**: `products_db`
- **Categories**: Electronics, Clothing, Books, Home & Garden, Sports
- **Associated with**: Seller accounts

## Usage

### Install Dependencies
```bash
cd /home/haresh/Desktop/services/backend/migrations
npm install
```

### Run All Migrations
```bash
npm run migrate
```

### Run Individual Migrations
```bash
# Customers only
npm run migrate:customers

# Sellers only  
npm run migrate:sellers

# Admin only
npm run migrate:admin

# Products only
npm run migrate:products
```

### Reset & Re-run
```bash
npm run migrate:reset
```

## Login Credentials

After running migrations, you can use these credentials to test the application:

### Customer Login
```
Email: john.doe@example.com
Password: password123

Email: jane.smith@example.com  
Password: password123
```

### Seller Login
```
Email: alex.tech@example.com
Password: password123

Email: maria.fashion@example.com
Password: password123
```

### Admin Login
```
Email: admin@example.com
Password: admin123
```

## Database Configuration

The migrations use these default MongoDB connection strings:
- **Customers**: `mongodb://localhost:27017/customer_db`
- **Sellers**: `mongodb://localhost:27017/sellers_db`
- **Admin**: `mongodb://localhost:27017/admin_db`
- **Products**: `mongodb://localhost:27017/products_db`

You can override these with environment variables:
- `CUSTOMER_MONGODB_URI`
- `SELLERS_MONGODB_URI`
- `ADMIN_MONGODB_URI`
- `PRODUCTS_MONGODB_URI`

## Files

- `001_seed_customers.js` - Creates customer accounts
- `002_seed_sellers.js` - Creates seller accounts  
- `003_seed_admin.js` - Creates admin accounts
- `004_seed_products.js` - Creates product catalog
- `run_migrations.js` - Main migration runner
- `package.json` - Dependencies and scripts
- `README.md` - This documentation

## Notes

- Migrations are idempotent - they won't create duplicates if run multiple times
- All passwords are hashed using bcrypt with 12 salt rounds
- Products are automatically associated with seller accounts
- Admin users have different permission levels based on their role