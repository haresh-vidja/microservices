# Media Service - Core PHP with PostgreSQL

A robust media file management service built with Core PHP and PostgreSQL, featuring file uploads, thumbnail generation, and automatic cleanup of temporary files.

## Features

- **File Upload**: Support for images (JPEG, PNG, GIF, WebP), PDFs, and CSV files
- **Thumbnail Generation**: Automatic 200x200px thumbnails for images
- **PostgreSQL Database**: UUID-based primary keys with comprehensive metadata storage
- **Automatic Cleanup**: Temporary files older than 4 hours are automatically deleted
- **RESTful API**: Clean API endpoints for all operations
- **Security**: File type validation, size limits, and secure file handling

## Requirements

- PHP 7.4+
- PostgreSQL 12+
- GD Extension (for image processing)
- Apache/Nginx with URL rewriting

## Database Schema

```sql
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    upload_type VARCHAR(20) NOT NULL DEFAULT 'temp',
    access_url TEXT NOT NULL,
    thumbnail_url TEXT NULL,
    is_used INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Upload File
```
POST /api/v1/media/upload
Content-Type: multipart/form-data

Parameters:
- file: The file to upload
- type: Upload type (profile, service, temp) - optional, defaults to 'temp'

Response:
{
    "success": true,
    "message": "File uploaded successfully",
    "data": {
        "id": "uuid-here",
        "file_type": "image|document|csv",
        "original_filename": "example.jpg",
        "file_size": 1024000,
        "content_type": "image/jpeg",
        "access_url": "http://localhost:3003/uploads/temp/uuid.jpg",
        "thumbnail_url": "http://localhost:3003/uploads/thumbnails/thumb_uuid.jpg"
    }
}
```

### Mark Files as Used
```
POST /api/v1/media/mark-used
Content-Type: application/json

Body:
{
    "ids": ["uuid1", "uuid2", "uuid3"]
}

Response:
{
    "success": true,
    "message": "Successfully marked 3 files as used",
    "data": {
        "updated_count": 3,
        "ids": ["uuid1", "uuid2", "uuid3"]
    }
}
```

### Get File Information
```
GET /api/v1/media/{file-id}

Response:
{
    "success": true,
    "message": "File retrieved successfully",
    "data": {
        "id": "uuid-here",
        "original_filename": "example.jpg",
        "stored_filename": "uuid.jpg",
        "file_size": 1024000,
        "file_extension": "jpg",
        "content_type": "image/jpeg",
        "upload_type": "temp",
        "access_url": "http://localhost:3003/uploads/temp/uuid.jpg",
        "thumbnail_url": "http://localhost:3003/uploads/thumbnails/thumb_uuid.jpg",
        "is_used": 0,
        "uploaded_at": "2023-01-01 10:00:00",
        "updated_at": "2023-01-01 10:00:00"
    }
}
```

### List Files
```
GET /api/v1/media?page=1&limit=10&type=profile

Response:
{
    "success": true,
    "message": "Files retrieved successfully",
    "data": {
        "files": [...],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 25,
            "pages": 3
        }
    }
}
```

### Delete File
```
DELETE /api/v1/media/{file-id}

Response:
{
    "success": true,
    "message": "File deleted successfully"
}
```

### Cleanup Temporary Files
```
POST /api/v1/media/cleanup

Response:
{
    "success": true,
    "message": "Cleaned up 5 temporary files",
    "data": {
        "deleted_count": 5,
        "total_found": 5
    }
}
```

### Health Check
```
GET /health

Response:
{
    "success": true,
    "message": "Media service is healthy",
    "data": {
        "service": "media-service-php",
        "timestamp": "2023-01-01T10:00:00+00:00",
        "database": "connected"
    }
}
```

## Configuration

### Database Connection
Edit `config/database.php`:
```php
private $host = 'localhost';
private $port = '5432';
private $db_name = 'media_db';
private $username = 'postgres';
private $password = 'password';
```

### File Upload Settings
- Max file size: 5MB
- Allowed types: Images (JPEG, PNG, GIF, WebP), PDF, CSV
- Upload directories: `profile/`, `service/`, `temp/`
- Thumbnail directory: `thumbnails/`

## Installation

1. **Setup Database**:
```sql
CREATE DATABASE media_db;
CREATE USER media_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE media_db TO media_user;
```

2. **Configure PHP**:
- Ensure GD extension is installed
- Set appropriate upload limits in `php.ini`

3. **Setup Apache/Nginx**:
- Point document root to the media service directory
- Ensure URL rewriting is enabled
- Use the provided `.htaccess` for Apache

4. **Set Permissions**:
```bash
chmod -R 755 uploads/
chown -R www-data:www-data uploads/
```

5. **Setup Cron Job** (for automatic cleanup):
```bash
# Add to crontab (runs every hour)
0 * * * * /usr/bin/php /path/to/media/cleanup.php
```

## Directory Structure

```
media/
├── config/
│   └── database.php          # Database configuration
├── controllers/
│   └── MediaController.php   # Main API controller
├── models/
│   └── MediaFile.php        # Database model
├── utils/
│   └── FileHandler.php      # File handling utilities
├── uploads/
│   ├── profile/             # Profile images
│   ├── service/             # Service-related files
│   ├── temp/               # Temporary files
│   └── thumbnails/         # Generated thumbnails
├── logs/                   # Cleanup logs
├── index.php              # Main entry point
├── cleanup.php            # Cleanup script
├── .htaccess             # Apache configuration
└── README.md
```

## Security Features

- File type validation using MIME type detection
- File size limits (5MB)
- UUID-based filenames to prevent guessing
- SQL injection protection with prepared statements
- XSS protection through input sanitization
- Secure file serving with proper headers
- Upload directories protected from PHP execution

## Error Handling

The service includes comprehensive error handling:
- Invalid file types
- File size exceeded
- Database connection issues
- File system errors
- Invalid UUID formats
- Missing files

## Development

Run locally on port 3003:
```bash
php -S localhost:3003 -t /path/to/media/
```

Or configure with Apache/Nginx virtual host.

## Author

Haresh Vidja  
Email: hareshvidja@gmail.com