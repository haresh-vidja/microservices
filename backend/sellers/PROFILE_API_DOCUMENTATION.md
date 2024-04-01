# Seller Service - Profile API Documentation

## Overview
The Profile API provides comprehensive seller profile management including both personal seller data and business information.

## Base URL
```
http://localhost:3002/api/v1/sellers
```

## Authentication
All profile endpoints require Bearer token authentication:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get Seller Profile
**GET** `/profile`

Returns the complete seller profile including personal and business data.

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "seller": {
      "id": "seller_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "businessName": "John's Store",
      "businessType": "individual",
      "isActive": true,
      "isVerified": false,
      "createdAt": "2025-08-09T06:00:00.000Z",
      "updatedAt": "2025-08-09T06:00:00.000Z"
    },
    "business": {
      "id": "business_id",
      "sellerId": "seller_id",
      "businessName": "John's Store",
      "businessType": "individual",
      "description": "Electronics store",
      "email": "john@example.com",
      "phone": "1234567890",
      "website": "https://johnsstore.com",
      "industry": "Electronics",
      "categories": ["electronics", "gadgets"],
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postalCode": "10001"
      },
      "verificationStatus": "pending",
      "isActive": true,
      "createdAt": "2025-08-09T06:00:00.000Z",
      "updatedAt": "2025-08-09T06:00:00.000Z"
    }
  }
}
```

### 2. Update Seller Profile
**PUT** `/profile`

Updates seller personal and business information.

**Request Body:**
```json
{
  // Personal Information (optional)
  "firstName": "John",
  "lastName": "Smith",
  "phone": "1234567891",
  "profileImage": "https://example.com/image.jpg",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  
  // Business Information (optional)
  "businessName": "John's Tech Store",
  "businessType": "llc",
  "description": "Updated electronics and technology store",
  "website": "https://johnstechstore.com",
  "industry": "Electronics",
  "categories": ["electronics", "gadgets", "computers"],
  "establishedDate": "2020-01-15",
  "employeeCount": 5,
  
  // Business Address (optional)
  "address": {
    "street": "456 Business Ave",
    "street2": "Suite 100",
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
    "seller": { /* updated seller data */ },
    "business": { /* updated business data */ }
  }
}
```

## Data Models

### Seller Fields (Personal)
- `firstName` - String, 2-50 characters
- `lastName` - String, 2-50 characters  
- `phone` - String, 10-15 digits
- `profileImage` - String, URL
- `dateOfBirth` - Date
- `gender` - String, enum: ['male', 'female', 'other']

### Business Fields
- `businessName` - String, max 100 characters
- `businessType` - String, enum: ['individual', 'partnership', 'llc', 'corporation', 'other']
- `description` - String, max 1000 characters
- `website` - String, valid URL
- `industry` - String, max 100 characters
- `categories` - Array of strings
- `establishedDate` - Date
- `employeeCount` - Number, min 1
- `address` - Object with street, street2, city, state, country, postalCode

## Security Features

### Protected Fields
The following fields cannot be updated via the profile API:
- `email` (seller's email)
- `password`
- `refreshToken`
- `role`
- `isVerified`
- `businessDocuments`

### Validation
- All input is validated using Joi schemas
- Phone numbers must be 10-15 digits
- Email format validation
- URL validation for website
- Address field requirements

## Error Responses

**400 Bad Request** - Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "firstName",
      "message": "First name is required"
    }
  ]
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**404 Not Found** - Seller not found
```json
{
  "success": false,
  "message": "Seller not found"
}
```

## Usage Examples

See `test-profile-api.http` for complete API usage examples including:
1. User registration
2. Login to get token
3. Get profile
4. Update profile
5. Verify updates

## Testing

The Profile API has been tested with:
- ✅ User registration and profile creation
- ✅ Profile retrieval with seller and business data
- ✅ Profile updates for both personal and business information
- ✅ Input validation and error handling
- ✅ Security field protection

## Notes

- Business profile is automatically created during seller registration
- If business profile doesn't exist during update, it will be created
- All updates are atomic - either all succeed or none are applied
- Timestamps (createdAt, updatedAt) are automatically managed