# Notifications Service API Documentation

## Overview
The Notifications Service manages email notifications, templates, and SMTP configuration for the e-commerce platform. It provides template-based email sending with variable substitution, email history tracking, and centralized SMTP management. Built with PHP for reliable email processing.

## Base URL
```
http://localhost:3007/api/v1
```

## Authentication
- **Public Endpoints**: None (all endpoints require service authentication)
- **Service Endpoints**: All endpoints (require service key via headers)

### Headers
```http
Content-Type: application/json
X-Service-Key: <service_secret_key>
```

---

## Email Sending Endpoints

### Send Notification
Send an email using a predefined template with variable substitution.

**Endpoint:** `POST /send`

**Request Body:**
```json
{
  "template": "welcome_customer",
  "recipient_email": "customer@example.com",
  "recipient_name": "John Doe",
  "data": {
    "customer_name": "John Doe",
    "welcome_message": "Welcome to our platform!",
    "login_url": "https://example.com/login",
    "support_email": "support@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "success": true,
    "message": "Email sent successfully"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Template not found"
}
```

### Template Variables
Common template variables available in all templates:
- `{{current_year}}` - Current year (auto-generated)
- `{{current_date}}` - Current date in YYYY-MM-DD format
- `{{current_datetime}}` - Current date and time in YYYY-MM-DD HH:mm:ss format

Custom variables are passed in the `data` object and referenced as `{{variable_name}}` in templates.

---

## Template Management Endpoints

### Get All Templates
Retrieve all email templates.

**Endpoint:** `GET /templates`

**Response:**
```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Welcome Customer",
      "code": "welcome_customer",
      "subject": "Welcome to {{company_name}}!",
      "body_html": "<h1>Welcome {{customer_name}}</h1><p>{{welcome_message}}</p>",
      "body_text": "Welcome {{customer_name}}\n\n{{welcome_message}}",
      "variables": "[\"customer_name\", \"company_name\", \"welcome_message\"]",
      "is_active": 1,
      "created_at": "2023-01-01 00:00:00",
      "updated_at": "2023-01-01 00:00:00"
    }
  ]
}
```

### Create Template
Create a new email template.

**Endpoint:** `POST /templates`

**Request Body:**
```json
{
  "name": "Order Confirmation",
  "code": "order_confirmation",
  "subject": "Order Confirmation - {{order_number}}",
  "body_html": "<h1>Order Confirmed</h1><p>Dear {{customer_name}},</p><p>Your order {{order_number}} has been confirmed.</p><p>Total: ${{total_amount}}</p>",
  "body_text": "Order Confirmed\n\nDear {{customer_name}},\n\nYour order {{order_number}} has been confirmed.\n\nTotal: ${{total_amount}}",
  "variables": ["customer_name", "order_number", "total_amount"],
  "is_active": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    "id": 2,
    "name": "Order Confirmation",
    "code": "order_confirmation",
    "subject": "Order Confirmation - {{order_number}}",
    "body_html": "<h1>Order Confirmed</h1><p>Dear {{customer_name}},</p><p>Your order {{order_number}} has been confirmed.</p><p>Total: ${{total_amount}}</p>",
    "body_text": "Order Confirmed\n\nDear {{customer_name}},\n\nYour order {{order_number}} has been confirmed.\n\nTotal: ${{total_amount}}",
    "variables": "[\"customer_name\", \"order_number\", \"total_amount\"]",
    "is_active": 1,
    "created_at": "2023-01-01 00:00:00"
  }
}
```

### Get Single Template
Retrieve a specific template by ID.

**Endpoint:** `GET /templates/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Template retrieved successfully",
  "data": {
    "id": 1,
    "name": "Welcome Customer",
    "code": "welcome_customer",
    "subject": "Welcome to {{company_name}}!",
    "body_html": "<h1>Welcome {{customer_name}}</h1>",
    "body_text": "Welcome {{customer_name}}",
    "variables": "[\"customer_name\", \"company_name\"]",
    "is_active": 1,
    "created_at": "2023-01-01 00:00:00",
    "updated_at": "2023-01-01 00:00:00"
  }
}
```

### Update Template
Update an existing template.

**Endpoint:** `PUT /templates/{id}`

**Request Body:**
```json
{
  "name": "Updated Welcome Customer",
  "subject": "Welcome to our amazing platform!",
  "body_html": "<h1>Hello {{customer_name}}</h1><p>Welcome to our platform!</p>",
  "is_active": 1
}
```

### Delete Template
Delete a template.

**Endpoint:** `DELETE /templates/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

## SMTP Configuration Endpoints

### Get SMTP Configuration
Retrieve current SMTP settings.

**Endpoint:** `GET /smtp`

**Response:**
```json
{
  "success": true,
  "message": "SMTP config retrieved",
  "data": {
    "id": 1,
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "notifications@example.com",
    "encryption": "tls",
    "from_email": "notifications@example.com",
    "from_name": "E-commerce Platform",
    "is_active": 1,
    "created_at": "2023-01-01 00:00:00",
    "updated_at": "2023-01-01 00:00:00"
  }
}
```

*Note: Password is never returned in responses for security.*

### Update SMTP Configuration
Update SMTP settings.

**Endpoint:** `POST /smtp`

**Request Body:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "notifications@example.com",
  "password": "app-specific-password",
  "encryption": "tls",
  "from_email": "notifications@example.com",
  "from_name": "E-commerce Platform"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMTP configuration updated successfully"
}
```

**SMTP Configuration Fields:**
- `host`: SMTP server hostname
- `port`: SMTP port (typically 587 for TLS, 465 for SSL, 25 for plain)
- `username`: SMTP authentication username
- `password`: SMTP authentication password
- `encryption`: Encryption type ("tls", "ssl", or "none")
- `from_email`: Default sender email address
- `from_name`: Default sender name

---

## Email History Endpoints

### Get Email History
Retrieve sent email history with pagination.

**Endpoint:** `GET /history`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |

**Response:**
```json
{
  "success": true,
  "message": "Email history retrieved",
  "data": {
    "history": [
      {
        "id": 1,
        "template_code": "welcome_customer",
        "recipient_email": "customer@example.com",
        "recipient_name": "John Doe",
        "subject": "Welcome to our platform!",
        "status": "sent",
        "variables": "{\"customer_name\":\"John Doe\",\"company_name\":\"E-commerce Platform\"}",
        "sent_at": "2023-01-01 00:00:00",
        "error_message": null,
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

**Email Status Values:**
- `pending`: Email queued for sending
- `sent`: Email successfully sent
- `failed`: Email sending failed

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Scenarios

#### Template Errors
```json
{
  "success": false,
  "message": "Template not found"
}
```

```json
{
  "success": false,
  "message": "Template code already exists"
}
```

#### SMTP Configuration Errors
```json
{
  "success": false,
  "message": "SMTP configuration not found"
}
```

```json
{
  "success": false,
  "message": "Invalid SMTP settings"
}
```

#### Email Sending Errors
```json
{
  "success": false,
  "message": "Failed to send email via PHP mail()"
}
```

```json
{
  "success": false,
  "message": "SMTP Error: Authentication failed"
}
```

---

## Data Models

### NotificationTemplate Model
```typescript
interface NotificationTemplate {
  id: number;
  name: string;
  code: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string; // JSON array of variable names
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
}
```

### SmtpConfig Model
```typescript
interface SmtpConfig {
  id: number;
  host: string;
  port: number;
  username: string;
  password: string; // Never returned in API responses
  encryption: 'tls' | 'ssl' | 'none';
  from_email: string;
  from_name: string;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
}
```

### EmailHistory Model
```typescript
interface EmailHistory {
  id: number;
  template_code: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string; // JSON object of template variables
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Email Template System

### Template Structure
Templates support both HTML and plain text versions:
- **Subject Line**: Supports variable substitution
- **HTML Body**: Rich HTML content with variables
- **Text Body**: Plain text fallback with variables

### Variable Substitution
Variables are defined using double curly braces: `{{variable_name}}`

**Example Template:**
```html
Subject: Welcome to {{company_name}}, {{customer_name}}!

HTML Body:
<h1>Welcome {{customer_name}}!</h1>
<p>Thank you for joining {{company_name}}.</p>
<p>Your account was created on {{current_date}}.</p>

Text Body:
Welcome {{customer_name}}!

Thank you for joining {{company_name}}.
Your account was created on {{current_date}}.
```

### Built-in Variables
- `{{current_year}}`: Current year
- `{{current_date}}`: Current date (YYYY-MM-DD)
- `{{current_datetime}}`: Current datetime (YYYY-MM-DD HH:mm:ss)

---

## SMTP Integration

### Supported SMTP Providers
- **Gmail**: smtp.gmail.com:587 (TLS)
- **Outlook**: smtp-mail.outlook.com:587 (TLS)
- **AWS SES**: email-smtp.region.amazonaws.com:587 (TLS)
- **SendGrid**: smtp.sendgrid.net:587 (TLS)
- **Custom SMTP**: Any SMTP server

### Authentication Methods
- **Username/Password**: Standard SMTP authentication
- **App Passwords**: For providers requiring app-specific passwords
- **OAuth2**: Future enhancement for modern authentication

### Email Delivery Methods
1. **PHP mail()**: Default fallback method
2. **Socket SMTP**: Direct SMTP connection with full protocol support
3. **Authentication Support**: LOGIN method for authenticated sending

---

## Security Features

### Service Authentication
The service requires authentication via service keys for all endpoints:
- Service keys must be passed in `X-Service-Key` header
- Multiple service keys supported for different microservices
- Keys are validated against a predefined whitelist

### Password Security
- SMTP passwords are stored securely in database
- Passwords are never returned in API responses
- Plain text passwords are only accepted during configuration updates

### Email Security
- HTML email content is processed safely
- Template variables are escaped to prevent injection
- Recipient validation prevents email abuse

---

## Common Email Templates

### Customer Registration
```json
{
  "name": "Customer Welcome Email",
  "code": "welcome_customer",
  "subject": "Welcome to {{company_name}}!",
  "variables": ["customer_name", "company_name", "login_url"]
}
```

### Order Confirmation
```json
{
  "name": "Order Confirmation",
  "code": "order_confirmation", 
  "subject": "Order #{{order_number}} Confirmed",
  "variables": ["customer_name", "order_number", "total_amount", "items"]
}
```

### Password Reset
```json
{
  "name": "Password Reset",
  "code": "password_reset",
  "subject": "Password Reset Request",
  "variables": ["customer_name", "reset_link", "expiry_time"]
}
```

### Seller Account Approval
```json
{
  "name": "Seller Account Approved",
  "code": "seller_approved",
  "subject": "Your seller account has been approved!",
  "variables": ["seller_name", "business_name", "dashboard_url"]
}
```

### Order Status Updates
```json
{
  "name": "Order Shipped",
  "code": "order_shipped",
  "subject": "Your order #{{order_number}} has been shipped",
  "variables": ["customer_name", "order_number", "tracking_number", "carrier"]
}
```

---

## Integration with Other Services

### Customer Service Integration
- Welcome emails for new customers
- Password reset notifications
- Account verification emails
- Profile update confirmations

### Seller Service Integration
- Account approval/rejection emails
- New order notifications to sellers
- Profile update confirmations
- Monthly sales reports

### Orders Service Integration
- Order confirmation emails
- Order status update notifications
- Shipping notifications
- Delivery confirmations

### Admin Service Integration
- System alerts and notifications
- Report generation confirmations
- Account suspension notifications
- Bulk operation results

---

## Performance and Reliability

### Email Delivery
- **Queue Processing**: Emails processed synchronously
- **Retry Logic**: Failed emails logged for manual retry
- **Delivery Tracking**: Full email history with status tracking
- **Error Handling**: Comprehensive error logging and reporting

### Template Caching
- Templates loaded from database on each request
- Consider implementing template caching for high-volume usage
- Template validation ensures required variables are present

### SMTP Connection Management
- **Connection Pooling**: New connection per email (stateless)
- **Timeout Handling**: 30-second timeout for SMTP operations
- **Fallback Methods**: PHP mail() fallback if SMTP fails
- **TLS/SSL Support**: Secure email transmission

---

## Monitoring and Maintenance

### Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Notification service is healthy",
  "data": {
    "service": "notification-service",
    "timestamp": "2023-01-01T00:00:00Z",
    "database": "connected"
  }
}
```

### Email Analytics
- **Sent Count**: Total emails sent per template
- **Success Rate**: Delivery success percentage
- **Error Tracking**: Failed email analysis
- **Template Usage**: Most used templates reporting

### Maintenance Tasks
- **Log Cleanup**: Regular cleanup of old email history
- **Template Optimization**: Review and optimize frequently used templates
- **SMTP Health**: Regular SMTP configuration testing
- **Database Maintenance**: Index optimization for email history queries

---

## Error Handling and Logging

### Email Sending Errors
All email sending attempts are logged with detailed information:
- **Template Used**: Template code and version
- **Recipient Information**: Email and name (anonymized in logs)
- **Variables**: Template variables used
- **Timestamp**: Exact send time
- **Status**: Success/failure with detailed error messages
- **SMTP Response**: Full SMTP server response for debugging

### Common Issues and Solutions
1. **SMTP Authentication Failures**
   - Verify username/password
   - Check if app-specific passwords are required
   - Ensure SMTP server allows connections

2. **Template Variable Errors**
   - Validate all required variables are provided
   - Check for typos in variable names
   - Ensure JSON formatting is correct

3. **Email Delivery Issues**
   - Check recipient email format validation
   - Verify SMTP server reachability
   - Review DNS settings for SMTP host

---

## Rate Limiting and Quotas

### Email Sending Limits
- **Per Service**: No built-in rate limiting (rely on SMTP provider limits)
- **SMTP Provider Limits**: Respect provider-specific sending limits
- **Batch Processing**: Support for bulk email operations (future enhancement)

### Recommended Quotas
- **Gmail**: 500 emails per day for standard accounts
- **Business Email**: Varies by provider (typically 1000-10000 per day)
- **Dedicated SMTP**: Custom limits based on service plan

---

## Future Enhancements

### Planned Features
1. **Email Templates UI**: Web interface for template management
2. **Email Analytics Dashboard**: Detailed reporting and analytics
3. **Webhook Support**: Real-time delivery status callbacks
4. **Email Scheduling**: Delayed email sending capabilities
5. **A/B Testing**: Template version testing and optimization
6. **Attachments**: File attachment support for emails
7. **Bounce Handling**: Automatic bounce detection and processing
8. **Unsubscribe Management**: Built-in unsubscribe handling