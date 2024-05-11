# Customer Service API Documentation

## Overview
The Customer Service manages customer accounts, authentication, profiles, and addresses. It provides secure customer registration, login functionality, profile management, and address book features for the e-commerce platform.

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
- **Public Endpoints**: Registration and login
- **Protected Endpoints**: Profile and address management (requires customer authentication)
- **Admin Endpoints**: Customer management (requires service key)

### Headers
```http
Authorization: Bearer <jwt_token>
X-Service-Key: <service_secret_key>
Content-Type: application/json
```

---

## Public Endpoints

### Customer Registration
Register a new customer account.

**Endpoint:** `POST /customers/register`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "securePassword123",
  "phone": "1234567890",
  "dateOfBirth": "1992-05-15",
  "gender": "female"
}
```

**Validation Rules:**
- `firstName`, `lastName`: 2-50 characters, required
- `email`: Valid email format, unique, required
- `password`: Minimum 6 characters, required
- `phone`: 10-15 digits, required
- `dateOfBirth`: Valid date (YYYY-MM-DD)
- `gender`: male, female, other, prefer_not_to_say

**Response:**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "customer": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "phone": "1234567890",
      "dateOfBirth": "1992-05-15",
      "gender": "female",
      "isActive": true,
      "isVerified": false,
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Customer Login
Authenticate customer and receive access tokens.

**Endpoint:** `POST /customers/login`

**Request Body:**
```json
{
  "email": "jane.smith@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "phone": "1234567890",
      "isActive": true,
      "lastLogin": "2023-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token
Get new access token using refresh token.

**Endpoint:** `POST /customers/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Protected Endpoints (Customer Authentication Required)

### Get Customer Profile
Retrieve the authenticated customer's profile information.

**Endpoint:** `GET /customers/profile`

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "phone": "1234567890",
    "dateOfBirth": "1992-05-15",
    "gender": "female",
    "profileImage": "uuid-media-id",
    "preferences": {
      "newsletter": true,
      "smsNotifications": false,
      "language": "en",
      "currency": "USD"
    },
    "isActive": true,
    "isVerified": true,
    "emailVerified": true,
    "phoneVerified": false,
    "totalOrders": 15,
    "totalSpent": 1250.75,
    "loyaltyPoints": 125,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update Customer Profile
Update customer profile information.

**Endpoint:** `PUT /customers/profile`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "phone": "1234567890",
  "dateOfBirth": "1992-05-15",
  "gender": "female",
  "profileImage": "uuid-media-id",
  "preferences": {
    "newsletter": true,
    "smsNotifications": true,
    "language": "en",
    "currency": "USD"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Jane",
    "lastName": "Smith-Johnson",
    // ... updated profile data
  }
}
```

### Change Password
Change customer account password.

**Endpoint:** `PUT /customers/change-password`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Address Management Endpoints

### Get Customer Addresses
Retrieve all addresses for the authenticated customer.

**Endpoint:** `GET /customers/addresses`

**Response:**
```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "customerId": "507f1f77bcf86cd799439011",
      "type": "home",
      "label": "Home Address",
      "firstName": "Jane",
      "lastName": "Smith",
      "company": "",
      "street": "123 Main Street",
      "street2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postalCode": "10001",
      "phone": "1234567890",
      "isDefault": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Add Customer Address
Add a new address to customer's address book.

**Endpoint:** `POST /customers/addresses`

**Request Body:**
```json
{
  "type": "work",
  "label": "Office Address",
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Tech Corp",
  "street": "456 Business Ave",
  "street2": "Suite 200",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10002",
  "phone": "9876543210",
  "isDefault": false
}
```

**Validation Rules:**
- `type`: home, work, other
- `firstName`, `lastName`: Required, 1-50 characters
- `street`, `city`, `state`, `country`: Required
- `postalCode`: Required, 3-10 characters
- `phone`: Optional, 10-15 digits

**Response:**
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "customerId": "507f1f77bcf86cd799439011",
    "type": "work",
    "label": "Office Address",
    // ... full address object
  }
}
```

### Update Customer Address
Update an existing address.

**Endpoint:** `PUT /customers/addresses/:addressId`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addressId` | string | Yes | Address ID |

**Request Body:** Same as Add Address (all fields optional)

### Delete Customer Address
Remove an address from customer's address book.

**Endpoint:** `DELETE /customers/addresses/:addressId`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addressId` | string | Yes | Address ID |

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

### Set Default Address
Set an address as the default address.

**Endpoint:** `PUT /customers/addresses/:addressId/default`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addressId` | string | Yes | Address ID |

**Response:**
```json
{
  "success": true,
  "message": "Default address updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "isDefault": true,
    // ... address object
  }
}
```

---

## Account Management Endpoints

### Request Password Reset
Request password reset email.

**Endpoint:** `POST /customers/forgot-password`

**Request Body:**
```json
{
  "email": "jane.smith@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password
Reset password using reset token.

**Endpoint:** `POST /customers/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

### Verify Email
Verify customer email address.

**Endpoint:** `GET /customers/verify-email/:token`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Email verification token |

### Resend Verification Email
Resend email verification.

**Endpoint:** `POST /customers/resend-verification`

**Request Body:**
```json
{
  "email": "jane.smith@example.com"
}
```

### Deactivate Account
Deactivate customer account.

**Endpoint:** `POST /customers/deactivate`

**Request Body:**
```json
{
  "password": "currentPassword123",
  "reason": "No longer needed"
}
```

---

## Admin Endpoints (Service Key Required)

### Get All Customers (Admin)
Retrieve all customers with filtering and pagination.

**Endpoint:** `GET /customers/admin`
**Authentication:** Service Key Required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `search` | string | - | Search in name, email, phone |
| `status` | string | all | Filter by status (active/inactive/all) |
| `verified` | boolean | - | Filter by verification status |

**Response:**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": {
    "customers": [
      {
        "id": "507f1f77bcf86cd799439011",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "phone": "1234567890",
        "isActive": true,
        "isVerified": true,
        "emailVerified": true,
        "totalOrders": 15,
        "totalSpent": 1250.75,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "lastLogin": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 250,
      "totalPages": 25
    }
  }
}
```

### Update Customer Status (Admin)
Update customer account status.

**Endpoint:** `PATCH /customers/admin/:id/status`
**Authentication:** Service Key Required

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Customer ID |

**Request Body:**
```json
{
  "isActive": true
}
```

### Get Customer Details (Admin)
Get detailed customer information.

**Endpoint:** `GET /customers/admin/:id`
**Authentication:** Service Key Required

**Response:** Same as Get Customer Profile with additional admin fields

---

## Service-to-Service Endpoints

### Verify Customer
Verify if customer exists and is active (for order service).

**Endpoint:** `POST /customers/service/verify`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "customerId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer verified",
  "data": {
    "customerId": "507f1f77bcf86cd799439011",
    "isValid": true,
    "isActive": true,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com"
  }
}
```

### Get Customer Address
Get specific customer address for order processing.

**Endpoint:** `GET /customers/service/:customerId/addresses/:addressId`
**Authentication:** Service Key Required

**Response:**
```json
{
  "success": true,
  "message": "Address retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "customerId": "507f1f77bcf86cd799439011",
    "firstName": "Jane",
    "lastName": "Smith",
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001",
    "phone": "1234567890"
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

### Validation Errors
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

---

## Data Models

### Customer Model
```typescript
interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profileImage?: string;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    language: string;
    currency: string;
  };
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
```

### Address Model
```typescript
interface Address {
  id: string;
  customerId: string;
  type: 'home' | 'work' | 'other';
  label: string;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault: boolean;
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

### JWT Tokens
- **Access Token**: 24-hour expiry
- **Refresh Token**: 7-day expiry
- Tokens include customer ID, email, and verification status

### Email Verification
- Required for account activation
- Verification tokens expire after 24 hours
- Can be resent if expired

### Rate Limiting
- **Public Endpoints**: 100 requests per 15 minutes per IP
- **Authenticated Endpoints**: 1000 requests per 15 minutes per customer
- **Service Endpoints**: No rate limiting

---

## Business Rules

### Account Verification
- New customers start as unverified
- Email verification required for full account access
- Phone verification is optional but recommended

### Address Management
- Customers can have multiple addresses
- One address must be marked as default
- Deleting default address automatically assigns another as default

### Privacy & Data Protection
- Profile images are stored via Media Service
- Personal data is encrypted at rest
- GDPR-compliant data export available

---

## Integration Notes

### Media Service Integration
- Profile images reference Media Service UUIDs
- Image validation handled by Media Service
- Automatic cleanup of unused profile images

### Orders Service Integration
- Address validation for order delivery
- Customer verification for order processing
- Order history and spending statistics

### Notifications Service Integration
- Email verification and password reset emails
- Marketing newsletter subscriptions
- Order status notifications based on preferences