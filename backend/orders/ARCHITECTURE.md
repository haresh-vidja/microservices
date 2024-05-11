# Orders Service Architecture

## Service Overview
The Orders Service manages shopping cart operations, order processing, inventory reservations, and order fulfillment. It integrates with multiple services to provide a complete order management solution.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Orders Service :3005"
        subgraph "API Layer"
            CART_ROUTES[Cart Routes<br/>/api/v1/cart/*]
            ORDER_ROUTES[Order Routes<br/>/api/v1/orders/*]
            ADMIN_ORDER_ROUTES[Admin Routes<br/>/api/v1/admin/orders/*]
            INVENTORY_ROUTES[Inventory Routes<br/>/api/v1/inventory/*]
        end

        subgraph "Middleware"
            CUSTOMER_AUTH[Customer JWT Auth]
            ADMIN_AUTH[Admin/Service Auth]
            ORDER_VALIDATION[Order Validation]
        end

        subgraph "Business Logic"
            CART_SERVICE[Cart Management Service]
            ORDER_SERVICE[Order Processing Service]
            INVENTORY_SERVICE[Inventory Service]
            NOTIFICATION_SERVICE[Order Notifications]
        end

        subgraph "Data Models"
            CART_MODEL[Cart Model<br/>- Customer ID<br/>- Items<br/>- Totals<br/>- Timestamps]
            ORDER_MODEL[Order Model<br/>- Customer Info<br/>- Items<br/>- Shipping<br/>- Payment<br/>- Status Tracking]
            INVENTORY_MODEL[Inventory Model<br/>- Reservations<br/>- Confirmations<br/>- Releases]
        end

        subgraph "External Integrations"
            CUSTOMER_VERIFY[Customer Verification<br/>via Customer Service]
            PRODUCT_INVENTORY[Product Inventory<br/>via Products Service]
            ORDER_EMAILS[Order Emails<br/>via Notifications Service]
            PAYMENT_GATEWAY[Payment Processing<br/>External Gateway]
        end
    end

    subgraph "Database"
        ORDERS_DB[(Orders Database<br/>MongoDB<br/>Collections:<br/>- carts<br/>- orders<br/>- inventory_reservations)]
    end

    CART_ROUTES --> CUSTOMER_AUTH
    ORDER_ROUTES --> CUSTOMER_AUTH
    ADMIN_ORDER_ROUTES --> ADMIN_AUTH
    INVENTORY_ROUTES --> ADMIN_AUTH

    CUSTOMER_AUTH --> ORDER_VALIDATION
    ORDER_VALIDATION --> CART_SERVICE
    ORDER_VALIDATION --> ORDER_SERVICE
    ADMIN_AUTH --> ORDER_SERVICE
    ADMIN_AUTH --> INVENTORY_SERVICE

    CART_SERVICE --> CART_MODEL
    ORDER_SERVICE --> ORDER_MODEL
    INVENTORY_SERVICE --> INVENTORY_MODEL
    ORDER_SERVICE --> NOTIFICATION_SERVICE

    CART_MODEL --> ORDERS_DB
    ORDER_MODEL --> ORDERS_DB
    INVENTORY_MODEL --> ORDERS_DB

    ORDER_SERVICE -.->|Verify Customer| CUSTOMER_VERIFY
    CART_SERVICE -.->|Check Stock| PRODUCT_INVENTORY
    INVENTORY_SERVICE -.->|Reserve Stock| PRODUCT_INVENTORY
    NOTIFICATION_SERVICE -.->|Order Confirmation| ORDER_EMAILS
    ORDER_SERVICE -.->|Process Payment| PAYMENT_GATEWAY
```

## Component Responsibilities

### API Layer
- **Cart Routes**: Shopping cart CRUD operations, item management
- **Order Routes**: Order placement, tracking, cancellation, history
- **Admin Order Routes**: Order management, status updates, bulk operations
- **Inventory Routes**: Stock reservations, confirmations, releases

### Middleware
- **Customer Authentication**: JWT validation for customer operations
- **Admin Authentication**: Service key validation for admin/service operations
- **Order Validation**: Business rule enforcement and data validation

### Business Logic
- **Cart Service**: Shopping cart management, item calculations
- **Order Service**: Order processing, status management, payments
- **Inventory Service**: Stock reservations and inventory coordination
- **Notification Service**: Order-related email notifications

## Order Processing Workflow

```mermaid
graph TD
    START[Customer Adds Items to Cart]
    
    CART_VALIDATE[Validate Cart Items<br/>Check Stock Availability]
    CUSTOMER_AUTH_CHECK[Verify Customer Authentication]
    ADDRESS_SELECT[Select Shipping Address]
    PAYMENT_METHOD[Choose Payment Method]
    
    INVENTORY_RESERVE[Reserve Inventory<br/>30-minute hold]
    ORDER_CREATE[Create Order Record<br/>Pending Status]
    PAYMENT_PROCESS[Process Payment]
    
    PAYMENT_SUCCESS{Payment Successful?}
    ORDER_CONFIRM[Confirm Order<br/>Convert Reservations]
    INVENTORY_RELEASE[Release Reserved Inventory]
    
    NOTIFY_CUSTOMER[Send Order Confirmation]
    NOTIFY_SELLERS[Notify Sellers]
    UPDATE_ANALYTICS[Update Sales Analytics]
    
    ORDER_CANCELLED[Order Cancelled]
    ORDER_CONFIRMED[Order Confirmed]

    START --> CART_VALIDATE
    CART_VALIDATE --> CUSTOMER_AUTH_CHECK
    CUSTOMER_AUTH_CHECK --> ADDRESS_SELECT
    ADDRESS_SELECT --> PAYMENT_METHOD
    PAYMENT_METHOD --> INVENTORY_RESERVE
    INVENTORY_RESERVE --> ORDER_CREATE
    ORDER_CREATE --> PAYMENT_PROCESS
    PAYMENT_PROCESS --> PAYMENT_SUCCESS
    
    PAYMENT_SUCCESS -->|Yes| ORDER_CONFIRM
    PAYMENT_SUCCESS -->|No| INVENTORY_RELEASE
    
    ORDER_CONFIRM --> NOTIFY_CUSTOMER
    NOTIFY_CUSTOMER --> NOTIFY_SELLERS
    NOTIFY_SELLERS --> UPDATE_ANALYTICS
    UPDATE_ANALYTICS --> ORDER_CONFIRMED
    
    INVENTORY_RELEASE --> ORDER_CANCELLED
```

## Data Flow Patterns

### Cart Management Flow
1. **Add to Cart** → Authentication → Product validation → Stock check
2. **Stock Verification** → Products service API → Availability confirmation
3. **Cart Update** → Item addition/update → Total recalculation
4. **Persistence** → Database update → Response to client
5. **Real-time Sync** → Cart state synchronization across sessions

### Order Placement Flow
1. **Cart Validation** → Items exist → Stock available → Customer authenticated
2. **Address Verification** → Customer service → Valid shipping address
3. **Inventory Reservation** → Products service → 30-minute stock hold
4. **Order Creation** → Database record → Unique order number generation
5. **Payment Processing** → External gateway → Transaction handling
6. **Order Confirmation** → Reservation conversion → Stock update
7. **Notifications** → Customer confirmation → Seller notifications
8. **Analytics Update** → Sales metrics → Revenue tracking

### Multi-Seller Order Processing
1. **Order Splitting** → Group items by seller → Individual seller orders
2. **Seller Notification** → Each seller notified → Individual order details
3. **Fulfillment Tracking** → Per-seller status → Overall order status
4. **Shipping Coordination** → Multiple shipments → Tracking consolidation
5. **Status Aggregation** → Individual statuses → Overall order status

## Database Schema

### Cart Collection
```javascript
{
  _id: ObjectId,
  customerId: String,
  items: [{
    productId: String,
    sellerId: String,
    productName: String,
    productImage: String,
    quantity: Number,
    price: Number,
    totalPrice: Number,
    availableStock: Number,
    addedAt: Date
  }],
  totalItems: Number,
  totalAmount: Number,
  currency: String,
  lastUpdated: Date,
  createdAt: Date,
  expiresAt: Date // Auto-cleanup after 30 days
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  customerId: String,
  customerName: String,
  customerEmail: String,
  items: [{
    productId: String,
    sellerId: String,
    productName: String,
    productImage: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    status: String, // 'reserved', 'confirmed', 'cancelled', 'fulfilled'
    reservedAt: Date,
    confirmedAt: Date
  }],
  
  // Order totals
  subtotal: Number,
  tax: Number,
  shippingFee: Number,
  discount: Number,
  totalAmount: Number,
  currency: String,
  
  // Shipping information
  shippingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    contactName: String,
    contactPhone: String
  },
  
  // Order status and tracking
  status: String, // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  paymentMethod: String, // 'cod', 'online', 'wallet'
  paymentStatus: String, // 'pending', 'paid', 'failed', 'refunded'
  
  // Multi-seller tracking
  sellerStatuses: [{
    sellerId: String,
    status: String,
    updatedAt: Date,
    notes: String,
    trackingNumber: String,
    estimatedDelivery: Date
  }],
  
  // Timestamps
  placedAt: Date,
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Additional information
  notes: String,
  cancelReason: String,
  refundAmount: Number,
  
  // Inventory management
  reservationExpiry: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Inventory Reservations Collection
```javascript
{
  _id: ObjectId,
  orderId: String,
  customerId: String,
  reservations: [{
    productId: String,
    sellerId: String,
    quantity: Number,
    unitPrice: Number,
    reservedAt: Date,
    expiresAt: Date,
    status: String // 'active', 'confirmed', 'expired', 'cancelled'
  }],
  totalItems: Number,
  totalValue: Number,
  status: String, // 'active', 'confirmed', 'expired', 'cancelled'
  createdAt: Date,
  updatedAt: Date
}
```

## Advanced Features

### Inventory Reservation System
- **Temporary Holds**: 30-minute inventory reservations
- **Automatic Expiration**: Auto-release expired reservations
- **Conflict Resolution**: Handle concurrent reservation requests
- **Stock Synchronization**: Real-time stock level coordination
- **Reservation Analytics**: Track reservation conversion rates

### Multi-Seller Order Management
- **Order Splitting**: Automatic seller-based order segmentation
- **Individual Tracking**: Per-seller status and tracking
- **Consolidated View**: Customer-facing unified order status
- **Seller Notifications**: Targeted seller order alerts
- **Shipping Coordination**: Multiple shipment management

### Payment Integration
- **Multiple Payment Methods**: COD, online payments, wallet
- **Payment Gateway Integration**: External payment processor
- **Transaction Tracking**: Payment status monitoring
- **Refund Processing**: Automated refund handling
- **Payment Analytics**: Revenue and payment method analysis

## External Integrations

### Customer Service Integration
- **Customer Verification**: Valid customer account checks
- **Address Validation**: Shipping address verification
- **Customer Profile**: Order history and preferences
- **Loyalty Points**: Points earning and redemption

### Products Service Integration
- **Inventory Checks**: Real-time stock availability
- **Product Information**: Current pricing and details
- **Stock Reservations**: Temporary inventory holds
- **Sales Recording**: Revenue and unit tracking

### Notifications Service Integration
- **Order Confirmations**: Customer order confirmation emails
- **Seller Notifications**: New order alerts to sellers
- **Status Updates**: Order status change notifications
- **Shipping Notifications**: Tracking and delivery updates

### Payment Gateway Integration
- **Transaction Processing**: Secure payment handling
- **Payment Verification**: Transaction status validation
- **Refund Processing**: Automated refund handling
- **Payment Analytics**: Transaction reporting and analysis

## Performance Optimization

### Database Optimization
- **Indexing Strategy**: Order number, customer, seller, and date indexes
- **Query Optimization**: Efficient order lookup and filtering
- **Aggregation Pipelines**: Order analytics and reporting
- **Connection Pooling**: Database connection management

### Inventory Management Performance
- **Reservation Batching**: Bulk reservation operations
- **Cache Integration**: Frequently accessed inventory data
- **Async Processing**: Non-blocking inventory operations
- **Conflict Resolution**: Optimistic locking for concurrent updates

### Order Processing Performance
- **Parallel Processing**: Concurrent order validation steps
- **Caching Strategy**: Cart and order data caching
- **Background Jobs**: Async notification and analytics updates
- **Load Balancing**: Distributed order processing

## Security and Compliance

### Transaction Security
- **Payment Card Industry (PCI)**: Secure payment handling
- **Data Encryption**: Sensitive order data protection
- **Audit Logging**: Complete order operation tracking
- **Access Control**: Customer and admin access restrictions

### Business Rules Enforcement
- **Order Validation**: Comprehensive order data validation
- **Inventory Constraints**: Stock availability enforcement
- **Customer Verification**: Valid customer account requirements
- **Seller Verification**: Active seller status validation

## Monitoring and Analytics

### Order Metrics
- **Conversion Rates**: Cart to order conversion tracking
- **Average Order Value**: Revenue per order analysis
- **Order Fulfillment**: Processing and delivery time metrics
- **Cancellation Rates**: Order cancellation analysis

### Inventory Metrics
- **Reservation Efficiency**: Reservation to conversion rates
- **Stock Turnover**: Inventory movement analysis
- **Out-of-Stock Events**: Stock shortage tracking
- **Reservation Conflicts**: Concurrent access metrics

### Performance Monitoring
- **API Response Times**: Order processing performance
- **Database Performance**: Query execution metrics
- **External Service Integration**: Third-party service health
- **Error Rates**: Failed operation tracking