# Sellers Service API Documentation

## Overview
The Sellers Service manages seller accounts, authentication, business profiles, and seller-related operations. It handles seller registration, login, profile management, and provides seller information to other services.

## Base URL
```
http://localhost:3002/api/v1
```

## Authentication
- **Public Endpoints**: Registration and login
- **Protected Endpoints**: Profile management (requires seller authentication)
- **Admin Endpoints**: Seller management (requires service key)
- **Service Endpoints**: Inter-service communication (requires service key)

### Headers
```http
Authorization: Bearer <jwt_token>
X-Service-Key: <service_secret_key>
Content-Type: application/json
```

---

## Public Endpoints

### Seller Registration
Register a new seller account with business information.

**Endpoint:** `POST /sellers/signup`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "phone": "1234567890",
  "businessName": "John's Electronics",
  "businessType": "individual",
  "businessDescription": "Electronics retailer specializing in mobile devices",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001"
  }
}
```

**Validation Rules:**
- `firstName`, `lastName`: 2-50 characters
- `email`: Valid email format, unique
- `password`: Minimum 6 characters
- `phone`: 10-15 digits
- `businessType`: individual, partnership, llc, corporation, other
- `postalCode`: 3-10 alphanumeric characters

**Response:**
```json
{
  "success": true,
  "message": "Seller registered successfully",
  "data": {
    "seller": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "businessName": "John's Electronics",
      "isActive": true,
      "isVerified": false,
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "business": {
      "businessName": "John's Electronics",
      "businessType": "individual",
      "description": "Electronics retailer specializing in mobile devices",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postalCode": "10001"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Seller Login
Authenticate seller and receive access tokens.

**Endpoint:** `POST /sellers/signin`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "seller": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "businessName": "John's Electronics",
      "isActive": true,
      "lastLogin": "2023-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Protected Endpoints (Seller Authentication Required)

### Get Current Seller Profile
Retrieve the authenticated seller's profile information.

**Endpoint:** `GET /sellers/profile`

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "seller": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "businessName": "John's Electronics",
      "profileImage": "uuid-media-id",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "isActive": true,
      "isVerified": true,
      "rating": 4.5,
      "totalSales": 150,
      "totalProducts": 25,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "lastLogin": "2023-01-01T00:00:00.000Z"
    },
    "business": {
      "businessName": "John's Electronics",
      "businessType": "individual",
      "description": "Electronics retailer specializing in mobile devices",
      "logoMediaId": "uuid-media-id",
      "website": "https://johnselectronics.com",
      "industry": "Electronics",
      "categories": ["electronics", "mobile"],
      "establishedDate": "2020-01-01",
      "employeeCount": 5,
      "address": {
        "street": "123 Main St",
        "street2": "Suite 456",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postalCode": "10001"
      }
    }
  }
}
```

### Update Seller Profile
Update seller profile and business information.

**Endpoint:** `PUT /sellers/profile`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "profileImage": "uuid-media-id",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "businessName": "John's Electronics Store",
  "businessType": "llc",
  "description": "Premium electronics retailer",
  "logoMediaId": "uuid-media-id",
  "website": "https://johnselectronics.com",
  "industry": "Electronics Retail",
  "categories": ["electronics", "mobile", "computers"],
  "establishedDate": "2020-01-01",
  "employeeCount": 10,
  "address": {
    "street": "456 Business Ave",
    "street2": "Floor 2",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10002"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "seller": {
      // Updated seller object
    },
    "business": {
      // Updated business object
    }
  }
}
```

### Get Seller by ID
Get specific seller's public profile.

**Endpoint:** `GET /sellers/profile/:id`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Seller ID |

---

## Admin Endpoints (Service Key Required)

### Create Seller (Admin)
Create a new seller account as admin.

**Endpoint:** `POST /sellers/create`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "adminPassword123",
  "phone": "9876543210",
  "businessName": "Jane's Store",
  "roleId": "admin-role-id"
}
```

### Get All Sellers (Admin)
Retrieve all sellers with filtering and pagination.

**Endpoint:** `GET /sellers/admin`
**Authentication:** Service Key Required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `search` | string | - | Search in name, email, phone, business |
| `status` | string | all | Filter by status (active/inactive/all) |

**Response:**
```json
{
  "success": true,
  "message": "Sellers retrieved successfully",
  "data": {
    "sellers": [
      {
        "id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "1234567890",
        "businessName": "John's Electronics",
        "businessType": "individual",
        "isActive": true,
        "isVerified": true,
        "rating": 4.5,
        "totalSales": 150,
        "totalProducts": 25,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "lastLogin": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Update Seller Status (Admin)
Update seller account status.

**Endpoint:** `PATCH /sellers/admin/:id/status`
**Authentication:** Service Key Required

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Seller ID |

**Request Body:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller status updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "isActive": true,
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Seller List (Admin)
Get seller list with role-based access.

**Endpoint:** `GET /sellers/list`
**Authentication:** Bearer Token Required (Admin Role)

**Query Parameters:** Same as Get All Sellers

---

## Service-to-Service Endpoints

### Bulk Seller Retrieval
Get multiple sellers by IDs (for other services).

**Endpoint:** `POST /sellers/service/bulk`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "sellerIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sellers retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "businessName": "John's Electronics",
      "logo": "uuid-media-id",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Verify Seller
Verify if seller exists and is active.

**Endpoint:** `POST /sellers/service/verify`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "sellerId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller verified",
  "data": {
    "sellerId": "507f1f77bcf86cd799439011",
    "isValid": true,
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
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
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Account Lock Response
```json
{
  "success": false,
  "message": "Account temporarily locked due to multiple failed login attempts. Please try again later.",
  "lockUntil": "2023-01-01T01:00:00.000Z"
}
```

---

## Data Models

### Seller Model
```typescript
interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  profileImage?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  isActive: boolean;
  isVerified: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  rating: number;
  totalSales: number;
  totalProducts: number;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
```

### Business Model
```typescript
interface Business {
  sellerId: string;
  businessName: string;
  businessType: 'individual' | 'partnership' | 'llc' | 'corporation' | 'other';
  description?: string;
  logoMediaId?: string;
  website?: string;
  industry?: string;
  categories: string[];
  establishedDate?: Date;
  employeeCount?: number;
  address: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  phone?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Security Features

### Password Security
- Minimum 6 characters required
- Passwords are hashed using bcrypt
- Salt rounds: 12

### Account Lockout
- Maximum 5 login attempts
- 30-minute lockout after exceeding attempts
- Lockout counter resets after successful login

### JWT Tokens
- **Access Token**: 24-hour expiry
- **Refresh Token**: 7-day expiry
- Tokens include seller ID, email, and role information

### Rate Limiting
- **Public Endpoints**: 100 requests per 15 minutes per IP
- **Authenticated Endpoints**: 1000 requests per 15 minutes per seller
- **Service Endpoints**: No rate limiting

---

## Business Rules

### Seller Verification
- New sellers start as unverified (`isVerified: false`)
- Verification requires admin approval or document submission
- Unverified sellers have limited functionality

### Business Profile
- Business information is optional during registration
- Can be updated anytime through profile endpoint
- Logo and images are managed through Media Service

### Account Status
- Inactive sellers cannot login
- Inactive sellers' products are hidden from public listings
- Admin can activate/deactivate seller accounts

---

## Integration Notes

### Media Service Integration
- Profile images and business logos reference Media Service UUIDs
- Media files are validated before saving seller profiles
- Unused media files are automatically cleaned up

### Products Service Integration
- Seller ownership validation for product operations
- Seller information provided for product listings
- Sales statistics updated from order completion

### Orders Service Integration
- Seller verification for order processing
- Commission calculation based on seller tier
- Revenue tracking and reporting