/**
 * Products Service Entry Point
 * Simple products catalog service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products_db';

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => {
  console.log('Products DB connected');
}).catch((err) => {
  console.error('Products DB connection error:', err);
});

// Simple Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  images: [{
    url: String,
    isPrimary: { type: Boolean, default: false }
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  specifications: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  versionKey: false
});

const Product = mongoose.model('Product', productSchema);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'products-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get all products
app.get('/api/v1/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sellerId, search } = req.query;
    
    let query = { isActive: true };
    
    if (category) query.category = new RegExp(category, 'i');
    if (sellerId) query.sellerId = sellerId;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort('-createdAt');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single product
app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create product
app.post('/api/v1/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update product
app.put('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete product
app.delete('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Inter-service communication middleware
const verifyServiceKey = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  
  const validKeys = [
    process.env.ADMIN_SERVICE_KEY || 'admin-secret-key-2024',
    process.env.ORDER_SERVICE_KEY || 'order-secret-key-2024',
    process.env.CUSTOMER_SERVICE_KEY || 'customer-secret-key-2024',
    process.env.SELLER_SERVICE_KEY || 'seller-secret-key-2024',
    process.env.MEDIA_SERVICE_KEY || 'media-secret-key-2024',
    process.env.NOTIFICATION_SERVICE_KEY || 'notification-secret-key-2024'
  ];
  
  if (!serviceKey || !validKeys.includes(serviceKey)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing service key'
    });
  }
  
  next();
};

// Bulk products retrieval (for order service)
app.post('/api/v1/service/products/bulk', verifyServiceKey, async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'productIds array is required'
      });
    }
    
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).select('_id name price stock sellerId images category');
    
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      sellerId: product.sellerId,
      primaryImage: product.images.find(img => img.isPrimary)?.url || product.images[0]?.url,
      category: product.category
    }));
    
    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check inventory availability
app.post('/api/v1/service/products/inventory-check', verifyServiceKey, async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'items array is required'
      });
    }
    
    const productIds = items.map(item => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).select('_id name stock');
    
    const availability = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      
      if (!product) {
        return {
          productId: item.productId,
          available: false,
          reason: 'Product not found',
          requestedQuantity: item.quantity,
          availableStock: 0
        };
      }
      
      const available = product.stock >= item.quantity;
      
      return {
        productId: item.productId,
        productName: product.name,
        available,
        reason: available ? 'Available' : 'Insufficient stock',
        requestedQuantity: item.quantity,
        availableStock: product.stock
      };
    });
    
    const allAvailable = availability.every(item => item.available);
    
    res.json({
      success: true,
      data: {
        allAvailable,
        items: availability,
        summary: {
          total: items.length,
          available: availability.filter(item => item.available).length,
          unavailable: availability.filter(item => !item.available).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update stock (for inventory management)
app.put('/api/v1/service/products/stock', verifyServiceKey, async (req, res) => {
  try {
    const { updates } = req.body; // [{ productId, stockChange }]
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'updates array is required'
      });
    }
    
    const results = [];
    
    for (const update of updates) {
      try {
        const product = await Product.findById(update.productId);
        
        if (!product) {
          results.push({
            productId: update.productId,
            success: false,
            message: 'Product not found'
          });
          continue;
        }
        
        const newStock = product.stock + update.stockChange;
        
        if (newStock < 0) {
          results.push({
            productId: update.productId,
            success: false,
            message: 'Insufficient stock for reduction'
          });
          continue;
        }
        
        product.stock = newStock;
        await product.save();
        
        results.push({
          productId: update.productId,
          success: true,
          previousStock: product.stock - update.stockChange,
          newStock: newStock,
          stockChange: update.stockChange
        });
      } catch (error) {
        results.push({
          productId: update.productId,
          success: false,
          message: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Validate seller for product
app.post('/api/v1/service/products/validate-seller', verifyServiceKey, async (req, res) => {
  try {
    const { productId, sellerId } = req.body;
    
    if (!productId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: 'productId and sellerId are required'
      });
    }
    
    const product = await Product.findById(productId).select('sellerId');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const isValid = product.sellerId === sellerId;
    
    res.json({
      success: true,
      data: {
        productId,
        sellerId,
        isValid,
        actualSellerId: product.sellerId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Products Service running on http://localhost:${PORT}`);
});