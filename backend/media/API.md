# Media Service API Documentation

## Overview
The Media Service manages file uploads, storage, and serving for the e-commerce platform. It handles image processing, thumbnail generation, file validation, and secure media delivery. Built with PHP for efficient file handling and processing.

## Base URL
```
http://localhost:3003/api/v1
```

## Authentication
- **Public Endpoints**: File upload (with user authentication via other services)
- **Protected Endpoints**: File management operations
- **Service Endpoints**: Inter-service communication (requires service key)

### Headers
```http
Content-Type: multipart/form-data (for uploads)
Content-Type: application/json (for API calls)
X-Service-Key: <service_secret_key> (for service endpoints)
```

---

## File Upload Endpoints

### Upload File
Upload a file with automatic processing and thumbnail generation.

**Endpoint:** `POST /media/upload`

**Request (multipart/form-data):**
```
file: [binary file data]
type: "profile" | "service" | "temp" (optional, defaults to "temp")
```

**cURL Example:**
```bash
curl -X POST http://localhost:3003/api/v1/media/upload \
  -F "file=@image.jpg" \
  -F "type=profile"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "original_filename": "product-image.jpg",
    "file_size": 1024576,
    "content_type": "image/jpeg",
    "has_thumbnail": true
  }
}
```

**Supported File Types:**
- **Images**: JPG, JPEG, PNG, GIF, WEBP (thumbnails generated)
- **Documents**: PDF, DOC, DOCX, TXT
- **Maximum Size**: 10MB per file

**Upload Types:**
- `profile`: User profile images and avatars
- `service`: Service-related files (logos, banners)
- `temp`: Temporary files (auto-cleanup after 24 hours)

---

## File Serving Endpoints

### Serve Media File
Securely serve media files by ID.

**Endpoint:** `GET /media/serve/{media_id}`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `media_id` | string | Yes | File UUID |

**Response:**
- **Success**: File binary data with appropriate headers
- **Error**: JSON error response

**Headers Set:**
```http
Content-Type: [file mime type]
Content-Length: [file size]
Cache-Control: public, max-age=86400
Content-Disposition: inline; filename="[original filename]"
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

### Serve Thumbnail
Serve thumbnail version of media files.

**Endpoint:** `GET /media/serve-thumb/{media_id}`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `media_id` | string | Yes | File UUID |

**Response:**
- **Success**: Thumbnail binary data (fallback to original if no thumbnail)
- **Error**: JSON error response

**Thumbnail Specifications:**
- **Max Dimensions**: 300x300 pixels
- **Quality**: 85% (JPEG compression)
- **Format**: Maintains original format when possible

---

## File Management Endpoints

### Get File Information
Retrieve metadata about a specific file.

**Endpoint:** `GET /media/{media_id}`

**Response:**
```json
{
  "success": true,
  "message": "File retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "original_filename": "product-image.jpg",
    "stored_filename": "550e8400_e29b_41d4_a716_446655440001.jpg",
    "file_size": 1024576,
    "file_extension": "jpg",
    "content_type": "image/jpeg",
    "upload_type": "profile",
    "access_url": "/media/serve/550e8400-e29b-41d4-a716-446655440001",
    "thumbnail_url": "/media/serve-thumb/550e8400-e29b-41d4-a716-446655440001",
    "is_used": 1,
    "uploaded_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### Delete File
Permanently delete a file and its metadata.

**Endpoint:** `DELETE /media/{media_id}`

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### List Files
Retrieve a paginated list of files.

**Endpoint:** `GET /media`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `type` | string | - | Filter by upload type |

**Response:**
```json
{
  "success": true,
  "message": "Files retrieved successfully",
  "data": {
    "files": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "original_filename": "product-image.jpg",
        "file_size": 1024576,
        "content_type": "image/jpeg",
        "upload_type": "profile",
        "is_used": 1,
        "uploaded_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

---

## Service-to-Service Endpoints

### Validate Files
Validate existence and integrity of multiple files.

**Endpoint:** `POST /media/validate`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "fileIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "File validation completed",
  "data": {
    "files": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "valid": true,
        "exists": true,
        "filename": "550e8400_e29b_41d4_a716_446655440001.jpg",
        "original_name": "product-image.jpg",
        "file_size": 1024576,
        "file_type": "image/jpeg",
        "url": "/media/serve/550e8400-e29b-41d4-a716-446655440001",
        "thumbnail_url": "/media/serve-thumb/550e8400-e29b-41d4-a716-446655440001",
        "is_used": 1,
        "uploaded_at": "2023-01-01T00:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "valid": false,
        "exists": false,
        "reason": "File not found"
      }
    ],
    "summary": {
      "total": 2,
      "valid": 1,
      "invalid": 1
    }
  }
}
```

### Bulk Mark as Used
Mark multiple files as used to prevent cleanup.

**Endpoint:** `POST /media/bulk-mark-used`
**Authentication:** Service Key Required

**Request Body:**
```json
{
  "fileIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk mark as used completed",
  "data": {
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "success": true,
        "message": "Marked as used"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "success": false,
        "message": "Failed to mark as used"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 1,
      "failed": 1
    }
  }
}
```

### Mark Single File as Used
Mark a single file as used.

**Endpoint:** `POST /media/mark-used/{media_id}`

**Response:**
```json
{
  "success": true,
  "message": "Media marked as used",
  "data": {
    "media_id": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

### Mark Files as Not Used
Mark multiple files as not used (for cleanup).

**Endpoint:** `POST /media/mark-not-used`

**Request Body:**
```json
{
  "ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

---

## Maintenance Endpoints

### Cleanup Temporary Files
Remove temporary files older than 24 hours.

**Endpoint:** `POST /media/cleanup`

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 15 temporary files",
  "data": {
    "deleted_count": 15,
    "total_found": 20
  }
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

#### Upload Errors
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

```json
{
  "success": false,
  "message": "File size exceeds maximum limit (10MB)"
}
```

```json
{
  "success": false,
  "message": "File type not allowed. Supported: jpg, png, gif, pdf, doc"
}
```

#### File Access Errors
```json
{
  "success": false,
  "message": "Invalid media ID format"
}
```

```json
{
  "success": false,
  "message": "Media not found"
}
```

```json
{
  "success": false,
  "message": "File not found on disk"
}
```

#### Service Authentication Errors
```json
{
  "success": false,
  "message": "Invalid or missing service key"
}
```

---

## Data Models

### MediaFile Model
```typescript
interface MediaFile {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  file_extension: string;
  content_type: string;
  upload_type: 'profile' | 'service' | 'temp';
  access_url: string;
  thumbnail_url?: string;
  is_used: 0 | 1;
  uploaded_at: string;
  updated_at: string;
}
```

### Upload Response Model
```typescript
interface UploadResponse {
  id: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  has_thumbnail: boolean;
}
```

---

## File Processing

### Image Processing
- **Automatic Thumbnail Generation**: For image files (JPG, PNG, GIF, WEBP)
- **Thumbnail Size**: Maximum 300x300 pixels, maintains aspect ratio
- **Image Optimization**: JPEG quality set to 85%
- **Format Support**: Preserves original format when possible

### File Storage Structure
```
uploads/
├── profile/          # User profile images
├── service/          # Service-related files
├── temp/            # Temporary files (auto-cleanup)
└── thumbnails/      # Generated thumbnails
```

### File Naming Convention
- **Stored Filename**: `{UUID with underscores}.{extension}`
- **Example**: `550e8400_e29b_41d4_a716_446655440001.jpg`
- **Original Filename**: Preserved in database metadata

---

## Security Features

### File Upload Security
- **File Type Validation**: Strict whitelist of allowed MIME types
- **File Size Limits**: 10MB maximum per file
- **Filename Sanitization**: UUIDs prevent path traversal attacks
- **Content-Type Verification**: Validates actual file content vs. extension

### File Serving Security
- **UUID-based Access**: No direct file path exposure
- **Security Headers**: X-Content-Type-Options, X-Frame-Options
- **MIME Type Detection**: Uses PHP finfo for accurate content types
- **Access Control**: Files served through controlled endpoints only

### Service Authentication
Valid service keys for inter-service communication:
- `admin-secret-key-2024`
- `order-secret-key-2024`
- `customer-secret-key-2024`
- `seller-secret-key-2024`
- `product-secret-key-2024`
- `notification-secret-key-2024`

---

## Performance Features

### Caching
- **Browser Caching**: 24-hour cache headers for served files
- **Content Delivery**: Efficient file streaming
- **Thumbnail Caching**: Pre-generated thumbnails for fast access

### Optimization
- **File Compression**: Automatic image optimization
- **Lazy Loading Support**: Thumbnail endpoints for progressive loading
- **Batch Operations**: Bulk validation and status updates

---

## Business Rules

### File Lifecycle
1. **Upload**: Files uploaded with temporary status
2. **Usage**: Files marked as used when referenced by other services
3. **Cleanup**: Temporary unused files removed after 24 hours
4. **Deletion**: Manual deletion removes both file and metadata

### Upload Types
- **profile**: User profile images, avatars
- **service**: Business logos, banners, service images
- **temp**: Temporary files for processing, auto-cleanup enabled

### File Usage Tracking
- **is_used = 0**: File uploaded but not referenced
- **is_used = 1**: File actively used by other services
- **Cleanup Policy**: Only unused temp files are automatically deleted

---

## Integration Notes

### API Gateway Integration
Files are served through the API Gateway:
- **Direct Access**: `GET /media/{media_id}` (via API Gateway)
- **Thumbnail Access**: `GET /thumb/{media_id}` (via API Gateway)
- **Security**: Gateway handles CORS and additional security headers

### Service Integration
- **Product Service**: Product images and galleries
- **Seller Service**: Business logos and profile images
- **Customer Service**: Profile avatars
- **Admin Service**: System assets and uploaded content

### Database Integration
- **SQLite**: Lightweight database for metadata storage
- **Auto-Schema**: Database tables created automatically
- **ACID Compliance**: Transactional file operations

---

## Monitoring and Health

### Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Media service is healthy",
  "data": {
    "service": "media-service-php",
    "timestamp": "2023-01-01T00:00:00Z",
    "database": "connected"
  }
}
```

### Maintenance Tasks
- **Daily Cleanup**: Remove temporary files older than 24 hours
- **Orphaned File Detection**: Identify files not referenced by any service
- **Storage Monitoring**: Track disk usage and storage capacity

---

## Common Use Cases

### Product Image Upload
1. User uploads product image via frontend
2. Frontend sends file to Media Service
3. Service generates thumbnail and returns UUID
4. Product Service stores UUID reference
5. Images served via API Gateway using UUID

### Profile Picture Update
1. User selects new profile picture
2. Image uploaded to Media Service
3. Previous image marked as unused
4. New image UUID saved to user profile
5. Cleanup service removes old image

### Bulk Image Processing
1. Admin uploads multiple images
2. Service processes each image individually
3. Thumbnails generated for all images
4. Batch validation confirms all uploads
5. Images marked as used when assigned to products